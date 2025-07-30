import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createAuditLog, AUDIT_ACTIONS, ENTITY_TYPES } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema for performance template
const performanceTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  reviewType: z.enum(["annual", "quarterly", "monthly", "probation", "custom"]).default("annual"),
  frequency: z.enum(["yearly", "quarterly", "monthly", "one-time"]).default("yearly"),
  duration: z.number().min(1, "Duration must be at least 1 day"),
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
  })).default([]),
  ratingScale: z.object({
    min: z.number().default(1),
    max: z.number().default(5),
    labels: z.array(z.string()).default(["Poor", "Below Average", "Average", "Good", "Excellent"]),
  }).default({
    min: 1,
    max: 5,
    labels: ["Poor", "Below Average", "Average", "Good", "Excellent"]
  }),
  selfReviewEnabled: z.boolean().default(true),
  managerReviewEnabled: z.boolean().default(true),
  peerReviewEnabled: z.boolean().default(false),
  skipLevelReviewEnabled: z.boolean().default(false),
  autoAssignReviews: z.boolean().default(false),
  reminderSettings: z.object({
    enabled: z.boolean().default(true),
    daysBefore: z.number().default(7),
    frequency: z.enum(["daily", "weekly"]).default("weekly"),
  }).optional(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

type PerformanceTemplateFormValues = z.infer<typeof performanceTemplateSchema>;

// GET - Fetch performance templates
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // Build where clause
    const whereClause: any = {
      companyId: user.companyId,
    };

    if (!includeInactive) {
      whereClause.isActive = true;
    }

    // Fetch templates
    const templates = await prisma.performanceTemplate.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            performanceReviews: true,
          }
        }
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ],
    });

    const formattedTemplates = templates.map(template => ({
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
    }));

    return NextResponse.json(formattedTemplates);

  } catch (error) {
    console.error('[PERFORMANCE_TEMPLATES_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// POST - Create performance template
export async function POST(request: NextRequest) {
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
    const validatedData = performanceTemplateSchema.parse(body);

    // Validate sections weights sum to 100
    if (validatedData.sections.length > 0) {
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
    if (validatedData.isDefault) {
      await prisma.performanceTemplate.updateMany({
        where: {
          companyId: user.companyId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        }
      });
    }

    // Create performance template
    const performanceTemplate = await prisma.performanceTemplate.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        reviewType: validatedData.reviewType,
        frequency: validatedData.frequency,
        duration: validatedData.duration,
        sections: validatedData.sections,
        ratingScale: validatedData.ratingScale,
        selfReviewEnabled: validatedData.selfReviewEnabled,
        managerReviewEnabled: validatedData.managerReviewEnabled,
        peerReviewEnabled: validatedData.peerReviewEnabled,
        skipLevelReviewEnabled: validatedData.skipLevelReviewEnabled,
        autoAssignReviews: validatedData.autoAssignReviews,
        reminderSettings: validatedData.reminderSettings,
        isActive: validatedData.isActive,
        isDefault: validatedData.isDefault,
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

    // Create audit log
    await createAuditLog({
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      action: AUDIT_ACTIONS.CREATE_PERFORMANCE_TEMPLATE,
      entityType: ENTITY_TYPES.PERFORMANCE_TEMPLATE,
      entityId: performanceTemplate.id,
      companyId: user.companyId,
      details: {
        templateName: validatedData.name,
        reviewType: validatedData.reviewType,
        frequency: validatedData.frequency,
        duration: validatedData.duration,
        isDefault: validatedData.isDefault,
      },
    });

    return NextResponse.json({
      id: performanceTemplate.id,
      name: performanceTemplate.name,
      description: performanceTemplate.description,
      reviewType: performanceTemplate.reviewType,
      frequency: performanceTemplate.frequency,
      duration: performanceTemplate.duration,
      sections: performanceTemplate.sections,
      ratingScale: performanceTemplate.ratingScale,
      selfReviewEnabled: performanceTemplate.selfReviewEnabled,
      managerReviewEnabled: performanceTemplate.managerReviewEnabled,
      peerReviewEnabled: performanceTemplate.peerReviewEnabled,
      skipLevelReviewEnabled: performanceTemplate.skipLevelReviewEnabled,
      autoAssignReviews: performanceTemplate.autoAssignReviews,
      reminderSettings: performanceTemplate.reminderSettings,
      isActive: performanceTemplate.isActive,
      isDefault: performanceTemplate.isDefault,
      totalReviews: performanceTemplate._count.performanceReviews,
      createdAt: performanceTemplate.createdAt,
    }, { status: 201 });

  } catch (error) {
    console.error('[PERFORMANCE_TEMPLATES_POST]', error);
    
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ 
        error: 'Validation failed', 
        details: error.errors 
      }), { status: 400 });
    }

    return new NextResponse('Internal error', { status: 500 });
  }
}
