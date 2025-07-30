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
      console.error("[EMPLOYEE_PROJECTS_GET] No token provided");
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);

    if (!payload.email) {
      console.error("[EMPLOYEE_PROJECTS_GET] Invalid token - no email");
      return new NextResponse('Invalid token', { status: 401 });
    }

    console.log("[EMPLOYEE_PROJECTS_GET] Request from:", payload.email);
    console.log("[EMPLOYEE_PROJECTS_GET] Token payload:", { ...payload, password: undefined });

    let employee;
    let companyId;

    // Check if this is an employee token
    if (payload.isEmployee) {
      console.log("[EMPLOYEE_PROJECTS_GET] Processing employee token");
      // For employee tokens, get employee directly from payload
      employee = await prisma.employee.findUnique({
        where: { id: payload.id },
        include: {
          company: true,
          department: true
        }
      });

      if (!employee) {
        console.error("[EMPLOYEE_PROJECTS_GET] Employee not found for ID:", payload.id);
        return new NextResponse('Employee not found', { status: 404 });
      }

      if (!employee.company) {
        console.error("[EMPLOYEE_PROJECTS_GET] Company not found for employee:", payload.email);
        return new NextResponse('Company not found', { status: 404 });
      }

      companyId = employee.company.id;
      console.log("[EMPLOYEE_PROJECTS_GET] Employee found:", employee.id, "Company:", employee.company.name);
    } else {
      console.log("[EMPLOYEE_PROJECTS_GET] Processing user token");
      // For regular user tokens, get user and then employee record
      const user = await prisma.user.findUnique({
        where: { email: payload.email },
        include: { company: true }
      });

      if (!user?.company) {
        console.error("[EMPLOYEE_PROJECTS_GET] Company not found for user:", payload.email);
        return new NextResponse('Company not found', { status: 404 });
      }

      // Get employee record
      employee = await prisma.employee.findFirst({
        where: {
          email: payload.email,
          companyId: user.company.id
        },
        include: {
          department: true
        }
      });

      if (!employee) {
        console.error("[EMPLOYEE_PROJECTS_GET] Employee record not found");
        return new NextResponse('Employee not found', { status: 404 });
      }

      companyId = user.company.id;
      console.log("[EMPLOYEE_PROJECTS_GET] Employee found:", employee.id);
    }

    // Get all projects for the company first, then filter in memory
    // This is because projectManager and teamMembers are embedded types, not relations
    const allProjects = await prisma.project.findMany({
      where: {
        companyId: companyId
      },
      include: {
        tasks: {
          where: {
            assigneeId: employee.id
          },
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            priority: true,
            dueDate: true,
            startDate: true,
            completionPercentage: true,
            estimatedHours: true,
            actualHours: true,
            approvalStatus: true,
            notes: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Filter projects where employee is assigned (either as manager or team member)
    const projects = allProjects.filter(project => {
      const isManager = project.projectManager?.employeeId === employee.id;
      const isTeamMember = project.teamMembers?.some((member: any) => member.employeeId === employee.id);
      return isManager || isTeamMember;
    });

    console.log("[EMPLOYEE_PROJECTS_GET] Projects found:", projects.length);

    // Format projects for employee dashboard
    const formattedProjects = projects.map(project => {
      const isManager = project.projectManager?.employeeId === employee.id;
      const employeeTasks = project.tasks;
      const completedTasks = employeeTasks.filter(task => task.status === 'completed').length;
      const pendingTasks = employeeTasks.filter(task =>
        task.status === 'in_progress' || task.status === 'not_started'
      ).length;
      const awaitingApprovalTasks = employeeTasks.filter(task => task.status === 'awaiting_approval').length;
      const overdueTasks = employeeTasks.filter(task =>
        new Date(task.dueDate) < new Date() && task.status !== 'completed'
      ).length;
      const urgentTasks = employeeTasks.filter(task => task.priority === 'urgent' || task.priority === 'high').length;

      // Calculate project progress based on employee's tasks
      const progress = employeeTasks.length > 0
        ? Math.round((completedTasks / employeeTasks.length) * 100)
        : 0;

      // Get upcoming tasks (due within 7 days)
      const upcomingTasks = employeeTasks.filter(task => {
        const daysUntilDue = Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilDue >= 0 && daysUntilDue <= 7 && task.status !== 'completed';
      });

      // Format tasks for display
      const formattedTasks = employeeTasks.map(task => ({
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
        approvalStatus: task.approvalStatus,
        notes: task.notes,
        isOverdue: new Date(task.dueDate) < new Date() && task.status !== 'completed',
        daysUntilDue: Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      }));

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
        startDate: project.startDate,
        endDate: project.endDate,
        dueDate: project.endDate,
        progress,
        role: isManager ? 'Project Manager' : 'Team Member',
        tasksTotal: employeeTasks.length,
        tasksCompleted: completedTasks,
        tasksPending: pendingTasks,
        tasksAwaitingApproval: awaitingApprovalTasks,
        tasksOverdue: overdueTasks,
        tasksUrgent: urgentTasks,
        upcomingTasks: upcomingTasks.length,
        myTasks: formattedTasks.slice(0, 5), // Include top 5 tasks for preview
        allMyTasks: formattedTasks, // Include all tasks for detailed view
        projectManager: {
          employeeId: project.projectManager?.employeeId,
          name: project.projectManager?.name,
          role: project.projectManager?.role,
          department: project.projectManager?.department
        },
        teamSize: project.teamMembers?.length || 0,
        budget: project.budget
      };
    });

    // Calculate summary statistics
    const stats = {
      totalProjects: formattedProjects.length,
      activeProjects: formattedProjects.filter(p => p.status === 'in_progress').length,
      completedProjects: formattedProjects.filter(p => p.status === 'completed').length,
      managedProjects: formattedProjects.filter(p => p.role === 'Project Manager').length,
      totalTasks: formattedProjects.reduce((sum, p) => sum + p.tasksTotal, 0),
      completedTasks: formattedProjects.reduce((sum, p) => sum + p.tasksCompleted, 0),
      overdueTasks: formattedProjects.reduce((sum, p) => sum + p.tasksOverdue, 0),
      averageProgress: formattedProjects.length > 0 
        ? Math.round(formattedProjects.reduce((sum, p) => sum + p.progress, 0) / formattedProjects.length)
        : 0
    };

    console.log("[EMPLOYEE_PROJECTS_GET] Returning projects with stats");

    return NextResponse.json({
      projects: formattedProjects,
      stats,
      employee: {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        position: employee.position,
        department: employee.department?.name
      }
    });

  } catch (error) {
    console.error('[EMPLOYEE_PROJECTS_GET] Error details:', error);
    
    if (error instanceof Error) {
      console.error('[EMPLOYEE_PROJECTS_GET] Error message:', error.message);
      console.error('[EMPLOYEE_PROJECTS_GET] Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
