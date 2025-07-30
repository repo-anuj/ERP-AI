import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const updateSalaryStructureSchema = z.object({
  basicSalary: z.number().positive().optional(),
  hra: z.number().nonnegative().optional(),
  transportAllowance: z.number().nonnegative().optional(),
  medicalAllowance: z.number().nonnegative().optional(),
  specialAllowance: z.number().nonnegative().optional(),
  otherAllowances: z.number().nonnegative().optional(),
  pfContribution: z.number().nonnegative().optional(),
  esiContribution: z.number().nonnegative().optional(),
  professionalTax: z.number().nonnegative().optional(),
  tdsDeduction: z.number().nonnegative().optional(),
  otherDeductions: z.number().nonnegative().optional(),
  effectiveFrom: z.string().transform((str) => new Date(str)).optional(),
  effectiveTo: z.string().transform((str) => new Date(str)).optional(),
  isActive: z.boolean().optional(),
});

// GET - Fetch specific salary structure
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const salaryStructure = await db.salaryStructure.findUnique({
      where: { id: params.id },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
          },
        },
      },
    });

    if (!salaryStructure) {
      return NextResponse.json(
        { error: 'Salary structure not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ salaryStructure });
  } catch (error) {
    console.error('Error fetching salary structure:', error);
    return NextResponse.json(
      { error: 'Failed to fetch salary structure' },
      { status: 500 }
    );
  }
}

// PUT - Update specific salary structure
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateSalaryStructureSchema.parse(body);

    // Check if salary structure exists
    const existingSalaryStructure = await db.salaryStructure.findUnique({
      where: { id: params.id },
    });

    if (!existingSalaryStructure) {
      return NextResponse.json(
        { error: 'Salary structure not found' },
        { status: 404 }
      );
    }

    // If updating to active, deactivate other active salary structures for the same employee
    if (validatedData.isActive === true) {
      await db.salaryStructure.updateMany({
        where: {
          employeeId: existingSalaryStructure.employeeId,
          isActive: true,
          id: { not: params.id },
        },
        data: {
          isActive: false,
          effectiveTo: new Date(),
        },
      });
    }

    const updatedSalaryStructure = await db.salaryStructure.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
          },
        },
      },
    });

    return NextResponse.json({ salaryStructure: updatedSalaryStructure });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating salary structure:', error);
    return NextResponse.json(
      { error: 'Failed to update salary structure' },
      { status: 500 }
    );
  }
}

// DELETE - Delete specific salary structure
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if salary structure exists
    const salaryStructure = await db.salaryStructure.findUnique({
      where: { id: params.id },
    });

    if (!salaryStructure) {
      return NextResponse.json(
        { error: 'Salary structure not found' },
        { status: 404 }
      );
    }

    // Check if salary structure is being used in any payroll
    const payrollCount = await db.payroll.count({
      where: { salaryStructureId: params.id },
    });

    if (payrollCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete salary structure that is being used in payroll records' },
        { status: 400 }
      );
    }

    await db.salaryStructure.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Salary structure deleted successfully' });
  } catch (error) {
    console.error('Error deleting salary structure:', error);
    return NextResponse.json(
      { error: 'Failed to delete salary structure' },
      { status: 500 }
    );
  }
}
