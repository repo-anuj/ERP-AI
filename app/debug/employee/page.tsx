'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePermissions } from '@/hooks/use-permissions';

export default function EmployeeDebugPage() {
  const [authData, setAuthData] = useState<any>(null);
  const [cookieData, setCookieData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { permissions, userRole, userDepartment, isEmployee, loading: permLoading } = usePermissions();

  useEffect(() => {
    fetchDebugData();
  }, []);

  const fetchDebugData = async () => {
    try {
      setLoading(true);

      // Check authentication status
      const authResponse = await fetch('/api/auth/employee-profile');
      const authResult = await authResponse.json();
      setAuthData(authResult);

      // Check permissions
      const permResponse = await fetch('/api/auth/permissions');
      const permResult = await permResponse.json();
      
      // Get cookies from document
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as any);

      setCookieData({
        permissions: permResult,
        cookies
      });

    } catch (error) {
      console.error('Debug fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testEmployeeRoutes = async () => {
    const routes = [
      '/api/employee/dashboard',
      '/api/employee/projects',
      '/api/employee/tasks',
      '/api/employee/attendance'
    ];

    for (const route of routes) {
      try {
        const response = await fetch(route);
        console.log(`${route}: ${response.status} - ${response.ok ? 'OK' : 'FAILED'}`);
      } catch (error) {
        console.error(`${route}: ERROR -`, error);
      }
    }
  };

  if (loading || permLoading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Employee Debug Page</h2>
          <p className="text-muted-foreground">
            Debug information for employee authentication and permissions
          </p>
        </div>
        <Button onClick={testEmployeeRoutes}>
          Test API Routes
        </Button>
      </div>

      {/* Authentication Status */}
      <Card>
        <CardHeader>
          <CardTitle>Authentication Status</CardTitle>
          <CardDescription>Current authentication state</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Is Employee</label>
              <div className="flex items-center space-x-2">
                <Badge variant={isEmployee ? 'default' : 'destructive'}>
                  {isEmployee ? 'YES' : 'NO'}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">User Role</label>
              <p>{userRole || 'Not set'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Department</label>
              <p>{userDepartment || 'Not set'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Auth Status</label>
              <Badge variant={authData ? 'default' : 'destructive'}>
                {authData ? 'Authenticated' : 'Not Authenticated'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
          <CardDescription>Current user permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Permissions ({permissions.length})
            </label>
            <div className="flex flex-wrap gap-2">
              {permissions.length > 0 ? (
                permissions.map((permission, index) => (
                  <Badge key={index} variant="outline">
                    {permission}
                  </Badge>
                ))
              ) : (
                <p className="text-muted-foreground">No permissions found</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cookies */}
      <Card>
        <CardHeader>
          <CardTitle>Cookies</CardTitle>
          <CardDescription>Current browser cookies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cookieData?.cookies && Object.keys(cookieData.cookies).length > 0 ? (
              Object.entries(cookieData.cookies).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-medium">{key}</span>
                  <span className="text-sm text-muted-foreground truncate max-w-xs">
                    {String(value)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No cookies found</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Raw Data */}
      <Card>
        <CardHeader>
          <CardTitle>Raw Debug Data</CardTitle>
          <CardDescription>Raw API responses for debugging</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Auth Data</label>
              <pre className="mt-2 p-4 bg-muted rounded text-xs overflow-auto">
                {JSON.stringify(authData, null, 2)}
              </pre>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Permission Data</label>
              <pre className="mt-2 p-4 bg-muted rounded text-xs overflow-auto">
                {JSON.stringify(cookieData?.permissions, null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Test employee functionality</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/employee/dashboard'}
            >
              Go to Employee Dashboard
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/employee/projects'}
            >
              Go to Employee Projects
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/employee/settings'}
            >
              Go to Employee Settings
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/auth/signin'}
            >
              Go to Sign In
            </Button>
            <Button 
              variant="destructive" 
              onClick={async () => {
                await fetch('/api/auth/signout', { method: 'POST' });
                window.location.href = '/auth/signin';
              }}
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
