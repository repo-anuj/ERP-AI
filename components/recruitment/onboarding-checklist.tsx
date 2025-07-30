'use client';

import { useState } from 'react';
import { Check, Clock, FileText, User, Mail, Briefcase, Building, FileText as FileSpreadsheet, DollarSign as BadgeDollarSign, Package as Laptop, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';

interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'not-started';
  dueDate?: Date;
  assignedTo: {
    id: string;
    name: string;
    role: string;
  };
  icon: React.ReactNode;
  category: 'paperwork' | 'it' | 'hr' | 'training' | 'other';
}

interface OnboardingChecklistProps {
  candidate: {
    id: string;
    name: string;
    email: string;
    position: string;
    department: string;
    startDate: Date;
  };
  onTaskUpdate?: (taskId: string, status: OnboardingTask['status']) => void;
  onCompleteOnboarding?: () => void;
}

export function OnboardingChecklist({ candidate, onTaskUpdate, onCompleteOnboarding }: OnboardingChecklistProps) {
  const [tasks, setTasks] = useState<OnboardingTask[]>([
    {
      id: '1',
      title: 'Employment Contract',
      description: 'Review and sign the employment contract',
      status: 'pending',
      dueDate: new Date(),
      assignedTo: { id: '1', name: 'HR Department', role: 'HR' },
      icon: <FileText className="h-4 w-4" />,
      category: 'paperwork',
    },
    {
      id: '2',
      title: 'Tax Forms',
      description: 'Complete W-4 and other tax-related forms',
      status: 'not-started',
      assignedTo: { id: '1', name: 'HR Department', role: 'HR' },
      icon: <FileSpreadsheet className="h-4 w-4" />,
      category: 'paperwork',
    },
    {
      id: '3',
      title: 'Direct Deposit Setup',
      description: 'Set up direct deposit for payroll',
      status: 'not-started',
      assignedTo: { id: '1', name: 'Finance Department', role: 'Finance' },
      icon: <BadgeDollarSign className="h-4 w-4" />,
      category: 'hr',
    },
    {
      id: '4',
      title: 'Company Laptop Setup',
      description: 'Set up and configure company-issued laptop',
      status: 'not-started',
      assignedTo: { id: '2', name: 'IT Support', role: 'IT' },
      icon: <Laptop className="h-4 w-4" />,
      category: 'it',
    },
    {
      id: '5',
      title: 'Email & Accounts',
      description: 'Set up company email and necessary accounts',
      status: 'not-started',
      assignedTo: { id: '2', name: 'IT Support', role: 'IT' },
      icon: <Mail className="h-4 w-4" />,
      category: 'it',
    },
    {
      id: '6',
      title: 'Security Training',
      description: 'Complete security awareness training',
      status: 'not-started',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      assignedTo: { id: '3', name: 'Security Team', role: 'Security' },
      icon: <Shield className="h-4 w-4" />,
      category: 'training',
    },
    {
      id: '7',
      title: 'Department Orientation',
      description: 'Attend department orientation session',
      status: 'not-started',
      assignedTo: { id: '4', name: candidate.department, role: 'Department Head' },
      icon: <Building className="h-4 w-4" />,
      category: 'hr',
    },
    {
      id: '8',
      title: 'Meet the Team',
      description: 'Schedule introductory meetings with team members',
      status: 'not-started',
      assignedTo: { id: '5', name: 'Team Lead', role: 'Team Lead' },
      icon: <User className="h-4 w-4" />,
      category: 'hr',
    },
  ]);

  const [selectedTask, setSelectedTask] = useState<OnboardingTask | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const updateTaskStatus = (taskId: string, status: OnboardingTask['status']) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status } : task
    ));
    
    if (onTaskUpdate) {
      onTaskUpdate(taskId, status);
    }
  };

  const completeTask = (taskId: string) => {
    updateTaskStatus(taskId, 'completed');
    setIsDialogOpen(false);
  };

  const startTask = (taskId: string) => {
    updateTaskStatus(taskId, 'in-progress');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">In Progress</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const totalTasks = tasks.length;
  const completionPercentage = Math.round((completedTasks / totalTasks) * 100);

  const categories = [
    { id: 'all', name: 'All Tasks', count: tasks.length },
    { id: 'paperwork', name: 'Paperwork', count: tasks.filter(t => t.category === 'paperwork').length },
    { id: 'it', name: 'IT Setup', count: tasks.filter(t => t.category === 'it').length },
    { id: 'hr', name: 'HR', count: tasks.filter(t => t.category === 'hr').length },
    { id: 'training', name: 'Training', count: tasks.filter(t => t.category === 'training').length },
  ];

  const [activeCategory, setActiveCategory] = useState('all');

  const filteredTasks = activeCategory === 'all' 
    ? tasks 
    : tasks.filter(task => task.category === activeCategory);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Onboarding Progress</CardTitle>
              <CardDescription>
                Track the progress of {candidate.name}'s onboarding process
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Send Reminder
              </Button>
              <Button size="sm" onClick={onCompleteOnboarding}>
                Complete Onboarding
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium">
                  {completedTasks} of {totalTasks} tasks completed
                </h4>
                <p className="text-sm text-muted-foreground">
                  {completionPercentage}% complete
                </p>
              </div>
              <div className="text-sm font-medium">
                Start Date: {format(new Date(candidate.startDate), 'MMM d, yyyy')}
              </div>
            </div>
            
            <Progress value={completionPercentage} className="h-2" />
            
            <div className="flex flex-wrap gap-2 pt-2">
              {categories.map(category => (
                <Button
                  key={category.id}
                  variant={activeCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveCategory(category.id)}
                  className="text-xs"
                >
                  {category.name}
                  <span className="ml-1.5 bg-muted-foreground/10 text-foreground rounded-full px-2 py-0.5 text-xs">
                    {category.count}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredTasks.map((task) => (
          <Card key={task.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2 rounded-full bg-muted">
                    {task.icon}
                  </div>
                  <div>
                    <h4 className="font-medium">{task.title}</h4>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {getStatusBadge(task.status)}
                      <div className="flex items-center text-xs text-muted-foreground">
                        <User className="h-3 w-3 mr-1" />
                        {task.assignedTo.name}
                      </div>
                      {task.dueDate && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          Due {format(new Date(task.dueDate), 'MMM d, yyyy')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {task.status === 'completed' ? (
                    <Button variant="outline" size="sm" disabled>
                      <Check className="h-4 w-4 mr-2" />
                      Completed
                    </Button>
                  ) : task.status === 'in-progress' ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setSelectedTask(task);
                        setIsDialogOpen(true);
                      }}
                    >
                      Mark as Complete
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => startTask(task.id)}
                    >
                      Start Task
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {selectedTask && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Complete Task: {selectedTask.title}</DialogTitle>
              <DialogDescription>
                Mark this task as completed or add any notes.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes (Optional)</label>
                <textarea 
                  className="w-full p-2 border rounded-md min-h-[100px] text-sm"
                  placeholder="Add any notes or comments about this task..."
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox id="notify" defaultChecked />
                <label
                  htmlFor="notify"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Notify {selectedTask.assignedTo.name}
                </label>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => completeTask(selectedTask.id)}>
                <Check className="h-4 w-4 mr-2" />
                Mark as Complete
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
