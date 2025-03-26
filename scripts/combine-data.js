/**
 * This script combines all generated data files into a single file for database seeding
 * Run with: node scripts/combine-data.js
 * The output will be saved to combined-data.json
 */

const fs = require('fs');

// Function to combine data
function combineData() {
  // Check if all required data files exist
  const requiredFiles = [
    'sample-data.json',
    'sales-data.json',
    'project-data.json',
    'finance-data.json'
  ];

  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      console.error(`Error: ${file} not found. Please run the corresponding generation script first.`);
      process.exit(1);
    }
  }

  // Load all data files
  console.log('Loading data files...');
  const sampleData = JSON.parse(fs.readFileSync('sample-data.json', 'utf8'));
  const salesData = JSON.parse(fs.readFileSync('sales-data.json', 'utf8'));
  const projectData = JSON.parse(fs.readFileSync('project-data.json', 'utf8'));
  const financeData = JSON.parse(fs.readFileSync('finance-data.json', 'utf8'));

  // Combine all data
  console.log('Combining data...');
  const combinedData = {
    // From sample-data.json
    Company: sampleData.Company,
    User: sampleData.User,
    Employee: sampleData.Employee,
    Department: sampleData.Department,
    InventoryItem: sampleData.InventoryItem,
    InventoryCategory: sampleData.InventoryCategory,
    Attendance: sampleData.Attendance,
    Notification: sampleData.Notification,
    
    // From sales-data.json
    Customer: salesData.Customer,
    Sale: salesData.Sale,
    SaleItem: salesData.SaleItem,
    SalesAnalytics: salesData.SalesAnalytics,
    
    // From project-data.json
    Project: projectData.Project,
    Task: projectData.Task,
    Milestone: projectData.Milestone,
    ProjectAnalytics: projectData.ProjectAnalytics,
    
    // From finance-data.json
    Transaction: financeData.Transaction,
    Invoice: financeData.Invoice,
    Expense: financeData.Expense,
    Budget: financeData.Budget,
    FinancialReport: financeData.FinancialReport,
    FinancialAnalytics: financeData.FinancialAnalytics
  };

  // Calculate statistics
  const stats = {};
  for (const [key, value] of Object.entries(combinedData)) {
    stats[key] = value.length;
  }

  // Write combined data to file
  console.log('Writing combined data to file...');
  fs.writeFileSync('combined-data.json', JSON.stringify(combinedData, null, 2));

  console.log('Combined data saved to combined-data.json');
  console.log('\nData statistics:');
  console.table(stats);
  
  // Calculate total number of records
  const totalRecords = Object.values(stats).reduce((sum, count) => sum + count, 0);
  console.log(`\nTotal records: ${totalRecords}`);
}

// Run the function
combineData();
