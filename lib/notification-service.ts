import { prisma } from '@/lib/prisma';

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: string;
  entityId?: string;
  entityType?: string;
  actionType?: string;
  actorName?: string;
  metadata?: any;
  link?: string;
}

/**
 * Create a notification for a user
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        title: params.title,
        message: params.message,
        type: params.type,
        read: false,
        user: {
          connect: {
            id: params.userId,
          },
        },
        entityId: params.entityId,
        entityType: params.entityType,
        actionType: params.actionType,
        actorName: params.actorName,
        metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
        link: params.link,
      },
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Create a notification for all users in a company
 */
export async function createCompanyNotification(
  companyId: string,
  params: Omit<CreateNotificationParams, 'userId'>
) {
  try {
    // Get all users in the company
    const users = await prisma.user.findMany({
      where: {
        companyId,
      },
      select: {
        id: true,
      },
    });

    // Create a notification for each user
    const notifications = await Promise.all(
      users.map((user) =>
        createNotification({
          ...params,
          userId: user.id,
        })
      )
    );

    return notifications;
  } catch (error) {
    console.error('Error creating company notifications:', error);
    throw error;
  }
}

/**
 * Create a notification for a budget-related action
 */
export async function createBudgetNotification(
  companyId: string,
  budgetId: string,
  budgetName: string,
  actionType: 'created' | 'updated' | 'deleted',
  actorName: string
) {
  try {
    let title = '';
    let message = '';
    const link = `/dashboard/finance/budgets?id=${budgetId}`;

    switch (actionType) {
      case 'created':
        title = 'New Budget Created';
        message = `${actorName} created a new budget: ${budgetName}`;
        break;
      case 'updated':
        title = 'Budget Updated';
        message = `${actorName} updated the budget: ${budgetName}`;
        break;
      case 'deleted':
        title = 'Budget Deleted';
        message = `${actorName} deleted the budget: ${budgetName}`;
        break;
    }

    return createCompanyNotification(companyId, {
      title,
      message,
      type: 'budget',
      entityId: budgetId,
      entityType: 'budget',
      actionType,
      actorName,
      link,
    });
  } catch (error) {
    console.error('Error creating budget notification:', error);
    throw error;
  }
}

/**
 * Create a notification for a sale-related action
 */
export async function createSaleNotification(
  companyId: string,
  saleId: string,
  invoiceNumber: string,
  actionType: 'created' | 'updated' | 'deleted',
  actorName: string,
  amount: number
) {
  try {
    let title = '';
    let message = '';
    const link = `/dashboard/sales?id=${saleId}`;

    switch (actionType) {
      case 'created':
        title = 'New Sale Created';
        message = `${actorName} created a new sale: ${invoiceNumber} for $${amount.toFixed(2)}`;
        break;
      case 'updated':
        title = 'Sale Updated';
        message = `${actorName} updated the sale: ${invoiceNumber}`;
        break;
      case 'deleted':
        title = 'Sale Deleted';
        message = `${actorName} deleted the sale: ${invoiceNumber}`;
        break;
    }

    return createCompanyNotification(companyId, {
      title,
      message,
      type: 'sale',
      entityId: saleId,
      entityType: 'sale',
      actionType,
      actorName,
      link,
      metadata: { amount },
    });
  } catch (error) {
    console.error('Error creating sale notification:', error);
    throw error;
  }
}

/**
 * Create a notification for a transaction-related action
 */
export async function createTransactionNotification(
  companyId: string,
  transactionId: string,
  description: string,
  actionType: 'created' | 'updated' | 'deleted',
  actorName: string,
  amount: number,
  type: 'income' | 'expense'
) {
  try {
    let title = '';
    let message = '';
    const link = `/dashboard/finance/transactions?id=${transactionId}`;

    switch (actionType) {
      case 'created':
        title = `New ${type === 'income' ? 'Income' : 'Expense'} Transaction`;
        message = `${actorName} created a new ${type} transaction: ${description} for $${amount.toFixed(2)}`;
        break;
      case 'updated':
        title = 'Transaction Updated';
        message = `${actorName} updated the transaction: ${description}`;
        break;
      case 'deleted':
        title = 'Transaction Deleted';
        message = `${actorName} deleted the transaction: ${description}`;
        break;
    }

    return createCompanyNotification(companyId, {
      title,
      message,
      type: 'transaction',
      entityId: transactionId,
      entityType: 'transaction',
      actionType,
      actorName,
      link,
      metadata: { amount, transactionType: type },
    });
  } catch (error) {
    console.error('Error creating transaction notification:', error);
    throw error;
  }
}

/**
 * Create a notification for an inventory-related action
 */
export async function createInventoryNotification(
  companyId: string,
  itemId: string,
  itemName: string,
  actionType: 'created' | 'updated' | 'deleted' | 'low-stock',
  actorName: string,
  quantity?: number
) {
  try {
    let title = '';
    let message = '';
    const link = `/dashboard/inventory?id=${itemId}`;

    switch (actionType) {
      case 'created':
        title = 'New Inventory Item Added';
        message = `${actorName} added a new inventory item: ${itemName}`;
        break;
      case 'updated':
        title = 'Inventory Item Updated';
        message = `${actorName} updated the inventory item: ${itemName}`;
        break;
      case 'deleted':
        title = 'Inventory Item Deleted';
        message = `${actorName} deleted the inventory item: ${itemName}`;
        break;
      case 'low-stock':
        title = 'Low Stock Alert';
        message = `Inventory item ${itemName} is running low (${quantity} remaining)`;
        break;
    }

    return createCompanyNotification(companyId, {
      title,
      message,
      type: 'inventory',
      entityId: itemId,
      entityType: 'inventory',
      actionType,
      actorName,
      link,
      metadata: { quantity },
    });
  } catch (error) {
    console.error('Error creating inventory notification:', error);
    throw error;
  }
}
