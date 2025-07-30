const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPayslipGeneration() {
  try {
    console.log('🧪 Testing payslip generation parameters...\n');

    // Get the existing payroll record
    const payrollRecord = await prisma.payroll.findFirst({
      where: {
        status: { in: ['processed', 'paid'] }
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true,
            companyId: true
          }
        }
      }
    });

    if (!payrollRecord) {
      console.log('❌ No processed payroll records found for testing.');
      return;
    }

    console.log('📋 Found payroll record for testing:');
    console.log(`   Employee: ${payrollRecord.employee.firstName} ${payrollRecord.employee.lastName}`);
    console.log(`   Employee ID: ${payrollRecord.employee.employeeId}`);
    console.log(`   Company ID: ${payrollRecord.employee.companyId}`);
    console.log(`   Month: ${payrollRecord.payrollMonth}`);
    console.log(`   Year: ${payrollRecord.payrollYear}`);
    console.log(`   Status: ${payrollRecord.status}`);
    console.log(`   Net Salary: ₹${payrollRecord.netSalary}`);
    console.log('');

    // Test the exact query that bulk-generate uses
    console.log('🔍 Testing bulk-generate query...');
    
    const testFilter = {
      companyId: payrollRecord.employee.companyId,
      payrollMonth: payrollRecord.payrollMonth,
      payrollYear: payrollRecord.payrollYear,
      status: { in: ['processed', 'paid'] }
    };

    console.log('Query filter:', JSON.stringify(testFilter, null, 2));

    const foundRecords = await prisma.payroll.findMany({
      where: testFilter,
      include: {
        employee: {
          include: {
            department: true,
          }
        },
        payslip: true
      }
    });

    console.log(`\n📊 Query Results:`);
    console.log(`   Records found: ${foundRecords.length}`);
    
    if (foundRecords.length > 0) {
      console.log('   ✅ SUCCESS! The query finds the payroll record.');
      foundRecords.forEach(record => {
        console.log(`     - ${record.employee.firstName} ${record.employee.lastName}`);
        console.log(`       Has existing payslip: ${record.payslip ? 'Yes' : 'No'}`);
      });
    } else {
      console.log('   ❌ ISSUE: The query returns no results.');
      console.log('   This explains the 404 error in bulk payslip generation.');
    }

    // Test with different company IDs to see if that's the issue
    console.log('\n🔍 Testing with all companies...');
    const allCompanies = await prisma.company.findMany({
      select: {
        id: true,
        name: true
      }
    });

    console.log(`Found ${allCompanies.length} companies:`);
    allCompanies.forEach(company => {
      console.log(`   - ${company.name} (${company.id})`);
    });

    // Test the query for each company
    for (const company of allCompanies) {
      const companyFilter = {
        companyId: company.id,
        payrollMonth: payrollRecord.payrollMonth,
        payrollYear: payrollRecord.payrollYear,
        status: { in: ['processed', 'paid'] }
      };

      const companyRecords = await prisma.payroll.findMany({
        where: companyFilter
      });

      console.log(`   ${company.name}: ${companyRecords.length} records`);
    }

  } catch (error) {
    console.error('Error testing payslip generation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
testPayslipGeneration();
