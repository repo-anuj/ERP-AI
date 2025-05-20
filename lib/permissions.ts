// Define all possible permissions in the system
export const PERMISSIONS = {
  // Dashboard permissions
  VIEW_DASHBOARD: 'view_dashboard',

  // HR permissions
  VIEW_EMPLOYEES: 'view_employees',
  MANAGE_EMPLOYEES: 'manage_employees',
  VIEW_ATTENDANCE: 'view_attendance',
  MANAGE_ATTENDANCE: 'manage_attendance',

  // Inventory permissions
  VIEW_INVENTORY: 'view_inventory',
  MANAGE_INVENTORY: 'manage_inventory',

  // Sales permissions
  VIEW_SALES: 'view_sales',
  MANAGE_SALES: 'manage_sales',
  CREATE_INVOICE: 'create_invoice',

  // Finance permissions
  VIEW_FINANCE: 'view_finance',
  MANAGE_FINANCE: 'manage_finance',
  VIEW_TRANSACTIONS: 'view_transactions',
  MANAGE_TRANSACTIONS: 'manage_transactions',

  // Project permissions
  VIEW_PROJECTS: 'view_projects',
  MANAGE_PROJECTS: 'manage_projects',
  ASSIGN_TASKS: 'assign_tasks',
  COMPLETE_TASKS: 'complete_tasks',
  APPROVE_TASKS: 'approve_tasks',

  // Analytics permissions
  VIEW_ANALYTICS: 'view_analytics',

  // Settings permissions
  VIEW_SETTINGS: 'view_settings',
  MANAGE_SETTINGS: 'manage_settings',

  // Admin permissions
  MANAGE_ROLES: 'manage_roles',
  MANAGE_COMPANY: 'manage_company',
};

// Define role-based permission sets
export const ROLE_PERMISSIONS = {
  admin: Object.values(PERMISSIONS), // Admin has all permissions

  manager: [
    // Dashboard
    PERMISSIONS.VIEW_DASHBOARD,

    // HR (limited)
    PERMISSIONS.VIEW_EMPLOYEES,
    PERMISSIONS.VIEW_ATTENDANCE,

    // Projects
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.MANAGE_PROJECTS,
    PERMISSIONS.ASSIGN_TASKS,
    PERMISSIONS.APPROVE_TASKS,

    // Analytics
    PERMISSIONS.VIEW_ANALYTICS,

    // Settings (limited)
    PERMISSIONS.VIEW_SETTINGS,
  ],

  hr: [
    // Dashboard
    PERMISSIONS.VIEW_DASHBOARD,

    // HR
    PERMISSIONS.VIEW_EMPLOYEES,
    PERMISSIONS.MANAGE_EMPLOYEES,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.MANAGE_ATTENDANCE,

    // Analytics (limited)
    PERMISSIONS.VIEW_ANALYTICS,

    // Settings (limited)
    PERMISSIONS.VIEW_SETTINGS,
  ],

  sales: [
    // Dashboard
    PERMISSIONS.VIEW_DASHBOARD,

    // Sales
    PERMISSIONS.VIEW_SALES,
    PERMISSIONS.MANAGE_SALES,
    PERMISSIONS.CREATE_INVOICE,

    // Inventory (view only)
    PERMISSIONS.VIEW_INVENTORY,

    // Settings (limited)
    PERMISSIONS.VIEW_SETTINGS,
  ],

  engineering: [
    // Dashboard
    PERMISSIONS.VIEW_DASHBOARD,

    // Projects
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.COMPLETE_TASKS,

    // Settings (limited)
    PERMISSIONS.VIEW_SETTINGS,
  ],

  finance: [
    // Dashboard
    PERMISSIONS.VIEW_DASHBOARD,

    // Finance
    PERMISSIONS.VIEW_FINANCE,
    PERMISSIONS.MANAGE_FINANCE,
    PERMISSIONS.VIEW_TRANSACTIONS,
    PERMISSIONS.MANAGE_TRANSACTIONS,

    // Sales (view only)
    PERMISSIONS.VIEW_SALES,

    // Analytics
    PERMISSIONS.VIEW_ANALYTICS,

    // Settings (limited)
    PERMISSIONS.VIEW_SETTINGS,
  ],

  employee: [
    // Settings (limited)
    PERMISSIONS.VIEW_SETTINGS,
  ],
};

// Get permissions for a specific role
export function getPermissionsForRole(role: string): string[] {
  return ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || ROLE_PERMISSIONS.employee;
}

// Get permissions for a specific department
export function getPermissionsForDepartment(department: string): string[] {
  const deptLower = department.toLowerCase();

  switch (deptLower) {
    case 'hr':
      return ROLE_PERMISSIONS.hr;
    case 'sales':
      return ROLE_PERMISSIONS.sales;
    case 'engineering':
      return ROLE_PERMISSIONS.engineering;
    case 'finance':
      return ROLE_PERMISSIONS.finance;
    default:
      return ROLE_PERMISSIONS.employee;
  }
}

// Get combined permissions for role and department
export function getCombinedPermissions(role: string, department: string, isUser: boolean = false): string[] {
  // If user (owner), they have unrestricted access to everything
  if (isUser) {
    return ROLE_PERMISSIONS.admin; // Give them all permissions
  }

  // If admin or manager, they can access everything regardless of department
  if (role === 'admin') {
    return ROLE_PERMISSIONS.admin;
  }

  if (role === 'manager') {
    // Managers get all their role permissions plus their department permissions
    const rolePermissions = getPermissionsForRole(role);
    const deptPermissions = getPermissionsForDepartment(department);

    // Combine permissions without duplicates
    const combinedPermissions = [...rolePermissions];
    deptPermissions.forEach(permission => {
      if (!combinedPermissions.includes(permission)) {
        combinedPermissions.push(permission);
      }
    });

    return combinedPermissions;
  }

  // For regular employees, use department-specific permissions
  return getPermissionsForDepartment(department);
}

// Check if a user has a specific permission
export function hasPermission(userPermissions: string[], permission: string, isUser: boolean = false): boolean {
  // If this is a regular user (not an employee), they have unrestricted access
  if (isUser) return true;

  // Otherwise, check if the user/employee has the specific permission
  return userPermissions.includes(permission);
}

// Map permissions to accessible routes
export const PERMISSION_ROUTES = {
  [PERMISSIONS.VIEW_DASHBOARD]: ['/'],
  [PERMISSIONS.VIEW_EMPLOYEES]: ['/hr'],
  [PERMISSIONS.MANAGE_EMPLOYEES]: ['/hr'],
  [PERMISSIONS.VIEW_ATTENDANCE]: ['/hr/attendance'],
  [PERMISSIONS.MANAGE_ATTENDANCE]: ['/hr/attendance'],
  [PERMISSIONS.VIEW_INVENTORY]: ['/inventory'],
  [PERMISSIONS.MANAGE_INVENTORY]: ['/inventory'],
  [PERMISSIONS.VIEW_SALES]: ['/sales'],
  [PERMISSIONS.MANAGE_SALES]: ['/sales'],
  [PERMISSIONS.CREATE_INVOICE]: ['/sales/invoice'],
  [PERMISSIONS.VIEW_FINANCE]: ['/dashboard/finance'],
  [PERMISSIONS.MANAGE_FINANCE]: ['/dashboard/finance'],
  [PERMISSIONS.VIEW_TRANSACTIONS]: ['/dashboard/finance/transactions'],
  [PERMISSIONS.MANAGE_TRANSACTIONS]: ['/dashboard/finance/transactions'],
  [PERMISSIONS.VIEW_PROJECTS]: ['/projects'],
  [PERMISSIONS.MANAGE_PROJECTS]: ['/projects'],
  [PERMISSIONS.VIEW_ANALYTICS]: ['/analytics'],
  [PERMISSIONS.VIEW_SETTINGS]: ['/settings'],
  [PERMISSIONS.MANAGE_SETTINGS]: ['/settings'],
  [PERMISSIONS.MANAGE_ROLES]: ['/settings/roles'],
  [PERMISSIONS.MANAGE_COMPANY]: ['/settings/company'],
};

// Get all accessible routes for a set of permissions
export function getAccessibleRoutes(permissions: string[], role?: string): string[] {
  const routes: string[] = [];

  // Add routes based on permissions
  permissions.forEach(permission => {
    const permissionRoutes = PERMISSION_ROUTES[permission as keyof typeof PERMISSION_ROUTES];
    if (permissionRoutes) {
      permissionRoutes.forEach(route => {
        if (!routes.includes(route)) {
          routes.push(route);
        }
      });
    }
  });

  // Make sure dashboard is included for roles that should have it
  if (!routes.includes('/') && (role === 'admin' || role === 'manager' || permissions.includes(PERMISSIONS.VIEW_DASHBOARD))) {
    routes.push('/');
  }

  // Always include settings
  if (!routes.includes('/settings')) {
    routes.push('/settings');
  }

  return routes;
}
