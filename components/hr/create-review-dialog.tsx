'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CreateReviewDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Employee {
  id: string;
  name: string;
  employeeId: string;
  email: string;
  department?: string;
}

interface Template {
  id: string;
  name: string;
  reviewType: string;
  duration: number;
}

export function CreateReviewDialog({ open, onClose, onSuccess }: CreateReviewDialogProps) {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [formData, setFormData] = useState({
    employeeId: '',
    templateId: '',
    reviewPeriodStart: undefined as Date | undefined,
    reviewPeriodEnd: undefined as Date | undefined,
    reviewType: '',
    dueDate: undefined as Date | undefined,
    reviewerId: '',
    reviewerName: '',
    reviewerEmail: '',
  });
  const { toast } = useToast();

  // Fetch employees and templates
  useEffect(() => {
    if (open) {
      fetchEmployees();
      fetchTemplates();
    }
  }, [open]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/hr/performance/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      // Validate required fields
      if (!formData.employeeId || !formData.templateId || !formData.reviewPeriodStart || 
          !formData.reviewPeriodEnd || !formData.dueDate) {
        throw new Error('Please fill in all required fields');
      }

      const response = await fetch('/api/hr/performance/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          reviewPeriodStart: formData.reviewPeriodStart.toISOString(),
          reviewPeriodEnd: formData.reviewPeriodEnd.toISOString(),
          dueDate: formData.dueDate.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create review');
      }

      toast({
        title: 'Success',
        description: 'Performance review created successfully',
      });

      // Reset form
      setFormData({
        employeeId: '',
        templateId: '',
        reviewPeriodStart: undefined,
        reviewPeriodEnd: undefined,
        reviewType: '',
        dueDate: undefined,
        reviewerId: '',
        reviewerName: '',
        reviewerEmail: '',
      });

      onSuccess();
    } catch (error) {
      console.error('Error creating review:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create review',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        templateId,
        reviewType: template.reviewType,
        // Auto-set due date based on template duration
        dueDate: prev.reviewPeriodEnd ? 
          new Date(prev.reviewPeriodEnd.getTime() + template.duration * 24 * 60 * 60 * 1000) :
          undefined,
      }));
    }
  };

  const handleEmployeeChange = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    setFormData(prev => ({
      ...prev,
      employeeId,
      // Could auto-populate reviewer based on employee's manager
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Performance Review</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee">Employee *</Label>
              <Select value={formData.employeeId} onValueChange={handleEmployeeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} ({employee.employeeId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template">Review Template *</Label>
              <Select value={formData.templateId} onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({template.reviewType})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Review Period Start *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.reviewPeriodStart && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.reviewPeriodStart ? format(formData.reviewPeriodStart, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.reviewPeriodStart}
                    onSelect={(date) => setFormData(prev => ({ ...prev, reviewPeriodStart: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Review Period End *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.reviewPeriodEnd && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.reviewPeriodEnd ? format(formData.reviewPeriodEnd, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.reviewPeriodEnd}
                    onSelect={(date) => setFormData(prev => ({ ...prev, reviewPeriodEnd: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Due Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dueDate ? format(formData.dueDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.dueDate}
                    onSelect={(date) => setFormData(prev => ({ ...prev, dueDate: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reviewType">Review Type</Label>
              <Input
                id="reviewType"
                value={formData.reviewType}
                onChange={(e) => setFormData(prev => ({ ...prev, reviewType: e.target.value }))}
                placeholder="Auto-filled from template"
                readOnly
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Reviewer Information (Optional)</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reviewerName">Reviewer Name</Label>
                <Input
                  id="reviewerName"
                  value={formData.reviewerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, reviewerName: e.target.value }))}
                  placeholder="Manager or reviewer name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reviewerEmail">Reviewer Email</Label>
                <Input
                  id="reviewerEmail"
                  type="email"
                  value={formData.reviewerEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, reviewerEmail: e.target.value }))}
                  placeholder="reviewer@company.com"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Creating...' : 'Create Review'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
