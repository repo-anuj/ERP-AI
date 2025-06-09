import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for task validation
const taskSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  status: z.enum(["not_started", "in_progress", "completed", "blocked"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  assigneeId: z.string(),
  assigneeName: z.string(),
  startDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  estimatedHours: z.coerce.number().int().min(0),
  actualHours: z.coerce.number().min(0),
  completionPercentage: z.coerce.number().int().min(0).max(100),
  dependencies: z.array(z.string()).optional(),
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
    const priority = url.searchParams.get('priority');
    const assigneeId = url.searchParams.get('assigneeId');
    
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
    
    if (priority) {
      where.priority = priority;
    }
    
    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    // Get tasks with filters
    const tasks = await prisma.task.findMany({
      where,
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { dueDate: 'asc' }
      ]
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
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
    const validatedData = taskSchema.parse(data);
    
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
    
    // Create the task
    const task = await prisma.task.create({
      data: {
        ...validatedData,
        dependencies: validatedData.dependencies || [],
        companyId
      }
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error creating task:', error);
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
        { error: "Task ID is required" },
        { status: 400 }
      );
    }
    
    // Validate input data (excluding id)
    const { id, ...updateData } = data;
    const validatedData = taskSchema.parse(updateData);
    
    // Check if task exists and belongs to the company
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        companyId
      }
    });
    
    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found or you don't have permission to update it" },
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

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        ...validatedData,
        dependencies: validatedData.dependencies || []
      }
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
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
        { error: "Task ID is required" },
        { status: 400 }
      );
    }
    
    // Check if task exists and belongs to the company
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        companyId
      }
    });
    
    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found or you don't have permission to delete it" },
        { status: 404 }
      );
    }
    
    // Delete the task
    await prisma.task.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    if ((error as Error).message === 'Unauthorized') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    if ((error as Error).message === 'Company not found') {
      return new NextResponse('Company not found', { status: 404 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
