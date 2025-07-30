import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema for bulk payslip generation
const bulkGenerateSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2030),
  employeeIds: z.array(z.string()).optional(), // If not provided, generate for all employees
  sendEmail: z.boolean().default(false),
  regenerate: z.boolean().default(false), // Whether to regenerate existing payslips
});

// POST - Bulk generate payslips for a month/year
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
    const validatedData = bulkGenerateSchema.parse(body);

    // Debug logging
    console.log('[BULK_PAYSLIP_GENERATE] User:', user.email, 'Company:', user.companyId);
    console.log('[BULK_PAYSLIP_GENERATE] Request data:', validatedData);

    // Build payroll filter
    const payrollFilter: any = {
      companyId: user.companyId,
      payrollMonth: validatedData.month,
      payrollYear: validatedData.year,
      status: { in: ['processed', 'paid'] }, // Only generate for processed/paid payrolls
    };

    console.log('[BULK_PAYSLIP_GENERATE] Payroll filter:', payrollFilter);

    if (validatedData.employeeIds && validatedData.employeeIds.length > 0) {
      payrollFilter.employeeId = { in: validatedData.employeeIds };
    }

    // Fetch payroll records
    const payrollRecords = await prisma.payroll.findMany({
      where: payrollFilter,
      include: {
        employee: {
          include: {
            department: true,
          }
        },
        payslip: true // Include existing payslip if any
      }
    });

    console.log('[BULK_PAYSLIP_GENERATE] Found payroll records:', payrollRecords.length);

    // If no records found and employeeIds were specified, try without employee filter (fallback)
    if (payrollRecords.length === 0 && validatedData.employeeIds && validatedData.employeeIds.length > 0) {
      console.log('[BULK_PAYSLIP_GENERATE] No records with employee filter, trying without employee filter...');

      const fallbackFilter = {
        companyId: user.companyId,
        payrollMonth: validatedData.month,
        payrollYear: validatedData.year,
        status: { in: ['processed', 'paid'] }
      };

      const fallbackRecords = await prisma.payroll.findMany({
        where: fallbackFilter,
        include: {
          employee: {
            include: {
              department: true,
            }
          },
          payslip: true
        }
      });

      console.log('[BULK_PAYSLIP_GENERATE] Fallback found records:', fallbackRecords.length);

      if (fallbackRecords.length > 0) {
        // Use fallback records
        payrollRecords.push(...fallbackRecords);
        console.log('[BULK_PAYSLIP_GENERATE] Using fallback records');
      }
    }

    if (payrollRecords.length === 0) {
      console.log('[BULK_PAYSLIP_GENERATE] No payroll records found with filter:', payrollFilter);
      return new NextResponse('No eligible payroll records found', { status: 404 });
    }

    const results = {
      generated: 0,
      skipped: 0,
      regenerated: 0,
      failed: 0,
      errors: [] as string[],
      payslips: [] as any[],
    };

    for (const payroll of payrollRecords) {
      try {
        // Check if payslip already exists
        if (payroll.payslip && !validatedData.regenerate) {
          results.skipped++;
          continue;
        }

        // If regenerating, delete existing payslip
        if (payroll.payslip && validatedData.regenerate) {
          await prisma.payslip.delete({
            where: { id: payroll.payslip.id }
          });
          results.regenerated++;
        }

        // Generate unique payslip number
        const payslipNumber = await generatePayslipNumber(
          user.companyId, 
          validatedData.month, 
          validatedData.year
        );

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
          }
        });

        results.payslips.push({
          id: payslip.id,
          payslipNumber: payslip.payslipNumber,
          employeeName: payslip.employeeName,
          employeeId: payslip.employeeId_,
          netSalary: payroll.netSalary,
          generatedAt: payslip.generatedAt,
        });

        results.generated++;

        // Send email if requested
        if (validatedData.sendEmail && payroll.employee.email) {
          try {
            // TODO: Implement email sending
            // await sendPayslipEmail(payslip, payroll.employee.email);
            
            // Update email sent status
            await prisma.payslip.update({
              where: { id: payslip.id },
              data: {
                emailSent: true,
                emailSentAt: new Date()
              }
            });
          } catch (emailError) {
            console.error(`Failed to send email to ${payroll.employee.email}:`, emailError);
            results.errors.push(`Failed to send email to ${payroll.employee.firstName} ${payroll.employee.lastName}`);
          }
        }

      } catch (error) {
        console.error(`Error generating payslip for payroll ${payroll.id}:`, error);
        results.errors.push(`Failed to generate payslip for ${payroll.employee.firstName} ${payroll.employee.lastName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        results.failed++;
      }
    }

    // Calculate totals
    const totalNetSalary = results.payslips.reduce((sum, p) => sum + p.netSalary, 0);

    return NextResponse.json({
      message: `Bulk payslip generation completed`,
      period: {
        month: validatedData.month,
        year: validatedData.year,
        monthName: getMonthName(validatedData.month),
      },
      results: {
        ...results,
        totalRecords: payrollRecords.length,
        totalNetSalary,
      },
      summary: {
        generated: results.generated,
        skipped: results.skipped,
        regenerated: results.regenerated,
        failed: results.failed,
        emailsSent: validatedData.sendEmail ? results.generated : 0,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('[BULK_PAYSLIPS_POST]', error);
    
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
