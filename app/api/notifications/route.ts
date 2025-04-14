import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { cookies } from "next/headers";

// Configure route segment config
export const runtime = 'nodejs'; // Using nodejs runtime instead of edge for Prisma compatibility

export async function GET() {
  try {
    // Temporarily bypass authentication for development
    // In a production environment, you would use proper authentication

    // Mock notifications data for development
    const mockNotifications = [
      {
        id: '1',
        title: 'Low Inventory Alert',
        message: 'Product "Wireless Headphones" is running low on stock (5 items remaining).',
        type: 'warning',
        module: 'inventory',
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        read: false,
        userId: '1'
      },
      {
        id: '2',
        title: 'New Sale Completed',
        message: 'A new sale of $1,250.00 has been completed for customer "Acme Corp".',
        type: 'success',
        module: 'sales',
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
        read: true,
        userId: '1'
      },
      {
        id: '3',
        title: 'Budget Threshold Exceeded',
        message: 'Marketing department has exceeded their monthly budget by 15%.',
        type: 'error',
        module: 'finance',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
        read: false,
        userId: '1'
      }
    ];

    // Use mock data instead of database query
    const notifications = mockNotifications;

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("[NOTIFICATIONS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    // Temporarily bypass authentication for development
    // In a production environment, you would use proper authentication

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return new NextResponse("Notification ID required", { status: 400 });
    }

    // Mock notification update response
    const notification = {
      id,
      read: true,
      title: 'Updated Notification',
      message: 'This notification has been marked as read',
      type: 'info',
      module: 'system',
      createdAt: new Date().toISOString(),
      userId: '1'
    };

    return NextResponse.json(notification);
  } catch (error) {
    console.error("[NOTIFICATIONS_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
