import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { encryptIdProof, decryptIdProof, maskIdProof, validateIdProofFormat } from "@/lib/encryption";
import crypto from 'crypto';
export const dynamic = 'force-dynamic';

const idProofSchema = z.object({
  name: z.string().min(1, "Name is required"),
  value: z.string().min(1, "Value is required"),
  issuedBy: z.string().optional(),
  issueDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
  notes: z.string().optional(),
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

  return user.companyId;
}

export async function GET(
  req: Request,
  { params }: { params: { employeeId: string } }
) {
  try {
    const companyId = await getUserCompanyId();
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

    // Get employee's ID proofs (return masked values for security)
    const idProofs = employee.idProofs || [];
    
    // Mask the values for display
    const maskedIdProofs = idProofs.map(proof => ({
      ...proof,
      value: maskIdProof(proof.value), // Show masked value
      originalValue: undefined // Remove original encrypted value from response
    }));

    return NextResponse.json(maskedIdProofs);
  } catch (error) {
    console.error('Error fetching ID proofs:', error);
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
    const companyId = await getUserCompanyId();
    const { employeeId } = params;
    const data = await req.json();

    console.log("[ID_PROOFS_POST] Request data:", data);
    console.log("[ID_PROOFS_POST] Employee ID:", employeeId);
    console.log("[ID_PROOFS_POST] Company ID:", companyId);

    // Validate input data
    const validatedData = idProofSchema.parse(data);
    console.log("[ID_PROOFS_POST] Validated data:", validatedData);

    // Verify employee belongs to company
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        companyId
      }
    });

    if (!employee) {
      console.error("[ID_PROOFS_POST] Employee not found:", employeeId);
      return NextResponse.json(
        { error: "Employee not found or you don't have permission to access it" },
        { status: 404 }
      );
    }

    console.log("[ID_PROOFS_POST] Employee found:", employee.id);

    // Check if ID proof type exists and get its format for validation
    const idProofType = await prisma.idProofType.findFirst({
      where: {
        name: validatedData.name,
        companyId
      }
    });

    console.log("[ID_PROOFS_POST] ID proof type:", idProofType);

    // Validate format if ID proof type exists and has a format
    if (idProofType?.format && !validateIdProofFormat(validatedData.value, idProofType.format)) {
      console.error("[ID_PROOFS_POST] Invalid format for:", validatedData.name);
      return NextResponse.json(
        { error: `Invalid format for ${validatedData.name}` },
        { status: 400 }
      );
    }

    // Check if employee already has this type of ID proof
    const existingIdProofs = employee.idProofs || [];
    console.log("[ID_PROOFS_POST] Existing ID proofs count:", existingIdProofs.length);

    const hasExistingProof = existingIdProofs.some(proof => proof.name === validatedData.name);

    if (hasExistingProof) {
      console.error("[ID_PROOFS_POST] ID proof already exists:", validatedData.name);
      return NextResponse.json(
        { error: `Employee already has ${validatedData.name}` },
        { status: 400 }
      );
    }

    // Encrypt the ID proof value
    console.log("[ID_PROOFS_POST] Encrypting ID proof value");
    const encryptedValue = encryptIdProof(validatedData.value);
    console.log("[ID_PROOFS_POST] Encryption successful");

    // Create new ID proof object
    const newIdProof = {
      id: crypto.randomUUID(),
      name: validatedData.name,
      value: JSON.stringify(encryptedValue), // Store encrypted data as JSON string
      issuedBy: validatedData.issuedBy,
      issueDate: validatedData.issueDate,
      expiryDate: validatedData.expiryDate,
      verified: false,
      notes: validatedData.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log("[ID_PROOFS_POST] New ID proof object created:", {
      ...newIdProof,
      value: "[ENCRYPTED]"
    });

    // Update employee with new ID proof
    const updatedEmployee = await prisma.employee.update({
      where: {
        id: employeeId,
        companyId: companyId // Add company check for security
      },
      data: {
        idProofs: [...existingIdProofs, newIdProof]
      },
      include: {
        department: true,
        company: true
      }
    });

    console.log("[ID_PROOFS_POST] Employee updated successfully with ID proof");

    // Return the new ID proof with masked value
    const responseIdProof = {
      ...newIdProof,
      value: maskIdProof(validatedData.value)
    };

    console.log("[ID_PROOFS_POST] Returning response");
    return NextResponse.json({
      success: true,
      idProof: responseIdProof,
      message: "ID proof added successfully"
    });
  } catch (error) {
    console.error('[ID_PROOFS_POST] Error details:', error);

    if (error instanceof z.ZodError) {
      console.error('[ID_PROOFS_POST] Validation errors:', error.errors);
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

    if (error instanceof Error) {
      console.error('[ID_PROOFS_POST] Error message:', error.message);
      console.error('[ID_PROOFS_POST] Error stack:', error.stack);

      // Handle specific Prisma errors
      if (error.message.includes('Record to update not found')) {
        return NextResponse.json(
          { error: "Employee not found", details: "Employee not found or you don't have permission to update it" },
          { status: 404 }
        );
      }

      // Handle database connection issues
      if (error.message.includes('Connection') || error.message.includes('timeout')) {
        return NextResponse.json(
          { error: "Database connection error", details: "Please try again in a moment" },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { employeeId: string } }
) {
  try {
    const companyId = await getUserCompanyId();
    const { employeeId } = params;
    const url = new URL(req.url);
    const idProofId = url.searchParams.get('idProofId');

    if (!idProofId) {
      return NextResponse.json(
        { error: "ID proof ID is required" },
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

    // Remove the ID proof from employee's ID proofs array
    const existingIdProofs = employee.idProofs || [];
    const updatedIdProofs = existingIdProofs.filter(proof => proof.id !== idProofId);

    if (existingIdProofs.length === updatedIdProofs.length) {
      return NextResponse.json(
        { error: "ID proof not found" },
        { status: 404 }
      );
    }

    // Update employee
    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        idProofs: updatedIdProofs
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting ID proof:', error);
    if ((error as Error).message === 'Unauthorized') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    if ((error as Error).message === 'Company not found') {
      return new NextResponse('Company not found', { status: 404 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
