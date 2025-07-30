import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload?.email) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user to find companyId
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      select: { companyId: true }
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: 'Company not found' }, { status: 401 });
    }

    // Get all active employees
    const employees = await prisma.employee.findMany({
      where: {
        companyId: user.companyId,
        status: 'active'
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeId: true,
        email: true,
        position: true,
        startDate: true,
        department: {
          select: {
            id: true,
            name: true,
          }
        },
        salaryStructures: {
          where: {
            isActive: true,
            effectiveFrom: {
              lte: new Date()
            },
            OR: [
              { effectiveTo: null },
              { effectiveTo: { gte: new Date() } }
            ]
          },
          select: {
            id: true,
            basicSalary: true,
            effectiveFrom: true,
            effectiveTo: true,
          }
        }
      }
    });

    // Filter employees who don't have active salary structures
    const employeesWithoutSalaryStructures = employees.filter(
      employee => employee.salaryStructures.length === 0
    );

    // Also get employees with salary structures for comparison
    const employeesWithSalaryStructures = employees.filter(
      employee => employee.salaryStructures.length > 0
    );

    return NextResponse.json({
      employeesWithoutSalaryStructures,
      employeesWithSalaryStructures,
      summary: {
        totalEmployees: employees.length,
        withSalaryStructures: employeesWithSalaryStructures.length,
        withoutSalaryStructures: employeesWithoutSalaryStructures.length,
      }
    });

  } catch (error) {
    console.error('[EMPLOYEES_MISSING_SALARY_STRUCTURES_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
