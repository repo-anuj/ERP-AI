const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testFixedPayrollQuery() {
  try {
    console.log('🧪 Testing the fixed payroll query...\n');

    const payrollMonth = 7;
    const payrollYear = 2025;
    const payrollDate = new Date(payrollYear, payrollMonth - 1, 1);

    console.log(`Testing payroll for: ${payrollMonth}/${payrollYear}`);
    console.log(`Payroll Date: ${payrollDate.toISOString()}\n`);

    // Test the simplified query (without OR condition)
    const employees = await prisma.employee.findMany({
      where: {
        status: 'active'
      },
      include: {
        salaryStructures: {
          where: {
            isActive: true,
            effectiveFrom: {
              lte: payrollDate
            }
          },
          orderBy: { effectiveFrom: 'desc' },
          take: 1
        }
      }
    });

    console.log(`Found ${employees.length} employees:`);

    let validEmployees = 0;
    let invalidEmployees = 0;

    employees.forEach(employee => {
      const salaryStructure = employee.salaryStructures[0];
      
      if (!salaryStructure) {
        console.log(`❌ ${employee.firstName} ${employee.lastName}: No salary structure`);
        invalidEmployees++;
        return;
      }

      // Check effectiveTo condition manually
      const isValidForPeriod = !salaryStructure.effectiveTo || salaryStructure.effectiveTo >= payrollDate;
      
      if (isValidForPeriod) {
        console.log(`✅ ${employee.firstName} ${employee.lastName}: Valid salary structure`);
        console.log(`   Structure ID: ${salaryStructure.id}`);
        console.log(`   Basic Salary: ₹${salaryStructure.basicSalary}`);
        console.log(`   Effective From: ${salaryStructure.effectiveFrom.toISOString().split('T')[0]}`);
        console.log(`   Effective To: ${salaryStructure.effectiveTo ? salaryStructure.effectiveTo.toISOString().split('T')[0] : 'Ongoing'}`);
        validEmployees++;
      } else {
        console.log(`❌ ${employee.firstName} ${employee.lastName}: Salary structure expired`);
        console.log(`   Effective To: ${salaryStructure.effectiveTo.toISOString().split('T')[0]}`);
        invalidEmployees++;
      }
      console.log('');
    });

    console.log('📊 SUMMARY:');
    console.log(`Total Employees: ${employees.length}`);
    console.log(`Valid for Payroll: ${validEmployees}`);
    console.log(`Invalid for Payroll: ${invalidEmployees}`);

    if (validEmployees === employees.length && employees.length > 0) {
      console.log('\n🎉 SUCCESS! All employees have valid salary structures for payroll processing!');
      console.log('The payroll API should now work correctly.');
    } else if (validEmployees > 0) {
      console.log('\n✅ PARTIAL SUCCESS! Some employees have valid salary structures.');
      console.log('The payroll API should work for valid employees.');
    } else {
      console.log('\n❌ ISSUE: No employees have valid salary structures.');
    }

  } catch (error) {
    console.error('Error testing payroll query:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
testFixedPayrollQuery();
