import { prisma } from '@/lib/prisma';
import { InventoryItem } from '@prisma/client';
import { applyTransactionToBalance } from '@/lib/finance-utils';
import { createNotification } from '@/lib/notification-service';

/**
 * Create a financial transaction for inventory purchase
 *
 * @param inventoryItem The inventory item that was purchased/added
 * @param quantity The quantity that was added
 * @param userId The user who made the purchase
 * @returns The created transaction or null if failed
 */
export async function createInventoryExpenseTransaction(
  inventoryItem: InventoryItem,
  quantity: number,
  userId?: string
) {
  try {
    // Find the default expense category for inventory
    const inventoryCategory = await prisma.budgetCategory.findFirst({
      where: {
        companyId: inventoryItem.companyId,
        type: 'expense',
        name: { contains: 'Inventory', mode: 'insensitive' }
      }
    });

    // Find the default account (use the first one if no default is set)
    const defaultAccount = await prisma.financialAccount.findFirst({
      where: {
        companyId: inventoryItem.companyId,
        type: { in: ['bank', 'cash'] }
      }
    });

    if (!defaultAccount) {
      console.error('No financial account found for company', inventoryItem.companyId);
      return null;
    }

    // Calculate the total expense amount
    const totalAmount = inventoryItem.price * quantity;

    // Create the transaction
    const transaction = await prisma.transaction.create({
      data: {
        date: new Date(),
        description: `Inventory Purchase: ${inventoryItem.name} (${quantity} units)`,
        amount: totalAmount,
        type: 'expense',
        reference: inventoryItem.sku,
        status: 'completed',
        notes: `Automatically generated for inventory purchase. SKU: ${inventoryItem.sku}`,
        company: {
          connect: {
            id: inventoryItem.companyId,
          },
        },
        ...(inventoryCategory && {
          category: {
            connect: {
              id: inventoryCategory.id,
            },
          },
        }),
        account: {
          connect: {
            id: defaultAccount.id,
          },
        },
        ...(userId && {
          user: {
            connect: {
              id: userId,
            },
          },
        }),
        // Store the original inventory item ID for reference
        relatedTo: inventoryItem.id,
      },
    });

    // Update the account balance
    await applyTransactionToBalance(transaction, defaultAccount.id);

    // Create a notification about the transaction
    if (userId) {
      await createNotification({
        title: 'Inventory Expense Recorded',
        message: `A transaction of ${totalAmount} has been created for inventory purchase: ${inventoryItem.name}`,
        type: 'info',
        category: 'finance',
        recipientId: userId,
        recipientType: 'user',
        senderName: 'System',
        relatedItemId: transaction.id,
        relatedItemType: 'transaction',
        actionUrl: `/dashboard/finance/transactions?id=${transaction.id}`,
        companyId: inventoryItem.companyId
      });
    }

    return transaction;
  } catch (error) {
    console.error('Error creating inventory expense transaction:', error);
    return null;
  }
}

/**
 * Track inventory value changes when quantities are updated
 *
 * @param inventoryItem The inventory item that was updated
 * @param oldQuantity The previous quantity
 * @param newQuantity The new quantity
 * @param userId The user who made the update
 * @returns The created transaction or null if no transaction needed or failed
 */
export async function trackInventoryQuantityChange(
  inventoryItem: InventoryItem,
  oldQuantity: number,
  newQuantity: number,
  userId?: string
) {
  // Calculate the quantity difference
  const quantityDifference = newQuantity - oldQuantity;

  // If there's no change or the quantity decreased, no expense transaction needed
  if (quantityDifference <= 0) {
    return null;
  }

  // Create an expense transaction for the added inventory
  return createInventoryExpenseTransaction(
    inventoryItem,
    quantityDifference,
    userId
  );
}
