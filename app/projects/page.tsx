'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderGit2, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { DataTable } from '@/components/projects/data-table';
import { columns, Project } from '@/components/projects/columns';
import { EmptyState } from '@/components/projects/empty-state';
import { AddProjectDialog } from '@/components/projects/add-project-dialog';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0
  });
  const { toast } = useToast();
  const router = useRouter();

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      setProjects(data);
      
      // Calculate stats
      const now = new Date();
      const statsData = {
        total: data.length,
        inProgress: data.filter((p: Project) => p.status === 'in_progress').length,
        completed: data.filter((p: Project) => p.status === 'completed').length,
        overdue: data.filter((p: Project) => 
          new Date(p.endDate) < now && 
          p.status !== 'completed' && 
          p.status !== 'cancelled'
        ).length
      };
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: 'Error',
        description: 'Failed to load projects. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filterableColumns = [
    {
      id: 'status',
      title: 'Status',
      options: [
        { label: 'Planning', value: 'planning' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'On Hold', value: 'on_hold' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
    {
      id: 'priority',
      title: 'Priority',
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
      ],
    },
    {
      id: 'type',
      title: 'Type',
      options: [
        { label: 'Development', value: 'development' },
        { label: 'Design', value: 'design' },
        { label: 'Marketing', value: 'marketing' },
        { label: 'Research', value: 'research' },
        { label: 'Consulting', value: 'consulting' },
      ],
    },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Projects</h2>
        <AddProjectDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderGit2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="text-2xl font-bold">{stats.total}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="text-2xl font-bold">{stats.inProgress}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="text-2xl font-bold">{stats.completed}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="text-2xl font-bold text-red-500">{stats.overdue}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border bg-card">
        {isLoading ? (
          <div className="flex justify-center items-center h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading projects...</span>
          </div>
        ) : projects.length === 0 ? (
          <EmptyState />
        ) : (
          <DataTable 
            columns={columns} 
            data={projects} 
            onRefresh={fetchProjects}
            filterableColumns={filterableColumns}
          />
        )}
      </div>
    </div>
  );
}
