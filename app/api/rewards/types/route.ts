import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const rewardTypeSchema = z.object({
  name: z.string().min(1, "Reward type name is required"),
  description: z.string().optional(),
  category: z.enum(["performance", "attendance", "learning", "collaboration", "innovation", "milestone"]),
  pointValue: z.number().min(1, "Point value must be at least 1"),
  icon: z.string().optional(),
  color: z.string().optional(),
  isActive: z.boolean().default(true),
});

// GET - Fetch all reward types for company
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

    const rewardTypes = await prisma.rewardType.findMany({
      where: { companyId: user.companyId },
      include: {
        _count: {
          select: { rewards: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(rewardTypes);
  } catch (error) {
    console.error('[REWARD_TYPES_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST - Create new reward type
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
    const validationResult = rewardTypeSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Check if reward type with same name already exists
    const existingRewardType = await prisma.rewardType.findFirst({
      where: {
        name: {
          equals: validatedData.name,
          mode: 'insensitive'
        },
        companyId: user.companyId
      }
    });

    if (existingRewardType) {
      return NextResponse.json(
        { error: 'Reward type with this name already exists' },
        { status: 400 }
      );
    }

    const rewardType = await prisma.rewardType.create({
      data: {
        ...validatedData,
        companyId: user.companyId
      },
      include: {
        _count: {
          select: { rewards: true }
        }
      }
    });

    return NextResponse.json(rewardType);
  } catch (error) {
    console.error('[REWARD_TYPES_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
