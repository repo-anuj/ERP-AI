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

export async function POST(request: Request, { params }: RouteParams) {
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
    const { emoji } = body;

    if (!emoji) {
      return NextResponse.json(
        { error: 'Emoji is required' },
        { status: 400 }
      );
    }

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
      }
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

    // Verify message exists
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

    // Since MessageReaction model doesn't exist in the schema,
    // we'll simulate the reaction functionality
    console.log(`Simulating reaction: ${emoji} by employee ${employee.id} on message ${messageId}`);

    return NextResponse.json({
      success: true,
      action: 'simulated',
      message: 'Reaction processed (simulation mode)',
      emoji: emoji,
      messageId: messageId,
      userId: employee.id
    });

  } catch (error) {
    console.error('[MESSAGE_REACT] Error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// GET endpoint to retrieve reactions for a message
export async function GET(request: Request, { params }: RouteParams) {
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
      }
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

    // Since MessageReaction model doesn't exist in the schema,
    // return empty reactions array
    console.log(`Getting reactions for message ${messageId} (simulation mode)`);

    return NextResponse.json({
      reactions: [],
      message: 'Reactions feature in simulation mode - MessageReaction model not implemented'
    });

  } catch (error) {
    console.error('[MESSAGE_REACTIONS_GET] Error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
