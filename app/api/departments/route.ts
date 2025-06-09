import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const runtime = 'nodejs';

const departmentSchema = z.object({
  name: z.string().min(2, "Department name is required"),
  description: z.string().optional(),
  manager: z.string().optional(),
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

    // Get unique departments from employees
    const employees = await prisma.employee.findMany({
      where: { companyId: user.companyId },
      select: { department: true }
    });

    // Extract unique department names
    const departmentSet = new Set<string>();
    employees.forEach(emp => departmentSet.add(emp.department));

    // Convert to array of department objects
    const departments = Array.from(departmentSet).map(name => ({
      name,
      employeeCount: employees.filter(emp => emp.department === name).length
    }));

    return NextResponse.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
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
    const validatedData = departmentSchema.parse(data);

    // Since we don't have a Department model, we'll just return the validated data
    // In a real implementation, you would create a new department in the database
    const department = {
      id: 'placeholder-id',
      ...validatedData,
      companyId: user.companyId,
      employeeCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return NextResponse.json(department);
  } catch (error) {
    console.error('Error creating department:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
