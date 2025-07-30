import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema for bulk payroll operations
const bulkPayrollSchema = z.object({
  action: z.enum(['approve', 'pay', 'cancel']),
  payrollIds: z.array(z.string()).min(1, 'At least one payroll ID is required'),
  paymentDate: z.string().optional().transform((str) => str ? new Date(str) : undefined),
  paymentMode: z.enum(['bank_transfer', 'cash', 'cheque']).optional(),
  paymentReference: z.string().optional(),
});

// POST - Bulk process payroll records
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validatedData = bulkPayrollSchema.parse(body);

    // Fetch payroll records to process
    const payrollRecords = await prisma.payroll.findMany({
      where: {
        id: { in: validatedData.payrollIds },
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
          }
        }
      }
    });

    if (payrollRecords.length === 0) {
      return new NextResponse('No payroll records found', { status: 404 });
    }

    const results = {
      processed: 0,
      failed: 0,
      errors: [] as string[],
      totalAmount: 0,
    };

    // Process each payroll record based on action
    for (const payroll of payrollRecords) {
      try {
        let updateData: any = {};
        let newStatus = payroll.status;

        switch (validatedData.action) {
          case 'approve':
            if (payroll.status === 'draft') {
              updateData.status = 'processed';
              newStatus = 'processed';
            } else {
              results.errors.push(`Payroll ${payroll.id} is not in draft status`);
              results.failed++;
              continue;
            }
            break;

          case 'pay':
            if (payroll.status === 'processed' || payroll.status === 'draft') {
              updateData = {
                status: 'paid',
                paymentDate: validatedData.paymentDate || new Date(),
                paymentMode: validatedData.paymentMode || 'bank_transfer',
                paymentReference: validatedData.paymentReference,
              };
              newStatus = 'paid';
            } else {
              results.errors.push(`Payroll ${payroll.id} cannot be paid in current status: ${payroll.status}`);
              results.failed++;
              continue;
            }
            break;

          case 'cancel':
            if (payroll.status !== 'paid') {
              updateData.status = 'cancelled';
              newStatus = 'cancelled';
            } else {
              results.errors.push(`Cannot cancel paid payroll ${payroll.id}`);
              results.failed++;
              continue;
            }
            break;
        }

        // Update the payroll record
        await prisma.payroll.update({
          where: { id: payroll.id },
          data: updateData
        });

        // Create finance transactions if marking as paid
        if (validatedData.action === 'pay' && newStatus === 'paid') {
          await createFinanceTransactions(payroll, user.companyId, user.id, updateData.paymentDate);
          results.totalAmount += payroll.netSalary;
        }

        results.processed++;

      } catch (error) {
        console.error(`Error processing payroll ${payroll.id}:`, error);
        results.errors.push(`Failed to process payroll ${payroll.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        results.failed++;
      }
    }

    return NextResponse.json({
      message: `Bulk ${validatedData.action} completed`,
      results,
      action: validatedData.action,
    });

  } catch (error) {
    console.error('[BULK_PAYROLL_POST]', error);
    
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ 
        error: 'Validation failed', 
        details: error.errors 
      }), { status: 400 });
    }

    return new NextResponse('Internal error', { status: 500 });
  }
}

// Helper function to create finance transactions for paid payroll
async function createFinanceTransactions(payroll: any, companyId: string, userId: string, paymentDate: Date) {
  try {
    // Get or create salary expense category
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

    // Get or create statutory contributions category
    let statutoryCategory = await prisma.budgetCategory.findFirst({
      where: {
        companyId,
        name: 'Statutory Contributions',
        type: 'expense'
      }
    });

    if (!statutoryCategory) {
      statutoryCategory = await prisma.budgetCategory.create({
        data: {
          name: 'Statutory Contributions',
          type: 'expense',
          color: '#f59e0b',
          icon: 'Shield',
          companyId
        }
      });
    }

    // Get default account
    const defaultAccount = await prisma.financialAccount.findFirst({
      where: { companyId }
    });

    if (!defaultAccount) {
      console.warn('No financial account found for company', companyId);
      return;
    }

    const transactions = [];

    // Main salary transaction
    transactions.push({
      date: paymentDate,
      description: `Salary Payment - ${payroll.employee.firstName} ${payroll.employee.lastName} (${payroll.payrollMonth}/${payroll.payrollYear})`,
      amount: payroll.netSalary,
      type: 'expense',
      reference: `PAY-${payroll.payrollYear}-${payroll.payrollMonth.toString().padStart(2, '0')}-${payroll.employee.employeeId}`,
      status: 'completed',
      notes: `Net salary: ₹${payroll.netSalary.toLocaleString()}, Gross: ₹${payroll.grossSalary.toLocaleString()}, Deductions: ₹${payroll.totalDeductions.toLocaleString()}`,
      companyId,
      userId,
      categoryId: salaryCategory.id,
      accountId: defaultAccount.id,
      relatedTo: payroll.employeeId,
    });

    // Employer PF contribution
    if (payroll.pfEmployer > 0) {
      transactions.push({
        date: paymentDate,
        description: `PF Employer Contribution - ${payroll.employee.firstName} ${payroll.employee.lastName} (${payroll.payrollMonth}/${payroll.payrollYear})`,
        amount: payroll.pfEmployer,
        type: 'expense',
        reference: `PF-EMP-${payroll.payrollYear}-${payroll.payrollMonth.toString().padStart(2, '0')}-${payroll.employee.employeeId}`,
        status: 'completed',
        notes: `Employer PF contribution @ 12% of basic salary`,
        companyId,
        userId,
        categoryId: statutoryCategory.id,
        accountId: defaultAccount.id,
        relatedTo: payroll.employeeId,
      });
    }

    // Employer ESI contribution
    if (payroll.esiEmployer > 0) {
      transactions.push({
        date: paymentDate,
        description: `ESI Employer Contribution - ${payroll.employee.firstName} ${payroll.employee.lastName} (${payroll.payrollMonth}/${payroll.payrollYear})`,
        amount: payroll.esiEmployer,
        type: 'expense',
        reference: `ESI-EMP-${payroll.payrollYear}-${payroll.payrollMonth.toString().padStart(2, '0')}-${payroll.employee.employeeId}`,
        status: 'completed',
        notes: `Employer ESI contribution @ 3.25% of gross salary`,
        companyId,
        userId,
        categoryId: statutoryCategory.id,
        accountId: defaultAccount.id,
        relatedTo: payroll.employeeId,
      });
    }

    // Create all transactions
    for (const transaction of transactions) {
      await prisma.transaction.create({ data: transaction });
    }

    // Update account balance
    const totalExpense = transactions.reduce((sum, t) => sum + t.amount, 0);
    await prisma.financialAccount.update({
      where: { id: defaultAccount.id },
      data: {
        balance: {
          decrement: totalExpense
        }
      }
    });

  } catch (error) {
    console.error('Error creating finance transactions:', error);
    throw error;
  }
}
