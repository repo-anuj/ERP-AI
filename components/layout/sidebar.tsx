'use client';

import { cn } from '@/lib/utils';
import {
  BarChart3,
  Box,
  Building2,
  CircleDollarSign,
  ClipboardList,
  LayoutDashboard,
  Menu,
  Settings,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const routes = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/',
  },
  {
    label: 'Inventory',
    icon: Box,
    href: '/inventory',
  },
  {
    label: 'Sales',
    icon: CircleDollarSign,
    href: '/sales',
  },
  {
    label: 'HR',
    icon: Users,
    href: '/hr',
  },
  {
    label: 'Projects',
    icon: ClipboardList,
    href: '/projects',
  },
  {
    label: 'Finance',
    icon: Building2,
    href: '/finance',
  },
  {
    label: 'Analytics',
    icon: BarChart3,
    href: '/analytics',
  },
  {
    label: 'Settings',
    icon: Settings,
    href: '/settings',
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? [] : <Menu className="h-5 w-5" />}
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
          <div className="space-y-1">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  'flex items-center p-3 text-sm font-medium rounded-lg transition-colors hover:text-primary hover:bg-primary/10',
                  pathname === route.href ? 'text-primary bg-primary/10' : 'text-muted-foreground',
                  isCollapsed && 'justify-center'
                )}
              >
                <route.icon className={cn('h-5 w-5', !isCollapsed && 'mr-3')} />
                {!isCollapsed && route.label}
              </Link>
            ))}
          </div>
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