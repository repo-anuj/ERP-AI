/**
 * Employee utility functions for safe data handling
 * Prevents React rendering errors when employee data contains objects
 */

export interface EmployeeData {
  id: string;
  firstName: string | { name: string } | any;
  lastName: string | { name: string } | any;
  email: string;
  phone?: string;
  position: string;
  department: string | { id: string; name: string } | any;
  startDate: string;
  salary?: number;
  status: string;
  role?: string;
  [key: string]: any; // Allow for additional fields
}

/**
 * Safely extract employee's first name
 */
export function getEmployeeFirstName(employee: EmployeeData): string {
  if (!employee?.firstName) return '';
  
  if (typeof employee.firstName === 'string') {
    return employee.firstName;
  }
  
  // Handle object case
  if (typeof employee.firstName === 'object' && employee.firstName?.name) {
    return employee.firstName.name;
  }
  
  return String(employee.firstName || '');
}

/**
 * Safely extract employee's last name
 */
export function getEmployeeLastName(employee: EmployeeData): string {
  if (!employee?.lastName) return '';
  
  if (typeof employee.lastName === 'string') {
    return employee.lastName;
  }
  
  // Handle object case
  if (typeof employee.lastName === 'object' && employee.lastName?.name) {
    return employee.lastName.name;
  }
  
  return String(employee.lastName || '');
}

/**
 * Safely get employee's full name
 */
export function getEmployeeFullName(employee: EmployeeData): string {
  const firstName = getEmployeeFirstName(employee);
  const lastName = getEmployeeLastName(employee);
  return `${firstName} ${lastName}`.trim();
}

/**
 * Safely extract employee's department name
 */
export function getEmployeeDepartment(employee: EmployeeData): string {
  if (!employee?.department) return 'No Department';
  
  if (typeof employee.department === 'string') {
    return employee.department;
  }
  
  // Handle object case
  if (typeof employee.department === 'object' && employee.department?.name) {
    return employee.department.name;
  }
  
  return 'No Department';
}

/**
 * Get employee initials for avatars
 */
export function getEmployeeInitials(employee: EmployeeData): string {
  const firstName = getEmployeeFirstName(employee);
  const lastName = getEmployeeLastName(employee);
  
  const firstInitial = firstName.charAt(0).toUpperCase();
  const lastInitial = lastName.charAt(0).toUpperCase();
  
  return `${firstInitial}${lastInitial}`;
}

/**
 * Format employee display text for dropdowns and lists
 */
export function formatEmployeeDisplay(employee: EmployeeData, includeRole: boolean = false): string {
  const fullName = getEmployeeFullName(employee);
  const position = employee.position || 'No Position';
  const department = getEmployeeDepartment(employee);
  
  let display = `${fullName} - ${position}`;
  
  if (includeRole && employee.role) {
    display += ` (${employee.role})`;
  }
  
  return display;
}

/**
 * Format employee for team member display
 */
export function formatTeamMemberDisplay(employee: EmployeeData): string {
  const fullName = getEmployeeFullName(employee);
  const position = employee.position || 'No Position';
  const department = getEmployeeDepartment(employee);
  
  return `${fullName} - ${position} (${department})`;
}

/**
 * Check if employee has a specific role
 */
export function hasRole(employee: EmployeeData, role: string): boolean {
  return employee.role === role;
}

/**
 * Check if employee is a manager
 */
export function isManager(employee: EmployeeData): boolean {
  return hasRole(employee, 'manager') || 
         hasRole(employee, 'admin') ||
         employee.position?.toLowerCase().includes('manager') ||
         employee.position?.toLowerCase().includes('lead');
}

/**
 * Filter employees by role
 */
export function filterEmployeesByRole(employees: EmployeeData[], role: string): EmployeeData[] {
  return employees.filter(emp => hasRole(emp, role));
}

/**
 * Filter managers from employee list
 */
export function filterManagers(employees: EmployeeData[]): EmployeeData[] {
  return employees.filter(emp => isManager(emp));
}

/**
 * Filter team members (exclude managers)
 */
export function filterTeamMembers(employees: EmployeeData[]): EmployeeData[] {
  return employees.filter(emp => !isManager(emp));
}

/**
 * Safe employee data validator
 * Ensures employee object has required fields and converts objects to strings
 */
export function sanitizeEmployeeData(employee: any): EmployeeData {
  return {
    id: employee.id || '',
    firstName: getEmployeeFirstName(employee),
    lastName: getEmployeeLastName(employee),
    email: employee.email || '',
    phone: employee.phone || '',
    position: employee.position || 'No Position',
    department: getEmployeeDepartment(employee),
    startDate: employee.startDate || '',
    salary: employee.salary || 0,
    status: employee.status || 'active',
    role: employee.role || 'employee',
    ...employee // Preserve other fields
  };
}

/**
 * Batch sanitize employee data array
 */
export function sanitizeEmployeeArray(employees: any[]): EmployeeData[] {
  if (!Array.isArray(employees)) return [];
  return employees.map(sanitizeEmployeeData);
}

/**
 * Employee search function
 */
export function searchEmployees(employees: EmployeeData[], searchTerm: string): EmployeeData[] {
  if (!searchTerm.trim()) return employees;
  
  const term = searchTerm.toLowerCase();
  
  return employees.filter(employee => {
    const fullName = getEmployeeFullName(employee).toLowerCase();
    const email = employee.email.toLowerCase();
    const position = employee.position.toLowerCase();
    const department = getEmployeeDepartment(employee).toLowerCase();
    
    return fullName.includes(term) ||
           email.includes(term) ||
           position.includes(term) ||
           department.includes(term);
  });
}

/**
 * Sort employees by name
 */
export function sortEmployeesByName(employees: EmployeeData[]): EmployeeData[] {
  return [...employees].sort((a, b) => {
    const nameA = getEmployeeFullName(a).toLowerCase();
    const nameB = getEmployeeFullName(b).toLowerCase();
    return nameA.localeCompare(nameB);
  });
}

/**
 * Group employees by department
 */
export function groupEmployeesByDepartment(employees: EmployeeData[]): Record<string, EmployeeData[]> {
  return employees.reduce((groups, employee) => {
    const department = getEmployeeDepartment(employee);
    if (!groups[department]) {
      groups[department] = [];
    }
    groups[department].push(employee);
    return groups;
  }, {} as Record<string, EmployeeData[]>);
}
