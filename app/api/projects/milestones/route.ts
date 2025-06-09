import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for milestone validation
const milestoneSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  targetDate: z.coerce.date(),
  completionDate: z.coerce.date().optional().nullable(),
  status: z.enum(["pending", "completed", "missed"]),
  deliverables: z.string().optional(),
  notes: z.string().optional(),
});

// Helper function to check user authorization and get company ID
async function getUserCompanyId() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  
  if (!token) {
    throw new Error('Unauthorized');
  }

  const payload = await verifyAuth(token);
  
  if (!payload.email || typeof payload.email !== 'string') {
    throw new Error('Invalid token');
  }

  const user = await prisma.user.findUnique({
    where: { email: payload.email },
    include: { company: true }
  });

  if (!user?.companyId) {
    throw new Error('Company not found');
  }

  return user.companyId;
}

export async function GET(req: Request) {
  try {
    // Get search params
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId');
    const status = url.searchParams.get('status');
    
    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }
    
    const companyId = await getUserCompanyId();
    
    // Verify project belongs to company
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        companyId
      }
    });
    
    if (!project) {
      return NextResponse.json(
        { error: "Project not found or you don't have permission to access it" },
        { status: 404 }
      );
    }
    
    // Build filter conditions
    const where: any = { 
      projectId,
      companyId
    };
    
    if (status) {
      where.status = status;
    }

    // Get milestones with filters
    const milestones = await prisma.milestone.findMany({
      where,
      orderBy: { targetDate: 'asc' }
    });

    return NextResponse.json(milestones);
  } catch (error) {
    console.error('Error fetching milestones:', error);
    if ((error as Error).message === 'Unauthorized') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    if ((error as Error).message === 'Company not found') {
      return new NextResponse('Company not found', { status: 404 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const companyId = await getUserCompanyId();
    const data = await req.json();
    
    // Validate input data
    const validatedData = milestoneSchema.parse(data);
    
    // Verify project belongs to company
    const project = await prisma.project.findFirst({
      where: {
        id: validatedData.projectId,
        companyId
      }
    });
    
    if (!project) {
      return NextResponse.json(
        { error: "Project not found or you don't have permission to access it" },
        { status: 404 }
      );
    }
    
    // Create the milestone
    const milestone = await prisma.milestone.create({
      data: {
        ...validatedData,
        companyId
      }
    });

    return NextResponse.json(milestone);
  } catch (error) {
    console.error('Error creating milestone:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    if ((error as Error).message === 'Unauthorized') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    if ((error as Error).message === 'Company not found') {
      return new NextResponse('Company not found', { status: 404 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const companyId = await getUserCompanyId();
    const data = await req.json();
    
    // Ensure ID is provided
    if (!data.id) {
      return NextResponse.json(
        { error: "Milestone ID is required" },
        { status: 400 }
      );
    }
    
    // Validate input data (excluding id)
    const { id, ...updateData } = data;
    const validatedData = milestoneSchema.parse(updateData);
    
    // Check if milestone exists and belongs to the company
    const existingMilestone = await prisma.milestone.findFirst({
      where: {
        id,
        companyId
      }
    });
    
    if (!existingMilestone) {
      return NextResponse.json(
        { error: "Milestone not found or you don't have permission to update it" },
        { status: 404 }
      );
    }
    
    // Verify project belongs to company
    const project = await prisma.project.findFirst({
      where: {
        id: validatedData.projectId,
        companyId
      }
    });
    
    if (!project) {
      return NextResponse.json(
        { error: "Project not found or you don't have permission to access it" },
        { status: 404 }
      );
    }

    const updatedMilestone = await prisma.milestone.update({
      where: { id },
      data: validatedData
    });

    return NextResponse.json(updatedMilestone);
  } catch (error) {
    console.error('Error updating milestone:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    if ((error as Error).message === 'Unauthorized') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    if ((error as Error).message === 'Company not found') {
      return new NextResponse('Company not found', { status: 404 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const companyId = await getUserCompanyId();
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: "Milestone ID is required" },
        { status: 400 }
      );
    }
    
    // Check if milestone exists and belongs to the company
    const existingMilestone = await prisma.milestone.findFirst({
      where: {
        id,
        companyId
      }
    });
    
    if (!existingMilestone) {
      return NextResponse.json(
        { error: "Milestone not found or you don't have permission to delete it" },
        { status: 404 }
      );
    }
    
    // Delete the milestone
    await prisma.milestone.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting milestone:', error);
    if ((error as Error).message === 'Unauthorized') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    if ((error as Error).message === 'Company not found') {
      return new NextResponse('Company not found', { status: 404 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
