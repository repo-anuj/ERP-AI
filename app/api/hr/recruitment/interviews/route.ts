import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';


export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// GET /api/hr/recruitment/interviews - Get all interviews
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
    const type = searchParams.get('type');
    const jobPostingId = searchParams.get('jobPostingId');
    const candidateId = searchParams.get('candidateId');
    const interviewerId = searchParams.get('interviewerId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sortBy = searchParams.get('sortBy') || 'scheduledAt';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Build filter conditions
    const where: any = {
      companyId: user.companyId,
    };

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (jobPostingId) {
      where.jobPostingId = jobPostingId;
    }

    if (candidateId) {
      where.candidateId = candidateId;
    }

    if (interviewerId) {
      where.interviewers = {
        some: {
          interviewerId: interviewerId
        }
      };
    }

    if (dateFrom || dateTo) {
      where.scheduledAt = {};
      if (dateFrom) where.scheduledAt.gte = new Date(dateFrom);
      if (dateTo) where.scheduledAt.lte = new Date(dateTo);
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
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
    const totalCount = await prisma.interview.count({ where });

    // Get interviews with relations
    const interviews = await prisma.interview.findMany({
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
        },
        application: {
          select: {
            id: true,
            status: true,
            stage: true,
          }
        },
        interviewers: {
          select: {
            id: true,
            interviewerId: true,
            interviewerName: true,
            interviewerEmail: true,
            role: true,
            isRequired: true,
            hasAccepted: true,
            rating: true,
            recommendation: true,
            feedbackSubmitted: true,
          }
        },
        evaluations: {
          select: {
            id: true,
            overallScore: true,
            recommendation: true,
            evaluatorName: true,
          }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      interviews,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      }
    });

  } catch (error) {
    console.error('Error fetching interviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interviews' },
      { status: 500 }
    );
  }
}

// POST /api/hr/recruitment/interviews - Create new interview
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
      select: { id: true, companyId: true }
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: 'Company not found' }, { status: 401 });
    }



    const body = await request.json();
    const {
      jobPostingId,
      candidateId,
      applicationId,
      title,
      type,
      round = 1,
      duration,
      scheduledAt,
      endTime,
      timezone,
      location,
      meetingLink,
      interviewers = [],
      primaryInterviewer,
    } = body;

    // Validate required fields
    if (!jobPostingId || !candidateId || !title || !type || !scheduledAt) {
      return NextResponse.json(
        { error: 'Missing required fields: jobPostingId, candidateId, title, type, scheduledAt' },
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

    // Check if application exists (if provided)
    if (applicationId) {
      const application = await prisma.jobApplication.findFirst({
        where: {
          id: applicationId,
          jobPostingId,
          candidateId,
          companyId: user.companyId,
        }
      });

      if (!application) {
        return NextResponse.json(
          { error: 'Application not found' },
          { status: 404 }
        );
      }
    }

    // Calculate end time if not provided
    const scheduledDate = new Date(scheduledAt);
    const calculatedEndTime = endTime 
      ? new Date(endTime)
      : duration 
        ? new Date(scheduledDate.getTime() + duration * 60000)
        : new Date(scheduledDate.getTime() + 60 * 60000); // Default 1 hour

    // Create interview
    const interview = await prisma.interview.create({
      data: {
        jobPostingId,
        candidateId,
        applicationId: applicationId || null,
        title,
        type,
        round,
        duration: duration || null,
        scheduledAt: scheduledDate,
        endTime: calculatedEndTime,
        timezone: timezone || null,
        location: location || null,
        meetingLink: meetingLink || null,
        primaryInterviewer: primaryInterviewer || null,
        companyId: user.companyId,
        createdBy: user.id,
      },
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        jobPosting: {
          select: {
            id: true,
            title: true,
          }
        }
      }
    });

    // Create interview panel members
    if (interviewers.length > 0) {
      const panelMembers = interviewers.map((interviewer: any) => ({
        interviewId: interview.id,
        interviewerId: interviewer.interviewerId,
        interviewerName: interviewer.interviewerName,
        interviewerEmail: interviewer.interviewerEmail,
        role: interviewer.role || 'interviewer',
        isRequired: interviewer.isRequired !== false,
      }));

      await prisma.interviewPanel.createMany({
        data: panelMembers,
      });
    }

    // Get the complete interview with panel
    const completeInterview = await prisma.interview.findUnique({
      where: { id: interview.id },
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        jobPosting: {
          select: {
            id: true,
            title: true,
          }
        },
        interviewers: {
          select: {
            id: true,
            interviewerId: true,
            interviewerName: true,
            interviewerEmail: true,
            role: true,
            isRequired: true,
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Interview scheduled successfully',
      interview: completeInterview
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating interview:', error);
    return NextResponse.json(
      { error: 'Failed to create interview' },
      { status: 500 }
    );
  }
}
