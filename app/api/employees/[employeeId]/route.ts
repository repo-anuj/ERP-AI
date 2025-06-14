import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
export const dynamic = 'force-dynamic';

// Enhanced Zod schema for validation
const employeeUpdateSchema = z.object({
  // Basic Information
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional().nullable(),
  position: z.string().optional(),
  department: z.string().optional(),
  salary: z.number().positive("Salary must be positive").optional().nullable(),
  status: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  role: z.enum(["employee", "admin", "manager"]).optional(),
  permissions: z.array(z.string()).optional(),

  // Extended Information
  employeeId: z.string().optional(),
  avatar: z.string().optional(),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  maritalStatus: z.enum(["single", "married", "divorced", "widowed"]).optional(),
  nationality: z.string().optional(),
  personalEmail: z.string().email().optional().or(z.literal("")),
  alternatePhone: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelation: z.string().optional(),

  // Address (as embedded object)
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),

  // Work Information
  jobTitle: z.string().optional(),
  workLocation: z.string().optional(),
  manager: z.string().optional(),
  hireDate: z.coerce.date().optional(),
  probationEndDate: z.coerce.date().optional(),
  contractType: z.enum(["permanent", "contract", "temporary", "intern"]).optional(),
  workType: z.enum(["full_time", "part_time", "contract", "freelance"]).optional(),

  // Skills and Additional Info
  skills: z.array(z.string()).optional(),
  bio: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: { employeeId: string } }
) {
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
      include: { company: true }
    });

    if (!user?.companyId) {
      return new NextResponse("Company not found", { status: 404 });
    }

    const { employeeId } = params;

    if (!employeeId) {
      return new NextResponse("Employee ID is required", { status: 400 });
    }

    console.log("Looking for employee:", employeeId, "in company:", user.companyId);

    // Get the employee with all details
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        companyId: user.companyId
      }
    });

    console.log("Found employee:", employee ? "Yes" : "No");

    if (!employee) {
      // Try to find employee without company filter to debug
      const employeeAnyCompany = await prisma.employee.findUnique({
        where: { id: employeeId }
      });

      console.log("Employee exists in any company:", employeeAnyCompany ? "Yes" : "No");
      if (employeeAnyCompany) {
        console.log("Employee company ID:", employeeAnyCompany.companyId, "User company ID:", user.companyId);
      }

      return new NextResponse("Employee not found or you don't have permission", { status: 404 });
    }

    // Get all projects for the company and filter in memory
    const allProjects = await prisma.project.findMany({
      where: {
        companyId: user.companyId
      },
      select: {
        id: true,
        name: true,
        status: true,
        projectManager: true,
        teamMembers: true
      }
    }).catch(error => {
      console.error("Error fetching projects:", error);
      return []; // Return empty array if project query fails
    });

    // Filter projects where employee is assigned
    const projects = allProjects.filter(project => {
      const isManager = project.projectManager?.employeeId === employeeId;
      const isTeamMember = project.teamMembers?.some((member: any) => member.employeeId === employeeId);
      return isManager || isTeamMember;
    });

    // Get recent attendance records
    const recentAttendance = await prisma.attendance.findMany({
      where: {
        employeeId: employeeId,
        companyId: user.companyId
      },
      orderBy: { date: 'desc' },
      take: 10
    });

    // Get assigned tasks
    const assignedTasks = await prisma.task.findMany({
      where: {
        assigneeId: employeeId,
        companyId: user.companyId
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 10
    });

    return NextResponse.json({
      ...employee,
      projects,
      recentAttendance,
      assignedTasks
    });

  } catch (error) {
    console.error("[EMPLOYEE_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { employeeId: string } }
) {
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
      include: { company: true }
    });

    if (!user?.companyId) {
      return new NextResponse("Company not found", { status: 404 });
    }

    const body = await req.json();
    const { employeeId } = params;

    if (!employeeId) {
      return new NextResponse("Employee ID is required", { status: 400 });
    }

    // Validate the request body
    const validationResult = employeeUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return new NextResponse(JSON.stringify(validationResult.error.errors), {
        status: 400,
      });
    }

    const validatedData = validationResult.data;

    // Check if employee belongs to the user's company
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        companyId: user.companyId
      }
    });

    if (!employee) {
      return new NextResponse("Employee not found or you don't have permission", { status: 404 });
    }

    // Handle password hashing if provided
    let dataToUpdate = { ...validatedData };

    if (dataToUpdate.password) {
      dataToUpdate.password = await hashPassword(dataToUpdate.password);
    } else {
      // Remove password field if not provided to avoid overwriting with null
      delete dataToUpdate.password;
    }

    // Update the employee in the database
    const updatedEmployee = await prisma.employee.update({
      where: {
        id: employeeId,
        companyId: user.companyId // Add companyId check for security
      },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedEmployee);

  } catch (error) {
    console.error("[EMPLOYEE_PATCH]", error);
    // Specific error handling (e.g., Prisma not found error)
    if (error instanceof Error && error.message.includes("Record to update not found")) {
       return new NextResponse("Employee not found", { status: 404 });
    }
    return new NextResponse("Internal error", { status: 500 });
  }
}
