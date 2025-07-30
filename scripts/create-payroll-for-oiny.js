const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createPayrollForOiny() {
  try {
    console.log('🏢 Creating payroll records for Oiny company...\n');

    const oinyCompanyId = '67ab6f97ed85baa0ef51d95d';
    const payrollMonth = 7;
    const payrollYear = 2025;

    // Get all employees from Oiny company with their salary structures
    const employees = await prisma.employee.findMany({
      where: {
        companyId: oinyCompanyId,
        status: 'active'
      },
      include: {
        salaryStructures: {
          where: {
            isActive: true,
            effectiveFrom: {
              lte: new Date(payrollYear, payrollMonth - 1, 1)
            }
          },
          orderBy: { effectiveFrom: 'desc' },
          take: 1
        }
      }
    });

    console.log(`Found ${employees.length} active employees in Oiny company:\n`);

    if (employees.length === 0) {
      console.log('❌ No active employees found in Oiny company.');
      return;
    }

    const payrollRecords = [];
    const skippedEmployees = [];

    for (const employee of employees) {
      const salaryStructure = employee.salaryStructures[0];

      if (!salaryStructure) {
        console.log(`⚠️  Skipping ${employee.firstName} ${employee.lastName}: No salary structure`);
        skippedEmployees.push(employee);
        continue;
      }

      // Check if payroll already exists
      const existingPayroll = await prisma.payroll.findFirst({
        where: {
          employeeId: employee.id,
          payrollMonth: payrollMonth,
          payrollYear: payrollYear,
          companyId: oinyCompanyId
        }
      });

      if (existingPayroll) {
        console.log(`⚠️  Skipping ${employee.firstName} ${employee.lastName}: Payroll already exists`);
        continue;
      }

      // Calculate salary components (simplified calculation)
      const basicSalary = salaryStructure.basicSalary;
      const hra = salaryStructure.hra || 0;
      const conveyance = salaryStructure.conveyance || 0;
      const medicalAllowance = salaryStructure.medicalAllowance || 0;
      const specialAllowance = salaryStructure.specialAllowance || 0;
      
      const grossSalary = basicSalary + hra + conveyance + medicalAllowance + specialAllowance;

      // Calculate deductions
      const pfEmployee = salaryStructure.pfApplicable ? basicSalary * salaryStructure.pfEmployeeRate : 0;
      const esiEmployee = salaryStructure.esiApplicable ? grossSalary * salaryStructure.esiEmployeeRate : 0;
      const professionalTax = salaryStructure.professionalTax || 0;
      
      const totalDeductions = pfEmployee + esiEmployee + professionalTax;
      const netSalary = grossSalary - totalDeductions;

      const payrollRecord = {
        employeeId: employee.id,
        salaryStructureId: salaryStructure.id,
        payrollMonth: payrollMonth,
        payrollYear: payrollYear,
        basicSalary: basicSalary,
        hra: hra,
        conveyance: conveyance,
        medicalAllowance: medicalAllowance,
        specialAllowance: specialAllowance,
        otherAllowances: 0,
        grossSalary: grossSalary,
        pfEmployee: pfEmployee,
        pfEmployer: salaryStructure.pfApplicable ? basicSalary * salaryStructure.pfEmployerRate : 0,
        esiEmployee: esiEmployee,
        esiEmployer: salaryStructure.esiApplicable ? grossSalary * salaryStructure.esiEmployerRate : 0,
        professionalTax: professionalTax,
        tds: 0,
        otherDeductions: 0,
        totalDeductions: totalDeductions,
        overtimeHours: 0,
        overtimeAmount: 0,
        bonus: 0,
        incentives: 0,
        netSalary: netSalary,
        status: 'processed', // Set to processed so payslips can be generated
        workingDays: 31, // July has 31 days
        presentDays: 31, // Assume full attendance
        leaveDays: 0,
        lopDays: 0,
        companyId: oinyCompanyId,
      };

      payrollRecords.push(payrollRecord);
      
      console.log(`✅ Prepared payroll for ${employee.firstName} ${employee.lastName}`);
      console.log(`   Basic: ₹${basicSalary}, Gross: ₹${grossSalary}, Net: ₹${netSalary}`);
    }

    if (payrollRecords.length === 0) {
      console.log('\n❌ No payroll records to create.');
      return;
    }

    console.log(`\n💾 Creating ${payrollRecords.length} payroll records...`);

    // Create all payroll records
    const createdRecords = await prisma.payroll.createMany({
      data: payrollRecords
    });

    console.log(`\n🎉 SUCCESS! Created ${createdRecords.count} payroll records for Oiny company.`);
    console.log(`📅 Month/Year: ${payrollMonth}/${payrollYear}`);
    console.log(`🏢 Company: Oiny (${oinyCompanyId})`);
    console.log(`📊 Status: processed (ready for payslip generation)`);

    if (skippedEmployees.length > 0) {
      console.log(`\n⚠️  Skipped ${skippedEmployees.length} employees (no salary structure)`);
    }

  } catch (error) {
    console.error('Error creating payroll for Oiny:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createPayrollForOiny();
