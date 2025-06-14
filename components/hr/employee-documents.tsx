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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, FileText, Download, Upload, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";

const documentSchema = z.object({
  name: z.string().min(1, "Document name is required"),
  type: z.string().min(1, "Document type is required"),
  url: z.string().url("Valid URL is required"),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
});

type DocumentFormData = z.infer<typeof documentSchema>;

interface EmployeeDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  fileSize?: number;
  mimeType?: string;
  uploadDate: string;
  uploadedBy?: string;
  description?: string;
  isPublic: boolean;
}

interface EmployeeDocumentsProps {
  employeeId: string;
}

const documentTypes = [
  { value: "contract", label: "Employment Contract" },
  { value: "resume", label: "Resume/CV" },
  { value: "certificate", label: "Certificate" },
  { value: "id_copy", label: "ID Copy" },
  { value: "tax_form", label: "Tax Form" },
  { value: "bank_details", label: "Bank Details" },
  { value: "performance_review", label: "Performance Review" },
  { value: "training_certificate", label: "Training Certificate" },
  { value: "other", label: "Other" },
];

export function EmployeeDocuments({ employeeId }: EmployeeDocumentsProps) {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const form = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      name: '',
      type: '',
      url: '',
      description: '',
      isPublic: false,
    },
  });

  // Fetch documents
  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/employees/${employeeId}/documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      } else {
        throw new Error('Failed to fetch documents');
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load documents',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [employeeId]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isDialogOpen) {
      form.reset({
        name: '',
        type: '',
        url: '',
        description: '',
        isPublic: false,
      });
    }
  }, [isDialogOpen, form]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      // In a real implementation, you would upload to a cloud storage service
      // For now, we'll simulate the upload and use a placeholder URL
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate upload delay
      
      const fileUrl = `https://example.com/documents/${file.name}`;
      const fileName = file.name.split('.')[0];
      
      form.setValue('name', fileName);
      form.setValue('url', fileUrl);
      
      // Try to determine document type based on file name
      const lowerName = fileName.toLowerCase();
      if (lowerName.includes('contract')) {
        form.setValue('type', 'contract');
      } else if (lowerName.includes('resume') || lowerName.includes('cv')) {
        form.setValue('type', 'resume');
      } else if (lowerName.includes('certificate')) {
        form.setValue('type', 'certificate');
      } else {
        form.setValue('type', 'other');
      }

      toast({
        title: 'File uploaded',
        description: `${file.name} has been uploaded successfully`,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const onSubmit = async (data: DocumentFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/employees/${employeeId}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add document');
      }

      toast({
        title: 'Success',
        description: 'Document added successfully',
      });

      setIsDialogOpen(false);
      fetchDocuments();
    } catch (error: any) {
      console.error('Error adding document:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add document',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const response = await fetch(`/api/employees/${employeeId}/documents?documentId=${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      toast({
        title: 'Success',
        description: 'Document deleted successfully',
      });

      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive',
      });
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getDocumentTypeLabel = (type: string) => {
    const docType = documentTypes.find(dt => dt.value === type);
    return docType ? docType.label : type;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-medium">Documents</h4>
          <p className="text-sm text-muted-foreground">
            Manage employee documents and files
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Document</DialogTitle>
              <DialogDescription>
                Upload or link a document for this employee
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Upload File</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploadingFile}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                  />
                  {uploadingFile && (
                    <div className="flex items-center space-x-2">
                      <Upload className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Uploading...</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Or enter a URL manually below
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Document Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Employment Contract"
                  {...form.register('name')}
                />
                {form.formState.errors.name && (
                  <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Document Type *</Label>
                <Select onValueChange={(value) => form.setValue('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.type && (
                  <p className="text-red-500 text-sm">{form.formState.errors.type.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">Document URL *</Label>
                <Input
                  id="url"
                  placeholder="https://example.com/document.pdf"
                  {...form.register('url')}
                />
                {form.formState.errors.url && (
                  <p className="text-red-500 text-sm">{form.formState.errors.url.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Additional notes about this document"
                  {...form.register('description')}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isPublic"
                  checked={form.watch('isPublic')}
                  onCheckedChange={(checked) => form.setValue('isPublic', checked)}
                />
                <Label htmlFor="isPublic">Employee can view this document</Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add Document'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No documents uploaded</p>
            <p className="text-sm text-muted-foreground">
              Add documents for this employee
            </p>
          </div>
        ) : (
          documents.map((document) => (
            <Card key={document.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>{document.name}</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(document.url, '_blank')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(document.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {getDocumentTypeLabel(document.type)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {getDocumentTypeLabel(document.type)}
                  </Badge>
                  {document.isPublic ? (
                    <Badge variant="default" className="flex items-center space-x-1">
                      <Eye className="h-3 w-3" />
                      <span>Employee Visible</span>
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="flex items-center space-x-1">
                      <EyeOff className="h-3 w-3" />
                      <span>HR Only</span>
                    </Badge>
                  )}
                  {document.fileSize && (
                    <Badge variant="outline">
                      {formatFileSize(document.fileSize)}
                    </Badge>
                  )}
                </div>

                {document.description && (
                  <p className="text-sm text-muted-foreground">{document.description}</p>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Uploaded on {format(new Date(document.uploadDate), "PPP")}</span>
                  {document.uploadedBy && (
                    <span>by {document.uploadedBy}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
