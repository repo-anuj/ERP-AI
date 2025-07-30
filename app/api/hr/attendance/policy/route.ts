import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema for attendance policy
const attendancePolicySchema = z.object({
  standardWorkingHours: z.number().min(1).max(24).default(8),
  workingDaysPerWeek: z.number().min(1).max(7).default(5),
  weekStartDay: z.string().default('monday'),
  graceTimeMinutes: z.number().min(0).max(60).default(15),
  lateMarkAfterMinutes: z.number().min(0).max(120).default(30),
  halfDayThresholdHours: z.number().min(1).max(12).default(4),
  minimumWorkingHours: z.number().min(1).max(24).default(6),
  overtimeEnabled: z.boolean().default(true),
  overtimeThresholdHours: z.number().min(1).max(24).default(8),
  overtimeMultiplier: z.number().min(1).max(3).default(1.5),
  maxOvertimeHoursPerDay: z.number().min(1).max(12).default(4),
  maxOvertimeHoursPerMonth: z.number().min(1).max(200).default(40),
  breakTimeEnabled: z.boolean().default(true),
  breakDurationMinutes: z.number().min(15).max(120).default(60),
  maxBreaksPerDay: z.number().min(1).max(10).default(2),
  unpaidBreakThresholdMinutes: z.number().min(30).max(240).default(90),
  locationTrackingEnabled: z.boolean().default(false),
  allowedLocations: z.array(z.string()).default([]),
  locationRadiusMeters: z.number().min(10).max(1000).default(100),
  manualAttendanceRequiresApproval: z.boolean().default(true),
  lateEntryRequiresApproval: z.boolean().default(false),
  earlyExitRequiresApproval: z.boolean().default(true),
  lateArrivalNotification: z.boolean().default(true),
  absenteeNotification: z.boolean().default(true),
  overtimeNotification: z.boolean().default(true),
  complianceMode: z.string().default('standard'),
  auditTrailEnabled: z.boolean().default(true),
  dataRetentionDays: z.number().min(30).max(2555).default(365),
});

// GET - Fetch attendance policy
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

    // Try to find existing policy
    const existingPolicy = await prisma.attendancePolicy.findFirst({
      where: {
        companyId: user.companyId,
        isActive: true,
      }
    });

    if (existingPolicy) {
      // Map AttendancePolicy fields to the expected format
      const policyData = {
        standardWorkingHours: existingPolicy.fullDayThreshold || 8,
        workingDaysPerWeek: existingPolicy.workingDays?.length || 5,
        weekStartDay: 'monday',
        graceTimeMinutes: existingPolicy.lateThreshold || 15,
        lateMarkAfterMinutes: existingPolicy.lateThreshold || 30,
        halfDayThresholdHours: existingPolicy.halfDayThreshold || 4,
        minimumWorkingHours: existingPolicy.halfDayThreshold || 6,
        overtimeEnabled: true,
        overtimeThresholdHours: existingPolicy.overtimeThreshold || 8,
        overtimeMultiplier: 1.5,
        maxOvertimeHoursPerDay: 4,
        maxOvertimeHoursPerMonth: 40,
        breakTimeEnabled: true,
        breakDurationMinutes: Math.floor((existingPolicy.breakDuration || 1) * 60),
        maxBreaksPerDay: 2,
        unpaidBreakThresholdMinutes: 90,
        locationTrackingEnabled: false,
        allowedLocations: [],
        locationRadiusMeters: 100,
        manualAttendanceRequiresApproval: true,
        lateEntryRequiresApproval: false,
        earlyExitRequiresApproval: true,
        lateArrivalNotification: true,
        absenteeNotification: true,
        overtimeNotification: true,
        complianceMode: 'standard',
        auditTrailEnabled: true,
        dataRetentionDays: 365,
      };
      return NextResponse.json(policyData);
    }

    // Return default policy if none exists
    const defaultPolicy = {
      standardWorkingHours: 8,
      workingDaysPerWeek: 5,
      weekStartDay: 'monday',
      graceTimeMinutes: 15,
      lateMarkAfterMinutes: 30,
      halfDayThresholdHours: 4,
      minimumWorkingHours: 6,
      overtimeEnabled: true,
      overtimeThresholdHours: 8,
      overtimeMultiplier: 1.5,
      maxOvertimeHoursPerDay: 4,
      maxOvertimeHoursPerMonth: 40,
      breakTimeEnabled: true,
      breakDurationMinutes: 60,
      maxBreaksPerDay: 2,
      unpaidBreakThresholdMinutes: 90,
      locationTrackingEnabled: false,
      allowedLocations: [],
      locationRadiusMeters: 100,
      manualAttendanceRequiresApproval: true,
      lateEntryRequiresApproval: false,
      earlyExitRequiresApproval: true,
      lateArrivalNotification: true,
      absenteeNotification: true,
      overtimeNotification: true,
      complianceMode: 'standard',
      auditTrailEnabled: true,
      dataRetentionDays: 365,
    };

    return NextResponse.json(defaultPolicy);

  } catch (error) {
    console.error('[ATTENDANCE_POLICY_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// POST - Save attendance policy
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
    const validatedData = attendancePolicySchema.parse(body);

    // Validate business logic
    if (validatedData.graceTimeMinutes >= validatedData.lateMarkAfterMinutes) {
      return new NextResponse('Grace time must be less than late mark time', { status: 400 });
    }

    if (validatedData.halfDayThresholdHours >= validatedData.standardWorkingHours) {
      return new NextResponse('Half day threshold must be less than standard working hours', { status: 400 });
    }

    if (validatedData.minimumWorkingHours >= validatedData.standardWorkingHours) {
      return new NextResponse('Minimum working hours must be less than standard working hours', { status: 400 });
    }

    // Check if policy already exists
    const existingPolicy = await prisma.attendancePolicy.findFirst({
      where: {
        companyId: user.companyId,
        isActive: true,
      }
    });

    let savedPolicy;

    if (existingPolicy) {
      // Update existing policy
      savedPolicy = await prisma.attendancePolicy.update({
        where: { id: existingPolicy.id },
        data: {
          name: 'Company Attendance Policy',
          description: 'Updated attendance policy settings',
          workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          startTime: '09:00',
          endTime: '17:00',
          breakDuration: validatedData.breakDurationMinutes / 60,
          lateThreshold: validatedData.lateMarkAfterMinutes,
          halfDayThreshold: validatedData.halfDayThresholdHours,
          fullDayThreshold: validatedData.standardWorkingHours,
          overtimeThreshold: validatedData.overtimeThresholdHours,
          perfectAttendancePoints: 50,
          earlyArrivalPoints: 5,
          isActive: true,
          updatedAt: new Date(),
        }
      });
    } else {
      // Create new policy
      savedPolicy = await prisma.attendancePolicy.create({
        data: {
          name: 'Company Attendance Policy',
          description: 'Default attendance policy settings',
          workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          startTime: '09:00',
          endTime: '17:00',
          breakDuration: validatedData.breakDurationMinutes / 60,
          lateThreshold: validatedData.lateMarkAfterMinutes,
          halfDayThreshold: validatedData.halfDayThresholdHours,
          fullDayThreshold: validatedData.standardWorkingHours,
          overtimeThreshold: validatedData.overtimeThresholdHours,
          perfectAttendancePoints: 50,
          earlyArrivalPoints: 5,
          isDefault: true,
          isActive: true,
          companyId: user.companyId,
        }
      });
    }

    // Log the policy change for audit trail (commented out as AuditLog model doesn't exist)
    if (validatedData.auditTrailEnabled) {
      // await prisma.auditLog.create({
      //   data: {
      //     companyId: user.companyId,
      //     userId: user.id,
      //     action: 'UPDATE_ATTENDANCE_POLICY',
      //     entityType: 'POLICY',
      //     entityId: savedPolicy.id,
      //     details: {
      //       category: 'attendance_policy',
      //       updatedBy: `${user.firstName} ${user.lastName}`,
      //       updatedAt: new Date().toISOString(),
      //       changes: validatedData,
      //     },
      //   }
      // }).catch((error: any) => {
      //   // Don't fail the main operation if audit logging fails
      //   console.error('Failed to create audit log:', error);
      // });

      // For now, just log to console
      console.log('Attendance policy updated:', {
        companyId: user.companyId,
        updatedBy: `${user.firstName} ${user.lastName}`,
        updatedAt: new Date().toISOString(),
        changes: validatedData,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Attendance policy saved successfully',
      policy: validatedData,
    });

  } catch (error) {
    console.error('[ATTENDANCE_POLICY_POST]', error);
    
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ 
        error: 'Validation failed', 
        details: error.errors 
      }), { status: 400 });
    }

    return new NextResponse('Internal error', { status: 500 });
  }
}
