import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';


export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// GET /api/hr/onboarding/workflows/[id] - Get specific workflow
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

    const workflow = await prisma.onboardingWorkflow.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
      include: {
        tasks: {
          orderBy: { orderIndex: 'asc' }
        },
        instances: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                department: {
                  select: { name: true }
                },
                position: true,
              }
            },
            taskInstances: {
              select: {
                id: true,
                status: true,
                completedAt: true,
              }
            }
          }
        },
        _count: {
          select: {
            tasks: true,
            instances: true,
          }
        }
      }
    });

    if (!workflow) {
      return new NextResponse('Workflow not found', { status: 404 });
    }

    // Calculate workflow statistics
    const workflowWithStats = {
      ...workflow,
      stats: {
        totalTasks: workflow._count.tasks,
        totalInstances: workflow._count.instances,
        activeInstances: workflow.instances.filter((i: any) => i.status === 'in_progress').length,
        completedInstances: workflow.instances.filter((i: any) => i.status === 'completed').length,
        averageCompletion: workflow.instances.length > 0
          ? workflow.instances.reduce((sum: number, i: any) => sum + i.completionPercentage, 0) / workflow.instances.length
          : 0,
        tasksByCategory: workflow.tasks.reduce((acc: any, task: any) => {
          acc[task.category] = (acc[task.category] || 0) + 1;
          return acc;
        }, {}),
        tasksByPriority: workflow.tasks.reduce((acc: any, task: any) => {
          acc[task.priority] = (acc[task.priority] || 0) + 1;
          return acc;
        }, {}),
      }
    };

    return NextResponse.json({ workflow: workflowWithStats });

  } catch (error) {
    console.error('Error fetching workflow:', error);
    return new NextResponse('Failed to fetch workflow', { status: 500 });
  }
}

// PUT /api/hr/onboarding/workflows/[id] - Update workflow
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
      name,
      description,
      isDefault,
      isActive,
      department,
      position,
      estimatedDays,
      tasks,
    } = body;

    // Check if workflow exists and belongs to company
    const existingWorkflow = await prisma.onboardingWorkflow.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      }
    });

    if (!existingWorkflow) {
      return new NextResponse('Workflow not found', { status: 404 });
    }
    // If setting as default, unset other defaults for the same department/position
    if (isDefault && !existingWorkflow.isDefault) {
      await prisma.onboardingWorkflow.updateMany({
        where: {
          companyId: user.companyId,
          isDefault: true,
          department: department || null,
          position: position || null,
          id: { not: params.id }
        },
        data: { isDefault: false }
      });
    }

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description || null;
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (department !== undefined) updateData.department = department || null;
    if (position !== undefined) updateData.position = position || null;
    if (estimatedDays !== undefined) updateData.estimatedDays = estimatedDays ? parseInt(estimatedDays) : null;

    // Update workflow
    const updatedWorkflow = await prisma.onboardingWorkflow.update({
      where: { id: params.id },
      data: updateData,
    });

    // Update tasks if provided
    if (tasks !== undefined) {
      // Delete existing tasks
      await prisma.onboardingTask.deleteMany({
        where: { workflowId: params.id }
      });

      // Create new tasks
      if (tasks.length > 0) {
        const taskData = tasks.map((task: any, index: number) => ({
          workflowId: params.id,
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
    }

    // Get the complete updated workflow
    const completeWorkflow = await prisma.onboardingWorkflow.findUnique({
      where: { id: params.id },
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
      message: 'Workflow updated successfully',
      workflow: completeWorkflow
    });

  } catch (error) {
    console.error('Error updating workflow:', error);
    return new NextResponse('Failed to update workflow', { status: 500 });
  }
}

// DELETE /api/hr/onboarding/workflows/[id] - Delete workflow
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

    // Check if workflow exists and belongs to company
    const existingWorkflow = await prisma.onboardingWorkflow.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
      include: {
        _count: {
          select: {
            instances: true
          }
        }
      }
    });

    if (!existingWorkflow) {
      return new NextResponse('Workflow not found', { status: 404 });
    }

    // Check if workflow has instances
    if (existingWorkflow._count.instances > 0) {
      return new NextResponse('Cannot delete workflow with existing instances. Please deactivate it instead.', { status: 400 });
    }
    // Delete tasks first
    await prisma.onboardingTask.deleteMany({
      where: { workflowId: params.id }
    });

    // Delete workflow
    await prisma.onboardingWorkflow.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      message: 'Workflow deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting workflow:', error);
    return new NextResponse('Failed to delete workflow', { status: 500 });
  }
}
