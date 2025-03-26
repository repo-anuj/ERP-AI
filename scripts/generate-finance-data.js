/**
 * This script generates sample finance data for the ERP-AI system
 * Run with: node scripts/generate-finance-data.js
 * The output will be saved to finance-data.json
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
function generateFinanceData() {
  const currentDate = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(currentDate.getFullYear() - 1);

  // Load the required data files
  let sampleData, salesData, projectData;
  try {
    sampleData = JSON.parse(fs.readFileSync('sample-data.json', 'utf8'));
    salesData = JSON.parse(fs.readFileSync('sales-data.json', 'utf8'));
    projectData = JSON.parse(fs.readFileSync('project-data.json', 'utf8'));
  } catch (error) {
    console.error('Error loading required data files. Please run generate-sample-data.js, generate-sales-data.js, and generate-project-data.js first.');
    process.exit(1);
  }

  const companyId = sampleData.Company[0]._id;
  const employees = sampleData.Employee;
  const inventoryItems = sampleData.InventoryItem;
  const customers = salesData.Customer;
  const sales = salesData.Sale;
  const projects = projectData.Project;

  // Generate transaction data
  const transactions = [];
  const transactionTypes = ["income", "expense", "transfer"];
  const categories = {
    "income": ["Sales", "Services", "Consulting", "Interest", "Investments", "Royalties", "Rental"],
    "expense": ["Salary", "Rent", "Utilities", "Office Supplies", "Equipment", "Marketing", "Travel", "Insurance", "Taxes", "Maintenance", "Software", "Professional Services"],
    "transfer": ["Bank Transfer", "Credit Card Payment", "Loan Payment", "Investment Transfer"]
  };
  const accounts = [
    { name: "Operating Account", type: "checking", balance: 250000 },
    { name: "Savings Account", type: "savings", balance: 500000 },
    { name: "Business Credit Card", type: "credit", balance: -15000 },
    { name: "Investment Account", type: "investment", balance: 750000 },
    { name: "Petty Cash", type: "cash", balance: 2000 }
  ];
  
  // Generate 200 transactions
  for (let i = 0; i < 200; i++) {
    const type = randomItem(transactionTypes);
    const category = randomItem(categories[type]);
    const date = randomDate(oneYearAgo, currentDate);
    
    let amount, description, fromAccount, toAccount, relatedEntityId, relatedEntityType;
    
    // Determine transaction details based on type
    if (type === "income") {
      amount = randomInt(1000, 50000);
      
      // Some income transactions are related to sales
      if (category === "Sales" && Math.random() > 0.3) {
        const sale = randomItem(sales);
        amount = sale.total;
        description = `Payment received for order ${sale.orderNumber}`;
        relatedEntityId = sale._id;
        relatedEntityType = "Sale";
      } else if (category === "Services" && Math.random() > 0.5) {
        const project = randomItem(projects.filter(p => p.type === "client"));
        if (project) {
          amount = formatCurrency(project.budget * (Math.random() > 0.5 ? 0.5 : 1));
          description = `Payment received for ${project.name}`;
          relatedEntityId = project._id;
          relatedEntityType = "Project";
        } else {
          description = `${category} income`;
        }
      } else {
        description = `${category} income`;
      }
      
      // Income goes into an account
      toAccount = randomItem(accounts.filter(a => a.type !== "credit"));
      fromAccount = null;
    } else if (type === "expense") {
      if (category === "Salary") {
        amount = randomInt(30000, 100000);
        const employee = randomItem(employees);
        description = `Salary payment - ${employee.firstName} ${employee.lastName}`;
        relatedEntityId = employee._id;
        relatedEntityType = "Employee";
      } else if (category === "Equipment" || category === "Office Supplies") {
        amount = randomInt(100, 5000);
        if (Math.random() > 0.5) {
          const item = randomItem(inventoryItems);
          description = `Purchase of ${item.name}`;
          relatedEntityId = item._id;
          relatedEntityType = "InventoryItem";
        } else {
          description = `${category} expense`;
        }
      } else if (category === "Marketing" && Math.random() > 0.7) {
        amount = randomInt(1000, 20000);
        const project = randomItem(projects.filter(p => p.type === "internal" && p.name.includes("Marketing")));
        if (project) {
          description = `Marketing expense for ${project.name}`;
          relatedEntityId = project._id;
          relatedEntityType = "Project";
        } else {
          description = `${category} expense`;
        }
      } else {
        amount = randomInt(100, 10000);
        description = `${category} expense`;
      }
      
      // Expense comes from an account
      fromAccount = randomItem(accounts);
      toAccount = null;
    } else { // transfer
      amount = randomInt(5000, 100000);
      description = `${category}`;
      
      // Transfer between accounts
      const accountsCopy = [...accounts];
      fromAccount = randomItem(accountsCopy);
      const toAccountOptions = accountsCopy.filter(a => a.name !== fromAccount.name);
      toAccount = randomItem(toAccountOptions);
    }
    
    // Create transaction
    transactions.push({
      _id: generateObjectId(),
      type: type,
      amount: formatCurrency(amount),
      description: description,
      category: category,
      date: date,
      fromAccount: fromAccount ? fromAccount.name : null,
      toAccount: toAccount ? toAccount.name : null,
      relatedEntityId: relatedEntityId || null,
      relatedEntityType: relatedEntityType || null,
      notes: Math.random() > 0.9 ? `${randomItem(["Approved by CFO", "Recurring transaction", "Special approval required", "One-time payment", "Quarterly payment"])}` : "",
      status: Math.random() > 0.05 ? "completed" : (Math.random() > 0.5 ? "pending" : "failed"),
      companyId: companyId,
      createdAt: date,
      updatedAt: date
    });
  }

  // Generate invoice data
  const invoices = [];
  const invoiceStatuses = ["draft", "sent", "paid", "overdue", "cancelled"];
  const paymentTerms = ["due_on_receipt", "net_15", "net_30", "net_60"];
  
  // Generate 50 invoices
  for (let i = 0; i < 50; i++) {
    const customer = randomItem(customers);
    const issueDate = randomDate(oneYearAgo, currentDate);
    
    // Determine due date based on payment terms
    const term = randomItem(paymentTerms);
    let dueDate;
    
    switch (term) {
      case "due_on_receipt":
        dueDate = new Date(issueDate);
        break;
      case "net_15":
        dueDate = new Date(issueDate);
        dueDate.setDate(issueDate.getDate() + 15);
        break;
      case "net_30":
        dueDate = new Date(issueDate);
        dueDate.setDate(issueDate.getDate() + 30);
        break;
      case "net_60":
        dueDate = new Date(issueDate);
        dueDate.setDate(issueDate.getDate() + 60);
        break;
    }
    
    // Determine status based on dates
    let status;
    if (dueDate > currentDate) {
      status = Math.random() > 0.7 ? "sent" : (Math.random() > 0.5 ? "draft" : "paid");
    } else {
      const daysPastDue = Math.floor((currentDate - dueDate) / (1000 * 60 * 60 * 24));
      if (daysPastDue > 30) {
        status = Math.random() > 0.3 ? "overdue" : (Math.random() > 0.5 ? "paid" : "cancelled");
      } else {
        status = Math.random() > 0.5 ? "paid" : "overdue";
      }
    }
    
    // Generate invoice items (1-5 items per invoice)
    const numItems = randomInt(1, 5);
    const items = [];
    let subtotal = 0;
    
    for (let j = 0; j < numItems; j++) {
      const quantity = randomInt(1, 10);
      const unitPrice = randomInt(100, 1000);
      const total = quantity * unitPrice;
      
      items.push({
        description: `${randomItem(["Product", "Service", "Consultation", "Support", "Maintenance", "License", "Subscription"])} ${j + 1}`,
        quantity: quantity,
        unitPrice: unitPrice,
        total: formatCurrency(total)
      });
      
      subtotal += total;
    }
    
    // Calculate tax and total
    const taxRate = 0.0825; // 8.25% tax rate
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    
    // Generate invoice number
    const invoiceNumber = `INV-${issueDate.getFullYear()}${(issueDate.getMonth() + 1).toString().padStart(2, '0')}${issueDate.getDate().toString().padStart(2, '0')}-${randomInt(1000, 9999)}`;
    
    // Determine payment date for paid invoices
    let paymentDate = null;
    if (status === "paid") {
      paymentDate = new Date(issueDate);
      paymentDate.setDate(issueDate.getDate() + randomInt(1, 30));
      
      // Ensure payment date is not after current date
      if (paymentDate > currentDate) {
        paymentDate = new Date(currentDate);
        paymentDate.setDate(currentDate.getDate() - randomInt(1, 7));
      }
    }
    
    invoices.push({
      _id: generateObjectId(),
      invoiceNumber: invoiceNumber,
      customerId: customer._id,
      customerName: customer.name,
      customerEmail: customer.email,
      items: items,
      subtotal: formatCurrency(subtotal),
      tax: formatCurrency(tax),
      total: formatCurrency(total),
      status: status,
      issueDate: issueDate,
      dueDate: dueDate,
      paymentDate: paymentDate,
      paymentTerms: term,
      notes: Math.random() > 0.8 ? `${randomItem(["Please pay promptly", "Thank you for your business", "Contact for questions", "Late fee applies after due date", "Discount for early payment"])}` : "",
      companyId: companyId,
      createdAt: issueDate,
      updatedAt: status === "draft" ? issueDate : new Date(Math.max(issueDate.getTime(), currentDate.getTime() - randomInt(1, 30) * 24 * 60 * 60 * 1000))
    });
  }

  // Generate expense data
  const expenses = [];
  const expenseCategories = ["Office Supplies", "Travel", "Meals", "Equipment", "Software", "Professional Services", "Utilities", "Rent", "Insurance", "Marketing", "Training", "Miscellaneous"];
  const expenseStatuses = ["pending", "approved", "reimbursed", "rejected"];
  const paymentMethods = ["credit_card", "cash", "check", "bank_transfer", "company_card"];
  
  // Generate 100 expenses
  for (let i = 0; i < 100; i++) {
    const employee = randomItem(employees);
    const date = randomDate(oneYearAgo, currentDate);
    const category = randomItem(expenseCategories);
    
    // Determine amount based on category
    let amount;
    switch (category) {
      case "Travel":
        amount = randomInt(200, 2000);
        break;
      case "Equipment":
        amount = randomInt(500, 5000);
        break;
      case "Software":
        amount = randomInt(100, 1000);
        break;
      case "Rent":
        amount = randomInt(1000, 5000);
        break;
      case "Marketing":
        amount = randomInt(500, 3000);
        break;
      default:
        amount = randomInt(50, 500);
    }
    
    // Determine status based on date
    let status;
    const daysSinceExpense = Math.floor((currentDate - date) / (1000 * 60 * 60 * 24));
    
    if (daysSinceExpense < 3) {
      status = Math.random() > 0.3 ? "pending" : "approved";
    } else if (daysSinceExpense < 7) {
      status = Math.random() > 0.6 ? "approved" : (Math.random() > 0.5 ? "pending" : "reimbursed");
    } else if (daysSinceExpense < 14) {
      status = Math.random() > 0.7 ? "reimbursed" : (Math.random() > 0.5 ? "approved" : "rejected");
    } else {
      status = Math.random() > 0.1 ? "reimbursed" : (Math.random() > 0.5 ? "approved" : "rejected");
    }
    
    // Determine reimbursement date for reimbursed expenses
    let reimbursementDate = null;
    if (status === "reimbursed") {
      reimbursementDate = new Date(date);
      reimbursementDate.setDate(date.getDate() + randomInt(3, 14));
      
      // Ensure reimbursement date is not after current date
      if (reimbursementDate > currentDate) {
        reimbursementDate = new Date(currentDate);
        reimbursementDate.setDate(currentDate.getDate() - randomInt(1, 3));
      }
    }
    
    // Determine if expense is related to a project
    let projectId = null;
    let projectName = null;
    
    if (Math.random() > 0.7) {
      const project = randomItem(projects);
      projectId = project._id;
      projectName = project.name;
    }
    
    expenses.push({
      _id: generateObjectId(),
      employeeId: employee._id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      amount: formatCurrency(amount),
      category: category,
      description: `${category} expense${projectName ? ` for ${projectName}` : ""}`,
      date: date,
      status: status,
      paymentMethod: randomItem(paymentMethods),
      receiptUrl: Math.random() > 0.2 ? `https://example.com/receipts/${generateObjectId()}.pdf` : null,
      approvedBy: status === "approved" || status === "reimbursed" ? randomItem(employees.filter(emp => emp.position.includes("Manager")))._id : null,
      reimbursementDate: reimbursementDate,
      projectId: projectId,
      projectName: projectName,
      notes: Math.random() > 0.8 ? `${randomItem(["Business trip", "Client meeting", "Office supplies", "Software subscription", "Team lunch"])}` : "",
      companyId: companyId,
      createdAt: date,
      updatedAt: status === "pending" ? date : new Date(Math.max(date.getTime(), currentDate.getTime() - randomInt(1, 7) * 24 * 60 * 60 * 1000))
    });
  }

  // Generate budget data
  const budgets = [];
  const budgetCategories = ["Salaries", "Marketing", "Operations", "IT", "Research & Development", "Travel", "Office Supplies", "Professional Services", "Training", "Miscellaneous"];
  
  // Generate annual budget
  const annualBudget = {
    _id: generateObjectId(),
    name: "Annual Budget",
    year: currentDate.getFullYear(),
    type: "annual",
    status: "approved",
    categories: [],
    totalBudget: 0,
    totalActual: 0,
    companyId: companyId,
    createdAt: new Date(currentDate.getFullYear(), 0, 1), // January 1st of current year
    updatedAt: new Date(currentDate.getFullYear(), 0, 15) // January 15th of current year
  };
  
  // Generate budget categories
  budgetCategories.forEach(category => {
    const budgetAmount = category === "Salaries" ? randomInt(500000, 1000000) : randomInt(50000, 200000);
    
    // Calculate actual spending based on transactions
    const categoryTransactions = transactions.filter(t => 
      t.type === "expense" && 
      (t.category === category || 
       (category === "Salaries" && t.category === "Salary") ||
       (category === "IT" && (t.category === "Software" || t.category === "Equipment")))
    );
    
    const actualAmount = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    annualBudget.categories.push({
      name: category,
      budgeted: formatCurrency(budgetAmount),
      actual: formatCurrency(actualAmount),
      variance: formatCurrency(budgetAmount - actualAmount),
      percentUsed: formatCurrency((actualAmount / budgetAmount) * 100)
    });
    
    annualBudget.totalBudget += budgetAmount;
    annualBudget.totalActual += actualAmount;
  });
  
  annualBudget.totalBudget = formatCurrency(annualBudget.totalBudget);
  annualBudget.totalActual = formatCurrency(annualBudget.totalActual);
  annualBudget.varianceTotal = formatCurrency(annualBudget.totalBudget - annualBudget.totalActual);
  annualBudget.percentUsedTotal = formatCurrency((annualBudget.totalActual / annualBudget.totalBudget) * 100);
  
  budgets.push(annualBudget);
  
  // Generate quarterly budgets
  for (let quarter = 1; quarter <= 4; quarter++) {
    const startMonth = (quarter - 1) * 3;
    const quarterStartDate = new Date(currentDate.getFullYear(), startMonth, 1);
    const quarterEndDate = new Date(currentDate.getFullYear(), startMonth + 3, 0);
    
    const quarterlyBudget = {
      _id: generateObjectId(),
      name: `Q${quarter} Budget`,
      year: currentDate.getFullYear(),
      quarter: quarter,
      type: "quarterly",
      status: quarter <= Math.ceil((currentDate.getMonth() + 1) / 3) ? "approved" : "draft",
      categories: [],
      totalBudget: 0,
      totalActual: 0,
      companyId: companyId,
      createdAt: new Date(quarterStartDate.getTime() - 15 * 24 * 60 * 60 * 1000), // 15 days before quarter starts
      updatedAt: new Date(quarterStartDate.getTime() - 5 * 24 * 60 * 60 * 1000) // 5 days before quarter starts
    };
    
    // Generate budget categories for quarter
    budgetCategories.forEach(category => {
      const annualCategoryBudget = annualBudget.categories.find(c => c.name === category).budgeted;
      const quarterlyBudgetAmount = formatCurrency(annualCategoryBudget / 4);
      
      // Calculate actual spending for the quarter
      const categoryTransactions = transactions.filter(t => 
        t.type === "expense" && 
        (t.category === category || 
         (category === "Salaries" && t.category === "Salary") ||
         (category === "IT" && (t.category === "Software" || t.category === "Equipment"))) &&
        t.date >= quarterStartDate &&
        t.date <= quarterEndDate
      );
      
      const actualAmount = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      quarterlyBudget.categories.push({
        name: category,
        budgeted: quarterlyBudgetAmount,
        actual: formatCurrency(actualAmount),
        variance: formatCurrency(quarterlyBudgetAmount - actualAmount),
        percentUsed: formatCurrency((actualAmount / quarterlyBudgetAmount) * 100)
      });
      
      quarterlyBudget.totalBudget += quarterlyBudgetAmount;
      quarterlyBudget.totalActual += actualAmount;
    });
    
    quarterlyBudget.totalBudget = formatCurrency(quarterlyBudget.totalBudget);
    quarterlyBudget.totalActual = formatCurrency(quarterlyBudget.totalActual);
    quarterlyBudget.varianceTotal = formatCurrency(quarterlyBudget.totalBudget - quarterlyBudget.totalActual);
    quarterlyBudget.percentUsedTotal = formatCurrency((quarterlyBudget.totalActual / quarterlyBudget.totalBudget) * 100);
    
    budgets.push(quarterlyBudget);
  }

  // Generate financial reports
  const financialReports = [];
  
  // Income Statement (Profit & Loss)
  const incomeStatement = {
    _id: generateObjectId(),
    type: "income_statement",
    name: "Income Statement",
    period: "annual",
    year: currentDate.getFullYear(),
    status: "final",
    data: {
      revenue: {
        sales: formatCurrency(transactions.filter(t => t.type === "income" && t.category === "Sales").reduce((sum, t) => sum + t.amount, 0)),
        services: formatCurrency(transactions.filter(t => t.type === "income" && t.category === "Services").reduce((sum, t) => sum + t.amount, 0)),
        consulting: formatCurrency(transactions.filter(t => t.type === "income" && t.category === "Consulting").reduce((sum, t) => sum + t.amount, 0)),
        other: formatCurrency(transactions.filter(t => t.type === "income" && !["Sales", "Services", "Consulting"].includes(t.category)).reduce((sum, t) => sum + t.amount, 0))
      },
      expenses: {
        salaries: formatCurrency(transactions.filter(t => t.type === "expense" && t.category === "Salary").reduce((sum, t) => sum + t.amount, 0)),
        rent: formatCurrency(transactions.filter(t => t.type === "expense" && t.category === "Rent").reduce((sum, t) => sum + t.amount, 0)),
        utilities: formatCurrency(transactions.filter(t => t.type === "expense" && t.category === "Utilities").reduce((sum, t) => sum + t.amount, 0)),
        marketing: formatCurrency(transactions.filter(t => t.type === "expense" && t.category === "Marketing").reduce((sum, t) => sum + t.amount, 0)),
        office_supplies: formatCurrency(transactions.filter(t => t.type === "expense" && t.category === "Office Supplies").reduce((sum, t) => sum + t.amount, 0)),
        equipment: formatCurrency(transactions.filter(t => t.type === "expense" && t.category === "Equipment").reduce((sum, t) => sum + t.amount, 0)),
        software: formatCurrency(transactions.filter(t => t.type === "expense" && t.category === "Software").reduce((sum, t) => sum + t.amount, 0)),
        professional_services: formatCurrency(transactions.filter(t => t.type === "expense" && t.category === "Professional Services").reduce((sum, t) => sum + t.amount, 0)),
        insurance: formatCurrency(transactions.filter(t => t.type === "expense" && t.category === "Insurance").reduce((sum, t) => sum + t.amount, 0)),
        taxes: formatCurrency(transactions.filter(t => t.type === "expense" && t.category === "Taxes").reduce((sum, t) => sum + t.amount, 0)),
        other: formatCurrency(transactions.filter(t => t.type === "expense" && !["Salary", "Rent", "Utilities", "Marketing", "Office Supplies", "Equipment", "Software", "Professional Services", "Insurance", "Taxes"].includes(t.category)).reduce((sum, t) => sum + t.amount, 0))
      }
    },
    companyId: companyId,
    createdAt: new Date(currentDate.getFullYear(), 0, 15), // January 15th of current year
    updatedAt: new Date(currentDate.getFullYear(), 1, 15) // February 15th of current year
  };
  
  // Calculate totals
  const totalRevenue = Object.values(incomeStatement.data.revenue).reduce((sum, val) => sum + val, 0);
  const totalExpenses = Object.values(incomeStatement.data.expenses).reduce((sum, val) => sum + val, 0);
  
  incomeStatement.data.totalRevenue = formatCurrency(totalRevenue);
  incomeStatement.data.totalExpenses = formatCurrency(totalExpenses);
  incomeStatement.data.netIncome = formatCurrency(totalRevenue - totalExpenses);
  incomeStatement.data.profitMargin = formatCurrency((incomeStatement.data.netIncome / totalRevenue) * 100);
  
  financialReports.push(incomeStatement);
  
  // Balance Sheet
  const balanceSheet = {
    _id: generateObjectId(),
    type: "balance_sheet",
    name: "Balance Sheet",
    period: "annual",
    year: currentDate.getFullYear(),
    status: "final",
    data: {
      assets: {
        current_assets: {
          cash: formatCurrency(accounts.filter(a => a.type === "checking" || a.type === "savings" || a.type === "cash").reduce((sum, a) => sum + a.balance, 0)),
          accounts_receivable: formatCurrency(invoices.filter(i => i.status === "sent" || i.status === "overdue").reduce((sum, i) => sum + i.total, 0)),
          inventory: formatCurrency(inventoryItems.reduce((sum, i) => sum + (i.quantity * i.cost), 0)),
          prepaid_expenses: formatCurrency(randomInt(10000, 50000))
        },
        non_current_assets: {
          property_plant_equipment: formatCurrency(randomInt(500000, 2000000)),
          intangible_assets: formatCurrency(randomInt(100000, 500000)),
          investments: formatCurrency(accounts.filter(a => a.type === "investment").reduce((sum, a) => sum + a.balance, 0))
        }
      },
      liabilities: {
        current_liabilities: {
          accounts_payable: formatCurrency(randomInt(50000, 200000)),
          short_term_debt: formatCurrency(Math.abs(accounts.filter(a => a.type === "credit").reduce((sum, a) => sum + a.balance, 0))),
          accrued_expenses: formatCurrency(expenses.filter(e => e.status === "approved" && !e.reimbursementDate).reduce((sum, e) => sum + e.amount, 0)),
          deferred_revenue: formatCurrency(randomInt(10000, 100000))
        },
        non_current_liabilities: {
          long_term_debt: formatCurrency(randomInt(200000, 1000000)),
          deferred_tax_liabilities: formatCurrency(randomInt(50000, 200000))
        }
      },
      equity: {
        common_stock: formatCurrency(randomInt(500000, 2000000)),
        retained_earnings: 0, // Will be calculated
        treasury_stock: formatCurrency(randomInt(0, 100000))
      }
    },
    companyId: companyId,
    createdAt: new Date(currentDate.getFullYear(), 0, 15), // January 15th of current year
    updatedAt: new Date(currentDate.getFullYear(), 1, 15) // February 15th of current year
  };
  
  // Calculate totals
  const currentAssets = Object.values(balanceSheet.data.assets.current_assets).reduce((sum, val) => sum + val, 0);
  const nonCurrentAssets = Object.values(balanceSheet.data.assets.non_current_assets).reduce((sum, val) => sum + val, 0);
  const totalAssets = currentAssets + nonCurrentAssets;
  
  const currentLiabilities = Object.values(balanceSheet.data.liabilities.current_liabilities).reduce((sum, val) => sum + val, 0);
  const nonCurrentLiabilities = Object.values(balanceSheet.data.liabilities.non_current_liabilities).reduce((sum, val) => sum + val, 0);
  const totalLiabilities = currentLiabilities + nonCurrentLiabilities;
  
  // Calculate retained earnings to balance the sheet
  const equityWithoutRetained = balanceSheet.data.equity.common_stock - balanceSheet.data.equity.treasury_stock;
  balanceSheet.data.equity.retained_earnings = formatCurrency(totalAssets - totalLiabilities - equityWithoutRetained);
  
  const totalEquity = Object.values(balanceSheet.data.equity).reduce((sum, val) => sum + val, 0);
  
  balanceSheet.data.assets.total_current_assets = formatCurrency(currentAssets);
  balanceSheet.data.assets.total_non_current_assets = formatCurrency(nonCurrentAssets);
  balanceSheet.data.assets.total_assets = formatCurrency(totalAssets);
  
  balanceSheet.data.liabilities.total_current_liabilities = formatCurrency(currentLiabilities);
  balanceSheet.data.liabilities.total_non_current_liabilities = formatCurrency(nonCurrentLiabilities);
  balanceSheet.data.liabilities.total_liabilities = formatCurrency(totalLiabilities);
  
  balanceSheet.data.equity.total_equity = formatCurrency(totalEquity);
  
  financialReports.push(balanceSheet);
  
  // Cash Flow Statement
  const cashFlowStatement = {
    _id: generateObjectId(),
    type: "cash_flow_statement",
    name: "Cash Flow Statement",
    period: "annual",
    year: currentDate.getFullYear(),
    status: "final",
    data: {
      operating_activities: {
        net_income: incomeStatement.data.netIncome,
        depreciation_amortization: formatCurrency(randomInt(20000, 50000)),
        changes_in_working_capital: {
          accounts_receivable: formatCurrency(randomInt(-30000, 30000)),
          inventory: formatCurrency(randomInt(-20000, 20000)),
          accounts_payable: formatCurrency(randomInt(-25000, 25000)),
          accrued_expenses: formatCurrency(randomInt(-15000, 15000))
        }
      },
      investing_activities: {
        capital_expenditures: formatCurrency(-1 * randomInt(50000, 200000)),
        investments: formatCurrency(-1 * randomInt(100000, 300000)),
        asset_sales: formatCurrency(randomInt(0, 50000))
      },
      financing_activities: {
        debt_repayment: formatCurrency(-1 * randomInt(50000, 150000)),
        dividends_paid: formatCurrency(-1 * randomInt(20000, 100000)),
        stock_issuance: formatCurrency(randomInt(0, 200000))
      }
    },
    companyId: companyId,
    createdAt: new Date(currentDate.getFullYear(), 0, 15), // January 15th of current year
    updatedAt: new Date(currentDate.getFullYear(), 1, 15) // February 15th of current year
  };
  
  // Calculate subtotals and totals
  const workingCapitalChanges = Object.values(cashFlowStatement.data.operating_activities.changes_in_working_capital).reduce((sum, val) => sum + val, 0);
  const operatingCashFlow = cashFlowStatement.data.operating_activities.net_income + 
                           cashFlowStatement.data.operating_activities.depreciation_amortization + 
                           workingCapitalChanges;
  
  const investingCashFlow = Object.values(cashFlowStatement.data.investing_activities).reduce((sum, val) => sum + val, 0);
  const financingCashFlow = Object.values(cashFlowStatement.data.financing_activities).reduce((sum, val) => sum + val, 0);
  
  cashFlowStatement.data.operating_activities.total_working_capital_changes = formatCurrency(workingCapitalChanges);
  cashFlowStatement.data.operating_activities.net_cash_from_operating = formatCurrency(operatingCashFlow);
  
  cashFlowStatement.data.investing_activities.net_cash_from_investing = formatCurrency(investingCashFlow);
  cashFlowStatement.data.financing_activities.net_cash_from_financing = formatCurrency(financingCashFlow);
  
  cashFlowStatement.data.net_increase_in_cash = formatCurrency(operatingCashFlow + investingCashFlow + financingCashFlow);
  cashFlowStatement.data.beginning_cash_balance = formatCurrency(randomInt(200000, 500000));
  cashFlowStatement.data.ending_cash_balance = formatCurrency(cashFlowStatement.data.beginning_cash_balance + cashFlowStatement.data.net_increase_in_cash);
  
  financialReports.push(cashFlowStatement);

  // Generate financial analytics
  const financialAnalytics = [];
  
  // Revenue by category
  const revenueByCategoryAnalytics = {
    _id: generateObjectId(),
    type: "revenue_by_category",
    period: "annual",
    year: currentDate.getFullYear(),
    data: {
      categories: Object.keys(incomeStatement.data.revenue).map(category => ({
        name: category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' '),
        value: incomeStatement.data.revenue[category],
        percentage: formatCurrency((incomeStatement.data.revenue[category] / totalRevenue) * 100)
      })),
      total: totalRevenue
    },
    companyId: companyId,
    createdAt: currentDate,
    updatedAt: currentDate
  };
  
  financialAnalytics.push(revenueByCategoryAnalytics);
  
  // Expenses by category
  const expensesByCategoryAnalytics = {
    _id: generateObjectId(),
    type: "expenses_by_category",
    period: "annual",
    year: currentDate.getFullYear(),
    data: {
      categories: Object.keys(incomeStatement.data.expenses).map(category => ({
        name: category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' '),
        value: incomeStatement.data.expenses[category],
        percentage: formatCurrency((incomeStatement.data.expenses[category] / totalExpenses) * 100)
      })),
      total: totalExpenses
    },
    companyId: companyId,
    createdAt: currentDate,
    updatedAt: currentDate
  };
  
  financialAnalytics.push(expensesByCategoryAnalytics);
  
  // Financial ratios
  const financialRatios = {
    _id: generateObjectId(),
    type: "financial_ratios",
    period: "annual",
    year: currentDate.getFullYear(),
    data: {
      profitability: {
        gross_margin: formatCurrency(((totalRevenue - incomeStatement.data.expenses.cost_of_goods_sold) / totalRevenue) * 100),
        operating_margin: formatCurrency((incomeStatement.data.netIncome / totalRevenue) * 100),
        return_on_assets: formatCurrency((incomeStatement.data.netIncome / totalAssets) * 100),
        return_on_equity: formatCurrency((incomeStatement.data.netIncome / totalEquity) * 100)
      },
      liquidity: {
        current_ratio: formatCurrency(currentAssets / currentLiabilities),
        quick_ratio: formatCurrency((currentAssets - balanceSheet.data.assets.current_assets.inventory) / currentLiabilities),
        cash_ratio: formatCurrency(balanceSheet.data.assets.current_assets.cash / currentLiabilities)
      },
      solvency: {
        debt_to_equity: formatCurrency(totalLiabilities / totalEquity),
        debt_to_assets: formatCurrency(totalLiabilities / totalAssets),
        interest_coverage: formatCurrency(randomInt(3, 10))
      },
      efficiency: {
        asset_turnover: formatCurrency(totalRevenue / totalAssets),
        inventory_turnover: formatCurrency(randomInt(4, 12)),
        days_sales_outstanding: formatCurrency(randomInt(30, 60))
      }
    },
    companyId: companyId,
    createdAt: currentDate,
    updatedAt: currentDate
  };
  
  financialAnalytics.push(financialRatios);
  
  // Monthly revenue trend
  const monthlyRevenueTrend = {
    _id: generateObjectId(),
    type: "monthly_revenue_trend",
    period: "annual",
    year: currentDate.getFullYear(),
    data: {
      months: []
    },
    companyId: companyId,
    createdAt: currentDate,
    updatedAt: currentDate
  };
  
  // Generate monthly data
  for (let month = 0; month < 12; month++) {
    const monthStart = new Date(currentDate.getFullYear(), month, 1);
    const monthEnd = new Date(currentDate.getFullYear(), month + 1, 0);
    
    // Only include months up to current month
    if (monthStart <= currentDate) {
      const monthlyTransactions = transactions.filter(t => 
        t.type === "income" && 
        t.date >= monthStart && 
        t.date <= monthEnd
      );
      
      const monthlyRevenue = monthlyTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      monthlyRevenueTrend.data.months.push({
        month: monthStart.toLocaleString('default', { month: 'long' }),
        revenue: formatCurrency(monthlyRevenue),
        growth: month > 0 ? 
          formatCurrency(((monthlyRevenue - monthlyRevenueTrend.data.months[month - 1].revenue) / monthlyRevenueTrend.data.months[month - 1].revenue) * 100) : 
          0
      });
    }
  }
  
  financialAnalytics.push(monthlyRevenueTrend);
  
  // Budget vs Actual
  const budgetVsActual = {
    _id: generateObjectId(),
    type: "budget_vs_actual",
    period: "annual",
    year: currentDate.getFullYear(),
    data: {
      categories: annualBudget.categories.map(category => ({
        name: category.name,
        budgeted: category.budgeted,
        actual: category.actual,
        variance: category.variance,
        percentUsed: category.percentUsed
      })),
      total: {
        budgeted: annualBudget.totalBudget,
        actual: annualBudget.totalActual,
        variance: annualBudget.varianceTotal,
        percentUsed: annualBudget.percentUsedTotal
      }
    },
    companyId: companyId,
    createdAt: currentDate,
    updatedAt: currentDate
  };
  
  financialAnalytics.push(budgetVsActual);

  // Combine all data
  const financeData = {
    Transaction: transactions,
    Invoice: invoices,
    Expense: expenses,
    Budget: budgets,
    FinancialReport: financialReports,
    FinancialAnalytics: financialAnalytics
  };

  return financeData;
}

// Generate the data
const financeData = generateFinanceData();

// Write to file
fs.writeFileSync('finance-data.json', JSON.stringify(financeData, null, 2));
console.log('Finance data generated and saved to finance-data.json');
