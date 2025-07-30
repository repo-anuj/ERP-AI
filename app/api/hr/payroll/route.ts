import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema for payroll processing
const payrollProcessSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2030),
  employeeIds: z.array(z.string()).optional(), // If not provided, process all employees
  includeBonus: z.boolean().default(false),
  bonusAmount: z.number().optional(),
  includeIncentives: z.boolean().default(false),
  incentiveAmount: z.number().optional(),
});

// GET - Fetch payroll records
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
    const status = searchParams.get('status');

    // Build where clause
    const whereClause: any = {
      companyId: user.companyId,
    };

    if (month) {
      whereClause.payrollMonth = parseInt(month);
    }

    if (year) {
      whereClause.payrollYear = parseInt(year);
    }

    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    if (status) {
      whereClause.status = status;
    }

    const payrollRecords = await prisma.payroll.findMany({
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
        },
        salaryStructure: {
          select: {
            id: true,
            basicSalary: true,
            hra: true,
            conveyance: true,
            medicalAllowance: true,
            specialAllowance: true,
            effectiveFrom: true,
            effectiveTo: true,
            isActive: true,
          }
        }
      },
      orderBy: [
        { payrollYear: 'desc' },
        { payrollMonth: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(payrollRecords);

  } catch (error) {
    console.error('[PAYROLL_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// POST - Process payroll for a specific month/year
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
    const validatedData = payrollProcessSchema.parse(body);

    // Check if payroll already exists for this month/year
    const existingPayroll = await prisma.payroll.findFirst({
      where: {
        companyId: user.companyId,
        payrollMonth: validatedData.month,
        payrollYear: validatedData.year,
      }
    });

    if (existingPayroll) {
      return new NextResponse('Payroll already processed for this month/year', { status: 400 });
    }

    // Get employees to process
    const employeeFilter: any = {
      companyId: user.companyId,
      status: 'active', // Only process active employees
    };

    if (validatedData.employeeIds && validatedData.employeeIds.length > 0) {
      employeeFilter.id = { in: validatedData.employeeIds };
    }

    const employees = await prisma.employee.findMany({
      where: employeeFilter,
      include: {
        salaryStructures: {
          where: {
            isActive: true,
            effectiveFrom: {
              lte: new Date(validatedData.year, validatedData.month - 1, 1)
            }
          },
          orderBy: { effectiveFrom: 'desc' },
          take: 1
        },
        attendance: {
          where: {
            date: {
              gte: new Date(validatedData.year, validatedData.month - 1, 1),
              lt: new Date(validatedData.year, validatedData.month, 1)
            }
          }
        }
      }
    });

    if (employees.length === 0) {
      return new NextResponse('No employees found to process payroll', { status: 400 });
    }

    // Check if any employees are missing salary structures
    const employeesWithoutSalaryStructures = employees.filter(emp => emp.salaryStructures.length === 0);
    if (employeesWithoutSalaryStructures.length > 0) {
      const missingEmployees = employeesWithoutSalaryStructures.map(emp => ({
        id: emp.id,
        name: `${emp.firstName} ${emp.lastName}`,
        employeeId: emp.employeeId
      }));

      return new NextResponse(JSON.stringify({
        error: 'Some employees are missing salary structures',
        missingEmployees,
        message: 'Please create salary structures for these employees before processing payroll',
        helpEndpoint: '/api/hr/employees/missing-salary-structures'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const payrollRecords = [];
    const financeTransactions = [];
    const skippedEmployees = [];

    // Process each employee
    for (const employee of employees) {
      const salaryStructure = employee.salaryStructures[0];

      if (!salaryStructure) {
        console.warn(`No salary structure found for employee ${employee.id}`);
        skippedEmployees.push({
          id: employee.id,
          name: `${employee.firstName} ${employee.lastName}`,
          employeeId: employee.employeeId,
          reason: 'No active salary structure found'
        });
        continue;
      }

      // Additional check for effectiveTo date (since we simplified the query)
      const payrollDate = new Date(validatedData.year, validatedData.month - 1, 1);
      if (salaryStructure.effectiveTo && salaryStructure.effectiveTo < payrollDate) {
        console.warn(`Salary structure expired for employee ${employee.id}`);
        skippedEmployees.push({
          id: employee.id,
          name: `${employee.firstName} ${employee.lastName}`,
          employeeId: employee.employeeId,
          reason: 'Salary structure expired for this period'
        });
        continue;
      }

      // Calculate working days and attendance
      const daysInMonth = new Date(validatedData.year, validatedData.month, 0).getDate();
      const attendanceRecords = employee.attendance;
      const presentDays = attendanceRecords.filter(a => a.status === 'present').length;
      const leaveDays = attendanceRecords.filter(a => a.status === 'leave').length;
      const lopDays = Math.max(0, daysInMonth - presentDays - leaveDays);

      // Calculate pro-rated salary based on attendance
      // For now, use full salary (attendanceRatio = 1) to avoid calculation errors
      // TODO: Implement proper attendance-based pro-rating later
      const attendanceRatio = 1; // (presentDays + leaveDays) / daysInMonth;

      // Calculate salary components
      const basicSalary = salaryStructure.basicSalary * attendanceRatio;
      const hra = (salaryStructure.hra || 0) * attendanceRatio;
      const conveyance = (salaryStructure.conveyance || 0) * attendanceRatio;
      const medicalAllowance = (salaryStructure.medicalAllowance || 0) * attendanceRatio;
      const specialAllowance = (salaryStructure.specialAllowance || 0) * attendanceRatio;
      
      const grossSalary = basicSalary + hra + conveyance + medicalAllowance + specialAllowance;

      // Calculate deductions
      const pfEmployee = salaryStructure.pfApplicable ? basicSalary * salaryStructure.pfEmployeeRate : 0;
      const pfEmployer = salaryStructure.pfApplicable ? basicSalary * salaryStructure.pfEmployerRate : 0;
      const esiEmployee = salaryStructure.esiApplicable ? grossSalary * salaryStructure.esiEmployeeRate : 0;
      const esiEmployer = salaryStructure.esiApplicable ? grossSalary * salaryStructure.esiEmployerRate : 0;
      const professionalTax = salaryStructure.professionalTax || 0;
      // Calculate TDS only if gross salary is above exemption limit (₹2.5 lakh annually)
      const annualGross = grossSalary * 12;
      const tds = (annualGross > 250000 && salaryStructure.tdsRate) ?
                  grossSalary * Math.min(salaryStructure.tdsRate, 0.3) : 0; // Cap TDS at 30%

      const totalDeductions = pfEmployee + esiEmployee + professionalTax + tds;

      // Add bonus and incentives if specified
      const bonus = validatedData.includeBonus ? (validatedData.bonusAmount || 0) : 0;
      const incentives = validatedData.includeIncentives ? (validatedData.incentiveAmount || 0) : 0;

      const netSalary = grossSalary + bonus + incentives - totalDeductions;

      // Create payroll record
      const payrollRecord = {
        employeeId: employee.id,
        salaryStructureId: salaryStructure.id, // Connect to salary structure
        payrollMonth: validatedData.month,
        payrollYear: validatedData.year,
        basicSalary,
        hra,
        conveyance,
        medicalAllowance,
        specialAllowance,
        otherAllowances: 0,
        grossSalary,
        pfEmployee,
        pfEmployer,
        esiEmployee,
        esiEmployer,
        professionalTax,
        tds,
        otherDeductions: 0,
        totalDeductions,
        overtimeHours: 0,
        overtimeAmount: 0,
        bonus,
        incentives,
        netSalary,
        status: 'draft',
        workingDays: daysInMonth,
        presentDays,
        leaveDays,
        lopDays,
        companyId: user.companyId,
      };

      payrollRecords.push(payrollRecord);

      // Prepare finance transaction for salary expense
      financeTransactions.push({
        date: new Date(),
        description: `Salary - ${employee.firstName} ${employee.lastName} (${validatedData.month}/${validatedData.year})`,
        amount: netSalary,
        type: 'expense',
        category: 'Salary & Benefits',
        reference: `PAY-${validatedData.year}-${validatedData.month.toString().padStart(2, '0')}-${employee.employeeId}`,
        status: 'pending',
        sourceType: 'payroll',
        companyId: user.companyId,
        userId: user.id,
        relatedTo: employee.id,
      });

      // Add employer contributions as separate expense transactions
      if (pfEmployer > 0) {
        financeTransactions.push({
          date: new Date(),
          description: `PF Employer Contribution - ${employee.firstName} ${employee.lastName} (${validatedData.month}/${validatedData.year})`,
          amount: pfEmployer,
          type: 'expense',
          category: 'Statutory Contributions',
          reference: `PF-EMP-${validatedData.year}-${validatedData.month.toString().padStart(2, '0')}-${employee.employeeId}`,
          status: 'pending',
          sourceType: 'payroll',
          companyId: user.companyId,
          userId: user.id,
          relatedTo: employee.id,
        });
      }

      if (esiEmployer > 0) {
        financeTransactions.push({
          date: new Date(),
          description: `ESI Employer Contribution - ${employee.firstName} ${employee.lastName} (${validatedData.month}/${validatedData.year})`,
          amount: esiEmployer,
          type: 'expense',
          category: 'Statutory Contributions',
          reference: `ESI-EMP-${validatedData.year}-${validatedData.month.toString().padStart(2, '0')}-${employee.employeeId}`,
          status: 'pending',
          sourceType: 'payroll',
          companyId: user.companyId,
          userId: user.id,
          relatedTo: employee.id,
        });
      }
    }

    // Check if we have any payroll records to create
    if (payrollRecords.length === 0) {
      const errorMessage = skippedEmployees.length > 0
        ? `No employees with valid salary structures found to process payroll. Skipped employees: ${skippedEmployees.map(emp => `${emp.name} (${emp.reason})`).join(', ')}`
        : 'No employees found to process payroll';

      return NextResponse.json({
        error: errorMessage,
        skippedEmployees,
        processedCount: 0
      }, { status: 400 });
    }

    // Create payroll records in database
    const createdPayrollRecords = await prisma.payroll.createMany({
      data: payrollRecords
    });

    // Create finance transactions if any
    if (financeTransactions.length > 0) {
      try {
        await prisma.transaction.createMany({
          data: financeTransactions
        });
      } catch (error) {
        console.warn('Failed to create finance transactions:', error);
        // Continue even if finance transactions fail
      }
    }

    return NextResponse.json({
      message: `Payroll processed successfully for ${payrollRecords.length} employees`,
      processedCount: payrollRecords.length,
      skippedCount: skippedEmployees.length,
      skippedEmployees,
      month: validatedData.month,
      year: validatedData.year,
      totalGrossSalary: payrollRecords.reduce((sum, record) => sum + record.grossSalary, 0),
      totalNetSalary: payrollRecords.reduce((sum, record) => sum + record.netSalary, 0),
      totalDeductions: payrollRecords.reduce((sum, record) => sum + record.totalDeductions, 0),
    }, { status: 201 });

  } catch (error) {
    console.error('[PAYROLL_POST]', error);
    
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ 
        error: 'Validation failed', 
        details: error.errors 
      }), { status: 400 });
    }

    return new NextResponse('Internal error', { status: 500 });
  }
}
