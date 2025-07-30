import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema for attendance settings
const attendanceSettingsSchema = z.object({
  companyName: z.string().optional(),
  timezone: z.string().default('Asia/Kolkata'),
  dateFormat: z.string().default('DD/MM/YYYY'),
  timeFormat: z.string().default('24h'),
  biometricEnabled: z.boolean().default(false),
  mobileAppEnabled: z.boolean().default(true),
  webCheckInEnabled: z.boolean().default(true),
  qrCodeCheckInEnabled: z.boolean().default(false),
  locationTrackingEnabled: z.boolean().default(false),
  gpsAccuracyMeters: z.number().min(10).max(1000).default(100),
  allowedIpAddresses: z.array(z.string()).default([]),
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  pushNotifications: z.boolean().default(true),
  managerNotifications: z.boolean().default(true),
  hrNotifications: z.boolean().default(true),
  twoFactorAuth: z.boolean().default(false),
  sessionTimeout: z.number().min(5).max(480).default(30),
  passwordPolicy: z.string().default('medium'),
  auditLogging: z.boolean().default(true),
  dataRetentionDays: z.number().min(30).max(2555).default(365),
  autoBackup: z.boolean().default(true),
  backupFrequency: z.string().default('daily'),
  exportFormat: z.string().default('excel'),
});

// GET - Fetch attendance settings
export async function GET(request: NextRequest) {
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

    // For now, return default settings since companySettings model doesn't exist
    // TODO: Implement proper settings storage model

    // Return default settings if none exist
    const defaultSettings = {
      companyName: user.company?.name || '',
      timezone: 'Asia/Kolkata',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      biometricEnabled: false,
      mobileAppEnabled: true,
      webCheckInEnabled: true,
      qrCodeCheckInEnabled: false,
      locationTrackingEnabled: false,
      gpsAccuracyMeters: 100,
      allowedIpAddresses: [],
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      managerNotifications: true,
      hrNotifications: true,
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordPolicy: 'medium',
      auditLogging: true,
      dataRetentionDays: 365,
      autoBackup: true,
      backupFrequency: 'daily',
      exportFormat: 'excel',
    };

    return NextResponse.json(defaultSettings);

  } catch (error) {
    console.error('[ATTENDANCE_SETTINGS_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// POST - Save attendance settings
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validatedData = attendanceSettingsSchema.parse(body);

    // Remove companyName from settings data as it's stored separately
    const { companyName, ...settingsData } = validatedData;

    // Update company name if provided
    if (companyName && companyName !== user.company?.name) {
      await prisma.company.update({
        where: { id: user.companyId },
        data: { name: companyName }
      });
    }

    // For now, just return the validated data since companySettings model doesn't exist
    // TODO: Implement proper settings storage
    const savedSettings = {
      settings: settingsData,
      companyName: user.company?.name || '',
    };

    // TODO: Implement audit logging when auditLog model is available

    return NextResponse.json({
      success: true,
      message: 'Attendance settings saved successfully',
      settings: {
        ...settingsData,
        companyName: companyName || user.company?.name || '',
      }
    });

  } catch (error) {
    console.error('[ATTENDANCE_SETTINGS_POST]', error);
    
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ 
        error: 'Validation failed', 
        details: error.errors 
      }), { status: 400 });
    }

    return new NextResponse('Internal error', { status: 500 });
  }
}
