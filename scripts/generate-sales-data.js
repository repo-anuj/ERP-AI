/**
 * This script generates sample sales data for the ERP-AI system
 * Run with: node scripts/generate-sales-data.js
 * The output will be saved to sales-data.json
 */

const fs = require('fs');
const { ObjectId } = require('mongodb');

// Helper function to generate random dates within a range
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper function to generate random integer within a range
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to pick a random item from an array
function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper function to generate MongoDB ObjectId
function generateObjectId() {
  return new ObjectId().toString();
}

// Helper function to format currency
function formatCurrency(amount) {
  return parseFloat(amount.toFixed(2));
}

// Generate sample data
function generateSalesData() {
  const currentDate = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(currentDate.getFullYear() - 1);

  // Load the sample data to get company ID and inventory items
  let sampleData;
  try {
    sampleData = JSON.parse(fs.readFileSync('sample-data.json', 'utf8'));
  } catch (error) {
    console.error('Error loading sample-data.json. Please run generate-sample-data.js first.');
    process.exit(1);
  }

  const companyId = sampleData.Company[0]._id;
  const inventoryItems = sampleData.InventoryItem;
  const employees = sampleData.Employee;

  // Generate customer data
  const customers = [];
  const customerTypes = ["individual", "business"];
  const industries = ["Technology", "Healthcare", "Education", "Finance", "Manufacturing", "Retail", "Consulting", "Media", "Non-profit"];
  const firstNames = [
    "James", "Robert", "Mary", "Patricia", "Jennifer", "Linda", 
    "Elizabeth", "Susan", "Jessica", "Sarah", "Karen", "Nancy", 
    "Lisa", "Margaret", "Betty", "Sandra", "Ashley", "Dorothy", 
    "Kimberly", "Emily", "Donna", "Michelle", "Carol", "Amanda", 
    "William", "Richard", "Joseph", "Thomas", "Charles", "Christopher", 
    "Daniel", "Matthew", "Anthony", "Mark", "Donald", "Steven", 
    "Andrew", "Paul", "Joshua", "Kenneth", "Kevin", "Brian", 
    "George", "Timothy", "Ronald", "Jason", "Edward", "Jeffrey"
  ];
  
  const lastNames = [
    "Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", 
    "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", 
    "Jackson", "White", "Harris", "Martin", "Thompson", "Garcia", 
    "Martinez", "Robinson", "Clark", "Rodriguez", "Lewis", "Lee", 
    "Walker", "Hall", "Allen", "Young", "Hernandez", "King", 
    "Wright", "Lopez", "Hill", "Scott", "Green", "Adams", 
    "Baker", "Gonzalez", "Nelson", "Carter", "Mitchell", "Perez", 
    "Roberts", "Turner", "Phillips", "Campbell", "Parker", "Evans"
  ];
  
  const companyNames = [
    "Acme Corporation", "Globex", "Initech", "Umbrella Corporation", "Stark Industries",
    "Wayne Enterprises", "Cyberdyne Systems", "Soylent Corp", "Massive Dynamic", "Oscorp",
    "Hooli", "Pied Piper", "Dunder Mifflin", "Sterling Cooper", "Wonka Industries",
    "Gekko & Co", "Weyland-Yutani", "Tyrell Corporation", "Nakatomi Trading Corp", "Oceanic Airlines",
    "Dharma Initiative", "Waystar Royco", "Vehement Capital", "Prestige Worldwide", "Bluth Company",
    "Sirius Cybernetics", "Aperture Science", "Hanso Foundation", "Virtucon", "Xanatos Enterprises",
    "Macrosoft", "Goliath National Bank", "Massive Dynamics", "Rekall", "Cybertron Inc",
    "Gringotts", "Olivia Pope & Associates", "Krusty Krab", "Los Pollos Hermanos", "Beneke Fabricators"
  ];
  
  const cities = ["San Francisco", "New York", "Chicago", "Los Angeles", "Seattle", "Austin", "Boston", "Denver", "Atlanta", "Miami"];
  const states = ["CA", "NY", "IL", "TX", "WA", "MA", "CO", "GA", "FL"];
  
  // Generate 50 customers
  for (let i = 0; i < 50; i++) {
    const type = randomItem(customerTypes);
    let name, email, company;
    
    if (type === "individual") {
      const firstName = randomItem(firstNames);
      const lastName = randomItem(lastNames);
      name = `${firstName} ${lastName}`;
      email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
      company = Math.random() > 0.7 ? randomItem(companyNames) : null;
    } else {
      company = randomItem(companyNames);
      name = company;
      email = `info@${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
    }
    
    const city = randomItem(cities);
    const state = randomItem(states);
    const createdAt = randomDate(oneYearAgo, currentDate);
    
    customers.push({
      _id: generateObjectId(),
      name: name,
      email: email,
      phone: `+1 (${randomInt(200, 999)}) ${randomInt(100, 999)}-${randomInt(1000, 9999)}`,
      type: type,
      company: company,
      address: `${randomInt(100, 9999)} ${randomItem(["Main", "Oak", "Maple", "Cedar", "Pine", "Elm", "Washington", "Broadway"])} ${randomItem(["St", "Ave", "Blvd", "Rd", "Ln", "Dr"])}`,
      city: city,
      state: state,
      zipCode: `${randomInt(10000, 99999)}`,
      country: "USA",
      industry: type === "business" ? randomItem(industries) : null,
      website: type === "business" ? `https://www.${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com` : null,
      notes: Math.random() > 0.8 ? `${randomItem(["VIP customer", "Frequent buyer", "New customer", "Requires special attention", "International shipping"])}` : "",
      companyId: companyId,
      createdAt: createdAt,
      updatedAt: createdAt
    });
  }

  // Generate sales data
  const sales = [];
  const statuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
  const paymentStatuses = ["pending", "paid", "refunded", "failed"];
  const paymentMethods = ["credit_card", "bank_transfer", "paypal", "cash", "check"];
  const shippingMethods = ["standard", "express", "overnight", "pickup"];
  
  // Generate 100 sales
  for (let i = 0; i < 100; i++) {
    const customer = randomItem(customers);
    const orderDate = randomDate(oneYearAgo, currentDate);
    
    // Generate order items (1-5 items per order)
    const numItems = randomInt(1, 5);
    const items = [];
    let subtotal = 0;
    
    // Select random items from inventory
    const selectedItems = [];
    for (let j = 0; j < numItems; j++) {
      let item;
      do {
        item = randomItem(inventoryItems);
      } while (selectedItems.includes(item._id));
      
      selectedItems.push(item._id);
      
      const quantity = randomInt(1, 5);
      const price = item.price;
      const total = quantity * price;
      
      items.push({
        productId: item._id,
        name: item.name,
        sku: item.sku,
        quantity: quantity,
        price: price,
        total: formatCurrency(total)
      });
      
      subtotal += total;
    }
    
    // Calculate tax and total
    const taxRate = 0.0825; // 8.25% tax rate
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    
    // Determine status based on order date
    let status, paymentStatus;
    const daysSinceOrder = Math.floor((currentDate - orderDate) / (1000 * 60 * 60 * 24));
    
    if (daysSinceOrder < 1) {
      status = Math.random() > 0.2 ? "pending" : "processing";
      paymentStatus = Math.random() > 0.3 ? "pending" : "paid";
    } else if (daysSinceOrder < 3) {
      status = Math.random() > 0.7 ? "processing" : "shipped";
      paymentStatus = Math.random() > 0.2 ? "paid" : "pending";
    } else if (daysSinceOrder < 7) {
      status = Math.random() > 0.6 ? "shipped" : "delivered";
      paymentStatus = Math.random() > 0.1 ? "paid" : "pending";
    } else {
      status = Math.random() > 0.1 ? "delivered" : (Math.random() > 0.5 ? "cancelled" : "shipped");
      paymentStatus = status === "cancelled" ? (Math.random() > 0.5 ? "refunded" : "failed") : "paid";
    }
    
    // Randomly assign a sales rep
    const salesRep = randomItem(employees.filter(emp => emp.department === "Sales"));
    
    // Generate shipping and delivery dates based on status
    let shippedDate = null;
    let deliveredDate = null;
    
    if (status === "shipped" || status === "delivered") {
      shippedDate = new Date(orderDate);
      shippedDate.setDate(orderDate.getDate() + randomInt(1, 3));
    }
    
    if (status === "delivered") {
      deliveredDate = new Date(shippedDate);
      deliveredDate.setDate(shippedDate.getDate() + randomInt(1, 5));
    }
    
    // Generate order number
    const orderNumber = `ORD-${orderDate.getFullYear()}${(orderDate.getMonth() + 1).toString().padStart(2, '0')}${orderDate.getDate().toString().padStart(2, '0')}-${randomInt(1000, 9999)}`;
    
    sales.push({
      _id: generateObjectId(),
      orderNumber: orderNumber,
      customerId: customer._id,
      customerName: customer.name,
      customerEmail: customer.email,
      items: items,
      subtotal: formatCurrency(subtotal),
      tax: formatCurrency(tax),
      total: formatCurrency(total),
      status: status,
      paymentStatus: paymentStatus,
      paymentMethod: randomItem(paymentMethods),
      shippingMethod: randomItem(shippingMethods),
      shippingAddress: {
        street: customer.address,
        city: customer.city,
        state: customer.state,
        zipCode: customer.zipCode,
        country: customer.country
      },
      salesRepId: salesRep ? salesRep._id : null,
      salesRepName: salesRep ? `${salesRep.firstName} ${salesRep.lastName}` : null,
      orderDate: orderDate,
      shippedDate: shippedDate,
      deliveredDate: deliveredDate,
      notes: Math.random() > 0.9 ? `${randomItem(["Rush order", "Gift wrapped", "Special instructions", "Fragile items", "International shipping"])}` : "",
      companyId: companyId,
      createdAt: orderDate,
      updatedAt: orderDate
    });
  }

  // Generate sales analytics data
  const salesByMonth = [];
  const salesByCategory = [];
  const topProducts = [];
  const topCustomers = [];
  
  // Sales by month
  for (let month = 0; month < 12; month++) {
    const monthDate = new Date(oneYearAgo);
    monthDate.setMonth(oneYearAgo.getMonth() + month);
    const monthName = monthDate.toLocaleString('default', { month: 'long' });
    const year = monthDate.getFullYear();
    
    const monthSales = sales.filter(sale => {
      const saleDate = new Date(sale.orderDate);
      return saleDate.getMonth() === monthDate.getMonth() && saleDate.getFullYear() === year;
    });
    
    const totalRevenue = monthSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalOrders = monthSales.length;
    
    salesByMonth.push({
      _id: generateObjectId(),
      month: monthName,
      year: year,
      totalRevenue: formatCurrency(totalRevenue),
      totalOrders: totalOrders,
      averageOrderValue: totalOrders > 0 ? formatCurrency(totalRevenue / totalOrders) : 0,
      companyId: companyId,
      createdAt: currentDate,
      updatedAt: currentDate
    });
  }
  
  // Sales by category
  const categories = [...new Set(inventoryItems.map(item => item.category))];
  
  categories.forEach(category => {
    const categoryItems = inventoryItems.filter(item => item.category === category);
    const categoryItemIds = categoryItems.map(item => item._id);
    
    let totalRevenue = 0;
    let totalQuantity = 0;
    
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (categoryItems.some(catItem => catItem._id === item.productId)) {
          totalRevenue += item.total;
          totalQuantity += item.quantity;
        }
      });
    });
    
    salesByCategory.push({
      _id: generateObjectId(),
      category: category,
      totalRevenue: formatCurrency(totalRevenue),
      totalQuantity: totalQuantity,
      percentageOfTotal: 0, // Will calculate after all categories are processed
      companyId: companyId,
      createdAt: currentDate,
      updatedAt: currentDate
    });
  });
  
  // Calculate percentage of total for each category
  const totalRevenue = salesByCategory.reduce((sum, cat) => sum + cat.totalRevenue, 0);
  salesByCategory.forEach(category => {
    category.percentageOfTotal = formatCurrency((category.totalRevenue / totalRevenue) * 100);
  });
  
  // Top products
  const productSales = {};
  
  sales.forEach(sale => {
    sale.items.forEach(item => {
      if (!productSales[item.productId]) {
        productSales[item.productId] = {
          productId: item.productId,
          name: item.name,
          sku: item.sku,
          totalRevenue: 0,
          totalQuantity: 0,
          averagePrice: 0
        };
      }
      
      productSales[item.productId].totalRevenue += item.total;
      productSales[item.productId].totalQuantity += item.quantity;
    });
  });
  
  // Convert to array and calculate average price
  const productSalesArray = Object.values(productSales);
  productSalesArray.forEach(product => {
    product.averagePrice = formatCurrency(product.totalRevenue / product.totalQuantity);
    product.totalRevenue = formatCurrency(product.totalRevenue);
  });
  
  // Sort by total revenue and take top 10
  productSalesArray.sort((a, b) => b.totalRevenue - a.totalRevenue);
  const top10Products = productSalesArray.slice(0, 10);
  
  top10Products.forEach(product => {
    topProducts.push({
      _id: generateObjectId(),
      productId: product.productId,
      name: product.name,
      sku: product.sku,
      totalRevenue: product.totalRevenue,
      totalQuantity: product.totalQuantity,
      averagePrice: product.averagePrice,
      companyId: companyId,
      createdAt: currentDate,
      updatedAt: currentDate
    });
  });
  
  // Top customers
  const customerSales = {};
  
  sales.forEach(sale => {
    if (!customerSales[sale.customerId]) {
      customerSales[sale.customerId] = {
        customerId: sale.customerId,
        name: sale.customerName,
        email: sale.customerEmail,
        totalSpent: 0,
        orderCount: 0,
        averageOrderValue: 0
      };
    }
    
    customerSales[sale.customerId].totalSpent += sale.total;
    customerSales[sale.customerId].orderCount += 1;
  });
  
  // Convert to array and calculate average order value
  const customerSalesArray = Object.values(customerSales);
  customerSalesArray.forEach(customer => {
    customer.averageOrderValue = formatCurrency(customer.totalSpent / customer.orderCount);
    customer.totalSpent = formatCurrency(customer.totalSpent);
  });
  
  // Sort by total spent and take top 10
  customerSalesArray.sort((a, b) => b.totalSpent - a.totalSpent);
  const top10Customers = customerSalesArray.slice(0, 10);
  
  top10Customers.forEach(customer => {
    topCustomers.push({
      _id: generateObjectId(),
      customerId: customer.customerId,
      name: customer.name,
      email: customer.email,
      totalSpent: customer.totalSpent,
      orderCount: customer.orderCount,
      averageOrderValue: customer.averageOrderValue,
      companyId: companyId,
      createdAt: currentDate,
      updatedAt: currentDate
    });
  });

  // Combine all data
  const salesData = {
    Customer: customers,
    Sale: sales,
    SalesByMonth: salesByMonth,
    SalesByCategory: salesByCategory,
    TopProduct: topProducts,
    TopCustomer: topCustomers
  };

  return salesData;
}

// Generate the data
const salesData = generateSalesData();

// Write to file
fs.writeFileSync('sales-data.json', JSON.stringify(salesData, null, 2));
console.log('Sales data generated and saved to sales-data.json');
