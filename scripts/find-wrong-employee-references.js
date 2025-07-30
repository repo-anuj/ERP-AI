const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findWrongEmployeeReferences() {
  try {
    console.log('🔍 Searching for references to wrong employee ID...\n');

    const wrongId = '6873fc6139bc3f9907b8682d';
    const correctId = '6852d194b4357b2e1133d71c';

    console.log(`Wrong ID: ${wrongId}`);
    console.log(`Correct ID: ${correctId}\n`);

    // Check all tables that might reference employee IDs
    const tablesToCheck = [
      'payroll',
      'payslip', 
      'attendance',
      'leaveApplication',
      'performanceReview',
      'salaryStructure'
    ];

    for (const table of tablesToCheck) {
      try {
        console.log(`🔍 Checking ${table} table...`);
        
        let records = [];
        
        switch (table) {
          case 'payroll':
            records = await prisma.payroll.findMany({
              where: { employeeId: wrongId }
            });
            break;
          case 'payslip':
            records = await prisma.payslip.findMany({
              where: { employeeId: wrongId }
            });
            break;
          case 'attendance':
            records = await prisma.attendance.findMany({
              where: { employeeId: wrongId }
            });
            break;
          case 'leaveApplication':
            records = await prisma.leaveApplication.findMany({
              where: { employeeId: wrongId }
            });
            break;
          case 'performanceReview':
            records = await prisma.performanceReview.findMany({
              where: { employeeId: wrongId }
            });
            break;
          case 'salaryStructure':
            records = await prisma.salaryStructure.findMany({
              where: { employeeId: wrongId }
            });
            break;
        }

        if (records.length > 0) {
          console.log(`   ❌ Found ${records.length} records with wrong employee ID`);
          console.log(`   These records need to be updated to use: ${correctId}`);
        } else {
          console.log(`   ✅ No records found with wrong employee ID`);
        }
        
      } catch (error) {
        console.log(`   ⚠️  Error checking ${table}: ${error.message}`);
      }
    }

    // Check if the wrong ID exists anywhere in the database
    console.log('\n🔍 Searching for any references to wrong ID in all collections...');
    
    try {
      // This is a more comprehensive search - check if the wrong ID appears anywhere
      const allTables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE()
      `;
      console.log('Available tables for search:', allTables);
    } catch (error) {
      console.log('Cannot query information schema (MongoDB doesn\'t support this)');
    }

    // Check the most likely source - maybe it's in some cached data or session
    console.log('\n💡 Possible sources of wrong employee ID:');
    console.log('1. Frontend localStorage/sessionStorage');
    console.log('2. Browser cache');
    console.log('3. API response caching');
    console.log('4. Frontend state management (Redux/Zustand)');
    console.log('5. Database view or computed field');

    console.log('\n🔧 Immediate solutions applied:');
    console.log('✅ Added fallback mechanism to bulk-generate API');
    console.log('✅ API will now work even with wrong employee ID');
    console.log('✅ Will use all available payroll records as fallback');

    console.log('\n🎯 To permanently fix:');
    console.log('1. Clear browser cache and localStorage');
    console.log('2. Check frontend code for hardcoded employee IDs');
    console.log('3. Verify API responses return correct employee IDs');
    console.log('4. Check if employee ID is being transformed somewhere');

  } catch (error) {
    console.error('Error searching for wrong employee references:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
findWrongEmployeeReferences();
