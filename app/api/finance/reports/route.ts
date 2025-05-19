import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserCompanyId } from '@/lib/auth';
import { addDays, format, parseISO, startOfDay, endOfDay, isSameDay } from 'date-fns';

/**
 * POST: Generate financial reports
 *
 * Request body:
 * {
 *   reportType: 'cash-flow' | 'profit-loss' | 'balance-sheet' | 'expenses-by-category',
 *   startDate: string, // ISO date string
 *   endDate: string, // ISO date string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and get their company ID
    const companyId = await getUserCompanyId();

    if (!companyId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { reportType, startDate, endDate } = body;

    if (!reportType || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Report type, start date, and end date are required' },
        { status: 400 }
      );
    }

    // Parse dates
    const parsedStartDate = startOfDay(new Date(startDate));
    const parsedEndDate = endOfDay(new Date(endDate));

    // Generate the requested report
    let reportData;

    switch (reportType) {
      case 'cash-flow':
        reportData = await generateCashFlowReport(companyId, parsedStartDate, parsedEndDate);
        break;
      case 'profit-loss':
        reportData = await generateProfitLossReport(companyId, parsedStartDate, parsedEndDate);
        break;
      case 'balance-sheet':
        reportData = await generateBalanceSheetReport(companyId, parsedEndDate);
        break;
      case 'expenses-by-category':
        reportData = await generateExpensesByCategoryReport(companyId, parsedStartDate, parsedEndDate);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        );
    }

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

/**
 * Generate a cash flow report
 */
async function generateCashFlowReport(companyId: string, startDate: Date, endDate: Date) {
  // Get all transactions in the date range
  const transactions = await prisma.transaction.findMany({
    where: {
      companyId,
      date: {
        gte: startDate,
        lte: endDate,
      },
      status: 'completed',
    },
    orderBy: {
      date: 'asc',
    },
  });

  // Create a map of dates in the range
  const dateMap = new Map();
  let currentDate = startDate;

  while (currentDate <= endDate) {
    dateMap.set(format(currentDate, 'yyyy-MM-dd'), {
      date: format(currentDate, 'yyyy-MM-dd'),
      income: 0,
      expenses: 0,
      netCashFlow: 0,
    });
    currentDate = addDays(currentDate, 1);
  }

  // Calculate daily cash flow
  let totalIncome = 0;
  let totalExpenses = 0;

  transactions.forEach(transaction => {
    const dateKey = format(transaction.date, 'yyyy-MM-dd');
    const dayData = dateMap.get(dateKey);

    if (dayData) {
      if (transaction.type === 'income') {
        dayData.income += transaction.amount;
        totalIncome += transaction.amount;
      } else if (transaction.type === 'expense') {
        dayData.expenses += transaction.amount;
        totalExpenses += transaction.amount;
      }

      dayData.netCashFlow = dayData.income - dayData.expenses;
    }
  });

  // Convert map to array and calculate totals
  const dailyCashFlow = Array.from(dateMap.values());
  const netCashFlow = totalIncome - totalExpenses;

  // Calculate averages
  const dayCount = dailyCashFlow.length || 1; // Avoid division by zero
  const averageDailyIncome = totalIncome / dayCount;
  const averageDailyExpenses = totalExpenses / dayCount;
  const averageDailyNetCashFlow = netCashFlow / dayCount;

  return {
    dailyCashFlow,
    totalIncome,
    totalExpenses,
    netCashFlow,
    averageDailyIncome,
    averageDailyExpenses,
    averageDailyNetCashFlow,
  };
}

/**
 * Generate a profit and loss report
 */
async function generateProfitLossReport(companyId: string, startDate: Date, endDate: Date) {
  // Get all transactions in the date range
  const transactions = await prisma.transaction.findMany({
    where: {
      companyId,
      date: {
        gte: startDate,
        lte: endDate,
      },
      status: 'completed',
    },
    include: {
      category: true,
    },
  });

  // Group transactions by category and type
  const incomeCategories = new Map();
  const expenseCategories = new Map();
  let totalIncome = 0;
  let totalExpenses = 0;

  transactions.forEach(transaction => {
    const categoryName = transaction.category?.name || 'Uncategorized';
    const categoryId = transaction.category?.id || 'uncategorized';
    const categoryColor = transaction.category?.color;
    const categoryIcon = transaction.category?.icon;

    if (transaction.type === 'income') {
      const existingCategory = incomeCategories.get(categoryId) || {
        id: categoryId,
        name: categoryName,
        amount: 0,
        color: categoryColor,
        icon: categoryIcon,
      };

      existingCategory.amount += transaction.amount;
      incomeCategories.set(categoryId, existingCategory);
      totalIncome += transaction.amount;
    } else if (transaction.type === 'expense') {
      const existingCategory = expenseCategories.get(categoryId) || {
        id: categoryId,
        name: categoryName,
        amount: 0,
        color: categoryColor,
        icon: categoryIcon,
      };

      existingCategory.amount += transaction.amount;
      expenseCategories.set(categoryId, existingCategory);
      totalExpenses += transaction.amount;
    }
  });

  // Calculate percentages and convert maps to arrays
  const incomeArray = Array.from(incomeCategories.values()).map(category => ({
    ...category,
    percentage: totalIncome > 0 ? (category.amount / totalIncome) * 100 : 0,
  }));

  const expenseArray = Array.from(expenseCategories.values()).map(category => ({
    ...category,
    percentage: totalExpenses > 0 ? (category.amount / totalExpenses) * 100 : 0,
  }));

  // Sort arrays by amount (descending)
  incomeArray.sort((a, b) => b.amount - a.amount);
  expenseArray.sort((a, b) => b.amount - a.amount);

  // Calculate net profit/loss and profit margin
  const netProfitLoss = totalIncome - totalExpenses;
  const profitMargin = totalIncome > 0 ? (netProfitLoss / totalIncome) * 100 : 0;

  return {
    income: {
      categories: incomeArray,
      total: totalIncome,
    },
    expenses: {
      categories: expenseArray,
      total: totalExpenses,
    },
    netProfitLoss,
    profitMargin,
  };
}

/**
 * Generate a balance sheet report
 */
async function generateBalanceSheetReport(companyId: string, asOfDate: Date) {
  // Get all accounts
  const accounts = await prisma.financialAccount.findMany({
    where: {
      companyId,
    },
  });

  // Define account data type
  interface AccountData {
    id: string;
    name: string;
    type: string;
    balance: number;
    currency: string;
    isAsset: boolean;
  }

  // Categorize accounts and calculate totals
  const assetAccounts: AccountData[] = [];
  const liabilityAccounts: AccountData[] = [];
  let totalAssets = 0;
  let totalLiabilities = 0;

  accounts.forEach(account => {
    const isAsset = account.type !== 'credit'; // Simplification: treat credit accounts as liabilities
    const accountData = {
      id: account.id,
      name: account.name,
      type: account.type,
      balance: account.balance,
      currency: account.currency,
      isAsset,
    };

    if (isAsset) {
      assetAccounts.push(accountData);
      totalAssets += account.balance;
    } else {
      liabilityAccounts.push(accountData);
      totalLiabilities += account.balance;
    }
  });

  // Calculate net worth
  const netWorth = totalAssets - totalLiabilities;

  // Calculate asset and liability allocations
  const assetAllocation = assetAccounts.map(account => ({
    name: account.name,
    value: account.balance,
    percentage: totalAssets > 0 ? (account.balance / totalAssets) * 100 : 0,
    color: getColorForAccountType(account.type),
  }));

  const liabilityAllocation = liabilityAccounts.map(account => ({
    name: account.name,
    value: account.balance,
    percentage: totalLiabilities > 0 ? (account.balance / totalLiabilities) * 100 : 0,
    color: '#ef4444', // Red for liabilities
  }));

  // Sort allocations by value (descending)
  assetAllocation.sort((a, b) => b.value - a.value);
  liabilityAllocation.sort((a, b) => b.value - a.value);

  return {
    accounts: [...assetAccounts, ...liabilityAccounts],
    totalAssets,
    totalLiabilities,
    netWorth,
    assetAllocation,
    liabilityAllocation,
  };
}

/**
 * Generate an expenses by category report
 */
async function generateExpensesByCategoryReport(companyId: string, startDate: Date, endDate: Date) {
  // Get all expense transactions in the date range
  const transactions = await prisma.transaction.findMany({
    where: {
      companyId,
      type: 'expense',
      date: {
        gte: startDate,
        lte: endDate,
      },
      status: 'completed',
    },
    include: {
      category: true,
    },
  });

  // Group transactions by category
  const categories = new Map();
  let totalExpenses = 0;

  transactions.forEach(transaction => {
    const categoryName = transaction.category?.name || 'Uncategorized';
    const categoryId = transaction.category?.id || 'uncategorized';
    const categoryColor = transaction.category?.color;
    const categoryIcon = transaction.category?.icon;

    const existingCategory = categories.get(categoryId) || {
      id: categoryId,
      name: categoryName,
      amount: 0,
      transactions: 0,
      color: categoryColor,
      icon: categoryIcon,
    };

    existingCategory.amount += transaction.amount;
    existingCategory.transactions += 1;
    categories.set(categoryId, existingCategory);
    totalExpenses += transaction.amount;
  });

  // Calculate percentages and convert map to array
  const categoryArray = Array.from(categories.values()).map(category => ({
    ...category,
    percentage: totalExpenses > 0 ? (category.amount / totalExpenses) * 100 : 0,
  }));

  // Sort array by amount (descending)
  categoryArray.sort((a, b) => b.amount - a.amount);

  // Find largest and smallest categories
  const largestCategory = categoryArray.length > 0 ? categoryArray[0] : {
    name: 'None',
    amount: 0,
    percentage: 0,
  };

  const smallestCategory = categoryArray.length > 0 ? categoryArray[categoryArray.length - 1] : {
    name: 'None',
    amount: 0,
    percentage: 0,
  };

  // Calculate average spend per category
  const averageCategorySpend = categoryArray.length > 0 ? totalExpenses / categoryArray.length : 0;

  return {
    categories: categoryArray,
    totalExpenses,
    largestCategory,
    smallestCategory,
    averageCategorySpend,
  };
}

/**
 * Helper function to get a color for an account type
 */
function getColorForAccountType(type: string): string {
  switch (type) {
    case 'bank':
      return '#3b82f6'; // Blue
    case 'cash':
      return '#10b981'; // Green
    case 'investment':
      return '#8b5cf6'; // Purple
    case 'credit':
      return '#ef4444'; // Red
    default:
      return '#6b7280'; // Gray
  }
}
