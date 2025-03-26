/**
 * This script imports sample sales data into MongoDB using Prisma
 * Run with: node scripts/import-sales-data.js
 */

const { PrismaClient } = require('@prisma/client');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Initialize Prisma client
const prisma = new PrismaClient();

// Helper function to run a command and return a promise
function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`Command stderr: ${stderr}`);
      }
      console.log(`Command stdout: ${stdout}`);
      resolve(stdout);
    });
  });
}

// Main function to import sales data
async function importSalesData() {
  try {
    console.log('Generating sample data...');
    
    // Check if sample-data.json exists, if not generate it
    if (!fs.existsSync('sample-data.json')) {
      console.log('Generating sample data...');
      await runCommand('node scripts/generate-sample-data.js');
    }
    
    // Generate sales data
    console.log('Generating sales data...');
    await runCommand('node scripts/generate-sales-data.js');
    
    // Load the generated sales data
    console.log('Loading sales data...');
    const salesData = JSON.parse(fs.readFileSync('sales-data.json', 'utf8'));
    
    // Get the company ID from the first sale
    const companyId = salesData.Sale[0].companyId;
    
    // Check if the company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });
    
    if (!company) {
      console.log('Company not found. Creating a new company...');
      await prisma.company.create({
        data: {
          id: companyId,
          name: 'Sample Company',
          address: '123 Main St, Anytown, USA',
          phone: '+1 (555) 123-4567',
          email: 'info@samplecompany.com',
          website: 'https://www.samplecompany.com'
        }
      });
    }
    
    // Import customers
    console.log(`Importing ${salesData.Customer.length} customers...`);
    for (const customer of salesData.Customer) {
      // Check if customer already exists
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          companyId,
          name: customer.name,
          email: customer.email || undefined
        }
      });
      
      if (!existingCustomer) {
        await prisma.customer.create({
          data: {
            id: customer._id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
            company: {
              connect: {
                id: companyId
              }
            }
          }
        });
      }
    }
    
    // Import sales
    console.log(`Importing ${salesData.Sale.length} sales...`);
    let importedCount = 0;
    
    for (const sale of salesData.Sale) {
      try {
        // Check if sale already exists
        const existingSale = await prisma.sale.findFirst({
          where: {
            companyId,
            invoiceNumber: sale.orderNumber
          }
        });
        
        if (!existingSale) {
          // Find the customer
          const customer = await prisma.customer.findUnique({
            where: { id: sale.customerId }
          });
          
          if (!customer) {
            console.log(`Customer ${sale.customerId} not found, skipping sale ${sale.orderNumber}`);
            continue;
          }
          
          // Map status to match the expected values
          let status = sale.status;
          if (status === 'delivered') status = 'completed';
          if (status === 'cancelled') status = 'cancelled';
          if (status === 'processing' || status === 'pending') status = 'pending';
          if (status === 'shipped') status = 'processing';
          
          // Create the sale
          await prisma.sale.create({
            data: {
              invoiceNumber: sale.orderNumber,
              date: new Date(sale.orderDate),
              status: status,
              total: parseFloat(sale.total),
              tax: sale.tax ? parseFloat(sale.tax) : null,
              notes: sale.notes || null,
              customer: {
                connect: {
                  id: sale.customerId
                }
              },
              company: {
                connect: {
                  id: companyId
                }
              },
              // Create sale items
              items: {
                create: sale.items.map(item => ({
                  product: item.name,
                  description: `SKU: ${item.sku}`,
                  quantity: item.quantity,
                  unitPrice: parseFloat(item.price),
                  total: parseFloat(item.total)
                }))
              }
            }
          });
          
          importedCount++;
          
          // Log progress every 10 sales
          if (importedCount % 10 === 0) {
            console.log(`Imported ${importedCount} sales so far...`);
          }
        }
      } catch (error) {
        console.error(`Error importing sale ${sale.orderNumber}:`, error);
      }
    }
    
    console.log(`Successfully imported ${importedCount} sales.`);
    
    console.log('Sales data imported successfully!');
    
  } catch (error) {
    console.error('Error importing sales data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import function
importSalesData()
  .then(() => console.log('Import completed'))
  .catch(error => console.error('Import failed:', error));
