const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkEmployeeIdMismatch() {
  try {
    console.log('🔍 Checking employee ID mismatch...\n');

    // The employee ID from the API request
    const requestedEmployeeId = '6873fc6139bc3f9907b8682d';
    console.log(`Requested Employee ID: ${requestedEmployeeId}`);

    // Check if this employee exists
    const requestedEmployee = await prisma.employee.findUnique({
      where: { id: requestedEmployeeId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeId: true,
        companyId: true,
        status: true
      }
    });

    if (requestedEmployee) {
      console.log('✅ Requested employee found:');
      console.log(`   Name: ${requestedEmployee.firstName} ${requestedEmployee.lastName}`);
      console.log(`   Employee ID: ${requestedEmployee.employeeId}`);
      console.log(`   Company ID: ${requestedEmployee.companyId}`);
      console.log(`   Status: ${requestedEmployee.status}`);
    } else {
      console.log('❌ Requested employee NOT found in database');
    }

    console.log('\n🔍 Checking RaoTech company employees...');

    // Get all employees from RaoTech company
    const raoTechEmployees = await prisma.employee.findMany({
      where: {
        companyId: '6852ad21b4357b2e1133d718'
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeId: true,
        status: true
      }
    });

    console.log(`Found ${raoTechEmployees.length} employees in RaoTech company:`);
    raoTechEmployees.forEach(emp => {
      const match = emp.id === requestedEmployeeId ? '👈 REQUESTED' : '';
      console.log(`   - ${emp.firstName} ${emp.lastName} (${emp.employeeId || 'No ID'})`);
      console.log(`     Database ID: ${emp.id} ${match}`);
      console.log(`     Status: ${emp.status}`);
      console.log('');
    });

    console.log('🔍 Checking payroll records for RaoTech employees...');

    // Check payroll records for RaoTech company
    const raoTechPayrolls = await prisma.payroll.findMany({
      where: {
        companyId: '6852ad21b4357b2e1133d718',
        payrollMonth: 7,
        payrollYear: 2025
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true
          }
        }
      }
    });

    console.log(`Found ${raoTechPayrolls.length} payroll records for RaoTech in July 2025:`);
    raoTechPayrolls.forEach(payroll => {
      const match = payroll.employeeId === requestedEmployeeId ? '👈 MATCHES REQUEST' : '';
      console.log(`   - ${payroll.employee.firstName} ${payroll.employee.lastName}`);
      console.log(`     Employee DB ID: ${payroll.employee.id} ${match}`);
      console.log(`     Employee Code: ${payroll.employee.employeeId}`);
      console.log(`     Status: ${payroll.status}`);
      console.log(`     Net Salary: ₹${payroll.netSalary}`);
      console.log('');
    });

    // Test the exact query that's failing
    console.log('🧪 Testing the failing query...');
    const failingQuery = {
      companyId: '6852ad21b4357b2e1133d718',
      payrollMonth: 7,
      payrollYear: 2025,
      status: { in: ['processed', 'paid'] },
      employeeId: { in: [requestedEmployeeId] }
    };

    const failingResults = await prisma.payroll.findMany({
      where: failingQuery
    });

    console.log(`Failing query results: ${failingResults.length} records`);

    // Test without the employeeId filter
    console.log('\n🧪 Testing without employeeId filter...');
    const workingQuery = {
      companyId: '6852ad21b4357b2e1133d718',
      payrollMonth: 7,
      payrollYear: 2025,
      status: { in: ['processed', 'paid'] }
    };

    const workingResults = await prisma.payroll.findMany({
      where: workingQuery,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    console.log(`Working query results: ${workingResults.length} records`);
    workingResults.forEach(result => {
      console.log(`   - ${result.employee.firstName} ${result.employee.lastName} (${result.employee.id})`);
    });

    console.log('\n💡 SOLUTION:');
    if (raoTechPayrolls.length > 0) {
      const correctEmployeeId = raoTechPayrolls[0].employee.id;
      console.log(`The correct employee ID should be: ${correctEmployeeId}`);
      console.log(`But the request is using: ${requestedEmployeeId}`);
      console.log('This suggests the frontend is sending the wrong employee ID.');
    }

  } catch (error) {
    console.error('Error checking employee ID mismatch:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkEmployeeIdMismatch();
