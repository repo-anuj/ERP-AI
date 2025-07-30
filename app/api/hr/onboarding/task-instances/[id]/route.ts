import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';


export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// GET /api/hr/onboarding/task-instances/[id] - Get specific task instance
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

    const taskInstance = await prisma.onboardingTaskInstance.findFirst({
      where: {
        id: params.id,
        instance: {
          companyId: user.companyId,
        },
      },
      include: {
        instance: {
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
            workflow: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      }
    });

    if (!taskInstance) {
      return new NextResponse('Task instance not found', { status: 404 });
    }

    return NextResponse.json({ taskInstance });

  } catch (error) {
    console.error('Error fetching task instance:', error);
    return new NextResponse('Failed to fetch task instance', { status: 500 });
  }
}

// PUT /api/hr/onboarding/task-instances/[id] - Update task instance
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
      select: { id: true, companyId: true }
    });

    if (!user?.companyId) {
      return new NextResponse('Company not found', { status: 401 });
    }

    const body = await request.json();
    const {
      status,
      completedBy,
      completionNotes,
      documentsUploaded,
      approvedBy,
      approvalNotes,
      rejectionReason,
    } = body;

    // Check if task instance exists and belongs to company
    const existingTaskInstance = await prisma.onboardingTaskInstance.findFirst({
      where: {
        id: params.id,
        instance: {
          companyId: user.companyId,
        },
      },
      include: {
        instance: {
          select: {
            id: true,
            employeeId: true,
            status: true,
          }
        }
      }
    });

    if (!existingTaskInstance) {
      return new NextResponse('Task instance not found', { status: 404 });
    }
    // Prepare update data
    const updateData: any = {};

    if (status !== undefined) {
      updateData.status = status;
      
      // Set timestamps based on status
      if (status === 'completed' && existingTaskInstance.status !== 'completed') {
        updateData.completedAt = new Date();
        updateData.completedBy = completedBy || user.id;
      } else if (status === 'approved' && existingTaskInstance.status !== 'approved') {
        updateData.approvedAt = new Date();
        updateData.approvedBy = approvedBy || user.id;
      }
    }

    if (completionNotes !== undefined) updateData.completionNotes = completionNotes || null;
    if (documentsUploaded !== undefined) updateData.documentsUploaded = documentsUploaded || [];
    if (approvalNotes !== undefined) updateData.approvalNotes = approvalNotes || null;
    if (rejectionReason !== undefined) updateData.rejectionReason = rejectionReason || null;

    // Update task instance
    const updatedTaskInstance = await prisma.onboardingTaskInstance.update({
      where: { id: params.id },
      data: updateData,
      include: {
        instance: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        }
      }
    });

    // Update onboarding instance completion percentage
    await updateInstanceProgress(existingTaskInstance.instanceId);

    return NextResponse.json({
      message: 'Task instance updated successfully',
      taskInstance: updatedTaskInstance
    });

  } catch (error) {
    console.error('Error updating task instance:', error);
    return new NextResponse('Failed to update task instance', { status: 500 });
  }
}

// Helper function to update instance progress
async function updateInstanceProgress(instanceId: string) {
  try {
    // Get all task instances for this onboarding instance
    const taskInstances = await prisma.onboardingTaskInstance.findMany({
      where: { instanceId },
      select: { status: true }
    });

    const totalTasks = taskInstances.length;
    const completedTasks = taskInstances.filter((t: { status: string }) =>
      t.status === 'completed' || t.status === 'approved'
    ).length;

    const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Determine instance status
    let instanceStatus = 'in_progress';
    if (completionPercentage === 100) {
      instanceStatus = 'completed';
    } else if (completionPercentage === 0) {
      instanceStatus = 'not_started';
    }

    // Update the onboarding instance
    await prisma.onboardingInstance.update({
      where: { id: instanceId },
      data: {
        completionPercentage: Math.round(completionPercentage),
        status: instanceStatus,
        actualEndDate: instanceStatus === 'completed' ? new Date() : null,
      }
    });

  } catch (error) {
    console.error('Error updating instance progress:', error);
  }
}

// POST /api/hr/onboarding/task-instances/[id]/complete - Mark task as complete
export async function POST(
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
      select: { id: true, companyId: true }
    });

    if (!user?.companyId) {
      return new NextResponse('Company not found', { status: 401 });
    }

    const body = await request.json();
    const { completionNotes, documentsUploaded = [] } = body;

    // Check if task instance exists and belongs to company
    const existingTaskInstance = await prisma.onboardingTaskInstance.findFirst({
      where: {
        id: params.id,
        instance: {
          companyId: user.companyId,
        },
      },
      include: {
        instance: {
          select: {
            id: true,
            employeeId: true,
          }
        }
      }
    });

    if (!existingTaskInstance) {
      return new NextResponse('Task instance not found', { status: 404 });
    }

    // Check if task is already completed
    if (existingTaskInstance.status === 'completed' || existingTaskInstance.status === 'approved') {
      return new NextResponse('Task is already completed', { status: 400 });
    }
    // Update task instance to completed
    const updatedTaskInstance = await prisma.onboardingTaskInstance.update({
      where: { id: params.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        completionNotes: completionNotes || null,
        documentsUploaded: documentsUploaded,
      },
      include: {
        instance: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        }
      }
    });

    // Update onboarding instance progress
    await updateInstanceProgress(existingTaskInstance.instanceId);

    return NextResponse.json({
      message: 'Task marked as complete successfully',
      taskInstance: updatedTaskInstance
    });

  } catch (error) {
    console.error('Error completing task instance:', error);
    return new NextResponse('Failed to complete task instance', { status: 500 });
  }
}
