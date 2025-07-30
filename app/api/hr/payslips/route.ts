import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema for payslip generation
const generatePayslipSchema = z.object({
  payrollIds: z.array(z.string()).min(1, 'At least one payroll ID is required'),
  sendEmail: z.boolean().default(false),
  emailTemplate: z.string().optional(),
});

// GET - Fetch payslips
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
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const employeeId = searchParams.get('employeeId');
    const payrollId = searchParams.get('payrollId');

    // Build where clause
    const whereClause: any = {
      companyId: user.companyId,
    };

    // If specific payroll ID is requested
    if (payrollId) {
      whereClause.payrollId = payrollId;
    }

    // If employee filter is applied
    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    // If month/year filter is applied, we need to join with payroll
    let payrollFilter: any = {};
    if (month) {
      payrollFilter.payrollMonth = parseInt(month);
    }
    if (year) {
      payrollFilter.payrollYear = parseInt(year);
    }

    const payslips = await prisma.payslip.findMany({
      where: {
        ...whereClause,
        ...(Object.keys(payrollFilter).length > 0 && {
          payroll: payrollFilter
        })
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
        },
        payroll: {
          select: {
            id: true,
            payrollMonth: true,
            payrollYear: true,
            status: true,
            netSalary: true,
            grossSalary: true,
            totalDeductions: true,
          }
        }
      },
      orderBy: [
        { generatedAt: 'desc' }
      ]
    });

    return NextResponse.json(payslips);

  } catch (error) {
    console.error('[PAYSLIPS_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// POST - Generate payslips
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
    const validatedData = generatePayslipSchema.parse(body);

    // Fetch payroll records to generate payslips for
    const payrollRecords = await prisma.payroll.findMany({
      where: {
        id: { in: validatedData.payrollIds },
        companyId: user.companyId,
        status: { in: ['processed', 'paid'] }, // Only generate for processed/paid payrolls
      },
      include: {
        employee: {
          include: {
            department: true,
            salaryStructures: {
              where: { isActive: true },
              orderBy: { effectiveFrom: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    if (payrollRecords.length === 0) {
      return new NextResponse('No eligible payroll records found', { status: 404 });
    }

    const generatedPayslips = [];
    const errors = [];

    for (const payroll of payrollRecords) {
      try {
        // Check if payslip already exists
        const existingPayslip = await prisma.payslip.findFirst({
          where: { payrollId: payroll.id }
        });

        if (existingPayslip) {
          errors.push(`Payslip already exists for ${payroll.employee.firstName} ${payroll.employee.lastName}`);
          continue;
        }

        // Generate unique payslip number
        const payslipNumber = await generatePayslipNumber(user.companyId, payroll.payrollMonth, payroll.payrollYear);

        // Prepare payslip data
        const payslipData = {
          // Company Information
          company: {
            name: user.company?.name || 'Company Name',
            address: user.company?.address || '',
            phone: user.company?.phone || '',
            email: user.company?.email || '',
            website: user.company?.website || '',
          },
          
          // Employee Information
          employee: {
            name: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
            employeeId: payroll.employee.employeeId,
            designation: payroll.employee.position || payroll.employee.jobTitle || 'Employee',
            department: payroll.employee.department?.name || 'General',
            joiningDate: payroll.employee.startDate || payroll.employee.hireDate,
            bankAccount: payroll.employee.bankAccountNumber || '',
            bankName: payroll.employee.bankName || '',
            panNumber: '', // PAN number not stored in employee model
            aadhaarNumber: '', // Aadhaar number not stored in employee model
          },

          // Payroll Period
          period: {
            month: payroll.payrollMonth,
            year: payroll.payrollYear,
            monthName: getMonthName(payroll.payrollMonth),
            workingDays: payroll.workingDays,
            presentDays: payroll.presentDays,
            leaveDays: payroll.leaveDays,
            lopDays: payroll.lopDays,
          },

          // Earnings
          earnings: {
            basicSalary: payroll.basicSalary,
            hra: payroll.hra,
            conveyance: payroll.conveyance,
            medicalAllowance: payroll.medicalAllowance,
            specialAllowance: payroll.specialAllowance,
            otherAllowances: payroll.otherAllowances,
            bonus: payroll.bonus,
            incentives: payroll.incentives,
            overtimeAmount: payroll.overtimeAmount,
            grossSalary: payroll.grossSalary,
          },

          // Deductions
          deductions: {
            pfEmployee: payroll.pfEmployee,
            esiEmployee: payroll.esiEmployee,
            professionalTax: payroll.professionalTax,
            tds: payroll.tds,
            otherDeductions: payroll.otherDeductions,
            totalDeductions: payroll.totalDeductions,
          },

          // Employer Contributions
          employerContributions: {
            pfEmployer: payroll.pfEmployer,
            esiEmployer: payroll.esiEmployer,
          },

          // Final Amounts
          summary: {
            grossSalary: payroll.grossSalary,
            totalDeductions: payroll.totalDeductions,
            netSalary: payroll.netSalary,
            costToCompany: payroll.grossSalary + payroll.pfEmployer + payroll.esiEmployer,
          },

          // Payment Information
          payment: {
            paymentDate: payroll.paymentDate,
            paymentMode: payroll.paymentMode,
            paymentReference: payroll.paymentReference,
            status: payroll.status,
          },

          // Generation Details
          generation: {
            generatedAt: new Date(),
            generatedBy: user.id,
            payslipNumber,
          }
        };

        // Create payslip record
        const payslip = await prisma.payslip.create({
          data: {
            payrollId: payroll.id,
            employeeId: payroll.employeeId,
            payslipNumber,
            employeeName: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
            employeeId_: payroll.employee.employeeId || payroll.employee.id,
            designation: payroll.employee.position || payroll.employee.jobTitle || 'Employee',
            department: payroll.employee.department?.name,
            bankAccount: payroll.employee.bankAccountNumber,
            bankName: payroll.employee.bankName,
            payslipData,
            generatedBy: user.id,
            companyId: user.companyId,
          },
          include: {
            employee: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        });

        generatedPayslips.push(payslip);

        // Send email if requested
        if (validatedData.sendEmail && payroll.employee.email) {
          // TODO: Implement email sending
          // await sendPayslipEmail(payslip, payroll.employee.email);
        }

      } catch (error) {
        console.error(`Error generating payslip for payroll ${payroll.id}:`, error);
        errors.push(`Failed to generate payslip for ${payroll.employee.firstName} ${payroll.employee.lastName}`);
      }
    }

    return NextResponse.json({
      message: `Generated ${generatedPayslips.length} payslips successfully`,
      generated: generatedPayslips.length,
      errors: errors.length,
      errorMessages: errors,
      payslips: generatedPayslips.map(p => ({
        id: p.id,
        payslipNumber: p.payslipNumber,
        employeeName: p.employeeName,
        generatedAt: p.generatedAt,
      }))
    }, { status: 201 });

  } catch (error) {
    console.error('[PAYSLIPS_POST]', error);
    
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ 
        error: 'Validation failed', 
        details: error.errors 
      }), { status: 400 });
    }

    return new NextResponse('Internal error', { status: 500 });
  }
}

// Helper function to generate unique payslip number
async function generatePayslipNumber(companyId: string, month: number, year: number): Promise<string> {
  const monthStr = month.toString().padStart(2, '0');
  const prefix = `PS-${year}-${monthStr}`;
  
  // Get the count of existing payslips for this month/year
  const count = await prisma.payslip.count({
    where: {
      companyId,
      payslipNumber: {
        startsWith: prefix
      }
    }
  });

  const sequence = (count + 1).toString().padStart(4, '0');
  return `${prefix}-${sequence}`;
}

// Helper function to get month name
function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || 'Unknown';
}
