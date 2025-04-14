import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getUserCompanyId } from '@/lib/auth';

// Validation schema for budget item data
const budgetItemSchema = z.object({
  budgetId: z.string().min(1, "Budget ID is required"),
  categoryId: z.union([
    z.string().min(1),
    z.literal(null),
    z.literal('empty'),
    z.literal(''),
    z.literal('none')
  ]).optional().nullable(),
  name: z.string().min(1, "Item name is required"),
  amount: z.number().positive("Amount must be positive"),
  notes: z.string().optional().nullable(),
});

// Validation schema for updating a budget item
const budgetItemUpdateSchema = z.object({
  id: z.string().min(1, "Item ID is required"),
  categoryId: z.union([
    z.string().min(1),
    z.literal(null),
    z.literal('empty'),
    z.literal(''),
    z.literal('none')
  ]).optional().nullable(),
  name: z.string().min(1, "Item name is required").optional(),
  amount: z.number().positive("Amount must be positive").optional(),
  spent: z.number().min(0, "Spent amount cannot be negative").optional(),
  notes: z.string().optional().nullable(),
});

/**
 * GET: Retrieve budget items with optional filtering
 *
 * Query parameters:
 * - id: Get a specific budget item by ID
 * - budgetId: Filter by budget ID
 * - categoryId: Filter by category ID
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
    const budgetId = searchParams.get('budgetId');
    const categoryId = searchParams.get('categoryId');

    // If ID is provided, get a specific budget item
    if (id) {
      const budgetItem = await prisma.budgetItem.findFirst({
        where: {
          id,
          budget: {
            companyId,
          },
        },
        include: {
          category: true,
          budget: true,
        },
      });

      if (!budgetItem) {
        return NextResponse.json(
          { error: 'Budget item not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(budgetItem);
    }

    // Build the query filter
    const filter: any = {
      budget: {
        companyId,
      },
    };

    if (budgetId) {
      filter.budgetId = budgetId;
    }

    if (categoryId) {
      filter.categoryId = categoryId;
    }

    // Get all budget items with filters
    const budgetItems = await prisma.budgetItem.findMany({
      where: filter,
      include: {
        category: true,
        budget: {
          select: {
            name: true,
            type: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(budgetItems);
  } catch (error: any) {
    console.error('Error fetching budget items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch budget items' },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a new budget item
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
    const validationResult = budgetItemSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid budget item data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const itemData = validationResult.data;

    // Check if the budget exists and belongs to the company
    const budget = await prisma.budget.findFirst({
      where: {
        id: itemData.budgetId,
        companyId,
      },
    });

    if (!budget) {
      return NextResponse.json(
        { error: 'Budget not found or you do not have permission to add items to it' },
        { status: 404 }
      );
    }

    // Create the budget item
    const budgetItem = await prisma.budgetItem.create({
      data: {
        name: itemData.name,
        amount: itemData.amount,
        notes: itemData.notes,
        budget: {
          connect: {
            id: itemData.budgetId,
          },
        },
        ...(itemData.categoryId && itemData.categoryId !== '' && itemData.categoryId !== 'empty' && itemData.categoryId !== 'none' ? {
          category: {
            connect: {
              id: itemData.categoryId,
            },
          },
        } : {}),
      },
      include: {
        category: true,
        budget: true,
      },
    });

    // Update the budget's total budget amount
    await prisma.budget.update({
      where: {
        id: itemData.budgetId,
      },
      data: {
        totalBudget: {
          increment: itemData.amount,
        },
      },
    });

    return NextResponse.json(budgetItem, { status: 201 });
  } catch (error: any) {
    console.error('Error creating budget item:', error);
    return NextResponse.json(
      { error: 'Failed to create budget item' },
      { status: 500 }
    );
  }
}

/**
 * PUT: Update an existing budget item
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

    // Parse and validate the request body
    const body = await request.json();
    const validationResult = budgetItemUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid budget item data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { id, ...updateData } = validationResult.data;

    // Check if the budget item exists and belongs to the company
    const existingItem = await prisma.budgetItem.findFirst({
      where: {
        id,
        budget: {
          companyId,
        },
      },
      include: {
        budget: true,
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Budget item not found or you do not have permission to update it' },
        { status: 404 }
      );
    }

    // Prepare the data for update
    const updatePayload: any = {};

    if (updateData.name !== undefined) updatePayload.name = updateData.name;
    if (updateData.notes !== undefined) updatePayload.notes = updateData.notes;
    if (updateData.spent !== undefined) updatePayload.spent = updateData.spent;
    if (updateData.categoryId !== undefined) {
      if (updateData.categoryId && updateData.categoryId !== '' && updateData.categoryId !== 'empty' && updateData.categoryId !== 'none') {
        updatePayload.category = {
          connect: {
            id: updateData.categoryId,
          },
        };
      } else {
        updatePayload.category = {
          disconnect: true,
        };
      }
    }

    // If amount is being updated, calculate the difference to update the budget total
    let amountDifference = 0;
    if (updateData.amount !== undefined) {
      updatePayload.amount = updateData.amount;
      amountDifference = updateData.amount - existingItem.amount;
    }

    // Update the budget item
    const budgetItem = await prisma.budgetItem.update({
      where: {
        id,
      },
      data: updatePayload,
      include: {
        category: true,
        budget: true,
      },
    });

    // If amount changed, update the budget's total budget
    if (amountDifference !== 0) {
      await prisma.budget.update({
        where: {
          id: existingItem.budgetId,
        },
        data: {
          totalBudget: {
            increment: amountDifference,
          },
        },
      });
    }

    // If spent amount changed, update the budget's total spent
    if (updateData.spent !== undefined) {
      const spentDifference = updateData.spent - existingItem.spent;

      if (spentDifference !== 0) {
        await prisma.budget.update({
          where: {
            id: existingItem.budgetId,
          },
          data: {
            totalSpent: {
              increment: spentDifference,
            },
          },
        });
      }
    }

    return NextResponse.json(budgetItem);
  } catch (error: any) {
    console.error('Error updating budget item:', error);
    return NextResponse.json(
      { error: 'Failed to update budget item' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Delete a budget item
 *
 * Query parameters:
 * - id: The ID of the budget item to delete
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

    // Get the budget item ID from query parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Budget item ID is required' },
        { status: 400 }
      );
    }

    // Check if the budget item exists and belongs to the company
    const existingItem = await prisma.budgetItem.findFirst({
      where: {
        id,
        budget: {
          companyId,
        },
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Budget item not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }

    // Delete the budget item
    await prisma.budgetItem.delete({
      where: {
        id,
      },
    });

    // Update the budget's total budget and spent amounts
    await prisma.budget.update({
      where: {
        id: existingItem.budgetId,
      },
      data: {
        totalBudget: {
          decrement: existingItem.amount,
        },
        totalSpent: {
          decrement: existingItem.spent,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting budget item:', error);
    return NextResponse.json(
      { error: 'Failed to delete budget item' },
      { status: 500 }
    );
  }
}
