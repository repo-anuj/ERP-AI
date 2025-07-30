import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const updatePayrollSchema = z.object({
  actualWorkingDays: z.number().int().min(0).max(31).optional(),
  totalWorkingDays: z.number().int().min(1).max(31).optional(),
  overtimeHours: z.number().nonnegative().optional(),
  overtimeRate: z.number().nonnegative().optional(),
  basicSalary: z.number().positive().optional(),
  hra: z.number().nonnegative().optional(),
  transportAllowance: z.number().nonnegative().optional(),
  medicalAllowance: z.number().nonnegative().optional(),
  specialAllowance: z.number().nonnegative().optional(),
  otherAllowances: z.number().nonnegative().optional(),
  overtimeAmount: z.number().nonnegative().optional(),
  pfContribution: z.number().nonnegative().optional(),
  esiContribution: z.number().nonnegative().optional(),
  professionalTax: z.number().nonnegative().optional(),
  tdsDeduction: z.number().nonnegative().optional(),
  otherDeductions: z.number().nonnegative().optional(),
  leaveDays: z.number().int().min(0).optional(),
  leaveDeduction: z.number().nonnegative().optional(),
  status: z.enum(['DRAFT', 'PROCESSED', 'APPROVED', 'PAID']).optional(),
});

// Helper function to calculate payroll amounts
function calculatePayrollAmounts(data: any) {
  const grossSalary = (data.basicSalary || 0) + (data.hra || 0) + (data.transportAllowance || 0) + 
                     (data.medicalAllowance || 0) + (data.specialAllowance || 0) + (data.otherAllowances || 0) + 
                     (data.overtimeAmount || 0);
  
  const totalDeductions = (data.pfContribution || 0) + (data.esiContribution || 0) + (data.professionalTax || 0) + 
                         (data.tdsDeduction || 0) + (data.otherDeductions || 0) + (data.leaveDeduction || 0);
  
  const netSalary = grossSalary - totalDeductions;
  
  return {
    grossSalary,
    totalDeductions,
    netSalary,
  };
}

// GET - Fetch specific payroll record by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payrollRecord = await db.payroll.findUnique({
      where: { id: params.id },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            department: true,
            position: true,
          },
        },
        salaryStructure: {
          select: {
            id: true,
            effectiveFrom: true,
            effectiveTo: true,
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
          },
        },
        payslip: {
          select: {
            id: true,
            generatedAt: true,
            emailSent: true,
            emailSentAt: true,
          },
        },
      },
    });

    if (!payrollRecord) {
      return NextResponse.json(
        { error: 'Payroll record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ payrollRecord });
  } catch (error) {
    console.error('Error fetching payroll record:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payroll record' },
      { status: 500 }
    );
  }
}

// PUT - Update payroll record
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updatePayrollSchema.parse(body);

    // Check if payroll record exists
    const existingPayroll = await db.payroll.findUnique({
      where: { id: params.id },
    });

    if (!existingPayroll) {
      return NextResponse.json(
        { error: 'Payroll record not found' },
        { status: 404 }
      );
    }

    // Prevent updating payroll records that are already paid
    if (existingPayroll.status === 'PAID') {
      return NextResponse.json(
        { error: 'Cannot update payroll record that has already been paid' },
        { status: 400 }
      );
    }

    // Merge existing data with updates for calculation
    const mergedData = {
      ...existingPayroll,
      ...validatedData,
    };

    // Calculate payroll amounts
    const calculatedAmounts = calculatePayrollAmounts(mergedData);

    // Update paymentDate timestamp if status is being changed to PROCESSED
    const updateData = {
      ...validatedData,
      ...calculatedAmounts,
      paymentDate: validatedData.status === 'PROCESSED' ? new Date() : existingPayroll.paymentDate,
    };

    const updatedPayrollRecord = await db.payroll.update({
      where: { id: params.id },
      data: updateData,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            department: true,
            position: true,
          },
        },
        salaryStructure: {
          select: {
            id: true,
            effectiveFrom: true,
            effectiveTo: true,
          },
        },
      },
    });

    return NextResponse.json({ payrollRecord: updatedPayrollRecord });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating payroll record:', error);
    return NextResponse.json(
      { error: 'Failed to update payroll record' },
      { status: 500 }
    );
  }
}

// DELETE - Delete payroll record
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if payroll record exists
    const existingPayroll = await db.payroll.findUnique({
      where: { id: params.id },
      include: {
        payslip: true,
      },
    });

    if (!existingPayroll) {
      return NextResponse.json(
        { error: 'Payroll record not found' },
        { status: 404 }
      );
    }

    // Prevent deleting payroll records that are paid or have dependent records
    if (existingPayroll.status === 'PAID') {
      return NextResponse.json(
        { error: 'Cannot delete payroll record that has been paid' },
        { status: 400 }
      );
    }

    if (existingPayroll.payslip) {
      return NextResponse.json(
        { error: 'Cannot delete payroll record that has generated payslip' },
        { status: 400 }
      );
    }

    await db.payroll.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Payroll record deleted successfully' });
  } catch (error) {
    console.error('Error deleting payroll record:', error);
    return NextResponse.json(
      { error: 'Failed to delete payroll record' },
      { status: 500 }
    );
  }
}
