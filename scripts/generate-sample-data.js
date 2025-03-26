/**
 * This script generates sample base data for the ERP-AI system
 * Run with: node scripts/generate-sample-data.js
 * The output will be saved to sample-data.json
 */

const fs = require('fs');
const crypto = require('crypto');
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

// Helper function to hash a password
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Generate sample data
function generateSampleData() {
  const currentDate = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(currentDate.getFullYear() - 1);

  // Generate company data
  const companyId = generateObjectId();
  const company = {
    _id: companyId,
    name: "TechNova Solutions",
    email: "info@technovasolutions.com",
    phone: "+1 (555) 123-4567",
    address: "123 Innovation Drive",
    city: "San Francisco",
    state: "CA",
    zipCode: "94105",
    country: "USA",
    industry: "Technology",
    size: "Medium",
    website: "https://technovasolutions.com",
    logo: "https://example.com/logo.png",
    createdAt: oneYearAgo,
    updatedAt: oneYearAgo
  };

  // Generate user data
  const users = [];
  const roles = ["admin", "manager", "employee"];
  const departments = ["Engineering", "Sales", "Marketing", "HR", "Finance", "Operations"];
  
  // Admin user
  const adminId = generateObjectId();
  users.push({
    _id: adminId,
    email: "admin@technovasolutions.com",
    password: hashPassword("password123"),
    firstName: "Admin",
    lastName: "User",
    role: "admin",
    department: "Management",
    isActive: true,
    isVerified: true,
    companyId: companyId,
    createdAt: oneYearAgo,
    updatedAt: oneYearAgo
  });
  
  // Department managers
  const managerIds = [];
  departments.forEach(department => {
    const managerId = generateObjectId();
    managerIds.push(managerId);
    
    const firstName = randomItem(["John", "Sarah", "Michael", "Emily", "David", "Jessica"]);
    const lastName = randomItem(["Smith", "Johnson", "Williams", "Jones", "Brown", "Davis"]);
    
    users.push({
      _id: managerId,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@technovasolutions.com`,
      password: hashPassword("password123"),
      firstName: firstName,
      lastName: lastName,
      role: "manager",
      department: department,
      isActive: true,
      isVerified: true,
      companyId: companyId,
      createdAt: randomDate(oneYearAgo, new Date(oneYearAgo.getTime() + 30 * 24 * 60 * 60 * 1000)),
      updatedAt: randomDate(oneYearAgo, currentDate)
    });
  });
  
  // Regular employees
  const employeeIds = [];
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
  
  for (let i = 0; i < 30; i++) {
    const employeeId = generateObjectId();
    employeeIds.push(employeeId);
    
    const firstName = randomItem(firstNames);
    const lastName = randomItem(lastNames);
    const department = randomItem(departments);
    const role = randomItem(roles);
    
    users.push({
      _id: employeeId,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@technovasolutions.com`,
      password: hashPassword("password123"),
      firstName: firstName,
      lastName: lastName,
      role: role,
      department: department,
      isActive: Math.random() > 0.1, // 10% inactive
      isVerified: true,
      companyId: companyId,
      createdAt: randomDate(oneYearAgo, currentDate),
      updatedAt: randomDate(oneYearAgo, currentDate)
    });
  }

  // Generate employee data
  const employees = [];
  const positions = {
    "Engineering": ["Software Engineer", "Frontend Developer", "Backend Developer", "DevOps Engineer", "QA Engineer", "UI/UX Designer"],
    "Sales": ["Sales Representative", "Account Executive", "Sales Manager", "Business Development", "Sales Analyst"],
    "Marketing": ["Marketing Specialist", "Content Writer", "SEO Specialist", "Social Media Manager", "Marketing Analyst"],
    "HR": ["HR Specialist", "Recruiter", "HR Manager", "Training Coordinator", "Benefits Administrator"],
    "Finance": ["Accountant", "Financial Analyst", "Bookkeeper", "Finance Manager", "Payroll Specialist"],
    "Operations": ["Operations Manager", "Project Manager", "Business Analyst", "Product Manager", "Operations Analyst"]
  };
  
  // Add department managers
  departments.forEach((department, index) => {
    const userId = managerIds[index];
    const user = users.find(u => u._id === userId);
    
    employees.push({
      _id: generateObjectId(),
      userId: userId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: `+1 (555) ${randomInt(100, 999)}-${randomInt(1000, 9999)}`,
      position: `${department} Manager`,
      department: department,
      hireDate: randomDate(new Date(oneYearAgo.getTime() - 365 * 24 * 60 * 60 * 1000), oneYearAgo),
      salary: randomInt(80000, 120000),
      address: `${randomInt(100, 999)} ${randomItem(["Main", "Oak", "Maple", "Cedar", "Pine"])} ${randomItem(["St", "Ave", "Blvd", "Rd", "Ln"])}`,
      city: randomItem(["San Francisco", "New York", "Chicago", "Los Angeles", "Seattle", "Austin", "Boston", "Denver"]),
      state: randomItem(["CA", "NY", "IL", "TX", "WA", "MA", "CO"]),
      zipCode: `${randomInt(10000, 99999)}`,
      country: "USA",
      emergencyContact: {
        name: `${randomItem(firstNames)} ${randomItem(lastNames)}`,
        relationship: randomItem(["Spouse", "Parent", "Sibling", "Friend"]),
        phone: `+1 (555) ${randomInt(100, 999)}-${randomInt(1000, 9999)}`
      },
      notes: "",
      status: "active",
      companyId: companyId,
      createdAt: oneYearAgo,
      updatedAt: oneYearAgo
    });
  });
  
  // Add regular employees
  employeeIds.forEach(userId => {
    const user = users.find(u => u._id === userId);
    const department = user.department;
    const position = randomItem(positions[department]);
    
    employees.push({
      _id: generateObjectId(),
      userId: userId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: `+1 (555) ${randomInt(100, 999)}-${randomInt(1000, 9999)}`,
      position: position,
      department: department,
      hireDate: randomDate(oneYearAgo, currentDate),
      salary: randomInt(50000, 100000),
      address: `${randomInt(100, 999)} ${randomItem(["Main", "Oak", "Maple", "Cedar", "Pine"])} ${randomItem(["St", "Ave", "Blvd", "Rd", "Ln"])}`,
      city: randomItem(["San Francisco", "New York", "Chicago", "Los Angeles", "Seattle", "Austin", "Boston", "Denver"]),
      state: randomItem(["CA", "NY", "IL", "TX", "WA", "MA", "CO"]),
      zipCode: `${randomInt(10000, 99999)}`,
      country: "USA",
      emergencyContact: {
        name: `${randomItem(firstNames)} ${randomItem(lastNames)}`,
        relationship: randomItem(["Spouse", "Parent", "Sibling", "Friend"]),
        phone: `+1 (555) ${randomInt(100, 999)}-${randomInt(1000, 9999)}`
      },
      notes: Math.random() > 0.7 ? `${randomItem(["Top performer", "Recently promoted", "Needs training", "On probation", "Remote worker"])}` : "",
      status: user.isActive ? "active" : "inactive",
      companyId: companyId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  });

  // Generate inventory data
  const inventoryItems = [];
  const categories = ["Electronics", "Office Supplies", "Furniture", "Software", "Hardware"];
  const units = ["piece", "box", "set", "license", "pack"];
  const locations = ["Warehouse A", "Warehouse B", "Office Storage", "Remote Storage"];
  const suppliers = [
    { name: "TechSupply Co.", email: "orders@techsupply.com", phone: "+1 (555) 111-2222" },
    { name: "Office Essentials", email: "sales@officeessentials.com", phone: "+1 (555) 222-3333" },
    { name: "Furniture Plus", email: "info@furnitureplus.com", phone: "+1 (555) 333-4444" },
    { name: "Software Solutions", email: "licensing@softwaresolutions.com", phone: "+1 (555) 444-5555" },
    { name: "Hardware Depot", email: "orders@hardwaredepot.com", phone: "+1 (555) 555-6666" }
  ];
  
  const productNames = {
    "Electronics": [
      "Laptop", "Monitor", "Keyboard", "Mouse", "Headphones", 
      "Webcam", "Microphone", "Speakers", "Tablet", "Smartphone"
    ],
    "Office Supplies": [
      "Notebook", "Pen Set", "Stapler", "Paper Clips", "Sticky Notes", 
      "Printer Paper", "Binders", "Folders", "Desk Organizer", "Whiteboard"
    ],
    "Furniture": [
      "Office Chair", "Desk", "Bookshelf", "Filing Cabinet", "Conference Table", 
      "Sofa", "Coffee Table", "Standing Desk", "Cubicle Divider", "Lamp"
    ],
    "Software": [
      "Office Suite", "Design Software", "Accounting Software", "Project Management Tool", 
      "Security Suite", "Operating System", "Database Software", "CRM Software", "Email Service"
    ],
    "Hardware": [
      "Server", "Router", "Switch", "Hard Drive", "SSD", 
      "RAM Module", "Graphics Card", "Processor", "Power Supply", "Network Cable"
    ]
  };
  
  // Generate 50 inventory items
  for (let i = 0; i < 50; i++) {
    const category = randomItem(categories);
    const name = randomItem(productNames[category]);
    const sku = `${category.substring(0, 3).toUpperCase()}-${randomInt(1000, 9999)}`;
    const unit = randomItem(units);
    const location = randomItem(locations);
    const supplier = randomItem(suppliers);
    
    let price, quantity;
    switch (category) {
      case "Electronics":
        price = randomInt(200, 2000);
        quantity = randomInt(5, 50);
        break;
      case "Office Supplies":
        price = randomInt(5, 100);
        quantity = randomInt(20, 200);
        break;
      case "Furniture":
        price = randomInt(100, 1000);
        quantity = randomInt(2, 20);
        break;
      case "Software":
        price = randomInt(50, 500);
        quantity = randomInt(10, 100);
        break;
      case "Hardware":
        price = randomInt(50, 800);
        quantity = randomInt(5, 50);
        break;
      default:
        price = randomInt(10, 500);
        quantity = randomInt(10, 100);
    }
    
    const reorderPoint = Math.floor(quantity * 0.2); // 20% of quantity
    const reorderQuantity = Math.floor(quantity * 0.5); // 50% of quantity
    const createdAt = randomDate(oneYearAgo, currentDate);
    
    inventoryItems.push({
      _id: generateObjectId(),
      name: name,
      sku: sku,
      description: `${name} - ${category}`,
      category: category,
      quantity: quantity,
      unit: unit,
      price: price,
      cost: Math.floor(price * 0.6), // 60% of price
      location: location,
      supplier: supplier,
      reorderPoint: reorderPoint,
      reorderQuantity: reorderQuantity,
      lastRestockDate: randomDate(oneYearAgo, currentDate),
      notes: Math.random() > 0.7 ? `${randomItem(["High demand", "Seasonal item", "New model", "Discontinued", "Limited stock"])}` : "",
      companyId: companyId,
      createdAt: createdAt,
      updatedAt: createdAt
    });
  }

  // Generate notification data
  const notifications = [];
  const notificationTypes = ["info", "warning", "success", "error"];
  const notificationTitles = {
    "info": ["New employee joined", "System update", "Meeting reminder", "Document shared"],
    "warning": ["Low inventory", "Payment due", "Deadline approaching", "License expiring"],
    "success": ["Payment received", "Project completed", "Goal achieved", "Order fulfilled"],
    "error": ["Payment failed", "System error", "Delivery failed", "Order cancelled"]
  };
  
  // Generate 30 notifications
  for (let i = 0; i < 30; i++) {
    const type = randomItem(notificationTypes);
    const title = randomItem(notificationTitles[type]);
    const userId = randomItem([...managerIds, ...employeeIds, adminId]);
    const createdAt = randomDate(new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000), currentDate);
    
    notifications.push({
      _id: generateObjectId(),
      userId: userId,
      type: type,
      title: title,
      message: `${title} - ${randomItem([
        "Please review at your earliest convenience.",
        "Action required.",
        "For your information.",
        "Please respond as soon as possible.",
        "No action required."
      ])}`,
      isRead: Math.random() > 0.5, // 50% read
      link: Math.random() > 0.7 ? "/dashboard" : null,
      companyId: companyId,
      createdAt: createdAt,
      updatedAt: createdAt
    });
  }

  // Combine all data
  const sampleData = {
    Company: [company],
    User: users,
    Employee: employees,
    InventoryItem: inventoryItems,
    Notification: notifications
  };

  return sampleData;
}

// Generate the data
const sampleData = generateSampleData();

// Write to file
fs.writeFileSync('sample-data.json', JSON.stringify(sampleData, null, 2));
console.log('Sample data generated and saved to sample-data.json');
