'use client';

import { useState } from 'react';
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
import { Plus, Trash2, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { z } from 'zod';

interface CreateTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Section {
  id: string;
  name: string;
  description: string;
  weight: number;
  criteria: Criteria[];
}

interface Criteria {
  id: string;
  name: string;
  description: string;
  weight: number;
}

const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  reviewType: z.string().min(1, "Review type is required"),
  frequency: z.string().min(1, "Frequency is required"),
  duration: z.number().min(1, "Duration must be at least 1 day"),
  sections: z.array(z.any()).default([]),
  ratingScale: z.object({
    min: z.number().default(1),
    max: z.number().default(5),
    labels: z.array(z.string()).default(["Poor", "Below Average", "Average", "Good", "Excellent"]),
  }),
  selfReviewEnabled: z.boolean().default(true),
  managerReviewEnabled: z.boolean().default(true),
  peerReviewEnabled: z.boolean().default(false),
  skipLevelReviewEnabled: z.boolean().default(false),
  autoAssignReviews: z.boolean().default(false),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

export function CreateTemplateDialog({ open, onClose, onSuccess }: CreateTemplateDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    reviewType: 'annual',
    frequency: 'yearly',
    duration: 30,
    sections: [] as Section[],
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Validate form data
      const validatedData = templateSchema.parse(formData);

      const response = await fetch('/api/hr/performance/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create template');
      }

      toast({
        title: 'Success',
        description: 'Performance template created successfully',
      });

      onSuccess();
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create template',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addSection = () => {
    const newSection: Section = {
      id: `section_${Date.now()}`,
      name: '',
      description: '',
      weight: 0,
      criteria: [],
    };
    setFormData(prev => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));
  };

  const removeSection = (sectionId: string) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== sectionId),
    }));
  };

  const updateSection = (sectionId: string, updates: Partial<Section>) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(s => 
        s.id === sectionId ? { ...s, ...updates } : s
      ),
    }));
  };

  const addCriteria = (sectionId: string) => {
    const newCriteria: Criteria = {
      id: `criteria_${Date.now()}`,
      name: '',
      description: '',
      weight: 0,
    };
    
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(s => 
        s.id === sectionId 
          ? { ...s, criteria: [...s.criteria, newCriteria] }
          : s
      ),
    }));
  };

  const removeCriteria = (sectionId: string, criteriaId: string) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(s => 
        s.id === sectionId 
          ? { ...s, criteria: s.criteria.filter(c => c.id !== criteriaId) }
          : s
      ),
    }));
  };

  const updateCriteria = (sectionId: string, criteriaId: string, updates: Partial<Criteria>) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(s => 
        s.id === sectionId 
          ? { 
              ...s, 
              criteria: s.criteria.map(c => 
                c.id === criteriaId ? { ...c, ...updates } : c
              )
            }
          : s
      ),
    }));
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Create Performance Template</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="sections">Sections</TabsTrigger>
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
            </TabsContent>

            <TabsContent value="sections" className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Review Sections</h4>
                <Button type="button" variant="outline" onClick={addSection}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Section
                </Button>
              </div>

              {formData.sections.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-muted-foreground">No sections added yet. Click "Add Section" to get started.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {formData.sections.map((section) => (
                    <div key={section.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium">Section</h5>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeSection(section.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Section Name</Label>
                          <Input
                            value={section.name}
                            onChange={(e) => updateSection(section.id, { name: e.target.value })}
                            placeholder="e.g., Technical Skills"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Weight (%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={section.weight}
                            onChange={(e) => updateSection(section.id, { weight: parseInt(e.target.value) || 0 })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Actions</Label>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => addCriteria(section.id)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Criteria
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={section.description}
                          onChange={(e) => updateSection(section.id, { description: e.target.value })}
                          placeholder="Describe what this section evaluates..."
                          rows={2}
                        />
                      </div>

                      {section.criteria.length > 0 && (
                        <div className="space-y-2">
                          <Label>Criteria</Label>
                          <div className="space-y-2">
                            {section.criteria.map((criteria) => (
                              <div key={criteria.id} className="flex items-center gap-2 p-2 border rounded">
                                <Input
                                  value={criteria.name}
                                  onChange={(e) => updateCriteria(section.id, criteria.id, { name: e.target.value })}
                                  placeholder="Criteria name"
                                  className="flex-1"
                                />
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={criteria.weight}
                                  onChange={(e) => updateCriteria(section.id, criteria.id, { weight: parseInt(e.target.value) || 0 })}
                                  placeholder="Weight"
                                  className="w-20"
                                />
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => removeCriteria(section.id, criteria.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
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
              {loading ? 'Creating...' : 'Create Template'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
