'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Save, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CreateGoalDialogProps {
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

interface KeyResult {
  description: string;
  targetValue?: number;
  currentValue: number;
  unit?: string;
}

export function CreateGoalDialog({ open, onClose, onSuccess }: CreateGoalDialogProps) {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [formData, setFormData] = useState({
    employeeId: '',
    title: '',
    description: '',
    category: 'performance',
    priority: 'medium',
    targetDate: undefined as Date | undefined,
    targetValue: undefined as number | undefined,
    currentValue: 0,
    unit: '',
    managerId: '',
    isPublic: true,
    keyResults: [] as KeyResult[],
  });
  const { toast } = useToast();

  // Fetch employees
  useEffect(() => {
    if (open) {
      fetchEmployees();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      // Validate required fields
      if (!formData.employeeId || !formData.title || !formData.targetDate) {
        throw new Error('Please fill in all required fields');
      }

      const response = await fetch('/api/hr/performance/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          targetDate: formData.targetDate.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create goal');
      }

      toast({
        title: 'Success',
        description: 'Performance goal created successfully',
      });

      // Reset form
      setFormData({
        employeeId: '',
        title: '',
        description: '',
        category: 'performance',
        priority: 'medium',
        targetDate: undefined,
        targetValue: undefined,
        currentValue: 0,
        unit: '',
        managerId: '',
        isPublic: true,
        keyResults: [],
      });

      onSuccess();
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create goal',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addKeyResult = () => {
    setFormData(prev => ({
      ...prev,
      keyResults: [...prev.keyResults, {
        description: '',
        targetValue: undefined,
        currentValue: 0,
        unit: '',
      }],
    }));
  };

  const removeKeyResult = (index: number) => {
    setFormData(prev => ({
      ...prev,
      keyResults: prev.keyResults.filter((_, i) => i !== index),
    }));
  };

  const updateKeyResult = (index: number, updates: Partial<KeyResult>) => {
    setFormData(prev => ({
      ...prev,
      keyResults: prev.keyResults.map((kr, i) => 
        i === index ? { ...kr, ...updates } : kr
      ),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Performance Goal</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee">Employee *</Label>
              <Select value={formData.employeeId} onValueChange={(value) => setFormData(prev => ({ ...prev, employeeId: value }))}>
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
              <Label htmlFor="manager">Manager (Optional)</Label>
              <Select value={formData.managerId} onValueChange={(value) => setFormData(prev => ({ ...prev, managerId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No manager assigned</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} ({employee.employeeId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Goal Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Increase sales by 20%"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the goal in detail..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="leadership">Leadership</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="behavioral">Behavioral</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Target Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.targetDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.targetDate ? format(formData.targetDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.targetDate}
                    onSelect={(date) => setFormData(prev => ({ ...prev, targetDate: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetValue">Target Value</Label>
              <Input
                id="targetValue"
                type="number"
                value={formData.targetValue || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, targetValue: e.target.value ? parseFloat(e.target.value) : undefined }))}
                placeholder="e.g., 100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentValue">Current Value</Label>
              <Input
                id="currentValue"
                type="number"
                value={formData.currentValue}
                onChange={(e) => setFormData(prev => ({ ...prev, currentValue: parseFloat(e.target.value) || 0 }))}
                placeholder="e.g., 0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                placeholder="e.g., %, $, hours"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Key Results (Optional)</h4>
              <Button type="button" variant="outline" onClick={addKeyResult}>
                <Plus className="h-4 w-4 mr-2" />
                Add Key Result
              </Button>
            </div>

            {formData.keyResults.length > 0 && (
              <div className="space-y-3">
                {formData.keyResults.map((keyResult, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium">Key Result {index + 1}</h5>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeKeyResult(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="md:col-span-2 space-y-2">
                        <Label>Description</Label>
                        <Input
                          value={keyResult.description}
                          onChange={(e) => updateKeyResult(index, { description: e.target.value })}
                          placeholder="Describe the key result..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Target</Label>
                        <Input
                          type="number"
                          value={keyResult.targetValue || ''}
                          onChange={(e) => updateKeyResult(index, { targetValue: e.target.value ? parseFloat(e.target.value) : undefined })}
                          placeholder="Target"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Unit</Label>
                        <Input
                          value={keyResult.unit || ''}
                          onChange={(e) => updateKeyResult(index, { unit: e.target.value })}
                          placeholder="Unit"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Public Goal</Label>
                <p className="text-sm text-muted-foreground">Make this goal visible to other team members</p>
              </div>
              <Switch 
                checked={formData.isPublic}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Creating...' : 'Create Goal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
