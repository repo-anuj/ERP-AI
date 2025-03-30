import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getUserCompanyId } from '@/lib/auth';

// Validation schema for account data
const accountSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  type: z.enum(["bank", "cash", "credit", "investment", "other"]),
  number: z.string().optional(),
  balance: z.coerce.number().default(0),
  currency: z.string().default("USD"),
  institutionName: z.string().optional(),
  description: z.string().optional(),
});

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
    
    // Build the query filter
    const filter: any = { companyId };
    
    if (id) {
      // If ID is provided, get a specific account
      const account = await prisma.financialAccount.findFirst({
        where: {
          id,
          companyId,
        },
      });
      
      if (!account) {
        return NextResponse.json(
          { error: 'Account not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(account);
    }
    
    // Get all accounts for this company
    const accounts = await prisma.financialAccount.findMany({
      where: filter,
      orderBy: {
        name: 'asc',
      },
    });
    
    return NextResponse.json(accounts);
  } catch (error: any) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}

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
    const validationResult = accountSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid account data', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const accountData = validationResult.data;
    
    // Check if an account with the same name already exists
    const existingAccount = await prisma.financialAccount.findFirst({
      where: {
        name: accountData.name,
        companyId,
      },
    });
    
    if (existingAccount) {
      return NextResponse.json(
        { error: 'An account with this name already exists' },
        { status: 400 }
      );
    }
    
    // Create the account
    const account = await prisma.financialAccount.create({
      data: {
        name: accountData.name,
        type: accountData.type,
        number: accountData.number,
        balance: accountData.balance,
        currency: accountData.currency,
        institutionName: accountData.institutionName,
        description: accountData.description,
        company: {
          connect: {
            id: companyId,
          },
        },
      },
    });
    
    return NextResponse.json(account, { status: 201 });
  } catch (error: any) {
    console.error('Error creating account:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}

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
    
    // Get the account ID from the query parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }
    
    // Check if the account exists and belongs to the user's company
    const existingAccount = await prisma.financialAccount.findFirst({
      where: {
        id,
        companyId,
      },
    });
    
    if (!existingAccount) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }
    
    // Parse and validate the request body
    const body = await request.json();
    const validationResult = accountSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid account data', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const accountData = validationResult.data;
    
    // Check if the account name is already taken by another account
    if (accountData.name !== existingAccount.name) {
      const nameExists = await prisma.financialAccount.findFirst({
        where: {
          name: accountData.name,
          companyId,
          id: { not: id },
        },
      });
      
      if (nameExists) {
        return NextResponse.json(
          { error: 'An account with this name already exists' },
          { status: 400 }
        );
      }
    }
    
    // Track if balance has changed
    const balanceChanged = accountData.balance !== existingAccount.balance;
    const oldBalance = existingAccount.balance;
    
    // Update the account
    const account = await prisma.financialAccount.update({
      where: { id },
      data: {
        name: accountData.name,
        type: accountData.type,
        number: accountData.number,
        balance: accountData.balance,
        currency: accountData.currency,
        institutionName: accountData.institutionName,
        description: accountData.description,
      },
    });
    
    // If balance was manually changed, create an adjustment transaction
    if (balanceChanged) {
      const adjustmentAmount = accountData.balance - oldBalance;
      
      if (adjustmentAmount !== 0) {
        await prisma.transaction.create({
          data: {
            date: new Date(),
            description: 'Balance adjustment',
            amount: Math.abs(adjustmentAmount),
            type: adjustmentAmount > 0 ? 'income' : 'expense',
            status: 'completed',
            reference: 'Manual balance adjustment',
            company: {
              connect: {
                id: companyId,
              },
            },
            account: {
              connect: {
                id: account.id,
              },
            },
            category: {
              connectOrCreate: {
                where: {
                  name_companyId: {
                    name: 'Balance Adjustment',
                    companyId,
                  },
                },
                create: {
                  name: 'Balance Adjustment',
                  type: 'other',
                  company: {
                    connect: {
                      id: companyId,
                    },
                  },
                },
              },
            },
          },
        });
      }
    }
    
    return NextResponse.json(account);
  } catch (error: any) {
    console.error('Error updating account:', error);
    return NextResponse.json(
      { error: 'Failed to update account' },
      { status: 500 }
    );
  }
}

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
    
    // Get the account ID from the query parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }
    
    // Check if the account exists and belongs to the user's company
    const existingAccount = await prisma.financialAccount.findFirst({
      where: {
        id,
        companyId,
      },
    });
    
    if (!existingAccount) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }
    
    // Check if there are any transactions associated with this account
    const transactionCount = await prisma.transaction.count({
      where: {
        accountId: id,
      },
    });
    
    if (transactionCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete an account with associated transactions' },
        { status: 400 }
      );
    }
    
    // Delete the account
    await prisma.financialAccount.delete({
      where: { id },
    });
    
    return NextResponse.json(
      { message: 'Account deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
} 