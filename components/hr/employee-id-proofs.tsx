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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Plus, Trash2, Shield, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const idProofSchema = z.object({
  name: z.string().min(1, "ID proof type is required"),
  value: z.string().min(1, "Value is required"),
  issuedBy: z.string().optional(),
  issueDate: z.date().optional(),
  expiryDate: z.date().optional(),
  notes: z.string().optional(),
});

type IdProofFormData = z.infer<typeof idProofSchema>;

interface IdProofType {
  id: string;
  name: string;
  description?: string;
  isRequired: boolean;
  hasExpiry: boolean;
  format?: string;
}

interface EmployeeIdProof {
  id: string;
  name: string;
  value: string; // This will be masked
  issuedBy?: string;
  issueDate?: string;
  expiryDate?: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface EmployeeIdProofsProps {
  employeeId: string;
}

export function EmployeeIdProofs({ employeeId }: EmployeeIdProofsProps) {
  const { toast } = useToast();
  const [idProofs, setIdProofs] = useState<EmployeeIdProof[]>([]);
  const [idProofTypes, setIdProofTypes] = useState<IdProofType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<IdProofFormData>({
    resolver: zodResolver(idProofSchema),
    defaultValues: {
      name: '',
      value: '',
      issuedBy: '',
      notes: '',
    },
  });

  // Fetch ID proofs and types
  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch employee's ID proofs
      const proofsResponse = await fetch(`/api/employees/${employeeId}/id-proofs`);
      if (proofsResponse.ok) {
        const proofsData = await proofsResponse.json();
        setIdProofs(proofsData);
      }

      // Fetch available ID proof types
      const typesResponse = await fetch('/api/id-proof-types');
      if (typesResponse.ok) {
        const typesData = await typesResponse.json();
        setIdProofTypes(typesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load ID proof data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [employeeId]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isDialogOpen) {
      form.reset({
        name: '',
        value: '',
        issuedBy: '',
        notes: '',
      });
    }
  }, [isDialogOpen, form]);

  const onSubmit = async (data: IdProofFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/employees/${employeeId}/id-proofs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add ID proof');
      }

      toast({
        title: 'Success',
        description: 'ID proof added successfully',
      });

      setIsDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error adding ID proof:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add ID proof',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (idProofId: string) => {
    if (!confirm('Are you sure you want to delete this ID proof?')) {
      return;
    }

    try {
      const response = await fetch(`/api/employees/${employeeId}/id-proofs?idProofId=${idProofId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete ID proof');
      }

      toast({
        title: 'Success',
        description: 'ID proof deleted successfully',
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting ID proof:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete ID proof',
        variant: 'destructive',
      });
    }
  };

  const getSelectedIdProofType = () => {
    const selectedName = form.watch('name');
    return idProofTypes.find(type => type.name === selectedName);
  };

  const getAvailableIdProofTypes = () => {
    const existingProofNames = idProofs.map(proof => proof.name);
    return idProofTypes.filter(type => !existingProofNames.includes(type.name));
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return expiry <= thirtyDaysFromNow && expiry > now;
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-medium">ID Proofs</h4>
          <p className="text-sm text-muted-foreground">
            Secure identification documents for this employee
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={getAvailableIdProofTypes().length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Add ID Proof
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add ID Proof</DialogTitle>
              <DialogDescription>
                Add a secure identification document for this employee
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">ID Proof Type *</Label>
                <Select onValueChange={(value) => form.setValue('name', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ID proof type" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableIdProofTypes().map((type) => (
                      <SelectItem key={type.id} value={type.name}>
                        {type.name}
                        {type.isRequired && <Badge variant="destructive" className="ml-2 text-xs">Required</Badge>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.name && (
                  <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">ID Number/Value *</Label>
                <Input
                  id="value"
                  type="password"
                  placeholder="Enter the ID number (will be encrypted)"
                  {...form.register('value')}
                />
                {form.formState.errors.value && (
                  <p className="text-red-500 text-sm">{form.formState.errors.value.message}</p>
                )}
                {getSelectedIdProofType()?.format && (
                  <p className="text-xs text-muted-foreground">
                    Expected format: {getSelectedIdProofType()?.format}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="issuedBy">Issued By</Label>
                <Input
                  id="issuedBy"
                  placeholder="Issuing authority"
                  {...form.register('issuedBy')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Issue Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !form.watch("issueDate") && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch("issueDate") ? (
                          format(form.watch("issueDate")!, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={form.watch("issueDate")}
                        onSelect={(date) => form.setValue("issueDate", date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {getSelectedIdProofType()?.hasExpiry && (
                  <div className="space-y-2">
                    <Label>Expiry Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !form.watch("expiryDate") && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.watch("expiryDate") ? (
                            format(form.watch("expiryDate")!, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={form.watch("expiryDate")}
                          onSelect={(date) => form.setValue("expiryDate", date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes about this ID proof"
                  {...form.register('notes')}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add ID Proof'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ID Proofs List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading ID proofs...</p>
          </div>
        ) : idProofs.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No ID proofs added</p>
            <p className="text-sm text-muted-foreground">
              Add secure identification documents for this employee
            </p>
          </div>
        ) : (
          idProofs.map((proof) => (
            <Card key={proof.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center space-x-2">
                    <span>{proof.name}</span>
                    {proof.verified ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                    )}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(proof.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">ID Number:</span>
                    <span className="text-sm font-mono">{proof.value}</span>
                  </div>

                  {proof.issuedBy && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Issued By:</span>
                      <span className="text-sm">{proof.issuedBy}</span>
                    </div>
                  )}

                  {proof.issueDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Issue Date:</span>
                      <span className="text-sm">{format(new Date(proof.issueDate), "PPP")}</span>
                    </div>
                  )}

                  {proof.expiryDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Expiry Date:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{format(new Date(proof.expiryDate), "PPP")}</span>
                        {isExpired(proof.expiryDate) && (
                          <Badge variant="destructive" className="text-xs">Expired</Badge>
                        )}
                        {isExpiringSoon(proof.expiryDate) && !isExpired(proof.expiryDate) && (
                          <Badge variant="outline" className="text-xs text-yellow-600">Expiring Soon</Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant={proof.verified ? "default" : "outline"}>
                    {proof.verified ? "Verified" : "Unverified"}
                  </Badge>
                  {proof.verified && proof.verifiedBy && (
                    <Badge variant="outline" className="text-xs">
                      Verified by {proof.verifiedBy}
                    </Badge>
                  )}
                </div>

                {proof.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">{proof.notes}</p>
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Added on {format(new Date(proof.createdAt), "PPP")}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Missing Required ID Proofs Warning */}
      {idProofTypes.some(type => type.isRequired) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-yellow-800 flex items-center space-x-2">
              <AlertCircle className="h-4 w-4" />
              <span>Required ID Proofs</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {idProofTypes
                .filter(type => type.isRequired && !idProofs.some(proof => proof.name === type.name))
                .map(type => (
                  <div key={type.id} className="flex items-center justify-between">
                    <span className="text-sm text-yellow-800">{type.name}</span>
                    <Badge variant="outline" className="text-yellow-800 border-yellow-300">
                      Missing
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
