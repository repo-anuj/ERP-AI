const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugBulkPayslipQuery() {
  try {
    console.log('🔍 Debugging bulk payslip generation query...\n');

    // Test parameters that would be sent to the API
    const testMonth = 7;
    const testYear = 2025;

    console.log(`Testing with month: ${testMonth}, year: ${testYear}\n`);

    // Get all companies and their users
    const companies = await prisma.company.findMany({
      include: {
        users: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    console.log('🏢 Available companies and users:');
    companies.forEach(company => {
      console.log(`   ${company.name} (${company.id}):`);
      company.users.forEach(user => {
        console.log(`     - ${user.firstName} ${user.lastName} (${user.email})`);
      });
    });
    console.log('');

    // Test the query for each company
    for (const company of companies) {
      console.log(`🧪 Testing query for ${company.name} company:`);
      
      const payrollFilter = {
        companyId: company.id,
        payrollMonth: testMonth,
        payrollYear: testYear,
        status: { in: ['processed', 'paid'] }
      };

      console.log('   Query filter:', JSON.stringify(payrollFilter, null, 4));

      const payrollRecords = await prisma.payroll.findMany({
        where: payrollFilter,
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true,
              employeeId: true
            }
          },
          payslip: true
        }
      });

      console.log(`   Results: ${payrollRecords.length} records found`);
      
      if (payrollRecords.length > 0) {
        console.log('   ✅ SUCCESS! Records found for this company:');
        payrollRecords.forEach(record => {
          console.log(`     - ${record.employee.firstName} ${record.employee.lastName} (${record.employee.employeeId || 'No ID'})`);
          console.log(`       Status: ${record.status}, Net: ₹${record.netSalary}`);
          console.log(`       Has Payslip: ${record.payslip ? 'Yes' : 'No'}`);
        });
      } else {
        console.log('   ❌ No records found for this company');
        
        // Check if there are any payroll records for this company at all
        const anyRecords = await prisma.payroll.findMany({
          where: { companyId: company.id },
          select: {
            payrollMonth: true,
            payrollYear: true,
            status: true,
            employee: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        });
        
        if (anyRecords.length > 0) {
          console.log('   📋 But found these payroll records for this company:');
          anyRecords.forEach(record => {
            console.log(`     - ${record.employee.firstName} ${record.employee.lastName}: ${record.payrollMonth}/${record.payrollYear} (${record.status})`);
          });
        } else {
          console.log('   📋 No payroll records exist for this company at all');
        }
      }
      console.log('');
    }

    // Check what user would be used in the API call
    console.log('🔍 Checking typical user authentication...');
    
    // This would be the typical user making the request
    const testUserEmail = 'admin@example.com'; // Adjust this to actual user email
    
    const user = await prisma.user.findUnique({
      where: { email: testUserEmail },
      include: { company: true }
    });

    if (user) {
      console.log(`   User: ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`   Company: ${user.company?.name} (${user.companyId})`);
      
      // Test the exact query the API would use
      const apiFilter = {
        companyId: user.companyId,
        payrollMonth: testMonth,
        payrollYear: testYear,
        status: { in: ['processed', 'paid'] }
      };
      
      const apiResults = await prisma.payroll.findMany({
        where: apiFilter
      });
      
      console.log(`   API Query Results: ${apiResults.length} records`);
      
      if (apiResults.length === 0) {
        console.log('   ❌ This explains the 404 error!');
      } else {
        console.log('   ✅ API query should work');
      }
    } else {
      console.log(`   ❌ User ${testUserEmail} not found`);
      
      // Show all users
      const allUsers = await prisma.user.findMany({
        select: {
          email: true,
          firstName: true,
          lastName: true,
          companyId: true
        }
      });
      
      console.log('   Available users:');
      allUsers.forEach(u => {
        console.log(`     - ${u.firstName} ${u.lastName} (${u.email}) - Company: ${u.companyId}`);
      });
    }

  } catch (error) {
    console.error('Error debugging bulk payslip query:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
debugBulkPayslipQuery();
