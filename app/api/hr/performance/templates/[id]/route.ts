import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createAuditLog, AUDIT_ACTIONS, ENTITY_TYPES } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema for performance template update
const performanceTemplateUpdateSchema = z.object({
  name: z.string().min(1, "Template name is required").optional(),
  description: z.string().optional(),
  reviewType: z.enum(["annual", "quarterly", "monthly", "probation", "custom"]).optional(),
  frequency: z.enum(["yearly", "quarterly", "monthly", "one-time"]).optional(),
  duration: z.number().min(1, "Duration must be at least 1 day").optional(),
  sections: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    weight: z.number().min(0).max(100),
    criteria: z.array(z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().optional(),
      weight: z.number().min(0).max(100),
    }))
  })).optional(),
  ratingScale: z.object({
    min: z.number(),
    max: z.number(),
    labels: z.array(z.string()),
  }).optional(),
  selfReviewEnabled: z.boolean().optional(),
  managerReviewEnabled: z.boolean().optional(),
  peerReviewEnabled: z.boolean().optional(),
  skipLevelReviewEnabled: z.boolean().optional(),
  autoAssignReviews: z.boolean().optional(),
  reminderSettings: z.object({
    enabled: z.boolean(),
    daysBefore: z.number(),
    frequency: z.enum(["daily", "weekly"]),
  }).optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

// GET - Fetch single performance template
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
    if (!payload.email) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      include: { company: true }
    });

    if (!user?.companyId) {
      return new NextResponse('Company not found', { status: 404 });
    }

    const template = await prisma.performanceTemplate.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
      include: {
        _count: {
          select: {
            performanceReviews: true,
          }
        }
      }
    });

    if (!template) {
      return new NextResponse('Template not found', { status: 404 });
    }

    return NextResponse.json({
      id: template.id,
      name: template.name,
      description: template.description,
      reviewType: template.reviewType,
      frequency: template.frequency,
      duration: template.duration,
      sections: template.sections,
      ratingScale: template.ratingScale,
      selfReviewEnabled: template.selfReviewEnabled,
      managerReviewEnabled: template.managerReviewEnabled,
      peerReviewEnabled: template.peerReviewEnabled,
      skipLevelReviewEnabled: template.skipLevelReviewEnabled,
      autoAssignReviews: template.autoAssignReviews,
      reminderSettings: template.reminderSettings,
      isActive: template.isActive,
      isDefault: template.isDefault,
      totalReviews: template._count.performanceReviews,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    });

  } catch (error) {
    console.error('[PERFORMANCE_TEMPLATE_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// PUT - Update performance template
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
    if (!payload.email) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      include: { company: true }
    });

    if (!user?.companyId) {
      return new NextResponse('Company not found', { status: 404 });
    }

    const body = await request.json();
    const validatedData = performanceTemplateUpdateSchema.parse(body);

    // Check if template exists and belongs to company
    const existingTemplate = await prisma.performanceTemplate.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      }
    });

    if (!existingTemplate) {
      return new NextResponse('Template not found', { status: 404 });
    }

    // Validate sections weights if provided
    if (validatedData.sections && validatedData.sections.length > 0) {
      const totalWeight = validatedData.sections.reduce((sum, section) => sum + section.weight, 0);
      if (Math.abs(totalWeight - 100) > 0.01) {
        return new NextResponse('Section weights must sum to 100%', { status: 400 });
      }

      // Validate criteria weights within each section
      for (const section of validatedData.sections) {
        if (section.criteria.length > 0) {
          const sectionCriteriaWeight = section.criteria.reduce((sum, criteria) => sum + criteria.weight, 0);
          if (Math.abs(sectionCriteriaWeight - 100) > 0.01) {
            return new NextResponse(`Criteria weights in section "${section.name}" must sum to 100%`, { status: 400 });
          }
        }
      }
    }

    // If setting as default, unset other defaults
    if (validatedData.isDefault && !existingTemplate.isDefault) {
      await prisma.performanceTemplate.updateMany({
        where: {
          companyId: user.companyId,
          isDefault: true,
          id: { not: params.id },
        },
        data: {
          isDefault: false,
        }
      });
    }

    // Update performance template
    const updatedTemplate = await prisma.performanceTemplate.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        _count: {
          select: {
            performanceReviews: true,
          }
        }
      }
    });

    // Create audit log
    await createAuditLog({
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      action: AUDIT_ACTIONS.UPDATE_PERFORMANCE_TEMPLATE,
      entityType: ENTITY_TYPES.PERFORMANCE_TEMPLATE,
      entityId: updatedTemplate.id,
      companyId: user.companyId,
      details: {
        templateName: updatedTemplate.name,
        changes: validatedData,
      },
    });

    return NextResponse.json({
      id: updatedTemplate.id,
      name: updatedTemplate.name,
      description: updatedTemplate.description,
      reviewType: updatedTemplate.reviewType,
      frequency: updatedTemplate.frequency,
      duration: updatedTemplate.duration,
      sections: updatedTemplate.sections,
      ratingScale: updatedTemplate.ratingScale,
      selfReviewEnabled: updatedTemplate.selfReviewEnabled,
      managerReviewEnabled: updatedTemplate.managerReviewEnabled,
      peerReviewEnabled: updatedTemplate.peerReviewEnabled,
      skipLevelReviewEnabled: updatedTemplate.skipLevelReviewEnabled,
      autoAssignReviews: updatedTemplate.autoAssignReviews,
      reminderSettings: updatedTemplate.reminderSettings,
      isActive: updatedTemplate.isActive,
      isDefault: updatedTemplate.isDefault,
      totalReviews: updatedTemplate._count.performanceReviews,
      updatedAt: updatedTemplate.updatedAt,
    });

  } catch (error) {
    console.error('[PERFORMANCE_TEMPLATE_PUT]', error);
    
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ 
        error: 'Validation failed', 
        details: error.errors 
      }), { status: 400 });
    }

    return new NextResponse('Internal error', { status: 500 });
  }
}

// DELETE - Delete performance template
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
    if (!payload.email) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      include: { company: true }
    });

    if (!user?.companyId) {
      return new NextResponse('Company not found', { status: 404 });
    }

    // Check if template exists and belongs to company
    const existingTemplate = await prisma.performanceTemplate.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
      include: {
        _count: {
          select: {
            performanceReviews: true,
          }
        }
      }
    });

    if (!existingTemplate) {
      return new NextResponse('Template not found', { status: 404 });
    }

    // Check if template is being used
    if (existingTemplate._count.performanceReviews > 0) {
      return new NextResponse('Cannot delete template that is being used in performance reviews', { status: 400 });
    }

    // Delete performance template
    await prisma.performanceTemplate.delete({
      where: { id: params.id }
    });

    // Create audit log
    await createAuditLog({
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      action: AUDIT_ACTIONS.DELETE_PERFORMANCE_TEMPLATE,
      entityType: ENTITY_TYPES.PERFORMANCE_TEMPLATE,
      entityId: params.id,
      companyId: user.companyId,
      details: {
        templateName: existingTemplate.name,
        reviewType: existingTemplate.reviewType,
      },
    });

    return new NextResponse(null, { status: 204 });

  } catch (error) {
    console.error('[PERFORMANCE_TEMPLATE_DELETE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
