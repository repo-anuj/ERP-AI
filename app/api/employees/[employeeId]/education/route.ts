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

// GET - Fetch all education records for an employee
export async function GET(
  request: Request,
  { params }: { params: { employeeId: string } }
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

    const { employeeId } = params;

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

    // Return education records from the employee's education array
    const educationRecords = employee.education || [];
    
    return NextResponse.json(educationRecords);
  } catch (error) {
    console.error('[EDUCATION_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST - Add new education record
export async function POST(
  request: Request,
  { params }: { params: { employeeId: string } }
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

    const { employeeId } = params;
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

    // Create new education record with unique ID
    const newEducationRecord = {
      id: `edu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...validatedData,
    };

    // Add to existing education array
    const updatedEducation = [...(employee.education || []), newEducationRecord];

    // Update employee with new education record
    const updatedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        education: updatedEducation
      }
    });

    return NextResponse.json(newEducationRecord);
  } catch (error) {
    console.error('[EDUCATION_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
