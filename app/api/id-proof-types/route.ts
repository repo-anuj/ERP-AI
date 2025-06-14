import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
export const dynamic = 'force-dynamic';

const idProofTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  isRequired: z.boolean().default(false),
  hasExpiry: z.boolean().default(false),
  format: z.string().optional(), // Regex pattern
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

export async function GET() {
  try {
    const companyId = await getUserCompanyId();

    const idProofTypes = await prisma.idProofType.findMany({
      where: { companyId },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(idProofTypes);
  } catch (error) {
    console.error('Error fetching ID proof types:', error);
    if ((error as Error).message === 'Unauthorized') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    if ((error as Error).message === 'Company not found') {
      return new NextResponse('Company not found', { status: 404 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const companyId = await getUserCompanyId();
    const data = await req.json();

    // Validate input data
    const validatedData = idProofTypeSchema.parse(data);

    // Check if ID proof type with same name already exists for this company
    const existingType = await prisma.idProofType.findFirst({
      where: {
        name: validatedData.name,
        companyId
      }
    });

    if (existingType) {
      return NextResponse.json(
        { error: "ID proof type with this name already exists" },
        { status: 400 }
      );
    }

    // Create the ID proof type
    const idProofType = await prisma.idProofType.create({
      data: {
        ...validatedData,
        companyId
      }
    });

    return NextResponse.json(idProofType);
  } catch (error) {
    console.error('Error creating ID proof type:', error);
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

export async function PUT(req: Request) {
  try {
    const companyId = await getUserCompanyId();
    const data = await req.json();

    // Ensure ID is provided
    if (!data.id) {
      return NextResponse.json(
        { error: "ID proof type ID is required" },
        { status: 400 }
      );
    }

    // Validate input data (excluding id)
    const { id, ...updateData } = data;
    const validatedData = idProofTypeSchema.parse(updateData);

    // Check if ID proof type exists and belongs to the company
    const existingType = await prisma.idProofType.findFirst({
      where: {
        id,
        companyId
      }
    });

    if (!existingType) {
      return NextResponse.json(
        { error: "ID proof type not found or you don't have permission to update it" },
        { status: 404 }
      );
    }

    // Check if another ID proof type with same name exists (excluding current one)
    if (validatedData.name !== existingType.name) {
      const duplicateType = await prisma.idProofType.findFirst({
        where: {
          name: validatedData.name,
          companyId,
          id: { not: id }
        }
      });

      if (duplicateType) {
        return NextResponse.json(
          { error: "ID proof type with this name already exists" },
          { status: 400 }
        );
      }
    }

    const updatedType = await prisma.idProofType.update({
      where: { id },
      data: validatedData
    });

    return NextResponse.json(updatedType);
  } catch (error) {
    console.error('Error updating ID proof type:', error);
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

export async function DELETE(req: Request) {
  try {
    const companyId = await getUserCompanyId();
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: "ID proof type ID is required" },
        { status: 400 }
      );
    }

    // Check if ID proof type exists and belongs to the company
    const existingType = await prisma.idProofType.findFirst({
      where: {
        id,
        companyId
      }
    });

    if (!existingType) {
      return NextResponse.json(
        { error: "ID proof type not found or you don't have permission to delete it" },
        { status: 404 }
      );
    }

    // Delete the ID proof type
    await prisma.idProofType.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting ID proof type:', error);
    if ((error as Error).message === 'Unauthorized') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    if ((error as Error).message === 'Company not found') {
      return new NextResponse('Company not found', { status: 404 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
