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
import { useToast } from "@/components/ui/use-toast";
import { Package, Plus, Package as Gift } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const manualRewardSchema = z.object({
  rewardTypeId: z.string().min(1, "Please select a reward type"),
  reason: z.string().min(1, "Please provide a reason for this reward"),
});

type ManualRewardFormData = z.infer<typeof manualRewardSchema>;

interface RewardType {
  id: string;
  name: string;
  description?: string;
  category: string;
  pointValue: number;
  icon?: string;
  color?: string;
  isActive: boolean;
}

interface ManualRewardAwardProps {
  employeeId: string;
  employeeName: string;
  onRewardAwarded?: () => void;
}

export function ManualRewardAward({ employeeId, employeeName, onRewardAwarded }: ManualRewardAwardProps) {
  const { toast } = useToast();
  const [rewardTypes, setRewardTypes] = useState<RewardType[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<ManualRewardFormData>({
    resolver: zodResolver(manualRewardSchema),
    defaultValues: {
      rewardTypeId: "",
      reason: "",
    },
  });

  // Fetch reward types
  const fetchRewardTypes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/rewards/types');
      if (response.ok) {
        const data = await response.json();
        setRewardTypes(data.filter((rt: RewardType) => rt.isActive));
      } else {
        throw new Error('Failed to fetch reward types');
      }
    } catch (error) {
      console.error('Error fetching reward types:', error);
      toast({
        title: "Error",
        description: "Failed to load reward types",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isDialogOpen) {
      fetchRewardTypes();
    }
  }, [isDialogOpen]);

  const onSubmit = async (data: ManualRewardFormData) => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/employees/${employeeId}/rewards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const reward = await response.json();
        const rewardType = rewardTypes.find(rt => rt.id === data.rewardTypeId);
        
        toast({
          title: "Reward Awarded!",
          description: `${employeeName} has been awarded ${rewardType?.pointValue} points for ${rewardType?.name}`,
        });
        
        setIsDialogOpen(false);
        form.reset();
        onRewardAwarded?.();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to award reward');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to award reward",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedRewardType = rewardTypes.find(rt => rt.id === form.watch("rewardTypeId"));

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center space-x-2">
          <Gift className="h-4 w-4" />
          <span>Award Reward</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Award Manual Reward</DialogTitle>
          <DialogDescription>
            Award a manual reward to {employeeName} for exceptional performance or achievement.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Gift className="h-8 w-8 animate-pulse mx-auto mb-2" />
              <p>Loading reward types...</p>
            </div>
          </div>
        ) : rewardTypes.length === 0 ? (
          <div className="text-center py-8">
            <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Reward Types Available</h3>
            <p className="text-muted-foreground">
              Please create reward types in HR Settings before awarding manual rewards.
            </p>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rewardTypeId">Reward Type *</Label>
              <Select 
                onValueChange={(value) => form.setValue("rewardTypeId", value)}
                value={form.watch("rewardTypeId")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a reward type" />
                </SelectTrigger>
                <SelectContent>
                  {rewardTypes.map((rewardType) => (
                    <SelectItem key={rewardType.id} value={rewardType.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{rewardType.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {rewardType.pointValue} pts
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.rewardTypeId && (
                <p className="text-red-500 text-sm">{form.formState.errors.rewardTypeId.message}</p>
              )}
            </div>

            {selectedRewardType && (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{selectedRewardType.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedRewardType.description || 'No description available'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{selectedRewardType.pointValue} pts</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {selectedRewardType.category}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Reward *</Label>
              <Textarea 
                id="reason" 
                {...form.register("reason")}
                placeholder="Describe why this employee deserves this reward..."
                rows={3}
              />
              {form.formState.errors.reason && (
                <p className="text-red-500 text-sm">{form.formState.errors.reason.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !selectedRewardType}
              >
                {isSubmitting ? 'Awarding...' : `Award ${selectedRewardType?.pointValue || 0} Points`}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
