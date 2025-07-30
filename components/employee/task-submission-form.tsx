'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { 
  CheckCircle, 
  Clock, 
  FileText, 
  Upload,
  AlertTriangle,
  Calendar,
  User,
  MessageSquare
} from 'lucide-react';

interface Task {
  id: string;
  name: string;
  description?: string;
  status: string;
  priority: string;
  dueDate: string;
  completionPercentage: number;
  assigneeId: string;
  assigneeName: string;
  projectName: string;
}

interface TaskSubmissionFormProps {
  task: Task;
  onSubmit: (taskId: string, submissionData: TaskSubmissionData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

interface TaskSubmissionData {
  message: string;
  workSummary: string;
  timeSpent: number;
  blockers: string;
  attachments?: File[];
  completionNotes: string;
}

export function TaskSubmissionForm({ task, onSubmit, onCancel, isSubmitting }: TaskSubmissionFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<TaskSubmissionData>({
    message: '',
    workSummary: '',
    timeSpent: 0,
    blockers: '',
    attachments: [],
    completionNotes: ''
  });

  const [attachments, setAttachments] = useState<File[]>([]);

  const handleInputChange = (field: keyof TaskSubmissionData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
    setFormData(prev => ({
      ...prev,
      attachments: [...(prev.attachments || []), ...files]
    }));
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments?.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.workSummary.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a work summary',
        variant: 'destructive',
      });
      return;
    }

    try {
      await onSubmit(task.id, formData);
    } catch (error) {
      console.error('Error submitting task:', error);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-none">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Submit Task for Approval</span>
                </CardTitle>
                <CardDescription>
                  Provide details about your completed work for manager review
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Task Information */}
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{task.name}</h3>
                <div className="flex items-center space-x-2">
                  <Badge className={`${getPriorityColor(task.priority)} text-white text-xs`}>
                    {task.priority}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FileText className="h-3 w-3" />
                  <span>Project: {task.projectName}</span>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>{task.completionPercentage}%</span>
                </div>
                <Progress value={task.completionPercentage} className="h-2" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Work Summary */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Work Summary <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.workSummary}
                  onChange={(e) => handleInputChange('workSummary', e.target.value)}
                  placeholder="Describe what you accomplished, key deliverables, and any important outcomes..."
                  className="w-full p-3 border rounded-md"
                  rows={4}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Provide a detailed summary of the work completed
                </p>
              </div>

              {/* Completion Notes */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Completion Notes
                </label>
                <textarea
                  value={formData.completionNotes}
                  onChange={(e) => handleInputChange('completionNotes', e.target.value)}
                  placeholder="Any additional notes about the task completion, methodology used, or results achieved..."
                  className="w-full p-3 border rounded-md"
                  rows={3}
                />
              </div>

              {/* Time Spent */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Time Spent (Hours)
                </label>
                <input
                  type="number"
                  value={formData.timeSpent}
                  onChange={(e) => handleInputChange('timeSpent', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full p-3 border rounded-md"
                  min="0"
                  step="0.5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Approximate hours spent on this task
                </p>
              </div>

              {/* Blockers/Issues */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Blockers or Issues Encountered
                </label>
                <textarea
                  value={formData.blockers}
                  onChange={(e) => handleInputChange('blockers', e.target.value)}
                  placeholder="Describe any challenges, blockers, or issues you encountered and how you resolved them..."
                  className="w-full p-3 border rounded-md"
                  rows={3}
                />
              </div>

              {/* File Attachments */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Attachments (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <div className="text-center">
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Upload screenshots, documents, or other relevant files
                    </p>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      Choose Files
                    </Button>
                  </div>
                </div>

                {/* Display uploaded files */}
                {attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Manager Message */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Message to Manager
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  placeholder="Any specific message or questions for your manager regarding this task..."
                  className="w-full p-3 border rounded-md"
                  rows={2}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  <span>This will submit the task for manager approval</span>
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !formData.workSummary.trim()}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Submit for Approval
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
