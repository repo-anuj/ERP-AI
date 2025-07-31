'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, Search, Filter, Eye, Calendar, Clock, User, 
  CheckCircle, AlertTriangle, Users, Briefcase, MapPin
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { format, differenceInDays, isAfter, isBefore } from 'date-fns';

interface OnboardingInstance {
  id: string;
  status: string;
  startDate: string;
  expectedEndDate?: string;
  completedAt?: string;
  completionPercentage: number;
  hrAssignee?: string;
  managerAssignee?: string;
  buddyAssignee?: string;
  notes?: string;
  createdAt: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    department?: {
      name: string;
    };
    position?: string;
    joiningDate?: string;
  };
  workflow: {
    id: string;
    name: string;
    estimatedDays?: number;
  };
  taskInstances: {
    id: string;
    taskTitle: string;
    status: string;
    assigneeType: string;
    assigneeName?: string;
    dueDate?: string;
    completedAt?: string;
    requiresApproval: boolean;
    approvedAt?: string;
  }[];
  stats: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    pendingApprovals: number;
    completionPercentage: number;
  };
}

export default function OnboardingInstancesPage() {
  const [instances, setInstances] = useState<OnboardingInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [workflowFilter, setWorkflowFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  const fetchInstances = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
      });

      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (workflowFilter) params.append('workflowId', workflowFilter);

      const response = await fetch(`/api/hr/onboarding/instances?${params}`);
      if (!response.ok) throw new Error('Failed to fetch onboarding instances');

      const data = await response.json();
      setInstances(data.instances);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching instances:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch onboarding instances',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstances();
  }, [currentPage, searchTerm, statusFilter, workflowFilter]);

  const getStatusBadge = (status: string, expectedEndDate?: string) => {
    const now = new Date();
    const endDate = expectedEndDate ? new Date(expectedEndDate) : null;
    
    const statusConfig = {
      not_started: { color: 'bg-gray-100 text-gray-800', label: 'Not Started' },
      in_progress: { 
        color: endDate && isAfter(now, endDate) 
          ? 'bg-orange-100 text-orange-800' 
          : 'bg-blue-100 text-blue-800', 
        label: endDate && isAfter(now, endDate) ? 'Overdue' : 'In Progress' 
      },
      completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
      on_hold: { color: 'bg-yellow-100 text-yellow-800', label: 'On Hold' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.not_started;
    
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-blue-500';
    if (percentage >= 25) return 'bg-yellow-500';
    return 'bg-gray-300';
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getDaysRemaining = (expectedEndDate?: string) => {
    if (!expectedEndDate) return null;
    
    const now = new Date();
    const endDate = new Date(expectedEndDate);
    const days = differenceInDays(endDate, now);
    
    if (days < 0) return { days: Math.abs(days), status: 'overdue' };
    if (days === 0) return { days: 0, status: 'today' };
    return { days, status: 'remaining' };
  };

  const getUrgencyIndicator = (instance: OnboardingInstance) => {
    const daysInfo = getDaysRemaining(instance.expectedEndDate);
    
    if (!daysInfo) return null;
    
    if (daysInfo.status === 'overdue') {
      return <Badge variant="destructive" className="text-xs">{daysInfo.days} days overdue</Badge>;
    } else if (daysInfo.status === 'today') {
      return <Badge className="bg-orange-100 text-orange-800 text-xs">Due today</Badge>;
    } else if (daysInfo.days <= 3) {
      return <Badge className="bg-yellow-100 text-yellow-800 text-xs">{daysInfo.days} days left</Badge>;
    }
    
    return null;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Employee Onboarding</h1>
          <p className="text-gray-600">Track and manage employee onboarding progress</p>
        </div>
        <Link href="/hr/onboarding/instances/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Start Onboarding
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
                placeholder="Search employees..."
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
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={workflowFilter} onValueChange={setWorkflowFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Workflows" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Workflows</SelectItem>
                {/* This would be populated with actual workflows */}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setWorkflowFilter('');
              }}
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instances Grid */}
      {loading ? (
        <div className="text-center py-8">Loading onboarding instances...</div>
      ) : instances.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No onboarding instances found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {instances.map((instance) => (
            <Card key={instance.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {getInitials(instance.employee.firstName, instance.employee.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {instance.employee.firstName} {instance.employee.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{instance.employee.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getUrgencyIndicator(instance)}
                    <Link href={`/hr/onboarding/instances/${instance.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    {getStatusBadge(instance.status, instance.expectedEndDate)}
                    <span className="text-sm text-gray-600">
                      {instance.completionPercentage}% complete
                    </span>
                  </div>

                  <div className="w-full">
                    <Progress 
                      value={instance.completionPercentage} 
                      className="h-2"
                    />
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Briefcase className="w-4 h-4 mr-2" />
                    {instance.workflow.name}
                  </div>

                  {instance.employee.department && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      {instance.employee.department.name}
                      {instance.employee.position && ` - ${instance.employee.position}`}
                    </div>
                  )}

                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    Started: {format(new Date(instance.startDate), 'MMM dd, yyyy')}
                  </div>

                  {instance.expectedEndDate && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      Expected: {format(new Date(instance.expectedEndDate), 'MMM dd, yyyy')}
                    </div>
                  )}
                </div>

                {/* Task Statistics */}
                <div className="border-t pt-4 mb-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-green-600">
                        {instance.stats.completedTasks}
                      </div>
                      <div className="text-xs text-gray-500">Completed</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-blue-600">
                        {instance.stats.totalTasks - instance.stats.completedTasks}
                      </div>
                      <div className="text-xs text-gray-500">Remaining</div>
                    </div>
                  </div>

                  {(instance.stats.overdueTasks > 0 || instance.stats.pendingApprovals > 0) && (
                    <div className="mt-3 space-y-1">
                      {instance.stats.overdueTasks > 0 && (
                        <div className="flex items-center gap-2 text-sm text-red-600">
                          <AlertTriangle className="w-4 h-4" />
                          {instance.stats.overdueTasks} overdue tasks
                        </div>
                      )}
                      {instance.stats.pendingApprovals > 0 && (
                        <div className="flex items-center gap-2 text-sm text-yellow-600">
                          <Clock className="w-4 h-4" />
                          {instance.stats.pendingApprovals} pending approvals
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Assignees */}
                <div className="border-t pt-4">
                  <h5 className="text-sm font-medium mb-2">Assignees:</h5>
                  <div className="space-y-1 text-sm text-gray-600">
                    {instance.hrAssignee && (
                      <div>HR: {instance.hrAssignee}</div>
                    )}
                    {instance.managerAssignee && (
                      <div>Manager: {instance.managerAssignee}</div>
                    )}
                    {instance.buddyAssignee && (
                      <div>Buddy: {instance.buddyAssignee}</div>
                    )}
                  </div>
                </div>

                <div className="mt-4 text-xs text-gray-500">
                  Created {format(new Date(instance.createdAt), 'MMM dd, yyyy')}
                  {instance.completedAt && (
                    <span> • Completed {format(new Date(instance.completedAt), 'MMM dd, yyyy')}</span>
                  )}
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
