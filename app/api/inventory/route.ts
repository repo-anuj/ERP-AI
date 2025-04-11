import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const token = cookies().get('token')?.value;
    
    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);
    
    if (!payload.email) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      include: { company: true }
    });

    if (!user?.companyId) {
      return new NextResponse('Company not found', { status: 404 });
    }

    const inventory = await prisma.inventoryItem.findMany({
      where: { companyId: user.companyId },
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

    return NextResponse.json({ items: inventory });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const token = cookies().get('token')?.value;
    
    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);
    
    if (!payload.email) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      include: { company: true }
    });

    if (!user?.companyId) {
      return new NextResponse('Company not found', { status: 404 });
    }

    const data = await req.json();
    const item = await prisma.inventoryItem.create({
      data: {
        name: data.name,
        sku: data.sku,
        category: data.category,
        quantity: parseInt(data.quantity),
        price: parseFloat(data.price),
        status: data.status,
        description: data.description,
        companyId: user.companyId
      }
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error creating inventory item:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// PUT: Update an existing inventory item
export async function PUT(req: Request) {
  try {
    const token = cookies().get('token')?.value;
    
    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);
    
    if (!payload.email) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (!user?.companyId) {
      return new NextResponse('Company not found', { status: 404 });
    }

    const data = await req.json();

    // Validate required data
    if (!data.id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Find the item to ensure it belongs to the company
    const existingItem = await prisma.inventoryItem.findFirst({
      where: {
        id: data.id,
        companyId: user.companyId,
      },
    });

    if (!existingItem) {
      return NextResponse.json({ error: 'Product not found or access denied' }, { status: 404 });
    }

    // Update the item
    const updatedItem = await prisma.inventoryItem.update({
      where: { id: data.id },
      data: {
        name: data.name,
        sku: data.sku,
        category: data.category,
        quantity: parseInt(data.quantity),
        price: parseFloat(data.price),
        status: data.status,
        description: data.description,
        // Ensure companyId is not changed
        companyId: user.companyId, 
      },
      select: { // Select the fields to return
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

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    return NextResponse.json({ error: 'Failed to update inventory item' }, { status: 500 });
  }
}