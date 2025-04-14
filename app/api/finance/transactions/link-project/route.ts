import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { linkTransactionToProject } from '@/lib/project-finance-integration';

// Validation schema for linking a transaction to a project
const linkTransactionSchema = z.object({
  transactionId: z.string().min(1, "Transaction ID is required"),
  projectId: z.string().min(1, "Project ID is required"),
});

export async function POST(request: NextRequest) {
  try {
    // Get the token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the token
    const payload = await verifyAuth(token);
    if (!payload.email) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get the user and company
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (!user || !user.companyId) {
      return NextResponse.json({ error: 'User or company not found' }, { status: 404 });
    }

    const companyId = user.companyId;

    // Parse and validate the request body
    const body = await request.json();
    const validationResult = linkTransactionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { transactionId, projectId } = validationResult.data;

    // Check if the transaction exists and belongs to the company
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        companyId,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found or you do not have permission to access it' },
        { status: 404 }
      );
    }

    // Check if the project exists and belongs to the company
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        companyId,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or you do not have permission to access it' },
        { status: 404 }
      );
    }

    // Link the transaction to the project
    const updatedTransaction = await linkTransactionToProject(
      transactionId,
      projectId,
      user.id
    );

    if (!updatedTransaction) {
      return NextResponse.json(
        { error: 'Failed to link transaction to project' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transaction: updatedTransaction,
    });
  } catch (error) {
    console.error('Error linking transaction to project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
