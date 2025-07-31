'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, User, Calendar, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  department?: { name: string };
  position?: string;
}

interface Workflow {
  id: string;
  name: string;
  description?: string;
  estimatedDays?: number;
  isActive: boolean;
}

interface FormData {
  employeeId: string;
  workflowId: string;
  startDate: string;
  expectedEndDate: string;
  hrAssignee: string;
  managerAssignee: string;
  buddyAssignee: string;
  notes: string;
}

export default function CreateOnboardingInstancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [managers, setManagers] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

  const [formData, setFormData] = useState<FormData>({
    employeeId: searchParams.get('employeeId') || '',
    workflowId: '',
    startDate: new Date().toISOString().split('T')[0],
    expectedEndDate: '',
    hrAssignee: '',
    managerAssignee: '',
    buddyAssignee: '',
    notes: '',
  });

  useEffect(() => {
    fetchEmployees();
    fetchWorkflows();
    fetchManagers();
  }, []);

  useEffect(() => {
    if (formData.employeeId) {
      const employee = employees.find(emp => emp.id === formData.employeeId);
      setSelectedEmployee(employee || null);
    }
  }, [formData.employeeId, employees]);

  useEffect(() => {
    if (formData.workflowId) {
      const workflow = workflows.find(wf => wf.id === formData.workflowId);
      setSelectedWorkflow(workflow || null);
      
      // Auto-calculate expected end date based on workflow estimated days
      if (workflow?.estimatedDays && formData.startDate) {
        const startDate = new Date(formData.startDate);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + workflow.estimatedDays);
        setFormData(prev => ({
          ...prev,
          expectedEndDate: endDate.toISOString().split('T')[0]
        }));
      }
    }
  }, [formData.workflowId, formData.startDate, workflows]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/hr/employees?status=active');
      if (!response.ok) throw new Error('Failed to fetch employees');
      const data = await response.json();
      setEmployees(data.employees || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/hr/onboarding/workflows?isActive=true');
      if (!response.ok) throw new Error('Failed to fetch workflows');
      const data = await response.json();
      setWorkflows(data.workflows || []);
    } catch (error) {
      console.error('Error fetching workflows:', error);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await fetch('/api/hr/employees?role=manager');
      if (!response.ok) throw new Error('Failed to fetch managers');
      const data = await response.json();
      setManagers(data.employees || []);
    } catch (error) {
      console.error('Error fetching managers:', error);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.employeeId || !formData.workflowId || !formData.startDate) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/hr/onboarding/instances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: formData.employeeId,
          workflowId: formData.workflowId,
          startDate: new Date(formData.startDate).toISOString(),
          expectedEndDate: formData.expectedEndDate ? new Date(formData.expectedEndDate).toISOString() : null,
          hrAssignee: formData.hrAssignee || null,
          managerAssignee: formData.managerAssignee || null,
          buddyAssignee: formData.buddyAssignee || null,
          notes: formData.notes || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create onboarding instance');
      }

      const data = await response.json();
      
      toast({
        title: 'Success',
        description: 'Onboarding instance created successfully',
      });

      router.push('/hr/onboarding/instances');
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

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push('/hr/onboarding/instances')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Onboarding Instances
        </Button>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">Start Employee Onboarding</h1>
          <p className="text-muted-foreground">
            Create a new onboarding instance for an employee
          </p>
        </div>
      </div>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            Onboarding Details
          </CardTitle>
          <CardDescription>
            Select the employee and workflow to start the onboarding process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Employee Selection */}
            <div>
              <Label htmlFor="employeeId">Employee *</Label>
              <Select value={formData.employeeId} onValueChange={(value) => handleInputChange('employeeId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee to onboard" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName} ({employee.employeeId})
                      {employee.department && ` - ${employee.department.name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedEmployee && (
                <div className="mt-2 p-3 bg-muted rounded-md">
                  <p className="text-sm">
                    <strong>Selected:</strong> {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedEmployee.email}</p>
                  {selectedEmployee.position && (
                    <p className="text-sm text-muted-foreground">{selectedEmployee.position}</p>
                  )}
                </div>
              )}
            </div>

            {/* Workflow Selection */}
            <div>
              <Label htmlFor="workflowId">Onboarding Workflow *</Label>
              <Select value={formData.workflowId} onValueChange={(value) => handleInputChange('workflowId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select onboarding workflow" />
                </SelectTrigger>
                <SelectContent>
                  {workflows.map((workflow) => (
                    <SelectItem key={workflow.id} value={workflow.id}>
                      {workflow.name}
                      {workflow.estimatedDays && ` (${workflow.estimatedDays} days)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedWorkflow && (
                <div className="mt-2 p-3 bg-muted rounded-md">
                  <p className="text-sm">
                    <strong>Selected:</strong> {selectedWorkflow.name}
                  </p>
                  {selectedWorkflow.description && (
                    <p className="text-sm text-muted-foreground">{selectedWorkflow.description}</p>
                  )}
                  {selectedWorkflow.estimatedDays && (
                    <p className="text-sm text-muted-foreground">
                      Estimated duration: {selectedWorkflow.estimatedDays} days
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="expectedEndDate">Expected End Date</Label>
                <Input
                  id="expectedEndDate"
                  type="date"
                  value={formData.expectedEndDate}
                  onChange={(e) => handleInputChange('expectedEndDate', e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Auto-calculated based on workflow duration
                </p>
              </div>
            </div>

            {/* Assignees */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="hrAssignee">HR Assignee</Label>
                <Select value={formData.hrAssignee} onValueChange={(value) => handleInputChange('hrAssignee', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select HR assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No assignee</SelectItem>
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.firstName} {manager.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="managerAssignee">Manager Assignee</Label>
                <Select value={formData.managerAssignee} onValueChange={(value) => handleInputChange('managerAssignee', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No assignee</SelectItem>
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.firstName} {manager.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="buddyAssignee">Buddy Assignee</Label>
                <Select value={formData.buddyAssignee} onValueChange={(value) => handleInputChange('buddyAssignee', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select buddy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No assignee</SelectItem>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes about this onboarding instance..."
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/hr/onboarding/instances')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Creating...' : 'Start Onboarding'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
