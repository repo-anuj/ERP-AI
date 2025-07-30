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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface EditTemplateDialogProps {
  template: any;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditTemplateDialog({ template, open, onClose, onSuccess }: EditTemplateDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    reviewType: 'annual',
    frequency: 'yearly',
    duration: 30,
    sections: [] as any[],
    ratingScale: {
      min: 1,
      max: 5,
      labels: ["Poor", "Below Average", "Average", "Good", "Excellent"],
    },
    selfReviewEnabled: true,
    managerReviewEnabled: true,
    peerReviewEnabled: false,
    skipLevelReviewEnabled: false,
    autoAssignReviews: false,
    isActive: true,
    isDefault: false,
  });
  const { toast } = useToast();

  // Update form data when template changes
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        description: template.description || '',
        reviewType: template.reviewType || 'annual',
        frequency: template.frequency || 'yearly',
        duration: template.duration || 30,
        sections: template.sections || [],
        ratingScale: template.ratingScale || {
          min: 1,
          max: 5,
          labels: ["Poor", "Below Average", "Average", "Good", "Excellent"],
        },
        selfReviewEnabled: template.selfReviewEnabled ?? true,
        managerReviewEnabled: template.managerReviewEnabled ?? true,
        peerReviewEnabled: template.peerReviewEnabled ?? false,
        skipLevelReviewEnabled: template.skipLevelReviewEnabled ?? false,
        autoAssignReviews: template.autoAssignReviews ?? false,
        isActive: template.isActive ?? true,
        isDefault: template.isDefault ?? false,
      });
    }
  }, [template]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!template) return;

    try {
      setLoading(true);

      const response = await fetch(`/api/hr/performance/templates/${template.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update template');
      }

      toast({
        title: 'Success',
        description: 'Performance template updated successfully',
      });

      onSuccess();
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update template',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRatingLabel = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      ratingScale: {
        ...prev.ratingScale,
        labels: prev.ratingScale.labels.map((label, i) => 
          i === index ? value : label
        ),
      },
    }));
  };

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Edit Performance Template</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="rating">Rating Scale</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Annual Performance Review"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reviewType">Review Type *</Label>
                  <Select 
                    value={formData.reviewType} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, reviewType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="annual">Annual</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="probation">Probation</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency *</Label>
                  <Select 
                    value={formData.frequency} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="one-time">One-time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (days) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 1 }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the purpose and scope of this template..."
                  rows={3}
                />
              </div>

              {template.totalReviews > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> This template is currently being used in {template.totalReviews} review(s). 
                    Changes may affect existing reviews.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="rating" className="space-y-4">
              <div className="space-y-4">
                <h4 className="font-medium">Rating Scale Configuration</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Minimum Rating</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.ratingScale.min}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        ratingScale: { ...prev.ratingScale, min: parseInt(e.target.value) || 1 }
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Maximum Rating</Label>
                    <Input
                      type="number"
                      min="2"
                      max="10"
                      value={formData.ratingScale.max}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        ratingScale: { ...prev.ratingScale, max: parseInt(e.target.value) || 5 }
                      }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Rating Labels</Label>
                  <div className="space-y-2">
                    {formData.ratingScale.labels.slice(0, formData.ratingScale.max).map((label, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="w-8 text-sm">{index + 1}:</span>
                        <Input
                          value={label}
                          onChange={(e) => updateRatingLabel(index, e.target.value)}
                          placeholder={`Rating ${index + 1} label`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-4">
                <h4 className="font-medium">Review Settings</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Self Review Enabled</Label>
                      <p className="text-sm text-muted-foreground">Allow employees to review themselves</p>
                    </div>
                    <Switch 
                      checked={formData.selfReviewEnabled}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, selfReviewEnabled: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Manager Review Enabled</Label>
                      <p className="text-sm text-muted-foreground">Require manager review</p>
                    </div>
                    <Switch 
                      checked={formData.managerReviewEnabled}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, managerReviewEnabled: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Peer Review Enabled</Label>
                      <p className="text-sm text-muted-foreground">Enable peer-to-peer reviews</p>
                    </div>
                    <Switch 
                      checked={formData.peerReviewEnabled}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, peerReviewEnabled: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Skip Level Review</Label>
                      <p className="text-sm text-muted-foreground">Enable skip-level manager reviews</p>
                    </div>
                    <Switch 
                      checked={formData.skipLevelReviewEnabled}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, skipLevelReviewEnabled: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto Assign Reviews</Label>
                      <p className="text-sm text-muted-foreground">Automatically assign reviews when created</p>
                    </div>
                    <Switch 
                      checked={formData.autoAssignReviews}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoAssignReviews: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Set as Default</Label>
                      <p className="text-sm text-muted-foreground">Make this the default template</p>
                    </div>
                    <Switch 
                      checked={formData.isDefault}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDefault: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Active</Label>
                      <p className="text-sm text-muted-foreground">Template is available for use</p>
                    </div>
                    <Switch 
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Updating...' : 'Update Template'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
