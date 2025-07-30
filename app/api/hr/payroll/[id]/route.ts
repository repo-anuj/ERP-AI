import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema for payroll update
const updatePayrollSchema = z.object({
  status: z.enum(['draft', 'processed', 'paid', 'cancelled']).optional(),
  paymentDate: z.string().optional().transform((str) => str ? new Date(str) : undefined),
  paymentMode: z.enum(['bank_transfer', 'cash', 'cheque']).optional(),
  paymentReference: z.string().optional(),
  bonus: z.number().optional(),
  incentives: z.number().optional(),
  otherDeductions: z.number().optional(),
  overtimeHours: z.number().optional(),
  overtimeAmount: z.number().optional(),
});

// GET - Fetch specific payroll record
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

    const payrollRecord = await prisma.payroll.findFirst({
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
            bankAccountNumber: true,
            bankName: true,
            department: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        },
        salaryStructure: {
          select: {
            id: true,
            basicSalary: true,
            hra: true,
            conveyance: true,
            medicalAllowance: true,
            specialAllowance: true,
            pfEmployeeRate: true,
            pfEmployerRate: true,
            esiEmployeeRate: true,
            esiEmployerRate: true,
            professionalTax: true,
            tdsRate: true,
            effectiveFrom: true,
            effectiveTo: true,
            isActive: true,
          }
        },
        payslip: true
      }
    });

    if (!payrollRecord) {
      return new NextResponse('Payroll record not found', { status: 404 });
    }

    return NextResponse.json(payrollRecord);

  } catch (error) {
    console.error('[PAYROLL_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// PATCH - Update payroll record
export async function PATCH(
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
    const body = await request.json();
    const validatedData = updatePayrollSchema.parse(body);

    // Check if payroll record exists and belongs to the company
    const existingPayroll = await prisma.payroll.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
      include: {
        employee: true
      }
    });

    if (!existingPayroll) {
      return new NextResponse('Payroll record not found', { status: 404 });
    }

    // Recalculate net salary if bonus, incentives, or deductions changed
    let netSalary = existingPayroll.netSalary;
    if (validatedData.bonus !== undefined || validatedData.incentives !== undefined || validatedData.otherDeductions !== undefined) {
      const bonus = validatedData.bonus ?? existingPayroll.bonus;
      const incentives = validatedData.incentives ?? existingPayroll.incentives;
      const otherDeductions = validatedData.otherDeductions ?? existingPayroll.otherDeductions;
      const overtimeAmount = validatedData.overtimeAmount ?? existingPayroll.overtimeAmount;
      
      netSalary = existingPayroll.grossSalary + bonus + incentives + overtimeAmount - 
                  (existingPayroll.totalDeductions - existingPayroll.otherDeductions + otherDeductions);
    }

    // Update the payroll record
    const updatedPayroll = await prisma.payroll.update({
      where: { id },
      data: {
        ...validatedData,
        netSalary,
        overtimeHours: validatedData.overtimeHours ?? existingPayroll.overtimeHours,
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
        }
      }
    });

    // If status changed to 'paid', create/update finance transaction
    if (validatedData.status === 'paid' && existingPayroll.status !== 'paid') {
      await createFinanceTransaction(updatedPayroll, user.companyId, user.id);
    }

    return NextResponse.json(updatedPayroll);

  } catch (error) {
    console.error('[PAYROLL_PATCH]', error);
    
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ 
        error: 'Validation failed', 
        details: error.errors 
      }), { status: 400 });
    }

    return new NextResponse('Internal error', { status: 500 });
  }
}

// DELETE - Delete payroll record (only if not paid)
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

    // Check if payroll record exists and belongs to the company
    const existingPayroll = await prisma.payroll.findFirst({
      where: {
        id,
        companyId: user.companyId,
      }
    });

    if (!existingPayroll) {
      return new NextResponse('Payroll record not found', { status: 404 });
    }

    // Don't allow deletion of paid payroll records
    if (existingPayroll.status === 'paid') {
      return new NextResponse('Cannot delete paid payroll records', { status: 400 });
    }

    // Delete associated payslip first if exists
    await prisma.payslip.deleteMany({
      where: { payrollId: id }
    });

    // Delete the payroll record
    await prisma.payroll.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Payroll record deleted successfully' });

  } catch (error) {
    console.error('[PAYROLL_DELETE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// Helper function to create finance transaction
async function createFinanceTransaction(payroll: any, companyId: string, userId: string) {
  try {
    // Get or create default salary expense category
    let salaryCategory = await prisma.budgetCategory.findFirst({
      where: {
        companyId,
        name: 'Salary & Benefits',
        type: 'expense'
      }
    });

    if (!salaryCategory) {
      salaryCategory = await prisma.budgetCategory.create({
        data: {
          name: 'Salary & Benefits',
          type: 'expense',
          color: '#ef4444',
          icon: 'Users',
          companyId
        }
      });
    }

    // Get default account (first available account)
    const defaultAccount = await prisma.financialAccount.findFirst({
      where: { companyId }
    });

    if (!defaultAccount) {
      console.warn('No financial account found for company', companyId);
      return;
    }

    // Create main salary transaction
    await prisma.transaction.create({
      data: {
        date: payroll.paymentDate || new Date(),
        description: `Salary Payment - ${payroll.employee.firstName} ${payroll.employee.lastName} (${payroll.payrollMonth}/${payroll.payrollYear})`,
        amount: payroll.netSalary,
        type: 'expense',
        reference: `PAY-${payroll.payrollYear}-${payroll.payrollMonth.toString().padStart(2, '0')}-${payroll.employee.employeeId}`,
        status: 'completed',
        notes: `Net salary payment for ${payroll.employee.firstName} ${payroll.employee.lastName}`,
        companyId,
        userId,
        categoryId: salaryCategory.id,
        accountId: defaultAccount.id,
        relatedTo: payroll.employeeId,
      }
    });

    // Create employer contribution transactions if applicable
    if (payroll.pfEmployer > 0) {
      await prisma.transaction.create({
        data: {
          date: payroll.paymentDate || new Date(),
          description: `PF Employer Contribution - ${payroll.employee.firstName} ${payroll.employee.lastName} (${payroll.payrollMonth}/${payroll.payrollYear})`,
          amount: payroll.pfEmployer,
          type: 'expense',
          reference: `PF-EMP-${payroll.payrollYear}-${payroll.payrollMonth.toString().padStart(2, '0')}-${payroll.employee.employeeId}`,
          status: 'completed',
          companyId,
          userId,
          categoryId: salaryCategory.id,
          accountId: defaultAccount.id,
          relatedTo: payroll.employeeId,
        }
      });
    }

    if (payroll.esiEmployer > 0) {
      await prisma.transaction.create({
        data: {
          date: payroll.paymentDate || new Date(),
          description: `ESI Employer Contribution - ${payroll.employee.firstName} ${payroll.employee.lastName} (${payroll.payrollMonth}/${payroll.payrollYear})`,
          amount: payroll.esiEmployer,
          type: 'expense',
          reference: `ESI-EMP-${payroll.payrollYear}-${payroll.payrollMonth.toString().padStart(2, '0')}-${payroll.employee.employeeId}`,
          status: 'completed',
          companyId,
          userId,
          categoryId: salaryCategory.id,
          accountId: defaultAccount.id,
          relatedTo: payroll.employeeId,
        }
      });
    }

  } catch (error) {
    console.error('Error creating finance transaction:', error);
  }
}
