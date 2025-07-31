import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema for candidate creation
const candidateSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  nationality: z.string().optional().nullable(),
  currentLocation: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  linkedinUrl: z.string().url("Invalid LinkedIn URL").optional().nullable().or(z.literal("")).or(z.undefined()),
  portfolioUrl: z.string().url("Invalid portfolio URL").optional().nullable().or(z.literal("")).or(z.undefined()),
  githubUrl: z.string().url("Invalid GitHub URL").optional().nullable().or(z.literal("")).or(z.undefined()),
  currentCompany: z.string().optional().nullable(),
  currentPosition: z.string().optional().nullable(),
  totalExperience: z.number().min(0).optional().nullable(),
  currentSalary: z.number().min(0).optional().nullable(),
  expectedSalary: z.number().min(0).optional().nullable(),
  noticePeriod: z.number().min(0).optional().nullable(),
  resumeUrl: z.string().url("Invalid resume URL").optional().nullable().or(z.literal("")).or(z.undefined()),
  coverLetterUrl: z.string().url("Invalid cover letter URL").optional().nullable().or(z.literal("")).or(z.undefined()),
  skills: z.array(z.string()).default([]),
  education: z.union([z.array(z.any()), z.string()]).default([]), // Accept both array and string
  experience: z.array(z.any()).default([]),
  certifications: z.array(z.any()).default([]),
  source: z.string().optional().nullable(),
  referredBy: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional().nullable(),
  dataConsent: z.boolean().default(false),
  marketingConsent: z.boolean().default(false),
});

// GET /api/hr/recruitment/candidates - Get all candidates
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      console.error("[CANDIDATES_GET] No token provided");
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload?.email) {
      console.error("[CANDIDATES_GET] Invalid token - no email");
      return new NextResponse('Invalid token', { status: 401 });
    }

    // Get user to find companyId
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      include: { company: true }
    });

    if (!user?.companyId) {
      console.error("[CANDIDATES_GET] Company not found for user:", payload.email);
      return new NextResponse('Company not found', { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const source = searchParams.get('source');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build filter conditions
    const where: any = {
      companyId: user.companyId,
    };

    if (status) {
      where.status = status;
    }

    if (source) {
      where.source = source;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { currentCompany: { contains: search, mode: 'insensitive' } },
        { currentPosition: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count for pagination
    const totalCount = await prisma.candidate.count({ where });

    // Get candidates with relations
    const candidates = await prisma.candidate.findMany({
      where,
      include: {
        applications: {
          include: {
            jobPosting: {
              select: { id: true, title: true, status: true }
            }
          },
          orderBy: { appliedAt: 'desc' }
        },
        interviews: {
          include: {
            jobPosting: {
              select: { id: true, title: true }
            }
          },
          orderBy: { scheduledAt: 'desc' }
        },
        offers: {
          orderBy: { createdAt: 'desc' }
        },
        evaluations: {
          orderBy: { createdAt: 'desc' }
        },
        backgroundChecks: {
          orderBy: { requestedAt: 'desc' }
        },
        _count: {
          select: {
            applications: true,
            interviews: true,
            offers: true,
            evaluations: true,
            backgroundChecks: true
          }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calculate candidate statistics
    const candidatesWithStats = candidates.map(candidate => ({
      ...candidate,
      stats: {
        totalApplications: candidate._count.applications,
        totalInterviews: candidate._count.interviews,
        totalOffers: candidate._count.offers,
        totalEvaluations: candidate._count.evaluations,
        totalBackgroundChecks: candidate._count.backgroundChecks,
        latestApplication: candidate.applications[0] || null,
        latestInterview: candidate.interviews[0] || null,
        latestOffer: candidate.offers[0] || null,
      }
    }));

    return NextResponse.json({
      candidates: candidatesWithStats,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      }
    });

  } catch (error) {
    console.error('[CANDIDATES_GET] Error details:', error);

    // Handle database connection issues
    if (error instanceof Error) {
      console.error('[CANDIDATES_GET] Error message:', error.message);
      console.error('[CANDIDATES_GET] Error stack:', error.stack);

      if (error.message.includes('Connection') || error.message.includes('timeout')) {
        return new NextResponse('Database connection error', { status: 503 });
      }
    }

    return new NextResponse('Internal server error', { status: 500 });
  }
}

// POST /api/hr/recruitment/candidates - Create new candidate
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      console.error("[CANDIDATES_POST] No token provided");
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload?.email) {
      console.error("[CANDIDATES_POST] Invalid token - no email");
      return new NextResponse('Invalid token', { status: 401 });
    }

    // Get user to find companyId
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      include: { company: true }
    });

    if (!user?.companyId) {
      console.error("[CANDIDATES_POST] Company not found for user:", payload.email);
      return new NextResponse('Company not found', { status: 404 });
    }

    const body = await request.json();
    console.log("[CANDIDATES_POST] Request body:", body);

    const validatedData = candidateSchema.parse(body);
    console.log("[CANDIDATES_POST] Validated data:", validatedData);

    // Check if candidate with email already exists
    const existingCandidate = await prisma.candidate.findFirst({
      where: {
        email: validatedData.email,
        companyId: user.companyId,
      }
    });

    if (existingCandidate) {
      console.error("[CANDIDATES_POST] Candidate already exists with email:", validatedData.email);
      return NextResponse.json(
        { error: 'Candidate with this email already exists' },
        { status: 409 }
      );
    }

    // Prepare data for candidate creation
    let candidateData: any = {
      ...validatedData,
      dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : null,
      companyId: user.companyId,
    };

    // Handle education field - convert string to array if needed
    if (typeof validatedData.education === 'string' && validatedData.education.trim()) {
      // For now, store the education string as a note in the education array
      candidateData.education = [{
        id: randomUUID(),
        institution: 'Manual Entry',
        degree: validatedData.education,
        fieldOfStudy: null,
        startDate: null,
        endDate: null,
        gpa: null,
        description: validatedData.education
      }];
    } else if (Array.isArray(validatedData.education)) {
      candidateData.education = validatedData.education;
    } else {
      candidateData.education = [];
    }

    // Clean up empty URL fields to avoid validation errors
    ['linkedinUrl', 'portfolioUrl', 'githubUrl', 'resumeUrl', 'coverLetterUrl'].forEach(field => {
      if (candidateData[field] === '' || candidateData[field] === undefined) {
        candidateData[field] = null;
      }
    });

    // Clean up undefined values that might cause Prisma issues
    Object.keys(candidateData).forEach(key => {
      if (candidateData[key] === undefined) {
        delete candidateData[key];
      }
    });

    console.log("[CANDIDATES_POST] Creating candidate with data:", candidateData);

    // Create candidate
    const candidate = await prisma.candidate.create({
      data: candidateData,
      include: {
        applications: {
          include: {
            jobPosting: {
              select: { id: true, title: true }
            }
          }
        },
        _count: {
          select: {
            applications: true,
            interviews: true,
            offers: true
          }
        }
      }
    });

    console.log("[CANDIDATES_POST] Candidate created successfully:", candidate.id);

    return NextResponse.json({
      message: 'Candidate created successfully',
      candidate
    }, { status: 201 });

  } catch (error) {
    console.error('[CANDIDATES_POST] Error details:', error);

    if (error instanceof z.ZodError) {
      console.error('[CANDIDATES_POST] Validation errors:', error.errors);
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    // Handle Prisma specific errors
    if (error instanceof Error) {
      console.error('[CANDIDATES_POST] Error message:', error.message);
      console.error('[CANDIDATES_POST] Error stack:', error.stack);

      // Handle unique constraint violations
      if (error.message.includes('Unique constraint failed')) {
        return NextResponse.json(
          { error: 'Email already exists', details: 'A candidate with this email already exists' },
          { status: 409 }
        );
      }

      // Handle database connection issues
      if (error.message.includes('Connection') || error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'Database connection error', details: 'Please try again in a moment' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
