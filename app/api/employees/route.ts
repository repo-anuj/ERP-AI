import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { z } from "zod";
export const dynamic = 'force-dynamic';

export const runtime = 'nodejs';

const employeeSchema = z.object({
  // Basic Information
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().nullable(),
  position: z.string().min(2, "Position must be at least 2 characters"),
  department: z.string().min(1, "Department is required").optional(),
  startDate: z.string().min(1, "Start date is required"),
  salary: z.number().positive("Salary must be positive").optional().nullable(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  role: z.enum(["employee", "manager", "admin"]).default("employee"),
  status: z.string().default("active"),

  // Extended Information
  employeeId: z.string().optional().nullable(),
  avatar: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  maritalStatus: z.enum(["single", "married", "divorced", "widowed"]).optional(),
  nationality: z.string().optional().nullable(),
  personalEmail: z.string().email("Invalid personal email").optional().nullable().or(z.literal("")),
  alternatePhone: z.string().optional().nullable(),
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
  emergencyContactRelation: z.string().optional().nullable(),

  // Address (as embedded object)
  address: z.object({
    street: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    zipCode: z.string().optional().nullable(),
    country: z.string().optional().nullable(),
  }).optional().nullable(),

  // Work Information
  jobTitle: z.string().optional().nullable(),
  workLocation: z.string().optional().nullable(),
  hireDate: z.string().optional().nullable(),
  contractType: z.enum(["permanent", "contract", "temporary", "intern"]).optional(),
  workType: z.enum(["full_time", "part_time", "contract", "freelance"]).optional(),

  // Skills and Additional Info
  skills: z.array(z.string()).optional().default([]),
  bio: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      console.error("[EMPLOYEES_POST] No token provided");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const payload = await verifyAuth(token);

    if (!payload.email) {
      console.error("[EMPLOYEES_POST] Invalid token - no email");
      return new NextResponse("Invalid token", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      include: {
        company: true,
      },
    });

    if (!user?.company) {
      console.error("[EMPLOYEES_POST] Company not found for user:", payload.email);
      return new NextResponse("Company not found", { status: 404 });
    }

    const body = await request.json();
    console.log("[EMPLOYEES_POST] Request body:", body);

    const validatedData = employeeSchema.parse(body);
    console.log("[EMPLOYEES_POST] Validated data:", validatedData);

    // Handle department - find or create department
    let departmentId = null;
    if (validatedData.department) {
      // First try to find existing department
      let department = await prisma.department.findFirst({
        where: {
          name: {
            equals: validatedData.department,
            mode: 'insensitive'
          },
          companyId: user.company.id
        }
      });

      // If department doesn't exist, create it
      if (!department) {
        department = await prisma.department.create({
          data: {
            name: validatedData.department,
            companyId: user.company.id
          }
        });
      }

      departmentId = department.id;
    }

    // Prepare data for employee creation
    let employeeData: any = {
      ...validatedData,
      startDate: new Date(validatedData.startDate),
      dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : undefined,
      hireDate: validatedData.hireDate ? new Date(validatedData.hireDate) : undefined,
      departmentId: departmentId,
      companyId: user.company.id,
    };

    // Remove the department field since we're using departmentId
    delete employeeData.department;

    // Clean up undefined values that might cause Prisma issues
    Object.keys(employeeData).forEach(key => {
      if (employeeData[key] === undefined) {
        delete employeeData[key];
      }
    });

    // Hash password if provided
    if (employeeData.password) {
      employeeData.password = await hashPassword(employeeData.password);
      console.log("[EMPLOYEES_POST] Password hashed successfully");
    }

    console.log("[EMPLOYEES_POST] Creating employee with data:", {
      ...employeeData,
      password: employeeData.password ? "[HASHED]" : undefined
    });

    // Create the employee with error handling
    const employee = await prisma.employee.create({
      data: employeeData,
      include: {
        department: true,
        company: true,
      }
    });

    console.log("[EMPLOYEES_POST] Employee created successfully:", employee.id);

    // Return employee without sensitive data
    const { password: _, ...employeeResponse } = employee;
    return NextResponse.json(employeeResponse);
  } catch (error) {
    console.error("[EMPLOYEES_POST] Error details:", error);

    if (error instanceof z.ZodError) {
      console.error("[EMPLOYEES_POST] Validation errors:", error.errors);
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    // Handle Prisma specific errors
    if (error instanceof Error) {
      console.error("[EMPLOYEES_POST] Error message:", error.message);
      console.error("[EMPLOYEES_POST] Error stack:", error.stack);

      // Handle unique constraint violations
      if (error.message.includes('Unique constraint failed')) {
        return NextResponse.json(
          { error: "Email already exists", details: "An employee with this email already exists" },
          { status: 409 }
        );
      }

      // Handle database connection issues
      if (error.message.includes('Connection') || error.message.includes('timeout')) {
        return NextResponse.json(
          { error: "Database connection error", details: "Please try again in a moment" },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const cookieStore = cookies();
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
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
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