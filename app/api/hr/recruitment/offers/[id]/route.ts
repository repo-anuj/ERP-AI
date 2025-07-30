import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';


export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// GET /api/hr/recruitment/offers/[id] - Get specific offer
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
      select: { id: true, companyId: true }
    });

    if (!user?.companyId) {
      return new NextResponse('Company not found', { status: 401 });
    }

    const offer = await prisma.offer.findFirst({
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
            totalExperience: true,
            currentSalary: true,
            expectedSalary: true,
            noticePeriod: true,
            skills: true,
            resumeUrl: true,
          }
        },
        jobPosting: {
          select: {
            id: true,
            title: true,
            description: true,
            requirements: true,
            department: {
              select: { id: true, name: true }
            },
            location: {
              select: { id: true, name: true, city: true, state: true }
            },
            salaryMin: true,
            salaryMax: true,
            currency: true,
          }
        }
      }
    });

    if (!offer) {
      return new NextResponse('Offer not found', { status: 404 });
    }
    return NextResponse.json({ offer });

  } catch (error) {
    console.error('Error fetching offer:', error);
    return new NextResponse('Failed to fetch offer', { status: 500 });
  }
}

// PUT /api/hr/recruitment/offers/[id] - Update offer
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
      position,
      department,
      location,
      startDate,
      baseSalary,
      currency,
      salaryFrequency,
      bonus,
      equity,
      benefits,
      employmentType,
      probationPeriod,
      noticePeriod,
      status,
      responseDeadline,
      approvalComments,
      candidateResponse,
      counterOffer,
      negotiationHistory,
      offerLetterUrl,
      contractUrl,
    } = body;

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
    // Prepare update data
    const updateData: any = {};

    if (position !== undefined) updateData.position = position;
    if (department !== undefined) updateData.department = department || null;
    if (location !== undefined) updateData.location = location || null;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (baseSalary !== undefined) updateData.baseSalary = parseFloat(baseSalary);
    if (currency !== undefined) updateData.currency = currency;
    if (salaryFrequency !== undefined) updateData.salaryFrequency = salaryFrequency;
    if (bonus !== undefined) updateData.bonus = bonus ? parseFloat(bonus) : null;
    if (equity !== undefined) updateData.equity = equity || null;
    if (benefits !== undefined) updateData.benefits = benefits || [];
    if (employmentType !== undefined) updateData.employmentType = employmentType || null;
    if (probationPeriod !== undefined) updateData.probationPeriod = probationPeriod ? parseInt(probationPeriod) : null;
    if (noticePeriod !== undefined) updateData.noticePeriod = noticePeriod ? parseInt(noticePeriod) : null;
    if (responseDeadline !== undefined) updateData.responseDeadline = responseDeadline ? new Date(responseDeadline) : null;
    if (approvalComments !== undefined) updateData.approvalComments = approvalComments || null;
    if (candidateResponse !== undefined) updateData.candidateResponse = candidateResponse || null;
    if (counterOffer !== undefined) updateData.counterOffer = counterOffer || null;
    if (offerLetterUrl !== undefined) updateData.offerLetterUrl = offerLetterUrl || null;
    if (contractUrl !== undefined) updateData.contractUrl = contractUrl || null;

    // Handle status changes
    if (status !== undefined) {
      updateData.status = status;
      
      // Set timestamps based on status
      if (status === 'sent' && !existingOffer.sentAt) {
        updateData.sentAt = new Date();
      } else if (status === 'accepted' || status === 'declined') {
        if (!existingOffer.respondedAt) {
          updateData.respondedAt = new Date();
        }
      }
    }

    // Handle negotiation history
    if (negotiationHistory !== undefined) {
      // Increment negotiation rounds if this is a new negotiation
      if (negotiationHistory && existingOffer.negotiationHistory !== negotiationHistory) {
        updateData.negotiationRounds = existingOffer.negotiationRounds + 1;
      }
      updateData.negotiationHistory = negotiationHistory || null;
    }

    // Handle approval workflow
    if (status === 'pending_approval' && existingOffer.status === 'draft') {
      // Offer submitted for approval
      updateData.status = 'pending_approval';
    } else if (status === 'sent' && existingOffer.status === 'pending_approval') {
      // Offer approved and sent
      updateData.approvedBy = user.id;
      updateData.approvedAt = new Date();
      updateData.sentAt = new Date();
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

    return NextResponse.json({
      message: 'Offer updated successfully',
      offer: updatedOffer
    });

  } catch (error) {
    console.error('Error updating offer:', error);
    return new NextResponse('Failed to update offer', { status: 500 });
  }
}

// DELETE /api/hr/recruitment/offers/[id] - Delete offer
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
      select: { id: true, companyId: true }
    });

    if (!user?.companyId) {
      return new NextResponse('Company not found', { status: 401 });
    }

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

    // Check if offer can be deleted
    if (existingOffer.status === 'sent' || existingOffer.status === 'accepted') {
      return new NextResponse('Cannot delete offers that have been sent or accepted. Please withdraw the offer instead.', { status: 400 });
    }
    // Delete offer
    await prisma.offer.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      message: 'Offer deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting offer:', error);
    return new NextResponse('Failed to delete offer', { status: 500 });
  }
}
