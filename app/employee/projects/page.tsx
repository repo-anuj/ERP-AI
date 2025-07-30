'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { 
  Search,
  Calendar,
  Clock,
  Target,
  Users,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  FileText,
  Filter
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  startDate: string;
  endDate: string;
  progress: number;
  role: string;
  tasksTotal: number;
  tasksCompleted: number;
  tasksPending: number;
  tasksOverdue: number;
  projectManager: {
    employeeId: string;
    name: string;
    role?: string;
    department?: string;
  };
  myTasks?: Array<{
    id: string;
    name: string;
    status: string;
    priority: string;
    dueDate: string;
    completionPercentage: number;
  }>;
  tasksAwaitingApproval?: number;
  tasksUrgent?: number;
}

export default function EmployeeProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, searchTerm, statusFilter, priorityFilter]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/employee/projects');
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: 'Error',
        description: 'Failed to load projects',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = projects;

    if (searchTerm) {
      filtered = filtered.filter(project => 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(project => project.priority === priorityFilter);
    }

    setFilteredProjects(filtered);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'on_hold': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'on_hold': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'cancelled': return <Target className="h-4 w-4 text-red-500" />;
      default: return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Projects</h2>
          <p className="text-muted-foreground">
            View and manage your assigned projects
          </p>
        </div>
        <Button onClick={fetchProjects} variant="outline">
          <Target className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(project.status)}
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                  </div>
                  <Badge className={`${getPriorityColor(project.priority)} text-white text-xs`}>
                    {project.priority}
                  </Badge>
                </div>
                <CardDescription>
                  Role: {project.role} • Manager: {project.projectManager?.name || 'Not assigned'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>

                {/* My Tasks Preview */}
                {project.myTasks && project.myTasks.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">My Tasks</span>
                      <span className="text-xs text-muted-foreground">
                        {project.tasksTotal} total
                      </span>
                    </div>

                    <div className="space-y-2">
                      {project.myTasks.slice(0, 3).map((task: any) => (
                        <div key={task.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              task.status === 'completed' ? 'bg-green-500' :
                              task.status === 'in_progress' ? 'bg-blue-500' :
                              task.status === 'awaiting_approval' ? 'bg-yellow-500' :
                              'bg-gray-500'
                            }`} />
                            <span className="truncate font-medium">{task.name}</span>
                            {task.isOverdue && (
                              <Badge variant="destructive" className="text-xs px-1 py-0">
                                Overdue
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <span className="text-muted-foreground">{task.completionPercentage}%</span>
                            <Badge variant="outline" className={`text-xs ${
                              task.priority === 'urgent' ? 'border-red-500 text-red-600' :
                              task.priority === 'high' ? 'border-orange-500 text-orange-600' :
                              task.priority === 'medium' ? 'border-yellow-500 text-yellow-600' :
                              'border-green-500 text-green-600'
                            }`}>
                              {task.priority}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {project.myTasks.length > 3 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{project.myTasks.length - 3} more tasks
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Task Statistics */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center p-2 bg-green-50 border border-green-200 rounded">
                    <div className="font-medium text-green-700">{project.tasksCompleted}</div>
                    <div className="text-green-600">Done</div>
                  </div>
                  <div className="text-center p-2 bg-blue-50 border border-blue-200 rounded">
                    <div className="font-medium text-blue-700">{project.tasksPending}</div>
                    <div className="text-blue-600">Active</div>
                  </div>
                  <div className="text-center p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="font-medium text-yellow-700">{project.tasksAwaitingApproval || 0}</div>
                    <div className="text-yellow-600">Pending</div>
                  </div>
                </div>

                {/* Alerts for overdue/urgent tasks */}
                {((project.tasksOverdue || 0) > 0 || (project.tasksUrgent || 0) > 0) && (
                  <div className="space-y-1">
                    {(project.tasksOverdue || 0) > 0 && (
                      <div className="flex items-center space-x-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                        <AlertTriangle className="h-3 w-3" />
                        <span>{project.tasksOverdue || 0} overdue task{(project.tasksOverdue || 0) > 1 ? 's' : ''}</span>
                      </div>
                    )}
                    {(project.tasksUrgent || 0) > 0 && (
                      <div className="flex items-center space-x-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                        <Clock className="h-3 w-3" />
                        <span>{project.tasksUrgent || 0} urgent task{(project.tasksUrgent || 0) > 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Project Due Date */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>Due: {new Date(project.endDate).toLocaleDateString()}</span>
                  </div>
                  <Badge variant="outline" className={`${getStatusColor(project.status)} text-white text-xs`}>
                    {project.status.replace('_', ' ')}
                  </Badge>
                </div>
                
                <div className="flex gap-2">
                  <Link href={`/employee/projects/${project.id}`} className="flex-1">
                    <Button size="sm" className="w-full">
                      <FileText className="h-3 w-3 mr-1" />
                      View Details
                    </Button>
                  </Link>
                  <Link href={`/employee/projects/${project.id}#chat`}>
                    <Button size="sm" variant="outline">
                      <MessageSquare className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Projects Found</h3>
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'No projects match your current filters.'
              : 'You are not assigned to any projects yet.'}
          </p>
          {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all') && (
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setPriorityFilter('all');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
