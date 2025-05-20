import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserCompanyId } from '@/lib/auth';
import { createNotification } from '@/lib/notification-service';

/**
 * GET: Get budget alerts for the current user's company
 *
 * Query parameters:
 * - threshold: Alert threshold percentage (default: 90)
 * - status: Filter by alert status (active, dismissed)
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
    const threshold = parseInt(searchParams.get('threshold') || '90');
    const status = searchParams.get('status');

    // Get all active budgets
    const now = new Date();
    const activeBudgets = await prisma.budget.findMany({
      where: {
        companyId,
        status: 'active',
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        items: true,
      },
    });

    // Generate alerts for budgets and budget items
    const alerts = [];

    for (const budget of activeBudgets) {
      // Check overall budget
      const percentSpent = budget.totalBudget > 0 ? (budget.totalSpent / budget.totalBudget) * 100 : 0;

      if (percentSpent >= threshold) {
        alerts.push({
          id: `budget-${budget.id}`,
          type: 'budget',
          budgetId: budget.id,
          budgetName: budget.name,
          itemId: null,
          itemName: null,
          message: `Budget "${budget.name}" has reached ${percentSpent.toFixed(1)}% of its total allocation`,
          severity: percentSpent >= 100 ? 'critical' : 'warning',
          percentSpent,
          threshold,
          createdAt: new Date(),
        });
      }

      // Check individual budget items
      for (const item of budget.items) {
        const itemPercentSpent = item.amount > 0 ? (item.spent / item.amount) * 100 : 0;

        if (itemPercentSpent >= threshold) {
          alerts.push({
            id: `item-${item.id}`,
            type: 'budget-item',
            budgetId: budget.id,
            budgetName: budget.name,
            itemId: item.id,
            itemName: item.name,
            message: `Budget item "${item.name}" in "${budget.name}" has reached ${itemPercentSpent.toFixed(1)}% of its allocation`,
            severity: itemPercentSpent >= 100 ? 'critical' : 'warning',
            percentSpent: itemPercentSpent,
            threshold,
            createdAt: new Date(),
          });
        }
      }
    }

    // Sort alerts by severity (critical first) and then by percent spent (highest first)
    alerts.sort((a, b) => {
      if (a.severity === b.severity) {
        return b.percentSpent - a.percentSpent;
      }
      return a.severity === 'critical' ? -1 : 1;
    });

    return NextResponse.json(alerts);
  } catch (error: any) {
    console.error('Error generating budget alerts:', error);
    return NextResponse.json(
      { error: 'Failed to generate budget alerts' },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a notification for a budget alert
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and get their company ID
    const companyId = await getUserCompanyId();
    const userId = await getUserId();

    if (!companyId || !userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { alertId, budgetId, itemId, message, severity } = body;

    if (!alertId || !budgetId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create a notification for the user
    const notification = await createNotification({
      recipientId: userId,
      recipientType: 'user',
      title: `Budget Alert: ${severity === 'critical' ? 'Critical' : 'Warning'}`,
      message,
      type: 'budget-alert',
      category: 'finance',
      actionType: 'alert',
      senderName: 'System',
      relatedItemId: budgetId,
      relatedItemType: 'budget',
      actionData: {
        alertId,
        budgetId,
        itemId,
        severity,
      },
      actionUrl: `/dashboard/finance/budgets?id=${budgetId}`,
      companyId,
    });

    return NextResponse.json(notification);
  } catch (error: any) {
    console.error('Error creating budget alert notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

// Helper function to get the current user ID
async function getUserId(): Promise<string | null> {
  try {
    // In a real application, you would get the current user ID from the session
    // For now, we'll get the first user in the company
    const companyId = await getUserCompanyId();

    if (!companyId) {
      return null;
    }

    const company = await prisma.company.findFirst({
      where: { id: companyId },
      include: {
        users: {
          take: 1,
          select: {
            id: true,
          },
        },
      },
    });

    return company?.users[0]?.id || null;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
}
