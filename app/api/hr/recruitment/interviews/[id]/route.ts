import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';


export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// GET /api/hr/recruitment/interviews/[id] - Get specific interview
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload?.email) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    // Get user to find companyId
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      select: { companyId: true }
    });

    if (!user?.companyId) {
      return new NextResponse('Company not found', { status: 401 });
    }

    const interview = await prisma.interview.findFirst({
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
            resumeUrl: true,
            skills: true,
          }
        },
        jobPosting: {
          select: {
            id: true,
            title: true,
            description: true,
            requirements: true,
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
            appliedAt: true,
            coverLetter: true,
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
            responseDate: true,
            rating: true,
            feedback: true,
            recommendation: true,
            feedbackSubmitted: true,
          }
        },
        evaluations: {
          include: {
            interview: {
              select: {
                id: true,
                type: true,
                scheduledAt: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!interview) {
      return new NextResponse('Interview not found', { status: 404 });
    }

    return NextResponse.json({ interview });

  } catch (error) {
    console.error('Error fetching interview:', error);
    return new NextResponse('Failed to fetch interview', { status: 500 });
  }
}

// PUT /api/hr/recruitment/interviews/[id] - Update interview
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload?.email) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    // Get user to find companyId
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      select: { companyId: true }
    });

    if (!user?.companyId) {
      return new NextResponse('Company not found', { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      type,
      round,
      duration,
      scheduledAt,
      endTime,
      timezone,
      location,
      meetingLink,
      status,
      overallRating,
      recommendation,
      feedback,
      strengths,
      concerns,
      technicalNotes,
      reminderSent,
      feedbackSubmitted,
      interviewers,
    } = body;

    // Check if interview exists and belongs to company
    const existingInterview = await prisma.interview.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      }
    });

    if (!existingInterview) {
      return new NextResponse('Interview not found', { status: 404 });
    }
    // Prepare update data
    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (type !== undefined) updateData.type = type;
    if (round !== undefined) updateData.round = round;
    if (duration !== undefined) updateData.duration = duration || null;
    if (scheduledAt !== undefined) updateData.scheduledAt = new Date(scheduledAt);
    if (endTime !== undefined) updateData.endTime = endTime ? new Date(endTime) : null;
    if (timezone !== undefined) updateData.timezone = timezone || null;
    if (location !== undefined) updateData.location = location || null;
    if (meetingLink !== undefined) updateData.meetingLink = meetingLink || null;
    if (status !== undefined) updateData.status = status;
    if (overallRating !== undefined) updateData.overallRating = overallRating ? parseFloat(overallRating) : null;
    if (recommendation !== undefined) updateData.recommendation = recommendation || null;
    if (feedback !== undefined) updateData.feedback = feedback || null;
    if (strengths !== undefined) updateData.strengths = strengths || null;
    if (concerns !== undefined) updateData.concerns = concerns || null;
    if (technicalNotes !== undefined) updateData.technicalNotes = technicalNotes || null;
    if (reminderSent !== undefined) updateData.reminderSent = reminderSent;
    if (feedbackSubmitted !== undefined) updateData.feedbackSubmitted = feedbackSubmitted;

    // Calculate end time if scheduled time changed and no explicit end time
    if (scheduledAt && !endTime && duration) {
      const scheduledDate = new Date(scheduledAt);
      updateData.endTime = new Date(scheduledDate.getTime() + duration * 60000);
    }

    // Update interview
    const updatedInterview = await prisma.interview.update({
      where: { id: params.id },
      data: updateData,
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
            role: true,
            hasAccepted: true,
            feedbackSubmitted: true,
          }
        }
      }
    });

    // Update interview panel if provided
    if (interviewers !== undefined) {
      // Delete existing panel members
      await prisma.interviewPanel.deleteMany({
        where: { interviewId: params.id }
      });

      // Create new panel members
      if (interviewers.length > 0) {
        const panelMembers = interviewers.map((interviewer: any) => ({
          interviewId: params.id,
          interviewerId: interviewer.interviewerId,
          interviewerName: interviewer.interviewerName,
          interviewerEmail: interviewer.interviewerEmail,
          role: interviewer.role || 'interviewer',
          isRequired: interviewer.isRequired !== false,
          hasAccepted: interviewer.hasAccepted || false,
          rating: interviewer.rating ? parseFloat(interviewer.rating) : null,
          feedback: interviewer.feedback || null,
          recommendation: interviewer.recommendation || null,
          feedbackSubmitted: interviewer.feedbackSubmitted || false,
        }));

        await prisma.interviewPanel.createMany({
          data: panelMembers,
        });
      }
    }

    return NextResponse.json({
      message: 'Interview updated successfully',
      interview: updatedInterview
    });

  } catch (error) {
    console.error('Error updating interview:', error);
    return new NextResponse('Failed to update interview', { status: 500 });
  }
}

// DELETE /api/hr/recruitment/interviews/[id] - Delete interview
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload?.email) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    // Get user to find companyId
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      select: { companyId: true }
    });

    if (!user?.companyId) {
      return new NextResponse('Company not found', { status: 401 });
    }

    // Check if interview exists and belongs to company
    const existingInterview = await prisma.interview.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
      include: {
        _count: {
          select: {
            evaluations: true
          }
        }
      }
    });

    if (!existingInterview) {
      return new NextResponse('Interview not found', { status: 404 });
    }

    // Check if interview has evaluations
    if (existingInterview._count.evaluations > 0) {
      return new NextResponse('Cannot delete interview with existing evaluations. Please cancel it instead.', { status: 400 });
    }

    // Check if interview is completed or in progress
    if (existingInterview.status === 'completed' || existingInterview.status === 'in_progress') {
      return new NextResponse('Cannot delete completed or in-progress interviews. Please cancel it instead.', { status: 400 });
    }
    // Delete interview panel members first
    await prisma.interviewPanel.deleteMany({
      where: { interviewId: params.id }
    });

    // Delete interview
    await prisma.interview.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      message: 'Interview deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting interview:', error);
    return new NextResponse('Failed to delete interview', { status: 500 });
  }
}
