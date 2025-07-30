import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema for tax calculation
const taxCalculationSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  financialYear: z.string().min(1, "Financial year is required"), // e.g., "2024-25"
  grossAnnualSalary: z.number().min(0, "Gross annual salary must be positive"),
  hra: z.number().min(0).default(0),
  standardDeduction: z.number().min(0).default(50000), // Standard deduction for FY 2024-25
  section80C: z.number().min(0).max(150000).default(0), // PF, PPF, ELSS, etc.
  section80D: z.number().min(0).max(75000).default(0), // Health insurance
  section80E: z.number().min(0).default(0), // Education loan interest
  section80G: z.number().min(0).default(0), // Donations
  section80TTA: z.number().min(0).max(10000).default(0), // Savings account interest
  section80TTB: z.number().min(0).max(50000).default(0), // Senior citizen interest
  otherDeductions: z.number().min(0).default(0),
  previousEmployerTds: z.number().min(0).default(0),
  taxRegime: z.enum(['old', 'new']).default('new'), // Old vs New tax regime
  isHandicapped: z.boolean().default(false),
  isSeniorCitizen: z.boolean().default(false),
  isSuperSeniorCitizen: z.boolean().default(false),
});

// GET - Fetch tax calculations
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

    const taxCalculations = await prisma.taxCalculation.findMany({
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

    return NextResponse.json(taxCalculations);

  } catch (error) {
    console.error('[TAX_CALCULATIONS_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// POST - Calculate and save tax calculation
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
    const validatedData = taxCalculationSchema.parse(body);

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

    // Calculate tax using Indian tax slabs
    const calculationResult = calculateIncomeTax(validatedData);

    // Map calculation result to TaxCalculation model fields
    const taxCalculationData = {
      financialYear: calculationResult.financialYear,
      grossIncome: calculationResult.grossAnnualSalary,
      standardDeduction: calculationResult.standardDeduction,
      hra_exemption: calculationResult.hraExemption,
      section80C: calculationResult.section80C,
      section80D: calculationResult.section80D,
      otherDeductions: calculationResult.otherDeductions,
      taxableIncome: calculationResult.taxableIncome,
      incomeTax: calculationResult.incomeTax,
      educationCess: calculationResult.healthEducationCess,
      totalTax: calculationResult.totalTaxAfterRebate,
      tdsDeducted: calculationResult.previousEmployerTds,
      tdsBalance: Math.max(0, calculationResult.totalTaxAfterRebate - calculationResult.previousEmployerTds),
    };

    // Check if calculation already exists for this employee and financial year
    const existingCalculation = await prisma.taxCalculation.findFirst({
      where: {
        employeeId: validatedData.employeeId,
        financialYear: validatedData.financialYear,
        companyId: user.companyId,
      }
    });

    let savedCalculation;

    if (existingCalculation) {
      // Update existing calculation
      savedCalculation = await prisma.taxCalculation.update({
        where: { id: existingCalculation.id },
        data: {
          ...taxCalculationData,
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
      // Create new calculation
      savedCalculation = await prisma.taxCalculation.create({
        data: {
          ...taxCalculationData,
          employeeId: validatedData.employeeId,
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

    return NextResponse.json({
      ...savedCalculation,
      calculationDetails: calculationResult
    }, { status: existingCalculation ? 200 : 201 });

  } catch (error) {
    console.error('[TAX_CALCULATIONS_POST]', error);
    
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ 
        error: 'Validation failed', 
        details: error.errors 
      }), { status: 400 });
    }

    return new NextResponse('Internal error', { status: 500 });
  }
}

// Helper function to calculate income tax based on Indian tax slabs
function calculateIncomeTax(data: z.infer<typeof taxCalculationSchema>) {
  const {
    grossAnnualSalary,
    hra,
    standardDeduction,
    section80C,
    section80D,
    section80E,
    section80G,
    section80TTA,
    section80TTB,
    otherDeductions,
    previousEmployerTds,
    taxRegime,
    isHandicapped,
    isSeniorCitizen,
    isSuperSeniorCitizen,
    financialYear
  } = data;

  // Calculate HRA exemption (minimum of 3 conditions)
  const hraExemption = Math.min(
    hra, // Actual HRA received
    grossAnnualSalary * 0.5, // 50% of salary (assuming metro city)
    hra - (grossAnnualSalary * 0.1) // HRA - 10% of salary
  );

  // Calculate taxable income
  let taxableIncome = grossAnnualSalary - hraExemption;

  if (taxRegime === 'old') {
    // Old tax regime with deductions
    taxableIncome -= standardDeduction;
    taxableIncome -= Math.min(section80C, 150000);
    taxableIncome -= Math.min(section80D, isSeniorCitizen ? 50000 : 25000);
    taxableIncome -= section80E;
    taxableIncome -= section80G;
    taxableIncome -= Math.min(section80TTA, 10000);
    taxableIncome -= Math.min(section80TTB, 50000);
    taxableIncome -= otherDeductions;
  } else {
    // New tax regime with higher standard deduction but no other deductions
    taxableIncome -= standardDeduction;
  }

  // Ensure taxable income is not negative
  taxableIncome = Math.max(0, taxableIncome);

  // Calculate income tax based on tax slabs
  let incomeTax = 0;
  let taxSlabs = [];

  if (taxRegime === 'new') {
    // New tax regime slabs for FY 2024-25
    const newTaxSlabs = [
      { min: 0, max: 300000, rate: 0 },
      { min: 300000, max: 700000, rate: 0.05 },
      { min: 700000, max: 1000000, rate: 0.10 },
      { min: 1000000, max: 1200000, rate: 0.15 },
      { min: 1200000, max: 1500000, rate: 0.20 },
      { min: 1500000, max: Infinity, rate: 0.30 }
    ];
    taxSlabs = newTaxSlabs;
  } else {
    // Old tax regime slabs
    const basicExemption = isSuperSeniorCitizen ? 500000 : isSeniorCitizen ? 300000 : 250000;
    const oldTaxSlabs = [
      { min: 0, max: basicExemption, rate: 0 },
      { min: basicExemption, max: 500000, rate: 0.05 },
      { min: 500000, max: 1000000, rate: 0.20 },
      { min: 1000000, max: Infinity, rate: 0.30 }
    ];
    taxSlabs = oldTaxSlabs;
  }

  // Calculate tax for each slab
  const taxBreakdown = [];
  for (const slab of taxSlabs) {
    if (taxableIncome > slab.min) {
      const taxableInThisSlab = Math.min(taxableIncome - slab.min, slab.max - slab.min);
      const taxInThisSlab = taxableInThisSlab * slab.rate;
      incomeTax += taxInThisSlab;
      
      if (taxableInThisSlab > 0) {
        taxBreakdown.push({
          slabMin: slab.min,
          slabMax: slab.max === Infinity ? 'Above' : slab.max,
          rate: slab.rate * 100,
          taxableAmount: taxableInThisSlab,
          tax: taxInThisSlab
        });
      }
    }
  }

  // Calculate cess (4% on income tax)
  const healthEducationCess = incomeTax * 0.04;
  const totalTaxBeforeRebate = incomeTax + healthEducationCess;

  // Calculate rebate under section 87A (for new regime)
  let rebate87A = 0;
  if (taxRegime === 'new' && taxableIncome <= 700000) {
    rebate87A = Math.min(totalTaxBeforeRebate, 25000);
  } else if (taxRegime === 'old' && taxableIncome <= 500000) {
    rebate87A = Math.min(totalTaxBeforeRebate, 12500);
  }

  const totalTaxAfterRebate = totalTaxBeforeRebate - rebate87A;

  // Calculate monthly TDS
  const monthlyTds = Math.max(0, (totalTaxAfterRebate - previousEmployerTds) / 12);

  // Calculate net monthly salary
  const monthlyGrossSalary = grossAnnualSalary / 12;
  const monthlyNetSalary = monthlyGrossSalary - monthlyTds;

  return {
    financialYear,
    taxRegime,
    grossAnnualSalary,
    hraReceived: hra,
    hraExemption,
    standardDeduction: taxRegime === 'old' ? standardDeduction : standardDeduction,
    section80C: taxRegime === 'old' ? Math.min(section80C, 150000) : 0,
    section80D: taxRegime === 'old' ? Math.min(section80D, isSeniorCitizen ? 50000 : 25000) : 0,
    section80E: taxRegime === 'old' ? section80E : 0,
    section80G: taxRegime === 'old' ? section80G : 0,
    section80TTA: taxRegime === 'old' ? Math.min(section80TTA, 10000) : 0,
    section80TTB: taxRegime === 'old' ? Math.min(section80TTB, 50000) : 0,
    otherDeductions: taxRegime === 'old' ? otherDeductions : 0,
    taxableIncome,
    incomeTax,
    healthEducationCess,
    totalTaxBeforeRebate,
    rebate87A,
    totalTaxAfterRebate,
    previousEmployerTds,
    monthlyTds,
    monthlyGrossSalary,
    monthlyNetSalary,
    taxBreakdown,
    calculatedAt: new Date(),
    isHandicapped,
    isSeniorCitizen,
    isSuperSeniorCitizen,
  };
}
