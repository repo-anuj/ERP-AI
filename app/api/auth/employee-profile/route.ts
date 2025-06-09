import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = 'nodejs';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const isEmployee = cookieStore.get('isEmployee')?.value === 'true';

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyAuth(token);

    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // If it's an employee token
    if (isEmployee) {
      const employee = await prisma.employee.findUnique({
        where: { id: payload.id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          position: true,
          department: true,
          startDate: true,
          status: true,
          role: true,
          lastLogin: true,
          company: {
            select: {
              id: true,
              name: true,
              logo: true,
            }
          }
        }
      });

      if (!employee) {
        return NextResponse.json({ error: "Employee not found" }, { status: 404 });
      }

      // Get attendance records
      const attendanceRecords = await prisma.attendance.findMany({
        where: {
          employeeId: employee.id,
          date: {
            gte: new Date(new Date().setDate(new Date().getDate() - 30)) // Last 30 days
          }
        },
        orderBy: { date: 'desc' },
        take: 10
      });

      return NextResponse.json({
        ...employee,
        isEmployee: true,
        attendanceRecords
      });
    }
    // If it's a regular user token
    else {
      const user = await prisma.user.findUnique({
        where: { email: payload.email },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          company: {
            select: {
              id: true,
              name: true,
              logo: true,
            }
          }
        }
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      return NextResponse.json({
        ...user,
        isEmployee: false
      });
    }
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
