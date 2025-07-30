"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Edit, Target, Users, TrendingUp, Star, Award } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Schemas
const performanceTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  reviewType: z.enum(["annual", "quarterly", "monthly", "probation", "custom"]).default("annual"),
  frequency: z.enum(["yearly", "quarterly", "monthly", "one-time"]).default("yearly"),
  duration: z.number().min(1, "Duration must be at least 1 day"),
  selfReviewEnabled: z.boolean().default(true),
  managerReviewEnabled: z.boolean().default(true),
  peerReviewEnabled: z.boolean().default(false),
  skipLevelReviewEnabled: z.boolean().default(false),
  autoAssignReviews: z.boolean().default(false),
});

type PerformanceTemplateFormData = z.infer<typeof performanceTemplateSchema>;

interface PerformanceTemplate {
  id: string;
  name: string;
  description?: string;
  reviewType: "annual" | "quarterly" | "monthly" | "probation" | "custom";
  frequency: "yearly" | "quarterly" | "monthly" | "one-time";
  duration: number;
  selfReviewEnabled: boolean;
  managerReviewEnabled: boolean;
  peerReviewEnabled: boolean;
  skipLevelReviewEnabled: boolean;
  autoAssignReviews: boolean;
  isActive: boolean;
  isDefault: boolean;
  _count: {
    performanceReviews: number;
  };
}

export function PerformanceManagement() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<PerformanceTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("templates");
  
  // Dialog states
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PerformanceTemplate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form
  const templateForm = useForm<PerformanceTemplateFormData>({
    resolver: zodResolver(performanceTemplateSchema),
    defaultValues: {
      name: "",
      description: "",
      reviewType: "annual",
      frequency: "yearly",
      duration: 30,
      selfReviewEnabled: true,
      managerReviewEnabled: true,
      peerReviewEnabled: false,
      skipLevelReviewEnabled: false,
      autoAssignReviews: false,
    },
  });

  // Fetch data
  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/performance/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error fetching performance templates:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await fetchTemplates();
      setIsLoading(false);
    };
    fetchData();
  }, []);

  // Handle template submission
  const onSubmitTemplate = async (data: PerformanceTemplateFormData) => {
    try {
      setIsSubmitting(true);
      
      // Create default sections and rating scale
      const templateData = {
        ...data,
        sections: [
          {
            id: "goals",
            name: "Goal Achievement",
            description: "Evaluation of goal completion and quality",
            weight: 40,
            criteria: [
              { id: "goal_completion", name: "Goal Completion Rate", description: "Percentage of goals achieved", weight: 50 },
              { id: "goal_quality", name: "Quality of Achievement", description: "How well goals were achieved", weight: 50 }
            ]
          },
          {
            id: "skills",
            name: "Skills & Competencies",
            description: "Technical and soft skills evaluation",
            weight: 30,
            criteria: [
              { id: "technical_skills", name: "Technical Skills", description: "Job-specific technical abilities", weight: 60 },
              { id: "soft_skills", name: "Soft Skills", description: "Communication, teamwork, leadership", weight: 40 }
            ]
          },
          {
            id: "behavior",
            name: "Behavioral Competencies",
            description: "Work behavior and cultural fit",
            weight: 30,
            criteria: [
              { id: "teamwork", name: "Teamwork", description: "Collaboration and team contribution", weight: 50 },
              { id: "initiative", name: "Initiative", description: "Proactiveness and self-motivation", weight: 50 }
            ]
          }
        ],
        ratingScale: {
          min: 1,
          max: 5,
          labels: ["Poor", "Below Average", "Average", "Good", "Excellent"]
        }
      };

      const url = editingTemplate 
        ? `/api/performance/templates/${editingTemplate.id}`
        : '/api/performance/templates';
      
      const method = editingTemplate ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Performance template ${editingTemplate ? 'updated' : 'created'} successfully`,
        });
        setIsTemplateDialogOpen(false);
        setEditingTemplate(null);
        templateForm.reset();
        fetchTemplates();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save performance template');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save performance template",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getReviewTypeColor = (reviewType: string) => {
    const colors = {
      annual: "bg-blue-100 text-blue-800",
      quarterly: "bg-green-100 text-green-800",
      monthly: "bg-purple-100 text-purple-800",
      probation: "bg-orange-100 text-orange-800",
      custom: "bg-gray-100 text-gray-800",
    };
    return colors[reviewType as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Target className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p>Loading performance management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Management</h2>
          <p className="text-muted-foreground">
            Manage performance reviews, goals, and employee development
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Target className="h-3 w-3" />
            <span>{templates.length} Templates</span>
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Templates</span>
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center space-x-2">
            <Star className="h-4 w-4" />
            <span>Reviews</span>
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center space-x-2">
            <Award className="h-4 w-4" />
            <span>Goals</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Performance Review Templates</h3>
            <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingTemplate(null);
                  templateForm.reset();
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Template
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingTemplate ? 'Edit Performance Template' : 'Add New Performance Template'}
                  </DialogTitle>
                  <DialogDescription>
                    Configure performance review template settings and workflow.
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={templateForm.handleSubmit(onSubmitTemplate)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Template Name *</Label>
                      <Input 
                        id="name" 
                        {...templateForm.register("name")}
                        placeholder="Annual Performance Review"
                      />
                      {templateForm.formState.errors.name && (
                        <p className="text-red-500 text-sm">{templateForm.formState.errors.name.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reviewType">Review Type *</Label>
                      <Select 
                        onValueChange={(value) => templateForm.setValue("reviewType", value as any)}
                        value={templateForm.watch("reviewType")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select review type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="annual">Annual Review</SelectItem>
                          <SelectItem value="quarterly">Quarterly Review</SelectItem>
                          <SelectItem value="monthly">Monthly Check-in</SelectItem>
                          <SelectItem value="probation">Probation Review</SelectItem>
                          <SelectItem value="custom">Custom Review</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      {...templateForm.register("description")}
                      placeholder="Describe this performance review template..."
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="frequency">Frequency</Label>
                      <Select 
                        onValueChange={(value) => templateForm.setValue("frequency", value as any)}
                        value={templateForm.watch("frequency")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
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
                      <Label htmlFor="duration">Duration (Days)</Label>
                      <Input 
                        id="duration" 
                        type="number"
                        {...templateForm.register("duration", { valueAsNumber: true })}
                        placeholder="30"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Review Participants</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="selfReviewEnabled"
                          {...templateForm.register("selfReviewEnabled")}
                          className="rounded"
                        />
                        <Label htmlFor="selfReviewEnabled">Self Review</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="managerReviewEnabled"
                          {...templateForm.register("managerReviewEnabled")}
                          className="rounded"
                        />
                        <Label htmlFor="managerReviewEnabled">Manager Review</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="peerReviewEnabled"
                          {...templateForm.register("peerReviewEnabled")}
                          className="rounded"
                        />
                        <Label htmlFor="peerReviewEnabled">Peer Review</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="skipLevelReviewEnabled"
                          {...templateForm.register("skipLevelReviewEnabled")}
                          className="rounded"
                        />
                        <Label htmlFor="skipLevelReviewEnabled">Skip Level Review</Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="autoAssignReviews"
                      {...templateForm.register("autoAssignReviews")}
                      className="rounded"
                    />
                    <Label htmlFor="autoAssignReviews">Auto-assign reviews based on schedule</Label>
                  </div>

                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsTemplateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : (editingTemplate ? 'Update' : 'Create')}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {templates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Performance Templates</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first performance review template to start managing employee performance.
                </p>
                <Button onClick={() => setIsTemplateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <Card key={template.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {template.description || 'No description'}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingTemplate(template);
                          templateForm.reset(template);
                          setIsTemplateDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge className={getReviewTypeColor(template.reviewType)}>
                          {template.reviewType}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {template.frequency}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Duration</span>
                          <p className="font-medium">{template.duration} days</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Reviews</span>
                          <p className="font-medium">{template._count.performanceReviews}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {template.selfReviewEnabled && (
                          <Badge variant="secondary" className="text-xs">Self Review</Badge>
                        )}
                        {template.managerReviewEnabled && (
                          <Badge variant="secondary" className="text-xs">Manager Review</Badge>
                        )}
                        {template.peerReviewEnabled && (
                          <Badge variant="secondary" className="text-xs">Peer Review</Badge>
                        )}
                        {template.autoAssignReviews && (
                          <Badge variant="secondary" className="text-xs">Auto-assign</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Star className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Performance Reviews Coming Soon</h3>
              <p className="text-muted-foreground text-center">
                Performance review management will be available in the next update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Award className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Goal Management Coming Soon</h3>
              <p className="text-muted-foreground text-center">
                Goal setting and tracking will be available in the next update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Performance Analytics Coming Soon</h3>
              <p className="text-muted-foreground text-center">
                Performance analytics and insights will be available in the next update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
