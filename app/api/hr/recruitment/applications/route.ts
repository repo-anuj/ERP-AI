import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';


export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// GET /api/hr/recruitment/applications - Get all job applications
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload?.email) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user to find companyId
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      select: { companyId: true }
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: 'Company not found' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const stage = searchParams.get('stage');
    const jobPostingId = searchParams.get('jobPostingId');
    const candidateId = searchParams.get('candidateId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'appliedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build filter conditions
    const where: any = {
      companyId: user.companyId,
    };

    if (status) {
      where.status = status;
    }

    if (stage) {
      where.stage = stage;
    }

    if (jobPostingId) {
      where.jobPostingId = jobPostingId;
    }

    if (candidateId) {
      where.candidateId = candidateId;
    }

    if (search) {
      where.OR = [
        {
          candidate: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ]
          }
        },
        {
          jobPosting: {
            title: { contains: search, mode: 'insensitive' }
          }
        }
      ];
    }

    // Get total count for pagination
    const totalCount = await prisma.jobApplication.count({ where });

    // Get applications with relations
    const applications = await prisma.jobApplication.findMany({
      where,
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            currentCompany: true,
            currentPosition: true,
            totalExperience: true,
            expectedSalary: true,
            resumeUrl: true,
            status: true,
            overallRating: true,
          }
        },
        jobPosting: {
          select: {
            id: true,
            title: true,
            department: {
              select: { id: true, name: true }
            },
            location: {
              select: { id: true, name: true, city: true }
            },
            status: true,
          }
        },
        interviews: {
          include: {
            interviewers: {
              select: {
                interviewerName: true,
                role: true,
                rating: true,
                recommendation: true,
              }
            }
          },
          orderBy: { scheduledAt: 'desc' }
        },
        evaluations: {
          select: {
            id: true,
            evaluationType: true,
            overallScore: true,
            recommendation: true,
            evaluatorName: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calculate application statistics
    const applicationsWithStats = applications.map(application => ({
      ...application,
      stats: {
        totalInterviews: application.interviews.length,
        totalEvaluations: application.evaluations.length,
        latestInterview: application.interviews[0] || null,
        latestEvaluation: application.evaluations[0] || null,
        averageRating: application.evaluations.length > 0
          ? application.evaluations.reduce((sum, evaluation) => sum + (evaluation.overallScore || 0), 0) / application.evaluations.length
          : null,
      }
    }));

    return NextResponse.json({
      applications: applicationsWithStats,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      }
    });

  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

// POST /api/hr/recruitment/applications - Create new job application
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload?.email) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user to find companyId
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      select: { companyId: true }
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: 'Company not found' }, { status: 401 });
    }



    const body = await request.json();
    const {
      jobPostingId,
      candidateId,
      source,
      coverLetter,
      customAnswers,
      screeningScore,
      screeningNotes,
    } = body;

    // Validate required fields
    if (!jobPostingId || !candidateId) {
      return NextResponse.json(
        { error: 'Missing required fields: jobPostingId, candidateId' },
        { status: 400 }
      );
    }

    // Check if job posting exists and belongs to company
    const jobPosting = await prisma.jobPosting.findFirst({
      where: {
        id: jobPostingId,
        companyId: user.companyId,
      }
    });

    if (!jobPosting) {
      return NextResponse.json(
        { error: 'Job posting not found' },
        { status: 404 }
      );
    }

    // Check if candidate exists and belongs to company
    const candidate = await prisma.candidate.findFirst({
      where: {
        id: candidateId,
        companyId: user.companyId,
      }
    });

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    // Check if application already exists
    const existingApplication = await prisma.jobApplication.findFirst({
      where: {
        jobPostingId,
        candidateId,
      }
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: 'Application already exists for this candidate and job posting' },
        { status: 400 }
      );
    }

    // Check if job posting has reached max applications
    if (jobPosting.maxApplications) {
      const currentApplicationCount = await prisma.jobApplication.count({
        where: { jobPostingId }
      });

      if (currentApplicationCount >= jobPosting.maxApplications) {
        return NextResponse.json(
          { error: 'Job posting has reached maximum number of applications' },
          { status: 400 }
        );
      }
    }

    // Create application
    const application = await prisma.jobApplication.create({
      data: {
        jobPostingId,
        candidateId,
        source: source || null,
        coverLetter: coverLetter || null,
        customAnswers: customAnswers || null,
        screeningScore: screeningScore ? parseFloat(screeningScore) : null,
        screeningNotes: screeningNotes || null,
        companyId: user.companyId,
      },
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            currentCompany: true,
            currentPosition: true,
            totalExperience: true,
            expectedSalary: true,
            resumeUrl: true,
          }
        },
        jobPosting: {
          select: {
            id: true,
            title: true,
            department: {
              select: { id: true, name: true }
            },
            location: {
              select: { id: true, name: true, city: true }
            }
          }
        }
      }
    });

    // Update job posting application count
    await prisma.jobPosting.update({
      where: { id: jobPostingId },
      data: { applicationCount: { increment: 1 } }
    });

    return NextResponse.json({
      message: 'Application created successfully',
      application
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating application:', error);
    return NextResponse.json(
      { error: 'Failed to create application' },
      { status: 500 }
    );
  }
}
