'use client';

import { cn } from '@/lib/utils';
import {
  BarChart3,
  Box,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  LayoutDashboard,
  Menu,
  Settings,
  Users,
  X,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { RestrictedLink } from './restricted-link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { usePermissionContext } from '@/contexts/permission-context';
import { PERMISSIONS } from '@/lib/permissions';

interface RouteItem {
  label: string;
  icon?: any;
  href: string;
  submenu?: { label: string; href: string; permission?: string }[];
  permission?: string;
}

const routes: RouteItem[] = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/',
    permission: PERMISSIONS.VIEW_DASHBOARD,
  },
  {
    label: 'Inventory',
    icon: Box,
    href: '/inventory',
    permission: PERMISSIONS.VIEW_INVENTORY,
  },
  {
    label: 'Sales',
    icon: CircleDollarSign,
    href: '/sales',
    permission: PERMISSIONS.VIEW_SALES,
  },
  {
    label: 'HR',
    icon: Users,
    href: '/hr',
    permission: PERMISSIONS.VIEW_EMPLOYEES,
  },
  {
    label: 'Projects',
    icon: ClipboardList,
    href: '/projects',
    permission: PERMISSIONS.VIEW_PROJECTS,
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
    ],
  },
  {
    label: 'Finance',
    icon: DollarSign,
    href: '/dashboard/finance',
    permission: PERMISSIONS.VIEW_FINANCE,
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
    icon: BarChart3,
    href: '/analytics',
    permission: PERMISSIONS.VIEW_ANALYTICS,
  },
  {
    label: 'Settings',
    icon: Settings,
    href: '/settings',
    permission: PERMISSIONS.VIEW_SETTINGS,
  },

];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const { can, loading } = usePermissionContext();

  // Expand the menu of the active route on initial load
  useEffect(() => {
    const expandedState: Record<string, boolean> = {};

    routes.forEach(route => {
      if (route.submenu) {
        const isActive = route.submenu.some(item => pathname === item.href);
        if (isActive) {
          expandedState[route.label] = true;
        }
      }
    });

    setExpandedMenus(expandedState);
  }, [pathname]);

  const toggleSubmenu = (label: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

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
          {!isCollapsed && <h1 className="text-2xl font-bold">ERP</h1>}
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
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-1">
              {routes.map((route) => {
                // Show all routes but restrict access with toast notifications
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
                    )}
                  </div>
                );
              })}

              {/* No Access Message - Only show when user has absolutely no permissions */}
              {routes.every(route => !can(route.permission || '')) && (
                <div className="p-4 text-center">
                  <AlertTriangle className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                  <p className="text-sm text-muted-foreground">You don't have access to any modules.</p>
                  <p className="text-xs text-muted-foreground mt-2">Please contact your administrator for assistance.</p>
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