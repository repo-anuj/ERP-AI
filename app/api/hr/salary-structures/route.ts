import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema for salary structure
const salaryStructureSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
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
  effectiveTo: z.string().optional().transform((str) => str ? new Date(str) : undefined),
  isActive: z.boolean().default(true),
});

// GET - Fetch salary structures
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');

    // Build where clause
    const whereClause: any = {
      companyId: user.companyId,
    };

    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    const salaryStructures = await prisma.salaryStructure.findMany({
      where: whereClause,
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
      },
      orderBy: [
        { effectiveFrom: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(salaryStructures);

  } catch (error) {
    console.error('[SALARY_STRUCTURES_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// POST - Create new salary structure
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
    const validatedData = salaryStructureSchema.parse(body);

    // Check if employee exists and belongs to the company
    const employee = await prisma.employee.findFirst({
      where: {
        id: validatedData.employeeId,
        companyId: user.companyId
      }
    });

    if (!employee) {
      return new NextResponse('Employee not found', { status: 404 });
    }

    // Check for overlapping salary structures
    const overlappingStructure = await prisma.salaryStructure.findFirst({
      where: {
        employeeId: validatedData.employeeId,
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

    if (overlappingStructure) {
      return new NextResponse('Overlapping salary structure exists for this period', { status: 400 });
    }

    // Create the salary structure
    const salaryStructure = await prisma.salaryStructure.create({
      data: {
        ...validatedData,
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

    return NextResponse.json(salaryStructure, { status: 201 });

  } catch (error) {
    console.error('[SALARY_STRUCTURES_POST]', error);
    
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ 
        error: 'Validation failed', 
        details: error.errors 
      }), { status: 400 });
    }

    return new NextResponse('Internal error', { status: 500 });
  }
}
