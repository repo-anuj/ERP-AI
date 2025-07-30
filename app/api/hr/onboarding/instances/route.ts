import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/hr/onboarding/instances - Get all onboarding instances
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
    const status = searchParams.get('status');
    const workflowId = searchParams.get('workflowId');
    const employeeId = searchParams.get('employeeId');
    const hrAssignee = searchParams.get('hrAssignee');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');

    // Build filter conditions
    const where: any = {
      companyId: user.companyId,
    };

    if (status) where.status = status;
    if (workflowId) where.workflowId = workflowId;
    if (employeeId) where.employeeId = employeeId;
    if (hrAssignee) where.hrAssignee = hrAssignee;

    if (search) {
      where.OR = [
        {
          employee: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ]
          }
        },
        {
          workflow: {
            name: { contains: search, mode: 'insensitive' }
          }
        }
      ];
    }

    // Get total count for pagination
    const totalCount = await prisma.onboardingInstance.count({ where });

    // Get instances with relations
    const instances = await prisma.onboardingInstance.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            department: {
              select: { name: true }
            },
            position: true,
            startDate: true, // Changed from joiningDate to startDate
          }
        },
        workflow: {
          select: {
            id: true,
            name: true,
            estimatedDays: true,
          }
        },
        taskInstances: {
          select: {
            id: true,
            taskTitle: true,
            status: true,
            assigneeType: true,
            assigneeName: true,
            dueDate: true,
            completedAt: true,
            requiresApproval: true,
            approvedAt: true,
          },
          orderBy: { createdAt: 'asc' }
        },
        _count: {
          select: {
            taskInstances: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calculate instance statistics
    const instancesWithStats = instances.map(instance => {
      const tasks = instance.taskInstances;
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const overdueTasks = tasks.filter(t =>
        t.status !== 'completed' &&
        t.dueDate &&
        new Date(t.dueDate) < new Date()
      ).length;
      const pendingApprovals = tasks.filter(t =>
        t.status === 'completed' &&
        t.requiresApproval &&
        !t.approvedAt
      ).length;

      return {
        ...instance,
        stats: {
          totalTasks: tasks.length,
          completedTasks,
          overdueTasks,
          pendingApprovals,
          completionPercentage: tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0,
        }
      };
    });

    return NextResponse.json({
      instances: instancesWithStats,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      }
    });

  } catch (error) {
    console.error('Error fetching onboarding instances:', error);
    return new NextResponse('Failed to fetch onboarding instances', { status: 500 });
  }
}

// POST /api/hr/onboarding/instances - Create new onboarding instance
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
      workflowId,
      employeeId,
      hrAssignee,
      managerAssignee,
      buddyAssignee,
      startDate,
      expectedEndDate,
      notes,
    } = body;

    // Validate required fields
    if (!workflowId || !employeeId) {
      return new NextResponse('Missing required fields: workflowId, employeeId', { status: 400 });
    }

    // Check if workflow exists and belongs to company
    const workflow = await prisma.onboardingWorkflow.findFirst({
      where: {
        id: workflowId,
        companyId: user.companyId,
        isActive: true,
      },
      include: {
        tasks: {
          orderBy: { createdAt: 'asc' } // Changed from orderIndex to createdAt
        }
      }
    });

    if (!workflow) {
      return new NextResponse('Workflow not found or inactive', { status: 404 });
    }

    // Check if employee exists and belongs to company
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        companyId: user.companyId,
      }
    });

    if (!employee) {
      return new NextResponse('Employee not found', { status: 404 });
    }

    // Check if employee already has an active onboarding instance
    const existingInstance = await prisma.onboardingInstance.findFirst({
      where: {
        employeeId,
        status: { in: ['not_started', 'in_progress'] }
      }
    });

    if (existingInstance) {
      return new NextResponse('Employee already has an active onboarding instance', { status: 400 });
    }

    // Calculate expected end date if not provided
    const calculatedStartDate = startDate ? new Date(startDate) : new Date();
    let calculatedEndDate = expectedEndDate ? new Date(expectedEndDate) : null;

    if (!calculatedEndDate && workflow.estimatedDays) {
      calculatedEndDate = new Date(calculatedStartDate);
      calculatedEndDate.setDate(calculatedEndDate.getDate() + workflow.estimatedDays);
    }

    // Create onboarding instance
    const instance = await prisma.onboardingInstance.create({
      data: {
        workflowId,
        employeeId,
        startDate: calculatedStartDate,
        expectedEndDate: calculatedEndDate,
        hrAssignee: hrAssignee || null,
        managerAssignee: managerAssignee || null,
        buddyAssignee: buddyAssignee || null,
        notes: notes || null,
        companyId: user.companyId,
      }
    });

    // Create task instances from workflow tasks
    const taskInstanceData = workflow.tasks.map((task: any, index: number) => {
      // Calculate due date based on task order and estimated hours
      let dueDate = null;
      if (task.estimatedHours) {
        dueDate = new Date(calculatedStartDate);
        // Add estimated hours for all previous tasks plus current task
        const totalHours = workflow.tasks
          .slice(0, index + 1)
          .reduce((sum: number, t: any) => sum + (t.estimatedHours || 8), 0);
        dueDate.setHours(dueDate.getHours() + totalHours);
      }

      // Determine assignee based on task type
      let assigneeId = null;
      let assigneeName = null;

      switch (task.assigneeType) {
        case 'hr':
          assigneeId = hrAssignee;
          assigneeName = 'HR Team';
          break;
        case 'manager':
          assigneeId = managerAssignee;
          assigneeName = 'Manager';
          break;
        case 'buddy':
          assigneeId = buddyAssignee;
          assigneeName = 'Buddy/Mentor';
          break;
        case 'employee':
          assigneeId = employeeId;
          assigneeName = `${employee.firstName} ${employee.lastName}`;
          break;
        case 'it':
          assigneeName = 'IT Team';
          break;
        case 'admin':
          assigneeName = 'Admin Team';
          break;
      }

      return {
        instanceId: instance.id,
        taskTitle: task.title,
        taskDescription: task.description,
        taskCategory: task.category,
        assigneeId,
        assigneeName,
        assigneeType: task.assigneeType,
        dueDate,
        requiresApproval: task.requiresApproval,
      };
    });

    await prisma.onboardingTaskInstance.createMany({
      data: taskInstanceData,
    });

    // Get the complete instance with task instances
    const completeInstance = await prisma.onboardingInstance.findUnique({
      where: { id: instance.id },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        workflow: {
          select: {
            id: true,
            name: true,
          }
        },
        taskInstances: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    return NextResponse.json({
      message: 'Onboarding instance created successfully',
      instance: completeInstance
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating onboarding instance:', error);
    return new NextResponse('Failed to create onboarding instance', { status: 500 });
  }
}
