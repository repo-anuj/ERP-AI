import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for budget category validation
const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["income", "expense"]),
  limit: z.coerce.number().min(0).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

// Helper function to check user authorization and get company ID
async function getUserCompanyId() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    throw new Error('Unauthorized');
  }

  const payload = await verifyAuth(token);

  if (!payload.email || typeof payload.email !== 'string') {
    throw new Error('Invalid token');
  }

  const user = await prisma.user.findUnique({
    where: { email: payload.email },
    include: { company: true }
  });

  if (!user?.companyId) {
    throw new Error('Company not found');
  }

  return user.companyId;
}

export async function GET(req: Request) {
  try {
    // Get search params
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const type = url.searchParams.get('type');

    const companyId = await getUserCompanyId();

    // If ID is provided, fetch a single category
    if (id) {
      const category = await prisma.budgetCategory.findFirst({
        where: {
          id,
          companyId
        }
      });

      if (!category) {
        return NextResponse.json(
          { error: "Category not found or you don't have permission to access it" },
          { status: 404 }
        );
      }

      return NextResponse.json(category);
    }

    // Otherwise, build filter conditions for listing categories
    const where: any = { companyId };

    if (type) {
      where.type = type;
    }

    // Get categories with filters
    const categories = await prisma.budgetCategory.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    if ((error as Error).message === 'Unauthorized') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    if ((error as Error).message === 'Company not found') {
      return new NextResponse('Company not found', { status: 404 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const companyId = await getUserCompanyId();
    const data = await req.json();

    // Validate input data
    const validatedData = categorySchema.parse(data);

    // Check if a category with the same name already exists
    const existingCategory = await prisma.budgetCategory.findFirst({
      where: {
        name: validatedData.name,
        companyId
      }
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "A category with this name already exists" },
        { status: 400 }
      );
    }

    // Create the category
    const category = await prisma.budgetCategory.create({
      data: {
        ...validatedData,
        companyId
      }
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    if ((error as Error).message === 'Unauthorized') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    if ((error as Error).message === 'Company not found') {
      return new NextResponse('Company not found', { status: 404 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const companyId = await getUserCompanyId();
    const data = await req.json();

    // Ensure ID is provided
    if (!data.id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    // Validate input data (excluding id)
    const { id, ...updateData } = data;
    const validatedData = categorySchema.parse(updateData);

    // Check if category exists and belongs to the company
    const existingCategory = await prisma.budgetCategory.findFirst({
      where: {
        id,
        companyId
      }
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found or you don't have permission to update it" },
        { status: 404 }
      );
    }

    // Check if the new name would conflict with another category
    if (validatedData.name !== existingCategory.name) {
      const nameConflict = await prisma.budgetCategory.findFirst({
        where: {
          name: validatedData.name,
          companyId,
          id: { not: id }
        }
      });

      if (nameConflict) {
        return NextResponse.json(
          { error: "A category with this name already exists" },
          { status: 400 }
        );
      }
    }

    const updatedCategory = await prisma.budgetCategory.update({
      where: { id },
      data: validatedData
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    if ((error as Error).message === 'Unauthorized') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    if ((error as Error).message === 'Company not found') {
      return new NextResponse('Company not found', { status: 404 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const companyId = await getUserCompanyId();
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    // Check if category exists and belongs to the company
    const existingCategory = await prisma.budgetCategory.findFirst({
      where: {
        id,
        companyId
      }
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found or you don't have permission to delete it" },
        { status: 404 }
      );
    }

    // Check if the category is in use by any transactions
    const transactionsUsingCategory = await prisma.transaction.findFirst({
      where: {
        categoryId: id,
        companyId
      }
    });

    if (transactionsUsingCategory) {
      return NextResponse.json(
        { error: "Cannot delete category that is being used by transactions" },
        { status: 400 }
      );
    }

    // Delete the category
    await prisma.budgetCategory.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    if ((error as Error).message === 'Unauthorized') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    if ((error as Error).message === 'Company not found') {
      return new NextResponse('Company not found', { status: 404 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}