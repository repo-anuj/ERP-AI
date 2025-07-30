import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RewardService } from '@/lib/reward-service';

export const dynamic = 'force-dynamic';

// GET - Fetch employee's reward summary
export async function GET(
  request: Request,
  { params }: { params: { employeeId: string } }
) {
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

    const { employeeId } = params;

    // Verify employee belongs to user's company
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        companyId: user.companyId
      }
    });

    if (!employee) {
      return new NextResponse('Employee not found', { status: 404 });
    }

    // Get comprehensive reward summary
    const rewardSummary = await RewardService.getEmployeeRewardSummary(employeeId);

    return NextResponse.json(rewardSummary);
  } catch (error) {
    console.error('[EMPLOYEE_REWARDS_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST - Manually award reward to employee
export async function POST(
  request: Request,
  { params }: { params: { employeeId: string } }
) {
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

    const { employeeId } = params;
    const body = await request.json();
    const { rewardTypeId, reason, metadata } = body;

    // Verify employee belongs to user's company
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        companyId: user.companyId
      }
    });

    if (!employee) {
      return new NextResponse('Employee not found', { status: 404 });
    }

    // Verify reward type belongs to company
    const rewardType = await prisma.rewardType.findFirst({
      where: {
        id: rewardTypeId,
        companyId: user.companyId,
        isActive: true
      }
    });

    if (!rewardType) {
      return new NextResponse('Reward type not found', { status: 404 });
    }

    // Create manual reward
    const reward = await prisma.reward.create({
      data: {
        employeeId,
        rewardTypeId,
        companyId: user.companyId,
        points: rewardType.pointValue,
        reason: reason || `Manual ${rewardType.name} reward`,
        metadata: metadata || {},
        awardedBy: user.id,
        isAutomatic: false
      },
      include: {
        rewardType: true
      }
    });

    // Update employee points
    await RewardService.updateEmployeePoints(employeeId, rewardType.pointValue);

    // Check for badge eligibility
    await RewardService.checkBadgeEligibility(
      employeeId, 
      user.companyId, 
      'custom', 
      { manualReward: true, awardedBy: user.id }
    );

    return NextResponse.json(reward);
  } catch (error) {
    console.error('[EMPLOYEE_REWARDS_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
