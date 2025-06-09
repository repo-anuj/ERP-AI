import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { withPermission } from "@/lib/api-middleware";
import { PERMISSIONS, getCombinedPermissions } from "@/lib/permissions";

// Schema for permission update
const permissionSchema = z.object({
  permissions: z.array(z.string()),
});

// Get employee permissions
async function getEmployeePermissions(req: NextRequest, { params }: { params: Promise<{ employeeId: string }> }) {
  try {
    const { employeeId } = await params;

    if (!employeeId) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });
    }

    // Get the employee
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // If employee has custom permissions, return those
    if (employee.permissions && employee.permissions.length > 0) {
      return NextResponse.json({
        permissions: employee.permissions,
      });
    }

    // Otherwise, return permissions based on role and department
    const role = employee.role || 'employee';
    const department = employee.department || '';
    const permissions = getCombinedPermissions(role, department);

    return NextResponse.json({
      permissions,
    });
  } catch (error) {
    console.error("[EMPLOYEE_PERMISSIONS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Update employee permissions
async function updateEmployeePermissions(req: NextRequest, { params }: { params: Promise<{ employeeId: string }> }) {
  try {
    const { employeeId } = await params;
    const body = await req.json();

    if (!employeeId) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });
    }

    // Validate request body
    const validationResult = permissionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        error: "Invalid input",
        details: validationResult.error.errors,
      }, { status: 400 });
    }

    const { permissions } = validationResult.data;

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Update employee permissions
    const updatedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: { permissions },
    });

    return NextResponse.json({
      message: "Permissions updated successfully",
      permissions: updatedEmployee.permissions,
    });
  } catch (error) {
    console.error("[EMPLOYEE_PERMISSIONS_PUT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Export the handler with permission check
export const GET = withPermission(getEmployeePermissions, PERMISSIONS.MANAGE_ROLES);
export const PUT = withPermission(updateEmployeePermissions, PERMISSIONS.MANAGE_ROLES);
