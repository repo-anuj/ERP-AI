import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';


export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// GET /api/hr/recruitment/background-checks/[id] - Get specific background check
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
    if (!payload?.email) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    // Get user to find companyId
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      select: { companyId: true }
    });

    if (!user?.companyId) {
      return new NextResponse('Company not found', { status: 401 });
    }

    const backgroundCheck = await prisma.backgroundCheck.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            currentCompany: true,
            currentPosition: true,
          }
        }
      }
    });

    if (!backgroundCheck) {
      return new NextResponse('Background check not found', { status: 404 });
    }
    return NextResponse.json({ backgroundCheck });

  } catch (error) {
    console.error('Error fetching background check:', error);
    return new NextResponse('Failed to fetch background check', { status: 500 });
  }
}

// PUT /api/hr/recruitment/background-checks/[id] - Update background check
export async function PUT(
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
    if (!payload?.email) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    // Get user to find companyId
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      select: { companyId: true }
    });

    if (!user?.companyId) {
      return new NextResponse('Company not found', { status: 401 });
    }

    const body = await request.json();
    const {
      status,
      result,
      vendor,
      vendorComments,
      internalNotes,
      completedAt,
      cost,
      verificationData,
      documents = []
    } = body;

    // Check if background check exists and belongs to company
    const existingCheck = await prisma.backgroundCheck.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      }
    });

    if (!existingCheck) {
      return new NextResponse('Background check not found', { status: 404 });
    }

    // Update background check
    const backgroundCheck = await prisma.backgroundCheck.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(result && { result }),
        ...(vendor && { vendor }),
        ...(vendorComments && { vendorComments }),
        ...(internalNotes && { internalNotes }),
        ...(completedAt && { completedAt: new Date(completedAt) }),
        ...(cost && { cost }),
        ...(verificationData && { verificationData }),
        ...(documents && { documents }),
        updatedAt: new Date(),
      },
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Background check updated successfully',
      backgroundCheck
    });

  } catch (error) {
    console.error('Error updating background check:', error);
    return new NextResponse('Failed to update background check', { status: 500 });
  }
}

// DELETE /api/hr/recruitment/background-checks/[id] - Delete background check
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
    if (!payload?.email) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    // Get user to find companyId
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      select: { companyId: true }
    });

    if (!user?.companyId) {
      return new NextResponse('Company not found', { status: 401 });
    }

    // Check if background check exists and belongs to company
    const existingCheck = await prisma.backgroundCheck.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      }
    });

    if (!existingCheck) {
      return new NextResponse('Background check not found', { status: 404 });
    }

    // Check if background check can be deleted
    if (existingCheck.status === 'in_progress' || existingCheck.status === 'completed') {
      return new NextResponse('Cannot delete background checks that are in progress or completed. Please cancel them instead.', { status: 400 });
    }

    // Delete background check
    await prisma.backgroundCheck.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      message: 'Background check deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting background check:', error);
    return new NextResponse('Failed to delete background check', { status: 500 });
  }
}
