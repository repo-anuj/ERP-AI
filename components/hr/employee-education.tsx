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
import { useToast } from "@/components/ui/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Plus, Edit, Trash2, GraduationCap } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Education record schema
const educationSchema = z.object({
  institution: z.string().min(1, "Institution name is required"),
  degree: z.string().min(1, "Degree is required"),
  fieldOfStudy: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  gpa: z.string().optional(),
  description: z.string().optional(),
});

type EducationFormData = z.infer<typeof educationSchema>;

interface EducationRecord {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startDate?: Date;
  endDate?: Date;
  gpa?: string;
  description?: string;
}

interface EmployeeEducationProps {
  employeeId: string;
}

export function EmployeeEducation({ employeeId }: EmployeeEducationProps) {
  const { toast } = useToast();
  const [educationRecords, setEducationRecords] = useState<EducationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<EducationRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EducationFormData>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      institution: "",
      degree: "",
      fieldOfStudy: "",
      gpa: "",
      description: "",
    },
  });

  // Fetch education records
  const fetchEducationRecords = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/employees/${employeeId}/education`);
      if (response.ok) {
        const data = await response.json();
        setEducationRecords(data);
      } else {
        console.error('Failed to fetch education records');
      }
    } catch (error) {
      console.error('Error fetching education records:', error);
      toast({
        title: "Error",
        description: "Failed to load education records",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEducationRecords();
  }, [employeeId]);

  // Handle form submission
  const onSubmit = async (data: EducationFormData) => {
    try {
      setIsSubmitting(true);
      const url = editingRecord 
        ? `/api/employees/${employeeId}/education/${editingRecord.id}`
        : `/api/employees/${employeeId}/education`;
      
      const method = editingRecord ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Education record ${editingRecord ? 'updated' : 'added'} successfully`,
        });
        setIsDialogOpen(false);
        setEditingRecord(null);
        form.reset();
        fetchEducationRecords();
      } else {
        throw new Error('Failed to save education record');
      }
    } catch (error) {
      console.error('Error saving education record:', error);
      toast({
        title: "Error",
        description: "Failed to save education record",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this education record?')) {
      return;
    }

    try {
      const response = await fetch(`/api/employees/${employeeId}/education/${recordId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Education record deleted successfully",
        });
        fetchEducationRecords();
      } else {
        throw new Error('Failed to delete education record');
      }
    } catch (error) {
      console.error('Error deleting education record:', error);
      toast({
        title: "Error",
        description: "Failed to delete education record",
        variant: "destructive",
      });
    }
  };

  // Handle edit
  const handleEdit = (record: EducationRecord) => {
    setEditingRecord(record);
    form.reset({
      institution: record.institution,
      degree: record.degree,
      fieldOfStudy: record.fieldOfStudy || "",
      startDate: record.startDate ? new Date(record.startDate) : undefined,
      endDate: record.endDate ? new Date(record.endDate) : undefined,
      gpa: record.gpa || "",
      description: record.description || "",
    });
    setIsDialogOpen(true);
  };

  // Handle add new
  const handleAddNew = () => {
    setEditingRecord(null);
    form.reset();
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <GraduationCap className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p>Loading education records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Education Records</h3>
          <p className="text-sm text-muted-foreground">
            Manage employee's educational background and qualifications
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Education
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingRecord ? 'Edit Education Record' : 'Add Education Record'}
              </DialogTitle>
              <DialogDescription>
                {editingRecord 
                  ? 'Update the education record details below.'
                  : 'Add a new education record for this employee.'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="institution">Institution *</Label>
                  <Input 
                    id="institution" 
                    {...form.register("institution")}
                    placeholder="University/College name"
                  />
                  {form.formState.errors.institution && (
                    <p className="text-red-500 text-sm">{form.formState.errors.institution.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="degree">Degree *</Label>
                  <Input 
                    id="degree" 
                    {...form.register("degree")}
                    placeholder="Bachelor's, Master's, PhD, etc."
                  />
                  {form.formState.errors.degree && (
                    <p className="text-red-500 text-sm">{form.formState.errors.degree.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fieldOfStudy">Field of Study</Label>
                  <Input 
                    id="fieldOfStudy" 
                    {...form.register("fieldOfStudy")}
                    placeholder="Computer Science, Business, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gpa">GPA/Grade</Label>
                  <Input 
                    id="gpa" 
                    {...form.register("gpa")}
                    placeholder="3.8, First Class, etc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    {...form.register("startDate", {
                      setValueAs: (value) => value ? new Date(value) : undefined
                    })}
                    defaultValue={form.watch("startDate") ? format(form.watch("startDate")!, "yyyy-MM-dd") : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    {...form.register("endDate", {
                      setValueAs: (value) => value ? new Date(value) : undefined
                    })}
                    defaultValue={form.watch("endDate") ? format(form.watch("endDate")!, "yyyy-MM-dd") : ""}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  {...form.register("description")}
                  placeholder="Additional details about the education..."
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : (editingRecord ? 'Update' : 'Add')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {educationRecords.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Education Records</h3>
            <p className="text-muted-foreground text-center mb-4">
              No education records have been added for this employee yet.
            </p>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Education Record
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {educationRecords.map((record) => (
            <Card key={record.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{record.degree}</CardTitle>
                    <CardDescription className="text-base font-medium">
                      {record.institution}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(record)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(record.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {record.fieldOfStudy && (
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{record.fieldOfStudy}</Badge>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    {record.startDate && (
                      <span>
                        {format(new Date(record.startDate), "MMM yyyy")}
                      </span>
                    )}
                    {record.startDate && record.endDate && <span>-</span>}
                    {record.endDate && (
                      <span>
                        {format(new Date(record.endDate), "MMM yyyy")}
                      </span>
                    )}
                    {record.gpa && (
                      <Badge variant="outline">GPA: {record.gpa}</Badge>
                    )}
                  </div>
                  
                  {record.description && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {record.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
