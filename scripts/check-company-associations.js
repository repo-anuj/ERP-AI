const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCompanyAssociations() {
  try {
    console.log('🔍 Checking company associations...\n');

    // Get all employees with their salary structures and company info
    const employees = await prisma.employee.findMany({
      where: {
        status: 'active'
      },
      include: {
        company: {
          select: {
            id: true,
            name: true
          }
        },
        salaryStructures: {
          where: { isActive: true },
          include: {
            company: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    console.log('👥 Employee and Salary Structure Company Associations:\n');

    employees.forEach(employee => {
      console.log(`Employee: ${employee.firstName} ${employee.lastName} (${employee.employeeId || 'No ID'})`);
      console.log(`  Employee Company: ${employee.company.name} (${employee.company.id})`);
      console.log(`  Salary Structures: ${employee.salaryStructures.length}`);
      
      employee.salaryStructures.forEach((structure, index) => {
        console.log(`    Structure ${index + 1}:`);
        console.log(`      ID: ${structure.id}`);
        console.log(`      Company: ${structure.company.name} (${structure.company.id})`);
        console.log(`      Match: ${employee.company.id === structure.company.id ? '✅' : '❌'}`);
      });
      console.log('');
    });

    // Test the exact payroll query with a specific company
    console.log('🧪 Testing payroll query with company filter...\n');

    // Let's test with the "Oiny" company (most employees)
    const oinyCompanyId = '67ab6f97ed85baa0ef51d95d';
    
    const payrollMonth = 7;
    const payrollYear = 2025;
    const payrollDate = new Date(payrollYear, payrollMonth - 1, 1);

    console.log(`Testing with company: Oiny (${oinyCompanyId})`);
    console.log(`Payroll date: ${payrollDate.toISOString()}\n`);

    const employeesForPayroll = await prisma.employee.findMany({
      where: {
        companyId: oinyCompanyId,
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

    console.log(`Found ${employeesForPayroll.length} employees for Oiny company:`);
    employeesForPayroll.forEach(employee => {
      console.log(`  - ${employee.firstName} ${employee.lastName}: ${employee.salaryStructures.length} valid salary structures`);
    });

    // Also test with RaoTech company
    const raoTechCompanyId = '6852ad21b4357b2e1133d718';
    
    console.log(`\nTesting with company: RaoTech (${raoTechCompanyId})`);

    const raoTechEmployees = await prisma.employee.findMany({
      where: {
        companyId: raoTechCompanyId,
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

    console.log(`Found ${raoTechEmployees.length} employees for RaoTech company:`);
    raoTechEmployees.forEach(employee => {
      console.log(`  - ${employee.firstName} ${employee.lastName}: ${employee.salaryStructures.length} valid salary structures`);
    });

  } catch (error) {
    console.error('Error checking company associations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkCompanyAssociations();
