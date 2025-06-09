import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);

    if (!payload?.email) {
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

    return NextResponse.json(inventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);

    if (!payload?.email) {
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