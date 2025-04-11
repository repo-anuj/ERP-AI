import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { cookies } from "next/headers";

// Configure route segment config
export const runtime = 'nodejs'; // Using nodejs runtime instead of edge for Prisma compatibility

export async function GET() {
  try {
    // Use our custom auth method instead of next-auth
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return new NextResponse("Unauthorized - No token provided", { status: 401 });
    }
    
    const payload = await verifyAuth(token);
    
    if (!payload || !payload.email) {
      return new NextResponse("Unauthorized - Invalid token", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("[NOTIFICATIONS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    // Use our custom auth method instead of next-auth
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return new NextResponse("Unauthorized - No token provided", { status: 401 });
    }
    
    const payload = await verifyAuth(token);
    
    if (!payload || !payload.email) {
      return new NextResponse("Unauthorized - Invalid token", { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return new NextResponse("Notification ID required", { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const notification = await prisma.notification.update({
      where: {
        id,
        userId: user.id,
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error("[NOTIFICATIONS_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
