import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    projectId: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const token = cookies().get('token')?.value;

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload.email) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    const { projectId } = params;

    let employee;
    let companyId;

    // Check if this is an employee token
    if (payload.isEmployee) {
      // For employee tokens, get employee directly from payload
      employee = await prisma.employee.findUnique({
        where: { id: payload.id },
        include: { company: true }
      });

      if (!employee) {
        return new NextResponse('Employee not found', { status: 404 });
      }

      if (!employee.company) {
        return new NextResponse('Company not found', { status: 404 });
      }

      companyId = employee.company.id;
    } else {
      // For regular user tokens, get user and then employee record
      const user = await prisma.user.findUnique({
        where: { email: payload.email },
        include: { company: true }
      });

      if (!user?.company) {
        return new NextResponse('Company not found', { status: 404 });
      }

      // Get employee record
      employee = await prisma.employee.findFirst({
        where: {
          email: payload.email,
          companyId: user.company.id
        }
      });

      if (!employee) {
        return new NextResponse('Employee not found', { status: 404 });
      }

      companyId = user.company.id;
    }

    // Get project details
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        companyId: companyId
      }
    });

    if (!project) {
      return new NextResponse('Project not found', { status: 404 });
    }

    // Check if employee is part of the project
    const isManager = project.projectManager.employeeId === employee.id;
    const isTeamMember = project.teamMembers.some((member: any) => member.employeeId === employee.id);

    if (!isManager && !isTeamMember) {
      return new NextResponse('Access denied - not a project member', { status: 403 });
    }

    // Get tasks based on role - managers see all tasks, employees see only their tasks
    const taskFilter: any = {
      projectId: projectId,
      companyId: companyId
    };

    if (!isManager) {
      // Regular employees only see their assigned tasks
      taskFilter.assigneeId = employee.id;
    }

    const projectTasks = await prisma.task.findMany({
      where: taskFilter,
      orderBy: {
        dueDate: 'asc'
      }
    });

    // Get project manager details
    const projectManager = await prisma.employee.findUnique({
      where: { id: project.projectManager.employeeId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true
      }
    });

    // Get team member details
    const teamMemberIds = project.teamMembers.map((member: any) => member.employeeId);
    const teamMemberDetails = await prisma.employee.findMany({
      where: {
        id: { in: teamMemberIds },
        companyId: companyId
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        position: true
      }
    });

    // Calculate project statistics
    const employeeTasks = isManager ? projectTasks : projectTasks.filter(task => task.assigneeId === employee.id);
    const allTasks = projectTasks;

    const completedTasks = employeeTasks.filter(task => task.status === 'completed').length;
    const pendingTasks = employeeTasks.filter(task =>
      task.status === 'in_progress' || task.status === 'not_started'
    ).length;
    const awaitingApproval = employeeTasks.filter(task => task.status === 'awaiting_approval').length;
    const overdueTasks = employeeTasks.filter(task =>
      new Date(task.dueDate) < new Date() && task.status !== 'completed'
    ).length;

    // Calculate employee's progress in the project
    const employeeProgress = employeeTasks.length > 0
      ? Math.round((completedTasks / employeeTasks.length) * 100)
      : 0;

    // Determine employee's role in the project
    let employeeRole = 'Team Member';
    if (isManager) {
      employeeRole = 'Project Manager';
    } else {
      const memberInfo = project.teamMembers.find((member: any) => member.employeeId === employee.id);
      if (memberInfo?.role) {
        employeeRole = memberInfo.role;
      }
    }

    // Format the response
    const formattedProject = {
      id: project.id,
      name: project.name,
      description: project.description,
      type: project.type,
      status: project.status,
      priority: project.priority,
      startDate: project.startDate.toISOString(),
      endDate: project.endDate.toISOString(),
      progress: project.completionPercentage,
      employeeProgress,
      role: employeeRole,
      isManager,
      projectManager: {
        employeeId: project.projectManager.employeeId,
        name: project.projectManager.name,
        role: project.projectManager.role,
        department: project.projectManager.department,
        employee: projectManager // Keep for backward compatibility
      },
      teamMembers: project.teamMembers.map((member: any) => {
        const memberDetail = teamMemberDetails.find(detail => detail.id === member.employeeId);
        return {
          employeeId: member.employeeId,
          name: member.name,
          role: member.role || memberDetail?.position || 'Team Member',
          email: memberDetail?.email,
          position: memberDetail?.position
        };
      }),
      tasks: (isManager ? allTasks : employeeTasks).map(task => ({
        id: task.id,
        name: task.name,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate.toISOString(),
        startDate: task.startDate.toISOString(),
        completionPercentage: task.completionPercentage,
        estimatedHours: task.estimatedHours,
        actualHours: task.actualHours,
        assigneeId: task.assigneeId,
        assigneeName: task.assigneeName,
        approvalStatus: task.approvalStatus,
        notes: task.notes
      })),
      statistics: {
        totalTasks: employeeTasks.length,
        completedTasks,
        pendingTasks,
        awaitingApproval,
        overdueTasks,
        employeeProgress
      },
      budget: project.budget,
      expenses: project.expenses,
      tags: project.tags,
      notes: project.notes,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString()
    };

    return NextResponse.json({
      project: formattedProject,
      employee: {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        email: employee.email,
        role: employeeRole,
        isManager
      }
    });

  } catch (error) {
    console.error('[EMPLOYEE_PROJECT_DETAIL_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const token = cookies().get('token')?.value;

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload.email) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    const { projectId } = params;
    const body = await request.json();
    const { action, data } = body;

    let employee;
    let companyId;

    // Check if this is an employee token
    if (payload.isEmployee) {
      // For employee tokens, get employee directly from payload
      employee = await prisma.employee.findUnique({
        where: { id: payload.id },
        include: { company: true }
      });

      if (!employee) {
        return new NextResponse('Employee not found', { status: 404 });
      }

      if (!employee.company) {
        return new NextResponse('Company not found', { status: 404 });
      }

      companyId = employee.company.id;
    } else {
      // For regular user tokens, get user and then employee record
      const user = await prisma.user.findUnique({
        where: { email: payload.email },
        include: { company: true }
      });

      if (!user?.company) {
        return new NextResponse('Company not found', { status: 404 });
      }

      // Get employee record
      employee = await prisma.employee.findFirst({
        where: {
          email: payload.email,
          companyId: user.company.id
        }
      });

      if (!employee) {
        return new NextResponse('Employee not found', { status: 404 });
      }

      companyId = user.company.id;
    }

    // Get project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        companyId: companyId
      }
    });

    if (!project) {
      return new NextResponse('Project not found', { status: 404 });
    }

    // Check if employee is part of the project
    const isManager = project.projectManager.employeeId === employee.id;
    const isTeamMember = project.teamMembers.some((member: any) => member.employeeId === employee.id);

    if (!isManager && !isTeamMember) {
      return new NextResponse('Access denied - not a project member', { status: 403 });
    }

    // Handle different actions
    switch (action) {
      case 'update_task_progress':
        const { taskId, progress, notes } = data;
        
        const task = await prisma.task.findFirst({
          where: {
            id: taskId,
            projectId: projectId,
            assigneeId: employee.id
          }
        });

        if (!task) {
          return NextResponse.json({ error: 'Task not found or not assigned to you' }, { status: 404 });
        }

        const updatedTask = await prisma.task.update({
          where: { id: taskId },
          data: {
            completionPercentage: progress,
            notes: notes || task.notes,
            status: progress === 100 ? 'awaiting_approval' : 'in_progress',
            updatedAt: new Date()
          }
        });

        return NextResponse.json({
          message: 'Task progress updated successfully',
          task: updatedTask
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('[EMPLOYEE_PROJECT_DETAIL_PUT]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
