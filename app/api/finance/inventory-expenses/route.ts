import { NextResponse } from 'next/server';
import { getUserCompanyId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    // Get company ID from authenticated user
    const companyId = await getUserCompanyId();
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Build the query filter
    const where: any = { companyId };
    
    // Date filtering if provided
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    
    // Get inventory items
    const inventoryItems = await prisma.inventoryItem.findMany({
      where,
      select: {
        id: true,
        name: true,
        sku: true,
        category: true,
        quantity: true,
        price: true,
        status: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Transform inventory items into transaction-like objects
    const inventoryExpenses = inventoryItems.map(item => ({
      id: `inventory-${item.id}`,
      date: item.createdAt,
      description: `Inventory: ${item.name} (${item.sku})`,
      amount: item.price * item.quantity,
      type: 'expense',
      category: 'Inventory',
      account: 'Inventory Account',
      reference: item.sku,
      status: 'completed',
      sourceType: 'inventory',
      originalData: item
    }));
    
    return NextResponse.json(inventoryExpenses);
  } catch (error) {
    console.error('Error fetching inventory expenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory expenses' },
      { status: 500 }
    );
  }
}
