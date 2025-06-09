import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = 'nodejs';

const updateCompanySchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  logo: z.string().url().optional(),
});

export async function GET() {
  try {
    console.log("Company API route called");
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const isEmployee = cookieStore.get('isEmployee')?.value === 'true';

    if (!token) {
      console.log("No token found");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    console.log("Verifying token...");
    const payload = await verifyAuth(token);

    if (!payload) {
      console.log("Invalid token payload");
      return new NextResponse("Invalid token", { status: 401 });
    }

    let company;

    // Handle employee tokens
    if (isEmployee) {
      console.log("Processing employee token for ID:", payload.id);

      // Get employee with company
      const employee = await prisma.employee.findUnique({
        where: { id: payload.id },
        include: {
          company: true,
        },
      });

      if (!employee || !employee.company) {
        console.log("Company not found for employee");
        return new NextResponse("Company not found", { status: 404 });
      }

      company = employee.company;
    }
    // Handle regular user tokens
    else {
      if (!payload.email) {
        console.log("Invalid token payload - missing email");
        return new NextResponse("Invalid token", { status: 401 });
      }

      console.log("Finding user with email:", payload.email);
      const user = await prisma.user.findUnique({
        where: { email: payload.email },
        include: {
          company: true,
        },
      });

      if (!user || !user.company) {
        console.log("Company not found for user");
        return new NextResponse("Company not found", { status: 404 });
      }

      company = user.company;
    }

    console.log("Company found:", { id: company.id, name: company.name });
    return NextResponse.json(company);
  } catch (error) {
    console.error("[COMPANY_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const isEmployee = cookieStore.get('isEmployee')?.value === 'true';

    if (!token) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const payload = await verifyAuth(token);

    if (!payload) {
      return new NextResponse("Invalid token", { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateCompanySchema.parse(body);

    let companyId;

    // Handle employee tokens
    if (isEmployee) {
      // Get employee's company ID
      const employee = await prisma.employee.findUnique({
        where: { id: payload.id },
        select: { companyId: true },
      });

      if (!employee?.companyId) {
        return new NextResponse("Company not found for employee", { status: 404 });
      }

      companyId = employee.companyId;
    }
    // Handle regular user tokens
    else {
      if (!payload.email) {
        return new NextResponse("Invalid token - missing email", { status: 401 });
      }

      const user = await prisma.user.findUnique({
        where: { email: payload.email },
        include: {
          company: true,
        },
      });

      if (!user || !user.company) {
        return new NextResponse("Company not found for user", { status: 404 });
      }

      companyId = user.company.id;
    }

    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: validatedData,
    });

    return NextResponse.json(updatedCompany);
  } catch (error) {
    console.error("[COMPANY_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
