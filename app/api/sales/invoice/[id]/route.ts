import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
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
    const { id: saleId } = await params;
    
    // Find the sale
    const sale = await prisma.sale.findFirst({
      where: {
        id: saleId,
        companyId,
      },
      include: {
        customer: true,
        employee: true,
        items: true,
        company: true,
      },
    });
    
    if (!sale) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      );
    }
    
    // Format the invoice data
    const invoiceData = {
      id: sale.id,
      invoiceNumber: sale.invoiceNumber || `INV-${sale.id.substring(0, 8)}`,
      date: sale.date,
      status: sale.status,
      customer: {
        name: sale.customer.name,
        email: sale.customer.email,
        phone: sale.customer.phone,
        address: sale.customer.address,
      },
      company: {
        name: sale.company.name,
        email: sale.company.email || 'company@example.com',
        phone: sale.company.phone || '+1 (555) 123-4567',
        address: sale.company.address || '123 Business St, City, Country',
        logo: sale.company.logo || null,
      },
      items: sale.items.map(item => ({
        id: item.id,
        product: item.product,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      })),
      subtotal: sale.items.reduce((sum, item) => sum + item.total, 0),
      tax: sale.tax || 0,
      total: sale.total,
      notes: sale.notes,
      createdAt: sale.createdAt,
      updatedAt: sale.updatedAt,
    };
    
    // In a real application, you would generate a PDF here
    // For now, we'll just return the invoice data as JSON
    
    // In a real application, you might want to track when invoices are generated
    // For now, we'll just return the invoice data without updating the sale
    
    return NextResponse.json(invoiceData);
  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    );
  }
}
