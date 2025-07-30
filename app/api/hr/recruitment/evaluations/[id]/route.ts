import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';


export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// GET /api/hr/recruitment/evaluations/[id] - Get specific evaluation
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

    const evaluation = await prisma.candidateEvaluation.findFirst({
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
            skills: true,
            resumeUrl: true,
          }
        },
        application: {
          include: {
            jobPosting: {
              select: {
                id: true,
                title: true,
                department: { select: { name: true } },
                location: { select: { name: true, city: true } },
              }
            },
            interviews: {
              select: {
                id: true,
                title: true,
                type: true,
                round: true,
                scheduledAt: true,
                status: true,
                location: true,
                meetingLink: true,
              }
            }
          }
        }
      }
    });

    if (!evaluation) {
      return new NextResponse('Evaluation not found', { status: 404 });
    }

    return NextResponse.json({ evaluation });

  } catch (error) {
    console.error('Error fetching evaluation:', error);
    return new NextResponse('Failed to fetch evaluation', { status: 500 });
  }
}

// PUT /api/hr/recruitment/evaluations/[id] - Update evaluation
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
      evaluationType,
      technicalSkills,
      communication,
      problemSolving,
      culturalFit,
      experience,
      motivation,
      overallScore,
      recommendation,
      strengths,
      weaknesses,
      comments,
      customScores,
    } = body;

    // Check if evaluation exists and belongs to company
    const existingEvaluation = await prisma.candidateEvaluation.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      }
    });

    if (!existingEvaluation) {
      return new NextResponse('Evaluation not found', { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};

    if (evaluationType !== undefined) updateData.evaluationType = evaluationType;
    if (technicalSkills !== undefined) updateData.technicalSkills = technicalSkills ? parseFloat(technicalSkills) : null;
    if (communication !== undefined) updateData.communication = communication ? parseFloat(communication) : null;
    if (problemSolving !== undefined) updateData.problemSolving = problemSolving ? parseFloat(problemSolving) : null;
    if (culturalFit !== undefined) updateData.culturalFit = culturalFit ? parseFloat(culturalFit) : null;
    if (experience !== undefined) updateData.experience = experience ? parseFloat(experience) : null;
    if (motivation !== undefined) updateData.motivation = motivation ? parseFloat(motivation) : null;
    if (recommendation !== undefined) updateData.recommendation = recommendation || null;
    if (strengths !== undefined) updateData.strengths = strengths || null;
    if (weaknesses !== undefined) updateData.weaknesses = weaknesses || null;
    if (comments !== undefined) updateData.comments = comments || null;
    if (customScores !== undefined) updateData.customScores = customScores || null;

    // Calculate overall score if individual scores provided
    let calculatedOverallScore = overallScore;
    if (!calculatedOverallScore) {
      const scores = [
        updateData.technicalSkills ?? existingEvaluation.technicalSkills,
        updateData.communication ?? existingEvaluation.communication,
        updateData.problemSolving ?? existingEvaluation.problemSolving,
        updateData.culturalFit ?? existingEvaluation.culturalFit,
        updateData.experience ?? existingEvaluation.experience,
        updateData.motivation ?? existingEvaluation.motivation,
      ].filter(score => score !== null && score !== undefined);
      
      if (scores.length > 0) {
        calculatedOverallScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      }
    }

    if (calculatedOverallScore !== undefined) {
      updateData.overallScore = calculatedOverallScore ? parseFloat(calculatedOverallScore) : null;
    }

    // Update evaluation
    const updatedEvaluation = await prisma.candidateEvaluation.update({
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
        application: {
          select: {
            id: true,
            status: true,
          }
        },
        interview: {
          select: {
            id: true,
            title: true,
            type: true,
          }
        }
      }
    });

    // Update candidate's overall rating based on all evaluations
    const allEvaluations = await prisma.candidateEvaluation.findMany({
      where: {
        candidateId: existingEvaluation.candidateId,
        overallScore: { not: null }
      },
      select: { overallScore: true }
    });

    if (allEvaluations.length > 0) {
      const averageRating = allEvaluations.reduce((sum, evaluation) => sum + (evaluation.overallScore || 0), 0) / allEvaluations.length;
      
      await prisma.candidate.update({
        where: { id: existingEvaluation.candidateId },
        data: { overallRating: averageRating }
      });
    }

    return NextResponse.json({
      message: 'Evaluation updated successfully',
      evaluation: updatedEvaluation
    });

  } catch (error) {
    console.error('Error updating evaluation:', error);
    return new NextResponse('Failed to update evaluation', { status: 500 });
  }
}

// DELETE /api/hr/recruitment/evaluations/[id] - Delete evaluation
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

    // Check if evaluation exists and belongs to company
    const existingEvaluation = await prisma.candidateEvaluation.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      }
    });

    if (!existingEvaluation) {
      return new NextResponse('Evaluation not found', { status: 404 });
    }

    const candidateId = existingEvaluation.candidateId;

    // Delete evaluation
    await prisma.candidateEvaluation.delete({
      where: { id: params.id }
    });

    // Recalculate candidate's overall rating
    const remainingEvaluations = await prisma.candidateEvaluation.findMany({
      where: {
        candidateId,
        overallScore: { not: null }
      },
      select: { overallScore: true }
    });

    let newOverallRating = null;
    if (remainingEvaluations.length > 0) {
      newOverallRating = remainingEvaluations.reduce((sum, evaluation) => sum + (evaluation.overallScore || 0), 0) / remainingEvaluations.length;
    }

    await prisma.candidate.update({
      where: { id: candidateId },
      data: { overallRating: newOverallRating }
    });

    return NextResponse.json({
      message: 'Evaluation deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting evaluation:', error);
    return new NextResponse('Failed to delete evaluation', { status: 500 });
  }
}
