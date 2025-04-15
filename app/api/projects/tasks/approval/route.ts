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
        project: {
          select: {
            name: true,
            managerId: true,
            managerName: true,
          },
        },
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
      task.project.managerId,
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
        project: {
          select: {
            name: true,
            managerId: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check if the employee is the project manager or has approval permissions
    const isManager = isEmployee && task.project.managerId === payload.id;
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

// Export the handlers with permission checks
export const POST = requestTaskApproval;
export const PATCH = withPermission(respondToTaskApproval, PERMISSIONS.APPROVE_TASKS);
