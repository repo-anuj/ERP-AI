import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const employeeSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  position: z.string().min(2),
  department: z.string().min(2),
  startDate: z.string(),
  salary: z.number().optional(),
});

export async function POST(request: Request) {
  try {
    const token = cookies().get('token')?.value;
    
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

    const employee = await prisma.employee.create({
      data: {
        ...validatedData,
        startDate: new Date(validatedData.startDate),
        companyId: user.company.id,
      },
    });

    return NextResponse.json(employee);
  } catch (error) {
    console.error("[EMPLOYEES_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET() {
  try {
    const token = cookies().get('token')?.value;
    
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
    type ProjectMember = { employeeId: string; name: string; role?: string; department?: string; };

    // Create a map for quick lookup: employeeId -> projects
    const employeeProjectMap = new Map<string, { id: string; name: string }[]>();
    projects.forEach(project => {
      // Ensure project.members exists before trying to iterate
      if (project.members && Array.isArray(project.members)) {
        project.members.forEach((member: ProjectMember) => { 
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