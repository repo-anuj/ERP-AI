import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getUserCompanyId } from '@/lib/auth';

// Validation schema for transaction data
const transactionSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Category is required'),
  categoryId: z.string().optional(),
  account: z.string().min(1, 'Account is required'),
  accountId: z.string().optional(),
  reference: z.string().optional(),
  status: z.enum(['pending', 'completed', 'failed']).default('completed'),
  recurring: z.boolean().default(false),
  notes: z.string().optional(),
  projectId: z.string().optional(),
  attachments: z.string().optional(),
  tags: z.string().optional(),
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
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const category = searchParams.get('category');
    const account = searchParams.get('account');
    const status = searchParams.get('status');
    
    // Build the query filter
    const filter: any = { companyId };
    
    if (id) {
      // If ID is provided, get a specific transaction
      const transaction = await prisma.transaction.findFirst({
        where: {
          id,
          companyId,
        },
        include: {
          category: true,
        },
      });
      
      if (!transaction) {
        return NextResponse.json(
          { error: 'Transaction not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(transaction);
    }
    
    // Apply filters if provided
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (category) filter.categoryId = category;
    if (account) filter.accountId = account;
    
    // Date filtering
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.gte = new Date(startDate);
      if (endDate) filter.date.lte = new Date(endDate);
    }
    
    // Get all transactions for this company with filters
    const transactions = await prisma.transaction.findMany({
      where: filter,
      include: {
        category: true,
        account: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
    
    return NextResponse.json(transactions);
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
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
    
    // Get the user ID from the token
    const user = await prisma.user.findFirst({
      where: {
        companyId,
      },
      select: {
        id: true,
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Parse and validate the request body
    const body = await request.json();
    const validationResult = transactionSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid transaction data', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const transactionData = validationResult.data;
    
    // Look up or create the category
    let categoryId = transactionData.categoryId;
    
    if (!categoryId) {
      // Try to find existing category with this name
      const existingCategory = await prisma.budgetCategory.findFirst({
        where: {
          name: transactionData.category,
          companyId,
        },
      });
      
      if (existingCategory) {
        categoryId = existingCategory.id;
      } else {
        // Create a new category
        const newCategory = await prisma.budgetCategory.create({
          data: {
            name: transactionData.category,
            type: transactionData.type,
            company: {
              connect: {
                id: companyId,
              },
            },
          },
        });
        
        categoryId = newCategory.id;
      }
    }
    
    // Look up or create the account
    let accountId = transactionData.accountId;
    
    if (!accountId) {
      // Try to find existing account with this name
      const existingAccount = await prisma.financialAccount.findFirst({
        where: {
          name: transactionData.account,
          companyId,
        },
      });
      
      if (existingAccount) {
        accountId = existingAccount.id;
      } else {
        // Create a new account with default values
        const newAccount = await prisma.financialAccount.create({
          data: {
            name: transactionData.account,
            type: 'bank', // Default type
            currency: 'USD',
            company: {
              connect: {
                id: companyId,
              },
            },
          },
        });
        
        accountId = newAccount.id;
      }
    }
    
    // Create the transaction
    const transaction = await prisma.transaction.create({
      data: {
        date: new Date(transactionData.date),
        description: transactionData.description,
        amount: transactionData.amount,
        type: transactionData.type,
        reference: transactionData.reference,
        status: transactionData.status,
        recurring: transactionData.recurring,
        notes: transactionData.notes,
        company: {
          connect: {
            id: companyId,
          },
        },
        user: {
          connect: {
            id: user.id,
          },
        },
        ...(categoryId && {
          category: {
            connect: {
              id: categoryId,
            },
          },
        }),
        ...(accountId && {
          account: {
            connect: {
              id: accountId,
            },
          },
        }),
        ...(transactionData.projectId && {
          relatedTo: {
            connect: {
              id: transactionData.projectId,
            },
          },
        }),
      },
    });
    
    // If the transaction is completed, update the account balance
    if (transactionData.status === 'completed' && accountId) {
      const account = await prisma.financialAccount.findUnique({
        where: { id: accountId },
      });
      
      if (account) {
        let balanceChange = transactionData.amount;
        
        // If it's an expense, subtract the amount
        if (transactionData.type === 'expense') {
          balanceChange = -balanceChange;
        }
        
        // For credit accounts, the logic is reversed
        if (account.type === 'credit') {
          balanceChange = -balanceChange;
        }
        
        await prisma.financialAccount.update({
          where: { id: accountId },
          data: {
            balance: {
              increment: balanceChange,
            },
          },
        });
      }
    }
    
    return NextResponse.json(transaction, { status: 201 });
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
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
    
    // Get the transaction ID from the query parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }
    
    // Check if the transaction exists and belongs to the user's company
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        account: true,
      },
    });
    
    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }
    
    // Parse and validate the request body
    const body = await request.json();
    const validationResult = transactionSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid transaction data', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const transactionData = validationResult.data;
    
    // Look up or create the category
    let categoryId = transactionData.categoryId;
    
    if (!categoryId) {
      // Try to find existing category with this name
      const existingCategory = await prisma.budgetCategory.findFirst({
        where: {
          name: transactionData.category,
          companyId,
        },
      });
      
      if (existingCategory) {
        categoryId = existingCategory.id;
      } else {
        // Create a new category
        const newCategory = await prisma.budgetCategory.create({
          data: {
            name: transactionData.category,
            type: transactionData.type,
            company: {
              connect: {
                id: companyId,
              },
            },
          },
        });
        
        categoryId = newCategory.id;
      }
    }
    
    // Look up or create the account
    let accountId = transactionData.accountId;
    
    if (!accountId) {
      // Try to find existing account with this name
      const existingAccount = await prisma.financialAccount.findFirst({
        where: {
          name: transactionData.account,
          companyId,
        },
      });
      
      if (existingAccount) {
        accountId = existingAccount.id;
      } else {
        // Create a new account with default values
        const newAccount = await prisma.financialAccount.create({
          data: {
            name: transactionData.account,
            type: 'bank', // Default type
            currency: 'USD',
            company: {
              connect: {
                id: companyId,
              },
            },
          },
        });
        
        accountId = newAccount.id;
      }
    }
    
    // If the transaction status is changing, or amount is changing, or account is changing,
    // we need to update account balances
    const statusChanging = existingTransaction.status !== transactionData.status;
    const amountChanging = existingTransaction.amount !== transactionData.amount;
    const typeChanging = existingTransaction.type !== transactionData.type;
    const accountChanging = existingTransaction.accountId !== accountId;
    
    // First, reverse the effect of the original transaction if it was completed
    if (existingTransaction.status === 'completed' && existingTransaction.accountId) {
      const originalAccount = await prisma.financialAccount.findUnique({
        where: { id: existingTransaction.accountId },
      });
      
      if (originalAccount) {
        let balanceChange = existingTransaction.amount;
        
        // If it was an expense, we add the amount back
        if (existingTransaction.type === 'expense') {
          balanceChange = balanceChange;
        } else {
          balanceChange = -balanceChange;
        }
        
        // For credit accounts, the logic is reversed
        if (originalAccount.type === 'credit') {
          balanceChange = -balanceChange;
        }
        
        await prisma.financialAccount.update({
          where: { id: existingTransaction.accountId },
          data: {
            balance: {
              increment: balanceChange,
            },
          },
        });
      }
    }
    
    // Update the transaction
    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        date: new Date(transactionData.date),
        description: transactionData.description,
        amount: transactionData.amount,
        type: transactionData.type,
        reference: transactionData.reference,
        status: transactionData.status,
        recurring: transactionData.recurring,
        notes: transactionData.notes,
        categoryId: categoryId,
        accountId: accountId,
        ...(transactionData.projectId && {
          projectId: transactionData.projectId,
        }),
      },
    });
    
    // If the updated transaction is completed, apply the effect to the account
    if (transactionData.status === 'completed' && accountId) {
      const account = await prisma.financialAccount.findUnique({
        where: { id: accountId },
      });
      
      if (account) {
        let balanceChange = transactionData.amount;
        
        // If it's an expense, subtract the amount
        if (transactionData.type === 'expense') {
          balanceChange = -balanceChange;
        }
        
        // For credit accounts, the logic is reversed
        if (account.type === 'credit') {
          balanceChange = -balanceChange;
        }
        
        await prisma.financialAccount.update({
          where: { id: accountId },
          data: {
            balance: {
              increment: balanceChange,
            },
          },
        });
      }
    }
    
    return NextResponse.json(transaction);
  } catch (error: any) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to update transaction' },
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
    
    // Get the transaction ID from the query parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }
    
    // Check if the transaction exists and belongs to the user's company
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        account: true,
      },
    });
    
    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }
    
    // If the transaction was completed, reverse its effect on the account balance
    if (existingTransaction.status === 'completed' && existingTransaction.accountId) {
      const account = await prisma.financialAccount.findUnique({
        where: { id: existingTransaction.accountId },
      });
      
      if (account) {
        let balanceChange = existingTransaction.amount;
        
        // If it was an expense, add the amount back
        if (existingTransaction.type === 'expense') {
          balanceChange = balanceChange;
        } else {
          balanceChange = -balanceChange;
        }
        
        // For credit accounts, the logic is reversed
        if (account.type === 'credit') {
          balanceChange = -balanceChange;
        }
        
        await prisma.financialAccount.update({
          where: { id: existingTransaction.accountId },
          data: {
            balance: {
              increment: balanceChange,
            },
          },
        });
      }
    }
    
    // Delete the transaction
    await prisma.transaction.delete({
      where: { id },
    });
    
    return NextResponse.json(
      { message: 'Transaction deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    );
  }
} 