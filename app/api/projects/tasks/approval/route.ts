import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import { createTaskApprovalRequest, createTaskApprovalResponse } from "@/lib/notification-service";
import { z } from "zod";
export const dynamic = 'force-dynamic';

// Schema for task approval request
const taskApprovalRequestSchema = z.object({
  taskId: z.string(),
  message: z.string().optional(),
});

// Schema for task approval response
const taskApprovalResponseSchema = z.object({
  taskId: z.string(),
  approved: z.boolean(),
  comments: z.string().optional(),
});

// Request task approval
async function requestTaskApproval(req: Request) {
  try {
    const token = cookies().get('token')?.value;
    const isEmployee = cookies().get('isEmployee')?.value === 'true';

    if (!token || !isEmployee) {
      return NextResponse.json({ error: "Unauthorized - Only employees can request task approval" }, { status: 401 });
    }

    const payload = await verifyAuth(token);

    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await req.json();
    const validationResult = taskApprovalRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({
        error: "Invalid input",
        details: validationResult.error.errors
      }, { status: 400 });
    }

    const { taskId, message } = validationResult.data;

    // Get the task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check if the employee is the assignee of the task
    if (task.assigneeId !== payload.id) {
      return NextResponse.json({ error: "You are not assigned to this task" }, { status: 403 });
    }

    // Check if the task is already in approval state
    if (task.status === 'awaiting_approval') {
      return NextResponse.json({ error: "Task is already awaiting approval" }, { status: 400 });
    }

    // Update the task status
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'awaiting_approval',
        approvalStatus: 'pending',
        notes: message ? `${task.notes || ''}\n\nApproval request: ${message}` : task.notes,
      },
    });

    // Create a notification for the project manager
    try {
      await createTaskApprovalRequest(
        task.companyId,
        taskId,
        task.name,
        payload.id,
        `${payload.firstName} ${payload.lastName}`,
        task.project.projectManager.employeeId,
        task.project.name
      );
      console.log(`[REQUEST_TASK_APPROVAL] Notification sent to manager ${task.project.projectManager.employeeId}`);
    } catch (notificationError) {
      console.error('[REQUEST_TASK_APPROVAL] Failed to create notification:', notificationError);
      // Don't fail the entire request if notification fails
    }

    return NextResponse.json({
      message: "Task approval requested successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("[REQUEST_TASK_APPROVAL]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Respond to task approval request
async function respondToTaskApproval(req: Request) {
  try {
    const token = cookies().get('token')?.value;
    const isEmployee = cookies().get('isEmployee')?.value === 'true';

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyAuth(token);

    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await req.json();
    const validationResult = taskApprovalResponseSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({
        error: "Invalid input",
        details: validationResult.error.errors
      }, { status: 400 });
    }

    const { taskId, approved, comments } = validationResult.data;

    // Get the task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check if the employee is the project manager or has approval permissions
    const isManager = isEmployee && task.project.projectManager.employeeId === payload.id;
    const hasApprovalPermission = !isEmployee || (isEmployee && payload.role === 'admin' || payload.role === 'manager');

    if (!isManager && !hasApprovalPermission) {
      return NextResponse.json({ error: "You don't have permission to approve/reject this task" }, { status: 403 });
    }

    // Check if the task is awaiting approval
    if (task.status !== 'awaiting_approval') {
      return NextResponse.json({ error: "Task is not awaiting approval" }, { status: 400 });
    }

    // Update the task status
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: approved ? 'completed' : 'in_progress',
        approvalStatus: approved ? 'approved' : 'rejected',
        approvedById: payload.id,
        approvedByName: isEmployee ? `${payload.firstName} ${payload.lastName}` : 'Admin',
        approvedAt: new Date(),
        rejectionReason: !approved && comments ? comments : null,
        notes: comments ? `${task.notes || ''}\n\n${approved ? 'Approval' : 'Rejection'} comments: ${comments}` : task.notes,
      },
    });

    // Create a notification for the task assignee
    try {
      await createTaskApprovalResponse(
        task.companyId,
        taskId,
        task.name,
        payload.id,
        isEmployee ? `${payload.firstName} ${payload.lastName}` : 'Admin',
        task.assigneeId,
        task.project.name,
        approved,
        comments
      );
      console.log(`[RESPOND_TO_TASK_APPROVAL] Notification sent to assignee ${task.assigneeId}`);
    } catch (notificationError) {
      console.error('[RESPOND_TO_TASK_APPROVAL] Failed to create notification:', notificationError);
      // Don't fail the entire request if notification fails
    }

    return NextResponse.json({
      message: `Task ${approved ? 'approved' : 'rejected'} successfully`,
      task: updatedTask,
    });
  } catch (error) {
    console.error("[RESPOND_TO_TASK_APPROVAL]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Get tasks awaiting approval or recently approved
async function getTasksAwaitingApproval(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    const isEmployee = cookieStore.get('isEmployee')?.value === 'true';

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyAuth(token);

    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Parse URL to check for status parameter
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const isRecentQuery = status === 'recent';

    console.log("[GET_TASKS_APPROVAL] Request from:", payload.email, "Status:", status);

    // Get the company ID and employee information
    let companyId;
    let currentEmployee = null;

    // First try to get user by email (works for both admin users and employees)
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      include: { company: true }
    });

    if (user?.company) {
      companyId = user.company.id;

      // Try to find employee record for this user
      currentEmployee = await prisma.employee.findFirst({
        where: {
          email: payload.email,
          companyId: user.company.id
        }
      });

      console.log("[GET_TASKS_APPROVAL] User found:", user.email, "Employee:", currentEmployee?.id);
    } else if (isEmployee && payload.id) {
      // Fallback: try to find employee by ID if user lookup failed
      currentEmployee = await prisma.employee.findUnique({
        where: { id: payload.id },
        select: { companyId: true, id: true, email: true, firstName: true, lastName: true },
      });

      if (currentEmployee) {
        companyId = currentEmployee.companyId;
        console.log("[GET_TASKS_APPROVAL] Employee found by ID:", currentEmployee.id);
      }
    }

    if (!companyId) {
      console.error("[GET_TASKS_APPROVAL] No company found for user:", payload.email);
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Get tasks awaiting approval
    // If employee is a manager, get tasks from their projects
    // If user is admin, get all tasks awaiting approval
    let tasks;

    if (currentEmployee) {
      console.log("[GET_TASKS_APPROVAL] Employee requesting tasks, ID:", currentEmployee.id);

      // Get all projects for the company
      const allProjects = await prisma.project.findMany({
        where: {
          companyId: companyId || undefined,
        },
        select: {
          id: true,
          name: true,
          projectManager: true,
        },
      });

      console.log("[GET_TASKS_APPROVAL] Total projects found:", allProjects.length);

      // Filter to find projects where the employee is the manager
      const managedProjects = allProjects.filter(
        project => project.projectManager.employeeId === currentEmployee.id
      );

      console.log("[GET_TASKS_APPROVAL] Managed projects:", managedProjects.length);

      const managedProjectIds = managedProjects.map(project => project.id);

      // Get tasks based on status parameter
      const whereCondition = {
        companyId: companyId || undefined,
        projectId: {
          in: managedProjectIds,
        },
        ...(isRecentQuery
          ? {
              OR: [
                { status: 'completed', approvalStatus: 'approved' },
                { status: 'in_progress', approvalStatus: 'rejected' }
              ]
            }
          : { status: 'awaiting_approval' }
        )
      };

      tasks = await prisma.task.findMany({
        where: whereCondition,
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          priority: true,
          assigneeId: true,
          assigneeName: true,
          dueDate: true,
          completionPercentage: true,
          projectId: true,
          updatedAt: true,
          approvalStatus: true,
          approvedAt: true,
          approvedById: true,
          approvedByName: true,
          rejectionReason: true,
          createdAt: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        ...(isRecentQuery && { take: 20 }) // Limit recent tasks to 20
      });

      console.log("[GET_TASKS_APPROVAL] Tasks awaiting approval for manager:", tasks.length);

      // Add project names to tasks
      tasks = tasks.map(task => {
        const project = allProjects.find(p => p.id === task.projectId);
        return {
          ...task,
          projectName: project?.name || 'Unknown Project'
        };
      });
    } else {
      console.log("[GET_TASKS_APPROVAL] Admin requesting all tasks");

      // Admin or regular user - get tasks based on status parameter
      const whereCondition = {
        companyId: companyId || undefined,
        ...(isRecentQuery
          ? {
              OR: [
                { status: 'completed', approvalStatus: 'approved' },
                { status: 'in_progress', approvalStatus: 'rejected' }
              ]
            }
          : { status: 'awaiting_approval' }
        )
      };

      tasks = await prisma.task.findMany({
        where: whereCondition,
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          priority: true,
          assigneeId: true,
          assigneeName: true,
          dueDate: true,
          completionPercentage: true,
          projectId: true,
          updatedAt: true,
          approvalStatus: true,
          approvedAt: true,
          approvedById: true,
          approvedByName: true,
          rejectionReason: true,
          createdAt: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        ...(isRecentQuery && { take: 20 }) // Limit recent tasks to 20
      });

      console.log(`[GET_TASKS_APPROVAL] All tasks ${isRecentQuery ? 'recently processed' : 'awaiting approval'}:`, tasks.length);

      // Get project names for the tasks
      const projectIds = tasks.map(task => task.projectId).filter(id => id !== null);
      const projects = await prisma.project.findMany({
        where: {
          id: {
            in: projectIds,
          },
        },
        select: {
          id: true,
          name: true,
        },
      });

      // Add project names to tasks
      tasks = tasks.map(task => {
        const project = projects.find(p => p.id === task.projectId);
        return {
          ...task,
          projectName: project?.name || 'Unknown Project'
        };
      });
    }

    // Format the tasks for the response (project names already added above)
    const formattedTasks = tasks.map(task => ({
      id: task.id,
      name: task.name,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assigneeName: task.assigneeName,
      assigneeId: task.assigneeId,
      projectName: task.projectName || 'Unknown Project',
      completionPercentage: task.completionPercentage || 0,
      dueDate: task.dueDate,
      requestedAt: task.createdAt || task.updatedAt, // Use createdAt as issue date
      // Additional fields for recently approved/rejected tasks
      ...(isRecentQuery && {
        approvalStatus: task.approvalStatus,
        approvedAt: task.approvedAt,
        approvedBy: task.approvedByName || 'Unknown',
        approvedById: task.approvedById,
        rejectionReason: task.rejectionReason,
      })
    }));

    console.log(`[GET_TASKS_APPROVAL] Returning formatted tasks (${isRecentQuery ? 'recent' : 'pending'}):`, formattedTasks.length);

    return NextResponse.json({
      tasks: formattedTasks,
      type: isRecentQuery ? 'recent' : 'pending'
    });
  } catch (error) {
    console.error("[GET_TASKS_AWAITING_APPROVAL]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Export the handlers - removing permission wrapper for GET to allow broader access
export const GET = getTasksAwaitingApproval;
export const POST = requestTaskApproval;
export const PATCH = withPermission(respondToTaskApproval, PERMISSIONS.APPROVE_TASKS);
