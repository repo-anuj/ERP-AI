import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Schema for manager task assignment
const managerTaskSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  status: z.enum(["not_started", "in_progress"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  assigneeId: z.string(),
  startDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  estimatedHours: z.coerce.number().int().min(0),
  notes: z.string().optional(),
});

// Helper function to get manager employee record
async function getManagerEmployee() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;
  
  if (!token) {
    throw new Error('Unauthorized');
  }

  const payload = await verifyAuth(token);
  
  if (!payload.email || typeof payload.email !== 'string') {
    throw new Error('Invalid token');
  }

  let employee;
  let companyId;

  // Check if this is an employee token
  if (payload.isEmployee) {
    employee = await prisma.employee.findUnique({
      where: { id: payload.id },
      include: { company: true }
    });

    if (!employee?.company) {
      throw new Error('Employee or company not found');
    }

    companyId = employee.company.id;
  } else {
    // For regular user tokens, get user and then employee record
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      include: { company: true }
    });

    if (!user?.company) {
      throw new Error('Company not found');
    }

    employee = await prisma.employee.findFirst({
      where: {
        email: payload.email,
        companyId: user.company.id
      }
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    companyId = user.company.id;
  }

  return { employee, companyId };
}

// GET - Get all tasks for projects managed by this manager
export async function GET(req: Request) {
  try {
    const { employee, companyId } = await getManagerEmployee();
    
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId');
    const status = url.searchParams.get('status');
    const assigneeId = url.searchParams.get('assigneeId');

    // Get all projects where this employee is the manager
    const allProjects = await prisma.project.findMany({
      where: {
        companyId
      },
      select: {
        id: true,
        name: true,
        projectManager: true
      }
    });

    // Filter projects where the current employee is the manager
    const managedProjects = allProjects.filter(project =>
      project.projectManager?.employeeId === employee.id
    );

    if (managedProjects.length === 0) {
      return NextResponse.json({
        tasks: [],
        projects: [],
        message: 'No managed projects found'
      });
    }

    const managedProjectIds = managedProjects.map(p => p.id);

    // Build filter for tasks
    const taskFilter: any = {
      projectId: projectId ? projectId : { in: managedProjectIds },
      companyId
    };

    if (status) {
      taskFilter.status = status;
    }

    if (assigneeId) {
      taskFilter.assigneeId = assigneeId;
    }

    // Get tasks from managed projects
    const tasks = await prisma.task.findMany({
      where: taskFilter,
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { dueDate: 'asc' }
      ]
    });

    return NextResponse.json({
      tasks,
      projects: managedProjects,
      managerId: employee.id
    });

  } catch (error) {
    console.error('Error fetching manager tasks:', error);
    if ((error as Error).message === 'Unauthorized') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    if ((error as Error).message.includes('not found')) {
      return new NextResponse((error as Error).message, { status: 404 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST - Create and assign a new task as a manager
export async function POST(req: Request) {
  try {
    const { employee, companyId } = await getManagerEmployee();
    const data = await req.json();
    
    // Validate input data
    const validatedData = managerTaskSchema.parse(data);
    
    // Verify the project belongs to company and manager has permission
    const project = await prisma.project.findFirst({
      where: {
        id: validatedData.projectId,
        companyId
      },
      select: {
        id: true,
        name: true,
        projectManager: true,
        teamMembers: true
      }
    });

    // Check if the current employee is the project manager
    if (!project || project.projectManager?.employeeId !== employee.id) {
      return NextResponse.json(
        { error: "Project not found or you don't have permission to assign tasks to it" },
        { status: 404 }
      );
    }


    // Get assignee details
    const assignee = await prisma.employee.findFirst({
      where: {
        id: validatedData.assigneeId,
        companyId
      }
    });

    if (!assignee) {
      return NextResponse.json(
        { error: "Assignee not found" },
        { status: 404 }
      );
    }

    // Verify assignee is part of the project team
    const isTeamMember = project.teamMembers?.some((member: any) => member.employeeId === assignee.id);
    const isProjectManager = project.projectManager?.employeeId === assignee.id;

    if (!isTeamMember && !isProjectManager) {
      return NextResponse.json(
        { error: "Cannot assign task to employee who is not part of the project team" },
        { status: 400 }
      );
    }
    
    // Create the task
    const task = await prisma.task.create({
      data: {
        ...validatedData,
        assigneeName: `${assignee.firstName} ${assignee.lastName}`,
        actualHours: 0,
        completionPercentage: 0,
        dependencies: [],
        companyId
      }
    });

    // Log the assignment action
    console.log(`[MANAGER_TASK_ASSIGNMENT] Manager ${employee.id} assigned task ${task.id} to ${assignee.id} in project ${project.id}`);

    return NextResponse.json({
      task,
      message: `Task "${task.name}" successfully assigned to ${assignee.firstName} ${assignee.lastName}`
    });

  } catch (error) {
    console.error('Error creating manager task:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    if ((error as Error).message === 'Unauthorized') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    if ((error as Error).message.includes('not found')) {
      return new NextResponse((error as Error).message, { status: 404 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// PUT - Update task assignment (reassign task to different employee)
export async function PUT(req: Request) {
  try {
    const { employee, companyId } = await getManagerEmployee();
    const data = await req.json();
    const { taskId, assigneeId, notes } = data;

    if (!taskId || !assigneeId) {
      return NextResponse.json(
        { error: "Task ID and assignee ID are required" },
        { status: 400 }
      );
    }

    // Get the task and verify manager has permission
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        companyId
      },
      include: {
        project: true
      }
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    // Verify manager has permission to modify this task
    const isProjectManager = task.project.projectManager?.employeeId === employee.id;
    if (!isProjectManager) {
      return NextResponse.json(
        { error: "You don't have permission to modify this task" },
        { status: 403 }
      );
    }

    // Get new assignee details
    const newAssignee = await prisma.employee.findFirst({
      where: {
        id: assigneeId,
        companyId
      }
    });

    if (!newAssignee) {
      return NextResponse.json(
        { error: "New assignee not found" },
        { status: 404 }
      );
    }

    // Update the task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        assigneeId: newAssignee.id,
        assigneeName: `${newAssignee.firstName} ${newAssignee.lastName}`,
        notes: notes || task.notes,
        updatedAt: new Date()
      }
    });

    console.log(`[MANAGER_TASK_REASSIGNMENT] Manager ${employee.id} reassigned task ${taskId} to ${newAssignee.id}`);

    return NextResponse.json({
      task: updatedTask,
      message: `Task reassigned to ${newAssignee.firstName} ${newAssignee.lastName}`
    });

  } catch (error) {
    console.error('Error updating manager task:', error);
    if ((error as Error).message === 'Unauthorized') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
