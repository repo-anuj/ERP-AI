import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    projectId: string;
  };
}

// In-memory store for typing indicators (in production, use Redis)
const typingUsers = new Map<string, Map<string, { name: string; timestamp: number }>>();

// Clean up old typing indicators (older than 10 seconds)
const cleanupTypingIndicators = () => {
  const now = Date.now();
  const timeout = 10000; // 10 seconds

  for (const [projectId, users] of Array.from(typingUsers.entries())) {
    for (const [userId, data] of Array.from(users.entries())) {
      if (now - data.timestamp > timeout) {
        users.delete(userId);
      }
    }
    
    if (users.size === 0) {
      typingUsers.delete(projectId);
    }
  }
};

// Run cleanup every 5 seconds
setInterval(cleanupTypingIndicators, 5000);

// POST - Start typing
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

    const { projectId } = params;
    const body = await request.json();
    const { isTyping } = body;

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

    // Update typing status
    if (!typingUsers.has(projectId)) {
      typingUsers.set(projectId, new Map());
    }

    const projectTypingUsers = typingUsers.get(projectId)!;
    const userName = `${employee.firstName} ${employee.lastName}`;

    if (isTyping) {
      // Add user to typing list
      projectTypingUsers.set(employee.id, {
        name: userName,
        timestamp: Date.now()
      });
    } else {
      // Remove user from typing list
      projectTypingUsers.delete(employee.id);
    }

    // Get current typing users (excluding the current user)
    const currentTypingUsers = Array.from(projectTypingUsers.entries())
      .filter(([userId]) => userId !== employee.id)
      .map(([userId, data]) => ({
        id: userId,
        name: data.name,
        timestamp: data.timestamp
      }));

    return NextResponse.json({
      success: true,
      typingUsers: currentTypingUsers,
      isTyping: isTyping,
      user: {
        id: employee.id,
        name: userName
      }
    });

  } catch (error) {
    console.error('[TYPING_INDICATOR] Error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// GET - Get current typing users
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

    const { projectId } = params;

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

    // Clean up old typing indicators
    cleanupTypingIndicators();

    // Get current typing users (excluding the current user)
    const projectTypingUsers = typingUsers.get(projectId) || new Map();
    const currentTypingUsers = Array.from(projectTypingUsers.entries())
      .filter(([userId]) => userId !== employee.id)
      .map(([userId, data]) => ({
        id: userId,
        name: data.name,
        timestamp: data.timestamp
      }));

    return NextResponse.json({
      typingUsers: currentTypingUsers,
      count: currentTypingUsers.length
    });

  } catch (error) {
    console.error('[TYPING_INDICATOR_GET] Error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// DELETE - Stop typing (alternative to POST with isTyping: false)
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

    const { projectId } = params;

    let employee;

    // Check if this is an employee token
    if (payload.isEmployee) {
      employee = await prisma.employee.findUnique({
        where: { id: payload.id },
        include: { company: true }
      });

      if (!employee?.company) {
        return new NextResponse('Employee or company not found', { status: 404 });
      }
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
    }

    // Remove user from typing list
    const projectTypingUsers = typingUsers.get(projectId);
    if (projectTypingUsers) {
      projectTypingUsers.delete(employee.id);
      
      if (projectTypingUsers.size === 0) {
        typingUsers.delete(projectId);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Typing indicator removed'
    });

  } catch (error) {
    console.error('[TYPING_INDICATOR_DELETE] Error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
