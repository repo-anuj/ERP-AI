import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

// Define Zod schema for validation (adjust fields as needed)
const employeeUpdateSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional().nullable(),
  position: z.string().optional(),
  department: z.string().optional(),
  salary: z.number().positive("Salary must be positive").optional().nullable(),
  status: z.string().optional(), // Consider enum: active, inactive, on_leave etc.
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  role: z.enum(["employee", "admin", "manager"]).optional(),
  permissions: z.array(z.string()).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ employeeId: string }> }
) {
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
      include: { company: true }
    });

    if (!user?.companyId) {
      return new NextResponse("Company not found", { status: 404 });
    }

    const body = await req.json();
    const { employeeId } = await params;

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
