import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema for salary structure update
const updateSalaryStructureSchema = z.object({
  basicSalary: z.number().min(0, "Basic salary must be positive").optional(),
  hra: z.number().optional(),
  conveyance: z.number().optional(),
  medicalAllowance: z.number().optional(),
  specialAllowance: z.number().optional(),
  otherAllowances: z.record(z.number()).optional(),
  pfEmployeeRate: z.number().min(0).max(1).optional(),
  pfEmployerRate: z.number().min(0).max(1).optional(),
  esiEmployeeRate: z.number().min(0).max(1).optional(),
  esiEmployerRate: z.number().min(0).max(1).optional(),
  professionalTax: z.number().optional(),
  tdsRate: z.number().optional(),
  pfApplicable: z.boolean().optional(),
  esiApplicable: z.boolean().optional(),
  effectiveFrom: z.string().transform((str) => new Date(str)).optional(),
  effectiveTo: z.string().optional().transform((str) => str ? new Date(str) : undefined),
  isActive: z.boolean().optional(),
});

// GET - Fetch specific salary structure
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

    const salaryStructure = await prisma.salaryStructure.findFirst({
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

    if (!salaryStructure) {
      return new NextResponse('Salary structure not found', { status: 404 });
    }

    return NextResponse.json(salaryStructure);

  } catch (error) {
    console.error('[SALARY_STRUCTURE_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// PATCH - Update salary structure
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
    const validatedData = updateSalaryStructureSchema.parse(body);

    // Check if salary structure exists and belongs to the company
    const existingSalaryStructure = await prisma.salaryStructure.findFirst({
      where: {
        id,
        companyId: user.companyId,
      }
    });

    if (!existingSalaryStructure) {
      return new NextResponse('Salary structure not found', { status: 404 });
    }

    // If updating effective dates, check for overlaps
    if (validatedData.effectiveFrom || validatedData.effectiveTo) {
      const effectiveFrom = validatedData.effectiveFrom || existingSalaryStructure.effectiveFrom;
      const effectiveTo = validatedData.effectiveTo !== undefined ? validatedData.effectiveTo : existingSalaryStructure.effectiveTo;

      const overlappingStructure = await prisma.salaryStructure.findFirst({
        where: {
          id: { not: id }, // Exclude current structure
          employeeId: existingSalaryStructure.employeeId,
          companyId: user.companyId,
          isActive: true,
          OR: [
            {
              effectiveFrom: {
                lte: effectiveFrom
              },
              effectiveTo: {
                gte: effectiveFrom
              }
            },
            {
              effectiveFrom: {
                lte: effectiveFrom
              },
              effectiveTo: null
            }
          ]
        }
      });

      if (overlappingStructure) {
        return new NextResponse('Overlapping salary structure exists for this period', { status: 400 });
      }
    }

    // Update the salary structure
    const updatedSalaryStructure = await prisma.salaryStructure.update({
      where: { id },
      data: validatedData,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
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

    return NextResponse.json(updatedSalaryStructure);

  } catch (error) {
    console.error('[SALARY_STRUCTURE_PATCH]', error);
    
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ 
        error: 'Validation failed', 
        details: error.errors 
      }), { status: 400 });
    }

    return new NextResponse('Internal error', { status: 500 });
  }
}

// DELETE - Delete salary structure
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

    // Check if salary structure exists and belongs to the company
    const existingSalaryStructure = await prisma.salaryStructure.findFirst({
      where: {
        id,
        companyId: user.companyId,
      }
    });

    if (!existingSalaryStructure) {
      return new NextResponse('Salary structure not found', { status: 404 });
    }

    // Check if there are any payroll records using this structure
    const payrollRecords = await prisma.payroll.findFirst({
      where: {
        employeeId: existingSalaryStructure.employeeId,
        // Add date range check if needed
      }
    });

    if (payrollRecords) {
      // Instead of deleting, mark as inactive
      await prisma.salaryStructure.update({
        where: { id },
        data: { isActive: false }
      });
      
      return NextResponse.json({ 
        message: 'Salary structure marked as inactive due to existing payroll records' 
      });
    }

    // Safe to delete
    await prisma.salaryStructure.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Salary structure deleted successfully' });

  } catch (error) {
    console.error('[SALARY_STRUCTURE_DELETE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
