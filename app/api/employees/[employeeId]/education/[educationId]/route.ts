import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const educationSchema = z.object({
  institution: z.string().min(1, "Institution name is required"),
  degree: z.string().min(1, "Degree is required"),
  fieldOfStudy: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  gpa: z.string().optional(),
  description: z.string().optional(),
});

// PUT - Update education record
export async function PUT(
  request: Request,
  { params }: { params: { employeeId: string; educationId: string } }
) {
  try {
    const cookieStore = cookies();
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

    const { employeeId, educationId } = params;
    const body = await request.json();

    // Validate the request body
    const validationResult = educationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Verify employee belongs to user's company
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        companyId: user.companyId
      }
    });

    if (!employee) {
      return new NextResponse('Employee not found', { status: 404 });
    }

    // Find and update the education record
    const educationRecords = employee.education || [];
    const recordIndex = educationRecords.findIndex((record: any) => record.id === educationId);

    if (recordIndex === -1) {
      return new NextResponse('Education record not found', { status: 404 });
    }

    // Update the record
    const updatedRecord = {
      ...educationRecords[recordIndex],
      ...validatedData,
    };

    educationRecords[recordIndex] = updatedRecord;

    // Update employee with modified education array
    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        education: educationRecords
      }
    });

    return NextResponse.json(updatedRecord);
  } catch (error) {
    console.error('[EDUCATION_PUT]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// DELETE - Delete education record
export async function DELETE(
  request: Request,
  { params }: { params: { employeeId: string; educationId: string } }
) {
  try {
    const cookieStore = cookies();
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

    const { employeeId, educationId } = params;

    // Verify employee belongs to user's company
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        companyId: user.companyId
      }
    });

    if (!employee) {
      return new NextResponse('Employee not found', { status: 404 });
    }

    // Find and remove the education record
    const educationRecords = employee.education || [];
    const recordIndex = educationRecords.findIndex((record: any) => record.id === educationId);

    if (recordIndex === -1) {
      return new NextResponse('Education record not found', { status: 404 });
    }

    // Remove the record
    educationRecords.splice(recordIndex, 1);

    // Update employee with modified education array
    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        education: educationRecords
      }
    });

    return NextResponse.json({ message: 'Education record deleted successfully' });
  } catch (error) {
    console.error('[EDUCATION_DELETE]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
