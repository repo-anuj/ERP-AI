const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugSalaryCalculation() {
  try {
    console.log('🔍 Debugging salary calculation issues...\n');

    // Get the payroll record with negative salary
    const negativePayroll = await prisma.payroll.findFirst({
      where: {
        netSalary: { lt: 0 }
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

    if (negativePayroll) {
      console.log('❌ Found payroll with negative net salary:');
      console.log(`   Employee: ${negativePayroll.employee.firstName} ${negativePayroll.employee.lastName}`);
      console.log(`   Net Salary: ₹${negativePayroll.netSalary}`);
      console.log('\n📊 Detailed Breakdown:');
      console.log(`   Basic Salary: ₹${negativePayroll.basicSalary}`);
      console.log(`   HRA: ₹${negativePayroll.hra}`);
      console.log(`   Conveyance: ₹${negativePayroll.conveyance}`);
      console.log(`   Medical Allowance: ₹${negativePayroll.medicalAllowance}`);
      console.log(`   Special Allowance: ₹${negativePayroll.specialAllowance}`);
      console.log(`   Other Allowances: ₹${negativePayroll.otherAllowances}`);
      console.log(`   Gross Salary: ₹${negativePayroll.grossSalary}`);
      console.log('\n💸 Deductions:');
      console.log(`   PF Employee: ₹${negativePayroll.pfEmployee}`);
      console.log(`   PF Employer: ₹${negativePayroll.pfEmployer}`);
      console.log(`   ESI Employee: ₹${negativePayroll.esiEmployee}`);
      console.log(`   ESI Employer: ₹${negativePayroll.esiEmployer}`);
      console.log(`   Professional Tax: ₹${negativePayroll.professionalTax}`);
      console.log(`   TDS: ₹${negativePayroll.tds}`);
      console.log(`   Other Deductions: ₹${negativePayroll.otherDeductions}`);
      console.log(`   Total Deductions: ₹${negativePayroll.totalDeductions}`);
      console.log('\n🧮 Calculation Check:');
      
      const calculatedGross = negativePayroll.basicSalary + negativePayroll.hra + 
                             negativePayroll.conveyance + negativePayroll.medicalAllowance + 
                             negativePayroll.specialAllowance + negativePayroll.otherAllowances;
      
      const calculatedDeductions = negativePayroll.pfEmployee + negativePayroll.esiEmployee + 
                                  negativePayroll.professionalTax + negativePayroll.tds + 
                                  negativePayroll.otherDeductions;
      
      const calculatedNet = calculatedGross - calculatedDeductions;
      
      console.log(`   Calculated Gross: ₹${calculatedGross} (stored: ₹${negativePayroll.grossSalary})`);
      console.log(`   Calculated Deductions: ₹${calculatedDeductions} (stored: ₹${negativePayroll.totalDeductions})`);
      console.log(`   Calculated Net: ₹${calculatedNet} (stored: ₹${negativePayroll.netSalary})`);
      
      if (negativePayroll.salaryStructure) {
        console.log('\n📋 Salary Structure Details:');
        console.log(`   Basic Salary: ₹${negativePayroll.salaryStructure.basicSalary}`);
        console.log(`   HRA: ₹${negativePayroll.salaryStructure.hra || 0}`);
        console.log(`   Conveyance: ₹${negativePayroll.salaryStructure.conveyance || 0}`);
        console.log(`   Medical Allowance: ₹${negativePayroll.salaryStructure.medicalAllowance || 0}`);
        console.log(`   Special Allowance: ₹${negativePayroll.salaryStructure.specialAllowance || 0}`);
        console.log(`   PF Employee Rate: ${negativePayroll.salaryStructure.pfEmployeeRate * 100}%`);
        console.log(`   ESI Employee Rate: ${negativePayroll.salaryStructure.esiEmployeeRate * 100}%`);
        console.log(`   Professional Tax: ₹${negativePayroll.salaryStructure.professionalTax || 0}`);
      }
    }

    // Check all payroll records for calculation issues
    console.log('\n🔍 Checking all payroll records...');
    const allPayrolls = await prisma.payroll.findMany({
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true
          }
        }
      }
    });

    console.log(`\nFound ${allPayrolls.length} payroll records:`);
    allPayrolls.forEach(payroll => {
      const status = payroll.netSalary < 0 ? '❌' : '✅';
      console.log(`   ${status} ${payroll.employee.firstName} ${payroll.employee.lastName}: ₹${payroll.netSalary}`);
    });

    // Fix the negative salary records
    console.log('\n🔧 Fixing negative salary calculations...');
    
    for (const payroll of allPayrolls) {
      if (payroll.netSalary < 0) {
        console.log(`\nFixing ${payroll.employee.firstName} ${payroll.employee.lastName}...`);
        
        // Get the salary structure
        const salaryStructure = await prisma.salaryStructure.findUnique({
          where: { id: payroll.salaryStructureId }
        });

        if (salaryStructure) {
          // Recalculate correctly
          const basicSalary = salaryStructure.basicSalary;
          const hra = salaryStructure.hra || 0;
          const conveyance = salaryStructure.conveyance || 0;
          const medicalAllowance = salaryStructure.medicalAllowance || 0;
          const specialAllowance = salaryStructure.specialAllowance || 0;
          
          const grossSalary = basicSalary + hra + conveyance + medicalAllowance + specialAllowance;
          
          // Calculate deductions properly
          const pfEmployee = salaryStructure.pfApplicable ? basicSalary * salaryStructure.pfEmployeeRate : 0;
          const pfEmployer = salaryStructure.pfApplicable ? basicSalary * salaryStructure.pfEmployerRate : 0;
          const esiEmployee = salaryStructure.esiApplicable ? grossSalary * salaryStructure.esiEmployeeRate : 0;
          const esiEmployer = salaryStructure.esiApplicable ? grossSalary * salaryStructure.esiEmployerRate : 0;
          const professionalTax = salaryStructure.professionalTax || 0;
          
          const totalDeductions = pfEmployee + esiEmployee + professionalTax;
          const netSalary = grossSalary - totalDeductions;
          
          console.log(`   Old Net: ₹${payroll.netSalary} → New Net: ₹${netSalary}`);
          
          // Update the payroll record
          await prisma.payroll.update({
            where: { id: payroll.id },
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
              totalDeductions: totalDeductions,
              netSalary: netSalary
            }
          });
          
          console.log(`   ✅ Fixed!`);
        }
      }
    }

    console.log('\n🎉 Salary calculation fix completed!');

  } catch (error) {
    console.error('Error debugging salary calculation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
debugSalaryCalculation();
