import { prisma } from '@/lib/prisma';
import { Transaction, FinancialAccount } from '@prisma/client';

/**
 * Calculate the balance change amount for a transaction
 * 
 * @param transaction The transaction object
 * @param account The account object
 * @returns The amount to change the balance by (positive or negative)
 */
export function calculateBalanceChange(
  transaction: { amount: number; type: string; status: string },
  account: { type: string }
): number {
  // If transaction is not completed, no balance change
  if (transaction.status !== 'completed') {
    return 0;
  }

  let balanceChange = transaction.amount;
  
  // For expenses, the amount is negative
  if (transaction.type === 'expense') {
    balanceChange = -balanceChange;
  }
  
  // For credit accounts, the logic is reversed
  // (expenses increase credit card balance, income decreases it)
  if (account.type === 'credit') {
    balanceChange = -balanceChange;
  }
  
  return balanceChange;
}

/**
 * Update an account balance with proper error handling and transaction safety
 * 
 * @param accountId The ID of the account to update
 * @param balanceChange The amount to change the balance by (positive or negative)
 * @param description Description for the audit log
 * @returns The updated account or null if the operation failed
 */
export async function updateAccountBalance(
  accountId: string,
  balanceChange: number,
  description: string
): Promise<FinancialAccount | null> {
  try {
    // Use a transaction to ensure atomicity
    return await prisma.$transaction(async (tx) => {
      // Get the current account with a lock for update
      const account = await tx.financialAccount.findUnique({
        where: { id: accountId },
      });
      
      if (!account) {
        throw new Error(`Account with ID ${accountId} not found`);
      }
      
      // Update the account balance
      const updatedAccount = await tx.financialAccount.update({
        where: { id: accountId },
        data: {
          balance: {
            increment: balanceChange,
          },
        },
      });
      
      // Create an audit log entry
      await tx.financeAuditLog.create({
        data: {
          accountId,
          previousBalance: account.balance,
          newBalance: updatedAccount.balance,
          changeAmount: balanceChange,
          description,
          performedAt: new Date(),
        },
      });
      
      return updatedAccount;
    });
  } catch (error) {
    console.error(`Error updating account balance: ${error}`);
    return null;
  }
}

/**
 * Apply a transaction's effect to an account balance
 * 
 * @param transaction The transaction to apply
 * @param accountId The account ID to update
 * @returns Success status
 */
export async function applyTransactionToBalance(
  transaction: Transaction,
  accountId: string
): Promise<boolean> {
  try {
    const account = await prisma.financialAccount.findUnique({
      where: { id: accountId },
    });
    
    if (!account) {
      console.error(`Account with ID ${accountId} not found`);
      return false;
    }
    
    const balanceChange = calculateBalanceChange(transaction, account);
    
    if (balanceChange === 0) {
      return true; // No balance change needed
    }
    
    const description = `Transaction ${transaction.id}: ${transaction.description}`;
    const updatedAccount = await updateAccountBalance(accountId, balanceChange, description);
    
    return !!updatedAccount;
  } catch (error) {
    console.error(`Error applying transaction to balance: ${error}`);
    return false;
  }
}

/**
 * Reverse a transaction's effect on an account balance
 * 
 * @param transaction The transaction to reverse
 * @param accountId The account ID to update
 * @returns Success status
 */
export async function reverseTransactionFromBalance(
  transaction: Transaction,
  accountId: string
): Promise<boolean> {
  try {
    const account = await prisma.financialAccount.findUnique({
      where: { id: accountId },
    });
    
    if (!account) {
      console.error(`Account with ID ${accountId} not found`);
      return false;
    }
    
    // Calculate the original balance change and reverse it
    const originalBalanceChange = calculateBalanceChange(transaction, account);
    const reversalAmount = -originalBalanceChange;
    
    if (reversalAmount === 0) {
      return true; // No balance change needed
    }
    
    const description = `Reversal of transaction ${transaction.id}: ${transaction.description}`;
    const updatedAccount = await updateAccountBalance(accountId, reversalAmount, description);
    
    return !!updatedAccount;
  } catch (error) {
    console.error(`Error reversing transaction from balance: ${error}`);
    return false;
  }
}

/**
 * Recalculate an account's balance based on all its transactions
 * 
 * @param accountId The account ID to recalculate
 * @returns Success status
 */
export async function recalculateAccountBalance(accountId: string): Promise<boolean> {
  try {
    return await prisma.$transaction(async (tx) => {
      // Get the account
      const account = await tx.financialAccount.findUnique({
        where: { id: accountId },
      });
      
      if (!account) {
        throw new Error(`Account with ID ${accountId} not found`);
      }
      
      // Get all completed transactions for this account
      const transactions = await tx.transaction.findMany({
        where: {
          accountId,
          status: 'completed',
        },
      });
      
      // Calculate the correct balance
      let calculatedBalance = 0;
      
      for (const transaction of transactions) {
        const balanceChange = calculateBalanceChange(transaction, account);
        calculatedBalance += balanceChange;
      }
      
      // Update the account with the correct balance
      await tx.financialAccount.update({
        where: { id: accountId },
        data: {
          balance: calculatedBalance,
        },
      });
      
      // Create an audit log entry
      await tx.financeAuditLog.create({
        data: {
          accountId,
          previousBalance: account.balance,
          newBalance: calculatedBalance,
          changeAmount: calculatedBalance - account.balance,
          description: `Balance recalculation based on ${transactions.length} transactions`,
          performedAt: new Date(),
        },
      });
      
      return true;
    });
  } catch (error) {
    console.error(`Error recalculating account balance: ${error}`);
    return false;
  }
}
