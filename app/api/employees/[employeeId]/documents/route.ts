import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from 'crypto';
export const dynamic = 'force-dynamic';

const documentSchema = z.object({
  name: z.string().min(1, "Document name is required"),
  type: z.string().min(1, "Document type is required"),
  url: z.string().url("Valid URL is required"),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
});

// Helper function to check user authorization and get company ID
async function getUserCompanyId() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    throw new Error('Unauthorized');
  }

  const payload = await verifyAuth(token);

  if (!payload.email || typeof payload.email !== 'string') {
    throw new Error('Invalid token');
  }

  const user = await prisma.user.findUnique({
    where: { email: payload.email },
    include: { company: true }
  });

  if (!user?.companyId) {
    throw new Error('Company not found');
  }

  return { companyId: user.companyId, userEmail: payload.email };
}

export async function GET(
  req: Request,
  { params }: { params: { employeeId: string } }
) {
  try {
    const { companyId } = await getUserCompanyId();
    const { employeeId } = params;

    // Verify employee belongs to company
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        companyId
      }
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found or you don't have permission to access it" },
        { status: 404 }
      );
    }

    // Get employee's documents
    const documents = employee.documents || [];
    
    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    if ((error as Error).message === 'Unauthorized') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    if ((error as Error).message === 'Company not found') {
      return new NextResponse('Company not found', { status: 404 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { employeeId: string } }
) {
  try {
    const { companyId, userEmail } = await getUserCompanyId();
    const { employeeId } = params;
    const data = await req.json();

    // Validate input data
    const validatedData = documentSchema.parse(data);

    // Verify employee belongs to company
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        companyId
      }
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found or you don't have permission to access it" },
        { status: 404 }
      );
    }

    // Create new document object
    const newDocument = {
      id: crypto.randomUUID(),
      name: validatedData.name,
      type: validatedData.type,
      url: validatedData.url,
      fileSize: validatedData.fileSize,
      mimeType: validatedData.mimeType,
      uploadDate: new Date(),
      uploadedBy: userEmail,
      description: validatedData.description,
      isPublic: validatedData.isPublic,
    };

    // Update employee with new document
    const existingDocuments = employee.documents || [];
    const updatedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        documents: [...existingDocuments, newDocument]
      }
    });

    return NextResponse.json(newDocument);
  } catch (error) {
    console.error('Error creating document:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    if ((error as Error).message === 'Unauthorized') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    if ((error as Error).message === 'Company not found') {
      return new NextResponse('Company not found', { status: 404 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { employeeId: string } }
) {
  try {
    const { companyId } = await getUserCompanyId();
    const { employeeId } = params;
    const url = new URL(req.url);
    const documentId = url.searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Verify employee belongs to company
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        companyId
      }
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found or you don't have permission to access it" },
        { status: 404 }
      );
    }

    // Remove the document from employee's documents array
    const existingDocuments = employee.documents || [];
    const updatedDocuments = existingDocuments.filter(doc => doc.id !== documentId);

    if (existingDocuments.length === updatedDocuments.length) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Update employee
    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        documents: updatedDocuments
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    if ((error as Error).message === 'Unauthorized') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    if ((error as Error).message === 'Company not found') {
      return new NextResponse('Company not found', { status: 404 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
