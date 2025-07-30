import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema for job posting creation
const jobPostingSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  requirements: z.string().min(10, "Requirements must be at least 10 characters"),
  responsibilities: z.string().optional().nullable(),
  departmentId: z.string().min(1, "Department is required"),
  locationId: z.string().optional().nullable(),
  jobType: z.enum(["full_time", "part_time", "contract", "temporary", "internship"]).default("full_time"),
  experienceLevel: z.enum(["entry", "mid", "senior", "executive"]).default("mid"),
  salaryMin: z.union([z.string(), z.number()]).transform((val) => {
    if (typeof val === 'string') {
      const parsed = parseFloat(val);
      return isNaN(parsed) || val === '' ? null : parsed;
    }
    return val;
  }).optional().nullable(),
  salaryMax: z.union([z.string(), z.number()]).transform((val) => {
    if (typeof val === 'string') {
      const parsed = parseFloat(val);
      return isNaN(parsed) || val === '' ? null : parsed;
    }
    return val;
  }).optional().nullable(),
  currency: z.string().default("USD"),
  benefits: z.array(z.string()).default([]),
  applicationDeadline: z.string().optional().nullable(),
  maxApplications: z.union([z.string(), z.number()]).transform((val) => {
    if (typeof val === 'string') {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) || val === '' ? null : parsed;
    }
    return val;
  }).optional().nullable(),
  keywords: z.array(z.string()).default([]),
  externalJobBoards: z.array(z.string()).default([]),
  metaDescription: z.string().optional().nullable(),
  isPublished: z.boolean().default(false),
  status: z.enum(["draft", "published", "closed", "archived"]).default("draft"),
});

// GET /api/hr/recruitment/job-postings - Get all job postings
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      console.error("[JOB_POSTINGS_GET] No token provided");
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload?.email) {
      console.error("[JOB_POSTINGS_GET] Invalid token - no email");
      return new NextResponse('Invalid token', { status: 401 });
    }

    // Get user to find companyId
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      include: { company: true }
    });

    if (!user?.companyId) {
      console.error("[JOB_POSTINGS_GET] Company not found for user:", payload.email);
      return new NextResponse('Company not found', { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const department = searchParams.get('department');
    const location = searchParams.get('location');

    // Build where clause with company security
    const where: any = {
      companyId: user.companyId,
    };
    if (status) where.status = status;
    if (department) where.departmentId = department;
    if (location) where.locationId = location;

    // Get total count for pagination
    const totalCount = await prisma.jobPosting.count({ where });

    // Get job postings with relations
    const jobPostings = await prisma.jobPosting.findMany({
      where,
      include: {
        department: {
          select: { id: true, name: true }
        },
        location: {
          select: { id: true, name: true, city: true }
        },
        applications: {
          select: { id: true, status: true }
        },
        _count: {
          select: {
            applications: true,
            interviews: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calculate application statistics
    const jobPostingsWithStats = jobPostings.map(posting => ({
      ...posting,
      stats: {
        totalApplications: posting._count.applications,
        totalInterviews: posting._count.interviews,
        applicationsByStatus: posting.applications.reduce((acc: any, app) => {
          acc[app.status] = (acc[app.status] || 0) + 1;
          return acc;
        }, {}),
      }
    }));

    return NextResponse.json({
      jobPostings: jobPostingsWithStats,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      }
    });

  } catch (error) {
    console.error('[JOB_POSTINGS_GET] Error details:', error);

    // Handle database connection issues
    if (error instanceof Error) {
      console.error('[JOB_POSTINGS_GET] Error message:', error.message);
      console.error('[JOB_POSTINGS_GET] Error stack:', error.stack);

      if (error.message.includes('Connection') || error.message.includes('timeout')) {
        return new NextResponse('Database connection error', { status: 503 });
      }
    }

    return new NextResponse('Internal server error', { status: 500 });
  }
}

// POST /api/hr/recruitment/job-postings - Create new job posting
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      console.error("[JOB_POSTINGS_POST] No token provided");
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload?.email) {
      console.error("[JOB_POSTINGS_POST] Invalid token - no email");
      return new NextResponse('Invalid token', { status: 401 });
    }

    // Get user to find companyId
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      include: { company: true }
    });

    if (!user?.companyId) {
      console.error("[JOB_POSTINGS_POST] Company not found for user:", payload.email);
      return new NextResponse('Company not found', { status: 404 });
    }

    const body = await request.json();
    console.log("[JOB_POSTINGS_POST] Request body:", body);

    const validatedData = jobPostingSchema.parse(body);
    console.log("[JOB_POSTINGS_POST] Validated data:", validatedData);

    // Prepare data for job posting creation
    let jobPostingData: any = {
      ...validatedData,
      applicationDeadline: validatedData.applicationDeadline ? new Date(validatedData.applicationDeadline) : null,
      companyId: user.companyId,
    };

    // Clean up undefined values that might cause Prisma issues
    Object.keys(jobPostingData).forEach(key => {
      if (jobPostingData[key] === undefined) {
        delete jobPostingData[key];
      }
    });

    console.log("[JOB_POSTINGS_POST] Creating job posting with data:", jobPostingData);
    console.log("[JOB_POSTINGS_POST] Distribution platforms:", jobPostingData.externalJobBoards);

    // Create job posting
    const jobPosting = await prisma.jobPosting.create({
      data: jobPostingData,
      include: {
        department: {
          select: { id: true, name: true }
        },
        location: {
          select: { id: true, name: true, city: true }
        }
      }
    });

    console.log("[JOB_POSTINGS_POST] Job posting created successfully:", jobPosting.id);

    return NextResponse.json({
      message: 'Job posting created successfully',
      jobPosting
    }, { status: 201 });

  } catch (error) {
    console.error('[JOB_POSTINGS_POST] Error details:', error);

    if (error instanceof z.ZodError) {
      console.error('[JOB_POSTINGS_POST] Validation errors:', error.errors);
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    // Handle Prisma specific errors
    if (error instanceof Error) {
      console.error('[JOB_POSTINGS_POST] Error message:', error.message);
      console.error('[JOB_POSTINGS_POST] Error stack:', error.stack);

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
