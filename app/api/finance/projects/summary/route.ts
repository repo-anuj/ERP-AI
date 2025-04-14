import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { getProjectFinancialSummary } from '@/lib/project-finance-integration';

export async function GET(request: NextRequest) {
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

    // Get the project ID from the query string
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('id');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
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

    // Get the financial summary for the project
    const financialSummary = await getProjectFinancialSummary(projectId, companyId);

    return NextResponse.json({
      success: true,
      project,
      financialSummary,
    });
  } catch (error) {
    console.error('Error getting project financial summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
