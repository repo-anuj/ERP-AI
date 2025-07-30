const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAllSalaryStructures() {
  try {
    console.log('🔍 Checking all employees and their salary structures...\n');

    // Get all active employees with their salary structures
    const employees = await prisma.employee.findMany({
      where: {
        status: 'active'
      },
      include: {
        company: {
          select: { name: true }
        },
        department: {
          select: { name: true }
        },
        salaryStructures: {
          where: { isActive: true },
          orderBy: { effectiveFrom: 'desc' }
        }
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });

    console.log(`Found ${employees.length} active employees\n`);

    const employeesWithSalaryStructures = [];
    const employeesWithoutSalaryStructures = [];

    for (const employee of employees) {
      const hasActiveSalaryStructure = employee.salaryStructures.length > 0;
      
      if (hasActiveSalaryStructure) {
        employeesWithSalaryStructures.push(employee);
      } else {
        employeesWithoutSalaryStructures.push(employee);
      }

      console.log(`👤 ${employee.firstName} ${employee.lastName} (${employee.employeeId})`);
      console.log(`   Company: ${employee.company.name}`);
      console.log(`   Department: ${employee.department?.name || 'No Department'}`);
      console.log(`   Salary Structures: ${employee.salaryStructures.length}`);
      
      if (employee.salaryStructures.length > 0) {
        employee.salaryStructures.forEach((structure, index) => {
          console.log(`   📋 Structure ${index + 1}:`);
          console.log(`      ID: ${structure.id}`);
          console.log(`      Basic Salary: ₹${structure.basicSalary}`);
          console.log(`      Effective From: ${structure.effectiveFrom.toISOString().split('T')[0]}`);
          console.log(`      Effective To: ${structure.effectiveTo ? structure.effectiveTo.toISOString().split('T')[0] : 'Ongoing'}`);
          console.log(`      Active: ${structure.isActive}`);
        });
      } else {
        console.log(`   ❌ NO SALARY STRUCTURE FOUND`);
      }
      console.log('');
    }

    console.log('\n📊 SUMMARY:');
    console.log(`Total Employees: ${employees.length}`);
    console.log(`With Salary Structures: ${employeesWithSalaryStructures.length}`);
    console.log(`Without Salary Structures: ${employeesWithoutSalaryStructures.length}`);

    if (employeesWithoutSalaryStructures.length > 0) {
      console.log('\n❌ EMPLOYEES MISSING SALARY STRUCTURES:');
      employeesWithoutSalaryStructures.forEach(emp => {
        console.log(`   - ${emp.firstName} ${emp.lastName} (${emp.employeeId}) - ID: ${emp.id}`);
      });
    }

    // Test the payroll query for July 2025
    console.log('\n🧪 Testing payroll query for July 2025...');
    const payrollMonth = 7;
    const payrollYear = 2025;
    const payrollDate = new Date(payrollYear, payrollMonth - 1, 1); // July 1, 2025

    const employeesForPayroll = await prisma.employee.findMany({
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

    const employeesWithoutValidSalaryStructures = employeesForPayroll.filter(emp => emp.salaryStructures.length === 0);

    console.log(`Employees found for payroll: ${employeesForPayroll.length}`);
    console.log(`Employees without valid salary structures for July 2025: ${employeesWithoutValidSalaryStructures.length}`);

    if (employeesWithoutValidSalaryStructures.length > 0) {
      console.log('\n❌ EMPLOYEES WITHOUT VALID SALARY STRUCTURES FOR JULY 2025:');
      employeesWithoutValidSalaryStructures.forEach(emp => {
        console.log(`   - ${emp.firstName} ${emp.lastName} (${emp.employeeId}) - ID: ${emp.id}`);
      });
    }

  } catch (error) {
    console.error('Error checking salary structures:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkAllSalaryStructures();
