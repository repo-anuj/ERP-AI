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

// PUT - Update reward type
export async function PUT(
  request: Request,
  { params }: { params: { typeId: string } }
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

    const { typeId } = params;
    const body = await request.json();

    const validationResult = rewardTypeSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Verify reward type belongs to user's company
    const rewardType = await prisma.rewardType.findFirst({
      where: {
        id: typeId,
        companyId: user.companyId
      }
    });

    if (!rewardType) {
      return new NextResponse('Reward type not found', { status: 404 });
    }

    // Check if another reward type with same name exists (excluding current one)
    if (validatedData.name !== rewardType.name) {
      const existingRewardType = await prisma.rewardType.findFirst({
        where: {
          name: {
            equals: validatedData.name,
            mode: 'insensitive'
          },
          companyId: user.companyId,
          id: {
            not: typeId
          }
        }
      });

      if (existingRewardType) {
        return NextResponse.json(
          { error: 'Reward type with this name already exists' },
          { status: 400 }
        );
      }
    }

    const updatedRewardType = await prisma.rewardType.update({
      where: { id: typeId },
      data: validatedData,
      include: {
        _count: {
          select: { rewards: true }
        }
      }
    });

    return NextResponse.json(updatedRewardType);
  } catch (error) {
    console.error('[REWARD_TYPE_PUT]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// DELETE - Delete reward type
export async function DELETE(
  request: Request,
  { params }: { params: { typeId: string } }
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

    const { typeId } = params;

    // Verify reward type belongs to user's company
    const rewardType = await prisma.rewardType.findFirst({
      where: {
        id: typeId,
        companyId: user.companyId
      }
    });

    if (!rewardType) {
      return new NextResponse('Reward type not found', { status: 404 });
    }

    // Check if reward type has been used
    const rewardCount = await prisma.reward.count({
      where: {
        rewardTypeId: typeId,
        companyId: user.companyId
      }
    });

    if (rewardCount > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete reward type with existing rewards', 
          message: `This reward type has ${rewardCount} reward(s). Please archive it instead of deleting.`
        },
        { status: 400 }
      );
    }

    await prisma.rewardType.delete({
      where: { id: typeId }
    });

    return NextResponse.json({ message: 'Reward type deleted successfully' });
  } catch (error) {
    console.error('[REWARD_TYPE_DELETE]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
