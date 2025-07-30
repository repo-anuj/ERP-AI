const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugDateQuery() {
  try {
    console.log('🔍 Debugging date query in detail...\n');

    const payrollMonth = 7;
    const payrollYear = 2025;
    const payrollDate = new Date(payrollYear, payrollMonth - 1, 1);

    console.log(`Payroll Date: ${payrollDate.toISOString()}`);
    console.log(`Payroll Date (local): ${payrollDate.toString()}`);
    console.log(`Payroll Date (UTC): ${payrollDate.toUTCString()}\n`);

    // Test each part of the query separately
    console.log('🧪 Testing query parts separately...\n');

    // 1. Test basic salary structure query
    console.log('1. Basic salary structures (isActive: true):');
    const basicStructures = await prisma.salaryStructure.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        effectiveFrom: true,
        effectiveTo: true,
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true
          }
        }
      }
    });
    console.log(`   Found: ${basicStructures.length} structures\n`);

    // 2. Test effectiveFrom filter
    console.log('2. With effectiveFrom <= payrollDate:');
    const effectiveFromStructures = await prisma.salaryStructure.findMany({
      where: {
        isActive: true,
        effectiveFrom: {
          lte: payrollDate
        }
      },
      select: {
        id: true,
        effectiveFrom: true,
        effectiveTo: true,
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true
          }
        }
      }
    });
    console.log(`   Found: ${effectiveFromStructures.length} structures`);
    effectiveFromStructures.forEach(structure => {
      console.log(`     - ${structure.employee.firstName} ${structure.employee.lastName}: ${structure.effectiveFrom.toISOString()} <= ${payrollDate.toISOString()} = ${structure.effectiveFrom <= payrollDate}`);
    });
    console.log('');

    // 3. Test effectiveTo filter
    console.log('3. With effectiveTo conditions:');
    const effectiveToStructures = await prisma.salaryStructure.findMany({
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
      select: {
        id: true,
        effectiveFrom: true,
        effectiveTo: true,
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true
          }
        }
      }
    });
    console.log(`   Found: ${effectiveToStructures.length} structures`);
    effectiveToStructures.forEach(structure => {
      const effectiveToCondition = !structure.effectiveTo || structure.effectiveTo >= payrollDate;
      console.log(`     - ${structure.employee.firstName} ${structure.employee.lastName}: effectiveTo ${structure.effectiveTo ? structure.effectiveTo.toISOString() : 'null'} condition = ${effectiveToCondition}`);
    });
    console.log('');

    // 4. Test the complete query on salary structures directly
    console.log('4. Complete salary structure query:');
    const completeStructures = await prisma.salaryStructure.findMany({
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
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true,
            companyId: true
          }
        }
      },
      orderBy: { effectiveFrom: 'desc' }
    });
    console.log(`   Found: ${completeStructures.length} structures`);
    completeStructures.forEach(structure => {
      console.log(`     - ${structure.employee.firstName} ${structure.employee.lastName} (Company: ${structure.employee.companyId})`);
    });
    console.log('');

    // 5. Test with a specific employee
    console.log('5. Testing with specific employee (Anuj Dubey):');
    const anujId = '67bec2587e5169dfa26483c8';
    
    const anujEmployee = await prisma.employee.findUnique({
      where: { id: anujId },
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

    if (anujEmployee) {
      console.log(`   Employee: ${anujEmployee.firstName} ${anujEmployee.lastName}`);
      console.log(`   Company: ${anujEmployee.companyId}`);
      console.log(`   Salary Structures Found: ${anujEmployee.salaryStructures.length}`);
      
      // Also get all salary structures for this employee
      const allAnujStructures = await prisma.salaryStructure.findMany({
        where: {
          employeeId: anujId,
          isActive: true
        }
      });
      console.log(`   All Active Salary Structures: ${allAnujStructures.length}`);
      allAnujStructures.forEach(structure => {
        console.log(`     Structure ID: ${structure.id}`);
        console.log(`     Effective From: ${structure.effectiveFrom.toISOString()}`);
        console.log(`     Effective To: ${structure.effectiveTo ? structure.effectiveTo.toISOString() : 'null'}`);
        console.log(`     Company: ${structure.companyId}`);
        console.log(`     Effective From <= Payroll Date: ${structure.effectiveFrom <= payrollDate}`);
        console.log(`     Effective To condition: ${!structure.effectiveTo || structure.effectiveTo >= payrollDate}`);
      });
    }

    // 6. Test raw query to see what Prisma is actually doing
    console.log('\n6. Testing raw MongoDB query...');
    try {
      const rawResult = await prisma.$runCommandRaw({
        find: 'SalaryStructure',
        filter: {
          isActive: true,
          effectiveFrom: { $lte: payrollDate },
          $or: [
            { effectiveTo: null },
            { effectiveTo: { $gte: payrollDate } }
          ]
        }
      });
      console.log(`   Raw query result count: ${rawResult.cursor.firstBatch.length}`);
    } catch (error) {
      console.log(`   Raw query error: ${error.message}`);
    }

  } catch (error) {
    console.error('Error debugging date query:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
debugDateQuery();
