import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Platform configuration schema
const platformConfigSchema = z.object({
  enabled: z.boolean(),
  apiKey: z.string().optional(),
  companyId: z.string().optional(),
  employerId: z.string().optional(),
  autoPost: z.boolean(),
  status: z.enum(['connected', 'disconnected', 'error', 'active', 'inactive']),
  lastSync: z.string().optional(),
});

// Job board settings validation schema
const jobBoardSettingsSchema = z.object({
  linkedin: platformConfigSchema.optional(),
  indeed: platformConfigSchema.optional(),
  website: platformConfigSchema.optional(),
  glassdoor: platformConfigSchema.optional(),
  naukri: platformConfigSchema.optional(),
  monster: platformConfigSchema.optional(),
  defaultPlatforms: z.array(z.string()).default([]),
  syncFrequency: z.enum(['manual', 'hourly', 'daily']).default('manual'),
  notifications: z.object({
    syncSuccess: z.boolean(),
    syncFailure: z.boolean(),
    applicationReceived: z.boolean(),
  }).optional(),
});

// GET /api/hr/recruitment/settings - Get job board settings
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      console.error("[JOB_BOARD_SETTINGS_GET] No token provided");
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload?.email) {
      console.error("[JOB_BOARD_SETTINGS_GET] Invalid token - no email");
      return new NextResponse('Invalid token', { status: 401 });
    }

    // Get user to find companyId
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      include: { company: true }
    });

    if (!user?.companyId) {
      console.error("[JOB_BOARD_SETTINGS_GET] Company not found for user:", payload.email);
      return new NextResponse('Company not found', { status: 404 });
    }

    console.log("[JOB_BOARD_SETTINGS_GET] Fetching settings for company:", user.companyId);

    // Get existing settings using raw query until Prisma client is regenerated
    let settings;
    try {
      settings = await (prisma as any).jobBoardSettings.findUnique({
        where: { companyId: user.companyId }
      });
    } catch (error) {
      console.log("[JOB_BOARD_SETTINGS_GET] JobBoardSettings model not yet available, returning defaults");
      settings = null;
    }

    // If no settings exist, return default settings
    if (!settings) {
      console.log("[JOB_BOARD_SETTINGS_GET] No settings found, returning defaults");
      const defaultSettings = {
        linkedin: {
          enabled: false,
          autoPost: false,
          status: 'disconnected'
        },
        indeed: {
          enabled: false,
          autoPost: false,
          status: 'disconnected'
        },
        website: {
          enabled: true,
          autoPublish: true,
          seoOptimized: true,
          status: 'active'
        },
        glassdoor: {
          enabled: false,
          autoPost: false,
          status: 'disconnected'
        },
        naukri: {
          enabled: false,
          autoPost: false,
          status: 'disconnected'
        },
        monster: {
          enabled: false,
          autoPost: false,
          status: 'disconnected'
        },
        defaultPlatforms: ['website'],
        syncFrequency: 'manual',
        notifications: {
          syncSuccess: true,
          syncFailure: true,
          applicationReceived: true
        }
      };

      return NextResponse.json(defaultSettings);
    }

    console.log("[JOB_BOARD_SETTINGS_GET] Settings found, returning existing settings");

    // Return existing settings
    const response = {
      linkedin: settings.linkedin || { enabled: false, autoPost: false, status: 'disconnected' },
      indeed: settings.indeed || { enabled: false, autoPost: false, status: 'disconnected' },
      website: settings.website || { enabled: true, autoPublish: true, seoOptimized: true, status: 'active' },
      glassdoor: settings.glassdoor || { enabled: false, autoPost: false, status: 'disconnected' },
      naukri: settings.naukri || { enabled: false, autoPost: false, status: 'disconnected' },
      monster: settings.monster || { enabled: false, autoPost: false, status: 'disconnected' },
      defaultPlatforms: settings.defaultPlatforms,
      syncFrequency: settings.syncFrequency,
      notifications: settings.notifications || {
        syncSuccess: true,
        syncFailure: true,
        applicationReceived: true
      },
      lastGlobalSync: settings.lastGlobalSync,
      syncErrors: settings.syncErrors
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("[JOB_BOARD_SETTINGS_GET] Error:", error);
    return new NextResponse('Failed to fetch job board settings', { status: 500 });
  }
}

// PUT /api/hr/recruitment/settings - Update job board settings
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      console.error("[JOB_BOARD_SETTINGS_PUT] No token provided");
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload?.email) {
      console.error("[JOB_BOARD_SETTINGS_PUT] Invalid token - no email");
      return new NextResponse('Invalid token', { status: 401 });
    }

    // Get user to find companyId
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      include: { company: true }
    });

    if (!user?.companyId) {
      console.error("[JOB_BOARD_SETTINGS_PUT] Company not found for user:", payload.email);
      return new NextResponse('Company not found', { status: 404 });
    }

    const body = await request.json();
    console.log("[JOB_BOARD_SETTINGS_PUT] Request body:", body);

    // Validate the request body
    const validatedData = jobBoardSettingsSchema.parse(body);
    console.log("[JOB_BOARD_SETTINGS_PUT] Validated data:", validatedData);

    // Prepare data for upsert
    const settingsData = {
      companyId: user.companyId,
      linkedin: validatedData.linkedin || null,
      indeed: validatedData.indeed || null,
      website: validatedData.website || null,
      glassdoor: validatedData.glassdoor || null,
      naukri: validatedData.naukri || null,
      monster: validatedData.monster || null,
      defaultPlatforms: validatedData.defaultPlatforms,
      syncFrequency: validatedData.syncFrequency,
      notifications: validatedData.notifications || null,
      lastGlobalSync: new Date(), // Update sync timestamp
    };

    console.log("[JOB_BOARD_SETTINGS_PUT] Upserting settings with data:", settingsData);

    // Upsert settings using raw query until Prisma client is regenerated
    let settings;
    try {
      settings = await (prisma as any).jobBoardSettings.upsert({
        where: { companyId: user.companyId },
        create: settingsData,
        update: {
          ...settingsData,
          updatedAt: new Date(),
        }
      });
    } catch (error) {
      console.error("[JOB_BOARD_SETTINGS_PUT] JobBoardSettings model not yet available:", error);
      return new NextResponse('JobBoardSettings model not available. Please run: npx prisma db push && npx prisma generate', { status: 500 });
    }

    console.log("[JOB_BOARD_SETTINGS_PUT] Settings updated successfully:", settings.id);

    return NextResponse.json({
      message: 'Job board settings updated successfully',
      settings: {
        linkedin: settings.linkedin,
        indeed: settings.indeed,
        website: settings.website,
        glassdoor: settings.glassdoor,
        naukri: settings.naukri,
        monster: settings.monster,
        defaultPlatforms: settings.defaultPlatforms,
        syncFrequency: settings.syncFrequency,
        notifications: settings.notifications,
        lastGlobalSync: settings.lastGlobalSync,
      }
    });

  } catch (error) {
    console.error("[JOB_BOARD_SETTINGS_PUT] Error:", error);
    
    if (error instanceof z.ZodError) {
      console.error("[JOB_BOARD_SETTINGS_PUT] Validation errors:", error.errors);
      return NextResponse.json({
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }

    return new NextResponse('Failed to update job board settings', { status: 500 });
  }
}
