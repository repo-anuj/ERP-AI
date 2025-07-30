import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const salaryStructureSchema = z.object({
  employeeId: z.string(),
  basicSalary: z.number().positive(),
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
  effectiveFrom: z.string().transform((str) => new Date(str)),
  effectiveTo: z.string().transform((str) => new Date(str)).optional(),
  isActive: z.boolean().default(true),
});

// GET - Fetch all salary structures
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const isActive = searchParams.get('isActive');

    const whereConditions: any = {};
    if (employeeId) whereConditions.employeeId = employeeId;
    if (isActive !== null) whereConditions.isActive = isActive === 'true';

    const salaryStructures = await db.salaryStructure.findMany({
      where: whereConditions,
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
      orderBy: {
        effectiveFrom: 'desc',
      },
    });

    return NextResponse.json({ salaryStructures });
  } catch (error) {
    console.error('Error fetching salary structures:', error);
    return NextResponse.json(
      { error: 'Failed to fetch salary structures' },
      { status: 500 }
    );
  }
}

// POST - Create new salary structure
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = salaryStructureSchema.parse(body);

    // Check if employee exists
    const employee = await db.employee.findUnique({
      where: { id: validatedData.employeeId },
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Deactivate previous salary structure if creating a new active one
    if (validatedData.isActive) {
      await db.salaryStructure.updateMany({
        where: {
          employeeId: validatedData.employeeId,
          isActive: true,
        },
        data: {
          isActive: false,
          effectiveTo: new Date(),
        },
      });
    }

    const salaryStructure = await db.salaryStructure.create({
      data: {
        ...validatedData,
        companyId: employee.companyId,
      },
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

    return NextResponse.json({ salaryStructure }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating salary structure:', error);
    return NextResponse.json(
      { error: 'Failed to create salary structure' },
      { status: 500 }
    );
  }
}
