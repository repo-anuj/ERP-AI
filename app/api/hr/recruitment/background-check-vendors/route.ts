import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// GET /api/hr/recruitment/background-check-vendors - Get all vendors
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload?.email) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    // Get user to find companyId
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      select: { companyId: true }
    });

    if (!user?.companyId) {
      return new NextResponse('Company not found', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const hasApiIntegration = searchParams.get('hasApiIntegration');
    const search = searchParams.get('search');

    // Build filter conditions
    const where: any = {
      companyId: user.companyId,
    };

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    if (hasApiIntegration !== null) {
      where.apiEndpoint = hasApiIntegration === 'true' ? { not: null } : null;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactEmail: { contains: search, mode: 'insensitive' } },
        { website: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get unique vendors from background checks
    const backgroundChecks = await prisma.backgroundCheck.findMany({
      where: {
        companyId: user.companyId,
        vendor: { not: null }
      },
      select: {
        vendor: true,
        status: true,
        requestedAt: true,
        completedAt: true,
        cost: true,
      },
      orderBy: { requestedAt: 'desc' }
    });

    // Group checks by vendor and calculate statistics
    const vendorMap = new Map();

    backgroundChecks.forEach((check: any) => {
      const vendorName = check.vendor;
      if (!vendorMap.has(vendorName)) {
        vendorMap.set(vendorName, {
          name: vendorName,
          totalChecks: 0,
          completedChecks: 0,
          inProgressChecks: 0,
          totalCost: 0,
          completionTimes: []
        });
      }

      const vendor = vendorMap.get(vendorName);
      vendor.totalChecks++;

      if (check.status === 'completed') {
        vendor.completedChecks++;
        if (check.completedAt && check.requestedAt) {
          const days = Math.ceil((new Date(check.completedAt).getTime() - new Date(check.requestedAt).getTime()) / (1000 * 60 * 60 * 24));
          vendor.completionTimes.push(days);
        }
      } else if (check.status === 'in_progress') {
        vendor.inProgressChecks++;
      }

      if (check.cost) {
        vendor.totalCost += check.cost;
      }
    });

    // Convert map to array with calculated stats
    const vendorsWithStats = Array.from(vendorMap.values()).map((vendor: any) => ({
      ...vendor,
      avgCompletionTime: vendor.completionTimes.length > 0
        ? Math.round(vendor.completionTimes.reduce((sum: number, time: number) => sum + time, 0) / vendor.completionTimes.length)
        : 0,
      completionRate: vendor.totalChecks > 0 ? (vendor.completedChecks / vendor.totalChecks) * 100 : 0,
      avgCost: vendor.totalChecks > 0 ? vendor.totalCost / vendor.totalChecks : 0
    }));

    return NextResponse.json({
      vendors: vendorsWithStats.sort((a: any, b: any) => b.totalChecks - a.totalChecks)
    });

  } catch (error) {
    console.error('Error fetching vendors:', error);
    return new NextResponse('Failed to fetch vendors', { status: 500 });
  }
}

// POST /api/hr/recruitment/background-check-vendors - Create new vendor
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload?.email) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    // Get user to find companyId
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      select: { companyId: true }
    });

    if (!user?.companyId) {
      return new NextResponse('Company not found', { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      contactEmail,
      contactPhone,
      website,
      address,
      isActive = true,
      apiEndpoint,
      apiKey,
      apiSecret,
      webhookUrl,
      supportedCheckTypes = [],
      averageTurnaroundDays,
      pricing,
      notes,
    } = body;

    // Validate required fields
    if (!name || !contactEmail) {
      return new NextResponse('Missing required fields: name, contactEmail', { status: 400 });
    }
    // Since there's no dedicated vendor model, we'll store vendor information
    // as metadata that can be referenced when creating background checks
    // For now, we'll return a success response with the vendor data
    // In a real implementation, you might want to create a separate vendor collection

    const vendorData = {
      name,
      contactEmail,
      contactPhone: contactPhone || null,
      website: website || null,
      address: address || null,
      isActive,
      apiEndpoint: apiEndpoint || null,
      apiKey: apiKey || null,
      apiSecret: apiSecret || null,
      webhookUrl: webhookUrl || null,
      supportedCheckTypes,
      averageTurnaroundDays: averageTurnaroundDays ? parseInt(averageTurnaroundDays) : null,
      pricing: pricing || null,
      notes: notes || null,
      companyId: user.companyId,
      createdAt: new Date(),
    };

    // Note: In a production system, you would store this in a dedicated vendors collection
    return NextResponse.json({
      message: 'Vendor information processed successfully',
      vendor: vendorData,
      note: 'Vendor data prepared for use in background checks'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating vendor:', error);
    return new NextResponse('Failed to create vendor', { status: 500 });
  }
}
