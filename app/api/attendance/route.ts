import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const runtime = 'nodejs';

const attendanceSchema = z.object({
  employeeId: z.string(),
  date: z.string(),
  status: z.enum(["present", "absent", "late", "half-day", "leave"]),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);

    if (!payload.email) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      include: { company: true }
    });

    if (!user?.companyId) {
      return new NextResponse('Company not found', { status: 404 });
    }

    // This is a placeholder since we don't have an Attendance model yet
    // In a real implementation, you would query the database for attendance records
    const attendance: any[] = [];

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);

    if (!payload.email) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      include: { company: true }
    });

    if (!user?.companyId) {
      return new NextResponse('Company not found', { status: 404 });
    }

    const data = await req.json();
    const validatedData = attendanceSchema.parse(data);

    // Verify that the employee exists and belongs to the company
    const employee = await prisma.employee.findFirst({
      where: {
        id: validatedData.employeeId,
        companyId: user.companyId
      }
    });

    if (!employee) {
      return new NextResponse('Employee not found', { status: 404 });
    }

    // This is a placeholder since we don't have an Attendance model yet
    // In a real implementation, you would create a new attendance record in the database
    const attendance = {
      id: 'placeholder-id',
      ...validatedData,
      companyId: user.companyId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Error recording attendance:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
