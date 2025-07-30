import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getUserCompanyId } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Schema for using a template to create a project
const useTemplateSchema = z.object({
  templateId: z.string().min(1, "Template ID is required"),
  projectName: z.string().min(1, "Project name is required"),
  projectDescription: z.string().optional(),
  
  // Project-specific overrides
  startDate: z.string(),
  endDate: z.string().optional(),
  budget: z.number().optional(),
  
  // Team assignment
  projectManagerId: z.string().optional(),
  teamMemberIds: z.array(z.string()).default([]),
  
  // Client information
  clientName: z.string().optional(),
  clientCompany: z.string().optional(),
  clientEmail: z.string().optional(),
  
  // Customizations
  customMilestones: z.array(z.object({
    name: z.string(),
    targetDate: z.string(),
    description: z.string().optional()
  })).default([]),
  
  customTasks: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    assigneeId: z.string().optional(),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
    estimatedHours: z.number().optional()
  })).default([]),
  
  // Additional customizations
  additionalNotes: z.string().optional(),
  customTags: z.array(z.string()).default([])
});

export async function POST(req: NextRequest) {
  try {
    const companyId = await getUserCompanyId();
    
    if (!companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    const validatedData = useTemplateSchema.parse(body);

    // Get the template
    const template = await prisma.projectTemplate.findFirst({
      where: {
        id: validatedData.templateId,
        isActive: true,
        OR: [
          { companyId: companyId },
          { isPublic: true, companyId: null }
        ]
      }
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found or access denied' }, { status: 404 });
    }

    // Prepare project manager data
    let projectManager = null;
    if (validatedData.projectManagerId) {
      const manager = await prisma.employee.findFirst({
        where: {
          id: validatedData.projectManagerId,
          companyId: companyId
        },
        include: {
          department: true
        }
      });

      if (manager) {
        projectManager = {
          employeeId: manager.id,
          name: `${manager.firstName} ${manager.lastName}`,
          role: manager.role || 'manager',
          department: manager.department?.name || 'No Department'
        };
      }
    }

    // Prepare team members data
    const teamMembers = [];
    if (validatedData.teamMemberIds.length > 0) {
      const members = await prisma.employee.findMany({
        where: {
          id: { in: validatedData.teamMemberIds },
          companyId: companyId
        },
        include: {
          department: true
        }
      });

      for (const member of members) {
        teamMembers.push({
          employeeId: member.id,
          name: `${member.firstName} ${member.lastName}`,
          role: member.role || 'employee',
          department: member.department?.name || 'No Department'
        });
      }
    }

    // Prepare client data
    let client = null;
    if (validatedData.clientName || validatedData.clientCompany || validatedData.clientEmail) {
      client = {
        name: validatedData.clientName || '',
        company: validatedData.clientCompany || '',
        email: validatedData.clientEmail || ''
      };
    }

    // Calculate end date if not provided
    let endDate = validatedData.endDate;
    if (!endDate && template.estimatedDuration && validatedData.startDate) {
      const start = new Date(validatedData.startDate);
      const end = new Date(start);
      end.setDate(end.getDate() + template.estimatedDuration);
      endDate = end.toISOString();
    }

    // Merge template tags with custom tags
    const allTags = [...(template.tags || []), ...validatedData.customTags];
    const uniqueTags = Array.from(new Set(allTags));

    // Create the project
    const project = await prisma.project.create({
      data: {
        name: validatedData.projectName,
        description: validatedData.projectDescription || template.description || '',
        type: template.type,
        status: 'planning',
        startDate: new Date(validatedData.startDate),
        endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default to 30 days from now
        completionPercentage: 0,
        projectManager: projectManager || {
          employeeId: '',
          name: 'Unassigned',
          role: 'manager',
          department: 'No Department'
        },
        teamMembers: teamMembers,
        client: client,
        budget: validatedData.budget || template.defaultBudget || 0,
        expenses: 0,
        priority: template.priority,
        tags: uniqueTags,
        notes: [
          template.notes || '',
          validatedData.additionalNotes || ''
        ].filter(Boolean).join('\n\n'),
        
        companyId: companyId
      }
    });

    // Create milestones from template and custom milestones
    const allMilestones = [
      ...(template.milestones as any[] || []),
      ...validatedData.customMilestones
    ];

    if (allMilestones.length > 0) {
      // Note: You'll need to create a Milestone model and relation
      // For now, we'll store them in the project's milestones field
      await prisma.project.update({
        where: { id: project.id },
        data: {
          milestones: {
            create: allMilestones.map((milestone, index) => ({
              ...milestone,
              id: `milestone-${index + 1}`,
              status: 'pending',
              order: index + 1
            }))
          }
        }
      });
    }

    // Create tasks from template and custom tasks
    const allTasks = [
      ...(template.tasks as any[] || []),
      ...validatedData.customTasks
    ];

    if (allTasks.length > 0) {
      for (const [index, taskTemplate] of Array.from(allTasks.entries())) {
        await prisma.task.create({
          data: {
            name: taskTemplate.name,
            description: taskTemplate.description || '',
            status: 'not_started',
            priority: taskTemplate.priority || 'medium',
            assigneeId: taskTemplate.assigneeId || '',
            assigneeName: 'Unassigned',
            startDate: new Date(),
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            estimatedHours: Math.floor(taskTemplate.estimatedHours || 0),
            actualHours: 0,
            completionPercentage: 0,
            dependencies: [],
            projectId: project.id,
            companyId: companyId
          }
        });
      }
    }

    // Track template usage
    await prisma.templateUsage.create({
      data: {
        templateId: template.id,
        projectId: project.id,
        companyId: companyId,
        usedBy: 'current-user-id', // TODO: Get actual user ID
        usedByName: 'Current User' // TODO: Get actual user name
      }
    });

    // Update template usage count
    await prisma.projectTemplate.update({
      where: { id: template.id },
      data: {
        usageCount: { increment: 1 },
        lastUsed: new Date()
      }
    });

    // Fetch the complete project with relations
    const completeProject = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        tasks: true
      }
    });

    return NextResponse.json({
      message: 'Project created successfully from template',
      project: completeProject,
      template: {
        id: template.id,
        name: template.name,
        category: template.category
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    console.error('Template usage error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
