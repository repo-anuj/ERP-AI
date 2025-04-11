import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

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
});

export async function PATCH(
  req: Request,
  { params }: { params: { employeeId: string } }
) {
  try {
    const { userId } = auth();
    const body = await req.json();
    const { employeeId } = params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

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

    // TODO: Add authorization check - Ensure user belongs to the same company as the employee

    // Update the employee in the database
    const updatedEmployee = await prisma.employee.update({
      where: {
        id: employeeId,
        // Optional: Add companyId check for security
        // companyId: user.company.id, // Assuming you fetch user's company ID
      },
      data: validatedData,
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
