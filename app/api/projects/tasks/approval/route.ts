import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import { createTaskApprovalRequest, createTaskApprovalResponse } from "@/lib/notification-service";
import { z } from "zod";

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
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const isEmployee = cookieStore.get('isEmployee')?.value === 'true';

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
    await createTaskApprovalRequest(
      task.companyId,
      taskId,
      task.name,
      payload.id,
      `${payload.firstName} ${payload.lastName}`,
      task.project.projectManager.employeeId,
      task.project.name
    );

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
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const isEmployee = cookieStore.get('isEmployee')?.value === 'true';

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

    return NextResponse.json({
      message: `Task ${approved ? 'approved' : 'rejected'} successfully`,
      task: updatedTask,
    });
  } catch (error) {
    console.error("[RESPOND_TO_TASK_APPROVAL]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Get tasks awaiting approval
async function getTasksAwaitingApproval(_req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const isEmployee = cookieStore.get('isEmployee')?.value === 'true';

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyAuth(token);

    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get the company ID
    let companyId;

    if (isEmployee) {
      const employee = await prisma.employee.findUnique({
        where: { id: payload.id },
        select: { companyId: true },
      });

      if (!employee) {
        return NextResponse.json({ error: "Employee not found" }, { status: 404 });
      }

      companyId = employee.companyId;
    } else {
      const user = await prisma.user.findUnique({
        where: { email: payload.email },
        select: { companyId: true },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      companyId = user.companyId;
    }

    // Get tasks awaiting approval
    // If employee is a manager, get tasks from their projects
    // If user is admin, get all tasks awaiting approval
    let tasks;

    if (isEmployee) {
      // Get all projects for the company
      const allProjects = await prisma.project.findMany({
        where: {
          companyId: companyId || undefined,
        },
        select: {
          id: true,
          projectManager: true,
        },
      });

      // Filter to find projects where the employee is the manager
      const managedProjects = allProjects.filter(
        project => project.projectManager.employeeId === payload.id
      );

      const managedProjectIds = managedProjects.map(project => project.id);

      // Get tasks awaiting approval from managed projects
      tasks = await prisma.task.findMany({
        where: {
          companyId: companyId || undefined,
          projectId: {
            in: managedProjectIds,
          },
          status: 'awaiting_approval',
        },
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
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      // Project names will be handled later
    } else {
      // Admin or regular user - get all tasks awaiting approval
      tasks = await prisma.task.findMany({
        where: {
          companyId: companyId || undefined,
          status: 'awaiting_approval',
        },
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
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

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

      // Project names will be handled later
    }

    // Combine both project name maps
    const projectNameMap = new Map();

    // Get all project IDs from tasks
    const allProjectIds = tasks.map(task => task.projectId);

    // Get all projects for these IDs
    const allProjects = await prisma.project.findMany({
      where: {
        id: {
          in: allProjectIds,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Create a map of project IDs to names
    allProjects.forEach(project => {
      projectNameMap.set(project.id, project.name);
    });

    // Format the tasks for the response
    const formattedTasks = tasks.map(task => ({
      id: task.id,
      name: task.name,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assigneeName: task.assigneeName,
      projectName: projectNameMap.get(task.projectId) || 'Unknown Project',
      completionPercentage: task.completionPercentage || 0,
      dueDate: task.dueDate,
      requestedAt: task.updatedAt,
    }));

    return NextResponse.json({
      tasks: formattedTasks,
    });
  } catch (error) {
    console.error("[GET_TASKS_AWAITING_APPROVAL]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Export the handlers with permission checks
export const GET = withPermission(getTasksAwaitingApproval, PERMISSIONS.APPROVE_TASKS);
export const POST = requestTaskApproval;
export const PATCH = withPermission(respondToTaskApproval, PERMISSIONS.APPROVE_TASKS);
