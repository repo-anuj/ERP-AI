import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/email-service';
import { z } from 'zod';
import { getUserCompanyId } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Schema for generating reports
const generateReportSchema = z.object({
  projectId: z.string(),
  reportType: z.enum(['weekly', 'milestone', 'completion', 'custom']),
  recipients: z.array(z.string().email()),
  title: z.string().optional(),
  includeFinancials: z.boolean().default(false),
  customContent: z.object({
    sections: z.array(z.string()).optional(),
    additionalNotes: z.string().optional()
  }).optional()
});

// Schema for scheduling reports
const scheduleReportSchema = z.object({
  projectId: z.string(),
  reportType: z.enum(['weekly', 'milestone', 'completion']),
  recipients: z.array(z.string().email()),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  dayOfWeek: z.number().min(0).max(6).optional(), // 0 = Sunday, 6 = Saturday
  dayOfMonth: z.number().min(1).max(31).optional(),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM format
  isActive: z.boolean().default(true)
});

export async function POST(req: NextRequest) {
  try {
    const companyId = await getUserCompanyId();

    if (!companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    if (body.action === 'generate') {
      return await generateReport(body, companyId);
    } else if (body.action === 'schedule') {
      return await scheduleReport(body, companyId);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function generateReport(body: any, companyId: string) {
  try {
    const validatedData = generateReportSchema.parse(body);

    // Verify project exists and belongs to company
    const project = await prisma.project.findFirst({
      where: {
        id: validatedData.projectId,
        companyId
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Generate and send the report
    // Handle custom report type by defaulting to weekly
    const reportType = validatedData.reportType === 'custom' ? 'weekly' : validatedData.reportType;
    const success = await emailService.sendProjectReport(
      validatedData.projectId,
      validatedData.recipients,
      reportType
    );

    if (!success) {
      return NextResponse.json({ error: 'Failed to generate and send report' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Report generated and sent successfully',
      projectId: validatedData.projectId,
      reportType: validatedData.reportType,
      recipients: validatedData.recipients
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    throw error;
  }
}

async function scheduleReport(body: any, companyId: string) {
  try {
    const validatedData = scheduleReportSchema.parse(body);

    // Verify project exists and belongs to company
    const project = await prisma.project.findFirst({
      where: {
        id: validatedData.projectId,
        companyId
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Calculate next scheduled time
    const now = new Date();
    let nextScheduledTime = new Date();

    switch (validatedData.frequency) {
      case 'daily':
        const [hours, minutes] = validatedData.time.split(':').map(Number);
        nextScheduledTime.setHours(hours, minutes, 0, 0);
        if (nextScheduledTime <= now) {
          nextScheduledTime.setDate(nextScheduledTime.getDate() + 1);
        }
        break;

      case 'weekly':
        const [weekHours, weekMinutes] = validatedData.time.split(':').map(Number);
        const targetDayOfWeek = validatedData.dayOfWeek || 1; // Default to Monday
        const currentDayOfWeek = now.getDay();
        let daysUntilTarget = targetDayOfWeek - currentDayOfWeek;
        if (daysUntilTarget <= 0) {
          daysUntilTarget += 7;
        }
        nextScheduledTime.setDate(now.getDate() + daysUntilTarget);
        nextScheduledTime.setHours(weekHours, weekMinutes, 0, 0);
        break;

      case 'monthly':
        const [monthHours, monthMinutes] = validatedData.time.split(':').map(Number);
        const targetDayOfMonth = validatedData.dayOfMonth || 1;
        nextScheduledTime.setDate(targetDayOfMonth);
        nextScheduledTime.setHours(monthHours, monthMinutes, 0, 0);
        if (nextScheduledTime <= now) {
          nextScheduledTime.setMonth(nextScheduledTime.getMonth() + 1);
        }
        break;
    }

    // Create scheduled report record
    const scheduledReport = await prisma.projectReport.create({
      data: {
        projectId: validatedData.projectId,
        reportType: validatedData.reportType,
        title: `Scheduled ${validatedData.reportType} report for ${project.name}`,
        content: {
          frequency: validatedData.frequency,
          dayOfWeek: validatedData.dayOfWeek,
          dayOfMonth: validatedData.dayOfMonth,
          time: validatedData.time,
          isActive: validatedData.isActive
        },
        recipients: validatedData.recipients,
        status: 'scheduled',
        scheduledFor: nextScheduledTime,
        isAutomatic: true,
        companyId
      }
    });

    return NextResponse.json({
      message: 'Report scheduled successfully',
      scheduledReport: {
        id: scheduledReport.id,
        nextScheduledTime,
        frequency: validatedData.frequency,
        recipients: validatedData.recipients
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    throw error;
  }
}

// GET endpoint for retrieving reports
export async function GET(req: NextRequest) {
  try {
    const companyId = await getUserCompanyId();

    if (!companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const reportType = searchParams.get('reportType');
    const limit = parseInt(searchParams.get('limit') || '10');

    let whereClause: any = { companyId };

    if (projectId) {
      whereClause.projectId = projectId;
    }

    if (reportType) {
      whereClause.reportType = reportType;
    }

    const reports = await prisma.projectReport.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            name: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    return NextResponse.json({
      reports: reports.map(report => ({
        id: report.id,
        projectId: report.projectId,
        projectName: report.project.name,
        reportType: report.reportType,
        title: report.title,
        status: report.status,
        recipients: report.recipients,
        generatedAt: report.generatedAt,
        sentAt: report.sentAt,
        scheduledFor: report.scheduledFor,
        isAutomatic: report.isAutomatic
      }))
    });

  } catch (error) {
    console.error('Error retrieving reports:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE endpoint for canceling scheduled reports
export async function DELETE(req: NextRequest) {
  try {
    const companyId = await getUserCompanyId();

    if (!companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const reportId = searchParams.get('reportId');

    if (!reportId) {
      return NextResponse.json({ error: 'Report ID required' }, { status: 400 });
    }

    // Verify report belongs to company
    const report = await prisma.projectReport.findFirst({
      where: {
        id: reportId,
        companyId
      }
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Delete the scheduled report
    await prisma.projectReport.delete({
      where: { id: reportId }
    });

    return NextResponse.json({
      message: 'Scheduled report canceled successfully'
    });

  } catch (error) {
    console.error('Error canceling scheduled report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
