import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema for location creation
const locationSchema = z.object({
  name: z.string().min(2, "Location name must be at least 2 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  state: z.string().min(2, "State must be at least 2 characters"),
  country: z.string().min(2, "Country must be at least 2 characters"),
  zipCode: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email("Invalid email address").optional().nullable(),
  type: z.string().default("branch"),
  isMain: z.boolean().default(false),
  capacity: z.number().optional().nullable(),
  manager: z.string().optional().nullable(),
});

// GET /api/locations - Get all locations
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      console.error("[LOCATIONS_GET] No token provided");
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload?.email) {
      console.error("[LOCATIONS_GET] Invalid token - no email");
      return new NextResponse('Invalid token', { status: 401 });
    }

    // Get user to find companyId
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      include: { company: true }
    });

    if (!user?.companyId) {
      console.error("[LOCATIONS_GET] Company not found for user:", payload.email);
      return new NextResponse('Company not found', { status: 404 });
    }

    let locations = await prisma.location.findMany({
      where: {
        companyId: user.companyId,
      },
      orderBy: [
        { isMain: 'desc' },
        { name: 'asc' }
      ]
    });

    // If no locations exist, create a default main location based on company info
    if (locations.length === 0) {
      console.log("[LOCATIONS_GET] No locations found, creating default location");

      const defaultLocation = await prisma.location.create({
        data: {
          name: user.company?.name ? `${user.company.name} Headquarters` : 'Main Office',
          address: user.company?.address || '',
          city: user.company?.city || '',
          state: user.company?.state || '',
          country: user.company?.country || '',
          zipCode: user.company?.zipCode || '',
          phone: user.company?.phone || '',
          email: user.company?.email || '',
          type: 'headquarters',
          isMain: true,
          companyId: user.companyId,
        }
      });

      locations = [defaultLocation];
      console.log("[LOCATIONS_GET] Default location created:", defaultLocation.id);
    }

    return NextResponse.json(locations);

  } catch (error) {
    console.error('[LOCATIONS_GET] Error details:', error);
    
    // Handle database connection issues
    if (error instanceof Error) {
      console.error('[LOCATIONS_GET] Error message:', error.message);
      console.error('[LOCATIONS_GET] Error stack:', error.stack);

      if (error.message.includes('Connection') || error.message.includes('timeout')) {
        return new NextResponse('Database connection error', { status: 503 });
      }
    }

    return new NextResponse('Internal server error', { status: 500 });
  }
}

// POST /api/locations - Create new location
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      console.error("[LOCATIONS_POST] No token provided");
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload?.email) {
      console.error("[LOCATIONS_POST] Invalid token - no email");
      return new NextResponse('Invalid token', { status: 401 });
    }

    // Get user to find companyId
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      include: { company: true }
    });

    if (!user?.companyId) {
      console.error("[LOCATIONS_POST] Company not found for user:", payload.email);
      return new NextResponse('Company not found', { status: 404 });
    }

    const body = await request.json();
    console.log("[LOCATIONS_POST] Request body:", body);

    const validatedData = locationSchema.parse(body);
    console.log("[LOCATIONS_POST] Validated data:", validatedData);

    // If this is set as main location, unset any existing main location
    if (validatedData.isMain) {
      await prisma.location.updateMany({
        where: {
          companyId: user.companyId,
          isMain: true,
        },
        data: {
          isMain: false,
        },
      });
    }

    // Prepare data for location creation
    let locationData: any = {
      ...validatedData,
      companyId: user.companyId,
    };

    // Clean up undefined values that might cause Prisma issues
    Object.keys(locationData).forEach(key => {
      if (locationData[key] === undefined) {
        delete locationData[key];
      }
    });

    console.log("[LOCATIONS_POST] Creating location with data:", locationData);

    // Create location
    const location = await prisma.location.create({
      data: locationData,
    });

    console.log("[LOCATIONS_POST] Location created successfully:", location.id);

    return NextResponse.json({
      message: 'Location created successfully',
      location
    }, { status: 201 });

  } catch (error) {
    console.error('[LOCATIONS_POST] Error details:', error);

    if (error instanceof z.ZodError) {
      console.error('[LOCATIONS_POST] Validation errors:', error.errors);
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    // Handle Prisma specific errors
    if (error instanceof Error) {
      console.error('[LOCATIONS_POST] Error message:', error.message);
      console.error('[LOCATIONS_POST] Error stack:', error.stack);

      // Handle unique constraint violations
      if (error.message.includes('Unique constraint failed')) {
        return NextResponse.json(
          { error: 'Location already exists', details: 'A location with this name already exists' },
          { status: 409 }
        );
      }

      // Handle database connection issues
      if (error.message.includes('Connection') || error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'Database connection error', details: 'Please try again in a moment' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
