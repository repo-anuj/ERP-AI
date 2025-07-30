import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { startOfDay, endOfDay } from 'date-fns';
import { createAuditLog, AUDIT_ACTIONS, ENTITY_TYPES } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema for performance feedback
const performanceFeedbackSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  reviewId: z.string().optional(),
  feedbackType: z.enum(['self', 'manager', 'peer', 'skip_level', 'subordinate', '360']),
  feedbackCategory: z.enum(['strengths', 'areas_for_improvement', 'achievements', 'goals', 'general']),
  rating: z.number().min(1).max(10).optional(),
  comments: z.string().min(1, "Comments are required"),
  isAnonymous: z.boolean().default(false),
  providerId: z.string().optional(),
  providerName: z.string().optional(),
  providerEmail: z.string().optional(),
  providerRole: z.string().optional(),
  isVisible: z.boolean().default(true),
});

type PerformanceFeedbackFormValues = z.infer<typeof performanceFeedbackSchema>;

// GET - Fetch performance feedback
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload.email) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      include: { company: true }
    });

    if (!user?.companyId) {
      return new NextResponse('Company not found', { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const reviewId = searchParams.get('reviewId');
    const feedbackType = searchParams.get('feedbackType');
    const feedbackCategory = searchParams.get('feedbackCategory');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build where clause
    const whereClause: any = {
      companyId: user.companyId,
    };

    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    if (reviewId) {
      whereClause.reviewId = reviewId;
    }

    if (feedbackType) {
      whereClause.feedbackType = feedbackType;
    }

    if (feedbackCategory) {
      whereClause.feedbackCategory = feedbackCategory;
    }

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: startOfDay(new Date(startDate)),
        lte: endOfDay(new Date(endDate)),
      };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch feedback with pagination
    const [feedbacks, totalCount] = await Promise.all([
      prisma.performanceFeedback.findMany({
        where: whereClause,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeId: true,
              email: true,
              department: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          },
          performanceReview: {
            select: {
              id: true,
              reviewType: true,
              status: true,
              reviewPeriodStart: true,
              reviewPeriodEnd: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),

      prisma.performanceFeedback.count({
        where: whereClause,
      })
    ]);

    const formattedFeedbacks = feedbacks.map(feedback => ({
      id: feedback.id,
      employee: {
        id: feedback.employee.id,
        name: `${feedback.employee.firstName} ${feedback.employee.lastName}`,
        employeeId: feedback.employee.employeeId,
        email: feedback.employee.email,
        department: feedback.employee.department?.name,
      },
      review: feedback.performanceReview ? {
        id: feedback.performanceReview.id,
        reviewType: feedback.performanceReview.reviewType,
        status: feedback.performanceReview.status,
        reviewPeriodStart: feedback.performanceReview.reviewPeriodStart,
        reviewPeriodEnd: feedback.performanceReview.reviewPeriodEnd,
      } : null,
      feedbackType: feedback.feedbackType,
      feedbackCategory: feedback.feedbackCategory,
      rating: feedback.rating,
      comments: feedback.comments,
      isAnonymous: feedback.isAnonymous,
      providerId: feedback.providerId,
      providerName: feedback.providerName,
      providerEmail: feedback.providerEmail,
      providerRole: feedback.providerRole,
      status: feedback.status,
      isVisible: feedback.isVisible,
      createdAt: feedback.createdAt,
      updatedAt: feedback.updatedAt,
    }));

    return NextResponse.json({
      feedbacks: formattedFeedbacks,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      }
    });

  } catch (error) {
    console.error('[PERFORMANCE_FEEDBACK_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// POST - Create performance feedback
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload.email) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      include: { company: true }
    });

    if (!user?.companyId) {
      return new NextResponse('Company not found', { status: 404 });
    }

    const body = await request.json();
    const validatedData = performanceFeedbackSchema.parse(body);

    // Verify employee belongs to company
    const employee = await prisma.employee.findFirst({
      where: {
        id: validatedData.employeeId,
        companyId: user.companyId,
      }
    });

    if (!employee) {
      return new NextResponse('Employee not found', { status: 404 });
    }

    // Verify review if provided
    if (validatedData.reviewId) {
      const review = await prisma.performanceReview.findFirst({
        where: {
          id: validatedData.reviewId,
          companyId: user.companyId,
        }
      });

      if (!review) {
        return new NextResponse('Performance review not found', { status: 404 });
      }
    }

    // Verify provider if provided
    if (validatedData.providerId) {
      const provider = await prisma.employee.findFirst({
        where: {
          id: validatedData.providerId,
          companyId: user.companyId,
        }
      });

      if (!provider) {
        return new NextResponse('Feedback provider not found', { status: 404 });
      }
    }

    // Create performance feedback
    const performanceFeedback = await prisma.performanceFeedback.create({
      data: {
        employeeId: validatedData.employeeId,
        reviewId: validatedData.reviewId,
        feedbackType: validatedData.feedbackType,
        feedbackCategory: validatedData.feedbackCategory,
        rating: validatedData.rating,
        comments: validatedData.comments,
        isAnonymous: validatedData.isAnonymous,
        providerId: validatedData.providerId,
        providerName: validatedData.providerName,
        providerEmail: validatedData.providerEmail,
        providerRole: validatedData.providerRole,
        isVisible: validatedData.isVisible,
        companyId: user.companyId,
        status: 'submitted',
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
          }
        }
      }
    });

    // Create audit log
    await createAuditLog({
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      action: AUDIT_ACTIONS.CREATE_PERFORMANCE_FEEDBACK,
      entityType: ENTITY_TYPES.PERFORMANCE_FEEDBACK,
      entityId: performanceFeedback.id,
      companyId: user.companyId,
      details: {
        employeeId: validatedData.employeeId,
        employeeName: `${performanceFeedback.employee.firstName} ${performanceFeedback.employee.lastName}`,
        feedbackType: validatedData.feedbackType,
        feedbackCategory: validatedData.feedbackCategory,
        rating: validatedData.rating,
        isAnonymous: validatedData.isAnonymous,
      },
    });

    return NextResponse.json({
      id: performanceFeedback.id,
      employee: {
        id: performanceFeedback.employee.id,
        name: `${performanceFeedback.employee.firstName} ${performanceFeedback.employee.lastName}`,
        employeeId: performanceFeedback.employee.employeeId,
      },
      feedbackType: performanceFeedback.feedbackType,
      feedbackCategory: performanceFeedback.feedbackCategory,
      rating: performanceFeedback.rating,
      comments: performanceFeedback.comments,
      isAnonymous: performanceFeedback.isAnonymous,
      providerName: performanceFeedback.providerName,
      providerRole: performanceFeedback.providerRole,
      status: performanceFeedback.status,
      isVisible: performanceFeedback.isVisible,
      createdAt: performanceFeedback.createdAt,
    }, { status: 201 });

  } catch (error) {
    console.error('[PERFORMANCE_FEEDBACK_POST]', error);
    
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ 
        error: 'Validation failed', 
        details: error.errors 
      }), { status: 400 });
    }

    return new NextResponse('Internal error', { status: 500 });
  }
}
