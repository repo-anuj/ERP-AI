import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';


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
    const {
      title,
      description,
      requirements,
      responsibilities,
      departmentId,
      locationId,
      jobType,
      experienceLevel,
      salaryMin,
      salaryMax,
      currency,
      benefits,
      applicationDeadline,
      maxApplications,
      keywords,
      externalJobBoards,
      metaDescription,
      isPublished,
      status,
    } = body;

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
    // Prepare update data
    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (requirements !== undefined) updateData.requirements = requirements;
    if (responsibilities !== undefined) updateData.responsibilities = responsibilities;
    if (departmentId !== undefined) updateData.departmentId = departmentId || null;
    if (locationId !== undefined) updateData.locationId = locationId || null;
    if (jobType !== undefined) updateData.jobType = jobType;
    if (experienceLevel !== undefined) updateData.experienceLevel = experienceLevel;
    if (salaryMin !== undefined) updateData.salaryMin = salaryMin ? parseFloat(salaryMin) : null;
    if (salaryMax !== undefined) updateData.salaryMax = salaryMax ? parseFloat(salaryMax) : null;
    if (currency !== undefined) updateData.currency = currency;
    if (benefits !== undefined) updateData.benefits = benefits;
    if (applicationDeadline !== undefined) {
      updateData.applicationDeadline = applicationDeadline ? new Date(applicationDeadline) : null;
    }
    if (maxApplications !== undefined) {
      updateData.maxApplications = maxApplications ? parseInt(maxApplications) : null;
    }
    if (keywords !== undefined) updateData.keywords = keywords;
    if (externalJobBoards !== undefined) updateData.externalJobBoards = externalJobBoards;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription;

    // Handle publishing status
    if (isPublished !== undefined) {
      updateData.isPublished = isPublished;
      if (isPublished && !existingJobPosting.publishedAt) {
        updateData.publishedAt = new Date();
        updateData.status = 'published';
      } else if (!isPublished) {
        updateData.status = 'draft';
      }
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    // Update slug if title changed
    if (title && title !== existingJobPosting.title) {
      const newSlug = title
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
