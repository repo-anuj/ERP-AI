import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
export const dynamic = 'force-dynamic';

export const runtime = 'nodejs';

const departmentSchema = z.object({
  name: z.string().min(2, "Department name is required"),
  description: z.string().optional(),
  manager: z.string().optional(),
});

function getDepartmentDescription(deptName: string): string {
  const descriptions: Record<string, string> = {
    'engineering': 'Software development and technical teams',
    'sales': 'Sales and business development',
    'marketing': 'Marketing and brand management',
    'human resources': 'HR and people operations',
    'hr': 'HR and people operations',
    'finance': 'Finance and accounting',
    'operations': 'Operations and logistics',
    'customer support': 'Customer service and support',
    'product': 'Product management and strategy',
    'design': 'Design and user experience',
  };

  return descriptions[deptName.toLowerCase()] || 'Department operations';
}

export async function GET() {
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

    // Get all employees with their details
    const employees = await prisma.employee.findMany({
      where: { companyId: user.companyId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        department: true,
        position: true,
        status: true,
        startDate: true
      }
    });

    // Group employees by department
    const departmentGroups = employees.reduce((acc, employee) => {
      const dept = employee.department || 'Unassigned';
      if (!acc[dept]) {
        acc[dept] = {
          name: dept,
          employeeCount: 0,
          employees: [],
          description: getDepartmentDescription(dept)
        };
      }
      acc[dept].employeeCount++;
      acc[dept].employees.push(employee);
      return acc;
    }, {} as Record<string, any>);

    // Convert to array
    const departments = Object.values(departmentGroups);

    // Add default departments with 0 employees if they don't exist
    const defaultDepartments = [
      { name: 'Engineering', description: 'Software development and technical teams' },
      { name: 'Sales', description: 'Sales and business development' },
      { name: 'Marketing', description: 'Marketing and brand management' },
      { name: 'Human Resources', description: 'HR and people operations' },
      { name: 'Finance', description: 'Finance and accounting' },
      { name: 'Operations', description: 'Operations and logistics' },
      { name: 'Customer Support', description: 'Customer service and support' },
      { name: 'Product', description: 'Product management and strategy' },
      { name: 'Design', description: 'Design and user experience' }
    ];

    defaultDepartments.forEach(defaultDept => {
      const deptKey = defaultDept.name.toLowerCase();
      if (!departmentGroups[deptKey] && !departmentGroups[defaultDept.name]) {
        departments.push({
          name: defaultDept.name,
          employeeCount: 0,
          employees: [],
          description: defaultDept.description
        });
      }
    });

    return NextResponse.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const token = cookies().get('token')?.value;

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
