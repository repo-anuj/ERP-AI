import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserCompanyId } from '@/lib/auth';
import { recalculateAccountBalance } from '@/lib/finance-utils';

/**
 * POST: Recalculate the balance of a specific account or all accounts
 * 
 * Request body:
 * {
 *   accountId?: string // Optional - if not provided, recalculates all accounts
 * }
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
    
    // Parse the request body
    const body = await request.json();
    const { accountId } = body;
    
    // If accountId is provided, recalculate just that account
    if (accountId) {
      // Verify the account belongs to the company
      const account = await prisma.financialAccount.findFirst({
        where: {
          id: accountId,
          companyId,
        },
      });
      
      if (!account) {
        return NextResponse.json(
          { error: 'Account not found or you do not have permission to access it' },
          { status: 404 }
        );
      }
      
      const success = await recalculateAccountBalance(accountId);
      
      if (!success) {
        return NextResponse.json(
          { error: 'Failed to recalculate account balance' },
          { status: 500 }
        );
      }
      
      // Get the updated account
      const updatedAccount = await prisma.financialAccount.findUnique({
        where: { id: accountId },
      });
      
      return NextResponse.json({
        message: 'Account balance recalculated successfully',
        account: updatedAccount,
      });
    } 
    // Otherwise, recalculate all accounts for the company
    else {
      // Get all accounts for the company
      const accounts = await prisma.financialAccount.findMany({
        where: { companyId },
      });
      
      const results = [];
      
      // Recalculate each account
      for (const account of accounts) {
        const success = await recalculateAccountBalance(account.id);
        
        results.push({
          accountId: account.id,
          accountName: account.name,
          success,
        });
      }
      
      // Get all updated accounts
      const updatedAccounts = await prisma.financialAccount.findMany({
        where: { companyId },
      });
      
      return NextResponse.json({
        message: 'Account balances recalculated',
        results,
        accounts: updatedAccounts,
      });
    }
  } catch (error) {
    console.error('Error recalculating account balances:', error);
    return NextResponse.json(
      { error: 'Failed to recalculate account balances' },
      { status: 500 }
    );
  }
}
