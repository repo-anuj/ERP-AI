import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';


export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// GET /api/hr/recruitment/job-postings/[id] - Get specific job posting
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

    const jobPosting = await prisma.jobPosting.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
      include: {
        department: {
          select: { id: true, name: true }
        },
        location: {
          select: { id: true, name: true, city: true, state: true }
        },
        applications: {
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
                expectedSalary: true,
                status: true,
              }
            }
          },
          orderBy: { appliedAt: 'desc' }
        },
        interviews: {
          include: {
            candidate: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          },
          orderBy: { scheduledAt: 'desc' }
        },
        _count: {
          select: {
            applications: true,
            interviews: true
          }
        }
      }
    });

    if (!jobPosting) {
      return new NextResponse('Job posting not found', { status: 404 });
    }

    // Increment view count
    await prisma.jobPosting.update({
      where: { id: params.id },
      data: { viewCount: { increment: 1 } }
    });

    // Calculate application statistics
    const applicationStats = jobPosting.applications.reduce((acc: any, app: any) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});

    const jobPostingWithStats = {
      ...jobPosting,
      stats: {
        totalApplications: jobPosting._count.applications,
        totalInterviews: jobPosting._count.interviews,
        applicationsByStatus: applicationStats,
      }
    };

    return NextResponse.json({ jobPosting: jobPostingWithStats });

  } catch (error) {
    console.error('Error fetching job posting:', error);
    return new NextResponse('Failed to fetch job posting', { status: 500 });
  }
}

// PUT /api/hr/recruitment/job-postings/[id] - Update job posting
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

    // Use the same validation schema as create endpoint for consistency
    const jobPostingUpdateSchema = z.object({
      title: z.string().min(2, "Title must be at least 2 characters").optional(),
      description: z.string().min(10, "Description must be at least 10 characters").optional(),
      requirements: z.string().min(10, "Requirements must be at least 10 characters").optional(),
      responsibilities: z.string().optional().nullable(),
      departmentId: z.string().optional().nullable(),
      locationId: z.string().optional().nullable(),
      jobType: z.enum(["full_time", "part_time", "contract", "temporary", "internship"]).optional(),
      experienceLevel: z.enum(["entry", "mid", "senior", "executive"]).optional(),
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
      currency: z.string().optional(),
      benefits: z.array(z.string()).optional(),
      applicationDeadline: z.string().optional().nullable(),
      maxApplications: z.union([z.string(), z.number()]).transform((val) => {
        if (typeof val === 'string') {
          const parsed = parseInt(val, 10);
          return isNaN(parsed) || val === '' ? null : parsed;
        }
        return val;
      }).optional().nullable(),
      keywords: z.array(z.string()).optional(),
      externalJobBoards: z.array(z.string()).optional(),
      metaDescription: z.string().optional().nullable(),
      isPublished: z.boolean().optional(),
      status: z.string().optional(),
    });

    const validatedData = jobPostingUpdateSchema.parse(body);

    // Check if job posting exists and belongs to company
    const existingJobPosting = await prisma.jobPosting.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      }
    });

    if (!existingJobPosting) {
      return new NextResponse('Job posting not found', { status: 404 });
    }
    // Prepare update data using validated data
    const updateData: any = {};

    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.requirements !== undefined) updateData.requirements = validatedData.requirements;
    if (validatedData.responsibilities !== undefined) updateData.responsibilities = validatedData.responsibilities;
    if (validatedData.departmentId !== undefined) updateData.departmentId = validatedData.departmentId || null;
    if (validatedData.locationId !== undefined) updateData.locationId = validatedData.locationId || null;
    if (validatedData.jobType !== undefined) updateData.jobType = validatedData.jobType;
    if (validatedData.experienceLevel !== undefined) updateData.experienceLevel = validatedData.experienceLevel;
    if (validatedData.salaryMin !== undefined) updateData.salaryMin = validatedData.salaryMin;
    if (validatedData.salaryMax !== undefined) updateData.salaryMax = validatedData.salaryMax;
    if (validatedData.currency !== undefined) updateData.currency = validatedData.currency;
    if (validatedData.benefits !== undefined) updateData.benefits = validatedData.benefits;
    if (validatedData.applicationDeadline !== undefined) {
      updateData.applicationDeadline = validatedData.applicationDeadline ? new Date(validatedData.applicationDeadline) : null;
    }
    if (validatedData.maxApplications !== undefined) updateData.maxApplications = validatedData.maxApplications;
    if (validatedData.keywords !== undefined) updateData.keywords = validatedData.keywords;
    if (validatedData.externalJobBoards !== undefined) {
      updateData.externalJobBoards = validatedData.externalJobBoards;
      console.log("[JOB_POSTINGS_PUT] Updated distribution platforms:", validatedData.externalJobBoards);
    }
    if (validatedData.metaDescription !== undefined) updateData.metaDescription = validatedData.metaDescription;

    // Handle publishing status
    if (validatedData.isPublished !== undefined) {
      updateData.isPublished = validatedData.isPublished;
      if (validatedData.isPublished && !existingJobPosting.publishedAt) {
        updateData.publishedAt = new Date();
        updateData.status = 'published';
      } else if (!validatedData.isPublished) {
        updateData.status = 'draft';
      }
    }

    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;
    }

    // Update slug if title changed
    if (validatedData.title && validatedData.title !== existingJobPosting.title) {
      const newSlug = validatedData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Check if new slug already exists
      const existingSlug = await prisma.jobPosting.findFirst({
        where: {
          companyId: user.companyId,
          slug: newSlug,
          id: { not: params.id }
        }
      });

      updateData.slug = existingSlug ? `${newSlug}-${Date.now()}` : newSlug;
    }

    // Update job posting
    const updatedJobPosting = await prisma.jobPosting.update({
      where: { id: params.id },
      data: updateData,
      include: {
        department: {
          select: { id: true, name: true }
        },
        location: {
          select: { id: true, name: true, city: true }
        }
      }
    });

    return NextResponse.json({
      message: 'Job posting updated successfully',
      jobPosting: updatedJobPosting
    });

  } catch (error) {
    console.error('Error updating job posting:', error);
    return new NextResponse('Failed to update job posting', { status: 500 });
  }
}

// DELETE /api/hr/recruitment/job-postings/[id] - Delete job posting
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

    // Check if job posting exists and belongs to company
    const existingJobPosting = await prisma.jobPosting.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
      include: {
        _count: {
          select: {
            applications: true,
            interviews: true
          }
        }
      }
    });

    if (!existingJobPosting) {
      return new NextResponse('Job posting not found', { status: 404 });
    }

    // Check if there are applications or interviews
    if (existingJobPosting._count.applications > 0 || existingJobPosting._count.interviews > 0) {
      return new NextResponse('Cannot delete job posting with existing applications or interviews. Please archive it instead.', { status: 400 });
    }

    // Delete job posting
    await prisma.jobPosting.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      message: 'Job posting deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting job posting:', error);
    return new NextResponse('Failed to delete job posting', { status: 500 });
  }
}
