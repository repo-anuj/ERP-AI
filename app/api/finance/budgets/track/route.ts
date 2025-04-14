import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getUserCompanyId } from '@/lib/auth';

// Validation schema for tracking a transaction against a budget
const trackTransactionSchema = z.object({
  transactionId: z.string().min(1, "Transaction ID is required"),
  budgetItemId: z.string().min(1, "Budget item ID is required"),
  amount: z.number().positive("Amount must be positive"),
});

/**
 * POST: Track a transaction against a budget item
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
    
    // Parse and validate the request body
    const body = await request.json();
    const validationResult = trackTransactionSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid tracking data', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { transactionId, budgetItemId, amount } = validationResult.data;
    
    // Check if the transaction exists and belongs to the company
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        companyId,
      },
    });
    
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found or you do not have permission to access it' },
        { status: 404 }
      );
    }
    
    // Check if the budget item exists and belongs to the company
    const budgetItem = await prisma.budgetItem.findFirst({
      where: {
        id: budgetItemId,
        budget: {
          companyId,
        },
      },
      include: {
        budget: true,
      },
    });
    
    if (!budgetItem) {
      return NextResponse.json(
        { error: 'Budget item not found or you do not have permission to access it' },
        { status: 404 }
      );
    }
    
    // Only expense transactions can be tracked against a budget
    if (transaction.type !== 'expense') {
      return NextResponse.json(
        { error: 'Only expense transactions can be tracked against a budget' },
        { status: 400 }
      );
    }
    
    // Update the budget item's spent amount
    const updatedBudgetItem = await prisma.budgetItem.update({
      where: {
        id: budgetItemId,
      },
      data: {
        spent: {
          increment: amount,
        },
      },
    });
    
    // Update the budget's total spent amount
    await prisma.budget.update({
      where: {
        id: budgetItem.budgetId,
      },
      data: {
        totalSpent: {
          increment: amount,
        },
      },
    });
    
    // Update the transaction to mark it as tracked against this budget item
    await prisma.transaction.update({
      where: {
        id: transactionId,
      },
      data: {
        tags: {
          push: `budget:${budgetItem.budgetId}`,
        },
      },
    });
    
    return NextResponse.json({
      success: true,
      budgetItem: updatedBudgetItem,
    });
  } catch (error: any) {
    console.error('Error tracking transaction against budget:', error);
    return NextResponse.json(
      { error: 'Failed to track transaction against budget' },
      { status: 500 }
    );
  }
}

/**
 * GET: Get budget spending statistics
 * 
 * Query parameters:
 * - budgetId: Get statistics for a specific budget
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
    
    // Calculate statistics
    const totalBudget = budget.totalBudget;
    const totalSpent = budget.totalSpent;
    const remainingBudget = totalBudget - totalSpent;
    const spentPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    
    // Calculate item-level statistics
    const items = budget.items.map(item => {
      const itemSpentPercentage = item.amount > 0 ? (item.spent / item.amount) * 100 : 0;
      const itemRemainingBudget = item.amount - item.spent;
      
      return {
        id: item.id,
        name: item.name,
        category: item.category,
        amount: item.amount,
        spent: item.spent,
        remaining: itemRemainingBudget,
        spentPercentage: itemSpentPercentage,
        status: itemSpentPercentage >= 100 ? 'over-budget' : 
                itemSpentPercentage >= 90 ? 'warning' : 'good',
      };
    });
    
    // Sort items by spent percentage (descending)
    items.sort((a, b) => b.spentPercentage - a.spentPercentage);
    
    return NextResponse.json({
      id: budget.id,
      name: budget.name,
      type: budget.type,
      startDate: budget.startDate,
      endDate: budget.endDate,
      status: budget.status,
      totalBudget,
      totalSpent,
      remainingBudget,
      spentPercentage,
      budgetStatus: spentPercentage >= 100 ? 'over-budget' : 
                    spentPercentage >= 90 ? 'warning' : 'good',
      items,
    });
  } catch (error: any) {
    console.error('Error getting budget statistics:', error);
    return NextResponse.json(
      { error: 'Failed to get budget statistics' },
      { status: 500 }
    );
  }
}
