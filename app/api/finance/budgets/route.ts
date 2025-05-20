import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getUserCompanyId } from '@/lib/auth';
import { createBudgetNotification } from '@/lib/notification-service';

// Validation schema for budget data
const budgetSchema = z.object({
  name: z.string().min(1, "Budget name is required"),
  description: z.string().optional(),
  type: z.enum(["annual", "monthly", "quarterly", "project"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  status: z.enum(["active", "archived", "draft"]).default("active"),
  totalBudget: z.number().positive("Total budget must be positive"),
  items: z.array(
    z.object({
      categoryId: z.string().optional(),
      name: z.string().min(1, "Item name is required"),
      amount: z.number().positive("Amount must be positive"),
      notes: z.string().optional(),
    })
  ).min(1, "At least one budget item is required"),
});

// Validation schema for updating a budget
const budgetUpdateSchema = z.object({
  id: z.string().min(1, "Budget ID is required"),
  name: z.string().min(1, "Budget name is required").optional(),
  description: z.string().optional().nullable(),
  type: z.enum(["annual", "monthly", "quarterly", "project"]).optional(),
  startDate: z.string().min(1, "Start date is required").optional(),
  endDate: z.string().min(1, "End date is required").optional(),
  status: z.enum(["active", "archived", "draft"]).optional(),
  totalBudget: z.number().positive("Total budget must be positive").optional(),
  items: z.array(
    z.object({
      id: z.string().optional(),
      categoryId: z.union([
        z.string().min(1),
        z.literal(null),
        z.literal('empty'),
        z.literal(''),
        z.literal('none')
      ]).optional().nullable(),
      name: z.string().min(1, "Item name is required"),
      amount: z.number().positive("Amount must be positive"),
      spent: z.number().min(0, "Spent amount cannot be negative").optional(),
      notes: z.string().optional().nullable(),
    })
  ).optional(),
});

/**
 * GET: Retrieve budgets with optional filtering
 *
 * Query parameters:
 * - id: Get a specific budget by ID
 * - type: Filter by budget type
 * - status: Filter by budget status
 * - active: If true, only return budgets where current date is between start and end date
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
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const active = searchParams.get('active') === 'true';

    // If ID is provided, get a specific budget
    if (id) {
      const budget = await prisma.budget.findFirst({
        where: {
          id,
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
          { error: 'Budget not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(budget);
    }

    // Build the query filter
    const filter: any = { companyId };

    if (type) {
      filter.type = type;
    }

    if (status) {
      filter.status = status;
    }

    if (active) {
      const now = new Date();
      filter.startDate = { lte: now };
      filter.endDate = { gte: now };
    }

    // Get all budgets for this company with filters
    const budgets = await prisma.budget.findMany({
      where: filter,
      include: {
        items: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    return NextResponse.json(budgets);
  } catch (error: any) {
    console.error('Error fetching budgets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch budgets' },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a new budget
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
    const validationResult = budgetSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid budget data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const budgetData = validationResult.data;

    // Calculate the total of all budget items
    const itemsTotal = budgetData.items.reduce((sum, item) => sum + item.amount, 0);

    // Verify that the sum of all items equals the total budget
    if (Math.abs(itemsTotal - budgetData.totalBudget) > 0.01) {
      return NextResponse.json(
        { error: 'The sum of all budget items must equal the total budget' },
        { status: 400 }
      );
    }

    // Create the budget with its items
    const budget = await prisma.budget.create({
      data: {
        name: budgetData.name,
        description: budgetData.description,
        type: budgetData.type,
        startDate: new Date(budgetData.startDate),
        endDate: new Date(budgetData.endDate),
        status: budgetData.status,
        totalBudget: budgetData.totalBudget,
        company: {
          connect: {
            id: companyId,
          },
        },
        items: {
          create: budgetData.items.map(item => ({
            name: item.name,
            amount: item.amount,
            notes: item.notes,
            ...(item.categoryId && item.categoryId !== '' && item.categoryId !== 'empty' && item.categoryId !== 'none' ? {
              category: {
                connect: {
                  id: item.categoryId,
                },
              },
            } : {}),
          })),
        },
      },
      include: {
        items: {
          include: {
            category: true,
          },
        },
      },
    });

    // Create a notification for the new budget
    try {
      await createBudgetNotification(
        companyId,
        budget.id,
        budget.name,
        'created',
        'system_user', // In a real app, you would get the current user's ID
        'System User', // In a real app, you would get the current user's name
        'user' // Actor type (user or employee)
      );
    } catch (error) {
      console.error('Error creating budget notification:', error);
      // Don't fail the request if notification creation fails
    }

    return NextResponse.json(budget, { status: 201 });
  } catch (error: any) {
    console.error('Error creating budget:', error);
    return NextResponse.json(
      { error: 'Failed to create budget' },
      { status: 500 }
    );
  }
}

/**
 * PUT: Update an existing budget
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

    // Get the ID from the query string or the request body
    const { searchParams } = new URL(request.url);
    const queryId = searchParams.get('id');

    // Parse and validate the request body
    const body = await request.json();
    console.log('Received budget data:', JSON.stringify(body, null, 2));

    // Use the ID from the query string if it's not in the body
    const dataWithId = queryId && !body.id ? { ...body, id: queryId } : body;
    console.log('Using ID:', queryId || body.id);

    const validationResult = budgetUpdateSchema.safeParse(dataWithId);

    if (!validationResult.success) {
      console.error('Budget validation failed:', JSON.stringify(validationResult.error.format(), null, 2));
      return NextResponse.json(
        { error: 'Invalid budget data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { id, ...updateData } = validationResult.data;

    // Check if the budget exists and belongs to the company
    const existingBudget = await prisma.budget.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!existingBudget) {
      return NextResponse.json(
        { error: 'Budget not found or you do not have permission to update it' },
        { status: 404 }
      );
    }

    // Prepare the data for update
    const updatePayload: any = {};

    if (updateData.name !== undefined) updatePayload.name = updateData.name;
    if (updateData.description !== undefined) updatePayload.description = updateData.description;
    if (updateData.type !== undefined) updatePayload.type = updateData.type;
    if (updateData.status !== undefined) updatePayload.status = updateData.status;
    if (updateData.totalBudget !== undefined) updatePayload.totalBudget = updateData.totalBudget;
    if (updateData.startDate !== undefined) updatePayload.startDate = new Date(updateData.startDate);
    if (updateData.endDate !== undefined) updatePayload.endDate = new Date(updateData.endDate);

    // Handle budget items if provided
    if (updateData.items && updateData.items.length > 0) {
      // First, get existing items to compare
      const existingItems = await prisma.budgetItem.findMany({
        where: {
          budgetId: id,
        },
      });

      // Create a map of existing items by ID for easy lookup
      const existingItemsMap = new Map();
      existingItems.forEach(item => {
        existingItemsMap.set(item.id, item);
      });

      // Process each item in the update
      for (const item of updateData.items) {
        if (item.id) {
          // This is an existing item - update it
          if (existingItemsMap.has(item.id)) {
            await prisma.budgetItem.update({
              where: {
                id: item.id,
              },
              data: {
                name: item.name,
                amount: item.amount,
                notes: item.notes,
                spent: item.spent !== undefined ? item.spent : undefined,
                category: item.categoryId && item.categoryId !== '' && item.categoryId !== 'empty' && item.categoryId !== 'none' ? {
                  connect: {
                    id: item.categoryId,
                  },
                } : {
                  disconnect: true,
                },
              },
            });
          }
        } else {
          // This is a new item - create it
          if (item.categoryId && item.categoryId !== '' && item.categoryId !== 'empty' && item.categoryId !== 'none') {
            // Create with category connection
            await prisma.budgetItem.create({
              data: {
                name: item.name,
                amount: item.amount,
                notes: item.notes,
                spent: item.spent || 0,
                budget: {
                  connect: {
                    id,
                  },
                },
                category: {
                  connect: {
                    id: item.categoryId,
                  },
                },
              },
            });
          } else {
            // Create without category connection
            await prisma.budgetItem.create({
              data: {
                name: item.name,
                amount: item.amount,
                notes: item.notes,
                spent: item.spent || 0,
                budget: {
                  connect: {
                    id,
                  },
                },
                // No category connection
              },
            });
          }
        }
      }

      // Recalculate the total budget and spent amounts
      const updatedItems = await prisma.budgetItem.findMany({
        where: {
          budgetId: id,
        },
      });

      const totalBudget = updatedItems.reduce((sum, item) => sum + item.amount, 0);
      const totalSpent = updatedItems.reduce((sum, item) => sum + item.spent, 0);

      // Update the budget totals
      updatePayload.totalBudget = totalBudget;
      updatePayload.totalSpent = totalSpent;
    }

    // Update the budget
    const budget = await prisma.budget.update({
      where: {
        id,
      },
      data: updatePayload,
      include: {
        items: {
          include: {
            category: true,
          },
        },
      },
    });

    // Create a notification for the updated budget
    try {
      await createBudgetNotification(
        companyId,
        budget.id,
        budget.name,
        'updated',
        'system_user', // In a real app, you would get the current user's ID
        'System User', // In a real app, you would get the current user's name
        'user' // Actor type (user or employee)
      );
    } catch (error) {
      console.error('Error creating budget notification:', error);
      // Don't fail the request if notification creation fails
    }

    return NextResponse.json(budget);
  } catch (error: any) {
    console.error('Error updating budget:', error);
    return NextResponse.json(
      { error: 'Failed to update budget' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Delete a budget
 *
 * Query parameters:
 * - id: The ID of the budget to delete
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

    // Get the budget ID from query parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Budget ID is required' },
        { status: 400 }
      );
    }

    // Check if the budget exists and belongs to the company
    const existingBudget = await prisma.budget.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!existingBudget) {
      return NextResponse.json(
        { error: 'Budget not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }

    // Delete all budget items first
    await prisma.budgetItem.deleteMany({
      where: {
        budgetId: id,
      },
    });

    // Delete the budget
    await prisma.budget.delete({
      where: {
        id,
      },
    });

    // Create a notification for the deleted budget
    try {
      await createBudgetNotification(
        companyId,
        id,
        existingBudget.name,
        'deleted',
        'system_user', // In a real app, you would get the current user's ID
        'System User', // In a real app, you would get the current user's name
        'user' // Actor type (user or employee)
      );
    } catch (error) {
      console.error('Error creating budget notification:', error);
      // Don't fail the request if notification creation fails
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting budget:', error);
    return NextResponse.json(
      { error: 'Failed to delete budget' },
      { status: 500 }
    );
  }
}
