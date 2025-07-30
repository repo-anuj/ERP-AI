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

function getDepartmentDescription(deptName: string | null | undefined): string {
  if (!deptName || typeof deptName !== 'string') {
    return 'Department operations';
  }

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
    'unassigned': 'Employees not assigned to any department',
  };

  return descriptions[deptName.toLowerCase()] || 'Department operations';
}

export async function GET(request: Request) {
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

    // Check if this is a request for dropdown options
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'dropdown') {
      // Return simple list of department names for dropdowns
      const existingDepartments = await prisma.department.findMany({
        where: { companyId: user.companyId },
        select: { name: true }
      });

      const defaultDepartments = [
        'Engineering',
        'Sales',
        'Marketing',
        'Human Resources',
        'Finance',
        'Operations',
        'Customer Support',
        'Product',
        'Design'
      ];

      // Combine existing and default departments, remove duplicates
      const existingNames = existingDepartments.map(d => d.name);
      const allDepartments = Array.from(new Set([...existingNames, ...defaultDepartments]));

      return NextResponse.json(allDepartments);
    }

    // Original logic for department overview with employee counts
    const employees = await prisma.employee.findMany({
      where: { companyId: user.companyId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        department: {
          select: {
            id: true,
            name: true,
          }
        },
        position: true,
        status: true,
        startDate: true
      }
    });

    // Group employees by department
    const departmentGroups = employees.reduce((acc, employee) => {
      const deptName = employee.department?.name || 'Unassigned';
      if (!acc[deptName]) {
        acc[deptName] = {
          name: deptName,
          employeeCount: 0,
          employees: [],
          description: getDepartmentDescription(deptName)
        };
      }
      acc[deptName].employeeCount++;
      acc[deptName].employees.push(employee);
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

    // Check if department with same name already exists
    const existingDepartment = await prisma.department.findFirst({
      where: {
        name: {
          equals: validatedData.name,
          mode: 'insensitive'
        },
        companyId: user.companyId
      }
    });

    if (existingDepartment) {
      return NextResponse.json(
        { error: 'Department with this name already exists' },
        { status: 400 }
      );
    }

    // Create the department
    const department = await prisma.department.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        manager: validatedData.manager,
        companyId: user.companyId
      }
    });

    return NextResponse.json({
      ...department,
      employeeCount: 0,
      employees: []
    });
  } catch (error) {
    console.error('Error creating department:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
