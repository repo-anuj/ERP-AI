import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getUserCompanyId } from '@/lib/auth';
import { addDays, addMonths, addWeeks, addYears, setDate } from 'date-fns';

// Validation schema for recurring transaction data
const recurringTransactionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  interval: z.number().int().positive().default(1),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Category is required'),
  categoryId: z.string().optional(),
  account: z.string().min(1, 'Account is required'),
  accountId: z.string().optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  monthOfYear: z.number().int().min(1).max(12).optional(),
  status: z.enum(['active', 'paused', 'completed']).default('active'),
});

/**
 * Calculate the next due date based on frequency and interval
 */
function calculateNextDueDate(
  startDate: Date,
  frequency: string,
  interval: number,
  dayOfMonth?: number,
  dayOfWeek?: number,
  monthOfYear?: number
): Date {
  const now = new Date();
  let nextDate = new Date(startDate);
  
  // If start date is in the future, use it as the next due date
  if (nextDate > now) {
    return nextDate;
  }
  
  // Calculate next due date based on frequency
  switch (frequency) {
    case 'daily':
      // Add days until we get a future date
      while (nextDate <= now) {
        nextDate = addDays(nextDate, interval);
      }
      break;
      
    case 'weekly':
      // Add weeks until we get a future date
      while (nextDate <= now) {
        nextDate = addWeeks(nextDate, interval);
      }
      
      // If dayOfWeek is specified, adjust to that day
      if (dayOfWeek !== undefined) {
        const currentDay = nextDate.getDay();
        const daysToAdd = (dayOfWeek - currentDay + 7) % 7;
        nextDate = addDays(nextDate, daysToAdd);
      }
      break;
      
    case 'monthly':
      // Add months until we get a future date
      while (nextDate <= now) {
        nextDate = addMonths(nextDate, interval);
      }
      
      // If dayOfMonth is specified, adjust to that day
      if (dayOfMonth !== undefined) {
        // Handle month end edge cases (e.g., 31st in a 30-day month)
        const maxDaysInMonth = new Date(
          nextDate.getFullYear(),
          nextDate.getMonth() + 1,
          0
        ).getDate();
        
        const actualDayOfMonth = Math.min(dayOfMonth, maxDaysInMonth);
        nextDate = setDate(nextDate, actualDayOfMonth);
      }
      break;
      
    case 'yearly':
      // Add years until we get a future date
      while (nextDate <= now) {
        nextDate = addYears(nextDate, interval);
      }
      
      // If monthOfYear and dayOfMonth are specified, adjust to that date
      if (monthOfYear !== undefined && dayOfMonth !== undefined) {
        nextDate.setMonth(monthOfYear - 1);
        
        // Handle month end edge cases
        const maxDaysInMonth = new Date(
          nextDate.getFullYear(),
          nextDate.getMonth() + 1,
          0
        ).getDate();
        
        const actualDayOfMonth = Math.min(dayOfMonth, maxDaysInMonth);
        nextDate = setDate(nextDate, actualDayOfMonth);
      }
      break;
  }
  
  return nextDate;
}

/**
 * GET: Fetch all recurring transactions for the company
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
    const id = searchParams.get('id');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    
    // If ID is provided, get a specific recurring transaction
    if (id) {
      const recurringTransaction = await prisma.recurringSchedule.findFirst({
        where: {
          id,
          companyId,
        },
      });
      
      if (!recurringTransaction) {
        return NextResponse.json(
          { error: 'Recurring transaction not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(recurringTransaction);
    }
    
    // Build the query filter
    const filter: any = { companyId };
    
    if (status) filter.status = status;
    if (type) filter.type = type;
    
    // Get all recurring transactions for this company
    const recurringTransactions = await prisma.recurringSchedule.findMany({
      where: filter,
      orderBy: {
        nextDueDate: 'asc',
      },
    });
    
    return NextResponse.json(recurringTransactions);
  } catch (error) {
    console.error('Error fetching recurring transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recurring transactions' },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a new recurring transaction
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
    const validationResult = recurringTransactionSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid recurring transaction data', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const transactionData = validationResult.data;
    
    // Look up or create the category
    let categoryId = transactionData.categoryId;
    
    if (!categoryId) {
      // Try to find existing category with this name
      const existingCategory = await prisma.budgetCategory.findFirst({
        where: {
          name: transactionData.category,
          companyId,
        },
      });
      
      if (existingCategory) {
        categoryId = existingCategory.id;
      } else {
        // Create a new category
        const newCategory = await prisma.budgetCategory.create({
          data: {
            name: transactionData.category,
            type: transactionData.type,
            company: {
              connect: {
                id: companyId,
              },
            },
          },
        });
        
        categoryId = newCategory.id;
      }
    }
    
    // Look up or create the account
    let accountId = transactionData.accountId;
    
    if (!accountId) {
      // Try to find existing account with this name
      const existingAccount = await prisma.financialAccount.findFirst({
        where: {
          name: transactionData.account,
          companyId,
        },
      });
      
      if (existingAccount) {
        accountId = existingAccount.id;
      } else {
        // Create a new account with default values
        const newAccount = await prisma.financialAccount.create({
          data: {
            name: transactionData.account,
            type: 'bank', // Default type
            currency: 'USD',
            company: {
              connect: {
                id: companyId,
              },
            },
          },
        });
        
        accountId = newAccount.id;
      }
    }
    
    // Calculate the next due date
    const startDate = new Date(transactionData.startDate);
    const nextDueDate = calculateNextDueDate(
      startDate,
      transactionData.frequency,
      transactionData.interval,
      transactionData.dayOfMonth,
      transactionData.dayOfWeek,
      transactionData.monthOfYear
    );
    
    // Create the recurring transaction
    const recurringTransaction = await prisma.recurringSchedule.create({
      data: {
        name: transactionData.name,
        description: transactionData.description,
        frequency: transactionData.frequency,
        interval: transactionData.interval,
        startDate,
        endDate: transactionData.endDate ? new Date(transactionData.endDate) : null,
        nextDueDate,
        dayOfMonth: transactionData.dayOfMonth,
        dayOfWeek: transactionData.dayOfWeek,
        monthOfYear: transactionData.monthOfYear,
        amount: transactionData.amount,
        type: transactionData.type,
        categoryId,
        accountId,
        status: transactionData.status,
        company: {
          connect: {
            id: companyId,
          },
        },
      },
    });
    
    return NextResponse.json(recurringTransaction, { status: 201 });
  } catch (error) {
    console.error('Error creating recurring transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create recurring transaction' },
      { status: 500 }
    );
  }
}

/**
 * PUT: Update an existing recurring transaction
 */
export async function PUT(request: NextRequest) {
  try {
    // Check if user is authenticated and get their company ID
    const companyId = await getUserCompanyId();
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get the recurring transaction ID from the query parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Recurring transaction ID is required' },
        { status: 400 }
      );
    }
    
    // Check if the recurring transaction exists and belongs to the user's company
    const existingTransaction = await prisma.recurringSchedule.findFirst({
      where: {
        id,
        companyId,
      },
    });
    
    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Recurring transaction not found' },
        { status: 404 }
      );
    }
    
    // Parse and validate the request body
    const body = await request.json();
    const validationResult = recurringTransactionSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid recurring transaction data', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const transactionData = validationResult.data;
    
    // Look up or create the category
    let categoryId = transactionData.categoryId;
    
    if (!categoryId) {
      // Try to find existing category with this name
      const existingCategory = await prisma.budgetCategory.findFirst({
        where: {
          name: transactionData.category,
          companyId,
        },
      });
      
      if (existingCategory) {
        categoryId = existingCategory.id;
      } else {
        // Create a new category
        const newCategory = await prisma.budgetCategory.create({
          data: {
            name: transactionData.category,
            type: transactionData.type,
            company: {
              connect: {
                id: companyId,
              },
            },
          },
        });
        
        categoryId = newCategory.id;
      }
    }
    
    // Look up or create the account
    let accountId = transactionData.accountId;
    
    if (!accountId) {
      // Try to find existing account with this name
      const existingAccount = await prisma.financialAccount.findFirst({
        where: {
          name: transactionData.account,
          companyId,
        },
      });
      
      if (existingAccount) {
        accountId = existingAccount.id;
      } else {
        // Create a new account with default values
        const newAccount = await prisma.financialAccount.create({
          data: {
            name: transactionData.account,
            type: 'bank', // Default type
            currency: 'USD',
            company: {
              connect: {
                id: companyId,
              },
            },
          },
        });
        
        accountId = newAccount.id;
      }
    }
    
    // Calculate the next due date if frequency or interval has changed
    const startDate = new Date(transactionData.startDate);
    let nextDueDate = existingTransaction.nextDueDate;
    
    if (
      transactionData.frequency !== existingTransaction.frequency ||
      transactionData.interval !== existingTransaction.interval ||
      transactionData.dayOfMonth !== existingTransaction.dayOfMonth ||
      transactionData.dayOfWeek !== existingTransaction.dayOfWeek ||
      transactionData.monthOfYear !== existingTransaction.monthOfYear ||
      startDate.getTime() !== existingTransaction.startDate.getTime()
    ) {
      nextDueDate = calculateNextDueDate(
        startDate,
        transactionData.frequency,
        transactionData.interval,
        transactionData.dayOfMonth,
        transactionData.dayOfWeek,
        transactionData.monthOfYear
      );
    }
    
    // Update the recurring transaction
    const recurringTransaction = await prisma.recurringSchedule.update({
      where: { id },
      data: {
        name: transactionData.name,
        description: transactionData.description,
        frequency: transactionData.frequency,
        interval: transactionData.interval,
        startDate,
        endDate: transactionData.endDate ? new Date(transactionData.endDate) : null,
        nextDueDate,
        dayOfMonth: transactionData.dayOfMonth,
        dayOfWeek: transactionData.dayOfWeek,
        monthOfYear: transactionData.monthOfYear,
        amount: transactionData.amount,
        type: transactionData.type,
        categoryId,
        accountId,
        status: transactionData.status,
      },
    });
    
    return NextResponse.json(recurringTransaction);
  } catch (error) {
    console.error('Error updating recurring transaction:', error);
    return NextResponse.json(
      { error: 'Failed to update recurring transaction' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Remove a recurring transaction
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check if user is authenticated and get their company ID
    const companyId = await getUserCompanyId();
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get the recurring transaction ID from the query parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Recurring transaction ID is required' },
        { status: 400 }
      );
    }
    
    // Check if the recurring transaction exists and belongs to the user's company
    const existingTransaction = await prisma.recurringSchedule.findFirst({
      where: {
        id,
        companyId,
      },
    });
    
    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Recurring transaction not found' },
        { status: 404 }
      );
    }
    
    // Delete the recurring transaction
    await prisma.recurringSchedule.delete({
      where: { id },
    });
    
    return NextResponse.json(
      { message: 'Recurring transaction deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting recurring transaction:', error);
    return NextResponse.json(
      { error: 'Failed to delete recurring transaction' },
      { status: 500 }
    );
  }
}
