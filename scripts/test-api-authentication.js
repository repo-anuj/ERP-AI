const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAPIAuthentication() {
  try {
    console.log('🔐 Testing API authentication scenarios...\n');

    // Test with the main user who should have access to Oiny company
    const oinyUser = await prisma.user.findUnique({
      where: { email: 'daratmp@gmail.com' },
      include: { company: true }
    });

    if (oinyUser) {
      console.log('👤 Oiny Company User:');
      console.log(`   Name: ${oinyUser.firstName} ${oinyUser.lastName}`);
      console.log(`   Email: ${oinyUser.email}`);
      console.log(`   Company: ${oinyUser.company?.name} (${oinyUser.companyId})`);
      
      // Test the exact query the API would use for this user
      const oinyFilter = {
        companyId: oinyUser.companyId,
        payrollMonth: 7,
        payrollYear: 2025,
        status: { in: ['processed', 'paid'] }
      };
      
      const oinyResults = await prisma.payroll.findMany({
        where: oinyFilter
      });
      
      console.log(`   Payroll Records Found: ${oinyResults.length}`);
      console.log(`   API Should Work: ${oinyResults.length > 0 ? '✅ YES' : '❌ NO'}`);
    } else {
      console.log('❌ Oiny user not found');
    }

    console.log('');

    // Test with RaoTech user
    const raoTechUser = await prisma.user.findUnique({
      where: { email: 'RishiRaoTech@gmail.com' },
      include: { company: true }
    });

    if (raoTechUser) {
      console.log('👤 RaoTech Company User:');
      console.log(`   Name: ${raoTechUser.firstName} ${raoTechUser.lastName}`);
      console.log(`   Email: ${raoTechUser.email}`);
      console.log(`   Company: ${raoTechUser.company?.name} (${raoTechUser.companyId})`);
      
      const raoTechFilter = {
        companyId: raoTechUser.companyId,
        payrollMonth: 7,
        payrollYear: 2025,
        status: { in: ['processed', 'paid'] }
      };
      
      const raoTechResults = await prisma.payroll.findMany({
        where: raoTechFilter
      });
      
      console.log(`   Payroll Records Found: ${raoTechResults.length}`);
      console.log(`   API Should Work: ${raoTechResults.length > 0 ? '✅ YES' : '❌ NO'}`);
    } else {
      console.log('❌ RaoTech user not found');
    }

    console.log('\n🔍 Possible Issues:');
    console.log('1. User session might be expired or invalid');
    console.log('2. User might be associated with wrong company');
    console.log('3. JWT token might not contain correct user email');
    console.log('4. Request parameters might be incorrect');

    console.log('\n💡 Solutions:');
    console.log('1. Check browser network tab for actual request parameters');
    console.log('2. Verify user authentication in browser dev tools');
    console.log('3. Check if user is logged in with correct account');
    console.log('4. Try logging out and logging back in');

    // Check what the actual request body should look like
    console.log('\n📋 Expected Request Body for Bulk Payslip Generation:');
    console.log(JSON.stringify({
      month: 7,
      year: 2025,
      employeeIds: [] // Optional - if empty, generates for all employees
    }, null, 2));

    console.log('\n🎯 Expected Results:');
    console.log('- Oiny Company User: Should generate 8 payslips');
    console.log('- RaoTech Company User: Should generate 1 payslip');

  } catch (error) {
    console.error('Error testing API authentication:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
testAPIAuthentication();
