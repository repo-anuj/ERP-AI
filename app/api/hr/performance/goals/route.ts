import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { startOfDay, endOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema for performance goal
const performanceGoalSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  title: z.string().min(1, "Goal title is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  targetDate: z.string().transform((str) => new Date(str)),
  targetValue: z.number().optional(),
  currentValue: z.number().default(0),
  unit: z.string().optional(),
  reviewId: z.string().optional(),
  managerId: z.string().optional(),
  isPublic: z.boolean().default(true),
  keyResults: z.array(z.object({
    description: z.string(),
    targetValue: z.number().optional(),
    currentValue: z.number().default(0),
    unit: z.string().optional(),
  })).default([]),
});

type PerformanceGoalFormValues = z.infer<typeof performanceGoalSchema>;

// GET - Fetch performance goals
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
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
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

    if (category) {
      whereClause.category = category;
    }

    if (priority) {
      whereClause.priority = priority;
    }

    if (startDate && endDate) {
      whereClause.targetDate = {
        gte: startOfDay(new Date(startDate)),
        lte: endOfDay(new Date(endDate)),
      };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch goals with pagination
    const [goals, totalCount] = await Promise.all([
      prisma.performanceGoal.findMany({
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


        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),

      prisma.performanceGoal.count({
        where: whereClause,
      })
    ]);

    const formattedGoals = goals.map(goal => {
      // Calculate progress percentage
      const progressPercentage = goal.targetValue && goal.targetValue > 0
        ? Math.min(((goal.currentValue || 0) / goal.targetValue) * 100, 100)
        : goal.progressPercent;

      // Calculate days until target
      const daysUntilTarget = Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

      return {
        id: goal.id,
        employee: {
          id: goal.employee.id,
          name: `${goal.employee.firstName} ${goal.employee.lastName}`,
          employeeId: goal.employee.employeeId,
          email: goal.employee.email,
          department: goal.employee.department?.name,
        },
        manager: null, // Manager relation not available in current schema
        review: goal.reviewId ? {
          id: goal.reviewId,
          reviewType: 'annual', // Default value since relation not included
          status: 'draft', // Default value since relation not included
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
        isPublic: true, // Default value since field not in schema
        keyResults: [], // Default value since field not in schema
        daysUntilTarget,
        isOverdue: daysUntilTarget < 0 && goal.status !== 'completed',
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt,
      };
    });

    return NextResponse.json({
      goals: formattedGoals,
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
    console.error('[PERFORMANCE_GOALS_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// POST - Create performance goal
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
    const validatedData = performanceGoalSchema.parse(body);

    // Validate target date
    if (validatedData.targetDate <= new Date()) {
      return new NextResponse('Target date must be in the future', { status: 400 });
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

    // Calculate initial progress
    const initialProgress = validatedData.targetValue && validatedData.targetValue > 0 
      ? Math.min((validatedData.currentValue / validatedData.targetValue) * 100, 100)
      : 0;

    // Create performance goal
    const performanceGoal = await prisma.performanceGoal.create({
      data: {
        employeeId: validatedData.employeeId,
        title: validatedData.title,
        description: validatedData.description || '',
        category: validatedData.category,
        priority: validatedData.priority,
        startDate: new Date(),
        targetDate: validatedData.targetDate,
        targetValue: validatedData.targetValue,
        currentValue: validatedData.currentValue,
        unit: validatedData.unit,
        reviewId: validatedData.reviewId,
        progressPercent: initialProgress,
        companyId: user.companyId,
        status: 'not_started',
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

    // Note: Audit log functionality not available in current schema
    console.log('Performance goal created:', {
      id: performanceGoal.id,
      employeeId: validatedData.employeeId,
      title: validatedData.title,
      category: validatedData.category,
    });

    return NextResponse.json({
      id: performanceGoal.id,
      employee: {
        id: performanceGoal.employee.id,
        name: `${performanceGoal.employee.firstName} ${performanceGoal.employee.lastName}`,
        employeeId: performanceGoal.employee.employeeId,
      },
      manager: null, // Manager relation not available in current schema
      title: performanceGoal.title,
      description: performanceGoal.description,
      category: performanceGoal.category,
      priority: performanceGoal.priority,
      status: performanceGoal.status,
      progress: performanceGoal.progressPercent,
      targetDate: performanceGoal.targetDate,
      targetValue: performanceGoal.targetValue,
      currentValue: performanceGoal.currentValue,
      unit: performanceGoal.unit,
      isPublic: true, // Default value since field not in schema
      keyResults: [], // Default value since field not in schema
      createdAt: performanceGoal.createdAt,
    }, { status: 201 });

  } catch (error: any) {
    console.error('[PERFORMANCE_GOALS_POST]', error);
    
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ 
        error: 'Validation failed', 
        details: error.errors 
      }), { status: 400 });
    }

    return new NextResponse('Internal error', { status: 500 });
  }
}
