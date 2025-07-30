'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import {
  Calendar,
  Clock,
  DollarSign,
  Target,
  CheckCircle,
  AlertCircle,
  Building2,
  Mail,
  Lock,
  Eye,
  FileText,
  TrendingUp
} from 'lucide-react';

interface ProjectData {
  id: string;
  name: string;
  description?: string;
  status: string;
  progress: number;
  startDate: string;
  endDate: string;
  company: {
    name?: string;
    logo?: string;
  };
  budget?: {
    total: number;
    spent: number;
    remaining: number;
  };
  milestones: Array<{
    id: string;
    name: string;
    description?: string;
    status: string;
    targetDate: string;
    completionDate?: string;
    deliverables?: string;
  }>;
  recentTasks: Array<{
    id: string;
    name: string;
    status: string;
    progress: number;
    dueDate: string;
  }>;
  permissions: string[];
  lastUpdated: string;
}

interface ClientAccess {
  id: string;
  permissions: string[];
  lastAccessAt?: string;
  expiresAt?: string;
}

export default function ClientPortalPage() {
  const searchParams = useSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [clientAccess, setClientAccess] = useState<ClientAccess | null>(null);
  const [authForm, setAuthForm] = useState({
    accessToken: searchParams?.get('token') || '',
    clientEmail: searchParams?.get('email') || ''
  });
  const { toast } = useToast();

  useEffect(() => {
    // Auto-authenticate if token and email are in URL
    if (authForm.accessToken && authForm.clientEmail) {
      handleAuthentication();
    }
  }, []);

  const handleAuthentication = async () => {
    if (!authForm.accessToken || !authForm.clientEmail) {
      toast({
        title: 'Error',
        description: 'Please provide both access token and email address',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/projects/client-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'authenticate',
          accessToken: authForm.accessToken,
          clientEmail: authForm.clientEmail
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setProject(data.project);
      setClientAccess(data.clientAccess);
      setIsAuthenticated(true);
      
      toast({
        title: 'Success',
        description: 'Successfully authenticated to project portal',
      });
    } catch (error) {
      console.error('Authentication error:', error);
      toast({
        title: 'Authentication Failed',
        description: error instanceof Error ? error.message : 'Failed to authenticate',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'planning': return 'bg-yellow-500';
      case 'on_hold': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'planning': return <Target className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
              <Lock className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Client Portal Access</CardTitle>
            <CardDescription>
              Enter your access credentials to view project details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Access Token</label>
              <Input
                type="text"
                placeholder="Enter your access token"
                value={authForm.accessToken}
                onChange={(e) => setAuthForm(prev => ({ ...prev, accessToken: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <Input
                type="email"
                placeholder="Enter your email address"
                value={authForm.clientEmail}
                onChange={(e) => setAuthForm(prev => ({ ...prev, clientEmail: e.target.value }))}
              />
            </div>
            <Button 
              onClick={handleAuthentication} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Authenticating...' : 'Access Project'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              {project.company.logo ? (
                <img src={project.company.logo} alt="Company Logo" className="h-8 w-8 object-contain" />
              ) : (
                <Building2 className="h-8 w-8 text-gray-400" />
              )}
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{project.company.name || 'Project Portal'}</h1>
                <p className="text-sm text-gray-500">Client Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">{authForm.clientEmail}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Overview */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{project.name}</h2>
              {project.description && (
                <p className="text-gray-600 mt-2">{project.description}</p>
              )}
            </div>
            <Badge className={`${getStatusColor(project.status)} text-white`}>
              {project.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm text-gray-500">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-3" />
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Start Date</p>
                    <p className="font-semibold">{new Date(project.startDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">End Date</p>
                    <p className="font-semibold">{new Date(project.endDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {project.budget && (
              <>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="text-sm text-gray-600">Budget</p>
                        <p className="font-semibold">${project.budget.total.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="text-sm text-gray-600">Remaining</p>
                        <p className="font-semibold">${project.budget.remaining.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>

        {/* Detailed Information */}
        <Tabs defaultValue="milestones" className="space-y-4">
          <TabsList>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="tasks">Recent Tasks</TabsTrigger>
            {project.budget && <TabsTrigger value="budget">Budget</TabsTrigger>}
          </TabsList>

          <TabsContent value="milestones" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Project Milestones</CardTitle>
                <CardDescription>Key deliverables and project phases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {project.milestones.map((milestone) => (
                    <div key={milestone.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(milestone.status)}
                        <div>
                          <h4 className="font-medium">{milestone.name}</h4>
                          {milestone.description && (
                            <p className="text-sm text-gray-600">{milestone.description}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            Target: {new Date(milestone.targetDate).toLocaleDateString()}
                            {milestone.completionDate && (
                              <span> | Completed: {new Date(milestone.completionDate).toLocaleDateString()}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${getStatusColor(milestone.status)} text-white`}>
                        {milestone.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Task Updates</CardTitle>
                <CardDescription>Latest progress on project tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {project.recentTasks.map((task) => (
                    <div key={task.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{task.name}</h4>
                        <Badge className={`${getStatusColor(task.status)} text-white`}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 mr-4">
                          <Progress value={task.progress} className="h-2" />
                        </div>
                        <span className="text-sm text-gray-500">{task.progress}%</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {project.budget && (
            <TabsContent value="budget" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Budget Overview</CardTitle>
                  <CardDescription>Financial progress and spending</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">${project.budget.total.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Total Budget</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">${project.budget.spent.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Spent</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">${project.budget.remaining.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Remaining</p>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Budget Utilization</span>
                        <span className="text-sm text-gray-500">
                          {Math.round((project.budget.spent / project.budget.total) * 100)}%
                        </span>
                      </div>
                      <Progress 
                        value={(project.budget.spent / project.budget.total) * 100} 
                        className="h-3"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Last updated: {new Date(project.lastUpdated).toLocaleString()}</p>
          {clientAccess?.expiresAt && (
            <p>Access expires: {new Date(clientAccess.expiresAt).toLocaleDateString()}</p>
          )}
        </div>
      </div>
    </div>
  );
}
