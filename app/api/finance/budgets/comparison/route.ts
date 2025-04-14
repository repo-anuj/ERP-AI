import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserCompanyId } from '@/lib/auth';

/**
 * GET: Get budget vs actual comparison data
 * 
 * Query parameters:
 * - budgetId: Get comparison for a specific budget
 * - period: The period to compare (month, quarter, year)
 */
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and get their company ID
    const companyId = await getUserCompanyId();
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const budgetId = searchParams.get('budgetId');
    const period = searchParams.get('period') || 'month';
    
    if (!budgetId) {
      return NextResponse.json(
        { error: 'Budget ID is required' },
        { status: 400 }
      );
    }
    
    // Check if the budget exists and belongs to the company
    const budget = await prisma.budget.findFirst({
      where: {
        id: budgetId,
        companyId,
      },
      include: {
        items: {
          include: {
            category: true,
          },
        },
      },
    });
    
    if (!budget) {
      return NextResponse.json(
        { error: 'Budget not found or you do not have permission to access it' },
        { status: 404 }
      );
    }
    
    // Get the date range for the comparison
    const startDate = new Date(budget.startDate);
    const endDate = new Date(budget.endDate);
    
    // Get all transactions within the budget period
    const transactions = await prisma.transaction.findMany({
      where: {
        companyId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        type: 'expense', // Only consider expenses for budget comparison
      },
      include: {
        category: true,
      },
    });
    
    // Calculate actual spending by category
    const categorySpending = new Map();
    
    transactions.forEach(transaction => {
      const categoryId = transaction.categoryId || 'uncategorized';
      const categoryName = transaction.category?.name || 'Uncategorized';
      
      if (!categorySpending.has(categoryId)) {
        categorySpending.set(categoryId, {
          id: categoryId,
          name: categoryName,
          actual: 0,
          budgeted: 0,
          variance: 0,
          percentUsed: 0,
        });
      }
      
      const category = categorySpending.get(categoryId);
      category.actual += transaction.amount;
    });
    
    // Add budget amounts to categories
    budget.items.forEach(item => {
      const categoryId = item.categoryId || 'uncategorized';
      const categoryName = item.category?.name || item.name;
      
      if (!categorySpending.has(categoryId)) {
        categorySpending.set(categoryId, {
          id: categoryId,
          name: categoryName,
          actual: 0,
          budgeted: item.amount,
          variance: -item.amount,
          percentUsed: 0,
        });
      } else {
        const category = categorySpending.get(categoryId);
        category.budgeted += item.amount;
        category.variance = category.actual - category.budgeted;
        category.percentUsed = category.budgeted > 0 ? (category.actual / category.budgeted) * 100 : 0;
      }
    });
    
    // Calculate totals
    const totalBudgeted = budget.totalBudget;
    const totalActual = Array.from(categorySpending.values()).reduce((sum, category) => sum + category.actual, 0);
    const totalVariance = totalActual - totalBudgeted;
    const totalPercentUsed = totalBudgeted > 0 ? (totalActual / totalBudgeted) * 100 : 0;
    
    // Convert map to array and sort by variance (highest overspending first)
    const categories = Array.from(categorySpending.values());
    categories.sort((a, b) => b.variance - a.variance);
    
    // Prepare the response
    const response = {
      budget: {
        id: budget.id,
        name: budget.name,
        type: budget.type,
        startDate: budget.startDate,
        endDate: budget.endDate,
        status: budget.status,
      },
      summary: {
        totalBudgeted,
        totalActual,
        totalVariance,
        totalPercentUsed,
        status: totalPercentUsed >= 100 ? 'over-budget' : 
                totalPercentUsed >= 90 ? 'warning' : 'good',
      },
      categories,
      period,
    };
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error generating budget comparison:', error);
    return NextResponse.json(
      { error: 'Failed to generate budget comparison' },
      { status: 500 }
    );
  }
}
