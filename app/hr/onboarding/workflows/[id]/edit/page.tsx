'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FormData {
  name: string;
  description: string;
  estimatedDays: string;
  department: string;
  isActive: boolean;
}

interface Workflow {
  id: string;
  name: string;
  description?: string;
  estimatedDays?: number;
  department?: string;
  isActive: boolean;
}

export default function EditWorkflowPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    estimatedDays: '',
    department: '',
    isActive: true,
  });

  useEffect(() => {
    fetchWorkflow();
  }, [params.id]);

  const fetchWorkflow = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/hr/onboarding/workflows/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch workflow');
      
      const data = await response.json();
      setWorkflow(data.workflow);
      
      // Initialize form data
      setFormData({
        name: data.workflow.name,
        description: data.workflow.description || '',
        estimatedDays: data.workflow.estimatedDays?.toString() || '',
        department: data.workflow.department || '',
        isActive: data.workflow.isActive,
      });
    } catch (error) {
      console.error('Error fetching workflow:', error);
      toast({
        title: 'Error',
        description: 'Failed to load workflow details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Workflow name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        estimatedDays: formData.estimatedDays ? parseInt(formData.estimatedDays) : null,
        department: formData.department.trim() || null,
        isActive: formData.isActive,
      };

      const response = await fetch(`/api/hr/onboarding/workflows/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update workflow');
      }

      toast({
        title: 'Success',
        description: 'Workflow updated successfully',
      });

      router.push(`/hr/onboarding/workflows/${params.id}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading workflow details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Workflow Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested workflow could not be found.</p>
          <Button onClick={() => router.push('/hr/onboarding/workflows')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Workflows
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push(`/hr/onboarding/workflows/${params.id}`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Workflow
        </Button>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Workflow</h1>
          <p className="text-muted-foreground">
            Update the workflow details and settings
          </p>
        </div>
      </div>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Workflow Settings
          </CardTitle>
          <CardDescription>
            Modify the workflow configuration and properties
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name">Workflow Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="E.g., Standard Employee Onboarding"
                  required
                />
              </div>

              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  placeholder="E.g., Engineering, Sales, HR"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the purpose and scope of this onboarding workflow..."
                rows={3}
              />
            </div>

            {/* Estimated Days */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="estimatedDays">Estimated Duration (Days)</Label>
                <Input
                  id="estimatedDays"
                  type="number"
                  min="1"
                  max="365"
                  value={formData.estimatedDays}
                  onChange={(e) => handleInputChange('estimatedDays', e.target.value)}
                  placeholder="30"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Expected number of days to complete this workflow
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange('isActive', checked as boolean)}
              />
              <Label htmlFor="isActive" className="text-sm font-normal">
                Active workflow (can be used for new onboarding instances)
              </Label>
            </div>

            {/* Warning for deactivating */}
            {!formData.isActive && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Deactivating Workflow
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        Deactivating this workflow will prevent it from being used for new onboarding instances.
                        Existing instances using this workflow will not be affected.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/hr/onboarding/workflows/${params.id}`)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tasks Section - Read Only for now */}
      <Card className="max-w-4xl mt-6">
        <CardHeader>
          <CardTitle>Workflow Tasks</CardTitle>
          <CardDescription>
            Task management is available in the workflow detail view
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>To manage tasks for this workflow, please use the workflow detail page.</p>
            <Button 
              variant="outline" 
              className="mt-2"
              onClick={() => router.push(`/hr/onboarding/workflows/${params.id}`)}
            >
              View Workflow Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
