import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema for bulk salary structure creation
const bulkSalaryStructureSchema = z.object({
  employeeIds: z.array(z.string().min(1, "Employee ID is required")),
  basicSalary: z.number().min(0, "Basic salary must be positive"),
  hra: z.number().optional(),
  conveyance: z.number().optional(),
  medicalAllowance: z.number().optional(),
  specialAllowance: z.number().optional(),
  otherAllowances: z.record(z.number()).optional(),
  pfEmployeeRate: z.number().min(0).max(1).default(0.12),
  pfEmployerRate: z.number().min(0).max(1).default(0.12),
  esiEmployeeRate: z.number().min(0).max(1).default(0.0075),
  esiEmployerRate: z.number().min(0).max(1).default(0.0325),
  professionalTax: z.number().optional(),
  tdsRate: z.number().optional(),
  pfApplicable: z.boolean().default(true),
  esiApplicable: z.boolean().default(true),
  effectiveFrom: z.string().transform((str) => new Date(str)),
  effectiveTo: z.string().transform((str) => new Date(str)).optional(),
  isActive: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload?.email) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    // Get user to find companyId
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      select: { companyId: true }
    });

    if (!user?.companyId) {
      return new NextResponse('Company not found', { status: 401 });
    }
    const body = await request.json();
    const validatedData = bulkSalaryStructureSchema.parse(body);

    // Check if all employees exist and belong to the company
    const employees = await prisma.employee.findMany({
      where: {
        id: { in: validatedData.employeeIds },
        companyId: user.companyId
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeId: true,
      }
    });

    if (employees.length !== validatedData.employeeIds.length) {
      const foundIds = employees.map(emp => emp.id);
      const missingIds = validatedData.employeeIds.filter(id => !foundIds.includes(id));
      return new NextResponse(`Employees not found: ${missingIds.join(', ')}`, { status: 404 });
    }

    const results = [];
    const errors = [];

    // Process each employee
    for (const employee of employees) {
      try {
        // Check for existing active salary structures
        const existingStructure = await prisma.salaryStructure.findFirst({
          where: {
            employeeId: employee.id,
            companyId: user.companyId,
            isActive: true,
            OR: [
              {
                effectiveFrom: {
                  lte: validatedData.effectiveFrom
                },
                effectiveTo: {
                  gte: validatedData.effectiveFrom
                }
              },
              {
                effectiveFrom: {
                  lte: validatedData.effectiveFrom
                },
                effectiveTo: null
              }
            ]
          }
        });

        if (existingStructure) {
          errors.push({
            employeeId: employee.id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            error: 'Active salary structure already exists for this period'
          });
          continue;
        }

        // Create salary structure
        const salaryStructure = await prisma.salaryStructure.create({
          data: {
            employeeId: employee.id,
            basicSalary: validatedData.basicSalary,
            hra: validatedData.hra,
            conveyance: validatedData.conveyance,
            medicalAllowance: validatedData.medicalAllowance,
            specialAllowance: validatedData.specialAllowance,
            otherAllowances: validatedData.otherAllowances,
            pfEmployeeRate: validatedData.pfEmployeeRate,
            pfEmployerRate: validatedData.pfEmployerRate,
            esiEmployeeRate: validatedData.esiEmployeeRate,
            esiEmployerRate: validatedData.esiEmployerRate,
            professionalTax: validatedData.professionalTax,
            tdsRate: validatedData.tdsRate,
            pfApplicable: validatedData.pfApplicable,
            esiApplicable: validatedData.esiApplicable,
            effectiveFrom: validatedData.effectiveFrom,
            effectiveTo: validatedData.effectiveTo,
            isActive: validatedData.isActive,
            companyId: user.companyId,
          },
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeId: true,
              }
            }
          }
        });

        results.push({
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          salaryStructureId: salaryStructure.id,
          status: 'created'
        });

      } catch (error) {
        console.error(`Error creating salary structure for employee ${employee.id}:`, error);
        errors.push({
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          error: 'Failed to create salary structure'
        });
      }
    }

    return NextResponse.json({
      success: results,
      errors: errors,
      summary: {
        totalRequested: validatedData.employeeIds.length,
        successful: results.length,
        failed: errors.length,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('[BULK_SALARY_STRUCTURE_CREATE]', error);
    
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ 
        error: 'Validation failed', 
        details: error.errors 
      }), { status: 400 });
    }

    return new NextResponse('Internal error', { status: 500 });
  }
}
