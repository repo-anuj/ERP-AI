"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Edit, Trash2, Shield, Calendar, FileText } from "lucide-react";

const idProofTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  isRequired: z.boolean().default(false),
  hasExpiry: z.boolean().default(false),
  format: z.string().optional(),
});

type IdProofTypeFormData = z.infer<typeof idProofTypeSchema>;

interface IdProofType {
  id: string;
  name: string;
  description?: string;
  isRequired: boolean;
  hasExpiry: boolean;
  format?: string;
  createdAt: string;
  updatedAt: string;
}

export function IdProofTypesManager() {
  const { toast } = useToast();
  const [idProofTypes, setIdProofTypes] = useState<IdProofType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<IdProofType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<IdProofTypeFormData>({
    resolver: zodResolver(idProofTypeSchema),
    defaultValues: {
      name: '',
      description: '',
      isRequired: false,
      hasExpiry: false,
      format: '',
    },
  });

  // Fetch ID proof types
  const fetchIdProofTypes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/id-proof-types');
      if (response.ok) {
        const data = await response.json();
        setIdProofTypes(data);
      } else {
        throw new Error('Failed to fetch ID proof types');
      }
    } catch (error) {
      console.error('Error fetching ID proof types:', error);
      toast({
        title: 'Error',
        description: 'Failed to load ID proof types',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIdProofTypes();
  }, []);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isDialogOpen) {
      if (editingType) {
        form.reset({
          name: editingType.name,
          description: editingType.description || '',
          isRequired: editingType.isRequired,
          hasExpiry: editingType.hasExpiry,
          format: editingType.format || '',
        });
      } else {
        form.reset({
          name: '',
          description: '',
          isRequired: false,
          hasExpiry: false,
          format: '',
        });
      }
    }
  }, [isDialogOpen, editingType, form]);

  const onSubmit = async (data: IdProofTypeFormData) => {
    setIsSubmitting(true);
    try {
      const url = editingType ? '/api/id-proof-types' : '/api/id-proof-types';
      const method = editingType ? 'PUT' : 'POST';
      const payload = editingType ? { ...data, id: editingType.id } : data;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save ID proof type');
      }

      toast({
        title: 'Success',
        description: `ID proof type ${editingType ? 'updated' : 'created'} successfully`,
      });

      setIsDialogOpen(false);
      setEditingType(null);
      fetchIdProofTypes();
    } catch (error: any) {
      console.error('Error saving ID proof type:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save ID proof type',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (type: IdProofType) => {
    setEditingType(type);
    setIsDialogOpen(true);
  };

  const handleDelete = async (type: IdProofType) => {
    if (!confirm(`Are you sure you want to delete "${type.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/id-proof-types?id=${type.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete ID proof type');
      }

      toast({
        title: 'Success',
        description: 'ID proof type deleted successfully',
      });

      fetchIdProofTypes();
    } catch (error) {
      console.error('Error deleting ID proof type:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete ID proof type',
        variant: 'destructive',
      });
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingType(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">ID Proof Types</h3>
          <p className="text-sm text-muted-foreground">
            Manage the types of ID proofs your company requires from employees
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add ID Proof Type
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingType ? 'Edit ID Proof Type' : 'Add ID Proof Type'}
              </DialogTitle>
              <DialogDescription>
                Configure a new type of ID proof that employees can provide
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Social Security Number, Passport, Aadhar Card"
                  {...form.register('name')}
                />
                {form.formState.errors.name && (
                  <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of this ID proof type"
                  {...form.register('description')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="format">Format (Regex Pattern)</Label>
                <Input
                  id="format"
                  placeholder="e.g., ^\d{3}-\d{2}-\d{4}$ for SSN format"
                  {...form.register('format')}
                />
                <p className="text-xs text-muted-foreground">
                  Optional regex pattern to validate the format of this ID proof
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isRequired"
                  checked={form.watch('isRequired')}
                  onCheckedChange={(checked) => form.setValue('isRequired', checked)}
                />
                <Label htmlFor="isRequired">Required for all employees</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="hasExpiry"
                  checked={form.watch('hasExpiry')}
                  onCheckedChange={(checked) => form.setValue('hasExpiry', checked)}
                />
                <Label htmlFor="hasExpiry">Has expiry date</Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingType ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ID Proof Types List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">Loading ID proof types...</p>
          </div>
        ) : idProofTypes.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No ID proof types configured</p>
            <p className="text-sm text-muted-foreground">
              Add ID proof types to start collecting secure employee identification
            </p>
          </div>
        ) : (
          idProofTypes.map((type) => (
            <Card key={type.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{type.name}</CardTitle>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(type)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(type)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {type.description && (
                  <CardDescription>{type.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {type.isRequired && (
                    <Badge variant="destructive" className="text-xs">
                      Required
                    </Badge>
                  )}
                  {type.hasExpiry && (
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      Has Expiry
                    </Badge>
                  )}
                  {type.format && (
                    <Badge variant="outline" className="text-xs">
                      <FileText className="h-3 w-3 mr-1" />
                      Validated
                    </Badge>
                  )}
                </div>
                {type.format && (
                  <p className="text-xs text-muted-foreground font-mono">
                    Format: {type.format}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
