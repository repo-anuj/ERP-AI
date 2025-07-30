const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixMissingSalaryStructure() {
  try {
    // The employee ID from the error message
    const employeeId = '6852d194b4357b2e1133d71c';
    
    // First, check if the employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        company: true,
        department: true,
        salaryStructures: {
          where: { isActive: true }
        }
      }
    });

    if (!employee) {
      console.log(`Employee with ID ${employeeId} not found`);
      return;
    }

    console.log(`Found employee: ${employee.firstName} ${employee.lastName} (${employee.employeeId})`);
    console.log(`Department: ${employee.department?.name || 'No Department'}`);
    console.log(`Company: ${employee.company.name}`);
    console.log(`Current active salary structures: ${employee.salaryStructures.length}`);

    if (employee.salaryStructures.length > 0) {
      console.log('Employee already has an active salary structure');
      return;
    }

    // Create a basic salary structure
    const salaryStructure = await prisma.salaryStructure.create({
      data: {
        employeeId: employee.id,
        companyId: employee.companyId,
        basicSalary: 50000, // Default basic salary - adjust as needed
        hra: 15000, // 30% of basic salary
        conveyance: 2000,
        medicalAllowance: 1500,
        specialAllowance: 5000,
        pfEmployeeRate: 0.12, // 12%
        pfEmployerRate: 0.12, // 12%
        esiEmployeeRate: 0.0075, // 0.75%
        esiEmployerRate: 0.0325, // 3.25%
        professionalTax: 200,
        pfApplicable: true,
        esiApplicable: true,
        effectiveFrom: new Date('2025-01-01'), // Start of current year
        isActive: true,
      }
    });

    console.log(`✅ Created salary structure for ${employee.firstName} ${employee.lastName}`);
    console.log(`Salary Structure ID: ${salaryStructure.id}`);
    console.log(`Basic Salary: ₹${salaryStructure.basicSalary}`);
    console.log(`HRA: ₹${salaryStructure.hra}`);
    console.log(`Total Gross: ₹${salaryStructure.basicSalary + (salaryStructure.hra || 0) + (salaryStructure.conveyance || 0) + (salaryStructure.medicalAllowance || 0) + (salaryStructure.specialAllowance || 0)}`);

  } catch (error) {
    console.error('Error fixing salary structure:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixMissingSalaryStructure();
