import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/hr/recruitment/applications/[id] - Get specific job application
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const application = await prisma.jobApplication.findFirst({
      where: {
        id: params.id,
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
            skills: true,
            status: true,
            overallRating: true,
            notes: true,
            currentLocation: true,
          }
        },
        jobPosting: {
          select: {
            id: true,
            title: true,
            description: true,
            requirements: true,
            responsibilities: true,
            department: {
              select: { id: true, name: true }
            },
            location: {
              select: { id: true, name: true, city: true, state: true }
            },
            jobType: true,
            experienceLevel: true,
            salaryMin: true,
            salaryMax: true,
            currency: true,
            benefits: true,
            status: true,
          }
        },
        interviews: {
          include: {
            interviewers: {
              select: {
                id: true,
                interviewerName: true,
                role: true,
                rating: true,
                recommendation: true,
                feedback: true,
              }
            }
          },
          orderBy: { scheduledAt: 'desc' }
        },
        evaluations: {
          select: {
            id: true,
            evaluationType: true,
            technicalSkills: true,
            communication: true,
            problemSolving: true,
            culturalFit: true,
            experience: true,
            motivation: true,
            overallScore: true,
            recommendation: true,
            strengths: true,
            weaknesses: true,
            comments: true,
            evaluatorName: true,
            evaluatorId: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Transform the data to match the frontend interface
    const transformedApplication = {
      ...application,
      candidate: application.candidate ? {
        ...application.candidate,
        address: application.candidate.currentLocation || undefined,
      } : null,
      jobPosting: application.jobPosting ? {
        ...application.jobPosting,
        location: application.jobPosting.location ? {
          ...application.jobPosting.location,
          country: 'India', // Default country
        } : undefined,
      } : null,
      interviews: application.interviews ? application.interviews.map((interview: any) => ({
        ...interview,
        interviewers: interview.interviewers ? interview.interviewers.map((interviewer: any) => ({
          id: interviewer.id,
          name: interviewer.interviewerName,
          email: '', // Not available in current schema
          role: interviewer.role,
          rating: interviewer.rating,
          recommendation: interviewer.recommendation,
          feedback: interviewer.feedback,
        })) : []
      })) : [],
      evaluations: application.evaluations ? application.evaluations.map((evaluation: any) => ({
        ...evaluation,
        submittedBy: {
          id: evaluation.evaluatorId || '',
          name: evaluation.evaluatorName || 'Unknown',
          role: 'Evaluator',
        },
        submittedAt: evaluation.createdAt,
      })) : []
    };

    return NextResponse.json(transformedApplication);

  } catch (error) {
    console.error('Error fetching application:', error);
    return NextResponse.json(
      { error: 'Failed to fetch application' },
      { status: 500 }
    );
  }
}

// PUT /api/hr/recruitment/applications/[id] - Update job application
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      status,
      stage,
      screeningScore,
      screeningNotes,
      rejectionReason,
      notes,
    } = body;

    // Check if application exists and belongs to company
    const existingApplication = await prisma.jobApplication.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      }
    });

    if (!existingApplication) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (status !== undefined) updateData.status = status;
    if (stage !== undefined) updateData.stage = stage;
    if (screeningScore !== undefined) updateData.screeningScore = parseFloat(screeningScore);
    if (screeningNotes !== undefined) updateData.screeningNotes = screeningNotes;
    if (rejectionReason !== undefined) updateData.rejectionReason = rejectionReason;

    // Handle status-specific updates
    if (status === 'rejected') {
      updateData.rejectedAt = new Date();
      updateData.rejectedBy = user.companyId; // Should be user ID in real implementation
    }

    if (status === 'withdrawn') {
      updateData.withdrawnAt = new Date();
    }

    // Update application
    const updatedApplication = await prisma.jobApplication.update({
      where: { id: params.id },
      data: updateData,
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
            skills: true,
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
              select: { id: true, name: true, city: true, state: true }
            }
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Application updated successfully',
      application: updatedApplication
    });

  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    );
  }
}
