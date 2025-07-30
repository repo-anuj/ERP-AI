import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Schema for bulk employee import
const bulkEmployeeSchema = z.object({
  employees: z.array(z.object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    position: z.string().min(2),
    department: z.string().optional(),
    startDate: z.string(),
    salary: z.number().optional(),
    employeeId: z.string().optional(),
    role: z.enum(["employee", "manager", "admin"]).default("employee"),
    contractType: z.enum(["permanent", "contract", "temporary", "intern"]).optional(),
    workType: z.enum(["full_time", "part_time", "contract", "freelance"]).optional(),
    manager: z.string().optional(),
    jobTitle: z.string().optional(),
    workLocation: z.string().optional(),
    // Basic contact info
    personalEmail: z.string().email().optional(),
    alternatePhone: z.string().optional(),
    // Emergency contact
    emergencyContactName: z.string().optional(),
    emergencyContactPhone: z.string().optional(),
    emergencyContactRelation: z.string().optional(),
  }))
});

interface ImportResult {
  success: boolean;
  created: number;
  skipped: number;
  errors: Array<{
    row: number;
    email: string;
    error: string;
  }>;
  createdEmployees: any[];
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload.email) {
      return new NextResponse("Invalid token", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      include: { company: true },
    });

    if (!user?.company) {
      return new NextResponse("Company not found", { status: 404 });
    }

    const body = await request.json();
    const validatedData = bulkEmployeeSchema.parse(body);

    const result: ImportResult = {
      success: true,
      created: 0,
      skipped: 0,
      errors: [],
      createdEmployees: []
    };

    // Process each employee
    for (let i = 0; i < validatedData.employees.length; i++) {
      const employeeData = validatedData.employees[i];
      
      try {
        // Check if employee already exists
        const existingEmployee = await prisma.employee.findUnique({
          where: { email: employeeData.email }
        });

        if (existingEmployee) {
          result.skipped++;
          result.errors.push({
            row: i + 1,
            email: employeeData.email,
            error: "Employee already exists"
          });
          continue;
        }

        // Handle department - find or create
        let departmentId = null;
        if (employeeData.department) {
          let department = await prisma.department.findFirst({
            where: {
              name: {
                equals: employeeData.department,
                mode: 'insensitive'
              },
              companyId: user.company.id
            }
          });

          if (!department) {
            department = await prisma.department.create({
              data: {
                name: employeeData.department,
                companyId: user.company.id
              }
            });
          }
          departmentId = department.id;
        }

        // Generate default password (can be changed later)
        const defaultPassword = `Welcome@${new Date().getFullYear()}`;
        const hashedPassword = await hashPassword(defaultPassword);

        // Create employee
        const newEmployee = await prisma.employee.create({
          data: {
            firstName: employeeData.firstName,
            lastName: employeeData.lastName,
            email: employeeData.email,
            phone: employeeData.phone,
            position: employeeData.position,
            departmentId: departmentId,
            startDate: new Date(employeeData.startDate),
            salary: employeeData.salary,
            employeeId: employeeData.employeeId,
            role: employeeData.role,
            contractType: employeeData.contractType,
            workType: employeeData.workType,
            manager: employeeData.manager,
            jobTitle: employeeData.jobTitle,
            workLocation: employeeData.workLocation,
            personalEmail: employeeData.personalEmail,
            alternatePhone: employeeData.alternatePhone,
            emergencyContactName: employeeData.emergencyContactName,
            emergencyContactPhone: employeeData.emergencyContactPhone,
            emergencyContactRelation: employeeData.emergencyContactRelation,
            password: hashedPassword,
            companyId: user.company.id,
          },
          include: {
            department: true,
          }
        });

        // Create default leave balances for the employee
        const leaveTypes = await prisma.leaveType.findMany({
          where: { companyId: user.company.id, isActive: true }
        });

        const currentYear = new Date().getFullYear();
        for (const leaveType of leaveTypes) {
          await prisma.employeeLeaveBalance.create({
            data: {
              employeeId: newEmployee.id,
              leaveTypeId: leaveType.id,
              companyId: user.company.id,
              year: currentYear,
              totalEntitled: leaveType.maxDaysPerYear,
              totalUsed: 0,
              totalPending: 0,
              carryOver: 0,
              availableBalance: leaveType.maxDaysPerYear,
            }
          });
        }

        result.created++;
        result.createdEmployees.push({
          id: newEmployee.id,
          name: `${newEmployee.firstName} ${newEmployee.lastName}`,
          email: newEmployee.email,
          department: newEmployee.department?.name,
          defaultPassword: defaultPassword // Include for admin reference
        });

      } catch (error) {
        console.error(`Error creating employee ${employeeData.email}:`, error);
        result.errors.push({
          row: i + 1,
          email: employeeData.email,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    if (result.errors.length > 0 && result.created === 0) {
      result.success = false;
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error("Bulk import error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
