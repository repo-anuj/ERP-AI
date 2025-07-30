import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getUserCompanyId } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Schema for creating project templates
const createTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  industry: z.string().min(1, "Industry is required"),
  type: z.enum(["internal", "client", "research", "maintenance"]),
  isPublic: z.boolean().default(false),
  
  // Template Configuration
  estimatedDuration: z.number().optional(),
  estimatedHours: z.number().optional(),
  defaultBudget: z.number().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  riskLevel: z.enum(["low", "medium", "high"]).default("medium"),
  
  // Template Content
  objectives: z.string().optional(),
  deliverables: z.string().optional(),
  successCriteria: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  
  // Predefined Milestones
  milestones: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    estimatedDays: z.number().optional(),
    deliverables: z.string().optional()
  })).default([]),
  
  // Predefined Tasks
  tasks: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    estimatedHours: z.number().optional(),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
    requiredSkills: z.array(z.string()).default([]),
    dependencies: z.array(z.string()).default([])
  })).default([]),
  
  // Required Skills/Roles
  requiredRoles: z.array(z.string()).default([]),
  requiredSkills: z.array(z.string()).default([]),
  teamSize: z.number().optional()
});

export async function POST(req: NextRequest) {
  try {
    const companyId = await getUserCompanyId();
    
    if (!companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    const validatedData = createTemplateSchema.parse(body);

    const template = await prisma.projectTemplate.create({
      data: {
        ...validatedData,
        companyId: validatedData.isPublic ? null : companyId,
        createdBy: 'current-user-id', // TODO: Get actual user ID
        createdByName: 'Current User', // TODO: Get actual user name
        version: '1.0'
      }
    });

    return NextResponse.json({
      message: 'Template created successfully',
      template
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    console.error('Template creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const companyId = await getUserCompanyId();
    
    if (!companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const industry = searchParams.get('industry');
    const type = searchParams.get('type');
    const includePublic = searchParams.get('includePublic') === 'true';

    let whereClause: any = {
      isActive: true,
      OR: [
        { companyId: companyId }, // Company templates
      ]
    };

    // Include public templates if requested
    if (includePublic) {
      whereClause.OR.push({ isPublic: true, companyId: null });
    }

    // Add filters
    if (category) {
      whereClause.category = category;
    }
    if (industry) {
      whereClause.industry = industry;
    }
    if (type) {
      whereClause.type = type;
    }

    const templates = await prisma.projectTemplate.findMany({
      where: whereClause,
      orderBy: [
        { usageCount: 'desc' },
        { updatedAt: 'desc' }
      ]
    });

    // Get categories and industries for filters
    const categories = await prisma.projectTemplate.groupBy({
      by: ['category'],
      where: {
        isActive: true,
        OR: [
          { companyId: companyId },
          { isPublic: true, companyId: null }
        ]
      }
    });

    const industries = await prisma.projectTemplate.groupBy({
      by: ['industry'],
      where: {
        isActive: true,
        OR: [
          { companyId: companyId },
          { isPublic: true, companyId: null }
        ]
      }
    });

    return NextResponse.json({
      templates,
      filters: {
        categories: categories.map(c => c.category),
        industries: industries.map(i => i.industry)
      }
    });

  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const companyId = await getUserCompanyId();
    
    if (!companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    const { templateId, ...updateData } = body;

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    // Verify template ownership
    const existingTemplate = await prisma.projectTemplate.findFirst({
      where: {
        id: templateId,
        companyId: companyId
      }
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found or access denied' }, { status: 404 });
    }

    const validatedData = createTemplateSchema.partial().parse(updateData);

    const updatedTemplate = await prisma.projectTemplate.update({
      where: { id: templateId },
      data: {
        ...validatedData,
        version: `${parseFloat(existingTemplate.version) + 0.1}`,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      message: 'Template updated successfully',
      template: updatedTemplate
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    console.error('Template update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const companyId = await getUserCompanyId();
    
    if (!companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get('templateId');

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    // Verify template ownership
    const template = await prisma.projectTemplate.findFirst({
      where: {
        id: templateId,
        companyId: companyId
      }
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found or access denied' }, { status: 404 });
    }

    // Soft delete by setting isActive to false
    await prisma.projectTemplate.update({
      where: { id: templateId },
      data: { isActive: false }
    });

    return NextResponse.json({
      message: 'Template deleted successfully'
    });

  } catch (error) {
    console.error('Template deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
