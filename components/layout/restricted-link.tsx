'use client';

import { useToast } from "@/hooks/use-toast";
import { usePermissionContext } from "@/contexts/permission-context";
import { cn } from "@/lib/utils";

interface RestrictedLinkProps {
  href: string;
  permission: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  isActive?: boolean;
}

export function RestrictedLink({
  href,
  permission,
  children,
  className,
  onClick,
  isActive
}: RestrictedLinkProps) {
  const { can, isEmployee } = usePermissionContext();
  const { toast } = useToast();

  const handleClick = (e: React.MouseEvent) => {
    // Enhanced permission logic for enterprise ERP

    // For owners/admins (non-employees), provide full access to all modules
    if (!isEmployee) {
      // Call the onClick handler
      if (onClick) onClick();
      // Navigate using window.location.href for consistent behavior
      window.location.href = href;
      return;
    }

    // For employees, check permissions strictly
    if (isEmployee && !can(permission)) {
      e.preventDefault();
      const sectionName = href.split('/').pop() || 'dashboard';
      toast({
        title: "Access Restricted",
        description: `You don't have permission to access the ${sectionName} section. Please contact your administrator for access.`,
        variant: "destructive",
      });
      return;
    }

    // Permission granted - proceed with navigation
    if (onClick) onClick();
    window.location.href = href;
  };

  // Always render as a clickable div (same pattern as working employee click)
  return (
    <div
      onClick={handleClick}
      className={cn(
        className,
        isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-primary/10",
        "cursor-pointer transition-colors"
      )}
    >
      {children}
    </div>
  );
}
