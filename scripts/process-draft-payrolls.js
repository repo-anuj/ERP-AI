const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function processDraftPayrolls() {
  try {
    console.log('🔧 Processing draft payroll records...\n');

    // Find all draft payroll records
    const draftPayrolls = await prisma.payroll.findMany({
      where: {
        status: 'draft'
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

    console.log(`Found ${draftPayrolls.length} draft payroll records:\n`);

    if (draftPayrolls.length === 0) {
      console.log('✅ No draft payroll records found. All payrolls are already processed.');
      return;
    }

    // Display the records that will be processed
    draftPayrolls.forEach(payroll => {
      console.log(`📝 ${payroll.employee.firstName} ${payroll.employee.lastName} (${payroll.employee.employeeId || 'No ID'})`);
      console.log(`   Month/Year: ${payroll.payrollMonth}/${payroll.payrollYear}`);
      console.log(`   Net Salary: ₹${payroll.netSalary}`);
      console.log(`   Current Status: ${payroll.status}`);
      console.log('');
    });

    // Update all draft payrolls to processed status
    const updateResult = await prisma.payroll.updateMany({
      where: {
        status: 'draft'
      },
      data: {
        status: 'processed'
      }
    });

    console.log(`✅ Successfully updated ${updateResult.count} payroll records to "processed" status.\n`);

    // Verify the update
    const processedPayrolls = await prisma.payroll.findMany({
      where: {
        status: 'processed'
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

    console.log(`📊 Summary after processing:`);
    console.log(`   Processed payroll records: ${processedPayrolls.length}`);
    console.log(`   Ready for payslip generation: ✅`);
    
    if (processedPayrolls.length > 0) {
      console.log('\n🎉 SUCCESS! You can now generate payslips for these employees:');
      processedPayrolls.forEach(payroll => {
        console.log(`   - ${payroll.employee.firstName} ${payroll.employee.lastName} (${payroll.payrollMonth}/${payroll.payrollYear})`);
      });
    }

  } catch (error) {
    console.error('Error processing draft payrolls:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
processDraftPayrolls();
