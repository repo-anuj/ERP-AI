import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const token = cookies().get('token')?.value;

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload.email) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || 'month';
    const employeeId = searchParams.get('employeeId');

    let employee;
    let companyId;

    // Check if this is an employee token
    if (payload.isEmployee) {
      employee = await prisma.employee.findUnique({
        where: { id: payload.id },
        include: {
          company: true,
          department: true
        }
      });

      if (!employee?.company) {
        return new NextResponse('Employee or company not found', { status: 404 });
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

      if (employeeId) {
        employee = await prisma.employee.findFirst({
          where: {
            id: employeeId,
            companyId: user.company.id
          },
          include: {
            department: true
          }
        });
      } else {
        employee = await prisma.employee.findFirst({
          where: {
            email: payload.email,
            companyId: user.company.id
          },
          include: {
            department: true
          }
        });
      }

      if (!employee) {
        return new NextResponse('Employee not found', { status: 404 });
      }

      companyId = user.company.id;
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default: // month
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get all tasks for the employee in the time range
    const tasks = await prisma.task.findMany({
      where: {
        assigneeId: employee.id,
        companyId,
        createdAt: {
          gte: startDate
        }
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate basic metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const overdueTasks = tasks.filter(t => 
      new Date(t.dueDate) < now && t.status !== 'completed'
    ).length;

    // Calculate average completion time
    const completedTasksWithTime = tasks.filter(t => 
      t.status === 'completed' && t.actualHours && t.actualHours > 0
    );
    const averageCompletionTime = completedTasksWithTime.length > 0
      ? Math.round(completedTasksWithTime.reduce((sum, t) => sum + (t.actualHours || 0), 0) / completedTasksWithTime.length)
      : 0;

    // Calculate productivity score (0-100)
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const onTimeRate = totalTasks > 0 ? ((totalTasks - overdueTasks) / totalTasks) * 100 : 100;
    const productivityScore = Math.round((completionRate * 0.6) + (onTimeRate * 0.4));

    // Weekly progress data
    const weeklyProgress = [];
    for (let i = 6; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const weekTasks = tasks.filter(t => 
        new Date(t.createdAt) >= weekStart && new Date(t.createdAt) < weekEnd
      );
      
      const weekCompleted = weekTasks.filter(t => t.status === 'completed').length;
      
      weeklyProgress.push({
        week: `Week ${7 - i}`,
        completed: weekCompleted,
        assigned: weekTasks.length
      });
    }

    // Priority distribution
    const priorityDistribution = [
      {
        priority: 'Urgent',
        count: tasks.filter(t => t.priority === 'urgent').length,
        color: '#ef4444'
      },
      {
        priority: 'High',
        count: tasks.filter(t => t.priority === 'high').length,
        color: '#f97316'
      },
      {
        priority: 'Medium',
        count: tasks.filter(t => t.priority === 'medium').length,
        color: '#eab308'
      },
      {
        priority: 'Low',
        count: tasks.filter(t => t.priority === 'low').length,
        color: '#22c55e'
      }
    ];

    // Project performance
    const projectMap = new Map();
    tasks.forEach(task => {
      const projectId = task.project?.id;
      const projectName = task.project?.name || 'Unknown Project';
      
      if (!projectMap.has(projectId)) {
        projectMap.set(projectId, {
          project: projectName,
          total: 0,
          completed: 0,
          totalHours: 0,
          actualHours: 0
        });
      }
      
      const project = projectMap.get(projectId);
      project.total++;
      project.totalHours += task.estimatedHours || 0;
      project.actualHours += task.actualHours || 0;
      
      if (task.status === 'completed') {
        project.completed++;
      }
    });

    const projectPerformance = Array.from(projectMap.values()).map(project => ({
      project: project.project,
      completion: project.total > 0 ? Math.round((project.completed / project.total) * 100) : 0,
      efficiency: project.totalHours > 0 ? Math.round((project.totalHours / Math.max(project.actualHours, 1)) * 100) : 100
    }));

    // Time tracking data (last 7 days)
    const timeTracking = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayTasks = tasks.filter(t => {
        const taskDate = new Date(t.createdAt);
        return taskDate.toDateString() === date.toDateString();
      });
      
      const estimated = dayTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
      const actual = dayTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
      
      timeTracking.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        estimated,
        actual
      });
    }

    const analytics = {
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      averageCompletionTime,
      productivityScore,
      weeklyProgress,
      priorityDistribution,
      projectPerformance,
      timeTracking
    };

    return NextResponse.json({
      analytics,
      employee: {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        position: employee.position,
        department: employee.department?.name || 'Unassigned'
      },
      timeRange,
      dateRange: {
        start: startDate.toISOString(),
        end: now.toISOString()
      }
    });

  } catch (error) {
    console.error('[EMPLOYEE_ANALYTICS_TASKS] Error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
