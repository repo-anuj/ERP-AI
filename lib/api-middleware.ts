import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from './auth';
import { prisma } from './prisma';
import { getCombinedPermissions, hasPermission } from './permissions';

/**
 * Middleware to check if the user has the required permission to access an API route
 *
 * @param handler The API route handler
 * @param requiredPermission The permission required to access the route
 * @returns A new handler that checks permissions before executing the original handler
 */
export function withPermission(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>,
  requiredPermission: string
) {
  return async (req: NextRequest, context: any) => {
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('token')?.value;
      const isEmployee = cookieStore.get('isEmployee')?.value === 'true';

      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const payload = await verifyAuth(token);

      if (!payload) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }

      // Get user permissions
      let userPermissions: string[] = [];

      if (isEmployee) {
        // Get employee permissions
        const employee = await prisma.employee.findUnique({
          where: { id: payload.id },
        });

        if (!employee) {
          return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        // Get permissions based on role and department
        const role = employee.role || 'employee';
        const department = employee.department || '';

        // Use custom permissions if defined, otherwise use role-based permissions
        userPermissions = employee.permissions && employee.permissions.length > 0
          ? employee.permissions
          : getCombinedPermissions(role, department);
      } else {
        // Regular users (admins) have all permissions for now
        userPermissions = getCombinedPermissions('admin', '');
      }

      // Check if user has the required permission
      if (!hasPermission(userPermissions, requiredPermission)) {
        return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
      }

      // User has permission, proceed with the original handler
      return handler(req, context);
    } catch (error) {
      console.error('Error in permission middleware:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}

/**
 * Helper function to get the company ID for the current user
 * This is a wrapper around getUserCompanyId from auth.ts
 */
export async function getCompanyIdFromRequest(): Promise<string | null> {
  try {
    // Import getUserCompanyId from auth.ts
    const { getUserCompanyId } = await import('./auth');

    // Use the updated function that handles both user and employee tokens
    return await getUserCompanyId();
  } catch (error) {
    console.error('Error getting company ID:', error);
    return null;
  }
}
