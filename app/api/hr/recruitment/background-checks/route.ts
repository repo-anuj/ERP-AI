import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/hr/recruitment/background-checks - Get all background checks
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const candidateId = searchParams.get('candidateId');
    const checkType = searchParams.get('checkType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build filter conditions
    const where: any = {
      companyId: user.companyId,
    };

    if (status) where.status = status;
    if (candidateId) where.candidateId = candidateId;
    if (checkType) where.checkType = checkType;

    if (search) {
      where.OR = [
        {
          candidate: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ]
          }
        },
        { referenceNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count for pagination
    const totalCount = await prisma.backgroundCheck.count({ where });

    // Get background checks with relations
    const backgroundChecks = await prisma.backgroundCheck.findMany({
      where,
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
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      backgroundChecks,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      }
    });

  } catch (error) {
    console.error('Error fetching background checks:', error);
    return new NextResponse('Failed to fetch background checks', { status: 500 });
  }
}

// POST /api/hr/recruitment/background-checks - Create new background check
export async function POST(request: NextRequest) {
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
      select: { companyId: true, id: true }
    });

    if (!user?.companyId) {
      return new NextResponse('Company not found', { status: 401 });
    }

    const body = await request.json();
    const {
      candidateId,
      checkType,
      notes,
      expectedDate,
    } = body;

    // Validate required fields
    if (!candidateId || !checkType) {
      return new NextResponse('Missing required fields: candidateId, checkType', { status: 400 });
    }

    // Check if candidate exists and belongs to company
    const candidate = await prisma.candidate.findFirst({
      where: {
        id: candidateId,
        companyId: user.companyId,
      }
    });

    if (!candidate) {
      return new NextResponse('Candidate not found', { status: 404 });
    }

    // Generate reference number
    const referenceNumber = `BGC-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Create background check
    const backgroundCheck = await prisma.backgroundCheck.create({
      data: {
        candidateId,
        checkType,
        vendor: null,
        referenceNumber,
        status: 'initiated',
        requestedAt: new Date(),
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        internalNotes: notes || null,
        companyId: user.companyId,
        initiatedBy: user.id,
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
      message: 'Background check created successfully',
      backgroundCheck
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating background check:', error);
    return new NextResponse('Failed to create background check', { status: 500 });
  }
}

// PUT /api/hr/recruitment/background-checks - Update background check
export async function PUT(request: NextRequest) {
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
      select: { companyId: true, id: true }
    });

    if (!user?.companyId) {
      return new NextResponse('Company not found', { status: 401 });
    }

    const body = await request.json();
    const {
      id,
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

    // Validate required fields
    if (!id) {
      return new NextResponse('Missing required field: id', { status: 400 });
    }

    // Check if background check exists and belongs to company
    const existingCheck = await prisma.backgroundCheck.findFirst({
      where: {
        id,
        companyId: user.companyId,
      }
    });

    if (!existingCheck) {
      return new NextResponse('Background check not found', { status: 404 });
    }

    // Update background check
    const backgroundCheck = await prisma.backgroundCheck.update({
      where: { id },
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

// DELETE /api/hr/recruitment/background-checks - Delete background check
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new NextResponse('Missing required parameter: id', { status: 400 });
    }

    // Check if background check exists and belongs to company
    const existingCheck = await prisma.backgroundCheck.findFirst({
      where: {
        id,
        companyId: user.companyId,
      }
    });

    if (!existingCheck) {
      return new NextResponse('Background check not found', { status: 404 });
    }

    // Delete background check
    await prisma.backgroundCheck.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Background check deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting background check:', error);
    return new NextResponse('Failed to delete background check', { status: 500 });
  }
}
