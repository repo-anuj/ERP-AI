const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixSalaryStructureTDS() {
  try {
    console.log('🔧 Fixing salary structure TDS rates...\n');

    // Find salary structures with problematic TDS rates
    const salaryStructures = await prisma.salaryStructure.findMany({
      where: {
        OR: [
          { tdsRate: { gt: 0.3 } }, // TDS rate greater than 30%
          { tdsRate: 1.0 } // TDS rate of 100%
        ]
      },
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

    console.log(`Found ${salaryStructures.length} salary structures with problematic TDS rates:\n`);

    if (salaryStructures.length === 0) {
      console.log('✅ No problematic TDS rates found.');
      return;
    }

    for (const structure of salaryStructures) {
      console.log(`❌ ${structure.employee.firstName} ${structure.employee.lastName}:`);
      console.log(`   Current TDS Rate: ${structure.tdsRate * 100}%`);
      console.log(`   Basic Salary: ₹${structure.basicSalary}`);
      
      // Calculate reasonable TDS rate (10% for high earners, 0% for others)
      const annualSalary = structure.basicSalary * 12;
      let newTdsRate = 0;
      
      if (annualSalary > 1000000) { // Above 10 lakh annually
        newTdsRate = 0.1; // 10%
      } else if (annualSalary > 500000) { // Above 5 lakh annually
        newTdsRate = 0.05; // 5%
      } else {
        newTdsRate = 0; // No TDS for lower salaries
      }
      
      console.log(`   New TDS Rate: ${newTdsRate * 100}%`);
      
      // Update the salary structure
      await prisma.salaryStructure.update({
        where: { id: structure.id },
        data: { tdsRate: newTdsRate }
      });
      
      console.log(`   ✅ Updated!\n`);
    }

    console.log('🎉 TDS rate fixes completed!');

    // Also check for any other calculation issues
    console.log('\n🔍 Checking for other calculation issues...');
    
    const allStructures = await prisma.salaryStructure.findMany({
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    console.log('\n📊 All salary structures summary:');
    allStructures.forEach(structure => {
      const grossSalary = structure.basicSalary + (structure.hra || 0) + 
                         (structure.conveyance || 0) + (structure.medicalAllowance || 0) + 
                         (structure.specialAllowance || 0);
      
      console.log(`   ${structure.employee.firstName} ${structure.employee.lastName}:`);
      console.log(`     Basic: ₹${structure.basicSalary}, Gross: ₹${grossSalary}`);
      console.log(`     PF Rate: ${structure.pfEmployeeRate * 100}%, ESI Rate: ${structure.esiEmployeeRate * 100}%`);
      console.log(`     TDS Rate: ${(structure.tdsRate || 0) * 100}%`);
      console.log('');
    });

  } catch (error) {
    console.error('Error fixing salary structure TDS:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixSalaryStructureTDS();
