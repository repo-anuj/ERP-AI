import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { startOfDay, endOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema for performance review
const performanceReviewSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  templateId: z.string().min(1, "Template is required"),
  reviewPeriodStart: z.string().transform((str) => new Date(str)),
  reviewPeriodEnd: z.string().transform((str) => new Date(str)),
  reviewType: z.string().min(1, "Review type is required"),
  dueDate: z.string().transform((str) => new Date(str)),
  reviewerId: z.string().optional(),
  reviewerName: z.string().optional(),
  reviewerEmail: z.string().optional(),
});

type PerformanceReviewFormValues = z.infer<typeof performanceReviewSchema>;

// GET - Fetch performance reviews
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
    const status = searchParams.get('status');
    const employeeId = searchParams.get('employeeId');
    const templateId = searchParams.get('templateId');
    const reviewType = searchParams.get('reviewType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build where clause
    const whereClause: any = {
      companyId: user.companyId,
    };

    if (status) {
      whereClause.status = status;
    }

    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    if (templateId) {
      whereClause.templateId = templateId;
    }

    if (reviewType) {
      whereClause.reviewType = reviewType;
    }

    if (startDate && endDate) {
      whereClause.reviewPeriodStart = {
        gte: startOfDay(new Date(startDate)),
        lte: endOfDay(new Date(endDate)),
      };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch reviews with pagination
    const [reviews, totalCount] = await Promise.all([
      prisma.performanceReview.findMany({
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
          template: {
            select: {
              id: true,
              name: true,
              reviewType: true,
              sections: true,
              ratingScale: true,
            }
          },
          goals: {
            select: {
              id: true,
              title: true,
              status: true,
              progressPercent: true,
            }
          },
          feedbacks: {
            select: {
              id: true,
              feedbackType: true,
              rating: true,
              comments: true,
              createdAt: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),

      prisma.performanceReview.count({
        where: whereClause,
      })
    ]);

    const formattedReviews = reviews.map(review => ({
      id: review.id,
      employee: {
        id: review.employee.id,
        name: `${review.employee.firstName} ${review.employee.lastName}`,
        employeeId: review.employee.employeeId,
        email: review.employee.email,
        department: review.employee.department?.name,
      },
      template: {
        id: review.template.id,
        name: review.template.name,
        reviewType: review.template.reviewType,
        sections: review.template.sections,
        ratingScale: review.template.ratingScale,
      },
      reviewPeriodStart: review.reviewPeriodStart,
      reviewPeriodEnd: review.reviewPeriodEnd,
      reviewType: review.reviewType,
      status: review.status,
      overallRating: review.overallRating,
      overallComments: review.overallComments,
      reviewerId: review.reviewerId,
      reviewerName: review.reviewerName,
      reviewerEmail: review.reviewerEmail,
      selfReviewCompleted: review.selfReviewCompleted,
      managerReviewCompleted: review.managerReviewCompleted,
      finalReviewCompleted: review.finalReviewCompleted,
      dueDate: review.dueDate,
      completedAt: review.completedAt,
      goals: review.goals.map((goal: any) => ({
        id: goal.id,
        title: goal.title,
        status: goal.status,
        progress: goal.progressPercent,
      })),
      feedbacks: review.feedbacks.map((feedback: any) => ({
        id: feedback.id,
        feedbackType: feedback.feedbackType,
        rating: feedback.rating,
        comments: feedback.comments,
        createdAt: feedback.createdAt,
      })),
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    }));

    return NextResponse.json({
      reviews: formattedReviews,
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
    console.error('[PERFORMANCE_REVIEWS_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// POST - Create performance review
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
    const validatedData = performanceReviewSchema.parse(body);

    // Validate dates
    if (validatedData.reviewPeriodStart >= validatedData.reviewPeriodEnd) {
      return new NextResponse('Review period end date must be after start date', { status: 400 });
    }

    if (validatedData.dueDate <= new Date()) {
      return new NextResponse('Due date must be in the future', { status: 400 });
    }

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

    // Verify template belongs to company
    const template = await prisma.performanceTemplate.findFirst({
      where: {
        id: validatedData.templateId,
        companyId: user.companyId,
        isActive: true,
      }
    });

    if (!template) {
      return new NextResponse('Performance template not found', { status: 404 });
    }

    // Check for overlapping reviews
    const overlappingReview = await prisma.performanceReview.findFirst({
      where: {
        employeeId: validatedData.employeeId,
        status: {
          in: ['draft', 'in_progress', 'pending_approval'],
        },
        OR: [
          {
            reviewPeriodStart: { lte: validatedData.reviewPeriodStart },
            reviewPeriodEnd: { gte: validatedData.reviewPeriodStart },
          },
          {
            reviewPeriodStart: { lte: validatedData.reviewPeriodEnd },
            reviewPeriodEnd: { gte: validatedData.reviewPeriodEnd },
          },
          {
            reviewPeriodStart: { gte: validatedData.reviewPeriodStart },
            reviewPeriodEnd: { lte: validatedData.reviewPeriodEnd },
          },
        ],
      }
    });

    if (overlappingReview) {
      return new NextResponse('Performance review overlaps with existing review', { status: 400 });
    }

    // Create performance review
    const performanceReview = await prisma.performanceReview.create({
      data: {
        employeeId: validatedData.employeeId,
        templateId: validatedData.templateId,
        reviewPeriodStart: validatedData.reviewPeriodStart,
        reviewPeriodEnd: validatedData.reviewPeriodEnd,
        reviewType: validatedData.reviewType,
        dueDate: validatedData.dueDate,
        reviewerId: validatedData.reviewerId,
        reviewerName: validatedData.reviewerName,
        reviewerEmail: validatedData.reviewerEmail,
        companyId: user.companyId,
        status: 'draft',
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
          }
        },
        template: {
          select: {
            id: true,
            name: true,
            reviewType: true,
          }
        }
      }
    });

    // Create audit log (commented out as AuditLog model doesn't exist)
    // await prisma.auditLog.create({
    //   data: {
    //     companyId: user.companyId,
    //     userId: user.id,
    //     action: 'CREATE_PERFORMANCE_REVIEW',
    //     entityType: 'PERFORMANCE_REVIEW',
    //     entityId: performanceReview.id,
    //     details: {
    //       employeeId: validatedData.employeeId,
    //       employeeName: `${performanceReview.employee.firstName} ${performanceReview.employee.lastName}`,
    //       templateName: performanceReview.template.name,
    //       reviewType: validatedData.reviewType,
    //       reviewPeriod: `${validatedData.reviewPeriodStart.toISOString()} - ${validatedData.reviewPeriodEnd.toISOString()}`,
    //       dueDate: validatedData.dueDate.toISOString(),
    //     },
    //   }
    // }).catch((error: any) => {
    //   // Don't fail the main operation if audit logging fails
    //   console.error('Failed to create audit log:', error);
    // });

    return NextResponse.json({
      id: performanceReview.id,
      employee: {
        id: performanceReview.employee.id,
        name: `${performanceReview.employee.firstName} ${performanceReview.employee.lastName}`,
        employeeId: performanceReview.employee.employeeId,
      },
      template: {
        id: performanceReview.template.id,
        name: performanceReview.template.name,
        reviewType: performanceReview.template.reviewType,
      },
      reviewPeriodStart: performanceReview.reviewPeriodStart,
      reviewPeriodEnd: performanceReview.reviewPeriodEnd,
      reviewType: performanceReview.reviewType,
      status: performanceReview.status,
      dueDate: performanceReview.dueDate,
      createdAt: performanceReview.createdAt,
    }, { status: 201 });

  } catch (error: any) {
    console.error('[PERFORMANCE_REVIEWS_POST]', error);

    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({
        error: 'Validation failed',
        details: error.errors
      }), { status: 400 });
    }

    return new NextResponse('Internal error', { status: 500 });
  }
}
