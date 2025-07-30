import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const departmentSchema = z.object({
  name: z.string().min(2, "Department name is required"),
  description: z.string().optional(),
  manager: z.string().optional(),
});

// PUT - Update department
export async function PUT(
  request: Request,
  { params }: { params: { departmentId: string } }
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

    const { departmentId } = params;
    const body = await request.json();

    // Validate the request body
    const validationResult = departmentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Verify department belongs to user's company
    const department = await prisma.department.findFirst({
      where: {
        id: departmentId,
        companyId: user.companyId
      }
    });

    if (!department) {
      return new NextResponse('Department not found', { status: 404 });
    }

    // Check if another department with same name exists (excluding current one)
    if (validatedData.name !== department.name) {
      const existingDepartment = await prisma.department.findFirst({
        where: {
          name: {
            equals: validatedData.name,
            mode: 'insensitive'
          },
          companyId: user.companyId,
          id: {
            not: departmentId
          }
        }
      });

      if (existingDepartment) {
        return NextResponse.json(
          { error: 'Department with this name already exists' },
          { status: 400 }
        );
      }
    }

    // Update the department
    const updatedDepartment = await prisma.department.update({
      where: { id: departmentId },
      data: validatedData
    });

    // Get employee count
    const employeeCount = await prisma.employee.count({
      where: {
        departmentId: departmentId,
        companyId: user.companyId
      }
    });

    return NextResponse.json({
      ...updatedDepartment,
      employeeCount,
      employees: []
    });
  } catch (error) {
    console.error('[DEPARTMENT_PUT]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// DELETE - Delete department
export async function DELETE(
  request: Request,
  { params }: { params: { departmentId: string } }
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

    const { departmentId } = params;

    // Verify department belongs to user's company
    const department = await prisma.department.findFirst({
      where: {
        id: departmentId,
        companyId: user.companyId
      }
    });

    if (!department) {
      return new NextResponse('Department not found', { status: 404 });
    }

    // Check if department has employees
    const employeeCount = await prisma.employee.count({
      where: {
        departmentId: departmentId,
        companyId: user.companyId
      }
    });

    if (employeeCount > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete department with employees', 
          message: `This department has ${employeeCount} employee(s). Please reassign or remove employees before deleting the department.`
        },
        { status: 400 }
      );
    }

    // Delete the department
    await prisma.department.delete({
      where: { id: departmentId }
    });

    return NextResponse.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('[DEPARTMENT_DELETE]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
