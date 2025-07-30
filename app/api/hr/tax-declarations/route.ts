import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema for tax declaration
const taxDeclarationSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  financialYear: z.string().min(1, "Financial year is required"),
  section80C: z.number().min(0).max(150000).default(0),
  section80D: z.number().min(0).max(75000).default(0),
  section80E: z.number().min(0).default(0),
  section80G: z.number().min(0).default(0),
  section80TTA: z.number().min(0).max(10000).default(0),
  section80TTB: z.number().min(0).max(50000).default(0),
  houseRentPaid: z.number().min(0).default(0),
  homeLoanInterest: z.number().min(0).default(0),
  otherIncome: z.number().min(0).default(0),
  previousEmployerSalary: z.number().min(0).default(0),
  previousEmployerTds: z.number().min(0).default(0),
  taxRegime: z.enum(['old', 'new']).default('new'),
  declarationData: z.record(z.any()).optional(), // Additional structured data
  documents: z.array(z.string()).optional(), // Document IDs
  status: z.enum(['draft', 'submitted', 'approved', 'rejected']).default('draft'),
  submittedAt: z.string().optional().transform((str) => str ? new Date(str) : undefined),
  approvedAt: z.string().optional().transform((str) => str ? new Date(str) : undefined),
  approvedBy: z.string().optional(),
  rejectionReason: z.string().optional(),
});

// GET - Fetch tax declarations
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
    const financialYear = searchParams.get('financialYear');
    const status = searchParams.get('status');

    // Build where clause
    const whereClause: any = {
      companyId: user.companyId,
    };

    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    if (financialYear) {
      whereClause.financialYear = financialYear;
    }

    if (status) {
      whereClause.status = status;
    }

    const taxDeclarations = await prisma.taxDeclaration.findMany({
      where: whereClause,
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
      },
      orderBy: [
        { financialYear: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(taxDeclarations);

  } catch (error) {
    console.error('[TAX_DECLARATIONS_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// POST - Create or update tax declaration
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
    const validatedData = taxDeclarationSchema.parse(body);

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

    // Check if declaration already exists for this employee and financial year
    const existingDeclaration = await prisma.taxDeclaration.findFirst({
      where: {
        employeeId: validatedData.employeeId,
        financialYear: validatedData.financialYear,
        companyId: user.companyId,
      }
    });

    let savedDeclaration;

    if (existingDeclaration) {
      // Update existing declaration
      savedDeclaration = await prisma.taxDeclaration.update({
        where: { id: existingDeclaration.id },
        data: {
          ...validatedData,
          updatedAt: new Date(),
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
    } else {
      // Create new declaration
      savedDeclaration = await prisma.taxDeclaration.create({
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
    }

    return NextResponse.json(savedDeclaration, { status: existingDeclaration ? 200 : 201 });

  } catch (error) {
    console.error('[TAX_DECLARATIONS_POST]', error);
    
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ 
        error: 'Validation failed', 
        details: error.errors 
      }), { status: 400 });
    }

    return new NextResponse('Internal error', { status: 500 });
  }
}
