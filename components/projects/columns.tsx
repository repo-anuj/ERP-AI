'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertCircle,
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Edit,
  Eye,
  FileText,
  MoreHorizontal,
  PauseCircle,
  PlayCircle,
  Trash2,
  Users,
  XCircle
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export type ProjectMember = {
  employeeId: string;
  name: string;
  role?: string;
  department?: string;
};

export type ProjectClient = {
  customerId?: string;
  name: string;
  company?: string;
  email?: string;
};

export type Task = {
  id: string;
  name: string;
  description?: string;
  status: string;
  priority: string;
  assigneeId: string;
  assigneeName: string;
  startDate: string | Date;
  dueDate: string | Date;
  estimatedHours: number;
  actualHours: number;
  completionPercentage: number;
  dependencies: string[];
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type Milestone = {
  id: string;
  name: string;
  description?: string;
  targetDate: string | Date;
  completionDate?: string | Date;
  status: string;
  deliverables?: string;
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type Project = {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  startDate: string | Date;
  endDate: string | Date;
  completionPercentage: number;
  projectManager: ProjectMember;
  teamMembers: ProjectMember[];
  client?: ProjectClient;
  budget: number;
  expenses: number;
  priority: string;
  tags: string[];
  notes?: string;
  tasks: Task[];
  milestones: Milestone[];
  createdAt: string | Date;
  updatedAt: string | Date;
};

// Component for the project details dialog
const ProjectDetailsDialog = ({ project, isOpen, onClose }: {
  project: Project;
  isOpen: boolean;
  onClose: () => void
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            {project.name}
            <Badge
              variant={
                project.status === 'completed'
                  ? 'default'
                  : project.status === 'in_progress'
                  ? 'secondary'
                  : project.status === 'on_hold'
                  ? 'outline'
                  : project.status === 'cancelled'
                  ? 'destructive'
                  : 'default'
              }
              className="ml-2"
            >
              {project.status.replace('_', ' ')}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {project.type.charAt(0).toUpperCase() + project.type.slice(1)} Project
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks ({project.tasks.length})</TabsTrigger>
            <TabsTrigger value="milestones">Milestones ({project.milestones.length})</TabsTrigger>
            <TabsTrigger value="team">Team ({project.teamMembers.length + 1})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                <p>{formatDate(project.startDate)}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">End Date</p>
                <p>{formatDate(project.endDate)}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Budget</p>
                <p>{formatCurrency(project.budget)}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Expenses</p>
                <p>{formatCurrency(project.expenses)}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Priority</p>
                <p>
                  <Badge
                    variant={
                      project.priority === 'high'
                        ? 'destructive'
                        : project.priority === 'medium'
                        ? 'secondary'
                        : 'outline'
                    }
                  >
                    {project.priority}
                  </Badge>
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Completion</p>
                <div className="flex items-center gap-2">
                  <Progress value={project.completionPercentage} className="h-2" />
                  <span className="text-sm">{project.completionPercentage}%</span>
                </div>
              </div>
            </div>

            {project.client && (
              <div className="pt-2">
                <p className="text-sm font-medium text-muted-foreground mb-2">Client</p>
                <div className="flex items-center gap-2 p-3 border rounded-md">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{project.client.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {project.client.company && `${project.client.company} • `}
                      {project.client.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2">
              <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
              <div className="p-3 border rounded-md">
                <p className="text-sm whitespace-pre-line">{project.description || 'No description available'}</p>
              </div>
            </div>

            {project.notes && (
              <div className="pt-2">
                <p className="text-sm font-medium text-muted-foreground mb-2">Notes</p>
                <div className="p-3 border rounded-md">
                  <p className="text-sm whitespace-pre-line">{project.notes}</p>
                </div>
              </div>
            )}

            {project.tags.length > 0 && (
              <div className="pt-2">
                <p className="text-sm font-medium text-muted-foreground mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            {project.tasks.length > 0 ? (
              <div className="space-y-3">
                {project.tasks.map((task) => (
                  <Card key={task.id}>
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base font-medium flex items-center">
                            {task.name}
                            <Badge
                              variant={
                                task.status === 'completed'
                                  ? 'default'
                                  : task.status === 'in_progress'
                                  ? 'secondary'
                                  : task.status === 'blocked'
                                  ? 'destructive'
                                  : 'outline'
                              }
                              className="ml-2"
                            >
                              {task.status.replace('_', ' ')}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="mt-1">
                            Assigned to: {task.assigneeName}
                          </CardDescription>
                        </div>
                        <Badge
                          variant={
                            task.priority === 'urgent'
                              ? 'destructive'
                              : task.priority === 'high'
                              ? 'secondary'
                              : task.priority === 'medium'
                              ? 'outline'
                              : 'outline'
                          }
                        >
                          {task.priority}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Due:</span>
                          <span>{formatDate(task.dueDate)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Hours:</span>
                          <span>{task.actualHours} / {task.estimatedHours}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Progress value={task.completionPercentage} className="h-2" />
                        <span className="text-xs">{task.completionPercentage}%</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                No tasks have been added to this project yet.
              </div>
            )}
          </TabsContent>

          <TabsContent value="milestones" className="space-y-4">
            {project.milestones.length > 0 ? (
              <div className="space-y-3">
                {project.milestones.map((milestone) => (
                  <Card key={milestone.id}>
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base font-medium flex items-center">
                          {milestone.name}
                          <Badge
                            variant={
                              milestone.status === 'completed'
                                ? 'default'
                                : milestone.status === 'missed'
                                ? 'destructive'
                                : 'outline'
                            }
                            className="ml-2"
                          >
                            {milestone.status}
                          </Badge>
                        </CardTitle>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span>{formatDate(milestone.targetDate)}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      {milestone.description && (
                        <p className="text-sm text-muted-foreground mb-2">{milestone.description}</p>
                      )}
                      {milestone.deliverables && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-muted-foreground">Deliverables:</p>
                          <p className="text-sm">{milestone.deliverables}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                No milestones have been added to this project yet.
              </div>
            )}
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <div className="space-y-3">
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base font-medium">Project Manager</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{project.projectManager.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{project.projectManager.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {project.projectManager.role && `${project.projectManager.role} • `}
                        {project.projectManager.department}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {project.teamMembers.length > 0 ? (
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base font-medium">Team Members</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-3">
                      {project.teamMembers.map((member, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {member.role && `${member.role} • `}
                              {member.department}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center p-4 text-muted-foreground">
                  No additional team members assigned to this project.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Component for the delete confirmation dialog
const DeleteConfirmationDialog = ({
  project,
  isOpen,
  onClose,
  onDelete
}: {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the project "{project.name}" and all associated tasks and milestones.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// Cell component for the name column with tooltip
const NameCell = ({ row }: { row: any }) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const project = row.original;

  return (
    <>
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="link"
                className="p-0 h-auto font-medium"
                onClick={() => setIsDetailsOpen(true)}
              >
                {project.name}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Click to view details</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <ProjectDetailsDialog
        project={project}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />
    </>
  );
};

// Status cell component with appropriate icons
const StatusCell = ({ row }: { row: any }) => {
  const status = row.getValue('status') as string;

  let icon = null;
  let variant: 'default' | 'destructive' | 'outline' | 'secondary' = 'default';

  switch (status) {
    case 'planning':
      icon = <Clock className="h-3 w-3 mr-1" />;
      variant = 'outline';
      break;
    case 'in_progress':
      icon = <PlayCircle className="h-3 w-3 mr-1" />;
      variant = 'secondary';
      break;
    case 'on_hold':
      icon = <PauseCircle className="h-3 w-3 mr-1" />;
      variant = 'outline';
      break;
    case 'completed':
      icon = <CheckCircle2 className="h-3 w-3 mr-1" />;
      variant = 'default';
      break;
    case 'cancelled':
      icon = <XCircle className="h-3 w-3 mr-1" />;
      variant = 'destructive';
      break;
    default:
      variant = 'outline';
  }

  return (
    <Badge variant={variant} className="flex items-center">
      {icon}
      {status.replace('_', ' ')}
    </Badge>
  );
};

// Priority cell component
const PriorityCell = ({ row }: { row: any }) => {
  const priority = row.getValue('priority') as string;

  let variant: 'default' | 'destructive' | 'outline' | 'secondary' = 'outline';

  switch (priority) {
    case 'high':
      variant = 'destructive';
      break;
    case 'medium':
      variant = 'secondary';
      break;
    case 'low':
      variant = 'outline';
      break;
    default:
      variant = 'outline';
  }

  return (
    <Badge variant={variant}>
      {priority}
    </Badge>
  );
};

// Progress cell component
const ProgressCell = ({ row }: { row: any }) => {
  const completion = parseInt(row.getValue('completionPercentage'));

  return (
    <div className="flex items-center gap-2">
      <Progress value={completion} className="h-2 w-[60px]" />
      <span className="text-xs">{completion}%</span>
    </div>
  );
};

export const columns: ColumnDef<Project>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 font-medium"
        >
          Project
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: NameCell,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 font-medium"
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: StatusCell,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'type',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 font-medium"
        >
          Type
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const type = row.getValue('type') as string;
      return (
        <div className="capitalize">{type}</div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'priority',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 font-medium"
        >
          Priority
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: PriorityCell,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'completionPercentage',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 font-medium"
        >
          Progress
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ProgressCell,
  },
  {
    accessorKey: 'projectManager.name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 font-medium hidden md:flex"
        >
          Manager
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const manager = row.original.projectManager;
      return (
        <div className="items-center gap-2 hidden md:flex">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">{manager.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span>{manager.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'endDate',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 font-medium hidden md:flex"
        >
          Due Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue('endDate'));
      const now = new Date();
      const isPastDue = date < now && row.getValue('status') !== 'completed';

      return (
        <div className={`items-center ${isPastDue ? 'text-red-500' : ''} hidden md:flex`}>
          {isPastDue && <AlertCircle className="h-3 w-3 mr-1" />}
          {formatDate(date)}
        </div>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row, table }) => {
      const { toast } = useToast();
      const [isDetailsOpen, setIsDetailsOpen] = useState(false);
      const [isDeleteOpen, setIsDeleteOpen] = useState(false);
      const project = row.original;
      const router = useRouter();

      const copyToClipboard = () => {
        const text = `${project.name} - ${project.type} - Due: ${formatDate(project.endDate)} - Manager: ${project.projectManager.name}`;
        navigator.clipboard.writeText(text);
        toast({
          title: "Copied to clipboard",
          description: "Project information has been copied to clipboard",
          duration: 2000,
        });
      };

      const handleDelete = async () => {
        try {
          const response = await fetch(`/api/projects?id=${project.id}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete project');
          }

          toast({
            title: 'Success',
            description: 'Project deleted successfully',
          });

          // Remove the item from the table
          const data = table.options.data as Project[];
          const updatedData = data.filter(d => d.id !== project.id);

          // @ts-ignore - We know this exists but TypeScript doesn't
          table.options.meta?.updateData(updatedData);

        } catch (error) {
          console.error('Error deleting project:', error);
          toast({
            title: 'Error',
            description: error instanceof Error ? error.message : 'Failed to delete project. Please try again.',
            variant: 'destructive',
          });
        }

        setIsDeleteOpen(false);
      };

      return (
        <>
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 md:hidden"
              onClick={() => setIsDetailsOpen(true)}
            >
              <span className="sr-only">Open menu</span>
              <Eye className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 md:hidden"
              onClick={() => router.push(`/projects/edit/${project.id}`)}
            >
              <span className="sr-only">Edit</span>
              <Edit className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setIsDetailsOpen(true)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/projects/edit/${project.id}`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copyToClipboard}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Info
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={() => setIsDeleteOpen(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* View Details Dialog */}
          <ProjectDetailsDialog
            project={project}
            isOpen={isDetailsOpen}
            onClose={() => setIsDetailsOpen(false)}
          />

          {/* Delete Confirmation Dialog */}
          <DeleteConfirmationDialog
            project={project}
            isOpen={isDeleteOpen}
            onClose={() => setIsDeleteOpen(false)}
            onDelete={handleDelete}
          />
        </>
      );
    },
    meta: {
      align: 'center',
    },
  },
];
