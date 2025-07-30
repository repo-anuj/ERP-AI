const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createMissingSalaryStructures() {
  try {
    console.log('🔧 Creating salary structures for employees who are missing them...\n');

    // Employee IDs that need salary structures
    const employeeIds = [
      '67bec2587e5169dfa26483c8', // Anuj Dubey
      '67fdee178a7ada04e83b05e0', // Piyush thourani
      '67becaef7e5169dfa26483c9', // nigga nigga
      '67e3c9061a4685b5e52524af', // piyush singh
      '67fd10854892ef5d5a09fa23', // rakeleb rakeleb
      '684c2078c12d0303cfcee68c', // ramesh shuresh
      '67f8c33a7dc8fbec7c532902', // shubham Dha
      '684dc914c43941f8cf8cc4ee'  // test e1 Dubey
    ];

    // Also fix Rahul Sharma's effective date
    const rahulId = '6852d194b4357b2e1133d71c';

    // First, fix Rahul's salary structure effective date
    console.log('🔧 Fixing Rahul Sharma\'s salary structure effective date...');
    await prisma.salaryStructure.updateMany({
      where: {
        employeeId: rahulId,
        isActive: true
      },
      data: {
        effectiveFrom: new Date('2025-01-01') // Set to beginning of year
      }
    });
    console.log('✅ Updated Rahul Sharma\'s salary structure effective date\n');

    // Get employee details for the missing ones
    const employees = await prisma.employee.findMany({
      where: {
        id: { in: employeeIds }
      },
      include: {
        company: true
      }
    });

    console.log(`Found ${employees.length} employees to create salary structures for:\n`);

    const results = [];

    for (const employee of employees) {
      try {
        console.log(`Creating salary structure for: ${employee.firstName} ${employee.lastName} (${employee.employeeId || 'No ID'})`);

        // Create a basic salary structure
        const salaryStructure = await prisma.salaryStructure.create({
          data: {
            employeeId: employee.id,
            companyId: employee.companyId,
            basicSalary: 30000, // Basic salary
            hra: 9000, // 30% of basic salary
            conveyance: 2000,
            medicalAllowance: 1500,
            specialAllowance: 3000,
            pfEmployeeRate: 0.12, // 12%
            pfEmployerRate: 0.12, // 12%
            esiEmployeeRate: 0.0075, // 0.75%
            esiEmployerRate: 0.0325, // 3.25%
            professionalTax: 200,
            pfApplicable: true,
            esiApplicable: true,
            effectiveFrom: new Date('2025-01-01'), // Start of year
            isActive: true,
          }
        });

        const grossSalary = salaryStructure.basicSalary + 
                           (salaryStructure.hra || 0) + 
                           (salaryStructure.conveyance || 0) + 
                           (salaryStructure.medicalAllowance || 0) + 
                           (salaryStructure.specialAllowance || 0);

        console.log(`✅ Created salary structure:`);
        console.log(`   ID: ${salaryStructure.id}`);
        console.log(`   Basic Salary: ₹${salaryStructure.basicSalary}`);
        console.log(`   HRA: ₹${salaryStructure.hra}`);
        console.log(`   Gross Salary: ₹${grossSalary}`);
        console.log(`   Effective From: ${salaryStructure.effectiveFrom.toISOString().split('T')[0]}\n`);

        results.push({
          employee: `${employee.firstName} ${employee.lastName}`,
          employeeId: employee.employeeId,
          salaryStructureId: salaryStructure.id,
          grossSalary: grossSalary
        });

      } catch (error) {
        console.error(`❌ Error creating salary structure for ${employee.firstName} ${employee.lastName}:`, error.message);
      }
    }

    console.log('\n📊 SUMMARY:');
    console.log(`Total employees processed: ${employees.length}`);
    console.log(`Salary structures created: ${results.length}`);
    console.log(`Errors: ${employees.length - results.length}`);

    if (results.length > 0) {
      console.log('\n✅ Successfully created salary structures for:');
      results.forEach(result => {
        console.log(`   - ${result.employee} (${result.employeeId || 'No ID'}) - Gross: ₹${result.grossSalary}`);
      });
    }

    // Test the payroll query again
    console.log('\n🧪 Testing payroll query for July 2025 after fixes...');
    const payrollMonth = 7;
    const payrollYear = 2025;
    const payrollDate = new Date(payrollYear, payrollMonth - 1, 1);

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

    const employeesWithValidSalaryStructures = employeesForPayroll.filter(emp => emp.salaryStructures.length > 0);
    const employeesWithoutValidSalaryStructures = employeesForPayroll.filter(emp => emp.salaryStructures.length === 0);

    console.log(`Total employees: ${employeesForPayroll.length}`);
    console.log(`With valid salary structures: ${employeesWithValidSalaryStructures.length}`);
    console.log(`Without valid salary structures: ${employeesWithoutValidSalaryStructures.length}`);

    if (employeesWithoutValidSalaryStructures.length === 0) {
      console.log('\n🎉 SUCCESS! All employees now have valid salary structures for payroll processing!');
    } else {
      console.log('\n❌ Still missing salary structures:');
      employeesWithoutValidSalaryStructures.forEach(emp => {
        console.log(`   - ${emp.firstName} ${emp.lastName} (${emp.employeeId || 'No ID'})`);
      });
    }

  } catch (error) {
    console.error('Error creating salary structures:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createMissingSalaryStructures();
