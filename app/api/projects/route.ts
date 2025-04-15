import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createProjectBudget, updateProjectBudget, getProjectFinancialSummary } from '@/lib/project-finance-integration';

// Schema for project validation
const projectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.enum(["internal", "client", "research", "maintenance"]),
  status: z.enum(["planning", "in_progress", "on_hold", "completed", "cancelled"]),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  completionPercentage: z.coerce.number().int().min(0).max(100),
  projectManager: z.object({
    employeeId: z.string(),
    name: z.string(),
    role: z.string().optional(),
    department: z.string().optional(),
  }),
  teamMembers: z.array(
    z.object({
      employeeId: z.string(),
      name: z.string(),
      role: z.string().optional(),
      department: z.string().optional(),
    })
  ).optional(),
  client: z.object({
    customerId: z.string().optional(),
    name: z.string(),
    company: z.string().optional(),
    email: z.string().email().optional(),
  }).optional(),
  budget: z.coerce.number().min(0),
  expenses: z.coerce.number().min(0),
  priority: z.enum(["low", "medium", "high"]),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

// Helper function to check user authorization and get company ID
async function getUserCompanyId() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const isEmployee = cookieStore.get('isEmployee')?.value === 'true';

  if (!token) {
    throw new Error('Unauthorized');
  }

  const payload = await verifyAuth(token);

  if (!payload) {
    throw new Error('Invalid token');
  }

  // Handle employee tokens
  if (isEmployee) {
    // For employees, the company ID is directly in the token payload
    if (payload.companyId) {
      return payload.companyId;
    }

    // If not in the token, try to get it from the database
    const employee = await prisma.employee.findUnique({
      where: { id: payload.id },
      select: { companyId: true },
    });

    if (!employee?.companyId) {
      throw new Error('Company not found for employee');
    }

    return employee.companyId;
  }
  // Handle regular user tokens
  else {
    if (!payload.email || typeof payload.email !== 'string') {
      throw new Error('Invalid token - missing email');
    }

    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      include: { company: true }
    });

    if (!user?.companyId) {
      throw new Error('Company not found for user');
    }

    return user.companyId;
  }
}

export async function GET(req: Request) {
  try {
    // Get search params
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const type = url.searchParams.get('type');
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');
    const search = url.searchParams.get('search');

    const companyId = await getUserCompanyId();

    // If ID is provided, fetch a single project
    if (id) {
      const project = await prisma.project.findFirst({
        where: {
          id,
          companyId
        },
        include: {
          tasks: true,
          milestones: true
        }
      });

      if (!project) {
        return NextResponse.json(
          { error: "Project not found or you don't have permission to access it" },
          { status: 404 }
        );
      }

      // If requesting a single project, include financial data
    if (id) {
      // Get financial summary for the project
      const financialSummary = await getProjectFinancialSummary(id, companyId);

      // Return project with financial data
      return NextResponse.json({
        ...project,
        financialSummary
      });
    }

    return NextResponse.json(project);
    }

    // Otherwise, build filter conditions for listing projects
    const where: any = { companyId };

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get projects with filters
    const projects = await prisma.project.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        tasks: true,
        milestones: true
      }
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
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
    const validatedData = projectSchema.parse(data);

    // Create the project
    const project = await prisma.project.create({
      data: {
        ...validatedData,
        companyId,
        teamMembers: validatedData.teamMembers || [],
        tags: validatedData.tags || [],
      }
    });

    // Create a budget for the new project
    const user = await prisma.user.findFirst({
      where: { companyId }
    });

    if (user) {
      const projectBudget = await createProjectBudget(project, user.id);
      if (!projectBudget) {
        console.warn('Failed to create budget for project', project.id);
      }
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error creating project:', error);
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
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Validate input data (excluding id)
    const { id, ...updateData } = data;
    const validatedData = projectSchema.parse(updateData);

    // Check if project exists and belongs to the company
    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        companyId
      }
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: "Project not found or you don't have permission to update it" },
        { status: 404 }
      );
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        ...validatedData,
        teamMembers: validatedData.teamMembers || [],
        tags: validatedData.tags || [],
      }
    });

    // Update the project's budget
    const user = await prisma.user.findFirst({
      where: { companyId }
    });

    if (user) {
      const updatedBudget = await updateProjectBudget(updatedProject, user.id);
      if (!updatedBudget) {
        console.warn('Failed to update budget for project', updatedProject.id);
      }
    }

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
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
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Check if project exists and belongs to the company
    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        companyId
      }
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: "Project not found or you don't have permission to delete it" },
        { status: 404 }
      );
    }

    // Delete associated tasks and milestones first
    await prisma.task.deleteMany({
      where: { projectId: id }
    });

    await prisma.milestone.deleteMany({
      where: { projectId: id }
    });

    // Delete the project
    await prisma.project.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    if ((error as Error).message === 'Unauthorized') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    if ((error as Error).message === 'Company not found') {
      return new NextResponse('Company not found', { status: 404 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
