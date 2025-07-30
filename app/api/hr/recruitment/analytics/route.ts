import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { subMonths, startOfMonth, endOfMonth, format, addMonths } from 'date-fns';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/hr/recruitment/analytics - Get recruitment analytics
export async function GET(request: NextRequest) {
  try {
    // Authentication
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload?.email) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    // Get user's company
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      select: { companyId: true }
    });

    if (!user?.companyId) {
      return new NextResponse('Company not found', { status: 404 });
    }

    const companyId = user.companyId;
    const now = new Date();
    const sixMonthsAgo = subMonths(now, 6);

    // Calculate date ranges
    const period = {
      startDate: sixMonthsAgo,
      endDate: now,
      days: Math.ceil((now.getTime() - sixMonthsAgo.getTime()) / (1000 * 60 * 60 * 24))
    };

    // Fetch all data in parallel
    const [
      jobPostings,
      candidates,
      applications,
      interviews,
      offers,
      backgroundChecks,
      onboardingWorkflows,
      departments
    ] = await Promise.all([
      // Job postings
      prisma.jobPosting.count({
        where: {
          companyId,
          createdAt: { gte: period.startDate, lte: period.endDate }
        }
      }),

      // Candidates
      prisma.candidate.count({
        where: { companyId }
      }),

      // Applications with status
      prisma.jobApplication.findMany({
        where: {
          companyId,
          appliedAt: { gte: period.startDate, lte: period.endDate }
        },
        select: { status: true, appliedAt: true, jobPosting: { select: { departmentId: true } } }
      }),

      // Interviews
      prisma.interview.findMany({
        where: {
          companyId,
          scheduledAt: { gte: period.startDate, lte: period.endDate }
        },
        select: { status: true, scheduledAt: true, candidate: { select: { applications: { select: { jobPosting: { select: { departmentId: true } } } } } } }
      }),

      // Offers
      prisma.offer.findMany({
        where: {
          companyId,
          createdAt: { gte: period.startDate, lte: period.endDate }
        },
        select: { status: true, respondedAt: true, jobPosting: { select: { departmentId: true } } }
      }),

      // Background checks
      prisma.backgroundCheck.findMany({
        where: { companyId },
        select: { status: true, result: true }
      }),

      // Onboarding workflows
      prisma.onboardingWorkflow.findMany({
        where: { companyId },
        select: { isActive: true, estimatedDays: true, name: true }
      }),

      // Departments for department stats
      prisma.department.findMany({
        where: { companyId },
        select: { id: true, name: true }
      })
    ]);

    // Calculate summary
    const totalApplications = applications.length;
    const totalInterviews = interviews.length;
    const totalOffers = offers.length;
    const totalHires = offers.filter(o => o.status === 'accepted').length;
    
    const interviewSuccessRate = totalInterviews > 0 
      ? Math.round((totalOffers / totalInterviews) * 100 * 10) / 10 
      : 0;

    const offerAcceptanceRate = totalOffers > 0
      ? Math.round((totalHires / totalOffers) * 100 * 10) / 10
      : 0;

    // Calculate distributions
    const applicationsByStatus = applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const candidatesBySource = await prisma.candidate.groupBy({
      by: ['source'],
      where: { companyId },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    }).then(results =>
      results.reduce((acc, { source, _count }) => ({
        ...acc,
        [source || 'Other']: _count?.id || 0
      }), {})
    );

    // Calculate conversion funnel
    const conversionFunnel = {
      applications: totalApplications,
      screenings: applications.filter(a => a.status === 'screening').length,
      interviews: totalInterviews,
      offers: totalOffers,
      hires: totalHires
    };

    // Calculate department stats
    const departmentStats = await Promise.all(departments.map(async dept => {
      const deptApplications = applications.filter(a => 
        a.jobPosting?.departmentId === dept.id
      ).length;
      
      const deptHires = offers.filter(o =>
        o.status === 'accepted' && o.jobPosting?.departmentId === dept.id
      ).length;

      return {
        department: dept.name,
        applications: deptApplications,
        hires: deptHires,
        conversionRate: deptApplications > 0 
          ? Math.round((deptHires / deptApplications) * 100 * 10) / 10 
          : 0
      };
    }));

    // Calculate monthly trends
    const months = [];
    let currentMonth = startOfMonth(sixMonthsAgo);
    const endMonth = endOfMonth(now);

    while (currentMonth <= endMonth) {
      months.push(currentMonth);
      currentMonth = addMonths(currentMonth, 1);
    }

    const monthlyTrends = months.map((month: Date) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const monthKey = format(month, 'MMM yyyy');
      
      const monthApplications = applications.filter(a => 
        a.appliedAt >= monthStart && a.appliedAt <= monthEnd
      ).length;
      
      const monthHires = offers.filter(o =>
        o.status === 'accepted' &&
        o.respondedAt &&
        o.respondedAt >= monthStart &&
        o.respondedAt <= monthEnd
      ).length;

      return {
        month: monthKey,
        applications: monthApplications,
        hires: monthHires,
        conversionRate: monthApplications > 0 
          ? Math.round((monthHires / monthApplications) * 100 * 10) / 10 
          : 0
      };
    });

    // Background check stats
    const backgroundCheckStats = {
      total: backgroundChecks.length,
      completed: backgroundChecks.filter(bc => bc.status === 'completed').length,
      clear: backgroundChecks.filter(bc => bc.result === 'clear').length,
      flagged: backgroundChecks.filter(bc => bc.result === 'flagged').length,
      failed: backgroundChecks.filter(bc => bc.status === 'failed').length
    };

    // Onboarding stats
    const onboardingStats = {
      total: onboardingWorkflows.length,
      active: onboardingWorkflows.filter(ow => ow.isActive).length,
      inactive: onboardingWorkflows.filter(ow => !ow.isActive).length,
      averageEstimatedDays: onboardingWorkflows.length > 0
        ? Math.round(onboardingWorkflows.reduce((sum, ow) => sum + (ow.estimatedDays || 0), 0) / onboardingWorkflows.length * 10) / 10
        : 0
    };

    // Compile final response
    const analytics = {
      summary: {
        totalJobPostings: jobPostings,
        totalApplications: totalApplications,
        totalCandidates: candidates,
        totalInterviews,
        totalOffers,
        interviewSuccessRate,
        offerAcceptanceRate,
        averageTimeToHire: 0, // Would require tracking application to hire timeline
      },
      distributions: {
        applicationsByStatus,
        candidatesBySource
      },
      conversionFunnel,
      departmentStats: departmentStats.reduce((acc, { department, ...rest }) => ({
        ...acc,
        [department]: rest
      }), {}),
      monthlyTrends,
      backgroundCheckStats,
      onboardingStats,
      period: {
        days: period.days,
        startDate: period.startDate.toISOString(),
        endDate: period.endDate.toISOString()
      }
    };

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Error fetching recruitment analytics:', error);
    return new NextResponse('Failed to fetch recruitment analytics', { status: 500 });
  }
}
