import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';


export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// POST /api/hr/recruitment/offers/[id]/approve - Approve offer
export async function POST(
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
      select: { id: true, companyId: true }
    });

    if (!user?.companyId) {
      return new NextResponse('Company not found', { status: 401 });
    }

    const body = await request.json();
    const { approvalComments, sendImmediately = false } = body;

    // Check if offer exists and belongs to company
    const existingOffer = await prisma.offer.findFirst({
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
          }
        },
        jobPosting: {
          select: {
            id: true,
            title: true,
          }
        }
      }
    });

    if (!existingOffer) {
      return new NextResponse('Offer not found', { status: 404 });
    }

    // Check if offer is in the right status for approval
    if (existingOffer.status !== 'pending_approval' && existingOffer.status !== 'draft') {
      return new NextResponse('Offer is not in a state that can be approved', { status: 400 });
    }
    // Prepare update data
    const updateData: any = {
      approvedBy: user.id,
      approvedAt: new Date(),
      approvalComments: approvalComments || null,
    };

    // If sending immediately, update status and set sent timestamp
    if (sendImmediately) {
      updateData.status = 'sent';
      updateData.sentAt = new Date();
    } else {
      updateData.status = 'approved';
    }

    // Update offer
    const updatedOffer = await prisma.offer.update({
      where: { id: params.id },
      data: updateData,
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        jobPosting: {
          select: {
            id: true,
            title: true,
          }
        }
      }
    });

    // TODO: Send email notification to candidate if sendImmediately is true
    // TODO: Send email notification to HR team about approval

    return NextResponse.json({
      message: sendImmediately 
        ? 'Offer approved and sent to candidate successfully'
        : 'Offer approved successfully',
      offer: updatedOffer
    });

  } catch (error) {
    console.error('Error approving offer:', error);
    return new NextResponse('Failed to approve offer', { status: 500 });
  }
}

// POST /api/hr/recruitment/offers/[id]/reject - Reject offer
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
    const { rejectionReason, rejectionComments } = body;

    // Check if offer exists and belongs to company
    const existingOffer = await prisma.offer.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      }
    });

    if (!existingOffer) {
      return new NextResponse('Offer not found', { status: 404 });
    }

    // Check if offer is in the right status for rejection
    if (existingOffer.status !== 'pending_approval') {
      return new NextResponse('Offer is not pending approval', { status: 400 });
    }
    // Update offer to rejected status
    const updatedOffer = await prisma.offer.update({
      where: { id: params.id },
      data: {
        status: 'rejected',
        approvalComments: rejectionComments || `Rejected: ${rejectionReason}`,
      },
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        jobPosting: {
          select: {
            id: true,
            title: true,
          }
        }
      }
    });

    // TODO: Send email notification to offer creator about rejection

    return NextResponse.json({
      message: 'Offer rejected successfully',
      offer: updatedOffer
    });

  } catch (error) {
    console.error('Error rejecting offer:', error);
    return new NextResponse('Failed to reject offer', { status: 500 });
  }
}
