import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { RewardService } from '@/lib/reward-service';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Fetch company leaderboard
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
    const limit = parseInt(searchParams.get('limit') || '10');
    const period = searchParams.get('period') || 'all'; // all, monthly, yearly

    let leaderboard;

    if (period === 'all') {
      leaderboard = await RewardService.getCompanyLeaderboard(user.companyId, limit);
    } else {
      // For monthly/yearly leaderboards, we need custom logic
      const now = new Date();
      let periodKey: string;

      if (period === 'monthly') {
        periodKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      } else {
        periodKey = now.getFullYear().toString();
      }

      const employeePoints = await prisma.employeePoints.findMany({
        where: {
          employee: {
            companyId: user.companyId
          }
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              department: {
                select: { name: true }
              }
            }
          }
        }
      });

      // Calculate period points and sort
      leaderboard = employeePoints
        .map(ep => {
          const periodPoints = period === 'monthly' 
            ? (ep.monthlyPoints as Record<string, number>)?.[periodKey] || 0
            : (ep.yearlyPoints as Record<string, number>)?.[periodKey] || 0;

          return {
            ...ep,
            periodPoints,
            totalPoints: periodPoints // Override for sorting
          };
        })
        .sort((a, b) => b.periodPoints - a.periodPoints)
        .slice(0, limit);
    }

    // Add ranking
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));

    return NextResponse.json({
      leaderboard: rankedLeaderboard,
      period,
      total: rankedLeaderboard.length
    });
  } catch (error) {
    console.error('[LEADERBOARD_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
