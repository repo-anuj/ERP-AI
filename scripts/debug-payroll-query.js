const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugPayrollQuery() {
  try {
    console.log('🔍 Debugging payroll query...\n');

    const payrollMonth = 7;
    const payrollYear = 2025;
    const payrollDate = new Date(payrollYear, payrollMonth - 1, 1); // July 1, 2025

    console.log(`Payroll Date: ${payrollDate.toISOString()}`);
    console.log(`Payroll Month: ${payrollMonth}`);
    console.log(`Payroll Year: ${payrollYear}\n`);

    // First, let's check all salary structures
    console.log('📋 All active salary structures:');
    const allSalaryStructures = await prisma.salaryStructure.findMany({
      where: { isActive: true },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true
          }
        }
      },
      orderBy: { effectiveFrom: 'asc' }
    });

    allSalaryStructures.forEach(structure => {
      console.log(`   - ${structure.employee.firstName} ${structure.employee.lastName} (${structure.employee.employeeId || 'No ID'})`);
      console.log(`     Effective From: ${structure.effectiveFrom.toISOString()}`);
      console.log(`     Effective To: ${structure.effectiveTo ? structure.effectiveTo.toISOString() : 'Ongoing'}`);
      console.log(`     Active: ${structure.isActive}`);
      console.log(`     Effective From <= Payroll Date: ${structure.effectiveFrom <= payrollDate}`);
      console.log(`     Effective To >= Payroll Date or null: ${!structure.effectiveTo || structure.effectiveTo >= payrollDate}`);
      console.log('');
    });

    // Now let's test the exact query used in payroll
    console.log('🧪 Testing exact payroll query...');
    
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
            },
            OR: [
              { effectiveTo: null },
              { effectiveTo: { gte: payrollDate } }
            ]
          },
          orderBy: { effectiveFrom: 'desc' },
          take: 1
        }
      }
    });

    console.log(`\nFound ${employees.length} employees:`);
    employees.forEach(employee => {
      console.log(`   - ${employee.firstName} ${employee.lastName} (${employee.employeeId || 'No ID'})`);
      console.log(`     Salary Structures Found: ${employee.salaryStructures.length}`);
      if (employee.salaryStructures.length > 0) {
        employee.salaryStructures.forEach(structure => {
          console.log(`       Structure ID: ${structure.id}`);
          console.log(`       Basic Salary: ₹${structure.basicSalary}`);
          console.log(`       Effective From: ${structure.effectiveFrom.toISOString()}`);
          console.log(`       Effective To: ${structure.effectiveTo ? structure.effectiveTo.toISOString() : 'Ongoing'}`);
        });
      }
      console.log('');
    });

    // Let's also test a simpler query
    console.log('🔍 Testing simpler query...');
    const simpleEmployees = await prisma.employee.findMany({
      where: {
        status: 'active'
      },
      include: {
        salaryStructures: {
          where: {
            isActive: true
          }
        }
      }
    });

    console.log(`\nSimple query found ${simpleEmployees.length} employees:`);
    simpleEmployees.forEach(employee => {
      console.log(`   - ${employee.firstName} ${employee.lastName}: ${employee.salaryStructures.length} salary structures`);
    });

    // Let's check if there are any company filters missing
    console.log('\n🏢 Checking company information...');
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            employees: true,
            salaryStructures: true
          }
        }
      }
    });

    companies.forEach(company => {
      console.log(`   Company: ${company.name} (${company.id})`);
      console.log(`     Employees: ${company._count.employees}`);
      console.log(`     Salary Structures: ${company._count.salaryStructures}`);
    });

  } catch (error) {
    console.error('Error debugging payroll query:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
debugPayrollQuery();
