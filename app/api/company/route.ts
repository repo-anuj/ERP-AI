import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        company: true,
      },
    });

    if (!user || !user.company) {
      return new NextResponse("Company not found", { status: 404 });
    }

    return NextResponse.json(user.company);
  } catch (error) {
    console.error("[COMPANY_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateCompanySchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
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

    // Create a notification for the company update
    await prisma.notification.create({
      data: {
        title: "Company Information Updated",
        message: `Company details were updated by ${user.firstName || user.email}`,
        userId: user.id,
        type: "COMPANY_UPDATE",
      },
    });

    return NextResponse.json(updatedCompany);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    
    console.error("[COMPANY_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
