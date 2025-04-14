import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserCompanyId } from '@/lib/auth';
import { addDays, addMonths, addWeeks, addYears, setDate } from 'date-fns';
import { applyTransactionToBalance } from '@/lib/finance-utils';

/**
 * Calculate the next due date based on frequency and interval
 */
function calculateNextDueDate(
  currentDueDate: Date,
  frequency: string,
  interval: number,
  dayOfMonth?: number | null,
  dayOfWeek?: number | null,
  monthOfYear?: number | null
): Date {
  let nextDate = new Date(currentDueDate);
  
  // Calculate next due date based on frequency
  switch (frequency) {
    case 'daily':
      nextDate = addDays(nextDate, interval);
      break;
      
    case 'weekly':
      nextDate = addWeeks(nextDate, interval);
      
      // If dayOfWeek is specified, adjust to that day
      if (dayOfWeek !== undefined && dayOfWeek !== null) {
        const currentDay = nextDate.getDay();
        const daysToAdd = (dayOfWeek - currentDay + 7) % 7;
        nextDate = addDays(nextDate, daysToAdd);
      }
      break;
      
    case 'monthly':
      nextDate = addMonths(nextDate, interval);
      
      // If dayOfMonth is specified, adjust to that day
      if (dayOfMonth !== undefined && dayOfMonth !== null) {
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
      nextDate = addYears(nextDate, interval);
      
      // If monthOfYear and dayOfMonth are specified, adjust to that date
      if (monthOfYear !== undefined && monthOfYear !== null && 
          dayOfMonth !== undefined && dayOfMonth !== null) {
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
 * POST: Process due recurring transactions
 * 
 * This endpoint can be called manually or by a scheduled job
 * to process recurring transactions that are due.
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
    
    // Get the current date
    const now = new Date();
    
    // Find all active recurring transactions that are due
    const dueTransactions = await prisma.recurringSchedule.findMany({
      where: {
        companyId,
        status: 'active',
        nextDueDate: {
          lte: now,
        },
      },
    });
    
    console.log(`Found ${dueTransactions.length} due recurring transactions`);
    
    const results = [];
    
    // Process each due transaction
    for (const recurringTx of dueTransactions) {
      try {
        // Create a new transaction based on the recurring schedule
        const transaction = await prisma.transaction.create({
          data: {
            date: recurringTx.nextDueDate,
            description: `${recurringTx.name}${recurringTx.description ? ` - ${recurringTx.description}` : ''}`,
            amount: recurringTx.amount,
            type: recurringTx.type,
            recurring: true,
            recurringScheduleId: recurringTx.id,
            status: 'completed',
            company: {
              connect: {
                id: companyId,
              },
            },
            ...(recurringTx.categoryId && {
              category: {
                connect: {
                  id: recurringTx.categoryId,
                },
              },
            }),
            ...(recurringTx.accountId && {
              account: {
                connect: {
                  id: recurringTx.accountId,
                },
              },
            }),
          },
        });
        
        // Update account balance
        if (recurringTx.accountId) {
          await applyTransactionToBalance(transaction, recurringTx.accountId);
        }
        
        // Calculate the next due date
        const nextDueDate = calculateNextDueDate(
          recurringTx.nextDueDate,
          recurringTx.frequency,
          recurringTx.interval,
          recurringTx.dayOfMonth,
          recurringTx.dayOfWeek,
          recurringTx.monthOfYear
        );
        
        // Check if we've reached the end date
        let newStatus = recurringTx.status;
        if (recurringTx.endDate && nextDueDate > recurringTx.endDate) {
          newStatus = 'completed';
        }
        
        // Update the recurring transaction with the new next due date and last processed date
        await prisma.recurringSchedule.update({
          where: { id: recurringTx.id },
          data: {
            nextDueDate,
            lastProcessedDate: now,
            status: newStatus,
          },
        });
        
        results.push({
          id: recurringTx.id,
          name: recurringTx.name,
          transactionId: transaction.id,
          success: true,
          nextDueDate,
          status: newStatus,
        });
      } catch (error) {
        console.error(`Error processing recurring transaction ${recurringTx.id}:`, error);
        
        results.push({
          id: recurringTx.id,
          name: recurringTx.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    return NextResponse.json({
      processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    });
  } catch (error) {
    console.error('Error processing recurring transactions:', error);
    return NextResponse.json(
      { error: 'Failed to process recurring transactions' },
      { status: 500 }
    );
  }
}
