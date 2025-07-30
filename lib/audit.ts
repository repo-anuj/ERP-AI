import { prisma } from './prisma';

export interface AuditLogData {
  userId?: string;
  userEmail?: string;
  userName?: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: any;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
  companyId: string;
}

/**
 * Create an audit log entry
 * This function safely creates audit logs without throwing errors
 * to prevent audit logging from breaking main application functionality
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        userEmail: data.userEmail,
        userName: data.userName,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        details: data.details,
        changes: data.changes,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        companyId: data.companyId,
      },
    });
  } catch (error) {
    // Log the error but don't throw it to prevent breaking main functionality
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Common audit actions
 */
export const AUDIT_ACTIONS = {
  // General CRUD operations
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  VIEW: 'VIEW',
  
  // Authentication & Authorization
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  PERMISSION_CHANGE: 'PERMISSION_CHANGE',
  
  // HR Operations
  EMPLOYEE_CREATE: 'EMPLOYEE_CREATE',
  EMPLOYEE_UPDATE: 'EMPLOYEE_UPDATE',
  EMPLOYEE_DELETE: 'EMPLOYEE_DELETE',
  
  // Leave Management
  LEAVE_APPLICATION_CREATE: 'LEAVE_APPLICATION_CREATE',
  LEAVE_APPLICATION_APPROVE: 'LEAVE_APPLICATION_APPROVE',
  LEAVE_APPLICATION_REJECT: 'LEAVE_APPLICATION_REJECT',
  ADJUST_LEAVE_BALANCE: 'ADJUST_LEAVE_BALANCE',
  
  // Performance Management
  CREATE_PERFORMANCE_REVIEW: 'CREATE_PERFORMANCE_REVIEW',
  UPDATE_PERFORMANCE_REVIEW: 'UPDATE_PERFORMANCE_REVIEW',
  CREATE_PERFORMANCE_FEEDBACK: 'CREATE_PERFORMANCE_FEEDBACK',
  CREATE_PERFORMANCE_TEMPLATE: 'CREATE_PERFORMANCE_TEMPLATE',
  UPDATE_PERFORMANCE_TEMPLATE: 'UPDATE_PERFORMANCE_TEMPLATE',
  DELETE_PERFORMANCE_TEMPLATE: 'DELETE_PERFORMANCE_TEMPLATE',
  
  // Payroll
  GENERATE_PAYROLL: 'GENERATE_PAYROLL',
  GENERATE_PAYSLIP: 'GENERATE_PAYSLIP',
  PROCESS_PAYROLL: 'PROCESS_PAYROLL',
  
  // Attendance
  BULK_CHECKIN: 'BULK_CHECKIN',
  UPDATE_ATTENDANCE_POLICY: 'UPDATE_ATTENDANCE_POLICY',
  
  // Finance
  CREATE_TRANSACTION: 'CREATE_TRANSACTION',
  UPDATE_TRANSACTION: 'UPDATE_TRANSACTION',
  DELETE_TRANSACTION: 'DELETE_TRANSACTION',
} as const;

/**
 * Common entity types
 */
export const ENTITY_TYPES = {
  USER: 'USER',
  EMPLOYEE: 'EMPLOYEE',
  COMPANY: 'COMPANY',
  DEPARTMENT: 'DEPARTMENT',
  
  // Leave Management
  LEAVE_APPLICATION: 'LEAVE_APPLICATION',
  LEAVE_BALANCE: 'LEAVE_BALANCE',
  LEAVE_TYPE: 'LEAVE_TYPE',
  
  // Performance Management
  PERFORMANCE_REVIEW: 'PERFORMANCE_REVIEW',
  PERFORMANCE_FEEDBACK: 'PERFORMANCE_FEEDBACK',
  PERFORMANCE_TEMPLATE: 'PERFORMANCE_TEMPLATE',
  PERFORMANCE_GOAL: 'PERFORMANCE_GOAL',
  
  // Payroll
  PAYROLL: 'PAYROLL',
  PAYSLIP: 'PAYSLIP',
  SALARY_STRUCTURE: 'SALARY_STRUCTURE',
  
  // Attendance
  ATTENDANCE: 'ATTENDANCE',
  ATTENDANCE_POLICY: 'ATTENDANCE_POLICY',
  
  // Finance
  TRANSACTION: 'TRANSACTION',
  FINANCIAL_ACCOUNT: 'FINANCIAL_ACCOUNT',
  BUDGET: 'BUDGET',
  
  // Projects
  PROJECT: 'PROJECT',
  TASK: 'TASK',
} as const;

/**
 * Helper function to extract user info from request headers
 */
export function extractRequestInfo(request: Request) {
  const ipAddress = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  return { ipAddress, userAgent };
}
