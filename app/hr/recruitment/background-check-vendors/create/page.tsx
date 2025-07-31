'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FormData {
  name: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  supportedCheckTypes: string[];
  averageTurnaroundDays: string;
  cost: string;
  notes: string;
  isActive: boolean;
}

const checkTypes = [
  { id: 'criminal', label: 'Criminal Background' },
  { id: 'employment', label: 'Employment Verification' },
  { id: 'education', label: 'Education Verification' },
  { id: 'reference', label: 'Reference Check' },
  { id: 'credit', label: 'Credit Check' },
  { id: 'identity', label: 'Identity Verification' },
  { id: 'drug_test', label: 'Drug Test' },
  { id: 'driving_record', label: 'Driving Record' },
];

export default function CreateVendorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    supportedCheckTypes: [],
    averageTurnaroundDays: '',
    cost: '',
    notes: '',
    isActive: true,
  });

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCheckTypeChange = (checkType: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      supportedCheckTypes: checked
        ? [...prev.supportedCheckTypes, checkType]
        : prev.supportedCheckTypes.filter(type => type !== checkType)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.contactEmail) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (formData.supportedCheckTypes.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one supported check type',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const apiData = {
        name: formData.name,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone || null,
        website: formData.website || null,
        supportedCheckTypes: formData.supportedCheckTypes,
        averageTurnaroundDays: formData.averageTurnaroundDays ? parseInt(formData.averageTurnaroundDays) : null,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        notes: formData.notes || null,
        isActive: formData.isActive,
      };

      const response = await fetch('/api/hr/recruitment/background-check-vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create vendor');
      }

      toast({
        title: 'Success',
        description: 'Vendor created successfully',
      });

      router.push('/hr/recruitment/background-check-vendors');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add New Vendor</h1>
          <p className="text-muted-foreground">
            Add a new background check service provider
          </p>
        </div>
      </div>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="w-5 h-5 mr-2" />
            Vendor Information
          </CardTitle>
          <CardDescription>
            Enter the details for the new background check vendor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name">Vendor Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="E.g., SecureCheck Services"
                  required
                />
              </div>

              <div>
                <Label htmlFor="contactEmail">Contact Email *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  placeholder="contact@vendor.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://vendor.com"
                />
              </div>
            </div>

            {/* Service Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="averageTurnaroundDays">Average Turnaround (Days)</Label>
                <Input
                  id="averageTurnaroundDays"
                  type="number"
                  min="1"
                  value={formData.averageTurnaroundDays}
                  onChange={(e) => handleInputChange('averageTurnaroundDays', e.target.value)}
                  placeholder="5"
                />
              </div>

              <div>
                <Label htmlFor="cost">Starting Cost ($)</Label>
                <Input
                  id="cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => handleInputChange('cost', e.target.value)}
                  placeholder="25.00"
                />
              </div>
            </div>

            {/* Supported Check Types */}
            <div>
              <Label className="text-base font-medium">Supported Check Types *</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Select all the types of background checks this vendor can perform
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {checkTypes.map((checkType) => (
                  <div key={checkType.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={checkType.id}
                      checked={formData.supportedCheckTypes.includes(checkType.id)}
                      onCheckedChange={(checked) => 
                        handleCheckTypeChange(checkType.id, checked as boolean)
                      }
                    />
                    <Label htmlFor={checkType.id} className="text-sm font-normal">
                      {checkType.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes about this vendor..."
                rows={3}
              />
            </div>

            {/* Status */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange('isActive', checked as boolean)}
              />
              <Label htmlFor="isActive" className="text-sm font-normal">
                Activate vendor immediately
              </Label>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Creating...' : 'Create Vendor'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
