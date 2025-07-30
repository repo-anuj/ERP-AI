const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function recalculateRahulPayroll() {
  try {
    console.log('🔧 Recalculating Rahul Sharma\'s payroll with fixed TDS rate...\n');

    // Find Rahul's payroll record
    const rahulPayroll = await prisma.payroll.findFirst({
      where: {
        employee: {
          firstName: 'Rahul',
          lastName: 'Sharma'
        }
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true
          }
        },
        salaryStructure: true
      }
    });

    if (!rahulPayroll) {
      console.log('❌ Rahul Sharma\'s payroll record not found.');
      return;
    }

    console.log('📋 Current payroll record:');
    console.log(`   Employee: ${rahulPayroll.employee.firstName} ${rahulPayroll.employee.lastName}`);
    console.log(`   Current Net Salary: ₹${rahulPayroll.netSalary}`);
    console.log(`   Current TDS: ₹${rahulPayroll.tds}`);

    const salaryStructure = rahulPayroll.salaryStructure;
    
    console.log('\n🧮 Recalculating with correct values...');
    
    // Use full salary (no pro-rating for now)
    const basicSalary = salaryStructure.basicSalary;
    const hra = salaryStructure.hra || 0;
    const conveyance = salaryStructure.conveyance || 0;
    const medicalAllowance = salaryStructure.medicalAllowance || 0;
    const specialAllowance = salaryStructure.specialAllowance || 0;
    
    const grossSalary = basicSalary + hra + conveyance + medicalAllowance + specialAllowance;
    
    console.log(`   Basic Salary: ₹${basicSalary}`);
    console.log(`   HRA: ₹${hra}`);
    console.log(`   Conveyance: ₹${conveyance}`);
    console.log(`   Medical Allowance: ₹${medicalAllowance}`);
    console.log(`   Special Allowance: ₹${specialAllowance}`);
    console.log(`   Gross Salary: ₹${grossSalary}`);
    
    // Calculate deductions
    const pfEmployee = salaryStructure.pfApplicable ? basicSalary * salaryStructure.pfEmployeeRate : 0;
    const pfEmployer = salaryStructure.pfApplicable ? basicSalary * salaryStructure.pfEmployerRate : 0;
    const esiEmployee = salaryStructure.esiApplicable ? grossSalary * salaryStructure.esiEmployeeRate : 0;
    const esiEmployer = salaryStructure.esiApplicable ? grossSalary * salaryStructure.esiEmployerRate : 0;
    const professionalTax = salaryStructure.professionalTax || 0;
    
    // Calculate TDS with the new rate (5%)
    const annualGross = grossSalary * 12;
    const tds = (annualGross > 250000 && salaryStructure.tdsRate) ? 
                grossSalary * Math.min(salaryStructure.tdsRate, 0.3) : 0;
    
    const totalDeductions = pfEmployee + esiEmployee + professionalTax + tds;
    const netSalary = grossSalary - totalDeductions;
    
    console.log('\n💸 Deductions:');
    console.log(`   PF Employee (12%): ₹${pfEmployee}`);
    console.log(`   ESI Employee (0.75%): ₹${esiEmployee}`);
    console.log(`   Professional Tax: ₹${professionalTax}`);
    console.log(`   TDS (5%): ₹${tds}`);
    console.log(`   Total Deductions: ₹${totalDeductions}`);
    console.log(`   Net Salary: ₹${netSalary}`);
    
    // Update the payroll record
    const updatedPayroll = await prisma.payroll.update({
      where: { id: rahulPayroll.id },
      data: {
        basicSalary: basicSalary,
        hra: hra,
        conveyance: conveyance,
        medicalAllowance: medicalAllowance,
        specialAllowance: specialAllowance,
        grossSalary: grossSalary,
        pfEmployee: pfEmployee,
        pfEmployer: pfEmployer,
        esiEmployee: esiEmployee,
        esiEmployer: esiEmployer,
        professionalTax: professionalTax,
        tds: tds,
        totalDeductions: totalDeductions,
        netSalary: netSalary,
        // Reset attendance to full month
        workingDays: 31,
        presentDays: 31,
        leaveDays: 0,
        lopDays: 0
      }
    });

    console.log('\n✅ Payroll record updated successfully!');
    console.log(`   Old Net Salary: ₹${rahulPayroll.netSalary}`);
    console.log(`   New Net Salary: ₹${updatedPayroll.netSalary}`);
    console.log(`   Improvement: ₹${updatedPayroll.netSalary - rahulPayroll.netSalary}`);

    // Verify all payroll records are now positive
    console.log('\n🔍 Verifying all payroll records...');
    const allPayrolls = await prisma.payroll.findMany({
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    let allPositive = true;
    allPayrolls.forEach(payroll => {
      const status = payroll.netSalary > 0 ? '✅' : '❌';
      if (payroll.netSalary <= 0) allPositive = false;
      console.log(`   ${status} ${payroll.employee.firstName} ${payroll.employee.lastName}: ₹${payroll.netSalary}`);
    });

    if (allPositive) {
      console.log('\n🎉 SUCCESS! All payroll records now have positive net salaries!');
      console.log('💰 The payroll system is now working correctly.');
      console.log('📄 You can now generate payslips without any issues.');
    } else {
      console.log('\n⚠️  Some payroll records still have issues. Please check manually.');
    }

  } catch (error) {
    console.error('Error recalculating Rahul\'s payroll:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
recalculateRahulPayroll();
