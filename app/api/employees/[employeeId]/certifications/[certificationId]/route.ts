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

// PUT - Update certification record
export async function PUT(
  request: Request,
  { params }: { params: { employeeId: string; certificationId: string } }
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

    const { employeeId, certificationId } = params;
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

    // Find and update the certification record
    const certificationRecords = employee.certifications || [];
    const recordIndex = certificationRecords.findIndex((record: any) => record.id === certificationId);

    if (recordIndex === -1) {
      return new NextResponse('Certification record not found', { status: 404 });
    }

    // Update the record
    const updatedRecord = {
      ...certificationRecords[recordIndex],
      ...validatedData,
    };

    certificationRecords[recordIndex] = updatedRecord;

    // Update employee with modified certifications array
    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        certifications: certificationRecords
      }
    });

    return NextResponse.json(updatedRecord);
  } catch (error) {
    console.error('[CERTIFICATION_PUT]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// DELETE - Delete certification record
export async function DELETE(
  request: Request,
  { params }: { params: { employeeId: string; certificationId: string } }
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

    const { employeeId, certificationId } = params;

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

    // Find and remove the certification record
    const certificationRecords = employee.certifications || [];
    const recordIndex = certificationRecords.findIndex((record: any) => record.id === certificationId);

    if (recordIndex === -1) {
      return new NextResponse('Certification record not found', { status: 404 });
    }

    // Remove the record
    certificationRecords.splice(recordIndex, 1);

    // Update employee with modified certifications array
    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        certifications: certificationRecords
      }
    });

    return NextResponse.json({ message: 'Certification record deleted successfully' });
  } catch (error) {
    console.error('[CERTIFICATION_DELETE]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
