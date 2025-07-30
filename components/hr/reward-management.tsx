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
import { Plus, Edit, Trash2, Award, Star, Award as Trophy, Target, Users, TrendingUp } from "lucide-react";
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
const rewardTypeSchema = z.object({
  name: z.string().min(1, "Reward type name is required"),
  description: z.string().optional(),
  category: z.enum(["performance", "attendance", "learning", "collaboration", "innovation", "milestone"]),
  pointValue: z.number().min(1, "Point value must be at least 1"),
  icon: z.string().optional(),
  color: z.string().optional(),
});

const badgeSchema = z.object({
  name: z.string().min(1, "Badge name is required"),
  description: z.string().optional(),
  category: z.enum(["attendance", "collaboration", "innovation", "performance", "learning", "milestone"]),
  icon: z.string().min(1, "Badge icon is required"),
  color: z.string().min(1, "Badge color is required"),
  rarity: z.enum(["common", "rare", "epic", "legendary"]),
  pointsRequired: z.number().optional(),
});

type RewardTypeFormData = z.infer<typeof rewardTypeSchema>;
type BadgeFormData = z.infer<typeof badgeSchema>;

interface RewardType {
  id: string;
  name: string;
  description?: string;
  category: string;
  pointValue: number;
  icon?: string;
  color?: string;
  isActive: boolean;
  _count: { rewards: number };
}

interface BadgeType {
  id: string;
  name: string;
  description?: string;
  category: string;
  icon: string;
  color: string;
  rarity: string;
  pointsRequired?: number;
  isActive: boolean;
  _count: { employeeBadges: number };
}

export function RewardManagement() {
  const { toast } = useToast();
  const [rewardTypes, setRewardTypes] = useState<RewardType[]>([]);
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("reward-types");
  
  // Dialog states
  const [isRewardTypeDialogOpen, setIsRewardTypeDialogOpen] = useState(false);
  const [isBadgeDialogOpen, setIsBadgeDialogOpen] = useState(false);
  const [editingRewardType, setEditingRewardType] = useState<RewardType | null>(null);
  const [editingBadge, setEditingBadge] = useState<BadgeType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forms
  const rewardTypeForm = useForm<RewardTypeFormData>({
    resolver: zodResolver(rewardTypeSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "performance",
      pointValue: 10,
      icon: "",
      color: "#3B82F6",
    },
  });

  const badgeForm = useForm<BadgeFormData>({
    resolver: zodResolver(badgeSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "performance",
      icon: "🏆",
      color: "#FFD700",
      rarity: "common",
    },
  });

  // Fetch data
  const fetchRewardTypes = async () => {
    try {
      const response = await fetch('/api/rewards/types');
      if (response.ok) {
        const data = await response.json();
        setRewardTypes(data);
      }
    } catch (error) {
      console.error('Error fetching reward types:', error);
    }
  };

  const fetchBadges = async () => {
    try {
      const response = await fetch('/api/rewards/badges');
      if (response.ok) {
        const data = await response.json();
        setBadges(data);
      }
    } catch (error) {
      console.error('Error fetching badges:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([fetchRewardTypes(), fetchBadges()]);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  // Category icons and colors
  const getCategoryIcon = (category: string) => {
    const icons = {
      performance: Trophy,
      attendance: Users,
      learning: Star,
      collaboration: Users,
      innovation: Target,
      milestone: Award,
    };
    return icons[category as keyof typeof icons] || Trophy;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      performance: "bg-blue-100 text-blue-800",
      attendance: "bg-green-100 text-green-800",
      learning: "bg-purple-100 text-purple-800",
      collaboration: "bg-orange-100 text-orange-800",
      innovation: "bg-pink-100 text-pink-800",
      milestone: "bg-yellow-100 text-yellow-800",
    };
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getRarityColor = (rarity: string) => {
    const colors = {
      common: "bg-gray-100 text-gray-800",
      rare: "bg-blue-100 text-blue-800",
      epic: "bg-purple-100 text-purple-800",
      legendary: "bg-yellow-100 text-yellow-800",
    };
    return colors[rarity as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  // Handle reward type submission
  const onSubmitRewardType = async (data: RewardTypeFormData) => {
    try {
      setIsSubmitting(true);
      const url = editingRewardType 
        ? `/api/rewards/types/${editingRewardType.id}`
        : '/api/rewards/types';
      
      const method = editingRewardType ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Reward type ${editingRewardType ? 'updated' : 'created'} successfully`,
        });
        setIsRewardTypeDialogOpen(false);
        setEditingRewardType(null);
        rewardTypeForm.reset();
        fetchRewardTypes();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save reward type');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save reward type",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle badge submission
  const onSubmitBadge = async (data: BadgeFormData) => {
    try {
      setIsSubmitting(true);
      const url = editingBadge 
        ? `/api/rewards/badges/${editingBadge.id}`
        : '/api/rewards/badges';
      
      const method = editingBadge ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          criteria: {} // Default empty criteria for now
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Badge ${editingBadge ? 'updated' : 'created'} successfully`,
        });
        setIsBadgeDialogOpen(false);
        setEditingBadge(null);
        badgeForm.reset();
        fetchBadges();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save badge');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save badge",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Trophy className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p>Loading reward system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reward System Management</h2>
          <p className="text-muted-foreground">
            Configure reward types, badges, and achievements to motivate your team
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Trophy className="h-3 w-3" />
            <span>{rewardTypes.length} Reward Types</span>
          </Badge>
          <Badge variant="outline" className="flex items-center space-x-1">
            <Award className="h-3 w-3" />
            <span>{badges.length} Badges</span>
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="reward-types" className="flex items-center space-x-2">
            <Trophy className="h-4 w-4" />
            <span>Reward Types</span>
          </TabsTrigger>
          <TabsTrigger value="badges" className="flex items-center space-x-2">
            <Award className="h-4 w-4" />
            <span>Badges</span>
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Achievements</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        {/* Reward Types Tab */}
        <TabsContent value="reward-types" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Reward Types</h3>
            <Dialog open={isRewardTypeDialogOpen} onOpenChange={setIsRewardTypeDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingRewardType(null);
                  rewardTypeForm.reset();
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Reward Type
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingRewardType ? 'Edit Reward Type' : 'Add New Reward Type'}
                  </DialogTitle>
                  <DialogDescription>
                    Configure how employees earn points for different activities.
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={rewardTypeForm.handleSubmit(onSubmitRewardType)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input 
                        id="name" 
                        {...rewardTypeForm.register("name")}
                        placeholder="Task Completion"
                      />
                      {rewardTypeForm.formState.errors.name && (
                        <p className="text-red-500 text-sm">{rewardTypeForm.formState.errors.name.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pointValue">Point Value *</Label>
                      <Input 
                        id="pointValue" 
                        type="number"
                        {...rewardTypeForm.register("pointValue", { valueAsNumber: true })}
                        placeholder="10"
                      />
                      {rewardTypeForm.formState.errors.pointValue && (
                        <p className="text-red-500 text-sm">{rewardTypeForm.formState.errors.pointValue.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select 
                      onValueChange={(value) => rewardTypeForm.setValue("category", value as any)}
                      value={rewardTypeForm.watch("category")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="attendance">Attendance</SelectItem>
                        <SelectItem value="learning">Learning</SelectItem>
                        <SelectItem value="collaboration">Collaboration</SelectItem>
                        <SelectItem value="innovation">Innovation</SelectItem>
                        <SelectItem value="milestone">Milestone</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      {...rewardTypeForm.register("description")}
                      placeholder="Describe when this reward is earned..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="icon">Icon</Label>
                      <Input 
                        id="icon" 
                        {...rewardTypeForm.register("icon")}
                        placeholder="🏆"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="color">Color</Label>
                      <Input 
                        id="color" 
                        type="color"
                        {...rewardTypeForm.register("color")}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsRewardTypeDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : (editingRewardType ? 'Update' : 'Create')}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {rewardTypes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Reward Types</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first reward type to start motivating your team.
                </p>
                <Button onClick={() => setIsRewardTypeDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Reward Type
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rewardTypes.map((rewardType) => {
                const IconComponent = getCategoryIcon(rewardType.category);
                return (
                  <Card key={rewardType.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: rewardType.color || '#3B82F6', color: 'white' }}
                          >
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{rewardType.name}</CardTitle>
                            <Badge className={getCategoryColor(rewardType.category)}>
                              {rewardType.category}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingRewardType(rewardType);
                              rewardTypeForm.reset({
                                ...rewardType,
                                category: rewardType.category as "attendance" | "milestone" | "performance" | "learning" | "collaboration" | "innovation"
                              });
                              setIsRewardTypeDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Point Value</span>
                          <Badge variant="secondary">{rewardType.pointValue} pts</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Times Awarded</span>
                          <span className="text-sm font-medium">{rewardType._count.rewards}</span>
                        </div>
                        {rewardType.description && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {rewardType.description}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Badges</h3>
            <Dialog open={isBadgeDialogOpen} onOpenChange={setIsBadgeDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingBadge(null);
                  badgeForm.reset();
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Badge
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingBadge ? 'Edit Badge' : 'Add New Badge'}
                  </DialogTitle>
                  <DialogDescription>
                    Create badges that employees can earn for special achievements.
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={badgeForm.handleSubmit(onSubmitBadge)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="badgeName">Name *</Label>
                      <Input 
                        id="badgeName" 
                        {...badgeForm.register("name")}
                        placeholder="Team Player"
                      />
                      {badgeForm.formState.errors.name && (
                        <p className="text-red-500 text-sm">{badgeForm.formState.errors.name.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="badgeCategory">Category *</Label>
                      <Select 
                        onValueChange={(value) => badgeForm.setValue("category", value as any)}
                        value={badgeForm.watch("category")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="performance">Performance</SelectItem>
                          <SelectItem value="attendance">Attendance</SelectItem>
                          <SelectItem value="learning">Learning</SelectItem>
                          <SelectItem value="collaboration">Collaboration</SelectItem>
                          <SelectItem value="innovation">Innovation</SelectItem>
                          <SelectItem value="milestone">Milestone</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="badgeDescription">Description</Label>
                    <Textarea 
                      id="badgeDescription" 
                      {...badgeForm.register("description")}
                      placeholder="Describe how to earn this badge..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="badgeIcon">Icon *</Label>
                      <Input 
                        id="badgeIcon" 
                        {...badgeForm.register("icon")}
                        placeholder="🏆"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="badgeColor">Color *</Label>
                      <Input 
                        id="badgeColor" 
                        type="color"
                        {...badgeForm.register("color")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rarity">Rarity *</Label>
                      <Select 
                        onValueChange={(value) => badgeForm.setValue("rarity", value as any)}
                        value={badgeForm.watch("rarity")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select rarity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="common">Common</SelectItem>
                          <SelectItem value="rare">Rare</SelectItem>
                          <SelectItem value="epic">Epic</SelectItem>
                          <SelectItem value="legendary">Legendary</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pointsRequired">Points Required</Label>
                    <Input 
                      id="pointsRequired" 
                      type="number"
                      {...badgeForm.register("pointsRequired", { valueAsNumber: true })}
                      placeholder="100"
                    />
                  </div>

                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsBadgeDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : (editingBadge ? 'Update' : 'Create')}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {badges.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Award className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Badges</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first badge to recognize special achievements.
                </p>
                <Button onClick={() => setIsBadgeDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Badge
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {badges.map((badge) => (
                <Card key={badge.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="text-2xl p-2 rounded-lg"
                          style={{ backgroundColor: badge.color }}
                        >
                          {badge.icon}
                        </div>
                        <div>
                          <CardTitle className="text-base">{badge.name}</CardTitle>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={getCategoryColor(badge.category)}>
                              {badge.category}
                            </Badge>
                            <Badge className={getRarityColor(badge.rarity)}>
                              {badge.rarity}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingBadge(badge);
                          badgeForm.reset({
                            ...badge,
                            category: badge.category as "attendance" | "milestone" | "performance" | "learning" | "collaboration" | "innovation",
                            rarity: badge.rarity as "common" | "rare" | "epic" | "legendary"
                          });
                          setIsBadgeDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {badge.pointsRequired && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Points Required</span>
                          <Badge variant="secondary">{badge.pointsRequired} pts</Badge>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Earned By</span>
                        <span className="text-sm font-medium">{badge._count.employeeBadges} employees</span>
                      </div>
                      {badge.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {badge.description}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Achievements Coming Soon</h3>
              <p className="text-muted-foreground text-center">
                Achievement management will be available in the next update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Analytics Coming Soon</h3>
              <p className="text-muted-foreground text-center">
                Reward system analytics and insights will be available in the next update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
