import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';


export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// POST /api/hr/recruitment/offers/[id]/respond - Candidate response to offer
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
      select: { companyId: true }
    });

    if (!user?.companyId) {
      return new NextResponse('Company not found', { status: 401 });
    }

    const body = await request.json();
    const { 
      response, // 'accepted', 'declined', 'counter_offer'
      candidateResponse, 
      counterOffer,
      negotiationComments 
    } = body;

    // Validate required fields
    if (!response || !['accepted', 'declined', 'counter_offer'].includes(response)) {
      return new NextResponse('Invalid response. Must be accepted, declined, or counter_offer', { status: 400 });
    }

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

    // Check if offer is in the right status for response
    if (existingOffer.status !== 'sent') {
      return new NextResponse('Offer is not available for response', { status: 400 });
    }

    // Check if response deadline has passed
    if (existingOffer.responseDeadline && new Date() > existingOffer.responseDeadline) {
      return new NextResponse('Response deadline has passed', { status: 400 });
    }

    // Prepare update data based on response type
    const updateData: any = {
      candidateResponse: candidateResponse || null,
      respondedAt: new Date(),
    };

    // Handle different response types
    switch (response) {
      case 'accepted':
        updateData.status = 'accepted';
        // TODO: Trigger onboarding workflow
        // TODO: Update candidate status to 'hired'
        // TODO: Close related job applications
        break;

      case 'declined':
        updateData.status = 'declined';
        // TODO: Update candidate status back to available
        break;

      case 'counter_offer':
        updateData.status = 'negotiating';
        updateData.counterOffer = counterOffer || null;
        updateData.negotiationRounds = existingOffer.negotiationRounds + 1;
        
        // Update negotiation history
        const currentHistory = (existingOffer.negotiationHistory as any[]) || [];
        const newNegotiation = {
          round: existingOffer.negotiationRounds + 1,
          type: 'candidate_counter',
          timestamp: new Date().toISOString(),
          details: counterOffer,
          comments: negotiationComments,
        };
        updateData.negotiationHistory = [...currentHistory, newNegotiation];
        break;
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

    // Update candidate status if offer was accepted
    if (response === 'accepted') {
      await prisma.candidate.update({
        where: { id: existingOffer.candidateId },
        data: { status: 'hired' }
      });

      // Update related applications to hired status
      await prisma.jobApplication.updateMany({
        where: { 
          candidateId: existingOffer.candidateId,
          status: { not: 'hired' }
        },
        data: { status: 'hired' }
      });
    }

    // TODO: Send email notifications to HR team
    // TODO: Send confirmation email to candidate

    const responseMessages = {
      accepted: 'Offer accepted successfully! Welcome to the team.',
      declined: 'Offer declined. Thank you for your consideration.',
      counter_offer: 'Counter offer submitted successfully. We will review and respond soon.'
    };

    return NextResponse.json({
      message: responseMessages[response as keyof typeof responseMessages],
      offer: updatedOffer
    });

  } catch (error) {
    console.error('Error processing offer response:', error);
    return new NextResponse('Failed to process offer response', { status: 500 });
  }
}

// PUT /api/hr/recruitment/offers/[id]/respond - Update negotiation (HR response to counter offer)
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
      select: { id: true, companyId: true }
    });

    if (!user?.companyId) {
      return new NextResponse('Company not found', { status: 401 });
    }

    const body = await request.json();
    const { 
      action, // 'accept_counter', 'reject_counter', 'make_counter'
      revisedOffer,
      negotiationComments,
      finalOffer = false
    } = body;

    // Validate required fields
    if (!action || !['accept_counter', 'reject_counter', 'make_counter'].includes(action)) {
      return new NextResponse('Invalid action. Must be accept_counter, reject_counter, or make_counter', { status: 400 });
    }

    // Check if offer exists and belongs to company
    const existingOffer = await prisma.offer.findFirst({
      where: {
        id: params.id,
        companyId: user?.companyId || '',
      }
    });

    if (!existingOffer) {
      return new NextResponse('Offer not found', { status: 404 });
    }

    // Check if offer is in negotiation status
    if (existingOffer!.status !== 'negotiating') {
      return new NextResponse('Offer is not in negotiation status', { status: 400 });
    }
    // Prepare update data based on action
    const updateData: any = {
      negotiationRounds: existingOffer!.negotiationRounds + 1,
    };

    // Update negotiation history
    const currentHistory = (existingOffer!.negotiationHistory as any[]) || [];
    const newNegotiation = {
      round: existingOffer!.negotiationRounds + 1,
      type: `hr_${action}`,
      timestamp: new Date().toISOString(),
      details: revisedOffer,
      comments: negotiationComments,
      finalOffer,
    };

    switch (action) {
      case 'accept_counter':
        updateData.status = 'sent';
        updateData.sentAt = new Date();
        // Apply counter offer terms to the main offer
        if (revisedOffer) {
          Object.assign(updateData, revisedOffer);
        }
        break;

      case 'reject_counter':
        updateData.status = 'declined';
        updateData.candidateResponse = 'Counter offer rejected by company';
        break;

      case 'make_counter':
        updateData.status = 'sent';
        updateData.sentAt = new Date();
        // Apply revised offer terms
        if (revisedOffer) {
          Object.assign(updateData, revisedOffer);
        }
        break;
    }

    updateData.negotiationHistory = [...currentHistory, newNegotiation];

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

    // TODO: Send email notification to candidate
    // TODO: Generate updated offer letter if terms changed

    const actionMessages = {
      accept_counter: 'Counter offer accepted and sent to candidate',
      reject_counter: 'Counter offer rejected',
      make_counter: 'Revised offer sent to candidate'
    };

    return NextResponse.json({
      message: actionMessages[action as keyof typeof actionMessages],
      offer: updatedOffer
    });

  } catch (error) {
    console.error('Error processing negotiation:', error);
    return new NextResponse('Failed to process negotiation', { status: 500 });
  }
}
