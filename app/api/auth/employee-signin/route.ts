import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as z from "zod";
import { generateToken } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";

// Configure route segment config
export const runtime = 'nodejs';

// Define validation schema
const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: Request) {
  try {
    console.log("Employee sign-in API called");
    const body = await req.json();
    console.log("Request body:", { ...body, password: '[REDACTED]' });

    // Validate request body
    const result = signInSchema.safeParse(body);
    if (!result.success) {
      console.log("Validation failed:", result.error.errors);
      return NextResponse.json({
        error: "Invalid input",
        details: result.error.errors
      }, { status: 400 });
    }

    const { email, password } = body;

    try {
      // Check if employee exists
      const employee = await prisma.employee.findUnique({
        where: { email },
        include: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!employee) {
        console.log("Employee not found:", email);
        return NextResponse.json({
          error: "No account found with this email"
        }, { status: 401 });
      }

      // Check if employee has a password set
      if (!employee.password) {
        console.log("Employee has no password set:", email);
        return NextResponse.json({
          error: "Account not activated. Please contact your administrator."
        }, { status: 401 });
      }

      // Verify password
      const passwordMatch = await verifyPassword(password, employee.password);
      if (!passwordMatch) {
        console.log("Invalid password for employee:", email);
        return NextResponse.json({
          error: "Invalid password"
        }, { status: 401 });
      }

      // Generate JWT token
      const { password: _, ...employeeData } = employee;
      const token = await generateToken({
        ...employeeData,
        isEmployee: true // Add flag to identify as employee token
      });

      // Update last login time
      await prisma.employee.update({
        where: { id: employee.id },
        data: { lastLogin: new Date() }
      });

      // Create attendance record
      await prisma.attendance.create({
        data: {
          employeeId: employee.id,
          companyId: employee.companyId,
          date: new Date(),
          checkIn: new Date(),
          status: 'present'
        }
      });

      // Set HTTP-only cookie
      const response = NextResponse.json({
        employee: employeeData,
        message: "Successfully signed in"
      }, { status: 200 });

      // Set the auth cookie
      response.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 1 day
        path: '/',
      });

      // Set employee flag cookie
      response.cookies.set('isEmployee', 'true', {
        path: '/',
        maxAge: 60 * 60 * 24, // 1 day
      });

      console.log("Sign-in successful for employee:", email);
      return response;

    } catch (dbError) {
      console.error("Database operation failed:", dbError);
      return NextResponse.json({
        error: "Database operation failed",
        details: dbError instanceof Error ? dbError.message : "Unknown database error"
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Employee sign-in error:", error);
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
