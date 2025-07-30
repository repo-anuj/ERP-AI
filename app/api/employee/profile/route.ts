import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const profileUpdateSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().optional(),
});

export async function PUT(request: Request) {
  try {
    const token = cookies().get('token')?.value;

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload.email) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    const body = await request.json();
    const validationResult = profileUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Invalid input',
        details: validationResult.error.errors
      }, { status: 400 });
    }

    const { firstName, lastName, phone } = validationResult.data;

    // Get user and company information
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      include: { company: true }
    });

    if (!user?.company) {
      return new NextResponse('Company not found', { status: 404 });
    }

    // Get employee record
    const employee = await prisma.employee.findFirst({
      where: {
        email: payload.email,
        companyId: user.company.id
      }
    });

    if (!employee) {
      return new NextResponse('Employee not found', { status: 404 });
    }

    // Update employee profile
    const updatedEmployee = await prisma.employee.update({
      where: { id: employee.id },
      data: {
        firstName,
        lastName,
        phone: phone || null,
        updatedAt: new Date()
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        position: true,
        department: true,
        startDate: true,
        employeeId: true,
        company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Profile updated successfully',
      employee: updatedEmployee
    });

  } catch (error) {
    console.error('[EMPLOYEE_PROFILE_PUT]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
