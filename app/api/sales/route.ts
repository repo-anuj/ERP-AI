import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET: Fetch all sales for the company with filtering and search
export async function GET(req: NextRequest) {
  try {
    const token = cookies().get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAuth(token);
    
    if (!payload.email) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: payload.email as string },
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const companyId = user.companyId;
    
    // Parse query parameters
    const url = new URL(req.url);
    const search = url.searchParams.get('search');
    const status = url.searchParams.get('status');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const customerId = url.searchParams.get('customerId');
    const minTotal = url.searchParams.get('minTotal');
    const maxTotal = url.searchParams.get('maxTotal');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = { companyId };
    
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { email: { contains: search, mode: 'insensitive' } } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    if (startDate) {
      where.date = { ...(where.date || {}), gte: new Date(startDate) };
    }
    
    if (endDate) {
      where.date = { ...(where.date || {}), lte: new Date(endDate) };
    }
    
    if (customerId) {
      where.customerId = customerId;
    }
    
    if (minTotal) {
      where.total = { ...(where.total || {}), gte: parseFloat(minTotal) };
    }
    
    if (maxTotal) {
      where.total = { ...(where.total || {}), lte: parseFloat(maxTotal) };
    }
    
    // Count total matching records for pagination
    const totalCount = await prisma.sale.count({ where });
    
    // Fetch sales from the database
    const sales = await prisma.sale.findMany({
      where,
      include: {
        customer: true,
        employee: true,
        items: true,
      },
      orderBy: {
        date: 'desc',
      },
      skip,
      take: limit,
    });
    
    return NextResponse.json({
      data: sales,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales' },
      { status: 500 }
    );
  }
}

// POST: Create a new sale
export async function POST(req: NextRequest) {
  try {
    const token = cookies().get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAuth(token);
    
    if (!payload.email) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: payload.email as string },
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const companyId = user.companyId;
    const body = await req.json();
    
    // Validate required fields
    if (!body.customer?.name || !body.items || body.items.length === 0 || !body.date || !body.status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create or find customer
    let customer = await prisma.customer.findFirst({
      where: {
        companyId,
        name: body.customer.name,
        email: body.customer.email || undefined,
      },
    });
    
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: body.customer.name,
          email: body.customer.email || undefined,
          phone: body.customer.phone || undefined,
          address: body.customer.address || undefined,
          company: {
            connect: {
              id: companyId,
            },
          },
        },
      });
    }
    
    // Validate inventory quantities and update inventory
    const inventoryUpdates = [];
    const inventoryErrors = [];
    
    // Check inventory for each item
    for (const item of body.items) {
      // Find inventory item by ID if provided, otherwise by name
      const inventoryItem = item.productId 
        ? await prisma.inventoryItem.findFirst({
            where: {
              id: item.productId,
              companyId,
            },
          })
        : await prisma.inventoryItem.findFirst({
            where: {
              companyId,
              name: item.product,
            },
          });
      
      if (!inventoryItem) {
        inventoryErrors.push(`Product not found in inventory: ${item.product}`);
        continue;
      }
      
      if (inventoryItem.quantity < item.quantity) {
        inventoryErrors.push(`Insufficient quantity for ${item.product}. Available: ${inventoryItem.quantity}, Requested: ${item.quantity}`);
        continue;
      }
      
      // Queue inventory update
      inventoryUpdates.push({
        id: inventoryItem.id,
        quantity: inventoryItem.quantity - item.quantity,
      });
    }
    
    // If there are inventory errors, return them
    if (inventoryErrors.length > 0) {
      return NextResponse.json(
        { error: 'Inventory validation failed', details: inventoryErrors },
        { status: 400 }
      );
    }
    
    // Calculate total if not provided
    let total = body.total;
    if (!total) {
      total = body.items.reduce(
        (sum: number, item: any) => sum + (item.quantity * item.unitPrice),
        0
      );
    }
    
    // Create the sale with items
    const sale = await prisma.sale.create({
      data: {
        invoiceNumber: body.invoiceNumber || `INV-${Date.now()}`,
        date: new Date(body.date),
        status: body.status,
        total,
        tax: body.tax || undefined,
        notes: body.notes || undefined,
        customer: {
          connect: {
            id: customer.id,
          },
        },
        employee: user.role === 'employee' ? {
          connect: {
            email: user.email,
          },
        } : undefined,
        company: {
          connect: {
            id: companyId,
          },
        },
        items: {
          create: body.items.map((item: any) => ({
            product: item.product,
            description: item.description || undefined,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total || (item.quantity * item.unitPrice),
          })),
        },
      },
      include: {
        customer: true,
        employee: true,
        items: true,
      },
    });
    
    // Update inventory quantities
    for (const update of inventoryUpdates) {
      await prisma.inventoryItem.update({
        where: { id: update.id },
        data: { quantity: update.quantity },
      });
    }
    
    return NextResponse.json(sale);
  } catch (error) {
    console.error('Error creating sale:', error);
    return NextResponse.json(
      { error: 'Failed to create sale' },
      { status: 500 }
    );
  }
}

// PUT: Process a return/refund
export async function PUT(req: NextRequest) {
  try {
    const token = cookies().get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAuth(token);
    
    if (!payload.email) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: payload.email as string },
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const companyId = user.companyId;
    const body = await req.json();
    
    // Validate required fields
    if (!body.saleId || !body.reason || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Find the original sale
    const originalSale = await prisma.sale.findFirst({
      where: {
        id: body.saleId,
        companyId,
      },
      include: {
        items: true,
        customer: true,
      },
    });
    
    if (!originalSale) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      );
    }
    
    // Validate return items
    const returnErrors: string[] = [];
    const returnItems: {
      originalItemId: string;
      product: string;
      description: string | null;
      quantity: number;
      unitPrice: number;
      total: number;
    }[] = [];
    const inventoryUpdates: { id: string; quantity: number }[] = [];
    
    for (const returnItem of body.items) {
      // Find the original sale item
      const originalItem = originalSale.items.find(item => item.id === returnItem.itemId);
      
      if (!originalItem) {
        returnErrors.push(`Item with ID ${returnItem.itemId} not found in original sale`);
        continue;
      }
      
      if (returnItem.quantity > originalItem.quantity) {
        returnErrors.push(`Return quantity (${returnItem.quantity}) exceeds original quantity (${originalItem.quantity}) for ${originalItem.product}`);
        continue;
      }
      
      // Find inventory item to update
      const inventoryItem = await prisma.inventoryItem.findFirst({
        where: {
          companyId,
          name: originalItem.product,
        },
      });
      
      if (inventoryItem) {
        inventoryUpdates.push({
          id: inventoryItem.id,
          quantity: inventoryItem.quantity + returnItem.quantity,
        });
      }
      
      returnItems.push({
        originalItemId: originalItem.id,
        product: originalItem.product,
        description: originalItem.description,
        quantity: returnItem.quantity,
        unitPrice: originalItem.unitPrice,
        total: returnItem.quantity * originalItem.unitPrice,
      });
    }
    
    if (returnErrors.length > 0) {
      return NextResponse.json(
        { error: 'Return validation failed', details: returnErrors },
        { status: 400 }
      );
    }
    
    // Calculate total refund amount
    const refundTotal = returnItems.reduce((sum, item) => sum + item.total, 0);
    const refundTax = originalSale.tax 
      ? (refundTotal / originalSale.total) * originalSale.tax 
      : 0;
    
    // Create a new sale record for the return
    const returnSale = await prisma.sale.create({
      data: {
        invoiceNumber: `RET-${originalSale.invoiceNumber || Date.now()}`,
        date: new Date(),
        status: 'returned',
        total: -refundTotal, // Negative amount for return
        tax: -refundTax,
        notes: `Return for sale ${originalSale.invoiceNumber}. Reason: ${body.reason}`,
        customer: {
          connect: {
            id: originalSale.customerId,
          },
        },
        employee: user.role === 'employee' ? {
          connect: {
            email: user.email,
          },
        } : undefined,
        company: {
          connect: {
            id: companyId,
          },
        },
        items: {
          create: returnItems.map(item => ({
            product: item.product,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: -item.total, // Negative amount for return
          })),
        },
      },
      include: {
        customer: true,
        employee: true,
        items: true,
      },
    });
    
    // Update inventory quantities
    for (const update of inventoryUpdates) {
      await prisma.inventoryItem.update({
        where: { id: update.id },
        data: { quantity: update.quantity },
      });
    }
    
    // Update original sale status if all items are returned
    const allItemsReturned = originalSale.items.every(originalItem => {
      const returnedItem = returnItems.find(ri => ri.originalItemId === originalItem.id);
      return returnedItem && returnedItem.quantity === originalItem.quantity;
    });
    
    if (allItemsReturned) {
      await prisma.sale.update({
        where: { id: originalSale.id },
        data: { status: 'returned' },
      });
    } else {
      await prisma.sale.update({
        where: { id: originalSale.id },
        data: { status: 'partial-return' },
      });
    }
    
    return NextResponse.json({
      return: returnSale,
      originalSale: {
        id: originalSale.id,
        status: allItemsReturned ? 'returned' : 'partial-return',
      },
    });
  } catch (error) {
    console.error('Error processing return:', error);
    return NextResponse.json(
      { error: 'Failed to process return' },
      { status: 500 }
    );
  }
}

// PATCH: Get sales metrics
export async function PATCH(req: NextRequest) {
  try {
    const token = cookies().get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAuth(token);
    
    if (!payload.email) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: payload.email as string },
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    
    const companyId = user.companyId;
    const body = await req.json();
    
    // Get time period for comparison (default to last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (body.days || 30));
    
    // For comparison, get previous period of same length
    const prevEndDate = new Date(startDate);
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - (body.days || 30));
    
    // Get total sales count
    const totalSales = await prisma.sale.count({
      where: {
        companyId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: { not: 'returned' }, // Exclude returns
      },
    });
    
    // Get previous period sales count
    const prevTotalSales = await prisma.sale.count({
      where: {
        companyId,
        date: {
          gte: prevStartDate,
          lte: prevEndDate,
        },
        status: { not: 'returned' }, // Exclude returns
      },
    });
    
    // Get total revenue
    const revenueResult = await prisma.sale.aggregate({
      where: {
        companyId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        total: true,
      },
    });
    
    const totalRevenue = revenueResult._sum.total || 0;
    
    // Get previous period revenue
    const prevRevenueResult = await prisma.sale.aggregate({
      where: {
        companyId,
        date: {
          gte: prevStartDate,
          lte: prevEndDate,
        },
      },
      _sum: {
        total: true,
      },
    });
    
    const prevTotalRevenue = prevRevenueResult._sum.total || 0;
    
    // Get total customers
    const totalCustomers = await prisma.customer.count({
      where: {
        companyId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
    
    // Get previous period customers
    const prevTotalCustomers = await prisma.customer.count({
      where: {
        companyId,
        createdAt: {
          gte: prevStartDate,
          lte: prevEndDate,
        },
      },
    });
    
    // Calculate average order value
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
    const prevAverageOrderValue = prevTotalSales > 0 ? prevTotalRevenue / prevTotalSales : 0;
    
    // Get recent sales
    const recentSales = await prisma.sale.findMany({
      where: {
        companyId,
        status: { not: 'returned' }, // Exclude returns
      },
      include: {
        customer: true,
      },
      orderBy: {
        date: 'desc',
      },
      take: 5,
    });
    
    // Get sales by day for the current period using MongoDB aggregation
    const salesByDay = await prisma.sale.aggregateRaw({
      pipeline: [
        {
          $match: {
            companyId: { $oid: companyId },
            date: { 
              $gte: startDate,
              $lte: endDate
            },
            status: { $ne: 'returned' }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$date" }
            },
            revenue: { $sum: "$total" },
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            day: "$_id",
            revenue: 1,
            count: 1
          }
        },
        {
          $sort: { day: 1 }
        }
      ]
    });
    
    // Calculate growth percentages
    const salesGrowth = prevTotalSales > 0 
      ? ((totalSales - prevTotalSales) / prevTotalSales) * 100 
      : null;
    
    const revenueGrowth = prevTotalRevenue > 0 
      ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100 
      : null;
    
    const customerGrowth = prevTotalCustomers > 0 
      ? ((totalCustomers - prevTotalCustomers) / prevTotalCustomers) * 100 
      : null;
    
    const aovGrowth = prevAverageOrderValue > 0 
      ? ((averageOrderValue - prevAverageOrderValue) / prevAverageOrderValue) * 100 
      : null;
    
    const metrics = {
      currentPeriod: {
        totalSales,
        totalRevenue,
        totalCustomers,
        averageOrderValue,
      },
      previousPeriod: {
        totalSales: prevTotalSales,
        totalRevenue: prevTotalRevenue,
        totalCustomers: prevTotalCustomers,
        averageOrderValue: prevAverageOrderValue,
      },
      growth: {
        sales: salesGrowth,
        revenue: revenueGrowth,
        customers: customerGrowth,
        averageOrderValue: aovGrowth,
      },
      recentSales,
      salesByDay,
      timeframe: {
        start: startDate,
        end: endDate,
        days: body.days || 30,
      },
    };
    
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching sales metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales metrics' },
      { status: 500 }
    );
  }
}
