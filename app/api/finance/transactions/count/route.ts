import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserCompanyId } from '@/lib/auth';

/**
 * GET: Count transactions with various filters
 * 
 * Query parameters:
 * - categoryId: Filter by category ID
 * - accountId: Filter by account ID
 * - type: Filter by transaction type (income, expense)
 * - status: Filter by transaction status
 * - startDate: Filter by date range (start)
 * - endDate: Filter by date range (end)
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
    const categoryId = searchParams.get('categoryId');
    const accountId = searchParams.get('accountId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Build the filter conditions
    const where: any = { companyId };
    
    if (categoryId) where.categoryId = categoryId;
    if (accountId) where.accountId = accountId;
    if (type) where.type = type;
    if (status) where.status = status;
    
    // Add date range filter if provided
    if (startDate || endDate) {
      where.date = {};
      
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }
    
    // Count transactions
    const count = await prisma.transaction.count({
      where,
    });
    
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error counting transactions:', error);
    return NextResponse.json(
      { error: 'Failed to count transactions' },
      { status: 500 }
    );
  }
}
