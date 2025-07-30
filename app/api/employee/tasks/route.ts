import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const token = cookies().get('token')?.value;

    if (!token) {
      console.error("[EMPLOYEE_TASKS_GET] No token provided");
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);

    if (!payload.email) {
      console.error("[EMPLOYEE_TASKS_GET] Invalid token - no email");
      return new NextResponse('Invalid token', { status: 401 });
    }

    console.log("[EMPLOYEE_TASKS_GET] Request from:", payload.email);
    console.log("[EMPLOYEE_TASKS_GET] Token payload:", { ...payload, password: undefined });

    let employee;
    let companyId;

    // Check if this is an employee token
    if (payload.isEmployee) {
      console.log("[EMPLOYEE_TASKS_GET] Processing employee token");
      // For employee tokens, get employee directly from payload
      employee = await prisma.employee.findUnique({
        where: { id: payload.id },
        include: {
          company: true,
          department: true
        }
      });

      if (!employee) {
        console.error("[EMPLOYEE_TASKS_GET] Employee not found for ID:", payload.id);
        return new NextResponse('Employee not found', { status: 404 });
      }

      if (!employee.company) {
        console.error("[EMPLOYEE_TASKS_GET] Company not found for employee:", payload.email);
        return new NextResponse('Company not found', { status: 404 });
      }

      companyId = employee.company.id;
      console.log("[EMPLOYEE_TASKS_GET] Employee found:", employee.id, "Company:", employee.company.name);
    } else {
      console.log("[EMPLOYEE_TASKS_GET] Processing user token");
      // For regular user tokens, get user and then employee record
      const user = await prisma.user.findUnique({
        where: { email: payload.email },
        include: { company: true }
      });

      if (!user?.company) {
        console.error("[EMPLOYEE_TASKS_GET] Company not found for user:", payload.email);
        return new NextResponse('Company not found', { status: 404 });
      }

      // Get employee record - try multiple approaches
      employee = await prisma.employee.findFirst({
        where: {
          email: payload.email,
          companyId: user.company.id
        },
        include: {
          department: true
        }
      });

      // If not found by email, try by ID if available in payload
      if (!employee && payload.id) {
        employee = await prisma.employee.findFirst({
          where: {
            id: payload.id,
            companyId: user.company.id
          },
          include: {
            department: true
          }
        });
      }

      if (!employee) {
        console.error("[EMPLOYEE_TASKS_GET] Employee record not found for email:", payload.email, "or ID:", payload.id);
        return new NextResponse('Employee not found', { status: 404 });
      }

      companyId = user.company.id;
      console.log("[EMPLOYEE_TASKS_GET] Employee found:", employee.id, "Email:", employee.email);
    }

    // Get all tasks assigned to this employee
    console.log("[EMPLOYEE_TASKS_GET] Searching for tasks with assigneeId:", employee.id, "companyId:", companyId);

    const tasks = await prisma.task.findMany({
      where: {
        assigneeId: employee.id,
        companyId: companyId
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
            priority: true,
            projectManager: true
          }
        }
      },
      orderBy: [
        { status: 'asc' }, // Pending tasks first
        { dueDate: 'asc' }, // Then by due date
        { priority: 'desc' } // Then by priority
      ]
    });

    console.log("[EMPLOYEE_TASKS_GET] Tasks found:", tasks.length);

    // Format tasks for employee dashboard
    const formattedTasks = tasks.map(task => {
      const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';
      const daysUntilDue = Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        id: task.id,
        name: task.name,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        startDate: task.startDate,
        completionPercentage: task.completionPercentage || 0,
        estimatedHours: task.estimatedHours || 0,
        actualHours: task.actualHours || 0,
        notes: task.notes,
        
        // Project information
        projectId: task.project?.id,
        projectName: task.project?.name || 'Unknown Project',
        projectStatus: task.project?.status,
        projectPriority: task.project?.priority,
        
        // Manager information
        managerId: task.project?.projectManager?.employeeId,
        managerName: task.project?.projectManager?.name || 'Unknown Manager',
        managerEmail: null, // Email not available in ProjectMember type
        
        // Approval information
        approvalStatus: task.approvalStatus,
        approvalRequired: task.approvalRequired,
        approvedById: task.approvedById,
        approvedByName: task.approvedByName,
        approvedAt: task.approvedAt,
        rejectionReason: task.rejectionReason,
        
        // Calculated fields
        isOverdue,
        daysUntilDue,
        canSubmitForApproval: task.status === 'in_progress' && 
                             task.completionPercentage >= 90 && 
                             task.approvalStatus !== 'pending',
        
        // Time tracking
        timeEfficiency: task.estimatedHours && task.actualHours 
          ? ((task.estimatedHours - task.actualHours) / task.estimatedHours * 100)
          : null,
        
        // Timestamps
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      };
    });

    // Group tasks by status for better organization
    const tasksByStatus = {
      not_started: formattedTasks.filter(t => t.status === 'not_started'),
      in_progress: formattedTasks.filter(t => t.status === 'in_progress'),
      awaiting_approval: formattedTasks.filter(t => t.status === 'awaiting_approval'),
      completed: formattedTasks.filter(t => t.status === 'completed'),
      on_hold: formattedTasks.filter(t => t.status === 'on_hold')
    };

    // Calculate task statistics
    const stats = {
      totalTasks: formattedTasks.length,
      notStarted: tasksByStatus.not_started.length,
      inProgress: tasksByStatus.in_progress.length,
      awaitingApproval: tasksByStatus.awaiting_approval.length,
      completed: tasksByStatus.completed.length,
      onHold: tasksByStatus.on_hold.length,
      overdue: formattedTasks.filter(t => t.isOverdue).length,
      dueToday: formattedTasks.filter(t => t.daysUntilDue === 0 && !t.isOverdue).length,
      dueTomorrow: formattedTasks.filter(t => t.daysUntilDue === 1).length,
      canSubmitForApproval: formattedTasks.filter(t => t.canSubmitForApproval).length,
      
      // Time tracking stats
      totalEstimatedHours: formattedTasks.reduce((sum, t) => sum + t.estimatedHours, 0),
      totalActualHours: formattedTasks.reduce((sum, t) => sum + t.actualHours, 0),
      averageCompletion: formattedTasks.length > 0 
        ? Math.round(formattedTasks.reduce((sum, t) => sum + t.completionPercentage, 0) / formattedTasks.length)
        : 0,
      
      // Priority breakdown
      urgent: formattedTasks.filter(t => t.priority === 'urgent').length,
      high: formattedTasks.filter(t => t.priority === 'high').length,
      medium: formattedTasks.filter(t => t.priority === 'medium').length,
      low: formattedTasks.filter(t => t.priority === 'low').length
    };

    // Get upcoming deadlines (next 7 days)
    const upcomingDeadlines = formattedTasks
      .filter(t => t.daysUntilDue >= 0 && t.daysUntilDue <= 7 && t.status !== 'completed')
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
      .slice(0, 5);

    console.log("[EMPLOYEE_TASKS_GET] Returning tasks with stats");

    return NextResponse.json({
      tasks: formattedTasks,
      tasksByStatus,
      stats,
      upcomingDeadlines,
      employee: {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        position: employee.position,
        department: employee.department?.name
      }
    });

  } catch (error) {
    console.error('[EMPLOYEE_TASKS_GET] Error details:', error);
    
    if (error instanceof Error) {
      console.error('[EMPLOYEE_TASKS_GET] Error message:', error.message);
      console.error('[EMPLOYEE_TASKS_GET] Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST endpoint for task submission and approval requests
export async function POST(request: Request) {
  try {
    const token = cookies().get('token')?.value;

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload.email) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    const body = await request.json();
    const { taskId, action, data } = body;

    console.log("[EMPLOYEE_TASKS_POST] Action:", action, "Task:", taskId);

    // Get employee record
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      include: { company: true }
    });

    if (!user?.company) {
      return new NextResponse('Company not found', { status: 404 });
    }

    const employee = await prisma.employee.findFirst({
      where: {
        email: payload.email,
        companyId: user.company.id
      }
    });

    if (!employee) {
      return new NextResponse('Employee not found', { status: 404 });
    }

    // Handle different actions
    switch (action) {
      case 'submit_for_approval':
        const updatedTask = await prisma.task.update({
          where: { id: taskId },
          data: {
            status: 'awaiting_approval',
            approvalStatus: 'pending',
            completionPercentage: 100,
            notes: data.submissionNotes || '',
            updatedAt: new Date()
          }
        });

        console.log("[EMPLOYEE_TASKS_POST] Task submitted for approval:", taskId);
        return NextResponse.json({ success: true, task: updatedTask });

      case 'update_progress':
        const progressTask = await prisma.task.update({
          where: { id: taskId },
          data: {
            completionPercentage: data.progress,
            actualHours: data.actualHours || 0,
            notes: data.notes || '',
            status: data.progress >= 100 ? 'awaiting_approval' : 'in_progress',
            updatedAt: new Date()
          }
        });

        console.log("[EMPLOYEE_TASKS_POST] Task progress updated:", taskId);
        return NextResponse.json({ success: true, task: progressTask });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('[EMPLOYEE_TASKS_POST] Error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
