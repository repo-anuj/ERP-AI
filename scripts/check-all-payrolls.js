const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAllPayrolls() {
  try {
    console.log('🔍 Checking all payroll records...\n');

    // Get all payroll records
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
        { payrollYear: 'desc' },
        { payrollMonth: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    console.log(`Total payroll records found: ${allPayrolls.length}\n`);

    if (allPayrolls.length === 0) {
      console.log('❌ No payroll records found!');
      console.log('💡 You need to process payroll first using the payroll API.');
      console.log('   POST /api/hr/payroll with month and year parameters.');
      return;
    }

    // Group by status
    const statusGroups = {};
    allPayrolls.forEach(payroll => {
      if (!statusGroups[payroll.status]) {
        statusGroups[payroll.status] = [];
      }
      statusGroups[payroll.status].push(payroll);
    });

    console.log('📊 Payroll records by status:\n');
    Object.keys(statusGroups).forEach(status => {
      const records = statusGroups[status];
      console.log(`${getStatusIcon(status)} ${status.toUpperCase()}: ${records.length} records`);
      
      records.forEach(payroll => {
        console.log(`   - ${payroll.employee.firstName} ${payroll.employee.lastName} (${payroll.employee.employeeId || 'No ID'})`);
        console.log(`     Month/Year: ${payroll.payrollMonth}/${payroll.payrollYear}`);
        console.log(`     Net Salary: ₹${payroll.netSalary}`);
        console.log(`     Created: ${payroll.createdAt.toISOString().split('T')[0]}`);
        console.log('');
      });
    });

    // Check eligibility for payslip generation
    const eligibleForPayslips = allPayrolls.filter(p => p.status === 'processed' || p.status === 'paid');
    console.log(`\n💡 Payslip Generation Status:`);
    console.log(`   Eligible records (processed/paid): ${eligibleForPayslips.length}`);
    console.log(`   Total records: ${allPayrolls.length}`);
    
    if (eligibleForPayslips.length === 0) {
      console.log('\n🔧 To generate payslips:');
      console.log('   1. Process payroll records (change status to "processed")');
      console.log('   2. Use bulk payroll processing API to approve records');
      console.log('   3. Then generate payslips');
    } else {
      console.log('\n✅ Ready to generate payslips for eligible records!');
    }

  } catch (error) {
    console.error('Error checking payrolls:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function getStatusIcon(status) {
  switch (status) {
    case 'draft': return '📝';
    case 'processed': return '✅';
    case 'paid': return '💰';
    case 'cancelled': return '❌';
    default: return '❓';
  }
}

// Run the script
checkAllPayrolls();
