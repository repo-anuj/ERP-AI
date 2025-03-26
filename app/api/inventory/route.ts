import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for inventory item validation
const inventoryItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  category: z.string().min(1, "Category is required"),
  quantity: z.coerce.number().int().min(0, "Quantity must be a positive number"),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  status: z.enum(["In Stock", "Low Stock", "Out of Stock"]),
  description: z.string().optional(),
});

// Helper function to check user authorization and get company ID
async function getUserCompanyId() {
  const token = cookies().get('token')?.value;
  
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
    const category = url.searchParams.get('category');
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    
    const companyId = await getUserCompanyId();
    
    // Build filter conditions
    const where: any = { companyId };
    
    if (category) {
      where.category = category;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get inventory items with filters
    const inventory = await prisma.inventoryItem.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        sku: true,
        category: true,
        quantity: true,
        price: true,
        status: true,
        description: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Get categories for filtering
    const categories = await prisma.inventoryItem.groupBy({
      by: ['category'],
      where: { companyId },
    });

    return NextResponse.json({
      items: inventory,
      categories: categories.map(c => c.category),
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
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
    const validatedData = inventoryItemSchema.parse(data);
    
    // Check if SKU already exists for this company
    const existingSku = await prisma.inventoryItem.findFirst({
      where: {
        companyId,
        sku: validatedData.sku
      }
    });
    
    if (existingSku) {
      return NextResponse.json(
        { error: "An item with this SKU already exists" },
        { status: 400 }
      );
    }
    
    // Automatically set status based on quantity if not provided
    if (!validatedData.status) {
      if (validatedData.quantity === 0) {
        validatedData.status = "Out of Stock";
      } else if (validatedData.quantity <= 5) {
        validatedData.status = "Low Stock";
      } else {
        validatedData.status = "In Stock";
      }
    }

    const item = await prisma.inventoryItem.create({
      data: {
        ...validatedData,
        companyId
      }
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error creating inventory item:', error);
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
        { error: "Item ID is required" },
        { status: 400 }
      );
    }
    
    // Validate input data (excluding id)
    const { id, ...updateData } = data;
    const validatedData = inventoryItemSchema.parse(updateData);
    
    // Check if item exists and belongs to the company
    const existingItem = await prisma.inventoryItem.findFirst({
      where: {
        id,
        companyId
      }
    });
    
    if (!existingItem) {
      return NextResponse.json(
        { error: "Item not found or you don't have permission to update it" },
        { status: 404 }
      );
    }
    
    // Check if updating to a SKU that already exists (but not the current item's SKU)
    if (validatedData.sku !== existingItem.sku) {
      const existingSku = await prisma.inventoryItem.findFirst({
        where: {
          companyId,
          sku: validatedData.sku,
          id: { not: id }
        }
      });
      
      if (existingSku) {
        return NextResponse.json(
          { error: "An item with this SKU already exists" },
          { status: 400 }
        );
      }
    }
    
    // Automatically update status based on quantity if needed
    if (validatedData.quantity === 0) {
      validatedData.status = "Out of Stock";
    } else if (validatedData.quantity <= 5 && validatedData.status === "In Stock") {
      validatedData.status = "Low Stock";
    } else if (validatedData.quantity > 5 && validatedData.status === "Out of Stock") {
      validatedData.status = "In Stock";
    }

    const updatedItem = await prisma.inventoryItem.update({
      where: { id },
      data: validatedData
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error updating inventory item:', error);
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
        { error: "Item ID is required" },
        { status: 400 }
      );
    }
    
    // Check if item exists and belongs to the company
    const existingItem = await prisma.inventoryItem.findFirst({
      where: {
        id,
        companyId
      }
    });
    
    if (!existingItem) {
      return NextResponse.json(
        { error: "Item not found or you don't have permission to delete it" },
        { status: 404 }
      );
    }
    
    // Delete the item
    await prisma.inventoryItem.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    if ((error as Error).message === 'Unauthorized') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    if ((error as Error).message === 'Company not found') {
      return new NextResponse('Company not found', { status: 404 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
