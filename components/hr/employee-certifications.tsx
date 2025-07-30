"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Plus, Edit, Trash2, Award, ExternalLink } from "lucide-react";
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

// Certification record schema
const certificationSchema = z.object({
  name: z.string().min(1, "Certification name is required"),
  issuingOrg: z.string().min(1, "Issuing organization is required"),
  issueDate: z.date().optional(),
  expiryDate: z.date().optional(),
  credentialId: z.string().optional(),
  description: z.string().optional(),
});

type CertificationFormData = z.infer<typeof certificationSchema>;

interface CertificationRecord {
  id: string;
  name: string;
  issuingOrg: string;
  issueDate?: Date;
  expiryDate?: Date;
  credentialId?: string;
  description?: string;
}

interface EmployeeCertificationsProps {
  employeeId: string;
}

export function EmployeeCertifications({ employeeId }: EmployeeCertificationsProps) {
  const { toast } = useToast();
  const [certificationRecords, setCertificationRecords] = useState<CertificationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CertificationRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CertificationFormData>({
    resolver: zodResolver(certificationSchema),
    defaultValues: {
      name: "",
      issuingOrg: "",
      credentialId: "",
      description: "",
    },
  });

  // Fetch certification records
  const fetchCertificationRecords = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/employees/${employeeId}/certifications`);
      if (response.ok) {
        const data = await response.json();
        setCertificationRecords(data);
      } else {
        console.error('Failed to fetch certification records');
      }
    } catch (error) {
      console.error('Error fetching certification records:', error);
      toast({
        title: "Error",
        description: "Failed to load certification records",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificationRecords();
  }, [employeeId]);

  // Handle form submission
  const onSubmit = async (data: CertificationFormData) => {
    try {
      setIsSubmitting(true);
      const url = editingRecord 
        ? `/api/employees/${employeeId}/certifications/${editingRecord.id}`
        : `/api/employees/${employeeId}/certifications`;
      
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
          description: `Certification ${editingRecord ? 'updated' : 'added'} successfully`,
        });
        setIsDialogOpen(false);
        setEditingRecord(null);
        form.reset();
        fetchCertificationRecords();
      } else {
        throw new Error('Failed to save certification');
      }
    } catch (error) {
      console.error('Error saving certification:', error);
      toast({
        title: "Error",
        description: "Failed to save certification",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this certification?')) {
      return;
    }

    try {
      const response = await fetch(`/api/employees/${employeeId}/certifications/${recordId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Certification deleted successfully",
        });
        fetchCertificationRecords();
      } else {
        throw new Error('Failed to delete certification');
      }
    } catch (error) {
      console.error('Error deleting certification:', error);
      toast({
        title: "Error",
        description: "Failed to delete certification",
        variant: "destructive",
      });
    }
  };

  // Handle edit
  const handleEdit = (record: CertificationRecord) => {
    setEditingRecord(record);
    form.reset({
      name: record.name,
      issuingOrg: record.issuingOrg,
      issueDate: record.issueDate ? new Date(record.issueDate) : undefined,
      expiryDate: record.expiryDate ? new Date(record.expiryDate) : undefined,
      credentialId: record.credentialId || "",
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

  // Check if certification is expired
  const isExpired = (expiryDate?: Date) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  // Check if certification is expiring soon (within 30 days)
  const isExpiringSoon = (expiryDate?: Date) => {
    if (!expiryDate) return false;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return new Date(expiryDate) <= thirtyDaysFromNow && new Date(expiryDate) >= new Date();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Award className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p>Loading certifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Certifications</h3>
          <p className="text-sm text-muted-foreground">
            Manage employee's professional certifications and credentials
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Certification
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingRecord ? 'Edit Certification' : 'Add Certification'}
              </DialogTitle>
              <DialogDescription>
                {editingRecord 
                  ? 'Update the certification details below.'
                  : 'Add a new certification for this employee.'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Certification Name *</Label>
                  <Input 
                    id="name" 
                    {...form.register("name")}
                    placeholder="AWS Solutions Architect, PMP, etc."
                  />
                  {form.formState.errors.name && (
                    <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issuingOrg">Issuing Organization *</Label>
                  <Input 
                    id="issuingOrg" 
                    {...form.register("issuingOrg")}
                    placeholder="Amazon Web Services, PMI, etc."
                  />
                  {form.formState.errors.issuingOrg && (
                    <p className="text-red-500 text-sm">{form.formState.errors.issuingOrg.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="credentialId">Credential ID</Label>
                <Input 
                  id="credentialId" 
                  {...form.register("credentialId")}
                  placeholder="Certificate or credential ID number"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="issueDate">Issue Date</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    {...form.register("issueDate", {
                      setValueAs: (value) => value ? new Date(value) : undefined
                    })}
                    defaultValue={form.watch("issueDate") ? format(form.watch("issueDate")!, "yyyy-MM-dd") : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    {...form.register("expiryDate", {
                      setValueAs: (value) => value ? new Date(value) : undefined
                    })}
                    defaultValue={form.watch("expiryDate") ? format(form.watch("expiryDate")!, "yyyy-MM-dd") : ""}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  {...form.register("description")}
                  placeholder="Additional details about the certification..."
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

      {certificationRecords.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Award className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Certifications</h3>
            <p className="text-muted-foreground text-center mb-4">
              No certifications have been added for this employee yet.
            </p>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Certification
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {certificationRecords.map((record) => (
            <Card key={record.id} className={cn(
              isExpired(record.expiryDate) && "border-red-200 bg-red-50/50"
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {record.name}
                      {isExpired(record.expiryDate) && (
                        <Badge variant="destructive">Expired</Badge>
                      )}
                      {isExpiringSoon(record.expiryDate) && !isExpired(record.expiryDate) && (
                        <Badge variant="outline" className="border-orange-500 text-orange-600">
                          Expiring Soon
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-base font-medium">
                      {record.issuingOrg}
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
                  {record.credentialId && (
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">ID: {record.credentialId}</Badge>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    {record.issueDate && (
                      <span>
                        Issued: {format(new Date(record.issueDate), "MMM dd, yyyy")}
                      </span>
                    )}
                    {record.expiryDate && (
                      <span className={cn(
                        isExpired(record.expiryDate) && "text-red-600 font-medium",
                        isExpiringSoon(record.expiryDate) && !isExpired(record.expiryDate) && "text-orange-600 font-medium"
                      )}>
                        Expires: {format(new Date(record.expiryDate), "MMM dd, yyyy")}
                      </span>
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
