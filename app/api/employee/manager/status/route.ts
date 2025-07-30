import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const token = cookies().get('token')?.value;
    const isEmployee = cookies().get('isEmployee')?.value === 'true';

    if (!token || !isEmployee) {
      return NextResponse.json({ 
        isManager: false,
        managedProjects: [],
        totalManagedProjects: 0,
        totalPendingApprovals: 0
      });
    }

    const payload = await verifyAuth(token);
    if (!payload?.email) {
      return NextResponse.json({ 
        isManager: false,
        managedProjects: [],
        totalManagedProjects: 0,
        totalPendingApprovals: 0
      });
    }

    // Get user and company information
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      include: { company: true }
    });

    if (!user?.company) {
      return NextResponse.json({ 
        isManager: false,
        managedProjects: [],
        totalManagedProjects: 0,
        totalPendingApprovals: 0
      });
    }

    // Get employee record
    const employee = await prisma.employee.findFirst({
      where: {
        email: payload.email,
        companyId: user.company.id
      }
    });

    if (!employee) {
      return NextResponse.json({ 
        isManager: false,
        managedProjects: [],
        totalManagedProjects: 0,
        totalPendingApprovals: 0
      });
    }

    // Get all projects for the company
    const allProjects = await prisma.project.findMany({
      where: {
        companyId: user.company.id
      },
      include: {
        tasks: {
          select: {
            id: true,
            status: true,
            assigneeId: true
          }
        }
      }
    });

    // Filter projects where this employee is the manager
    const managedProjects = allProjects.filter(
      project => project.projectManager.employeeId === employee.id
    );

    // Calculate statistics for managed projects
    let totalPendingApprovals = 0;
    const managedProjectsData = managedProjects.map(project => {
      const teamMembersCount = project.teamMembers.length;
      const pendingTasks = project.tasks.filter(task => task.status === 'awaiting_approval');
      const pendingTasksCount = pendingTasks.length;
      
      totalPendingApprovals += pendingTasksCount;

      return {
        id: project.id,
        name: project.name,
        status: project.status,
        teamMembersCount,
        pendingTasksCount
      };
    });

    const isManager = managedProjects.length > 0;

    console.log(`[MANAGER_STATUS] Employee ${employee.id} is ${isManager ? '' : 'not '}a manager of ${managedProjects.length} projects`);

    return NextResponse.json({
      isManager,
      managedProjects: managedProjectsData,
      totalManagedProjects: managedProjects.length,
      totalPendingApprovals,
      employee: {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        role: employee.role
      }
    });

  } catch (error) {
    console.error('[MANAGER_STATUS_GET]', error);
    return NextResponse.json({ 
      isManager: false,
      managedProjects: [],
      totalManagedProjects: 0,
      totalPendingApprovals: 0,
      error: "Internal server error" 
    }, { status: 500 });
  }
}
