'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus, Search, Filter, Eye, Edit, Copy, Settings, Users,
  CheckCircle, Clock, Calendar, Star, BarChart, Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { format } from 'date-fns';

interface OnboardingWorkflow {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  department?: string;
  position?: string;
  estimatedDays?: number;
  createdAt: string;
  tasks: {
    id: string;
    title: string;
    category: string;
    priority: string;
    estimatedHours?: number;
    requiresApproval: boolean;
    requiresDocument: boolean;
    isAutomated: boolean;
  }[];
  instances: {
    id: string;
    status: string;
    completionPercentage: number;
    employee: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }[];
  stats: {
    totalTasks: number;
    totalInstances: number;
    activeInstances: number;
    completedInstances: number;
    averageCompletion: number;
  };
}

export default function OnboardingWorkflowsPage() {
  const [workflows, setWorkflows] = useState<OnboardingWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
      });

      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('isActive', statusFilter);
      if (departmentFilter) params.append('department', departmentFilter);

      const response = await fetch(`/api/hr/onboarding/workflows?${params}`);
      if (!response.ok) throw new Error('Failed to fetch workflows');

      const data = await response.json();
      setWorkflows(data.workflows);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching workflows:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch onboarding workflows',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, [currentPage, searchTerm, statusFilter, departmentFilter]);

  const handleToggleActive = async (workflowId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/hr/onboarding/workflows/${workflowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!response.ok) throw new Error('Failed to update workflow');

      toast({
        title: 'Success',
        description: `Workflow ${!isActive ? 'activated' : 'deactivated'} successfully`,
      });

      fetchWorkflows();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDuplicate = async (workflowId: string) => {
    try {
      // First get the workflow details
      const response = await fetch(`/api/hr/onboarding/workflows/${workflowId}`);
      if (!response.ok) throw new Error('Failed to fetch workflow');
      
      const { workflow } = await response.json();
      
      // Create a duplicate with modified name
      const duplicateData = {
        ...workflow,
        name: `${workflow.name} (Copy)`,
        isDefault: false,
        tasks: workflow.tasks.map((task: any) => ({
          title: task.title,
          description: task.description,
          instructions: task.instructions,
          category: task.category,
          priority: task.priority,
          estimatedHours: task.estimatedHours,
          orderIndex: task.orderIndex,
          dependencies: task.dependencies,
          assigneeType: task.assigneeType,
          assigneeRole: task.assigneeRole,
          requiresApproval: task.requiresApproval,
          requiresDocument: task.requiresDocument,
          documentTypes: task.documentTypes,
          isAutomated: task.isAutomated,
          automationConfig: task.automationConfig,
        }))
      };

      const createResponse = await fetch('/api/hr/onboarding/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicateData),
      });

      if (!createResponse.ok) throw new Error('Failed to duplicate workflow');

      toast({
        title: 'Success',
        description: 'Workflow duplicated successfully',
      });

      fetchWorkflows();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (workflowId: string) => {
    if (!confirm('Are you sure you want to delete this workflow? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/hr/onboarding/workflows/${workflowId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete workflow');
      }

      toast({
        title: 'Success',
        description: 'Workflow deleted successfully',
      });

      fetchWorkflows();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (isActive: boolean, isDefault: boolean) => {
    if (isDefault) {
      return <Badge className="bg-blue-100 text-blue-800">Default</Badge>;
    } else if (isActive) {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    } else {
      return <Badge variant="secondary">Inactive</Badge>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'documentation': return '📄';
      case 'training': return '🎓';
      case 'equipment': return '💻';
      case 'access': return '🔑';
      case 'introduction': return '👋';
      case 'compliance': return '✅';
      default: return '📋';
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Onboarding Workflows</h1>
          <p className="text-gray-600">Create and manage structured onboarding processes</p>
        </div>
        <Link href="/hr/onboarding/workflows/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Workflow
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search workflows..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Engineering">Engineering</SelectItem>
                <SelectItem value="Sales">Sales</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="HR">HR</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDepartmentFilter('all');
              }}
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Workflows Grid */}
      {loading ? (
        <div className="text-center py-8">Loading workflows...</div>
      ) : workflows.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No workflows found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {workflows.map((workflow) => (
            <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{workflow.name}</h3>
                      {getStatusBadge(workflow.isActive, workflow.isDefault)}
                    </div>
                    {workflow.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {workflow.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Link href={`/hr/onboarding/workflows/${workflow.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicate(workflow.id)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  {workflow.department && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      {workflow.department}
                      {workflow.position && ` - ${workflow.position}`}
                    </div>
                  )}

                  {workflow.estimatedDays && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      {workflow.estimatedDays} days estimated
                    </div>
                  )}

                  <div className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {workflow.stats.totalTasks} tasks
                  </div>
                </div>

                {/* Task Categories Preview */}
                <div className="mb-4">
                  <h5 className="text-sm font-medium mb-2">Task Categories:</h5>
                  <div className="flex flex-wrap gap-1">
                    {Array.from(new Set(workflow.tasks.map(t => t.category))).slice(0, 4).map((category) => (
                      <span
                        key={category}
                        className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                      >
                        <span>{getCategoryIcon(category)}</span>
                        {category}
                      </span>
                    ))}
                    {Array.from(new Set(workflow.tasks.map(t => t.category))).length > 4 && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                        +{Array.from(new Set(workflow.tasks.map(t => t.category))).length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Statistics */}
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-blue-600">
                        {workflow.stats.activeInstances}
                      </div>
                      <div className="text-xs text-gray-500">Active</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-green-600">
                        {workflow.stats.completedInstances}
                      </div>
                      <div className="text-xs text-gray-500">Completed</div>
                    </div>
                  </div>

                  {workflow.stats.totalInstances > 0 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Average Completion</span>
                        <span>{Math.round(workflow.stats.averageCompletion)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${workflow.stats.averageCompletion}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex gap-2">
                    <Link href={`/hr/onboarding/workflows/${workflow.id}/edit`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(workflow.id, workflow.isActive)}
                      className="flex-1"
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      {workflow.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(workflow.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 text-xs text-gray-500">
                  Created {format(new Date(workflow.createdAt), 'MMM dd, yyyy')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
