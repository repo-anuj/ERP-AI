import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';


export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// GET /api/hr/recruitment/offers - Get all offers
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
    const jobPostingId = searchParams.get('jobPostingId');
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
    if (jobPostingId) where.jobPostingId = jobPostingId;

    if (search) {
      where.OR = [
        { position: { contains: search, mode: 'insensitive' } },
        {
          candidate: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ]
          }
        }
      ];
    }

    // Get total count for pagination
    const totalCount = await prisma.offer.count({ where });

    // Get offers with relations
    const offers = await prisma.offer.findMany({
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
            expectedSalary: true,
          }
        },
        jobPosting: {
          select: {
            id: true,
            title: true,
            department: {
              select: { id: true, name: true }
            },
            location: {
              select: { id: true, name: true, city: true }
            }
          }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      offers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      }
    });

  } catch (error) {
    console.error('Error fetching offers:', error);
    return new NextResponse('Failed to fetch offers', { status: 500 });
  }
}

// POST /api/hr/recruitment/offers - Create new offer
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
      select: { id: true, companyId: true }
    });

    if (!user?.companyId) {
      return new NextResponse('Company not found', { status: 401 });
    }

    const body = await request.json();
    const {
      candidateId,
      jobPostingId,
      position,
      department,
      location,
      startDate,
      baseSalary,
      currency = 'INR',
      salaryFrequency = 'monthly',
      bonus,
      equity,
      benefits = [],
      employmentType,
      probationPeriod,
      noticePeriod,
      responseDeadline,
      approvalComments,
    } = body;

    // Validate required fields
    if (!candidateId || !position || !baseSalary) {
      return new NextResponse('Missing required fields: candidateId, position, baseSalary', { status: 400 });
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

    // Check if job posting exists (if provided)
    if (jobPostingId) {
      const jobPosting = await prisma.jobPosting.findFirst({
        where: {
          id: jobPostingId,
          companyId: user.companyId,
        }
      });

      if (!jobPosting) {
        return new NextResponse('Job posting not found', { status: 404 });
      }
    }

    // Check if there's already a pending offer for this candidate
    const existingOffer = await prisma.offer.findFirst({
      where: {
        candidateId,
        status: { in: ['draft', 'pending_approval', 'sent'] },
      }
    });

    if (existingOffer) {
      return new NextResponse('There is already a pending offer for this candidate', { status: 400 });
    }

    // Create offer
    const offer = await prisma.offer.create({
      data: {
        candidateId,
        jobPostingId: jobPostingId || null,
        position,
        department: department || null,
        location: location || null,
        startDate: startDate ? new Date(startDate) : null,
        baseSalary: parseFloat(baseSalary),
        currency,
        salaryFrequency,
        bonus: bonus ? parseFloat(bonus) : null,
        equity: equity || null,
        benefits,
        employmentType: employmentType || null,
        probationPeriod: probationPeriod ? parseInt(probationPeriod) : null,
        noticePeriod: noticePeriod ? parseInt(noticePeriod) : null,
        responseDeadline: responseDeadline ? new Date(responseDeadline) : null,
        approvalComments: approvalComments || null,
        companyId: user.companyId,
        createdBy: user.id,
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

    return NextResponse.json({
      message: 'Offer created successfully',
      offer
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating offer:', error);
    return new NextResponse('Failed to create offer', { status: 500 });
  }
}
