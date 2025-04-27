'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { usePermissionContext } from "@/contexts/permission-context";
import { PERMISSIONS } from "@/lib/permissions";

export default function TestRestrictedPage() {
  const { toast } = useToast();
  const { can } = usePermissionContext();

  const handleTestToast = () => {
    toast({
      title: "Test Toast",
      description: "This is a test toast notification",
    });
  };

  const handleRestrictedToast = () => {
    toast({
      title: "Access Restricted",
      description: "You don't have permission to access this section.",
      variant: "destructive",
    });
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Test Restricted Navigation</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Toast Notifications</CardTitle>
            <CardDescription>Test different toast notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleTestToast}>Show Regular Toast</Button>
            <Button variant="destructive" onClick={handleRestrictedToast}>
              Show Restricted Toast
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Permission Status</CardTitle>
            <CardDescription>Current permission status for different modules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Dashboard:</span>
                <span className={can(PERMISSIONS.VIEW_DASHBOARD) ? "text-green-500" : "text-red-500"}>
                  {can(PERMISSIONS.VIEW_DASHBOARD) ? "Allowed" : "Restricted"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Sales:</span>
                <span className={can(PERMISSIONS.VIEW_SALES) ? "text-green-500" : "text-red-500"}>
                  {can(PERMISSIONS.VIEW_SALES) ? "Allowed" : "Restricted"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Inventory:</span>
                <span className={can(PERMISSIONS.VIEW_INVENTORY) ? "text-green-500" : "text-red-500"}>
                  {can(PERMISSIONS.VIEW_INVENTORY) ? "Allowed" : "Restricted"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>HR:</span>
                <span className={can(PERMISSIONS.VIEW_EMPLOYEES) ? "text-green-500" : "text-red-500"}>
                  {can(PERMISSIONS.VIEW_EMPLOYEES) ? "Allowed" : "Restricted"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Projects:</span>
                <span className={can(PERMISSIONS.VIEW_PROJECTS) ? "text-green-500" : "text-red-500"}>
                  {can(PERMISSIONS.VIEW_PROJECTS) ? "Allowed" : "Restricted"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Finance:</span>
                <span className={can(PERMISSIONS.VIEW_FINANCE) ? "text-green-500" : "text-red-500"}>
                  {can(PERMISSIONS.VIEW_FINANCE) ? "Allowed" : "Restricted"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Analytics:</span>
                <span className={can(PERMISSIONS.VIEW_ANALYTICS) ? "text-green-500" : "text-red-500"}>
                  {can(PERMISSIONS.VIEW_ANALYTICS) ? "Allowed" : "Restricted"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8">
        <p className="text-muted-foreground">
          Try clicking on different sections in the sidebar. If you don't have permission to access a section, 
          you'll see a toast notification instead of navigating to that page.
        </p>
      </div>
    </div>
  );
}
