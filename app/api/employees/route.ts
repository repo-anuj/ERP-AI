import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { z } from "zod";

export const runtime = 'nodejs';

const employeeSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  position: z.string().min(2),
  department: z.string().min(2),
  startDate: z.string(),
  salary: z.number().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["employee", "manager", "admin"]).default("employee"),
});

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const payload = await verifyAuth(token);

    if (!payload.email) {
      return new NextResponse("Invalid token", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      include: {
        company: true,
      },
    });

    if (!user?.company) {
      return new NextResponse("Company not found", { status: 404 });
    }

    const body = await request.json();
    const validatedData = employeeSchema.parse(body);

    // Prepare data for employee creation
    let employeeData = {
      ...validatedData,
      startDate: new Date(validatedData.startDate),
      companyId: user.company.id,
    };

    // Hash password if provided
    if (employeeData.password) {
      employeeData.password = await hashPassword(employeeData.password);
    }

    // Create the employee
    const employee = await prisma.employee.create({
      data: employeeData,
    });

    return NextResponse.json(employee);
  } catch (error) {
    console.error("[EMPLOYEES_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const payload = await verifyAuth(token);

    if (!payload.email) {
      return new NextResponse("Invalid token", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      include: {
        company: true,
      },
    });

    if (!user?.company) {
      return new NextResponse("Company not found", { status: 404 });
    }

    const employees = await prisma.employee.findMany({
      where: {
        companyId: user.company.id,
      },
    });

    // Fetch all projects for the company to map assignments
    const projects = await prisma.project.findMany({
      where: {
        companyId: user.company.id,
      },
      // Remove select to fetch full project objects for better type inference
    });

    // Define the type for a project member inline for clarity
    type ProjectMember = { employeeId: string; name: string; role: string | null; department: string | null; };

    // Create a map for quick lookup: employeeId -> projects
    const employeeProjectMap = new Map<string, { id: string; name: string }[]>();
    projects.forEach(project => {
      // Process project manager
      if (project.projectManager) {
        const managerId = project.projectManager.employeeId;
        if (!employeeProjectMap.has(managerId)) {
          employeeProjectMap.set(managerId, []);
        }
        employeeProjectMap.get(managerId)?.push({ id: project.id, name: project.name });
      }

      // Process team members
      if (project.teamMembers && Array.isArray(project.teamMembers)) {
        project.teamMembers.forEach((member: ProjectMember) => {
          if (!employeeProjectMap.has(member.employeeId)) {
            employeeProjectMap.set(member.employeeId, []);
          }
          employeeProjectMap.get(member.employeeId)?.push({ id: project.id, name: project.name });
        });
      }
    });

    // Add assignments to each employee object
    const employeesWithAssignments = employees.map(employee => ({
      ...employee,
      assignments: employeeProjectMap.get(employee.id) || [],
    }));

    return NextResponse.json(employeesWithAssignments);
  } catch (error) {
    console.error("[EMPLOYEES_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}