import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { cookies } from "next/headers";

// Configure route segment config
export const runtime = 'nodejs'; // Using nodejs runtime instead of edge for Prisma compatibility

export async function GET(req: Request) {
  try {
    // Use our custom auth method instead of next-auth
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const isEmployee = cookieStore.get('isEmployee')?.value === 'true';

    if (!token) {
      return new NextResponse("Unauthorized - No token provided", { status: 401 });
    }

    const payload = await verifyAuth(token);

    if (!payload) {
      return new NextResponse("Unauthorized - Invalid token", { status: 401 });
    }

    // Parse query parameters
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const page = parseInt(url.searchParams.get('page') || '1');
    const isReadParam = url.searchParams.get('isRead');
    const category = url.searchParams.get('category') || undefined;
    const type = url.searchParams.get('type') || undefined;
    const isActionRequiredParam = url.searchParams.get('isActionRequired');

    // Build the where clause
    let where: any = {};

    // For now, we'll just get all notifications for the user
    // In the future, we'll add more specific filtering by recipient
    if (!isEmployee) {
      // For regular users, we need to get their ID from the database
      const user = await prisma.user.findUnique({
        where: { email: payload.email },
        select: { id: true }
      });

      if (!user) {
        return new NextResponse("User not found", { status: 404 });
      }

      where.userId = user.id;
    }

    // Add optional filters
    if (isReadParam !== null) {
      where.read = isReadParam === 'true';
    }

    if (category) {
      where.category = category;
    }

    if (type) {
      where.type = type;
    }

    if (isActionRequiredParam !== null) {
      where.isActionRequired = isActionRequiredParam === 'true';
    }

    // Get total count for pagination
    const totalCount = await prisma.notification.count({ where });

    // Get notifications
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      notifications,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("[NOTIFICATIONS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    // Use our custom auth method instead of next-auth
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return new NextResponse("Unauthorized - No token provided", { status: 401 });
    }

    const payload = await verifyAuth(token);

    if (!payload) {
      return new NextResponse("Unauthorized - Invalid token", { status: 401 });
    }

    const body = await request.json();
    const { id, isRead = true } = body;

    if (!id) {
      return new NextResponse("Notification ID required", { status: 400 });
    }

    // We don't need to check company ID for now

    // First check if the notification exists
    const notificationExists = await prisma.notification.findUnique({
      where: {
        id
      }
    });

    if (!notificationExists) {
      return new NextResponse("Notification not found or you don't have permission", { status: 404 });
    }

    // Build the data to update
    const data: any = {};

    if (isRead !== undefined) {
      data.read = isRead;
    }

    // Update the notification
    const notification = await prisma.notification.update({
      where: { id },
      data,
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error("[NOTIFICATIONS_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// For now, we'll disable the comment functionality since it requires schema changes
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return new NextResponse("Unauthorized - No token provided", { status: 401 });
    }

    const payload = await verifyAuth(token);

    if (!payload) {
      return new NextResponse("Unauthorized - Invalid token", { status: 401 });
    }

    const body = await request.json();
    const { notificationId, message } = body;

    if (!notificationId || !message) {
      return new NextResponse("Notification ID and message are required", { status: 400 });
    }

    // Check if the notification exists
    const notification = await prisma.notification.findUnique({
      where: {
        id: notificationId,
      },
    });

    if (!notification) {
      return new NextResponse("Notification not found", { status: 404 });
    }

    // For now, we'll just return a success message without actually creating a comment
    // This will be implemented in a future update when the schema is updated

    return NextResponse.json({
      success: true,
      message: "Comment functionality will be implemented in a future update"
    });
  } catch (error) {
    console.error("[NOTIFICATIONS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
