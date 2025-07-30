import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema for performance goal update
const performanceGoalUpdateSchema = z.object({
  title: z.string().min(1, "Goal title is required").optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'on_hold', 'cancelled']).optional(),
  targetDate: z.string().transform((str) => new Date(str)).optional(),
  targetValue: z.number().optional(),
  currentValue: z.number().optional(),
  unit: z.string().optional(),
  managerId: z.string().optional(),
  isPublic: z.boolean().optional(),
  keyResults: z.array(z.object({
    description: z.string(),
    targetValue: z.number().optional(),
    currentValue: z.number().default(0),
    unit: z.string().optional(),
  })).optional(),
});

// GET - Fetch single performance goal
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

    const goal = await prisma.performanceGoal.findFirst({
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
        performanceReview: {
          select: {
            id: true,
            reviewType: true,
            status: true,
          }
        }
      }
    });

    if (!goal) {
      return new NextResponse('Goal not found', { status: 404 });
    }

    // Calculate progress percentage
    const progressPercentage = goal.targetValue && goal.targetValue > 0 && goal.currentValue !== null
      ? Math.min((goal.currentValue / goal.targetValue) * 100, 100)
      : goal.progressPercent;

    // Calculate days until target
    const daysUntilTarget = Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    return NextResponse.json({
      id: goal.id,
      employee: {
        id: goal.employee.id,
        name: `${goal.employee.firstName} ${goal.employee.lastName}`,
        employeeId: goal.employee.employeeId,
        email: goal.employee.email,
        department: goal.employee.department?.name,
      },
      manager: null, // Manager relation doesn't exist in the schema
      review: goal.performanceReview ? {
        id: goal.performanceReview.id,
        reviewType: goal.performanceReview.reviewType,
        status: goal.performanceReview.status,
      } : null,
      title: goal.title,
      description: goal.description,
      category: goal.category,
      priority: goal.priority,
      status: goal.status,
      progress: goal.progressPercent,
      progressPercentage,
      targetDate: goal.targetDate,
      targetValue: goal.targetValue,
      currentValue: goal.currentValue,
      unit: goal.unit,
      isPublic: true, // Default value since field doesn't exist in schema
      keyResults: [], // Default value since field doesn't exist in schema
      daysUntilTarget,
      isOverdue: daysUntilTarget < 0 && goal.status !== 'completed',
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
    });

  } catch (error) {
    console.error('[PERFORMANCE_GOAL_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// PUT - Update performance goal
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
    const validatedData = performanceGoalUpdateSchema.parse(body);

    // Check if goal exists and belongs to company
    const existingGoal = await prisma.performanceGoal.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      }
    });

    if (!existingGoal) {
      return new NextResponse('Goal not found', { status: 404 });
    }

    // Validate target date if provided
    if (validatedData.targetDate && validatedData.targetDate <= new Date()) {
      return new NextResponse('Target date must be in the future', { status: 400 });
    }

    // Verify manager if provided
    if (validatedData.managerId) {
      const manager = await prisma.employee.findFirst({
        where: {
          id: validatedData.managerId,
          companyId: user.companyId,
        }
      });

      if (!manager) {
        return new NextResponse('Manager not found', { status: 404 });
      }
    }

    // Calculate progress if values are updated
    const updateData: any = { ...validatedData };
    if (validatedData.currentValue !== undefined || validatedData.targetValue !== undefined) {
      const currentValue = validatedData.currentValue ?? existingGoal.currentValue ?? 0;
      const targetValue = validatedData.targetValue ?? existingGoal.targetValue;

      if (targetValue && targetValue > 0) {
        updateData.progressPercent = Math.min((currentValue / targetValue) * 100, 100);
      }
    }

    // Set completion date if status is being changed to completed
    if (validatedData.status === 'completed' && existingGoal.status !== 'completed') {
      updateData.completedDate = new Date();
    }

    // Update performance goal
    const updatedGoal = await prisma.performanceGoal.update({
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
        }
      }
    });

    // Create audit log - Note: AuditLog model may not exist in schema
    // Commenting out until AuditLog model is properly defined
    /*
    await prisma.auditLog.create({
      data: {
        companyId: user.companyId,
        userId: user.id,
        action: 'UPDATE_PERFORMANCE_GOAL',
        entityType: 'PERFORMANCE_GOAL',
        entityId: updatedGoal.id,
        details: {
          employeeName: `${updatedGoal.employee.firstName} ${updatedGoal.employee.lastName}`,
          goalTitle: updatedGoal.title,
          changes: validatedData,
        },
      }
    }).catch((error: any) => {
      console.error('Failed to create audit log:', error);
    });
    */

    // Calculate progress percentage for response
    const progressPercentage = updatedGoal.targetValue && updatedGoal.targetValue > 0 && updatedGoal.currentValue !== null
      ? Math.min((updatedGoal.currentValue / updatedGoal.targetValue) * 100, 100)
      : updatedGoal.progressPercent;

    return NextResponse.json({
      id: updatedGoal.id,
      employee: {
        id: updatedGoal.employee.id,
        name: `${updatedGoal.employee.firstName} ${updatedGoal.employee.lastName}`,
        employeeId: updatedGoal.employee.employeeId,
      },
      manager: null, // Manager relation doesn't exist in the schema
      title: updatedGoal.title,
      description: updatedGoal.description,
      category: updatedGoal.category,
      priority: updatedGoal.priority,
      status: updatedGoal.status,
      progress: updatedGoal.progressPercent,
      progressPercentage,
      targetDate: updatedGoal.targetDate,
      targetValue: updatedGoal.targetValue,
      currentValue: updatedGoal.currentValue,
      unit: updatedGoal.unit,
      isPublic: true, // Default value since field doesn't exist in schema
      keyResults: [], // Default value since field doesn't exist in schema
      updatedAt: updatedGoal.updatedAt,
    });

  } catch (error) {
    console.error('[PERFORMANCE_GOAL_PUT]', error);
    
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ 
        error: 'Validation failed', 
        details: error.errors 
      }), { status: 400 });
    }

    return new NextResponse('Internal error', { status: 500 });
  }
}

// DELETE - Delete performance goal
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

    // Check if goal exists and belongs to company
    const existingGoal = await prisma.performanceGoal.findFirst({
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

    if (!existingGoal) {
      return new NextResponse('Goal not found', { status: 404 });
    }

    // Check if goal can be deleted (not completed goals)
    if (existingGoal.status === 'completed') {
      return new NextResponse('Completed goals cannot be deleted', { status: 400 });
    }

    // Delete performance goal
    await prisma.performanceGoal.delete({
      where: { id: params.id }
    });

    // Create audit log - Note: AuditLog model may not exist in schema
    // Commenting out until AuditLog model is properly defined
    /*
    await prisma.auditLog.create({
      data: {
        companyId: user.companyId,
        userId: user.id,
        action: 'DELETE_PERFORMANCE_GOAL',
        entityType: 'PERFORMANCE_GOAL',
        entityId: params.id,
        details: {
          employeeName: `${existingGoal.employee.firstName} ${existingGoal.employee.lastName}`,
          goalTitle: existingGoal.title,
          category: existingGoal.category,
        },
      }
    }).catch((error: any) => {
      console.error('Failed to create audit log:', error);
    });
    */

    return new NextResponse(null, { status: 204 });

  } catch (error) {
    console.error('[PERFORMANCE_GOAL_DELETE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
