'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FolderGit2, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

// Placeholder data - will be replaced with MongoDB data
const projects = [
  {
    id: '1',
    name: 'Website Redesign',
    status: 'In Progress',
    progress: 65,
    deadline: '2024-04-15',
    team: ['John Doe', 'Sarah Smith', 'Mike Johnson'],
    priority: 'High',
  },
  {
    id: '2',
    name: 'Mobile App Development',
    status: 'Planning',
    progress: 25,
    deadline: '2024-05-30',
    team: ['Emily Brown', 'David Wilson'],
    priority: 'Medium',
  },
  {
    id: '3',
    name: 'Data Migration',
    status: 'Completed',
    progress: 100,
    deadline: '2024-03-10',
    team: ['Alex Turner', 'Lisa Anderson'],
    priority: 'Low',
  },
];

export default function ProjectsPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderGit2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="text-center space-y-3">
              <Plus className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No projects yet</p>
              <Button variant="outline" size="sm" className="mt-2">
                Add First Project
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="text-center space-y-3">
              <Plus className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No active projects</p>
              <Button variant="outline" size="sm" className="mt-2">
                Start Project
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="text-center space-y-3">
              <Plus className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No completed projects</p>
              <Button variant="outline" size="sm" className="mt-2">
                View Projects
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="text-center space-y-3">
              <Plus className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No overdue projects</p>
              <Button variant="outline" size="sm" className="mt-2">
                View Timeline
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Overview</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <div className="text-center space-y-3">
            <Plus className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-medium">No Projects Available</h3>
            <p className="text-sm text-muted-foreground">
              Start creating projects to track your team's progress and milestones.
            </p>
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Project
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}