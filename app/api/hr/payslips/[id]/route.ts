import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Fetch specific payslip
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id } = params;

    const payslip = await prisma.payslip.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            email: true,
            department: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        },
        payroll: {
          select: {
            id: true,
            payrollMonth: true,
            payrollYear: true,
            status: true,
            netSalary: true,
            grossSalary: true,
            totalDeductions: true,
          }
        }
      }
    });

    if (!payslip) {
      return new NextResponse('Payslip not found', { status: 404 });
    }

    // Update download count and last download time
    await prisma.payslip.update({
      where: { id },
      data: {
        downloadCount: {
          increment: 1
        },
        lastDownloadAt: new Date()
      }
    });

    return NextResponse.json(payslip);

  } catch (error) {
    console.error('[PAYSLIP_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// DELETE - Delete payslip
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id } = params;

    // Check if payslip exists and belongs to the company
    const existingPayslip = await prisma.payslip.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
      include: {
        payroll: {
          select: {
            status: true
          }
        }
      }
    });

    if (!existingPayslip) {
      return new NextResponse('Payslip not found', { status: 404 });
    }

    // Don't allow deletion of payslips for paid payrolls
    if (existingPayslip.payroll.status === 'paid') {
      return new NextResponse('Cannot delete payslips for paid payrolls', { status: 400 });
    }

    // Delete the payslip
    await prisma.payslip.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Payslip deleted successfully' });

  } catch (error) {
    console.error('[PAYSLIP_DELETE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
