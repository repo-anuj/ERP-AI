import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/hr/onboarding/workflows - Get all onboarding workflows
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
    const isActive = searchParams.get('isActive');
    const department = searchParams.get('department');
    const position = searchParams.get('position');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');

    // Build filter conditions
    const where: any = {
      companyId: user.companyId,
    };

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    if (department) {
      where.department = department;
    }

    if (position) {
      where.position = position;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count for pagination
    const totalCount = await prisma.onboardingWorkflow.count({ where });

    // Get workflows with relations
    const workflows = await prisma.onboardingWorkflow.findMany({
      where,
      include: {
        tasks: {
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            title: true,
            category: true,
            priority: true,
            estimatedHours: true,
            requiresApproval: true,
            requiresDocument: true,
            isAutomated: true,
          }
        },
        instances: {
          select: {
            id: true,
            status: true,
            completionPercentage: true,
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5, // Latest 5 instances
        },
        _count: {
          select: {
            tasks: true,
            instances: true,
          }
        }
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calculate workflow statistics
    const workflowsWithStats = workflows.map(workflow => ({
      ...workflow,
      stats: {
        totalTasks: workflow._count.tasks,
        totalInstances: workflow._count.instances,
        activeInstances: workflow.instances.filter((i: any) => i.status === 'in_progress').length,
        completedInstances: workflow.instances.filter((i: any) => i.status === 'completed').length,
        averageCompletion: workflow.instances.length > 0
          ? workflow.instances.reduce((sum: number, i: any) => sum + i.completionPercentage, 0) / workflow.instances.length
          : 0,
      }
    }));

    return NextResponse.json({
      workflows: workflowsWithStats,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      }
    });

  } catch (error) {
    console.error('Error fetching onboarding workflows:', error);
    return new NextResponse('Failed to fetch onboarding workflows', { status: 500 });
  }
}

// POST /api/hr/onboarding/workflows - Create new onboarding workflow
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
      select: { id: true, companyId: true }
    });

    if (!user?.companyId) {
      return new NextResponse('Company not found', { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      isDefault = false,
      isActive = true,
      department,
      position,
      estimatedDays,
      tasks = [],
    } = body;

    // Validate required fields
    if (!name) {
      return new NextResponse('Missing required field: name', { status: 400 });
    }
    // If setting as default, unset other defaults for the same department/position
    if (isDefault) {
      await prisma.onboardingWorkflow.updateMany({
        where: {
          companyId: user.companyId,
          isDefault: true,
          department: department || null,
          position: position || null,
        },
        data: { isDefault: false }
      });
    }

    // Create workflow
    const workflow = await prisma.onboardingWorkflow.create({
      data: {
        name,
        description: description || null,
        isDefault,
        isActive,
        department: department || null,
        position: position || null,
        estimatedDays: estimatedDays ? parseInt(estimatedDays) : null,
        companyId: user.companyId,
        createdBy: user.id,
      },
      include: {
        tasks: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    // Create tasks if provided
    if (tasks.length > 0) {
      const taskData = tasks.map((task: any, index: number) => ({
        workflowId: workflow.id,
        title: task.title,
        description: task.description || null,
        instructions: task.instructions || null,
        category: task.category,
        priority: task.priority || 'medium',
        estimatedHours: task.estimatedHours ? parseFloat(task.estimatedHours) : null,
        orderIndex: task.orderIndex || index,
        dependencies: task.dependencies || [],
        assigneeType: task.assigneeType,
        assigneeRole: task.assigneeRole || null,
        requiresApproval: task.requiresApproval || false,
        requiresDocument: task.requiresDocument || false,
        documentTypes: task.documentTypes || [],
        isAutomated: task.isAutomated || false,
        automationConfig: task.automationConfig || null,
      }));

      await prisma.onboardingTask.createMany({
        data: taskData,
      });
    }

    // Get the complete workflow with tasks
    const completeWorkflow = await prisma.onboardingWorkflow.findUnique({
      where: { id: workflow.id },
      include: {
        tasks: {
          orderBy: { orderIndex: 'asc' }
        },
        _count: {
          select: {
            tasks: true,
            instances: true,
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Onboarding workflow created successfully',
      workflow: completeWorkflow
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating onboarding workflow:', error);
    return new NextResponse('Failed to create onboarding workflow', { status: 500 });
  }
}
