'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import {
  Plus,
  Search,
  Filter,
  Copy,
  Edit,
  Trash2,
  Eye,
  Star,
  Clock,
  Users,
  Target,
  Briefcase,
  Globe,
  Building
} from 'lucide-react';
import { CreateTemplateDialog } from './create-template-dialog';

interface ProjectTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  industry: string;
  type: string;
  isPublic: boolean;
  estimatedDuration?: number;
  estimatedHours?: number;
  defaultBudget?: number;
  priority: string;
  riskLevel: string;
  objectives?: string;
  deliverables?: string;
  successCriteria?: string;
  tags: string[];
  milestones: any[];
  tasks: any[];
  requiredRoles: string[];
  requiredSkills: string[];
  teamSize?: number;
  usageCount: number;
  lastUsed?: string;
  createdByName?: string;
  createdAt: string;
  version: string;
}

interface TemplateManagerProps {
  onSelectTemplate?: (template: ProjectTemplate) => void;
  onCreateFromTemplate?: (template: ProjectTemplate) => void;
  showActions?: boolean;
}

export function TemplateManager({ 
  onSelectTemplate, 
  onCreateFromTemplate, 
  showActions = true 
}: TemplateManagerProps) {
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<ProjectTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [includePublic, setIncludePublic] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filters, setFilters] = useState<{categories: string[], industries: string[]}>({
    categories: [],
    industries: []
  });
  
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, [includePublic]);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchTerm, categoryFilter, industryFilter, typeFilter]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (includePublic) params.append('includePublic', 'true');
      
      const response = await fetch(`/api/projects/templates?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setTemplates(data.templates);
        setFilters(data.filters);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch templates",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch templates",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(term) ||
        template.description?.toLowerCase().includes(term) ||
        template.category.toLowerCase().includes(term) ||
        template.industry.toLowerCase().includes(term) ||
        template.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(template => template.category === categoryFilter);
    }

    // Industry filter
    if (industryFilter !== 'all') {
      filtered = filtered.filter(template => template.industry === industryFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(template => template.type === typeFilter);
    }

    setFilteredTemplates(filtered);
  };

  const handleUseTemplate = (template: ProjectTemplate) => {
    if (onCreateFromTemplate) {
      onCreateFromTemplate(template);
    } else {
      toast({
        title: "Template Selected",
        description: `Using template: ${template.name}`,
      });
    }
  };

  const handlePreviewTemplate = (template: ProjectTemplate) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Project Templates</h2>
          <p className="text-muted-foreground">
            Choose from pre-built templates to quickly start new projects
          </p>
        </div>
        {showActions && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {filters.categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {filters.industries.map(industry => (
                  <SelectItem key={industry} value={industry}>
                    {industry.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="research">Research</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="includePublic"
                checked={includePublic}
                onChange={(e) => setIncludePublic(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="includePublic" className="text-sm">
                Include public templates
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {template.name}
                    {template.isPublic && (
                      <Globe className="h-4 w-4 text-blue-500" />
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {template.description || 'No description available'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-muted-foreground">{template.usageCount}</span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Template Info */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{template.category.replace('_', ' ')}</Badge>
                <Badge variant="outline">{template.industry}</Badge>
                <Badge variant={getPriorityColor(template.priority)}>{template.priority}</Badge>
                <Badge variant={getRiskColor(template.riskLevel)}>{template.riskLevel} risk</Badge>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {template.estimatedDuration && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{template.estimatedDuration} days</span>
                  </div>
                )}
                {template.teamSize && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{template.teamSize} members</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span>{template.milestones.length} milestones</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>{template.tasks.length} tasks</span>
                </div>
              </div>

              {/* Tags */}
              {template.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {template.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {template.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{template.tags.length - 3} more
                    </Badge>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  onClick={() => handleUseTemplate(template)}
                  className="flex-1"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Use Template
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handlePreviewTemplate(template)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                {showActions && !template.isPublic && (
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No templates found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || categoryFilter !== 'all' || industryFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your filters to see more templates.'
                : 'Create your first template to get started.'}
            </p>
            {showActions && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Template
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Template Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTemplate?.name}
              {selectedTemplate?.isPublic && (
                <Globe className="h-5 w-5 text-blue-500" />
              )}
            </DialogTitle>
            <DialogDescription>
              Template preview and details
            </DialogDescription>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-6">
              {/* Template Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Template Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Category:</strong> {selectedTemplate.category}</div>
                    <div><strong>Industry:</strong> {selectedTemplate.industry}</div>
                    <div><strong>Type:</strong> {selectedTemplate.type}</div>
                    <div><strong>Priority:</strong> {selectedTemplate.priority}</div>
                    <div><strong>Risk Level:</strong> {selectedTemplate.riskLevel}</div>
                    {selectedTemplate.estimatedDuration && (
                      <div><strong>Duration:</strong> {selectedTemplate.estimatedDuration} days</div>
                    )}
                    {selectedTemplate.estimatedHours && (
                      <div><strong>Estimated Hours:</strong> {selectedTemplate.estimatedHours}</div>
                    )}
                    {selectedTemplate.defaultBudget && (
                      <div><strong>Default Budget:</strong> ${selectedTemplate.defaultBudget}</div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Usage Statistics</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Times Used:</strong> {selectedTemplate.usageCount}</div>
                    <div><strong>Version:</strong> {selectedTemplate.version}</div>
                    <div><strong>Created By:</strong> {selectedTemplate.createdByName || 'Unknown'}</div>
                    <div><strong>Created:</strong> {new Date(selectedTemplate.createdAt).toLocaleDateString()}</div>
                    {selectedTemplate.lastUsed && (
                      <div><strong>Last Used:</strong> {new Date(selectedTemplate.lastUsed).toLocaleDateString()}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description and Objectives */}
              {(selectedTemplate.description || selectedTemplate.objectives) && (
                <div>
                  <h4 className="font-medium mb-2">Description & Objectives</h4>
                  {selectedTemplate.description && (
                    <p className="text-sm text-muted-foreground mb-2">{selectedTemplate.description}</p>
                  )}
                  {selectedTemplate.objectives && (
                    <div>
                      <strong className="text-sm">Objectives:</strong>
                      <p className="text-sm mt-1">{selectedTemplate.objectives}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Deliverables and Success Criteria */}
              {(selectedTemplate.deliverables || selectedTemplate.successCriteria) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedTemplate.deliverables && (
                    <div>
                      <h4 className="font-medium mb-2">Key Deliverables</h4>
                      <p className="text-sm">{selectedTemplate.deliverables}</p>
                    </div>
                  )}
                  {selectedTemplate.successCriteria && (
                    <div>
                      <h4 className="font-medium mb-2">Success Criteria</h4>
                      <p className="text-sm">{selectedTemplate.successCriteria}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Milestones */}
              {selectedTemplate.milestones.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Predefined Milestones ({selectedTemplate.milestones.length})</h4>
                  <div className="space-y-2">
                    {selectedTemplate.milestones.map((milestone: any, index: number) => (
                      <div key={index} className="border rounded p-3">
                        <div className="font-medium">{milestone.name}</div>
                        {milestone.description && (
                          <div className="text-sm text-muted-foreground">{milestone.description}</div>
                        )}
                        {milestone.estimatedDays && (
                          <div className="text-sm">Estimated: {milestone.estimatedDays} days</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks */}
              {selectedTemplate.tasks.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Predefined Tasks ({selectedTemplate.tasks.length})</h4>
                  <div className="space-y-2">
                    {selectedTemplate.tasks.slice(0, 5).map((task: any, index: number) => (
                      <div key={index} className="border rounded p-3">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{task.name}</div>
                          <Badge variant={getPriorityColor(task.priority)}>{task.priority}</Badge>
                        </div>
                        {task.description && (
                          <div className="text-sm text-muted-foreground mt-1">{task.description}</div>
                        )}
                        {task.estimatedHours && (
                          <div className="text-sm">Estimated: {task.estimatedHours} hours</div>
                        )}
                      </div>
                    ))}
                    {selectedTemplate.tasks.length > 5 && (
                      <div className="text-sm text-muted-foreground text-center py-2">
                        ... and {selectedTemplate.tasks.length - 5} more tasks
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Required Skills and Roles */}
              {(selectedTemplate.requiredRoles.length > 0 || selectedTemplate.requiredSkills.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedTemplate.requiredRoles.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Required Roles</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedTemplate.requiredRoles.map((role, index) => (
                          <Badge key={index} variant="outline">{role}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedTemplate.requiredSkills.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Required Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedTemplate.requiredSkills.map((skill, index) => (
                          <Badge key={index} variant="outline">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tags */}
              {selectedTemplate.tags.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={() => {
                  handleUseTemplate(selectedTemplate);
                  setShowPreview(false);
                }} className="flex-1">
                  <Copy className="mr-2 h-4 w-4" />
                  Use This Template
                </Button>
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Template Dialog */}
      <CreateTemplateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onTemplateCreated={() => {
          fetchTemplates();
          setShowCreateDialog(false);
        }}
      />
    </div>
  );
}
