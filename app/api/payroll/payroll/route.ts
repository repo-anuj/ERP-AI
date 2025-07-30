import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createPayrollSchema = z.object({
  employeeId: z.string().uuid(),
  salaryStructureId: z.string().uuid(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  actualWorkingDays: z.number().int().min(0).max(31),
  totalWorkingDays: z.number().int().min(1).max(31),
  overtimeHours: z.number().nonnegative().optional().default(0),
  overtimeRate: z.number().nonnegative().optional().default(0),
  basicSalary: z.number().positive(),
  hra: z.number().nonnegative().optional().default(0),
  transportAllowance: z.number().nonnegative().optional().default(0),
  medicalAllowance: z.number().nonnegative().optional().default(0),
  specialAllowance: z.number().nonnegative().optional().default(0),
  otherAllowances: z.number().nonnegative().optional().default(0),
  overtimeAmount: z.number().nonnegative().optional().default(0),
  pfContribution: z.number().nonnegative().optional().default(0),
  esiContribution: z.number().nonnegative().optional().default(0),
  professionalTax: z.number().nonnegative().optional().default(0),
  tdsDeduction: z.number().nonnegative().optional().default(0),
  otherDeductions: z.number().nonnegative().optional().default(0),
  leaveDays: z.number().int().min(0).optional().default(0),
  leaveDeduction: z.number().nonnegative().optional().default(0),
  status: z.enum(['DRAFT', 'PROCESSED', 'APPROVED', 'PAID']).optional().default('DRAFT'),
});

const payrollFilterSchema = z.object({
  employeeId: z.string().uuid().optional(),
  month: z.string().transform((str) => parseInt(str, 10)).optional(),
  year: z.string().transform((str) => parseInt(str, 10)).optional(),
  status: z.enum(['DRAFT', 'PROCESSED', 'APPROVED', 'PAID']).optional(),
  page: z.string().transform((str) => parseInt(str, 10)).optional().default("1"),
  limit: z.string().transform((str) => parseInt(str, 10)).optional().default("10"),
});

// Helper function to calculate payroll amounts
function calculatePayrollAmounts(data: any) {
  const grossSalary = data.basicSalary + data.hra + data.transportAllowance + 
                     data.medicalAllowance + data.specialAllowance + data.otherAllowances + 
                     data.overtimeAmount;
  
  const totalDeductions = data.pfContribution + data.esiContribution + data.professionalTax + 
                         data.tdsDeduction + data.otherDeductions + data.leaveDeduction;
  
  const netSalary = grossSalary - totalDeductions;
  
  return {
    grossSalary,
    totalDeductions,
    netSalary,
  };
}

// GET - Fetch all payroll records with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = payrollFilterSchema.parse(Object.fromEntries(searchParams));
    
    const { page, limit, ...whereClause } = filters;
    const skip = (page - 1) * limit;

    const payrollRecords = await db.payroll.findMany({
      where: whereClause,
      skip,
      take: limit,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
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
      orderBy: [
        { payrollYear: 'desc' },
        { payrollMonth: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    const totalRecords = await db.payroll.count({
      where: whereClause,
    });

    return NextResponse.json({
      payrollRecords,
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error fetching payroll records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payroll records' },
      { status: 500 }
    );
  }
}

// POST - Create new payroll record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createPayrollSchema.parse(body);

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

    // Check if salary structure exists
    const salaryStructure = await db.salaryStructure.findUnique({
      where: { id: validatedData.salaryStructureId },
    });

    if (!salaryStructure) {
      return NextResponse.json(
        { error: 'Salary structure not found' },
        { status: 404 }
      );
    }

    // Check if payroll record already exists for the same employee, month, and year
    const existingPayroll = await db.payroll.findFirst({
      where: {
        employeeId: validatedData.employeeId,
        payrollMonth: validatedData.month,
        payrollYear: validatedData.year,
      },
    });

    if (existingPayroll) {
      return NextResponse.json(
        { error: 'Payroll record already exists for this employee, month, and year' },
        { status: 400 }
      );
    }

    // Calculate payroll amounts
    const calculatedAmounts = calculatePayrollAmounts(validatedData);

    // Map the fields to match Prisma schema
    const payrollRecord = await db.payroll.create({
      data: {
        employeeId: validatedData.employeeId,
        salaryStructureId: validatedData.salaryStructureId,
        payrollMonth: validatedData.month,
        payrollYear: validatedData.year,
        basicSalary: validatedData.basicSalary,
        hra: validatedData.hra,
        conveyance: validatedData.transportAllowance, // Map transportAllowance to conveyance
        medicalAllowance: validatedData.medicalAllowance,
        specialAllowance: validatedData.specialAllowance,
        otherAllowances: validatedData.otherAllowances,
        pfEmployee: validatedData.pfContribution, // Map pfContribution to pfEmployee
        pfEmployer: 0, // Default value, can be calculated if needed
        esiEmployee: validatedData.esiContribution, // Map esiContribution to esiEmployee
        esiEmployer: 0, // Default value, can be calculated if needed
        professionalTax: validatedData.professionalTax,
        tds: validatedData.tdsDeduction, // Map tdsDeduction to tds
        otherDeductions: validatedData.otherDeductions,
        overtimeHours: validatedData.overtimeHours,
        overtimeAmount: validatedData.overtimeAmount,
        bonus: 0, // Default value
        incentives: 0, // Default value
        workingDays: validatedData.totalWorkingDays, // Map totalWorkingDays to workingDays
        presentDays: validatedData.actualWorkingDays, // Map actualWorkingDays to presentDays
        leaveDays: validatedData.leaveDays,
        lopDays: 0, // Default value, can be calculated if needed
        status: validatedData.status.toLowerCase(), // Convert to lowercase to match schema
        ...calculatedAmounts,
        companyId: employee.companyId, // Get companyId from employee
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
        salaryStructure: {
          select: {
            id: true,
            effectiveFrom: true,
            effectiveTo: true,
          },
        },
      },
    });

    return NextResponse.json({ payrollRecord }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating payroll record:', error);
    return NextResponse.json(
      { error: 'Failed to create payroll record' },
      { status: 500 }
    );
  }
}
