'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowLeft, Save, Plus, Trash2, Move as GripVertical, Settings,
  Clock, User, FileText, CheckCircle, AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface Task {
  id: string;
  title: string;
  description: string;
  instructions: string;
  category: string;
  priority: string;
  estimatedHours: number;
  orderIndex: number;
  dependencies: string[];
  assigneeType: string;
  assigneeRole: string;
  requiresApproval: boolean;
  requiresDocument: boolean;
  documentTypes: string[];
  isAutomated: boolean;
  automationConfig: any;
}

interface FormData {
  name: string;
  description: string;
  isDefault: boolean;
  isActive: boolean;
  department: string;
  position: string;
  estimatedDays: string;
  tasks: Task[];
}

export default function CreateWorkflowPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTaskIndex, setActiveTaskIndex] = useState<number | null>(null);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    isDefault: false,
    isActive: true,
    department: '',
    position: '',
    estimatedDays: '',
    tasks: [],
  });

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addTask = () => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: '',
      description: '',
      instructions: '',
      category: 'documentation',
      priority: 'medium',
      estimatedHours: 1,
      orderIndex: formData.tasks.length,
      dependencies: [],
      assigneeType: 'hr',
      assigneeRole: '',
      requiresApproval: false,
      requiresDocument: false,
      documentTypes: [],
      isAutomated: false,
      automationConfig: null,
    };

    setFormData(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask]
    }));
    setActiveTaskIndex(formData.tasks.length);
  };

  const updateTask = (index: number, field: keyof Task, value: any) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => 
        i === index ? { ...task, [field]: value } : task
      )
    }));
  };

  const removeTask = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index).map((task, i) => ({
        ...task,
        orderIndex: i
      }))
    }));
    setActiveTaskIndex(null);
  };

  const moveTask = (fromIndex: number, toIndex: number) => {
    const newTasks = [...formData.tasks];
    const [movedTask] = newTasks.splice(fromIndex, 1);
    newTasks.splice(toIndex, 0, movedTask);
    
    // Update order indices
    const reorderedTasks = newTasks.map((task, index) => ({
      ...task,
      orderIndex: index
    }));

    setFormData(prev => ({
      ...prev,
      tasks: reorderedTasks
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || formData.tasks.length === 0) {
      toast({
        title: 'Error',
        description: 'Please provide a workflow name and at least one task',
        variant: 'destructive',
      });
      return;
    }

    // Validate all tasks have titles
    const invalidTasks = formData.tasks.filter(task => !task.title.trim());
    if (invalidTasks.length > 0) {
      toast({
        title: 'Error',
        description: 'All tasks must have a title',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/hr/onboarding/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          estimatedDays: formData.estimatedDays ? parseInt(formData.estimatedDays) : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create workflow');
      }

      const data = await response.json();
      
      toast({
        title: 'Success',
        description: 'Onboarding workflow created successfully',
      });

      router.push(`/hr/onboarding/workflows/${data.workflow.id}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/hr/onboarding/workflows">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Workflows
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create Onboarding Workflow</h1>
          <p className="text-gray-600">Design a structured onboarding process for new employees</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Define the workflow name, scope, and settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Workflow Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Engineering Onboarding"
                  required
                />
              </div>

              <div>
                <Label htmlFor="estimatedDays">Estimated Duration (days)</Label>
                <Input
                  id="estimatedDays"
                  type="number"
                  value={formData.estimatedDays}
                  onChange={(e) => handleInputChange('estimatedDays', e.target.value)}
                  placeholder="e.g., 14"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the purpose and scope of this workflow..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="department">Department (Optional)</Label>
                <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="position">Position (Optional)</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  placeholder="e.g., Software Engineer"
                />
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isDefault"
                  checked={formData.isDefault}
                  onCheckedChange={(checked) => handleInputChange('isDefault', checked)}
                />
                <Label htmlFor="isDefault">Set as default workflow</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Onboarding Tasks</CardTitle>
                <CardDescription>Define the tasks that need to be completed during onboarding</CardDescription>
              </div>
              <Button type="button" onClick={addTask} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {formData.tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No tasks added yet. Click "Add Task" to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.tasks.map((task, index) => (
                  <Card key={task.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center gap-2">
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                          <span className="text-sm text-gray-500 bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center">
                            {index + 1}
                          </span>
                        </div>

                        <div className="flex-1 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Task Title *</Label>
                              <Input
                                value={task.title}
                                onChange={(e) => updateTask(index, 'title', e.target.value)}
                                placeholder="e.g., Complete I-9 Form"
                                required
                              />
                            </div>

                            <div>
                              <Label>Category</Label>
                              <Select 
                                value={task.category} 
                                onValueChange={(value) => updateTask(index, 'category', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="documentation">📄 Documentation</SelectItem>
                                  <SelectItem value="training">🎓 Training</SelectItem>
                                  <SelectItem value="equipment">💻 Equipment</SelectItem>
                                  <SelectItem value="access">🔑 Access & Accounts</SelectItem>
                                  <SelectItem value="introduction">👋 Introductions</SelectItem>
                                  <SelectItem value="compliance">✅ Compliance</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div>
                            <Label>Description</Label>
                            <Textarea
                              value={task.description}
                              onChange={(e) => updateTask(index, 'description', e.target.value)}
                              placeholder="Describe what needs to be done..."
                              rows={2}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <Label>Priority</Label>
                              <Select 
                                value={task.priority} 
                                onValueChange={(value) => updateTask(index, 'priority', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="low">Low</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label>Estimated Hours</Label>
                              <Input
                                type="number"
                                value={task.estimatedHours}
                                onChange={(e) => updateTask(index, 'estimatedHours', parseFloat(e.target.value) || 1)}
                                min="0.5"
                                step="0.5"
                              />
                            </div>

                            <div>
                              <Label>Assignee Type</Label>
                              <Select 
                                value={task.assigneeType} 
                                onValueChange={(value) => updateTask(index, 'assigneeType', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="employee">👤 Employee</SelectItem>
                                  <SelectItem value="hr">👥 HR Team</SelectItem>
                                  <SelectItem value="manager">👔 Manager</SelectItem>
                                  <SelectItem value="buddy">🤝 Buddy/Mentor</SelectItem>
                                  <SelectItem value="it">💻 IT Team</SelectItem>
                                  <SelectItem value="admin">⚙️ Admin Team</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="flex items-center space-x-6">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={task.requiresApproval}
                                onCheckedChange={(checked) => updateTask(index, 'requiresApproval', checked)}
                              />
                              <Label className="text-sm">Requires Approval</Label>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={task.requiresDocument}
                                onCheckedChange={(checked) => updateTask(index, 'requiresDocument', checked)}
                              />
                              <Label className="text-sm">Requires Document</Label>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={task.isAutomated}
                                onCheckedChange={(checked) => updateTask(index, 'isAutomated', checked)}
                              />
                              <Label className="text-sm">Automated Task</Label>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs border ${getPriorityColor(task.priority)}`}>
                                {task.priority} priority
                              </span>
                              <span className="text-xs text-gray-500">
                                {getCategoryIcon(task.category)} {task.category}
                              </span>
                              {task.requiresApproval && (
                                <CheckCircle className="w-4 h-4 text-blue-500" />
                              )}
                              {task.requiresDocument && (
                                <FileText className="w-4 h-4 text-green-500" />
                              )}
                              {task.isAutomated && (
                                <Settings className="w-4 h-4 text-purple-500" />
                              )}
                            </div>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeTask(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <Link href="/hr/onboarding/workflows">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? (
              'Creating...'
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Workflow
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
