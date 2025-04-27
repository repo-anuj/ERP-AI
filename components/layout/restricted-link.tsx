'use client';

import { useToast } from "@/hooks/use-toast";
import { usePermissionContext } from "@/contexts/permission-context";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) onClick();

    // If user is not an employee (i.e., a regular user/owner), they have unrestricted access
    // Otherwise, check if the employee has the required permission
    if (isEmployee && !can(permission)) {
      e.preventDefault();
      toast({
        title: "Access Restricted",
        description: `You don't have permission to access the ${href.split('/').pop() || 'dashboard'} section.`,
        variant: "destructive",
      });
      return;
    }

    router.push(href);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        className,
        isActive ? "text-primary bg-primary/10" : "text-muted-foreground",
        // Only apply restricted styling for employees without permission
        isEmployee && !can(permission)
          ? "hover:text-destructive hover:bg-destructive/10"
          : "hover:text-primary hover:bg-primary/10",
        "cursor-pointer"
      )}
    >
      {children}
    </div>
  );
}
