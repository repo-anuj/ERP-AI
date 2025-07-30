import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema for performance review update
const performanceReviewUpdateSchema = z.object({
  reviewPeriodStart: z.string().transform((str) => new Date(str)).optional(),
  reviewPeriodEnd: z.string().transform((str) => new Date(str)).optional(),
  reviewType: z.string().optional(),
  dueDate: z.string().transform((str) => new Date(str)).optional(),
  reviewerId: z.string().optional(),
  reviewerName: z.string().optional(),
  reviewerEmail: z.string().optional(),
  status: z.enum(['draft', 'in_progress', 'pending_approval', 'completed', 'cancelled']).optional(),
  overallRating: z.number().min(1).max(10).optional(),
  overallComments: z.string().optional(),
  selfReviewCompleted: z.boolean().optional(),
  managerReviewCompleted: z.boolean().optional(),
  finalReviewCompleted: z.boolean().optional(),
});

// GET - Fetch single performance review
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

    const review = await prisma.performanceReview.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
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
      }
    });

    if (!review) {
      return new NextResponse('Review not found', { status: 404 });
    }

    return NextResponse.json({
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
    });

  } catch (error: any) {
    console.error('[PERFORMANCE_REVIEW_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// PUT - Update performance review
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
    const validatedData = performanceReviewUpdateSchema.parse(body);

    // Check if review exists and belongs to company
    const existingReview = await prisma.performanceReview.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      }
    });

    if (!existingReview) {
      return new NextResponse('Review not found', { status: 404 });
    }

    // Validate dates if provided
    if (validatedData.reviewPeriodStart && validatedData.reviewPeriodEnd) {
      if (validatedData.reviewPeriodStart >= validatedData.reviewPeriodEnd) {
        return new NextResponse('Review period end date must be after start date', { status: 400 });
      }
    }

    // Set completion date if status is being changed to completed
    const updateData: any = { ...validatedData };
    if (validatedData.status === 'completed' && existingReview.status !== 'completed') {
      updateData.completedAt = new Date();
    }

    // Update performance review
    const updatedReview = await prisma.performanceReview.update({
      where: { id: params.id },
      data: updateData,
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

    // Note: Audit log functionality not available in current schema
    console.log('Performance review updated:', {
      id: updatedReview.id,
      employeeId: updatedReview.employeeId,
      changes: validatedData,
    });

    return NextResponse.json({
      id: updatedReview.id,
      employee: {
        id: updatedReview.employee.id,
        name: `${updatedReview.employee.firstName} ${updatedReview.employee.lastName}`,
        employeeId: updatedReview.employee.employeeId,
      },
      template: {
        id: updatedReview.template.id,
        name: updatedReview.template.name,
        reviewType: updatedReview.template.reviewType,
      },
      reviewPeriodStart: updatedReview.reviewPeriodStart,
      reviewPeriodEnd: updatedReview.reviewPeriodEnd,
      reviewType: updatedReview.reviewType,
      status: updatedReview.status,
      overallRating: updatedReview.overallRating,
      overallComments: updatedReview.overallComments,
      dueDate: updatedReview.dueDate,
      completedAt: updatedReview.completedAt,
      updatedAt: updatedReview.updatedAt,
    });

  } catch (error: any) {
    console.error('[PERFORMANCE_REVIEW_PUT]', error);
    
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ 
        error: 'Validation failed', 
        details: error.errors 
      }), { status: 400 });
    }

    return new NextResponse('Internal error', { status: 500 });
  }
}

// DELETE - Delete performance review
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

    // Check if review exists and belongs to company
    const existingReview = await prisma.performanceReview.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    if (!existingReview) {
      return new NextResponse('Review not found', { status: 404 });
    }

    // Check if review can be deleted (only draft reviews)
    if (existingReview.status !== 'draft') {
      return new NextResponse('Only draft reviews can be deleted', { status: 400 });
    }

    // Delete performance review (this will cascade delete related goals and feedbacks)
    await prisma.performanceReview.delete({
      where: { id: params.id }
    });

    // Note: Audit log functionality not available in current schema
    console.log('Performance review deleted:', {
      id: params.id,
      employeeId: existingReview.employeeId,
      reviewType: existingReview.reviewType,
    });

    return new NextResponse(null, { status: 204 });

  } catch (error: any) {
    console.error('[PERFORMANCE_REVIEW_DELETE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
