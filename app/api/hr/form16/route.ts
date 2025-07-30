import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema for Form 16 generation
const form16GenerationSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  financialYear: z.string().min(1, "Financial year is required"),
  assessmentYear: z.string().min(1, "Assessment year is required"),
});

// GET - Fetch Form 16 records
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

    const form16Records = await prisma.form16.findMany({
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
            },
            idProofs: true
          }
        }
      },
      orderBy: [
        { financialYear: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(form16Records);

  } catch (error) {
    console.error('[FORM16_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// POST - Generate Form 16
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
    const validatedData = form16GenerationSchema.parse(body);

    // Check if employee exists and belongs to the company
    const employee = await prisma.employee.findFirst({
      where: {
        id: validatedData.employeeId,
        companyId: user.companyId
      },
      include: {
        department: true
      }
    });

    if (!employee) {
      return new NextResponse('Employee not found', { status: 404 });
    }

    // Get tax calculation for the financial year
    const taxCalculation = await prisma.taxCalculation.findFirst({
      where: {
        employeeId: validatedData.employeeId,
        financialYear: validatedData.financialYear,
        companyId: user.companyId,
      }
    });

    if (!taxCalculation) {
      return new NextResponse('Tax calculation not found for this financial year', { status: 404 });
    }

    // Get tax calculation for the financial year
    const taxDeclaration = await prisma.taxCalculation.findFirst({
      where: {
        employeeId: validatedData.employeeId,
        financialYear: validatedData.financialYear,
        companyId: user.companyId,
      }
    });

    // Get payroll data for the financial year
    const startYear = parseInt(validatedData.financialYear.split('-')[0]);
    const endYear = startYear + 1;
    
    const payrollData = await prisma.payroll.findMany({
      where: {
        employeeId: validatedData.employeeId,
        companyId: user.companyId,
        OR: [
          {
            payrollYear: startYear,
            payrollMonth: { gte: 4 } // April onwards
          },
          {
            payrollYear: endYear,
            payrollMonth: { lte: 3 } // Up to March
          }
        ]
      },
      orderBy: [
        { payrollYear: 'asc' },
        { payrollMonth: 'asc' }
      ]
    });

    // Calculate annual figures from payroll data
    const annualData = payrollData.reduce((acc, payroll) => {
      acc.grossSalary += payroll.grossSalary;
      acc.basicSalary += payroll.basicSalary;
      acc.hra += payroll.hra;
      acc.pfEmployee += payroll.pfEmployee;
      acc.pfEmployer += payroll.pfEmployer;
      acc.esiEmployee += payroll.esiEmployee;
      acc.esiEmployer += payroll.esiEmployer;
      acc.professionalTax += payroll.professionalTax;
      acc.tds += payroll.tds;
      acc.bonus += payroll.bonus;
      acc.incentives += payroll.incentives;
      return acc;
    }, {
      grossSalary: 0,
      basicSalary: 0,
      hra: 0,
      pfEmployee: 0,
      pfEmployer: 0,
      esiEmployee: 0,
      esiEmployer: 0,
      professionalTax: 0,
      tds: 0,
      bonus: 0,
      incentives: 0,
    });

    // Get PAN number from employee ID proofs
    const panProof = employee.idProofs?.find(proof => 
      proof.name.toLowerCase().includes('pan') || 
      proof.name.toLowerCase().includes('permanent account number')
    );

    // Generate Form 16 data
    const form16Data = {
      // Company Information
      employer: {
        name: user.company?.name || 'Company Name',
        address: user.company?.address || '',
        tanNumber: user.company?.panNumber || '', // Tax Deduction Account Number
        panNumber: user.company?.panNumber || '',
      },

      // Employee Information
      employee: {
        name: `${employee.firstName} ${employee.lastName}`,
        employeeId: employee.employeeId,
        designation: employee.position || employee.jobTitle || 'Employee',
        department: employee.department?.name || 'General',
        panNumber: panProof?.value || '',
        aadhaarNumber: employee.idProofs?.find(proof =>
          proof.name.toLowerCase().includes('aadhaar') ||
          proof.name.toLowerCase().includes('aadhar')
        )?.value || '',
      },

      // Period Information
      period: {
        financialYear: validatedData.financialYear,
        assessmentYear: validatedData.assessmentYear,
        periodFrom: `01-04-${startYear}`,
        periodTo: `31-03-${endYear}`,
      },

      // Salary Details (Part A)
      salaryDetails: {
        grossSalary: annualData.grossSalary,
        basicSalary: annualData.basicSalary,
        hra: annualData.hra,
        otherAllowances: annualData.grossSalary - annualData.basicSalary - annualData.hra,
        bonus: annualData.bonus,
        incentives: annualData.incentives,
        totalGross: annualData.grossSalary + annualData.bonus + annualData.incentives,
      },

      // Deductions (Part B)
      deductions: {
        standardDeduction: taxCalculation.standardDeduction,
        entertainmentAllowance: 0, // Not applicable for most employees
        professionalTax: annualData.professionalTax,
        totalDeductions: taxCalculation.standardDeduction + annualData.professionalTax,
      },

      // Income Chargeable to Tax
      taxableIncome: taxCalculation.taxableIncome,

      // Tax Calculation
      taxCalculation: {
        incomeTax: taxCalculation.incomeTax,
        healthEducationCess: taxCalculation.educationCess || 0,
        totalTax: taxCalculation.incomeTax + (taxCalculation.educationCess || 0),
        rebate87A: 0, // Not available in current schema
        taxAfterRebate: taxCalculation.incomeTax + (taxCalculation.educationCess || 0),
        taxDeducted: annualData.tds,
        taxBreakdown: {}, // Not available in current schema
      },

      // Chapter VI-A Deductions (if old regime)
      chapterVIADeductions: {
        section80C: taxCalculation.section80C || 0,
        section80D: taxCalculation.section80D || 0,
        section80E: 0, // Not available in current schema
        section80G: 0, // Not available in current schema
        section80TTA: 0, // Not available in current schema
        section80TTB: 0, // Not available in current schema
        totalChapterVIA: (taxCalculation.section80C || 0) + (taxCalculation.section80D || 0),
      },

      // Other Information
      otherInformation: {
        taxRegime: 'old', // Default to old regime
        previousEmployerTds: 0, // Not available in current schema
        refundDue: Math.max(0, annualData.tds - (taxCalculation.incomeTax + (taxCalculation.educationCess || 0))),
        additionalTaxDue: Math.max(0, (taxCalculation.incomeTax + (taxCalculation.educationCess || 0)) - annualData.tds),
      },

      // Generation Details
      generation: {
        generatedAt: new Date(),
        generatedBy: user.id,
        certificateNumber: generateCertificateNumber(user.companyId, validatedData.financialYear),
      }
    };

    // Check if Form 16 already exists
    const existingForm16 = await prisma.form16.findFirst({
      where: {
        employeeId: validatedData.employeeId,
        financialYear: validatedData.financialYear,
        companyId: user.companyId,
      }
    });

    let savedForm16;

    if (existingForm16) {
      // Update existing Form 16
      savedForm16 = await prisma.form16.update({
        where: { id: existingForm16.id },
        data: {
          form16Data,
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
              idProofs: true,
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
      // Create new Form 16
      savedForm16 = await prisma.form16.create({
        data: {
          employeeId: validatedData.employeeId,
          financialYear: validatedData.financialYear,
          form16Data,
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
              idProofs: true,
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

    return NextResponse.json(savedForm16, { status: existingForm16 ? 200 : 201 });

  } catch (error) {
    console.error('[FORM16_POST]', error);
    
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ 
        error: 'Validation failed', 
        details: error.errors 
      }), { status: 400 });
    }

    return new NextResponse('Internal error', { status: 500 });
  }
}

// Helper function to generate certificate number
function generateCertificateNumber(companyId: string, financialYear: string): string {
  const year = financialYear.split('-')[0];
  const timestamp = Date.now().toString().slice(-6);
  const companyCode = companyId.slice(-4).toUpperCase();
  return `CERT-${year}-${companyCode}-${timestamp}`;
}
