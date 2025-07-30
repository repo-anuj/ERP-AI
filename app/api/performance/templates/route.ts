import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

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
  })),
  ratingScale: z.object({
    min: z.number(),
    max: z.number(),
    labels: z.array(z.string()),
  }),
  selfReviewEnabled: z.boolean().default(true),
  managerReviewEnabled: z.boolean().default(true),
  peerReviewEnabled: z.boolean().default(false),
  skipLevelReviewEnabled: z.boolean().default(false),
  autoAssignReviews: z.boolean().default(false),
  reminderSettings: z.object({
    enabled: z.boolean(),
    daysBefore: z.array(z.number()),
  }).optional(),
});

// GET - Fetch all performance templates for company
export async function GET() {
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

    const templates = await prisma.performanceTemplate.findMany({
      where: { companyId: user.companyId },
      include: {
        _count: {
          select: { performanceReviews: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('[PERFORMANCE_TEMPLATES_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST - Create new performance template
export async function POST(request: Request) {
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
    const validationResult = performanceTemplateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Check if template with same name already exists
    const existingTemplate = await prisma.performanceTemplate.findFirst({
      where: {
        name: {
          equals: validatedData.name,
          mode: 'insensitive'
        },
        companyId: user.companyId
      }
    });

    if (existingTemplate) {
      return NextResponse.json(
        { error: 'Performance template with this name already exists' },
        { status: 400 }
      );
    }

    const template = await prisma.performanceTemplate.create({
      data: {
        ...validatedData,
        companyId: user.companyId
      },
      include: {
        _count: {
          select: { performanceReviews: true }
        }
      }
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('[PERFORMANCE_TEMPLATES_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
