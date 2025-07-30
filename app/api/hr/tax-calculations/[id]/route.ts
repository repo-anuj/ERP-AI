import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Fetch specific tax calculation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload.email) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      include: { company: true }
    });

    if (!user?.companyId) {
      return new NextResponse('Company not found', { status: 404 });
    }

    const { id } = params;

    const taxCalculation = await prisma.taxCalculation.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            email: true,
            taxId: true,
            department: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      }
    });

    if (!taxCalculation) {
      return new NextResponse('Tax calculation not found', { status: 404 });
    }

    return NextResponse.json(taxCalculation);

  } catch (error) {
    console.error('[TAX_CALCULATION_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// DELETE - Delete tax calculation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload.email) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      include: { company: true }
    });

    if (!user?.companyId) {
      return new NextResponse('Company not found', { status: 404 });
    }

    const { id } = params;

    // Check if tax calculation exists and belongs to the company
    const existingCalculation = await prisma.taxCalculation.findFirst({
      where: {
        id,
        companyId: user.companyId,
      }
    });

    if (!existingCalculation) {
      return new NextResponse('Tax calculation not found', { status: 404 });
    }

    // Delete the tax calculation
    await prisma.taxCalculation.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Tax calculation deleted successfully' });

  } catch (error) {
    console.error('[TAX_CALCULATION_DELETE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
