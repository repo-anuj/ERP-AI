import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as z from "zod";

export const runtime = 'nodejs';

const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  image: z.string().url().optional(),
});

export async function GET() {
  try {
    console.log("User API route called");
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

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
      where: {
        email: payload.email,
      },
      select: {
        email: true,
        firstName: true,
        lastName: true,
        image: true,
      },
    });

    if (!user) {
      console.log("User not found in database");
      return new NextResponse("User not found", { status: 404 });
    }

    console.log("User found:", { ...user });
    return NextResponse.json(user);
  } catch (error) {
    console.error("[USER_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: {
        email: payload.email,
      },
    });

    if (!existingUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: {
        email: payload.email,
      },
      data: validatedData,
      select: {
        email: true,
        firstName: true,
        lastName: true,
        image: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }

    console.error("[USER_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
