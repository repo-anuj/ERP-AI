import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const certificationSchema = z.object({
  name: z.string().min(1, "Certification name is required"),
  issuingOrg: z.string().min(1, "Issuing organization is required"),
  issueDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
  credentialId: z.string().optional(),
  description: z.string().optional(),
});

// GET - Fetch all certification records for an employee
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

    // Return certification records from the employee's certifications array
    const certificationRecords = employee.certifications || [];
    
    return NextResponse.json(certificationRecords);
  } catch (error) {
    console.error('[CERTIFICATIONS_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST - Add new certification record
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
    const validationResult = certificationSchema.safeParse(body);
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

    // Create new certification record with unique ID
    const newCertificationRecord = {
      id: `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...validatedData,
    };

    // Add to existing certifications array
    const updatedCertifications = [...(employee.certifications || []), newCertificationRecord];

    // Update employee with new certification record
    const updatedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        certifications: updatedCertifications
      }
    });

    return NextResponse.json(newCertificationRecord);
  } catch (error) {
    console.error('[CERTIFICATIONS_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
