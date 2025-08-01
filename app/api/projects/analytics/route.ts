import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Fetch comprehensive HRMS Project analytics data
export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload.email) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      include: { company: true }
    });

    if (!user?.companyId) {
      return new NextResponse('Company not found', { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30'; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));

    // Parallel data fetching for better performance
    const [
      projectStats,
      taskStats,
      teamStats,
      budgetStats,
      timelineStats,
      hrmsSpecificStats,
      recentActivities
    ] = await Promise.all([
      getProjectStats(user.companyId, startDate),
      getTaskStats(user.companyId, startDate),
      getTeamStats(user.companyId, startDate),
      getBudgetStats(user.companyId, startDate),
      getTimelineStats(user.companyId, startDate),
      getHRMSSpecificStats(user.companyId, startDate),
      getRecentActivities(user.companyId, startDate)
    ]);

    const analytics = {
      projectStats,
      taskStats,
      teamStats,
      budgetStats,
      timelineStats,
      hrmsSpecificStats,
      recentActivities,
      timeRange: parseInt(timeRange),
      generatedAt: new Date().toISOString()
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('[PROJECT_ANALYTICS_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Project Statistics
async function getProjectStats(companyId: string, startDate: Date) {
  const [totalProjects, activeProjects, completedProjects, newProjects] = await Promise.all([
    prisma.project.count({ where: { companyId } }),
    prisma.project.count({ where: { companyId, status: 'in_progress' } }),
    prisma.project.count({ where: { companyId, status: 'completed' } }),
    prisma.project.count({
      where: {
        companyId,
        createdAt: { gte: startDate }
      }
    })
  ]);

  const projectsByStatus = await prisma.project.groupBy({
    by: ['status'],
    where: { companyId },
    _count: { id: true }
  });

  const projectsByType = await prisma.project.groupBy({
    by: ['type'],
    where: { companyId },
    _count: { id: true }
  });

  const projectsByPriority = await prisma.project.groupBy({
    by: ['priority'],
    where: { companyId },
    _count: { id: true }
  });

  // Calculate average completion percentage
  const avgCompletion = await prisma.project.aggregate({
    where: { companyId },
    _avg: { completionPercentage: true }
  });

  return {
    totalProjects,
    activeProjects,
    completedProjects,
    newProjects,
    averageCompletion: Math.round(avgCompletion._avg.completionPercentage || 0),
    projectsByStatus: projectsByStatus.map(p => ({
      status: p.status,
      count: p._count.id
    })),
    projectsByType: projectsByType.map(p => ({
      type: p.type,
      count: p._count.id
    })),
    projectsByPriority: projectsByPriority.map(p => ({
      priority: p.priority,
      count: p._count.id
    }))
  };
}

// Task Statistics
async function getTaskStats(companyId: string, startDate: Date) {
  const [totalTasks, completedTasks, overdueTasks, newTasks] = await Promise.all([
    prisma.task.count({ where: { companyId } }),
    prisma.task.count({ where: { companyId, status: 'completed' } }),
    prisma.task.count({
      where: {
        companyId,
        dueDate: { lt: new Date() },
        status: { notIn: ['completed', 'cancelled'] }
      }
    }),
    prisma.task.count({
      where: {
        companyId,
        createdAt: { gte: startDate }
      }
    })
  ]);

  const tasksByStatus = await prisma.task.groupBy({
    by: ['status'],
    where: { companyId },
    _count: { id: true }
  });

  const tasksByPriority = await prisma.task.groupBy({
    by: ['priority'],
    where: { companyId },
    _count: { id: true }
  });

  // Calculate average task completion time
  const completedTasksWithTime = await prisma.task.findMany({
    where: {
      companyId,
      status: 'completed',
      updatedAt: { gte: startDate }
    },
    select: {
      createdAt: true,
      updatedAt: true
    }
  });

  const avgCompletionTime = completedTasksWithTime.length > 0
    ? completedTasksWithTime.reduce((acc, task) => {
        const days = Math.ceil((task.updatedAt.getTime() - task.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        return acc + days;
      }, 0) / completedTasksWithTime.length
    : 0;

  return {
    totalTasks,
    completedTasks,
    overdueTasks,
    newTasks,
    completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    averageCompletionTime: Math.round(avgCompletionTime * 10) / 10,
    tasksByStatus: tasksByStatus.map(t => ({
      status: t.status,
      count: t._count.id
    })),
    tasksByPriority: tasksByPriority.map(t => ({
      priority: t.priority,
      count: t._count.id
    }))
  };
}

// Team Statistics
async function getTeamStats(companyId: string, startDate: Date) {
  // Get all projects with team members
  const projects = await prisma.project.findMany({
    where: { companyId },
    select: {
      teamMembers: true,
      projectManager: true,
      status: true
    }
  });

  // Calculate team utilization
  const allTeamMembers = new Set();
  const activeTeamMembers = new Set();

  projects.forEach(project => {
    // Add project manager
    allTeamMembers.add(project.projectManager.employeeId);
    if (project.status === 'in_progress') {
      activeTeamMembers.add(project.projectManager.employeeId);
    }

    // Add team members
    project.teamMembers.forEach(member => {
      allTeamMembers.add(member.employeeId);
      if (project.status === 'in_progress') {
        activeTeamMembers.add(member.employeeId);
      }
    });
  });

  // Get task assignments per employee
  const taskAssignments = await prisma.task.groupBy({
    by: ['assigneeId'],
    where: { companyId },
    _count: { id: true },
    _avg: { completionPercentage: true }
  });

  // Get top performers
  const topPerformers = taskAssignments
    .sort((a, b) => (b._avg.completionPercentage || 0) - (a._avg.completionPercentage || 0))
    .slice(0, 5)
    .map(async (performer) => {
      const employee = await prisma.employee.findUnique({
        where: { id: performer.assigneeId },
        select: { firstName: true, lastName: true, position: true }
      });
      return {
        employeeId: performer.assigneeId,
        name: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown',
        position: employee?.position || 'Unknown',
        tasksCompleted: performer._count.id,
        averageCompletion: Math.round(performer._avg.completionPercentage || 0)
      };
    });

  const resolvedTopPerformers = await Promise.all(topPerformers);

  return {
    totalTeamMembers: allTeamMembers.size,
    activeTeamMembers: activeTeamMembers.size,
    utilizationRate: allTeamMembers.size > 0 ? Math.round((activeTeamMembers.size / allTeamMembers.size) * 100) : 0,
    topPerformers: resolvedTopPerformers,
    taskDistribution: taskAssignments.map(t => ({
      employeeId: t.assigneeId,
      taskCount: t._count.id,
      averageCompletion: Math.round(t._avg.completionPercentage || 0)
    }))
  };
}

// Budget Statistics
async function getBudgetStats(companyId: string, startDate: Date) {
  const projects = await prisma.project.findMany({
    where: { companyId },
    select: {
      budget: true,
      expenses: true,
      status: true,
      type: true,
      createdAt: true
    }
  });

  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalExpenses = projects.reduce((sum, p) => sum + p.expenses, 0);
  const budgetUtilization = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0;

  // Budget by project type
  const budgetByType = projects.reduce((acc, project) => {
    if (!acc[project.type]) {
      acc[project.type] = { budget: 0, expenses: 0, count: 0 };
    }
    acc[project.type].budget += project.budget;
    acc[project.type].expenses += project.expenses;
    acc[project.type].count += 1;
    return acc;
  }, {} as Record<string, { budget: number; expenses: number; count: number }>);

  // Projects over budget
  const overBudgetProjects = projects.filter(p => p.expenses > p.budget).length;

  return {
    totalBudget,
    totalExpenses,
    remainingBudget: totalBudget - totalExpenses,
    budgetUtilization: Math.round(budgetUtilization),
    overBudgetProjects,
    budgetByType: Object.entries(budgetByType).map(([type, data]) => ({
      type,
      budget: data.budget,
      expenses: data.expenses,
      utilization: data.budget > 0 ? Math.round((data.expenses / data.budget) * 100) : 0,
      projectCount: data.count
    })),
    averageProjectBudget: projects.length > 0 ? Math.round(totalBudget / projects.length) : 0
  };
}

// Timeline Statistics
async function getTimelineStats(companyId: string, startDate: Date) {
  const projects = await prisma.project.findMany({
    where: { companyId },
    select: {
      startDate: true,
      endDate: true,
      status: true,
      completionPercentage: true,
      createdAt: true
    }
  });

  const now = new Date();
  const onTimeProjects = projects.filter(p => {
    if (p.status === 'completed') return true;
    return p.endDate > now;
  }).length;

  const overdueProjects = projects.filter(p => {
    return p.status !== 'completed' && p.endDate < now;
  }).length;

  // Calculate average project duration
  const completedProjects = projects.filter(p => p.status === 'completed');
  const avgDuration = completedProjects.length > 0
    ? completedProjects.reduce((sum, p) => {
        const duration = Math.ceil((p.endDate.getTime() - p.startDate.getTime()) / (1000 * 60 * 60 * 24));
        return sum + duration;
      }, 0) / completedProjects.length
    : 0;

  // Monthly project creation trend
  const monthlyTrend = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date();
    monthStart.setMonth(monthStart.getMonth() - i);
    monthStart.setDate(1);

    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    const count = projects.filter(p =>
      p.createdAt >= monthStart && p.createdAt < monthEnd
    ).length;

    monthlyTrend.push({
      month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      count
    });
  }

  return {
    onTimeProjects,
    overdueProjects,
    onTimePercentage: projects.length > 0 ? Math.round((onTimeProjects / projects.length) * 100) : 0,
    averageDuration: Math.round(avgDuration),
    monthlyTrend,
    projectsStartingThisMonth: projects.filter(p => {
      const thisMonth = new Date();
      thisMonth.setDate(1);
      return p.startDate >= thisMonth;
    }).length
  };
}

// HRMS Specific Statistics
async function getHRMSSpecificStats(companyId: string, startDate: Date) {
  // Get HRMS-related projects by type and tags
  const hrmsProjects = await prisma.project.findMany({
    where: {
      companyId,
      OR: [
        { type: { in: ['internal', 'training', 'onboarding'] } },
        { tags: { hasSome: ['hr', 'onboarding', 'training', 'performance', 'recruitment'] } }
      ]
    },
    select: {
      type: true,
      status: true,
      tags: true,
      completionPercentage: true,
      teamMembers: true,
      tasks: {
        select: {
          status: true,
          assigneeId: true
        }
      }
    }
  });

  // Categorize HRMS projects
  const onboardingProjects = hrmsProjects.filter(p =>
    p.tags.includes('onboarding') || p.type === 'onboarding'
  );

  const trainingProjects = hrmsProjects.filter(p =>
    p.tags.includes('training') || p.type === 'training'
  );

  const performanceProjects = hrmsProjects.filter(p =>
    p.tags.includes('performance')
  );

  // Calculate employee engagement in HR projects
  const employeesInHRProjects = new Set();
  hrmsProjects.forEach(project => {
    project.teamMembers.forEach(member => {
      employeesInHRProjects.add(member.employeeId);
    });
    project.tasks.forEach(task => {
      employeesInHRProjects.add(task.assigneeId);
    });
  });

  return {
    totalHRMSProjects: hrmsProjects.length,
    onboardingProjects: {
      total: onboardingProjects.length,
      completed: onboardingProjects.filter(p => p.status === 'completed').length,
      averageCompletion: onboardingProjects.length > 0
        ? Math.round(onboardingProjects.reduce((sum, p) => sum + p.completionPercentage, 0) / onboardingProjects.length)
        : 0
    },
    trainingProjects: {
      total: trainingProjects.length,
      completed: trainingProjects.filter(p => p.status === 'completed').length,
      averageCompletion: trainingProjects.length > 0
        ? Math.round(trainingProjects.reduce((sum, p) => sum + p.completionPercentage, 0) / trainingProjects.length)
        : 0
    },
    performanceProjects: {
      total: performanceProjects.length,
      completed: performanceProjects.filter(p => p.status === 'completed').length,
      averageCompletion: performanceProjects.length > 0
        ? Math.round(performanceProjects.reduce((sum, p) => sum + p.completionPercentage, 0) / performanceProjects.length)
        : 0
    },
    employeeEngagement: {
      employeesInvolved: employeesInHRProjects.size,
      projectsPerEmployee: employeesInHRProjects.size > 0
        ? Math.round((hrmsProjects.length / employeesInHRProjects.size) * 10) / 10
        : 0
    }
  };
}

// Recent Activities
async function getRecentActivities(companyId: string, startDate: Date) {
  const [recentProjects, recentTasks, recentMilestones] = await Promise.all([
    // Recent projects
    prisma.project.findMany({
      where: {
        companyId,
        createdAt: { gte: startDate }
      },
      select: {
        id: true,
        name: true,
        status: true,
        type: true,
        projectManager: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    }),

    // Recent task completions
    prisma.task.findMany({
      where: {
        companyId,
        status: 'completed',
        updatedAt: { gte: startDate }
      },
      select: {
        id: true,
        name: true,
        assigneeName: true,
        completionPercentage: true,
        updatedAt: true,
        project: {
          select: { name: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 10
    }),

    // Recent milestone completions
    prisma.milestone.findMany({
      where: {
        companyId,
        status: 'completed',
        completionDate: { gte: startDate }
      },
      select: {
        id: true,
        name: true,
        completionDate: true,
        project: {
          select: { name: true }
        }
      },
      orderBy: { completionDate: 'desc' },
      take: 5
    })
  ]);

  return {
    recentProjects: recentProjects.map(p => ({
      id: p.id,
      name: p.name,
      status: p.status,
      type: p.type,
      manager: p.projectManager.name,
      createdAt: p.createdAt
    })),
    recentTaskCompletions: recentTasks.map(t => ({
      id: t.id,
      name: t.name,
      assignee: t.assigneeName,
      project: t.project.name,
      completedAt: t.updatedAt
    })),
    recentMilestones: recentMilestones.map(m => ({
      id: m.id,
      name: m.name,
      project: m.project.name,
      completedAt: m.completionDate
    }))
  };
}
