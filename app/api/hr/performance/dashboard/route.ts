import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfYear, endOfYear, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Fetch performance dashboard data
export async function GET(request: NextRequest) {
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
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const departmentId = searchParams.get('departmentId');

    // Calculate date ranges
    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(new Date(year, 0, 1));
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());
    const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
    const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));

    // Build where clause for filtering
    const whereClause: any = {
      companyId: user.companyId,
    };

    if (departmentId) {
      whereClause.employee = {
        departmentId: departmentId,
      };
    }

    // Parallel data fetching for better performance
    const [
      performanceReviews,
      performanceGoals,
      performanceFeedbacks,
      performanceTemplates,
      employees,
      recentReviews,
      upcomingReviews,
      departmentStats,
      goalStats,
      reviewStats
    ] = await Promise.all([
      // All performance reviews for the year
      prisma.performanceReview.findMany({
        where: {
          ...whereClause,
          reviewPeriodStart: {
            gte: yearStart,
            lte: yearEnd,
          },
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeId: true,
              department: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          },
          template: {
            select: {
              id: true,
              name: true,
              reviewType: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),

      // Performance goals
      prisma.performanceGoal.findMany({
        where: {
          ...whereClause,
          targetDate: {
            gte: yearStart,
            lte: yearEnd,
          },
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeId: true,
            }
          }
        }
      }),

      // Performance feedbacks
      prisma.performanceFeedback.findMany({
        where: {
          ...whereClause,
          createdAt: {
            gte: yearStart,
            lte: yearEnd,
          },
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeId: true,
            }
          }
        }
      }),

      // Performance templates
      prisma.performanceTemplate.findMany({
        where: {
          companyId: user.companyId,
          isActive: true,
        },
        include: {
          _count: {
            select: {
              performanceReviews: true,
            }
          }
        }
      }),

      // Active employees
      prisma.employee.findMany({
        where: {
          companyId: user.companyId,
          status: 'active',
          ...(departmentId && { departmentId }),
        },
        include: {
          department: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      }),

      // Recent reviews (last 30 days)
      prisma.performanceReview.findMany({
        where: {
          ...whereClause,
          createdAt: {
            gte: subMonths(new Date(), 1),
          },
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeId: true,
            }
          },
          template: {
            select: {
              id: true,
              name: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),

      // Upcoming reviews (next 30 days)
      prisma.performanceReview.findMany({
        where: {
          ...whereClause,
          dueDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
          status: {
            in: ['draft', 'in_progress'],
          },
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeId: true,
            }
          },
          template: {
            select: {
              id: true,
              name: true,
            }
          }
        },
        orderBy: { dueDate: 'asc' }
      }),

      // Department-wise statistics
      prisma.department.findMany({
        where: {
          companyId: user.companyId,
        },
        include: {
          employees: {
            where: {
              status: 'active',
            },
            include: {
              performanceReviews: {
                where: {
                  reviewPeriodStart: {
                    gte: yearStart,
                    lte: yearEnd,
                  },
                }
              },
              performanceGoals: {
                where: {
                  targetDate: {
                    gte: yearStart,
                    lte: yearEnd,
                  },
                }
              }
            }
          }
        }
      }),

      // Goal statistics
      prisma.performanceGoal.groupBy({
        by: ['status'],
        where: {
          ...whereClause,
          targetDate: {
            gte: yearStart,
            lte: yearEnd,
          },
        },
        _count: {
          id: true,
        }
      }),

      // Review statistics by status
      prisma.performanceReview.groupBy({
        by: ['status'],
        where: {
          ...whereClause,
          reviewPeriodStart: {
            gte: yearStart,
            lte: yearEnd,
          },
        },
        _count: {
          id: true,
        }
      })
    ]);

    // Process statistics
    const totalReviews = performanceReviews.length;
    const completedReviews = performanceReviews.filter(review => review.status === 'completed').length;
    const pendingReviews = performanceReviews.filter(review => review.status === 'in_progress').length;
    const overdueReviews = performanceReviews.filter(review => 
      review.status !== 'completed' && new Date(review.dueDate) < new Date()
    ).length;

    const totalGoals = performanceGoals.length;
    const completedGoals = performanceGoals.filter(goal => goal.status === 'completed').length;
    const inProgressGoals = performanceGoals.filter(goal => goal.status === 'in_progress').length;
    const notStartedGoals = performanceGoals.filter(goal => goal.status === 'not_started').length;

    const totalFeedbacks = performanceFeedbacks.length;
    const averageRating = performanceReviews
      .filter(review => review.overallRating)
      .reduce((sum, review) => sum + (review.overallRating || 0), 0) / 
      (performanceReviews.filter(review => review.overallRating).length || 1);

    // Process department statistics
    const departmentPerformanceStats = departmentStats.map(dept => {
      const totalEmployees = dept.employees.length;
      const totalReviews = dept.employees.reduce(
        (sum, emp) => sum + emp.performanceReviews.length,
        0
      );
      const completedReviews = dept.employees.reduce(
        (sum, emp) => sum + emp.performanceReviews.filter(review => review.status === 'completed').length,
        0
      );
      const totalGoals = dept.employees.reduce(
        (sum, emp) => sum + emp.performanceGoals.length,
        0
      );
      const completedGoals = dept.employees.reduce(
        (sum, emp) => sum + emp.performanceGoals.filter(goal => goal.status === 'completed').length,
        0
      );

      return {
        id: dept.id,
        name: dept.name,
        totalEmployees,
        totalReviews,
        completedReviews,
        reviewCompletionRate: totalReviews > 0 ? (completedReviews / totalReviews) * 100 : 0,
        totalGoals,
        completedGoals,
        goalCompletionRate: totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0,
      };
    });

    // Calculate performance trends (monthly data for the year)
    const monthlyPerformanceData = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const monthReviews = performanceReviews.filter(review => {
        const reviewMonth = new Date(review.createdAt).getMonth() + 1;
        return reviewMonth === month;
      });
      const monthGoals = performanceGoals.filter(goal => {
        const goalMonth = new Date(goal.createdAt).getMonth() + 1;
        return goalMonth === month;
      });

      return {
        month: new Date(year, index).toLocaleString('default', { month: 'short' }),
        reviews: monthReviews.length,
        goals: monthGoals.length,
        completedReviews: monthReviews.filter(review => review.status === 'completed').length,
        completedGoals: monthGoals.filter(goal => goal.status === 'completed').length,
      };
    });

    const dashboardData = {
      summary: {
        totalEmployees: employees.length,
        totalReviews,
        completedReviews,
        pendingReviews,
        overdueReviews,
        reviewCompletionRate: totalReviews > 0 ? (completedReviews / totalReviews) * 100 : 0,
        totalGoals,
        completedGoals,
        inProgressGoals,
        notStartedGoals,
        goalCompletionRate: totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0,
        totalFeedbacks,
        averageRating: Math.round(averageRating * 100) / 100,
        totalTemplates: performanceTemplates.length,
      },

      departmentStats: departmentPerformanceStats,
      monthlyTrends: monthlyPerformanceData,

      recentReviews: recentReviews.map(review => ({
        id: review.id,
        employeeName: `${review.employee.firstName} ${review.employee.lastName}`,
        employeeId: review.employee.employeeId,
        templateName: review.template.name,
        reviewType: review.reviewType,
        status: review.status,
        overallRating: review.overallRating,
        dueDate: review.dueDate,
        createdAt: review.createdAt,
      })),

      upcomingReviews: upcomingReviews.map(review => ({
        id: review.id,
        employeeName: `${review.employee.firstName} ${review.employee.lastName}`,
        employeeId: review.employee.employeeId,
        templateName: review.template.name,
        reviewType: review.reviewType,
        status: review.status,
        dueDate: review.dueDate,
        daysUntilDue: Math.ceil((new Date(review.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
      })),

      goalStats: goalStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.id;
        return acc;
      }, {} as Record<string, number>),

      reviewStats: reviewStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.id;
        return acc;
      }, {} as Record<string, number>),

      filters: {
        year,
        departmentId,
      },
    };

    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error('[PERFORMANCE_DASHBOARD_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
