'use client';

import { cn } from '@/lib/utils';
import {
  BarChart,
  Archive,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Clipboard,
  Grid,
  Menu,
  Settings,
  Users,
  X,
  DollarSign as DollarSignIcon,
  AlertTriangle,
  User,
  Building2,
  UserPlus,
} from 'lucide-react';
import { RestrictedLink } from './restricted-link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { usePermissionContext } from '@/contexts/permission-context';
import { useCompany } from '@/contexts/company-context';
import { PERMISSIONS } from '@/lib/permissions';

interface RouteItem {
  label: string;
  icon?: any;
  href: string;
  submenu?: { label: string; href: string; permission?: string }[];
  permission?: string;
  moduleKey?: string; // Key to identify which module this route belongs to
  industries?: string[]; // Which industries this module is relevant for
  goals?: string[]; // Which primary goals this module supports
}

const allRoutes: RouteItem[] = [
  {
    label: 'Dashboard',
    icon: Grid,
    href: '/',
    permission: PERMISSIONS.VIEW_DASHBOARD,
    moduleKey: 'dashboard',
    industries: ['all'], // Dashboard is always shown
    goals: ['all'], // Dashboard is always shown
  },
  {
    label: 'Inventory',
    icon: Archive,
    href: '/inventory',
    permission: PERMISSIONS.VIEW_INVENTORY,
    moduleKey: 'inventory',
    industries: ['manufacturing', 'retail', 'logistics', 'other'],
    goals: ['inventory_management', 'all_in_one'],
  },
  {
    label: 'Sales',
    icon: DollarSign,
    href: '/sales',
    permission: PERMISSIONS.VIEW_SALES,
    moduleKey: 'sales',
    industries: ['manufacturing', 'retail', 'service', 'consulting', 'other'],
    goals: ['sales_tracking', 'all_in_one'],
  },
  {
    label: 'HR',
    icon: Users,
    href: '/hr',
    permission: PERMISSIONS.VIEW_EMPLOYEES,
    moduleKey: 'hr',
    industries: ['all'], // HR is relevant for all industries
    goals: ['employee_management', 'all_in_one'],
    submenu: [
      {
        label: 'Employees',
        href: '/hr',
        permission: PERMISSIONS.VIEW_EMPLOYEES,
      },
      {
        label: 'Attendance',
        href: '/hr/attendance',
        permission: PERMISSIONS.VIEW_EMPLOYEES, // Using same permission for now
      },
      {
        label: 'Leave Management',
        href: '/hr/leave-management',
        permission: PERMISSIONS.VIEW_EMPLOYEES, // Using same permission for now
      },
      {
        label: 'Performance',
        href: '/hr/performance',
        permission: PERMISSIONS.VIEW_EMPLOYEES, // Using same permission for now
      },
      {
        label: 'Salary Structures',
        href: '/hr/salary-structures',
        permission: PERMISSIONS.VIEW_EMPLOYEES, // Using same permission for now
      },
      {
        label: 'Payroll',
        href: '/hr/payroll',
        permission: PERMISSIONS.VIEW_EMPLOYEES, // Using same permission for now
      },
      {
        label: 'Payslips',
        href: '/hr/payslips',
        permission: PERMISSIONS.VIEW_EMPLOYEES, // Using same permission for now
      },
      {
        label: 'Tax Management',
        href: '/hr/tax-management',
        permission: PERMISSIONS.VIEW_EMPLOYEES, // Using same permission for now
      },
      {
        label: 'Settings',
        href: '/hr/settings',
        permission: PERMISSIONS.VIEW_EMPLOYEES,
      },
    ],
  },
  {
    label: 'Recruitment',
    icon: UserPlus,
    href: '/hr/recruitment',
    permission: PERMISSIONS.VIEW_EMPLOYEES, // Using same permission for now
    moduleKey: 'recruitment',
    industries: ['all'], // Recruitment is relevant for all industries
    goals: ['employee_management', 'all_in_one'],
    submenu: [
      {
        label: 'Job Postings',
        href: '/hr/recruitment/job-postings',
        permission: PERMISSIONS.VIEW_EMPLOYEES,
      },
      {
        label: 'Candidates',
        href: '/hr/recruitment/candidates',
        permission: PERMISSIONS.VIEW_EMPLOYEES,
      },
      {
        label: 'Applications',
        href: '/hr/recruitment/applications',
        permission: PERMISSIONS.VIEW_EMPLOYEES,
      },
      {
        label: 'Interviews',
        href: '/hr/recruitment/interviews',
        permission: PERMISSIONS.VIEW_EMPLOYEES,
      },
      {
        label: 'Evaluations',
        href: '/hr/recruitment/evaluations',
        permission: PERMISSIONS.VIEW_EMPLOYEES,
      },
      {
        label: 'Offers',
        href: '/hr/recruitment/offers',
        permission: PERMISSIONS.VIEW_EMPLOYEES,
      },
      {
        label: 'Background Checks',
        href: '/hr/recruitment/background-checks',
        permission: PERMISSIONS.VIEW_EMPLOYEES,
      },
      {
        label: 'Onboarding',
        href: '/hr/onboarding/instances',
        permission: PERMISSIONS.VIEW_EMPLOYEES,
      },
      {
        label: 'Analytics',
        href: '/hr/recruitment/analytics',
        permission: PERMISSIONS.VIEW_EMPLOYEES,
      },
    ],
  },
  {
    label: 'Projects',
    icon: Clipboard,
    href: '/projects',
    permission: PERMISSIONS.VIEW_PROJECTS,
    moduleKey: 'projects',
    industries: ['technology', 'consulting', 'service', 'other'],
    goals: ['project_management', 'all_in_one'],
    submenu: [
      {
        label: 'All Projects',
        href: '/projects',
        permission: PERMISSIONS.VIEW_PROJECTS,
      },
      {
        label: 'Task Approvals',
        href: '/projects/approvals',
        permission: PERMISSIONS.APPROVE_TASKS,
      },
      {
        label: 'Client Portal',
        href: '/projects/client-portal',
        permission: PERMISSIONS.VIEW_PROJECTS,
      },
      {
        label: 'Reports & Analytics',
        href: '/projects/analytics',
        permission: PERMISSIONS.VIEW_PROJECTS,
      },
      {
        label: 'Templates',
        href: '/projects/templates',
        permission: PERMISSIONS.VIEW_PROJECTS,
      },
    ],
  },
  {
    label: 'Finance',
    icon: DollarSignIcon,
    href: '/dashboard/finance',
    permission: PERMISSIONS.VIEW_FINANCE,
    moduleKey: 'finance',
    industries: ['all'], // Finance is relevant for all industries
    goals: ['financial_control', 'all_in_one'],
    submenu: [
      {
        label: 'Overview',
        href: '/dashboard/finance',
        permission: PERMISSIONS.VIEW_FINANCE,
      },
      {
        label: 'Transactions',
        href: '/dashboard/finance/transactions',
        permission: PERMISSIONS.VIEW_TRANSACTIONS,
      },
      {
        label: 'Accounts',
        href: '/dashboard/finance/accounts',
        permission: PERMISSIONS.VIEW_FINANCE,
      },
      {
        label: 'Recurring',
        href: '/dashboard/finance/recurring',
        permission: PERMISSIONS.VIEW_FINANCE,
      },
      {
        label: 'Categories',
        href: '/dashboard/finance/categories',
        permission: PERMISSIONS.VIEW_FINANCE,
      },
      {
        label: 'Reports',
        href: '/dashboard/finance/reports',
        permission: PERMISSIONS.VIEW_FINANCE,
      },
      {
        label: 'Budgets',
        href: '/dashboard/finance/budgets',
        permission: PERMISSIONS.VIEW_FINANCE,
      },
    ],
  },
  {
    label: 'Analytics',
    icon: BarChart,
    href: '/analytics',
    permission: PERMISSIONS.VIEW_ANALYTICS,
    moduleKey: 'analytics',
    industries: ['all'], // Analytics is useful for all industries
    goals: ['all'], // Analytics supports all goals
  },
  {
    label: 'Settings',
    icon: Settings,
    href: '/settings',
    permission: PERMISSIONS.VIEW_SETTINGS,
    moduleKey: 'settings',
    industries: ['all'], // Settings is always shown
    goals: ['all'], // Settings is always shown
  },
];

// Employee-specific routes (no permissions needed - employees have direct access)
const employeeRoutes: RouteItem[] = [
  {
    label: 'Dashboard',
    icon: Grid,
    href: '/employee/dashboard',
    permission: '', // No permission check for employees
  },
  {
    label: 'Projects',
    icon: Clipboard,
    href: '/employee/projects',
    permission: '', // No permission check for employees
  },
  {
    label: 'Settings',
    icon: Settings,
    href: '/employee/settings',
    permission: '', // No permission check for employees
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const { can, loading, isEmployee } = usePermissionContext();
  const { company, loading: companyLoading } = useCompany();

  // Optimized smart filtering function with memoization for performance
  const currentRoutes = useMemo(() => {
    // For employees, show employee-specific routes
    if (isEmployee) {
      return employeeRoutes;
    }

    // For owners/admins, show all routes but filter based on company setup
    if (!company || companyLoading) {
      // Show essential routes while loading - fast fallback
      return allRoutes.filter(route =>
        ['dashboard', 'settings', 'hr'].includes(route.moduleKey || '')
      );
    }

    // Get company's onboarding preferences for smart filtering
    const primaryIndustry = company.industry;
    const primaryGoal = company.primaryGoal;
    const enabledModules = company.featureToggles?.enabledModules || [];

    // Advanced filtering logic for better UX
    return allRoutes.filter(route => {
      // Always show core modules
      if (['dashboard', 'settings'].includes(route.moduleKey || '')) {
        return true;
      }

      // Check if module is explicitly enabled
      if (enabledModules.length > 0 && route.moduleKey) {
        return enabledModules.includes(route.moduleKey);
      }

      // Fallback to industry/goal matching for better relevance
      const industryMatch = route.industries?.includes('all') ||
                           route.industries?.includes(primaryIndustry || '');

      const goalMatch = route.goals?.includes('all') ||
                       route.goals?.includes(primaryGoal || '');

      // Show route if it matches industry OR goal (inclusive filtering)
      return industryMatch || goalMatch;
    });
  }, [isEmployee, company, companyLoading]);

  // Expand the menu of the active route on initial load
  useEffect(() => {
    const expandedState: Record<string, boolean> = {};

    currentRoutes.forEach(route => {
      if (route.submenu) {
        const isActive = route.submenu.some(item => pathname === item.href);
        if (isActive) {
          expandedState[route.label] = true;
        }
      }
    });

    setExpandedMenus(expandedState);
  }, [pathname, currentRoutes]);

  // Optimized toggle function with useCallback for performance
  const toggleSubmenu = useCallback((label: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  }, []);

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col h-full bg-background border-r transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b">
          {!isCollapsed && (
            <div className="flex flex-col space-y-1">
              {isEmployee ? (
                <>
                  <div className="flex items-center space-x-2">
                    <User className="h-6 w-6 text-primary" />
                    <h1 className="text-xl font-bold">Employee Portal</h1>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-2">
                    {company?.logo ? (
                      <img
                        src={company.logo}
                        alt="Company Logo"
                        className="h-6 w-6 object-contain"
                      />
                    ) : (
                      <Building2 className="h-6 w-6 text-primary" />
                    )}
                    <h1 className="text-xl font-bold">{company?.name || "ERP"}</h1>
                  </div>
                  {company?.industry && (
                    <p className="text-xs text-muted-foreground ml-8">
                      {company.industry.charAt(0).toUpperCase() + company.industry.slice(1)} Business
                    </p>
                  )}
                </>
              )}
            </div>
          )}
          <div className="flex items-center">
            {isMobileOpen && (
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 px-3 py-4 overflow-y-auto">
          {loading || companyLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mb-2"></div>
              <p className="text-xs text-muted-foreground">
                {loading ? 'Loading permissions...' : 'Loading workspace...'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {currentRoutes.map((route) => {
                // Different logic for employees vs owners/admins
                return (
                  <div key={route.href}>
                    {route.submenu ? (
                      <>
                        <button
                          onClick={() => toggleSubmenu(route.label)}
                          className={cn(
                            'w-full flex items-center p-3 text-sm font-medium rounded-lg transition-colors hover:text-primary hover:bg-primary/10',
                            route.submenu.some(item => pathname === item.href) ? 'text-primary bg-primary/10' : 'text-muted-foreground',
                            isCollapsed && 'justify-center'
                          )}
                        >
                          <route.icon className={cn('h-5 w-5', isCollapsed ? 'mr-0' : 'mr-3')} />
                          {!isCollapsed && (
                            <>
                              <span className="flex-1 text-left">{route.label}</span>
                              {expandedMenus[route.label] ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </>
                          )}
                        </button>

                        {!isCollapsed && expandedMenus[route.label] && (
                          <div className="ml-6 mt-1 space-y-1">
                            {route.submenu.map((subItem) => (
                              <RestrictedLink
                                key={subItem.href}
                                href={subItem.href}
                                permission={subItem.permission || ''}
                                onClick={() => setIsMobileOpen(false)}
                                isActive={pathname === subItem.href}
                                className="flex items-center p-2 text-sm rounded-md transition-colors"
                              >
                                <span>{subItem.label}</span>
                              </RestrictedLink>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      // Different navigation patterns for employees vs owners
                      isEmployee ? (
                        <div
                          onClick={() => {
                            setIsMobileOpen(false);
                            window.location.href = route.href;
                          }}
                          className={cn(
                            'flex items-center p-3 text-sm font-medium rounded-lg transition-colors cursor-pointer',
                            pathname === route.href
                              ? 'text-primary bg-primary/10'
                              : 'text-muted-foreground hover:text-primary hover:bg-primary/10',
                            isCollapsed && 'justify-center'
                          )}
                        >
                          <route.icon className={cn('h-5 w-5', isCollapsed ? 'mr-0' : 'mr-3')} />
                          {!isCollapsed && <span>{route.label}</span>}
                        </div>
                      ) : (
                        <RestrictedLink
                          href={route.href}
                          permission={route.permission || ''}
                          onClick={() => setIsMobileOpen(false)}
                          isActive={pathname === route.href}
                          className={cn(
                            'flex items-center p-3 text-sm font-medium rounded-lg transition-colors',
                            isCollapsed && 'justify-center'
                          )}
                        >
                          <route.icon className={cn('h-5 w-5', isCollapsed ? 'mr-0' : 'mr-3')} />
                          {!isCollapsed && <span>{route.label}</span>}
                        </RestrictedLink>
                      )
                    )}
                  </div>
                );
              })}

              {/* No Access Message - Only show when user has absolutely no permissions and is not an employee */}
              {!isEmployee && currentRoutes.every((route: RouteItem) => !can(route.permission || '')) && (
                <div className="p-4 text-center">
                  <AlertTriangle className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                  <p className="text-sm text-muted-foreground">You don't have access to any modules.</p>
                  <p className="text-xs text-muted-foreground mt-2">Please contact your administrator for assistance.</p>
                </div>
              )}

              {/* Employee Info Section */}
              {isEmployee && !isCollapsed && (
                <div className="mt-8 p-4 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">
                    Employee Portal
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Access your projects, tasks, and manage your work efficiently.
                  </div>
                </div>
              )}

              {/* Smart Module Info Section - Enhanced for better ERP experience */}
              {!isEmployee && !isCollapsed && company && (
                <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <div className="text-xs text-primary uppercase tracking-wide font-semibold mb-2">
                    Active Modules
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {company.industry && (
                      <p className="mb-1">
                        <span className="font-medium">Industry:</span> {company.industry.charAt(0).toUpperCase() + company.industry.slice(1)}
                      </p>
                    )}
                    {company.primaryGoal && (
                      <p className="mb-1">
                        <span className="font-medium">Focus:</span> {company.primaryGoal.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                    )}
                    <p className="text-xs mt-2 text-muted-foreground">
                      Showing {currentRoutes.length - 2} relevant modules
                    </p>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}