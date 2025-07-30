const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyPayrollStatus() {
  try {
    console.log('🔍 Verifying current payroll status...\n');

    const allPayrolls = await prisma.payroll.findMany({
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true
          }
        }
      },
      orderBy: [
        { netSalary: 'asc' }
      ]
    });

    console.log(`📊 Found ${allPayrolls.length} payroll records:\n`);

    let positiveCount = 0;
    let negativeCount = 0;

    allPayrolls.forEach(payroll => {
      const status = payroll.netSalary > 0 ? '✅' : '❌';
      const company = payroll.companyId === '67ab6f97ed85baa0ef51d95d' ? 'Oiny' : 'RaoTech';
      
      console.log(`${status} ${payroll.employee.firstName} ${payroll.employee.lastName} (${company}): ₹${payroll.netSalary.toFixed(2)}`);
      
      if (payroll.netSalary > 0) {
        positiveCount++;
      } else {
        negativeCount++;
      }
    });

    console.log(`\n📈 Summary:`);
    console.log(`   Positive salaries: ${positiveCount}`);
    console.log(`   Negative salaries: ${negativeCount}`);
    console.log(`   Total records: ${allPayrolls.length}`);

    if (negativeCount === 0) {
      console.log('\n🎉 SUCCESS! All payroll records have positive net salaries!');
      console.log('💰 The salary calculation issue has been resolved.');
      console.log('📄 Payslip generation should now work correctly.');
    } else {
      console.log('\n⚠️  There are still some negative salary records that need fixing.');
    }

  } catch (error) {
    console.error('Error verifying payroll status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyPayrollStatus();
