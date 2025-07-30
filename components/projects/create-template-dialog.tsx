'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Plus, X, Target, Briefcase, Users, Clock } from 'lucide-react';

interface CreateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTemplateCreated: () => void;
}

interface Milestone {
  name: string;
  description: string;
  estimatedDays: number;
  deliverables: string;
}

interface Task {
  name: string;
  description: string;
  estimatedHours: number;
  priority: 'low' | 'medium' | 'high';
  requiredSkills: string[];
  dependencies: string[];
}

export function CreateTemplateDialog({ open, onOpenChange, onTemplateCreated }: CreateTemplateDialogProps) {
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState('basic');
  
  // Basic Information
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [industry, setIndustry] = useState('');
  const [type, setType] = useState<'internal' | 'client' | 'research' | 'maintenance'>('internal');
  const [isPublic, setIsPublic] = useState(false);
  
  // Configuration
  const [estimatedDuration, setEstimatedDuration] = useState<number | ''>('');
  const [estimatedHours, setEstimatedHours] = useState<number | ''>('');
  const [defaultBudget, setDefaultBudget] = useState<number | ''>('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('medium');
  
  // Content
  const [objectives, setObjectives] = useState('');
  const [deliverables, setDeliverables] = useState('');
  const [successCriteria, setSuccessCriteria] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  // Milestones
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [currentMilestone, setCurrentMilestone] = useState<Milestone>({
    name: '',
    description: '',
    estimatedDays: 0,
    deliverables: ''
  });
  
  // Tasks
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTask, setCurrentTask] = useState<Task>({
    name: '',
    description: '',
    estimatedHours: 0,
    priority: 'medium',
    requiredSkills: [],
    dependencies: []
  });
  
  // Skills and Roles
  const [requiredRoles, setRequiredRoles] = useState<string[]>([]);
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [teamSize, setTeamSize] = useState<number | ''>('');
  const [roleInput, setRoleInput] = useState('');
  const [skillInput, setSkillInput] = useState('');
  
  const { toast } = useToast();

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleAddMilestone = () => {
    if (currentMilestone.name.trim()) {
      setMilestones([...milestones, { ...currentMilestone }]);
      setCurrentMilestone({
        name: '',
        description: '',
        estimatedDays: 0,
        deliverables: ''
      });
    }
  };

  const handleRemoveMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const handleAddTask = () => {
    if (currentTask.name.trim()) {
      setTasks([...tasks, { ...currentTask }]);
      setCurrentTask({
        name: '',
        description: '',
        estimatedHours: 0,
        priority: 'medium',
        requiredSkills: [],
        dependencies: []
      });
    }
  };

  const handleRemoveTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleAddRole = () => {
    if (roleInput.trim() && !requiredRoles.includes(roleInput.trim())) {
      setRequiredRoles([...requiredRoles, roleInput.trim()]);
      setRoleInput('');
    }
  };

  const handleRemoveRole = (roleToRemove: string) => {
    setRequiredRoles(requiredRoles.filter(role => role !== roleToRemove));
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !requiredSkills.includes(skillInput.trim())) {
      setRequiredSkills([...requiredSkills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setRequiredSkills(requiredSkills.filter(skill => skill !== skillToRemove));
  };

  const handleSubmit = async () => {
    if (!name.trim() || !category.trim() || !industry.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Name, Category, Industry)",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const templateData = {
        name: name.trim(),
        description: description.trim(),
        category: category.trim(),
        industry: industry.trim(),
        type,
        isPublic,
        estimatedDuration: estimatedDuration || undefined,
        estimatedHours: estimatedHours || undefined,
        defaultBudget: defaultBudget || undefined,
        priority,
        riskLevel,
        objectives: objectives.trim(),
        deliverables: deliverables.trim(),
        successCriteria: successCriteria.trim(),
        notes: notes.trim(),
        tags,
        milestones,
        tasks,
        requiredRoles,
        requiredSkills,
        teamSize: teamSize || undefined
      };

      const response = await fetch('/api/projects/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(templateData)
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Template created successfully"
        });
        onTemplateCreated();
        resetForm();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create template",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setCategory('');
    setIndustry('');
    setType('internal');
    setIsPublic(false);
    setEstimatedDuration('');
    setEstimatedHours('');
    setDefaultBudget('');
    setPriority('medium');
    setRiskLevel('medium');
    setObjectives('');
    setDeliverables('');
    setSuccessCriteria('');
    setNotes('');
    setTags([]);
    setTagInput('');
    setMilestones([]);
    setCurrentMilestone({ name: '', description: '', estimatedDays: 0, deliverables: '' });
    setTasks([]);
    setCurrentTask({ name: '', description: '', estimatedHours: 0, priority: 'medium', requiredSkills: [], dependencies: [] });
    setRequiredRoles([]);
    setRequiredSkills([]);
    setTeamSize('');
    setRoleInput('');
    setSkillInput('');
    setCurrentTab('basic');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Project Template</DialogTitle>
          <DialogDescription>
            Create a reusable template for future projects
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid grid-cols-5 mb-6">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., E-commerce Website Development"
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., web_development, mobile_app, marketing"
                />
              </div>
              
              <div>
                <Label htmlFor="industry">Industry *</Label>
                <Input
                  id="industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g., technology, healthcare, finance"
                />
              </div>
              
              <div>
                <Label htmlFor="type">Project Type</Label>
                <Select value={type} onValueChange={(value: any) => setType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="research">Research</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this template..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="riskLevel">Risk Level</Label>
                <Select value={riskLevel} onValueChange={(value: any) => setRiskLevel(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Risk</SelectItem>
                    <SelectItem value="medium">Medium Risk</SelectItem>
                    <SelectItem value="high">High Risk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="isPublic"
                  checked={isPublic}
                  onCheckedChange={(checked) => setIsPublic(checked as boolean)}
                />
                <Label htmlFor="isPublic">Make template public</Label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="estimatedDuration">Estimated Duration (days)</Label>
                <Input
                  id="estimatedDuration"
                  type="number"
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(e.target.value ? parseInt(e.target.value) : '')}
                  placeholder="30"
                />
              </div>
              
              <div>
                <Label htmlFor="estimatedHours">Estimated Hours</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value ? parseFloat(e.target.value) : '')}
                  placeholder="240"
                />
              </div>
              
              <div>
                <Label htmlFor="defaultBudget">Default Budget</Label>
                <Input
                  id="defaultBudget"
                  type="number"
                  value={defaultBudget}
                  onChange={(e) => setDefaultBudget(e.target.value ? parseFloat(e.target.value) : '')}
                  placeholder="50000"
                />
              </div>
            </div>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-4">
            <div>
              <Label htmlFor="objectives">Project Objectives</Label>
              <Textarea
                id="objectives"
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
                placeholder="What are the main objectives of this project?"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="deliverables">Key Deliverables</Label>
              <Textarea
                id="deliverables"
                value={deliverables}
                onChange={(e) => setDeliverables(e.target.value)}
                placeholder="List the main deliverables for this project..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="successCriteria">Success Criteria</Label>
              <Textarea
                id="successCriteria"
                value={successCriteria}
                onChange={(e) => setSuccessCriteria(e.target.value)}
                placeholder="How will success be measured?"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional information or requirements..."
                rows={3}
              />
            </div>

            <div>
              <Label>Tags</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Add tag and press Enter"
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="flex items-center gap-1">
                      {tag}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Milestones Tab */}
          <TabsContent value="milestones" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Add Milestone
                </CardTitle>
                <CardDescription>
                  Define key milestones for projects using this template
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="milestoneName">Milestone Name</Label>
                    <Input
                      id="milestoneName"
                      value={currentMilestone.name}
                      onChange={(e) => setCurrentMilestone(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Design Phase Complete"
                    />
                  </div>
                  <div>
                    <Label htmlFor="milestoneEstimatedDays">Estimated Days</Label>
                    <Input
                      id="milestoneEstimatedDays"
                      type="number"
                      value={currentMilestone.estimatedDays}
                      onChange={(e) => setCurrentMilestone(prev => ({ ...prev, estimatedDays: parseInt(e.target.value) || 0 }))}
                      placeholder="7"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="milestoneDescription">Description</Label>
                  <Textarea
                    id="milestoneDescription"
                    value={currentMilestone.description}
                    onChange={(e) => setCurrentMilestone(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe this milestone..."
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="milestoneDeliverables">Deliverables</Label>
                  <Textarea
                    id="milestoneDeliverables"
                    value={currentMilestone.deliverables}
                    onChange={(e) => setCurrentMilestone(prev => ({ ...prev, deliverables: e.target.value }))}
                    placeholder="What will be delivered at this milestone?"
                    rows={2}
                  />
                </div>
                <Button type="button" onClick={handleAddMilestone} disabled={!currentMilestone.name.trim()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Milestone
                </Button>
              </CardContent>
            </Card>

            {milestones.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Added Milestones ({milestones.length})</h4>
                {milestones.map((milestone, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{milestone.name}</div>
                          {milestone.description && (
                            <div className="text-sm text-muted-foreground mt-1">{milestone.description}</div>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {milestone.estimatedDays} days
                            </div>
                          </div>
                          {milestone.deliverables && (
                            <div className="text-sm mt-2">
                              <strong>Deliverables:</strong> {milestone.deliverables}
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMilestone(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Add Task Template
                </CardTitle>
                <CardDescription>
                  Define common tasks for projects using this template
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="taskName">Task Name</Label>
                    <Input
                      id="taskName"
                      value={currentTask.name}
                      onChange={(e) => setCurrentTask(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Create wireframes"
                    />
                  </div>
                  <div>
                    <Label htmlFor="taskEstimatedHours">Estimated Hours</Label>
                    <Input
                      id="taskEstimatedHours"
                      type="number"
                      value={currentTask.estimatedHours}
                      onChange={(e) => setCurrentTask(prev => ({ ...prev, estimatedHours: parseFloat(e.target.value) || 0 }))}
                      placeholder="8"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="taskDescription">Description</Label>
                  <Textarea
                    id="taskDescription"
                    value={currentTask.description}
                    onChange={(e) => setCurrentTask(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe this task..."
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="taskPriority">Priority</Label>
                  <Select 
                    value={currentTask.priority} 
                    onValueChange={(value: any) => setCurrentTask(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" onClick={handleAddTask} disabled={!currentTask.name.trim()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Task
                </Button>
              </CardContent>
            </Card>

            {tasks.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Added Tasks ({tasks.length})</h4>
                {tasks.map((task, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-medium">{task.name}</div>
                            <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}>
                              {task.priority}
                            </Badge>
                          </div>
                          {task.description && (
                            <div className="text-sm text-muted-foreground mt-1">{task.description}</div>
                          )}
                          <div className="flex items-center gap-1 mt-2 text-sm">
                            <Clock className="h-4 w-4" />
                            {task.estimatedHours} hours
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTask(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Required Roles
                  </CardTitle>
                  <CardDescription>
                    Specify the roles needed for this project
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Input
                      value={roleInput}
                      onChange={(e) => setRoleInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRole())}
                      placeholder="e.g., Frontend Developer"
                    />
                    <Button type="button" variant="outline" onClick={handleAddRole}>
                      Add
                    </Button>
                  </div>
                  {requiredRoles.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {requiredRoles.map((role) => (
                        <Badge key={role} variant="outline" className="flex items-center gap-1">
                          {role}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => handleRemoveRole(role)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Required Skills</CardTitle>
                  <CardDescription>
                    List the skills needed for this project
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                      placeholder="e.g., React, Node.js"
                    />
                    <Button type="button" variant="outline" onClick={handleAddSkill}>
                      Add
                    </Button>
                  </div>
                  {requiredSkills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {requiredSkills.map((skill) => (
                        <Badge key={skill} variant="outline" className="flex items-center gap-1">
                          {skill}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => handleRemoveSkill(skill)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <Label htmlFor="teamSize">Recommended Team Size</Label>
              <Input
                id="teamSize"
                type="number"
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value ? parseInt(e.target.value) : '')}
                placeholder="5"
                className="max-w-xs"
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex justify-between pt-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Creating..." : "Create Template"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
