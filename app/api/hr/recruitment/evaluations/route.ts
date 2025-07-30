import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';


export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// GET /api/hr/recruitment/evaluations - Get all evaluations
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidateId');
    const applicationId = searchParams.get('applicationId');
    const interviewId = searchParams.get('interviewId');
    const evaluationType = searchParams.get('evaluationType');
    const evaluatorId = searchParams.get('evaluatorId');
    const recommendation = searchParams.get('recommendation');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build filter conditions
    const where: any = {
      companyId: user.companyId,
    };

    if (candidateId) where.candidateId = candidateId;
    if (applicationId) where.applicationId = applicationId;
    if (interviewId) where.interviewId = interviewId;
    if (evaluationType) where.evaluationType = evaluationType;
    if (evaluatorId) where.evaluatorId = evaluatorId;
    if (recommendation) where.recommendation = recommendation;

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
        { evaluatorName: { contains: search, mode: 'insensitive' } },
        { comments: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count for pagination
    const totalCount = await prisma.candidateEvaluation.count({ where });

    // Get evaluations with relations
    const evaluations = await prisma.candidateEvaluation.findMany({
      where,
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            currentCompany: true,
            currentPosition: true,
            totalExperience: true,
          }
        },
        application: {
          select: {
            id: true,
            status: true,
            stage: true,
            appliedAt: true,
          }
        },
        interview: {
          select: {
            id: true,
            title: true,
            type: true,
            scheduledAt: true,
            status: true,
          }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      evaluations,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      }
    });

  } catch (error) {
    console.error('Error fetching evaluations:', error);
    return new NextResponse('Failed to fetch evaluations', { status: 500 });
  }
}

// POST /api/hr/recruitment/evaluations - Create new evaluation
export async function POST(request: NextRequest) {
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
      candidateId,
      applicationId,
      interviewId,
      evaluationType,
      evaluatorId,
      evaluatorName,
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

    // Validate required fields
    if (!candidateId || !evaluationType || !evaluatorId || !evaluatorName) {
      return new NextResponse('Missing required fields: candidateId, evaluationType, evaluatorId, evaluatorName', { status: 400 });
    }

    // Check if candidate exists and belongs to company
    const candidate = await prisma.candidate.findFirst({
      where: {
        id: candidateId,
        companyId: user.companyId,
      }
    });

    if (!candidate) {
      return new NextResponse('Candidate not found', { status: 404 });
    }

    // Check if application exists (if provided)
    if (applicationId) {
      const application = await prisma.jobApplication.findFirst({
        where: {
          id: applicationId,
          candidateId,
          companyId: user.companyId,
        }
      });

      if (!application) {
        return new NextResponse('Application not found', { status: 404 });
      }
    }

    // Check if interview exists (if provided)
    if (interviewId) {
      const interview = await prisma.interview.findFirst({
        where: {
          id: interviewId,
          candidateId,
          companyId: user.companyId,
        }
      });

      if (!interview) {
        return new NextResponse('Interview not found', { status: 404 });
      }
    }

    // Calculate overall score if individual scores provided
    let calculatedOverallScore = overallScore;
    if (!calculatedOverallScore && (technicalSkills || communication || problemSolving || culturalFit || experience || motivation)) {
      const scores = [technicalSkills, communication, problemSolving, culturalFit, experience, motivation]
        .filter(score => score !== null && score !== undefined)
        .map(score => parseFloat(score));
      
      if (scores.length > 0) {
        calculatedOverallScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      }
    }

    // Create evaluation
    const evaluation = await prisma.candidateEvaluation.create({
      data: {
        candidateId,
        applicationId: applicationId || null,
        interviewId: interviewId || null,
        evaluationType,
        evaluatorId,
        evaluatorName,
        technicalSkills: technicalSkills ? parseFloat(technicalSkills) : null,
        communication: communication ? parseFloat(communication) : null,
        problemSolving: problemSolving ? parseFloat(problemSolving) : null,
        culturalFit: culturalFit ? parseFloat(culturalFit) : null,
        experience: experience ? parseFloat(experience) : null,
        motivation: motivation ? parseFloat(motivation) : null,
        overallScore: calculatedOverallScore ? parseFloat(calculatedOverallScore) : null,
        recommendation: recommendation || null,
        strengths: strengths || null,
        weaknesses: weaknesses || null,
        comments: comments || null,
        customScores: customScores || null,
        companyId: user.companyId,
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
        candidateId,
        overallScore: { not: null }
      },
      select: { overallScore: true }
    });

    if (allEvaluations.length > 0) {
      const averageRating = allEvaluations.reduce((sum, evaluation) => sum + (evaluation.overallScore || 0), 0) / allEvaluations.length;
      
      await prisma.candidate.update({
        where: { id: candidateId },
        data: { overallRating: averageRating }
      });
    }

    return NextResponse.json({
      message: 'Evaluation created successfully',
      evaluation
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating evaluation:', error);
    return new NextResponse('Failed to create evaluation', { status: 500 });
  }
}
