import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/password';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export async function POST(request: Request) {
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
    const validationResult = passwordChangeSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Invalid input',
        details: validationResult.error.errors
      }, { status: 400 });
    }

    const { currentPassword, newPassword } = validationResult.data;

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

    // Verify current password
    if (!employee.password) {
      return NextResponse.json({
        error: 'No password set. Contact your administrator.'
      }, { status: 400 });
    }

    const passwordMatch = await verifyPassword(currentPassword, employee.password);
    if (!passwordMatch) {
      return NextResponse.json({
        error: 'Current password is incorrect'
      }, { status: 400 });
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await prisma.employee.update({
      where: { id: employee.id },
      data: {
        password: hashedNewPassword,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('[EMPLOYEE_CHANGE_PASSWORD]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
