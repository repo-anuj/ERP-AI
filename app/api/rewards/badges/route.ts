import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const badgeSchema = z.object({
  name: z.string().min(1, "Badge name is required"),
  description: z.string().optional(),
  category: z.enum(["attendance", "collaboration", "innovation", "performance", "learning", "milestone"]),
  icon: z.string().min(1, "Badge icon is required"),
  color: z.string().min(1, "Badge color is required"),
  criteria: z.object({}).passthrough(), // Flexible criteria object
  rarity: z.enum(["common", "rare", "epic", "legendary"]).default("common"),
  pointsRequired: z.number().optional(),
  isActive: z.boolean().default(true),
});

// GET - Fetch all badges for company
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

    const badges = await prisma.badge.findMany({
      where: { companyId: user.companyId },
      include: {
        _count: {
          select: { employeeBadges: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(badges);
  } catch (error) {
    console.error('[BADGES_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST - Create new badge
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
    const validationResult = badgeSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Check if badge with same name already exists
    const existingBadge = await prisma.badge.findFirst({
      where: {
        name: {
          equals: validatedData.name,
          mode: 'insensitive'
        },
        companyId: user.companyId
      }
    });

    if (existingBadge) {
      return NextResponse.json(
        { error: 'Badge with this name already exists' },
        { status: 400 }
      );
    }

    const badge = await prisma.badge.create({
      data: {
        ...validatedData,
        companyId: user.companyId
      },
      include: {
        _count: {
          select: { employeeBadges: true }
        }
      }
    });

    return NextResponse.json(badge);
  } catch (error) {
    console.error('[BADGES_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
