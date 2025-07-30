import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import crypto from 'crypto';
import { emailService } from '@/lib/email-service';
import { createClientPortalAccessNotification } from '@/lib/notification-service';
import { getUserCompanyId } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Schema for creating client access
const createClientAccessSchema = z.object({
  projectId: z.string(),
  clientEmail: z.string().email(),
  permissions: z.array(z.enum(['view_progress', 'view_documents', 'view_budget', 'comment', 'approve_milestones'])),
  expiresAt: z.string().datetime().optional(),
  notificationPrefs: z.object({
    emailReports: z.boolean().default(true),
    frequency: z.enum(['daily', 'weekly', 'milestone']).default('weekly'),
    includeFinancials: z.boolean().default(false)
  }).optional()
});

// Schema for client authentication
const clientAuthSchema = z.object({
  accessToken: z.string(),
  clientEmail: z.string().email()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Check if this is a client access creation or authentication request
    if (body.action === 'create_access') {
      return await createClientAccess(body);
    } else if (body.action === 'authenticate') {
      return await authenticateClient(body);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Client portal API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function createClientAccess(body: any) {
  try {
    const validatedData = createClientAccessSchema.parse(body);
    
    // Verify project exists and get company info
    const project = await prisma.project.findUnique({
      where: { id: validatedData.projectId },
      include: { company: true }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Generate secure access token
    const accessToken = crypto.randomBytes(32).toString('hex');

    // Check if client access already exists
    const existingAccess = await prisma.clientAccess.findUnique({
      where: { projectId: validatedData.projectId }
    });

    let clientAccess;
    if (existingAccess) {
      // Update existing access
      clientAccess = await prisma.clientAccess.update({
        where: { projectId: validatedData.projectId },
        data: {
          clientEmail: validatedData.clientEmail,
          accessToken,
          permissions: validatedData.permissions,
          expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
          notificationPrefs: validatedData.notificationPrefs || {},
          isActive: true,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new access
      clientAccess = await prisma.clientAccess.create({
        data: {
          projectId: validatedData.projectId,
          clientEmail: validatedData.clientEmail,
          accessToken,
          permissions: validatedData.permissions,
          expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
          notificationPrefs: validatedData.notificationPrefs || {},
          companyId: project.companyId
        }
      });
    }

    // Send access email to client
    const accessUrl = `${process.env.NEXT_PUBLIC_APP_URL}/client-portal?token=${accessToken}&email=${encodeURIComponent(validatedData.clientEmail)}`;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Project Access Granted</h2>
        <p>You have been granted access to view the progress of project: <strong>${project.name}</strong></p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Your Access Details:</h3>
          <ul>
            <li><strong>Project:</strong> ${project.name}</li>
            <li><strong>Company:</strong> ${project.company?.name || 'N/A'}</li>
            <li><strong>Permissions:</strong> ${validatedData.permissions.join(', ')}</li>
            ${validatedData.expiresAt ? `<li><strong>Access Expires:</strong> ${new Date(validatedData.expiresAt).toLocaleDateString()}</li>` : ''}
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${accessUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Access Project Dashboard
          </a>
        </div>

        <p style="color: #666; font-size: 14px;">
          This link is secure and personalized for your email address. Please do not share it with others.
        </p>
      </div>
    `;

    await emailService.sendEmail(
      validatedData.clientEmail,
      `Project Access - ${project.name}`,
      emailHtml
    );

    // Create notification for the team
    try {
      await createClientPortalAccessNotification(
        project.companyId,
        validatedData.projectId,
        project.name,
        validatedData.clientEmail,
        'access_granted',
        'system', // We'll need to get actual user ID in a real implementation
        'System'
      );
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
      // Don't fail the entire request if notification fails
    }

    return NextResponse.json({
      message: 'Client access created successfully',
      accessToken,
      accessUrl
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    throw error;
  }
}

async function authenticateClient(body: any) {
  try {
    const validatedData = clientAuthSchema.parse(body);

    // Find client access
    const clientAccess = await prisma.clientAccess.findUnique({
      where: { accessToken: validatedData.accessToken },
      include: {
        project: {
          include: {
            tasks: {
              where: {
                status: { in: ['in_progress', 'completed', 'awaiting_approval'] }
              },
              orderBy: { updatedAt: 'desc' },
              take: 10
            },
            milestones: {
              orderBy: { targetDate: 'asc' }
            },
            company: true
          }
        }
      }
    });

    if (!clientAccess) {
      return NextResponse.json({ error: 'Invalid access token' }, { status: 401 });
    }

    // Verify email matches
    if (clientAccess.clientEmail !== validatedData.clientEmail) {
      return NextResponse.json({ error: 'Email does not match access token' }, { status: 401 });
    }

    // Check if access is active
    if (!clientAccess.isActive) {
      return NextResponse.json({ error: 'Access has been deactivated' }, { status: 401 });
    }

    // Check if access has expired
    if (clientAccess.expiresAt && new Date() > clientAccess.expiresAt) {
      return NextResponse.json({ error: 'Access has expired' }, { status: 401 });
    }

    // Update last access time
    await prisma.clientAccess.update({
      where: { id: clientAccess.id },
      data: { lastAccessAt: new Date() }
    });

    // Create notification for client portal access
    try {
      await createClientPortalAccessNotification(
        clientAccess.project.companyId,
        clientAccess.projectId,
        clientAccess.project.name,
        validatedData.clientEmail,
        'access_used',
        'client',
        validatedData.clientEmail
      );
    } catch (notificationError) {
      console.error('Failed to create access notification:', notificationError);
      // Don't fail the entire request if notification fails
    }

    // Format project data for client view
    const projectData = {
      id: clientAccess.project.id,
      name: clientAccess.project.name,
      description: clientAccess.project.description,
      status: clientAccess.project.status,
      progress: clientAccess.project.completionPercentage,
      startDate: clientAccess.project.startDate,
      endDate: clientAccess.project.endDate,
      company: {
        name: clientAccess.project.company?.name,
        logo: clientAccess.project.company?.logo
      },
      // Only include budget if client has permission
      budget: clientAccess.permissions.includes('view_budget') ? {
        total: clientAccess.project.budget,
        spent: clientAccess.project.expenses,
        remaining: clientAccess.project.budget - clientAccess.project.expenses
      } : null,
      milestones: clientAccess.project.milestones.map(m => ({
        id: m.id,
        name: m.name,
        description: m.description,
        status: m.status,
        targetDate: m.targetDate,
        completionDate: m.completionDate,
        deliverables: m.deliverables
      })),
      recentTasks: clientAccess.project.tasks.map(t => ({
        id: t.id,
        name: t.name,
        status: t.status,
        progress: t.completionPercentage,
        dueDate: t.dueDate
      })),
      permissions: clientAccess.permissions,
      lastUpdated: clientAccess.project.updatedAt
    };

    return NextResponse.json({
      success: true,
      project: projectData,
      clientAccess: {
        id: clientAccess.id,
        permissions: clientAccess.permissions,
        lastAccessAt: clientAccess.lastAccessAt,
        expiresAt: clientAccess.expiresAt
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    throw error;
  }
}

// GET endpoint for retrieving client access info
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    const clientAccess = await prisma.clientAccess.findUnique({
      where: { projectId },
      include: {
        project: {
          select: {
            name: true,
            status: true
          }
        }
      }
    });

    if (!clientAccess) {
      return NextResponse.json({ error: 'No client access found for this project' }, { status: 404 });
    }

    return NextResponse.json({
      clientEmail: clientAccess.clientEmail,
      permissions: clientAccess.permissions,
      isActive: clientAccess.isActive,
      lastAccessAt: clientAccess.lastAccessAt,
      expiresAt: clientAccess.expiresAt,
      project: clientAccess.project
    });

  } catch (error) {
    console.error('Error retrieving client access:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
