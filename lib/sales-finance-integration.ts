import { prisma } from '@/lib/prisma';
import { Sale, SaleItem } from '@prisma/client';
import { applyTransactionToBalance } from '@/lib/finance-utils';
import { createNotification } from '@/lib/notification-service';

/**
 * Create a financial transaction from a sale
 *
 * @param sale The sale object with customer and items
 * @returns The created transaction or null if failed
 */
export async function createTransactionFromSale(
  sale: Sale & {
    customer: { name: string },
    items: SaleItem[]
  }
) {
  try {
    // Find the default income category for sales
    const salesCategory = await prisma.budgetCategory.findFirst({
      where: {
        companyId: sale.companyId,
        type: 'income',
        name: { contains: 'Sales', mode: 'insensitive' }
      }
    });

    // Find the default account (use the first one if no default is set)
    const defaultAccount = await prisma.financialAccount.findFirst({
      where: {
        companyId: sale.companyId,
        type: { in: ['bank', 'cash'] }
      }
    });

    if (!defaultAccount) {
      console.error('No financial account found for company', sale.companyId);
      return null;
    }

    // Create the transaction
    const transaction = await prisma.transaction.create({
      data: {
        date: sale.date,
        description: `Sale to ${sale.customer.name} - Invoice #${sale.invoiceNumber || 'N/A'}`,
        amount: sale.total,
        type: 'income',
        reference: sale.invoiceNumber || undefined,
        status: sale.status === 'completed' ? 'completed' : 'pending',
        notes: `Automatically generated from sale. Items: ${sale.items.map(item => item.product).join(', ')}`,
        company: {
          connect: {
            id: sale.companyId,
          },
        },
        ...(salesCategory && {
          category: {
            connect: {
              id: salesCategory.id,
            },
          },
        }),
        account: {
          connect: {
            id: defaultAccount.id,
          },
        },
        // Store the original sale ID for reference
        relatedTo: sale.id,
      },
    });

    // If the transaction is completed, update the account balance
    if (transaction.status === 'completed') {
      await applyTransactionToBalance(transaction, defaultAccount.id);
    }

    // Create a notification about the transaction
    await createNotification({
      title: 'New Sales Transaction Created',
      message: `A transaction of ${sale.total} has been created from sale #${sale.invoiceNumber || 'N/A'}`,
      type: 'info',
      category: 'finance',
      recipientId: sale.employeeId || undefined,
      recipientType: 'employee',
      senderName: 'System',
      relatedItemId: transaction.id,
      relatedItemType: 'transaction',
      actionType: 'created',
      actionUrl: `/dashboard/finance/transactions?id=${transaction.id}`,
      companyId: sale.companyId,
    });

    return transaction;
  } catch (error) {
    console.error('Error creating transaction from sale:', error);
    return null;
  }
}

/**
 * Update a financial transaction when a sale is updated
 *
 * @param sale The updated sale object
 * @returns The updated transaction or null if failed
 */
export async function updateTransactionFromSale(
  sale: Sale & {
    customer: { name: string },
    items: SaleItem[]
  }
) {
  try {
    // Find existing transaction for this sale
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        companyId: sale.companyId,
        relatedTo: sale.id,
      },
    });

    if (!existingTransaction) {
      // If no transaction exists, create a new one
      return createTransactionFromSale(sale);
    }

    // Update the transaction
    const transaction = await prisma.transaction.update({
      where: {
        id: existingTransaction.id,
      },
      data: {
        date: sale.date,
        description: `Sale to ${sale.customer.name} - Invoice #${sale.invoiceNumber || 'N/A'}`,
        amount: sale.total,
        status: sale.status === 'completed' ? 'completed' : 'pending',
        notes: `Automatically updated from sale. Items: ${sale.items.map(item => item.product).join(', ')}`,
      },
    });

    // If the transaction status changed to completed, update the account balance
    if (transaction.status === 'completed' && existingTransaction.status !== 'completed' && transaction.accountId) {
      await applyTransactionToBalance(transaction, transaction.accountId);
    }

    return transaction;
  } catch (error) {
    console.error('Error updating transaction from sale:', error);
    return null;
  }
}

/**
 * Delete a financial transaction when a sale is deleted
 *
 * @param saleId The ID of the deleted sale
 * @param companyId The company ID
 * @returns Success status
 */
export async function deleteTransactionFromSale(saleId: string, companyId: string) {
  try {
    // Find existing transaction for this sale
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        companyId: companyId,
        relatedTo: saleId,
      },
    });

    if (!existingTransaction) {
      return true; // No transaction to delete
    }

    // Delete the transaction
    await prisma.transaction.delete({
      where: {
        id: existingTransaction.id,
      },
    });

    return true;
  } catch (error) {
    console.error('Error deleting transaction from sale:', error);
    return false;
  }
}
