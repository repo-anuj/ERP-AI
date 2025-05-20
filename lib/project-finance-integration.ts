import { prisma } from '@/lib/prisma';
import { Project } from '@prisma/client';
import { createNotification } from '@/lib/notification-service';

/**
 * Create a budget for a project
 *
 * @param project The project to create a budget for
 * @param userId The user who is creating the budget
 * @returns The created budget or null if failed
 */
export async function createProjectBudget(
  project: Project,
  userId: string
) {
  try {
    // Check if a budget already exists for this project
    const existingBudget = await prisma.budget.findFirst({
      where: {
        companyId: project.companyId,
        type: 'project',
        OR: [
          { name: { contains: project.name, mode: 'insensitive' } },
          { description: { contains: project.id, mode: 'insensitive' } }
        ]
      },
    });

    if (existingBudget) {
      console.log('Budget already exists for project', project.id);
      return existingBudget;
    }

    // Create a new budget for the project
    const budget = await prisma.budget.create({
      data: {
        name: `Budget for ${project.name}`,
        type: 'project',
        startDate: project.startDate,
        endDate: project.endDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // Default to 1 year if no end date
        status: 'active',
        totalBudget: project.budget || 0,
        company: {
          connect: {
            id: project.companyId,
          },
        },
        // Include project ID in description for reference
        description: `Automatically generated budget for project: ${project.name} (ID: ${project.id}) - Created by user ${userId}`,
      },
    });

    // Create a notification about the budget
    await createNotification({
      title: 'Project Budget Created',
      message: `A budget has been created for project: ${project.name}`,
      type: 'info',
      category: 'finance',
      recipientId: userId,
      recipientType: 'user',
      senderName: 'System',
      relatedItemId: budget.id,
      relatedItemType: 'budget',
      actionType: 'created',
      actionUrl: `/dashboard/finance/budgets?id=${budget.id}`,
      companyId: project.companyId,
    });

    return budget;
  } catch (error) {
    console.error('Error creating project budget:', error);
    return null;
  }
}

/**
 * Update a project's budget when the project is updated
 *
 * @param project The updated project
 * @param userId The user who is updating the project
 * @returns The updated budget or null if failed
 */
export async function updateProjectBudget(
  project: Project,
  userId: string
) {
  try {
    // Find the existing budget for this project
    const existingBudget = await prisma.budget.findFirst({
      where: {
        companyId: project.companyId,
        type: 'project',
        OR: [
          { name: { contains: project.name, mode: 'insensitive' } },
          { description: { contains: project.id, mode: 'insensitive' } }
        ]
      },
    });

    if (!existingBudget) {
      // If no budget exists, create a new one
      return createProjectBudget(project, userId);
    }

    // Update the budget
    const budget = await prisma.budget.update({
      where: {
        id: existingBudget.id,
      },
      data: {
        name: `Budget for ${project.name}`,
        description: `Automatically updated budget for project: ${project.name} (ID: ${project.id})`,
        startDate: project.startDate,
        endDate: project.endDate || existingBudget.endDate,
        totalBudget: project.budget || existingBudget.totalBudget,
      },
    });

    return budget;
  } catch (error) {
    console.error('Error updating project budget:', error);
    return null;
  }
}

/**
 * Link a transaction to a project
 *
 * @param transactionId The ID of the transaction to link
 * @param projectId The ID of the project to link to
 * @param userId The user who is creating the link
 * @returns The updated transaction or null if failed
 */
export async function linkTransactionToProject(
  transactionId: string,
  projectId: string,
  userId: string
) {
  try {
    // Update the transaction to link it to the project
    const transaction = await prisma.transaction.update({
      where: {
        id: transactionId,
      },
      data: {
        relatedTo: projectId,
        notes: `Linked to project: ${projectId}`,
      },
    });

    // Get the project details
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (project) {
      // Create a notification about the linked transaction
      await createNotification({
        title: 'Transaction Linked to Project',
        message: `A transaction of ${transaction.amount} has been linked to project: ${project.name}`,
        type: 'info',
        category: 'finance',
        recipientId: userId,
        recipientType: 'user',
        senderName: 'System',
        relatedItemId: transaction.id,
        relatedItemType: 'transaction',
        actionType: 'updated',
        actionUrl: `/dashboard/finance/transactions?id=${transaction.id}`,
        companyId: project.companyId,
      });
    }

    return transaction;
  } catch (error) {
    console.error('Error linking transaction to project:', error);
    return null;
  }
}

/**
 * Get all transactions linked to a project
 *
 * @param projectId The ID of the project
 * @param companyId The company ID
 * @returns Array of transactions or empty array if none found
 */
export async function getProjectTransactions(
  projectId: string,
  companyId: string
) {
  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        companyId,
        relatedTo: projectId,
      },
      include: {
        category: true,
        account: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return transactions;
  } catch (error) {
    console.error('Error getting project transactions:', error);
    return [];
  }
}

/**
 * Get financial summary for a project
 *
 * @param projectId The ID of the project
 * @param companyId The company ID
 * @returns Financial summary object
 */
export async function getProjectFinancialSummary(
  projectId: string,
  companyId: string
) {
  try {
    // Get the project budget
    // Look for a budget with the project name or a budget that mentions the project ID in its name or description
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true }
    });

    let budget = null;
    if (project) {
      budget = await prisma.budget.findFirst({
        where: {
          companyId,
          type: 'project',
          OR: [
            { name: { contains: project.name, mode: 'insensitive' } },
            { description: { contains: projectId, mode: 'insensitive' } }
          ]
        },
      });
    }

    // Get all transactions linked to the project
    const transactions = await getProjectTransactions(projectId, companyId);

    // Calculate totals
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netAmount = totalIncome - totalExpenses;

    // Calculate budget utilization if a budget exists
    const budgetAmount = budget?.totalBudget || 0;
    const budgetUtilization = budgetAmount > 0 ? (totalExpenses / budgetAmount) * 100 : 0;

    return {
      totalIncome,
      totalExpenses,
      netAmount,
      budgetAmount,
      budgetUtilization,
      transactionCount: transactions.length,
      budget,
      recentTransactions: transactions.slice(0, 5), // Get the 5 most recent transactions
    };
  } catch (error) {
    console.error('Error getting project financial summary:', error);
    return {
      totalIncome: 0,
      totalExpenses: 0,
      netAmount: 0,
      budgetAmount: 0,
      budgetUtilization: 0,
      transactionCount: 0,
      budget: null,
      recentTransactions: [],
    };
  }
}
