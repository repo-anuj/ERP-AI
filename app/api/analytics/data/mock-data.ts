// Mock data for analytics API

export const generateMockAnalyticsData = () => {
  return {
    inventory: {
      items: generateMockInventoryItems(),
      metrics: {
        totalItems: 532,
        totalValue: 125750.50,
        lowStock: 15,
        stockHealth: 92.5,
        turnoverRate: 3.2
      },
      categoryData: [
        { name: 'Electronics', value: 45000, quantity: 120 },
        { name: 'Furniture', value: 32000, quantity: 85 },
        { name: 'Clothing', value: 18500, quantity: 210 },
        { name: 'Books', value: 8500, quantity: 95 },
        { name: 'Office Supplies', value: 12750, quantity: 22 }
      ],
      itemMovement: generateMockItemMovement(),
      totalCount: 532
    },
    sales: {
      transactions: generateMockSalesTransactions(),
      metrics: {
        totalSales: 187,
        totalRevenue: 42850.75,
        averageSaleValue: 229.15,
        salesGrowth: 12.5,
        customerCount: 142
      },
      salesTimeSeries: generateMockSalesTimeSeries(),
      customerData: [
        { name: 'New Customers', value: 58 },
        { name: 'Returning Customers', value: 84 }
      ],
      topProducts: generateMockTopProducts(),
      totalCount: 187
    },
    finance: {
      transactions: generateMockFinanceTransactions(),
      metrics: {
        totalIncome: 52850.75,
        totalExpenses: 38250.25,
        netCashflow: 14600.50,
        profitMargin: 27.6,
        budgetVariance: -5.2
      },
      financeTimeSeries: generateMockFinanceTimeSeries(),
      expenseCategories: [
        { name: 'Salaries', value: 18500 },
        { name: 'Rent', value: 5500 },
        { name: 'Utilities', value: 2250 },
        { name: 'Marketing', value: 4500 },
        { name: 'Inventory', value: 7500 }
      ],
      totalCount: 124
    },
    employees: {
      employees: generateMockEmployees(),
      metrics: {
        totalEmployees: 28,
        departmentCount: 5,
        averageSalary: 52500,
        productivity: 87.5
      },
      departmentData: [
        { name: 'Sales', count: 8 },
        { name: 'Marketing', count: 5 },
        { name: 'Finance', count: 4 },
        { name: 'IT', count: 6 },
        { name: 'Operations', count: 5 }
      ],
      totalCount: 28
    },
    projects: {
      projects: generateMockProjects(),
      metrics: {
        totalProjects: 12,
        activeProjects: 7,
        completedProjects: 5,
        projectCompletion: 68.5
      },
      statusData: [
        { name: 'Not Started', count: 2 },
        { name: 'In Progress', count: 5 },
        { name: 'Completed', count: 5 }
      ],
      totalCount: 12
    },
    timestamp: new Date().toISOString()
  };
};

// Helper functions to generate mock data
function generateMockInventoryItems() {
  const categories = ['Electronics', 'Furniture', 'Clothing', 'Books', 'Office Supplies'];
  const items = [];
  
  for (let i = 0; i < 20; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const quantity = Math.floor(Math.random() * 100) + 5;
    const price = Math.floor(Math.random() * 500) + 10;
    
    items.push({
      id: `item-${i + 1}`,
      name: `Product ${i + 1}`,
      category,
      quantity,
      price,
      value: quantity * price,
      lowStockThreshold: 10,
      isLowStock: quantity < 10,
      lastRestocked: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  
  return items;
}

function generateMockItemMovement() {
  const movements = [];
  
  for (let i = 0; i < 10; i++) {
    movements.push({
      id: `movement-${i + 1}`,
      itemId: `item-${Math.floor(Math.random() * 20) + 1}`,
      itemName: `Product ${Math.floor(Math.random() * 20) + 1}`,
      quantity: Math.floor(Math.random() * 20) + 1,
      type: Math.random() > 0.5 ? 'in' : 'out',
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      turnoverRate: Math.random() * 5 + 0.5
    });
  }
  
  return movements;
}

function generateMockSalesTransactions() {
  const transactions = [];
  
  for (let i = 0; i < 20; i++) {
    const itemCount = Math.floor(Math.random() * 5) + 1;
    const items = [];
    let total = 0;
    
    for (let j = 0; j < itemCount; j++) {
      const price = Math.floor(Math.random() * 200) + 10;
      const quantity = Math.floor(Math.random() * 3) + 1;
      total += price * quantity;
      
      items.push({
        id: `item-${Math.floor(Math.random() * 20) + 1}`,
        name: `Product ${Math.floor(Math.random() * 20) + 1}`,
        price,
        quantity
      });
    }
    
    transactions.push({
      id: `sale-${i + 1}`,
      customer: {
        id: `customer-${Math.floor(Math.random() * 50) + 1}`,
        name: `Customer ${Math.floor(Math.random() * 50) + 1}`
      },
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      items,
      amount: total,
      paymentMethod: Math.random() > 0.7 ? 'Credit Card' : Math.random() > 0.5 ? 'Cash' : 'Bank Transfer'
    });
  }
  
  return transactions;
}

function generateMockSalesTimeSeries() {
  const series = [];
  const now = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - (29 - i));
    
    series.push({
      date: date.toISOString().split('T')[0],
      sales: Math.floor(Math.random() * 20) + 1,
      revenue: Math.floor(Math.random() * 5000) + 500
    });
  }
  
  return series;
}

function generateMockTopProducts() {
  const products = [];
  
  for (let i = 0; i < 10; i++) {
    products.push({
      id: `item-${i + 1}`,
      name: `Product ${i + 1}`,
      quantity: Math.floor(Math.random() * 50) + 10,
      revenue: Math.floor(Math.random() * 10000) + 1000
    });
  }
  
  return products.sort((a, b) => b.revenue - a.revenue);
}

function generateMockFinanceTransactions() {
  const transactions = [];
  const categories = ['Salaries', 'Rent', 'Utilities', 'Marketing', 'Inventory', 'Sales', 'Services'];
  
  for (let i = 0; i < 20; i++) {
    const isIncome = Math.random() > 0.4;
    const category = categories[Math.floor(Math.random() * categories.length)];
    const amount = Math.floor(Math.random() * 2000) + 100;
    
    transactions.push({
      id: `transaction-${i + 1}`,
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      description: `${isIncome ? 'Income' : 'Expense'} - ${category}`,
      category,
      amount,
      type: isIncome ? 'income' : 'expense'
    });
  }
  
  return transactions;
}

function generateMockFinanceTimeSeries() {
  const series = [];
  const now = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - (29 - i));
    
    const income = Math.floor(Math.random() * 3000) + 1000;
    const expenses = Math.floor(Math.random() * 2000) + 500;
    
    series.push({
      date: date.toISOString().split('T')[0],
      income,
      expenses,
      profit: income - expenses
    });
  }
  
  return series;
}

function generateMockEmployees() {
  const departments = ['Sales', 'Marketing', 'Finance', 'IT', 'Operations'];
  const employees = [];
  
  for (let i = 0; i < 10; i++) {
    const department = departments[Math.floor(Math.random() * departments.length)];
    const salary = Math.floor(Math.random() * 40000) + 30000;
    
    employees.push({
      id: `employee-${i + 1}`,
      name: `Employee ${i + 1}`,
      email: `employee${i + 1}@example.com`,
      department,
      position: `${department} Specialist`,
      salary,
      hireDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  
  return employees;
}

function generateMockProjects() {
  const statuses = ['Not Started', 'In Progress', 'Completed'];
  const projects = [];
  
  for (let i = 0; i < 10; i++) {
    const statusIndex = Math.floor(Math.random() * 3);
    const startDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);
    let endDate = null;
    
    if (statusIndex === 2) { // Completed
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 30) + 15);
    } else if (statusIndex === 1) { // In Progress
      endDate = new Date(Date.now() + Math.floor(Math.random() * 30) + 5 * 24 * 60 * 60 * 1000);
    } else { // Not Started
      endDate = new Date(Date.now() + Math.floor(Math.random() * 60) + 15 * 24 * 60 * 60 * 1000);
    }
    
    projects.push({
      id: `project-${i + 1}`,
      name: `Project ${i + 1}`,
      description: `Description for Project ${i + 1}`,
      status: statuses[statusIndex],
      startDate: startDate.toISOString(),
      endDate: endDate ? endDate.toISOString() : null,
      budget: Math.floor(Math.random() * 50000) + 10000,
      manager: `Employee ${Math.floor(Math.random() * 10) + 1}`
    });
  }
  
  return projects;
}
