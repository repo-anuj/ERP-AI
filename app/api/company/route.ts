import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

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
    const token = cookies().get('token')?.value;
    
    if (!token) {
      console.log("No token found");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    console.log("Verifying token...");
    const payload = await verifyAuth(token);
    
    if (!payload.email) {
      console.log("Invalid token payload");
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
      console.log("Company not found");
      return new NextResponse("Company not found", { status: 404 });
    }

    console.log("Company found:", { ...user.company });
    return NextResponse.json(user.company);
  } catch (error) {
    console.error("[COMPANY_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const token = cookies().get('token')?.value;
    
    if (!token) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const payload = await verifyAuth(token);
    
    if (!payload.email) {
      return new NextResponse("Invalid token", { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateCompanySchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      include: {
        company: true,
      },
    });

    if (!user || !user.company) {
      return new NextResponse("Company not found", { status: 404 });
    }

    const updatedCompany = await prisma.company.update({
      where: { id: user.company.id },
      data: validatedData,
    });

    return NextResponse.json(updatedCompany);
  } catch (error) {
    console.error("[COMPANY_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
