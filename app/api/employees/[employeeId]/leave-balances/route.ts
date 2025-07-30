import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Fetch employee's leave balances
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

    const currentYear = new Date().getFullYear();

    // Get or create leave balances for current year
    const leaveTypes = await prisma.leaveType.findMany({
      where: {
        companyId: user.companyId,
        isActive: true
      }
    });

    const leaveBalances = [];

    for (const leaveType of leaveTypes) {
      let balance = await prisma.employeeLeaveBalance.findFirst({
        where: {
          employeeId,
          leaveTypeId: leaveType.id,
          year: currentYear
        },
        include: {
          leaveType: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // Create balance if it doesn't exist
      if (!balance) {
        balance = await prisma.employeeLeaveBalance.create({
          data: {
            employeeId,
            leaveTypeId: leaveType.id,
            companyId: user.companyId,
            year: currentYear,
            totalEntitled: leaveType.maxDaysPerYear,
            availableBalance: leaveType.maxDaysPerYear
          },
          include: {
            leaveType: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });
      }

      leaveBalances.push(balance);
    }

    return NextResponse.json(leaveBalances);
  } catch (error) {
    console.error('[EMPLOYEE_LEAVE_BALANCES_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
