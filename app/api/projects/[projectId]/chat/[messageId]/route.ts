import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    projectId: string;
    messageId: string;
  };
}

// PATCH - Edit message
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const token = cookies().get('token')?.value;

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload.email) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    const { projectId, messageId } = params;
    const body = await request.json();
    const { content, action } = body; // action can be 'edit', 'pin', 'unpin'

    let employee;
    let companyId;

    // Check if this is an employee token
    if (payload.isEmployee) {
      employee = await prisma.employee.findUnique({
        where: { id: payload.id },
        include: { company: true }
      });

      if (!employee?.company) {
        return new NextResponse('Employee or company not found', { status: 404 });
      }

      companyId = employee.company.id;
    } else {
      // For regular user tokens
      const user = await prisma.user.findUnique({
        where: { email: payload.email },
        include: { company: true }
      });

      if (!user?.company) {
        return new NextResponse('User or company not found', { status: 404 });
      }

      employee = await prisma.employee.findFirst({
        where: {
          email: payload.email,
          companyId: user.company.id
        }
      });

      if (!employee) {
        return new NextResponse('Employee not found', { status: 404 });
      }

      companyId = user.company.id;
    }

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        companyId: companyId
      },

    });

    if (!project) {
      return new NextResponse('Project not found', { status: 404 });
    }

    // Check if employee is part of the project
    const isManager = project.projectManager.employeeId === employee.id;
    const isTeamMember = project.teamMembers.some((member: any) => member.employeeId === employee.id);

    if (!isManager && !isTeamMember) {
      return new NextResponse('Access denied - not a project member', { status: 403 });
    }

    // Get the message
    const message = await prisma.projectChat.findFirst({
      where: {
        id: messageId,
        projectId: projectId,
        companyId: companyId
      }
    });

    if (!message) {
      return new NextResponse('Message not found', { status: 404 });
    }

    // Handle different actions
    if (action === 'pin' || action === 'unpin') {
      // Only managers can pin/unpin messages
      if (!isManager) {
        return new NextResponse('Only project managers can pin messages', { status: 403 });
      }

      const updatedMessage = await prisma.projectChat.update({
        where: { id: messageId },
        data: {
          // Note: You'll need to add a 'pinned' field to your ProjectChat model
          // For now, we'll use the tags field to simulate pinning
          tags: action === 'pin' 
            ? [...(message.tags || []), 'pinned']
            : (message.tags || []).filter(tag => tag !== 'pinned')
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true
            }
          }
        }
      });

      return NextResponse.json({
        success: true,
        action: action,
        message: {
          id: updatedMessage.id,
          content: updatedMessage.content,
          senderId: updatedMessage.senderId,
          senderName: `${updatedMessage.sender.firstName} ${updatedMessage.sender.lastName}`,
          senderRole: updatedMessage.sender.role,
          timestamp: updatedMessage.createdAt.toISOString(),
          type: updatedMessage.type,
          taskId: updatedMessage.taskId,
          tags: updatedMessage.tags || [],
          pinned: (updatedMessage.tags || []).includes('pinned')
        }
      });
    }

    if (action === 'edit') {
      // Only the sender can edit their own messages
      if (message.senderId !== employee.id) {
        return new NextResponse('You can only edit your own messages', { status: 403 });
      }

      if (!content || !content.trim()) {
        return NextResponse.json(
          { error: 'Content is required for editing' },
          { status: 400 }
        );
      }

      // Check if message is older than 24 hours (optional restriction)
      const messageAge = Date.now() - new Date(message.createdAt).getTime();
      const maxEditAge = 24 * 60 * 60 * 1000; // 24 hours

      if (messageAge > maxEditAge) {
        return NextResponse.json(
          { error: 'Messages older than 24 hours cannot be edited' },
          { status: 400 }
        );
      }

      const updatedMessage = await prisma.projectChat.update({
        where: { id: messageId },
        data: {
          content: content.trim(),
          // Note: You'll need to add 'edited' and 'editedAt' fields to your ProjectChat model
          // For now, we'll use the tags field to mark as edited
          tags: [...(message.tags || []).filter(tag => tag !== 'edited'), 'edited'],
          updatedAt: new Date()
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true
            }
          }
        }
      });

      return NextResponse.json({
        success: true,
        action: 'edit',
        message: {
          id: updatedMessage.id,
          content: updatedMessage.content,
          senderId: updatedMessage.senderId,
          senderName: `${updatedMessage.sender.firstName} ${updatedMessage.sender.lastName}`,
          senderRole: updatedMessage.sender.role,
          timestamp: updatedMessage.createdAt.toISOString(),
          type: updatedMessage.type,
          taskId: updatedMessage.taskId,
          tags: updatedMessage.tags || [],
          edited: (updatedMessage.tags || []).includes('edited'),
          editedAt: updatedMessage.updatedAt.toISOString()
        }
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('[MESSAGE_PATCH] Error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// DELETE - Delete message
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const token = cookies().get('token')?.value;

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload.email) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    const { projectId, messageId } = params;

    let employee;
    let companyId;

    // Check if this is an employee token
    if (payload.isEmployee) {
      employee = await prisma.employee.findUnique({
        where: { id: payload.id },
        include: { company: true }
      });

      if (!employee?.company) {
        return new NextResponse('Employee or company not found', { status: 404 });
      }

      companyId = employee.company.id;
    } else {
      // For regular user tokens
      const user = await prisma.user.findUnique({
        where: { email: payload.email },
        include: { company: true }
      });

      if (!user?.company) {
        return new NextResponse('User or company not found', { status: 404 });
      }

      employee = await prisma.employee.findFirst({
        where: {
          email: payload.email,
          companyId: user.company.id
        }
      });

      if (!employee) {
        return new NextResponse('Employee not found', { status: 404 });
      }

      companyId = user.company.id;
    }

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        companyId: companyId
      },

    });

    if (!project) {
      return new NextResponse('Project not found', { status: 404 });
    }

    // Check if employee is part of the project
    const isManager = project.projectManager.employeeId === employee.id;
    const isTeamMember = project.teamMembers.some((member: any) => member.employeeId === employee.id);

    if (!isManager && !isTeamMember) {
      return new NextResponse('Access denied - not a project member', { status: 403 });
    }

    // Get the message
    const message = await prisma.projectChat.findFirst({
      where: {
        id: messageId,
        projectId: projectId,
        companyId: companyId
      }
    });

    if (!message) {
      return new NextResponse('Message not found', { status: 404 });
    }

    // Check permissions - only sender or manager can delete
    if (message.senderId !== employee.id && !isManager) {
      return new NextResponse('You can only delete your own messages or be a project manager', { status: 403 });
    }

    // Check if message is older than 24 hours (optional restriction for non-managers)
    if (!isManager) {
      const messageAge = Date.now() - new Date(message.createdAt).getTime();
      const maxDeleteAge = 24 * 60 * 60 * 1000; // 24 hours

      if (messageAge > maxDeleteAge) {
        return NextResponse.json(
          { error: 'Messages older than 24 hours cannot be deleted' },
          { status: 400 }
        );
      }
    }

    // Delete the message
    await prisma.projectChat.delete({
      where: { id: messageId }
    });

    // Note: MessageReaction model doesn't exist in schema, so no reaction cleanup needed
    console.log(`Message ${messageId} deleted successfully`);

    return NextResponse.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('[MESSAGE_DELETE] Error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
