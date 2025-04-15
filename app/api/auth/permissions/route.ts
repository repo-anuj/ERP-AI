import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCombinedPermissions } from "@/lib/permissions";

export async function GET() {
  try {
    const token = cookies().get('token')?.value;
    const isEmployee = cookies().get('isEmployee')?.value === 'true';
    
    if (!token) {
      return NextResponse.json({
        permissions: [],
        role: null,
        department: null,
        isEmployee: false
      }, { status: 401 });
    }

    const payload = await verifyAuth(token);
    
    if (!payload) {
      return NextResponse.json({
        permissions: [],
        role: null,
        department: null,
        isEmployee: false
      }, { status: 401 });
    }

    // Handle employee permissions
    if (isEmployee) {
      // Get employee data
      const employee = await prisma.employee.findUnique({
        where: { id: payload.id },
      });

      if (!employee) {
        return NextResponse.json({
          permissions: [],
          role: null,
          department: null,
          isEmployee: true
        }, { status: 404 });
      }

      // Get combined permissions based on role and department
      const role = employee.role || 'employee';
      const department = employee.department || '';
      const permissions = getCombinedPermissions(role, department);

      // If employee has custom permissions, use those instead
      if (employee.permissions && employee.permissions.length > 0) {
        return NextResponse.json({
          permissions: employee.permissions,
          role,
          department,
          isEmployee: true
        });
      }

      return NextResponse.json({
        permissions,
        role,
        department,
        isEmployee: true
      });
    } 
    // Handle admin/user permissions
    else {
      // Admin users have all permissions
      const user = await prisma.user.findUnique({
        where: { email: payload.email },
      });

      if (!user) {
        return NextResponse.json({
          permissions: [],
          role: null,
          department: null,
          isEmployee: false
        }, { status: 404 });
      }

      // For now, all regular users are considered admins
      const permissions = getCombinedPermissions('admin', '');

      return NextResponse.json({
        permissions,
        role: 'admin',
        department: null,
        isEmployee: false
      });
    }
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return NextResponse.json({
      error: "Failed to fetch permissions",
      permissions: [],
      role: null,
      department: null,
      isEmployee: false
    }, { status: 500 });
  }
}
