const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPayrollStatus() {
  try {
    console.log('🔍 Checking payroll records and their statuses...\n');

    // Get all payroll records
    const payrollRecords = await prisma.payroll.findMany({
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true
          }
        },
        company: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        { payrollYear: 'desc' },
        { payrollMonth: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    console.log(`Found ${payrollRecords.length} payroll records:\n`);

    if (payrollRecords.length === 0) {
      console.log('❌ No payroll records found!');
      console.log('You need to process payroll first before generating payslips.');
      return;
    }

    // Group by month/year and status
    const groupedRecords = {};
    
    payrollRecords.forEach(record => {
      const key = `${record.payrollYear}-${record.payrollMonth.toString().padStart(2, '0')}`;
      if (!groupedRecords[key]) {
        groupedRecords[key] = {
          month: record.payrollMonth,
          year: record.payrollYear,
          records: []
        };
      }
      groupedRecords[key].records.push(record);
    });

    // Display grouped results
    Object.keys(groupedRecords).sort().reverse().forEach(key => {
      const group = groupedRecords[key];
      console.log(`📅 ${getMonthName(group.month)} ${group.year}:`);
      
      const statusCounts = {};
      group.records.forEach(record => {
        statusCounts[record.status] = (statusCounts[record.status] || 0) + 1;
      });

      console.log(`   Total Records: ${group.records.length}`);
      Object.keys(statusCounts).forEach(status => {
        const icon = getStatusIcon(status);
        console.log(`   ${icon} ${status}: ${statusCounts[status]} records`);
      });

      // Show individual records
      group.records.forEach(record => {
        const statusIcon = getStatusIcon(record.status);
        console.log(`     ${statusIcon} ${record.employee.firstName} ${record.employee.lastName} (${record.employee.employeeId || 'No ID'}) - ₹${record.netSalary} - ${record.status}`);
      });
      console.log('');
    });

    // Check what's needed for payslip generation
    console.log('💡 For payslip generation:');
    console.log('   - Payroll records must have status "processed" or "paid"');
    console.log('   - Currently looking for records with status "draft"');
    
    const draftRecords = payrollRecords.filter(r => r.status === 'draft');
    const processedRecords = payrollRecords.filter(r => r.status === 'processed' || r.status === 'paid');
    
    console.log(`   - Draft records: ${draftRecords.length}`);
    console.log(`   - Processed/Paid records: ${processedRecords.length}`);
    
    if (draftRecords.length > 0 && processedRecords.length === 0) {
      console.log('\n🔧 SOLUTION: You need to approve/process the draft payroll records first.');
      console.log('   Use the bulk payroll processing API to change status from "draft" to "processed".');
    }

  } catch (error) {
    console.error('Error checking payroll status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function getMonthName(month) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1];
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
checkPayrollStatus();
