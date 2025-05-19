import { prisma } from '@/lib/prisma';

interface CreateNotificationParams {
  title: string;
  message: string;
  type: string; // info, success, warning, error
  category: string; // system, task, project, sales, inventory, finance, hr
  priority?: string; // low, normal, high, urgent
  isActionRequired?: boolean;
  actionType?: string; // approve, reject, review, acknowledge
  actionUrl?: string;
  actionData?: any;
  recipientId?: string; // Can be either userId or employeeId
  recipientType?: string; // user or employee
  senderId?: string; // Can be either userId or employeeId
  senderType?: string; // user, employee, or system
  senderName?: string;
  relatedItemId?: string; // ID of the related item (task, project, etc.)
  relatedItemType?: string; // Type of the related item
  status?: string; // pending, approved, rejected, completed
  companyId: string;
  expiresAt?: Date;
}

/**
 * Create a notification
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    // Store additional fields in metadata as they're not direct fields in the Notification model
    const metadata = {
      category: params.category,
      priority: params.priority || 'normal',
      isActionRequired: params.isActionRequired || false,
      actionData: params.actionData,
      actionUrl: params.actionUrl,
      status: params.status || 'pending',
      expiresAt: params.expiresAt,
      recipientType: params.recipientType,
      senderId: params.senderId,
      senderType: params.senderType || 'system',
    };

    // Create the notification with the correct schema
    const notificationData: any = {
      title: params.title,
      message: params.message,
      type: params.type,
      read: false,
      entityId: params.relatedItemId,
      entityType: params.relatedItemType,
      actionType: params.actionType,
      actorName: params.senderName,
      metadata: JSON.stringify(metadata),
      link: params.actionUrl, // Store actionUrl in link field
    };

    // Only add user connection if recipientId is provided
    if (params.recipientId) {
      notificationData.user = {
        connect: {
          id: params.recipientId,
        },
      };
    }

    const notification = await prisma.notification.create({
      data: notificationData,
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
  params: Omit<CreateNotificationParams, 'companyId'>
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
          companyId,
          recipientId: user.id,
          recipientType: 'user',
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
 * Create a notification for all employees in a company
 */
export async function createEmployeeNotification(
  companyId: string,
  params: Omit<CreateNotificationParams, 'companyId'>
) {
  try {
    // Get all employees in the company
    const employees = await prisma.employee.findMany({
      where: {
        companyId,
      },
      select: {
        id: true,
      },
    });

    // Create a notification for each employee
    const notifications = await Promise.all(
      employees.map((employee) =>
        createNotification({
          ...params,
          companyId,
          recipientId: employee.id,
          recipientType: 'employee',
        })
      )
    );

    return notifications;
  } catch (error) {
    console.error('Error creating employee notifications:', error);
    throw error;
  }
}

/**
 * Create a notification for employees in a specific department
 */
export async function createDepartmentNotification(
  companyId: string,
  department: string,
  params: Omit<CreateNotificationParams, 'companyId'>
) {
  try {
    // Get all employees in the department
    const employees = await prisma.employee.findMany({
      where: {
        companyId,
        department: {
          equals: department,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
      },
    });

    // Create a notification for each employee
    const notifications = await Promise.all(
      employees.map((employee) =>
        createNotification({
          ...params,
          companyId,
          recipientId: employee.id,
          recipientType: 'employee',
        })
      )
    );

    return notifications;
  } catch (error) {
    console.error(`Error creating notifications for ${department} department:`, error);
    throw error;
  }
}

/**
 * Create a notification for a task approval request
 */
export async function createTaskApprovalRequest(
  companyId: string,
  taskId: string,
  taskName: string,
  assigneeId: string,
  assigneeName: string,
  managerId: string,
  projectName: string
) {
  try {
    const title = 'Task Approval Request';
    const message = `${assigneeName} has completed the task "${taskName}" in project "${projectName}" and is requesting your approval.`;
    const actionUrl = `/projects?taskId=${taskId}`;

    return createNotification({
      title,
      message,
      type: 'info',
      category: 'task',
      priority: 'high',
      isActionRequired: true,
      actionType: 'approve',
      actionUrl,
      actionData: { taskId, projectName },
      recipientId: managerId,
      recipientType: 'employee',
      senderId: assigneeId,
      senderType: 'employee',
      senderName: assigneeName,
      relatedItemId: taskId,
      relatedItemType: 'task',
      status: 'pending',
      companyId,
    });
  } catch (error) {
    console.error('Error creating task approval request:', error);
    throw error;
  }
}

/**
 * Create a notification for a task approval response
 */
export async function createTaskApprovalResponse(
  companyId: string,
  taskId: string,
  taskName: string,
  managerId: string,
  managerName: string,
  assigneeId: string,
  projectName: string,
  approved: boolean,
  comments?: string
) {
  try {
    const title = approved ? 'Task Approved' : 'Task Rejected';
    let message = approved
      ? `${managerName} has approved your task "${taskName}" in project "${projectName}".`
      : `${managerName} has rejected your task "${taskName}" in project "${projectName}".`;

    if (comments) {
      message += ` Comments: "${comments}"`;
    }

    const actionUrl = `/projects?taskId=${taskId}`;

    return createNotification({
      title,
      message,
      type: approved ? 'success' : 'error',
      category: 'task',
      priority: 'normal',
      isActionRequired: !approved, // If rejected, action is required
      actionType: approved ? 'acknowledge' : 'review',
      actionUrl,
      actionData: { taskId, projectName, approved, comments },
      recipientId: assigneeId,
      recipientType: 'employee',
      senderId: managerId,
      senderType: 'employee',
      senderName: managerName,
      relatedItemId: taskId,
      relatedItemType: 'task',
      status: 'completed',
      companyId,
    });
  } catch (error) {
    console.error('Error creating task approval response:', error);
    throw error;
  }
}

/**
 * Create a notification for a new task assignment
 */
export async function createTaskAssignmentNotification(
  companyId: string,
  taskId: string,
  taskName: string,
  assigneeId: string,
  managerId: string,
  managerName: string,
  projectName: string,
  dueDate: Date
) {
  try {
    const title = 'New Task Assignment';
    const message = `${managerName} has assigned you a new task "${taskName}" in project "${projectName}". Due date: ${dueDate.toLocaleDateString()}.`;
    const actionUrl = `/projects?taskId=${taskId}`;

    return createNotification({
      title,
      message,
      type: 'info',
      category: 'task',
      priority: 'high',
      isActionRequired: true,
      actionType: 'acknowledge',
      actionUrl,
      actionData: { taskId, projectName, dueDate },
      recipientId: assigneeId,
      recipientType: 'employee',
      senderId: managerId,
      senderType: 'employee',
      senderName: managerName,
      relatedItemId: taskId,
      relatedItemType: 'task',
      status: 'pending',
      companyId,
    });
  } catch (error) {
    console.error('Error creating task assignment notification:', error);
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
  actorId: string,
  actorName: string,
  actorType: 'user' | 'employee'
) {
  try {
    let title = '';
    let message = '';
    const actionUrl = `/dashboard/finance/budgets?id=${budgetId}`;

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

    return createDepartmentNotification(companyId, 'finance', {
      title,
      message,
      type: 'info',
      category: 'finance',
      priority: 'normal',
      isActionRequired: false,
      actionUrl,
      senderId: actorId,
      senderType: actorType,
      senderName: actorName,
      relatedItemId: budgetId,
      relatedItemType: 'budget',
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
  actorId: string,
  actorName: string,
  actorType: 'user' | 'employee',
  amount: number
) {
  try {
    let title = '';
    let message = '';
    const actionUrl = `/sales?id=${saleId}`;

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

    // Notify HR and admin about the sale
    const hrNotification = createDepartmentNotification(companyId, 'hr', {
      title,
      message,
      type: 'info',
      category: 'sales',
      priority: 'normal',
      isActionRequired: false,
      actionUrl,
      senderId: actorId,
      senderType: actorType,
      senderName: actorName,
      relatedItemId: saleId,
      relatedItemType: 'sale',
      actionData: { amount, invoiceNumber },
    });

    // Also notify finance department
    const financeNotification = createDepartmentNotification(companyId, 'finance', {
      title,
      message,
      type: 'info',
      category: 'sales',
      priority: 'normal',
      isActionRequired: false,
      actionUrl,
      senderId: actorId,
      senderType: actorType,
      senderName: actorName,
      relatedItemId: saleId,
      relatedItemType: 'sale',
      actionData: { amount, invoiceNumber },
    });

    return Promise.all([hrNotification, financeNotification]);
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
  actorId: string,
  actorName: string,
  actorType: 'user' | 'employee',
  amount: number,
  type: 'income' | 'expense'
) {
  try {
    let title = '';
    let message = '';
    const actionUrl = `/dashboard/finance/transactions?id=${transactionId}`;

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

    // Notify finance department
    return createDepartmentNotification(companyId, 'finance', {
      title,
      message,
      type: 'info',
      category: 'finance',
      priority: type === 'expense' && amount > 1000 ? 'high' : 'normal',
      isActionRequired: false,
      actionUrl,
      senderId: actorId,
      senderType: actorType,
      senderName: actorName,
      relatedItemId: transactionId,
      relatedItemType: 'transaction',
      actionData: { amount, transactionType: type, description },
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
  actorId: string,
  actorName: string,
  actorType: 'user' | 'employee',
  quantity?: number
) {
  try {
    let title = '';
    let message = '';
    const actionUrl = `/inventory?id=${itemId}`;
    let priority = 'normal';
    let isActionRequired = false;

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
        priority = 'high';
        isActionRequired = true;
        break;
    }

    // Determine which departments to notify
    const departments = ['inventory'];

    // For low stock, also notify sales department
    if (actionType === 'low-stock') {
      departments.push('sales');
    }

    // Create notifications for each department
    const notifications = departments.map(dept =>
      createDepartmentNotification(companyId, dept, {
        title,
        message,
        type: actionType === 'low-stock' ? 'warning' : 'info',
        category: 'inventory',
        priority,
        isActionRequired,
        actionUrl,
        senderId: actorId,
        senderType: actorType,
        senderName: actorName,
        relatedItemId: itemId,
        relatedItemType: 'inventory',
        actionData: { quantity, itemName },
      })
    );

    return Promise.all(notifications);
  } catch (error) {
    console.error('Error creating inventory notification:', error);
    throw error;
  }
}

/**
 * Create a notification for an employee-related action
 */
export async function createEmployeeActionNotification(
  companyId: string,
  employeeId: string,
  employeeName: string,
  actionType: 'hired' | 'updated' | 'terminated' | 'role_changed',
  actorId: string,
  actorName: string,
  actorType: 'user' | 'employee',
  details?: any
) {
  try {
    let title = '';
    let message = '';
    const actionUrl = `/hr?employeeId=${employeeId}`;

    switch (actionType) {
      case 'hired':
        title = 'New Employee Hired';
        message = `${actorName} added a new employee: ${employeeName}`;
        break;
      case 'updated':
        title = 'Employee Information Updated';
        message = `${actorName} updated information for employee: ${employeeName}`;
        break;
      case 'terminated':
        title = 'Employee Terminated';
        message = `${actorName} terminated employee: ${employeeName}`;
        break;
      case 'role_changed':
        title = 'Employee Role Changed';
        message = `${actorName} changed the role of ${employeeName} to ${details?.newRole || 'a new role'}`;
        break;
    }

    // Notify HR department
    return createDepartmentNotification(companyId, 'hr', {
      title,
      message,
      type: 'info',
      category: 'hr',
      priority: actionType === 'terminated' ? 'high' : 'normal',
      isActionRequired: false,
      actionUrl,
      senderId: actorId,
      senderType: actorType,
      senderName: actorName,
      relatedItemId: employeeId,
      relatedItemType: 'employee',
      actionData: details,
    });
  } catch (error) {
    console.error('Error creating employee action notification:', error);
    throw error;
  }
}
