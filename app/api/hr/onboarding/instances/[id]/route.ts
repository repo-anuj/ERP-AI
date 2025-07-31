import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/hr/onboarding/instances/[id] - Get specific onboarding instance
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

    const instance = await prisma.onboardingInstance.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
      include: {
        employee: {
          include: {
            department: {
              select: { name: true }
            }
          }
        },
        workflow: {
          select: {
            id: true,
            name: true,
            description: true,
            estimatedDays: true
          }
        },
        taskInstances: {
          select: {
            id: true,
            taskTitle: true,
            taskDescription: true,
            taskCategory: true,
            assigneeId: true,
            assigneeName: true,
            assigneeType: true,
            status: true,
            startedAt: true,
            completedAt: true,
            dueDate: true,
            completionNotes: true,
            requiresApproval: true,
            approvedBy: true,
            approvedAt: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!instance) {
      return new NextResponse('Onboarding instance not found', { status: 404 });
    }

    // Transform the data to match the frontend interface
    const transformedInstance = {
      ...instance,
      taskInstances: instance.taskInstances ? instance.taskInstances.map((taskInstance: any) => ({
        id: taskInstance.id,
        taskTitle: taskInstance.taskTitle,
        taskDescription: taskInstance.taskDescription,
        status: taskInstance.status,
        assigneeType: taskInstance.assigneeType,
        assigneeName: taskInstance.assigneeName,
        dueDate: taskInstance.dueDate,
        completedAt: taskInstance.completedAt,
        notes: taskInstance.completionNotes,
        order: 0 // Default order since it's not stored in task instance
      })) : []
    };

    return NextResponse.json({ instance: transformedInstance });

  } catch (error) {
    console.error('Error fetching onboarding instance:', error);
    return new NextResponse('Failed to fetch onboarding instance', { status: 500 });
  }
}

// PUT /api/hr/onboarding/instances/[id] - Update onboarding instance
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
      status,
      expectedEndDate,
      hrAssignee,
      managerAssignee,
      buddyAssignee,
      notes,
      completedAt
    } = body;

    // Check if instance exists and belongs to company
    const existingInstance = await prisma.onboardingInstance.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      }
    });

    if (!existingInstance) {
      return new NextResponse('Onboarding instance not found', { status: 404 });
    }

    // Update the instance
    const updatedInstance = await prisma.onboardingInstance.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(expectedEndDate && { expectedEndDate: new Date(expectedEndDate) }),
        ...(hrAssignee !== undefined && { hrAssignee }),
        ...(managerAssignee !== undefined && { managerAssignee }),
        ...(buddyAssignee !== undefined && { buddyAssignee }),
        ...(notes !== undefined && { notes }),
        ...(completedAt && { completedAt: new Date(completedAt) }),
        updatedAt: new Date(),
      },
      include: {
        employee: {
          include: {
            department: {
              select: { name: true }
            }
          }
        },
        workflow: {
          select: {
            id: true,
            name: true,
            description: true,
            estimatedDays: true
          }
        },
        taskInstances: {
          select: {
            id: true,
            taskTitle: true,
            taskDescription: true,
            taskCategory: true,
            assigneeId: true,
            assigneeName: true,
            assigneeType: true,
            status: true,
            startedAt: true,
            completedAt: true,
            dueDate: true,
            completionNotes: true,
            requiresApproval: true,
            approvedBy: true,
            approvedAt: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    // Transform the data to match the frontend interface
    const transformedInstance = {
      ...updatedInstance,
      taskInstances: updatedInstance.taskInstances ? updatedInstance.taskInstances.map((taskInstance: any) => ({
        id: taskInstance.id,
        taskTitle: taskInstance.taskTitle,
        taskDescription: taskInstance.taskDescription,
        status: taskInstance.status,
        assigneeType: taskInstance.assigneeType,
        assigneeName: taskInstance.assigneeName,
        dueDate: taskInstance.dueDate,
        completedAt: taskInstance.completedAt,
        notes: taskInstance.completionNotes,
        order: 0 // Default order since it's not stored in task instance
      })) : []
    };

    return NextResponse.json({
      message: 'Onboarding instance updated successfully',
      instance: transformedInstance
    });

  } catch (error) {
    console.error('Error updating onboarding instance:', error);
    return new NextResponse('Failed to update onboarding instance', { status: 500 });
  }
}

// DELETE /api/hr/onboarding/instances/[id] - Delete onboarding instance
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

    // Check if instance exists and belongs to company
    const existingInstance = await prisma.onboardingInstance.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      }
    });

    if (!existingInstance) {
      return new NextResponse('Onboarding instance not found', { status: 404 });
    }

    // Check if instance can be deleted (only if not completed)
    if (existingInstance.status === 'completed') {
      return new NextResponse('Cannot delete completed onboarding instances', { status: 400 });
    }

    // Delete the instance (this will cascade delete task instances)
    await prisma.onboardingInstance.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      message: 'Onboarding instance deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting onboarding instance:', error);
    return new NextResponse('Failed to delete onboarding instance', { status: 500 });
  }
}
