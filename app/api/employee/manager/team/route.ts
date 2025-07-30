import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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

// GET - Get team members for projects managed by this manager
export async function GET(req: Request) {
  try {
    const { employee, companyId } = await getManagerEmployee();
    
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId');

    if (projectId) {
      // Get team members for a specific project
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          companyId
        }
      });

      // Check if the current employee is the project manager
      if (!project || project.projectManager.employeeId !== employee.id) {
        return NextResponse.json(
          { error: "Project not found or you don't have permission to access it" },
          { status: 404 }
        );
      }



      // Get team member details
      const teamMemberIds = project.teamMembers?.map((member: any) => member.employeeId) || [];

      // Include project manager in the team
      if (project.projectManager.employeeId && !teamMemberIds.includes(project.projectManager.employeeId)) {
        teamMemberIds.push(project.projectManager.employeeId);
      }

      const teamMembers = await prisma.employee.findMany({
        where: {
          id: { in: teamMemberIds },
          companyId
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          position: true,
          department: {
            select: {
              name: true
            }
          },
          role: true
        }
      });

      // Get task counts for each team member
      const teamMembersWithStats = await Promise.all(
        teamMembers.map(async (member) => {
          const tasks = await prisma.task.findMany({
            where: {
              assigneeId: member.id,
              projectId: projectId,
              companyId
            },
            select: {
              id: true,
              status: true,
              dueDate: true
            }
          });

          const completedTasks = tasks.filter(task => task.status === 'completed').length;
          const pendingTasks = tasks.filter(task => 
            task.status === 'in_progress' || task.status === 'not_started'
          ).length;
          const awaitingApproval = tasks.filter(task => task.status === 'awaiting_approval').length;
          const overdueTasks = tasks.filter(task => 
            new Date(task.dueDate) < new Date() && task.status !== 'completed'
          ).length;

          // Find role in project
          const projectRole = project.teamMembers?.find((tm: any) => tm.employeeId === member.id)?.role ||
                             (project.projectManager.employeeId === member.id ? 'Project Manager' : 'Team Member');

          return {
            employeeId: member.id,
            name: `${member.firstName} ${member.lastName}`,
            email: member.email,
            position: member.position,
            department: member.department?.name,
            role: projectRole,
            isManager: project.projectManager.employeeId === member.id,
            taskStats: {
              total: tasks.length,
              completed: completedTasks,
              pending: pendingTasks,
              awaitingApproval,
              overdue: overdueTasks,
              workload: tasks.length
            }
          };
        })
      );

      return NextResponse.json({
        projectId,
        projectName: project.name,
        teamMembers: teamMembersWithStats,
        managerId: employee.id
      });

    } else {
      // Get all team members across all managed projects
      const managedProjects = await prisma.project.findMany({
        where: {
          companyId
        }
      });

      // Filter projects where the current employee is the manager
      const filteredProjects = managedProjects.filter(project =>
        project.projectManager.employeeId === employee.id
      );

      if (filteredProjects.length === 0) {
        return NextResponse.json({
          teamMembers: [],
          projects: [],
          message: 'No managed projects found'
        });
      }

      // Collect all unique team member IDs across projects
      const allTeamMemberIds = new Set<string>();
      
      filteredProjects.forEach(project => {
        project.teamMembers?.forEach((member: any) => {
          allTeamMemberIds.add(member.employeeId);
        });
        
        // Include project manager
        if (project.projectManager.employeeId) {
          allTeamMemberIds.add(project.projectManager.employeeId);
        }
      });

      const allTeamMembers = await prisma.employee.findMany({
        where: {
          id: { in: Array.from(allTeamMemberIds) },
          companyId
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          position: true,
          department: {
            select: {
              name: true
            }
          },
          role: true
        }
      });

      // Get overall task statistics for each team member
      const teamMembersWithOverallStats = await Promise.all(
        allTeamMembers.map(async (member) => {
          const tasks = await prisma.task.findMany({
            where: {
              assigneeId: member.id,
              projectId: { in: filteredProjects.map(p => p.id) },
              companyId
            },
            select: {
              id: true,
              status: true,
              dueDate: true,
              projectId: true
            }
          });

          const completedTasks = tasks.filter(task => task.status === 'completed').length;
          const pendingTasks = tasks.filter(task => 
            task.status === 'in_progress' || task.status === 'not_started'
          ).length;
          const awaitingApproval = tasks.filter(task => task.status === 'awaiting_approval').length;
          const overdueTasks = tasks.filter(task => 
            new Date(task.dueDate) < new Date() && task.status !== 'completed'
          ).length;

          // Get projects where this member is assigned
          const memberProjects = filteredProjects.filter(project =>
            project.teamMembers?.some((tm: any) => tm.employeeId === member.id) ||
            project.projectManager.employeeId === member.id
          );

          return {
            employeeId: member.id,
            name: `${member.firstName} ${member.lastName}`,
            email: member.email,
            position: member.position,
            department: member.department?.name,
            role: member.role,
            projects: memberProjects.map(p => ({ id: p.id, name: p.name })),
            taskStats: {
              total: tasks.length,
              completed: completedTasks,
              pending: pendingTasks,
              awaitingApproval,
              overdue: overdueTasks,
              workload: tasks.length
            }
          };
        })
      );

      return NextResponse.json({
        teamMembers: teamMembersWithOverallStats,
        projects: filteredProjects.map(p => ({ id: p.id, name: p.name })),
        managerId: employee.id
      });
    }

  } catch (error) {
    console.error('Error fetching team members:', error);
    if ((error as Error).message === 'Unauthorized') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    if ((error as Error).message.includes('not found')) {
      return new NextResponse((error as Error).message, { status: 404 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
