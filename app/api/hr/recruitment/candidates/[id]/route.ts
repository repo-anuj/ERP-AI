import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';


export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// GET /api/hr/recruitment/candidates/[id] - Get specific candidate
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

    const candidate = await prisma.candidate.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
      include: {
        applications: {
          include: {
            jobPosting: {
              select: {
                id: true,
                title: true,
                department: { select: { name: true } },
                location: { select: { name: true, city: true } },
                status: true,
              }
            },
            interviews: {
              include: {
                interviewers: {
                  select: {
                    interviewerName: true,
                    role: true,
                    rating: true,
                    recommendation: true,
                  }
                }
              },
              orderBy: { scheduledAt: 'desc' }
            },
            evaluations: {
              select: {
                id: true,
                evaluationType: true,
                overallScore: true,
                recommendation: true,
                evaluatorName: true,
                createdAt: true,
              },
              orderBy: { createdAt: 'desc' }
            }
          },
          orderBy: { appliedAt: 'desc' }
        },
        interviews: {
          include: {
            jobPosting: {
              select: { id: true, title: true }
            },
            interviewers: {
              select: {
                interviewerName: true,
                role: true,
                rating: true,
                recommendation: true,
              }
            }
          },
          orderBy: { scheduledAt: 'desc' }
        },
        offers: {
          include: {
            jobPosting: {
              select: { id: true, title: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        evaluations: {
          include: {
            interview: {
              select: {
                id: true,
                type: true,
                scheduledAt: true,
              }
            }
          },
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
      }
    });

    if (!candidate) {
      return new NextResponse('Candidate not found', { status: 404 });
    }

    // Calculate candidate statistics
    const candidateWithStats = {
      ...candidate,
      stats: {
        totalApplications: candidate._count.applications,
        totalInterviews: candidate._count.interviews,
        totalOffers: candidate._count.offers,
        totalEvaluations: candidate._count.evaluations,
        totalBackgroundChecks: candidate._count.backgroundChecks,
        averageRating: candidate.evaluations.length > 0
          ? candidate.evaluations.reduce((sum, evaluation) => sum + (evaluation.overallScore || 0), 0) / candidate.evaluations.length
          : null,
        applicationsByStatus: candidate.applications.reduce((acc: any, app) => {
          acc[app.status] = (acc[app.status] || 0) + 1;
          return acc;
        }, {}),
      }
    };

    return NextResponse.json({ candidate: candidateWithStats });

  } catch (error) {
    console.error('Error fetching candidate:', error);
    return new NextResponse('Failed to fetch candidate', { status: 500 });
  }
}

// PUT /api/hr/recruitment/candidates/[id] - Update candidate
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
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      nationality,
      currentLocation,
      address,
      linkedinUrl,
      portfolioUrl,
      githubUrl,
      currentCompany,
      currentPosition,
      totalExperience,
      currentSalary,
      expectedSalary,
      noticePeriod,
      resumeUrl,
      coverLetterUrl,
      skills,
      education,
      experience,
      certifications,
      source,
      referredBy,
      tags,
      status,
      overallRating,
      notes,
      dataConsent,
      marketingConsent,
    } = body;

    // Check if candidate exists and belongs to company
    const existingCandidate = await prisma.candidate.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      }
    });

    if (!existingCandidate) {
      return new NextResponse('Candidate not found', { status: 404 });
    }

    // Check if email is being changed and if it conflicts with another candidate
    if (email && email !== existingCandidate.email) {
      const emailConflict = await prisma.candidate.findFirst({
        where: {
          email,
          companyId: user.companyId,
          id: { not: params.id }
        }
      });

      if (emailConflict) {
        return new NextResponse('Another candidate with this email already exists', { status: 400 });
      }
    }

    // Prepare update data
    const updateData: any = {};

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone || null;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (gender !== undefined) updateData.gender = gender || null;
    if (nationality !== undefined) updateData.nationality = nationality || null;
    if (currentLocation !== undefined) updateData.currentLocation = currentLocation || null;
    if (address !== undefined) updateData.address = address || null;
    if (linkedinUrl !== undefined) updateData.linkedinUrl = linkedinUrl || null;
    if (portfolioUrl !== undefined) updateData.portfolioUrl = portfolioUrl || null;
    if (githubUrl !== undefined) updateData.githubUrl = githubUrl || null;
    if (currentCompany !== undefined) updateData.currentCompany = currentCompany || null;
    if (currentPosition !== undefined) updateData.currentPosition = currentPosition || null;
    if (totalExperience !== undefined) updateData.totalExperience = totalExperience ? parseFloat(totalExperience) : null;
    if (currentSalary !== undefined) updateData.currentSalary = currentSalary ? parseFloat(currentSalary) : null;
    if (expectedSalary !== undefined) updateData.expectedSalary = expectedSalary ? parseFloat(expectedSalary) : null;
    if (noticePeriod !== undefined) updateData.noticePeriod = noticePeriod ? parseInt(noticePeriod) : null;
    if (resumeUrl !== undefined) updateData.resumeUrl = resumeUrl || null;
    if (coverLetterUrl !== undefined) updateData.coverLetterUrl = coverLetterUrl || null;
    if (skills !== undefined) updateData.skills = skills || [];
    if (education !== undefined) updateData.education = education || [];
    if (experience !== undefined) updateData.experience = experience || [];
    if (certifications !== undefined) updateData.certifications = certifications || [];
    if (source !== undefined) updateData.source = source || null;
    if (referredBy !== undefined) updateData.referredBy = referredBy || null;
    if (tags !== undefined) updateData.tags = tags || [];
    if (status !== undefined) updateData.status = status;
    if (overallRating !== undefined) updateData.overallRating = overallRating ? parseFloat(overallRating) : null;
    if (notes !== undefined) updateData.notes = notes || null;
    if (dataConsent !== undefined) updateData.dataConsent = dataConsent;
    if (marketingConsent !== undefined) updateData.marketingConsent = marketingConsent;

    // Update candidate
    const updatedCandidate = await prisma.candidate.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json({
      message: 'Candidate updated successfully',
      candidate: updatedCandidate
    });

  } catch (error) {
    console.error('Error updating candidate:', error);
    return new NextResponse('Failed to update candidate', { status: 500 });
  }
}

// DELETE /api/hr/recruitment/candidates/[id] - Delete candidate
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

    // Check if candidate exists and belongs to company
    const existingCandidate = await prisma.candidate.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
      include: {
        _count: {
          select: {
            applications: true,
            interviews: true,
            offers: true
          }
        }
      }
    });

    if (!existingCandidate) {
      return new NextResponse('Candidate not found', { status: 404 });
    }

    // Check if there are applications, interviews, or offers
    if (existingCandidate._count.applications > 0 ||
        existingCandidate._count.interviews > 0 ||
        existingCandidate._count.offers > 0) {
      return new NextResponse('Cannot delete candidate with existing applications, interviews, or offers. Please archive the candidate instead.', { status: 400 });
    }

    // Delete candidate
    await prisma.candidate.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      message: 'Candidate deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting candidate:', error);
    return new NextResponse('Failed to delete candidate', { status: 500 });
  }
}
