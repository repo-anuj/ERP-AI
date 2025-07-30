import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const token = cookies().get('token')?.value;

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);

    if (!payload.email) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    console.log("[DEBUG_TASKS] Request from:", payload.email);

    // Get user and company information
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      include: { company: true }
    });

    if (!user?.company) {
      return new NextResponse('Company not found', { status: 404 });
    }

    console.log("[DEBUG_TASKS] Company found:", user.company.id, user.company.name);

    // Get all tasks in the company
    const allTasks = await prisma.task.findMany({
      where: {
        companyId: user.company.id
      },
      select: {
        id: true,
        name: true,
        status: true,
        assigneeId: true,
        assigneeName: true,
        projectId: true,
        companyId: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log("[DEBUG_TASKS] Total tasks found:", allTasks.length);

    // Get all employees in the company
    const allEmployees = await prisma.employee.findMany({
      where: {
        companyId: user.company.id
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        position: true
      }
    });

    console.log("[DEBUG_TASKS] Total employees found:", allEmployees.length);

    // Get all projects in the company
    const allProjects = await prisma.project.findMany({
      where: {
        companyId: user.company.id
      },
      select: {
        id: true,
        name: true,
        status: true,
        projectManager: true
      }
    });

    console.log("[DEBUG_TASKS] Total projects found:", allProjects.length);

    // Try to find current user as employee
    const currentEmployee = await prisma.employee.findFirst({
      where: {
        email: payload.email,
        companyId: user.company.id
      }
    });

    console.log("[DEBUG_TASKS] Current user as employee:", currentEmployee?.id);

    // Get tasks for current employee if found
    const myTasks = currentEmployee ? await prisma.task.findMany({
      where: {
        assigneeId: currentEmployee.id,
        companyId: user.company.id
      }
    }) : [];

    console.log("[DEBUG_TASKS] Tasks for current employee:", myTasks.length);

    return NextResponse.json({
      debug: true,
      user: {
        email: user.email,
        companyId: user.company.id,
        companyName: user.company.name
      },
      currentEmployee: currentEmployee ? {
        id: currentEmployee.id,
        name: `${currentEmployee.firstName} ${currentEmployee.lastName}`,
        email: currentEmployee.email
      } : null,
      stats: {
        totalTasks: allTasks.length,
        totalEmployees: allEmployees.length,
        totalProjects: allProjects.length,
        myTasks: myTasks.length
      },
      tasks: allTasks.slice(0, 10), // First 10 tasks
      employees: allEmployees.slice(0, 10), // First 10 employees
      projects: allProjects.slice(0, 10) // First 10 projects
    });

  } catch (error) {
    console.error('[DEBUG_TASKS] Error:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
