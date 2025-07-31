'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, User, Shield, Building, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  currentCompany?: string;
  currentPosition?: string;
}

interface Vendor {
  id: string;
  name: string;
  contactEmail: string;
  supportedCheckTypes: string[];
  averageTurnaroundDays?: number;
}

interface CheckItem {
  id: string;
  itemType: string;
  description: string;
  priority: string;
  estimatedDays: number;
}

interface FormData {
  candidateId: string;
  vendorId: string;
  checkType: string;
  priority: string;
  requestedBy: string;
  notes: string;
  consentObtained: boolean;
  consentDate: string;
  expectedCompletionDate: string;
  checkItems: CheckItem[];
}

export default function CreateBackgroundCheckPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const [formData, setFormData] = useState<FormData>({
    candidateId: searchParams.get('candidateId') || '',
    vendorId: '',
    checkType: '',
    priority: 'standard',
    requestedBy: '',
    notes: '',
    consentObtained: false,
    consentDate: '',
    expectedCompletionDate: '',
    checkItems: [],
  });

  const fetchCandidate = async (candidateId: string) => {
    try {
      const response = await fetch(`/api/hr/recruitment/candidates/${candidateId}`);
      if (!response.ok) throw new Error('Failed to fetch candidate');
      const data = await response.json();
      setCandidate(data.candidate);
    } catch (error) {
      console.error('Error fetching candidate:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch candidate details',
        variant: 'destructive',
      });
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/hr/recruitment/background-check-vendors?isActive=true');
      if (!response.ok) throw new Error('Failed to fetch vendors');
      const data = await response.json();
      setVendors(data.vendors || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  useEffect(() => {
    if (formData.candidateId) {
      fetchCandidate(formData.candidateId);
    }
    fetchVendors();
  }, [formData.candidateId]);

  useEffect(() => {
    if (formData.vendorId) {
      const vendor = vendors.find(v => v.id === formData.vendorId);
      setSelectedVendor(vendor || null);
      
      // Set expected completion date based on vendor's average turnaround
      if (vendor?.averageTurnaroundDays) {
        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() + vendor.averageTurnaroundDays);
        setFormData(prev => ({
          ...prev,
          expectedCompletionDate: expectedDate.toISOString().split('T')[0]
        }));
      }
    }
  }, [formData.vendorId, vendors]);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addCheckItem = () => {
    const newItem: CheckItem = {
      id: `item-${Date.now()}`,
      itemType: 'criminal',
      description: '',
      priority: 'standard',
      estimatedDays: 3,
    };

    setFormData(prev => ({
      ...prev,
      checkItems: [...prev.checkItems, newItem]
    }));
  };

  const updateCheckItem = (index: number, field: keyof CheckItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      checkItems: prev.checkItems.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeCheckItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      checkItems: prev.checkItems.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.candidateId || !formData.checkType) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.consentObtained) {
      toast({
        title: 'Error',
        description: 'Candidate consent is required for background checks',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      // Prepare data for API (only send fields that the API expects)
      const apiData = {
        candidateId: formData.candidateId,
        checkType: formData.checkType,
        notes: formData.notes,
        expectedDate: formData.expectedCompletionDate,
      };

      const response = await fetch('/api/hr/recruitment/background-checks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create background check');
      }

      const data = await response.json();
      
      toast({
        title: 'Success',
        description: 'Background check created successfully',
      });

      router.push('/hr/recruitment/background-checks');
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

  const getCheckTypeIcon = (checkType: string) => {
    switch (checkType) {
      case 'criminal': return '🚔';
      case 'employment': return '💼';
      case 'education': return '🎓';
      case 'reference': return '👥';
      case 'credit': return '💳';
      case 'identity': return '🆔';
      case 'drug_test': return '🧪';
      case 'driving_record': return '🚗';
      default: return '📋';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/hr/recruitment/background-checks">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Background Checks
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create Background Check</h1>
          <p className="text-gray-600">Initiate background verification for candidate</p>
        </div>
      </div>

      {/* Candidate Information */}
      {candidate && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Candidate Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-lg">
                  {candidate.firstName} {candidate.lastName}
                </h3>
                <p className="text-gray-600">{candidate.email}</p>
                {candidate.currentCompany && (
                  <p className="text-gray-600">
                    {candidate.currentPosition} at {candidate.currentCompany}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Check Details
            </CardTitle>
            <CardDescription>Configure the background check parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="checkType">Check Type *</Label>
                <Select value={formData.checkType} onValueChange={(value) => handleInputChange('checkType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select check type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="criminal">🚔 Criminal Background</SelectItem>
                    <SelectItem value="employment">💼 Employment Verification</SelectItem>
                    <SelectItem value="education">🎓 Education Verification</SelectItem>
                    <SelectItem value="reference">👥 Reference Check</SelectItem>
                    <SelectItem value="credit">💳 Credit Check</SelectItem>
                    <SelectItem value="identity">🆔 Identity Verification</SelectItem>
                    <SelectItem value="drug_test">🧪 Drug Test</SelectItem>
                    <SelectItem value="driving_record">🚗 Driving Record</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="vendorId">Background Check Vendor</Label>
              <Select value={formData.vendorId} onValueChange={(value) => handleInputChange('vendorId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                      {vendor.averageTurnaroundDays && (
                        <span className="text-gray-500 ml-2">
                          (~{vendor.averageTurnaroundDays} days)
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedVendor && (
                <p className="text-sm text-gray-600 mt-1">
                  Contact: {selectedVendor.contactEmail}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expectedCompletionDate">Expected Completion Date</Label>
                <Input
                  id="expectedCompletionDate"
                  type="date"
                  value={formData.expectedCompletionDate}
                  onChange={(e) => handleInputChange('expectedCompletionDate', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="requestedBy">Requested By</Label>
                <Input
                  id="requestedBy"
                  value={formData.requestedBy}
                  onChange={(e) => handleInputChange('requestedBy', e.target.value)}
                  placeholder="Your name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any additional notes or special instructions..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Consent */}
        <Card>
          <CardHeader>
            <CardTitle>Candidate Consent</CardTitle>
            <CardDescription>Verify that proper consent has been obtained</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="consentObtained"
                checked={formData.consentObtained}
                onCheckedChange={(checked) => handleInputChange('consentObtained', checked)}
                required
              />
              <Label htmlFor="consentObtained" className="text-sm">
                I confirm that proper written consent has been obtained from the candidate for this background check *
              </Label>
            </div>

            {formData.consentObtained && (
              <div>
                <Label htmlFor="consentDate">Consent Date</Label>
                <Input
                  id="consentDate"
                  type="date"
                  value={formData.consentDate}
                  onChange={(e) => handleInputChange('consentDate', e.target.value)}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Check Items */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Check Items</CardTitle>
                <CardDescription>Specify individual verification items (optional)</CardDescription>
              </div>
              <Button type="button" onClick={addCheckItem} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {formData.checkItems.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <p>No specific items added. The vendor will perform standard checks for the selected type.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.checkItems.map((item, index) => (
                  <Card key={item.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label>Item Type</Label>
                          <Select 
                            value={item.itemType} 
                            onValueChange={(value) => updateCheckItem(index, 'itemType', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="criminal">Criminal</SelectItem>
                              <SelectItem value="employment">Employment</SelectItem>
                              <SelectItem value="education">Education</SelectItem>
                              <SelectItem value="reference">Reference</SelectItem>
                              <SelectItem value="credit">Credit</SelectItem>
                              <SelectItem value="identity">Identity</SelectItem>
                              <SelectItem value="drug_test">Drug Test</SelectItem>
                              <SelectItem value="driving_record">Driving Record</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Priority</Label>
                          <Select 
                            value={item.priority} 
                            onValueChange={(value) => updateCheckItem(index, 'priority', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="urgent">Urgent</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="standard">Standard</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Est. Days</Label>
                          <Input
                            type="number"
                            value={item.estimatedDays}
                            onChange={(e) => updateCheckItem(index, 'estimatedDays', parseInt(e.target.value) || 1)}
                            min="1"
                          />
                        </div>

                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeCheckItem(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4">
                        <Label>Description</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => updateCheckItem(index, 'description', e.target.value)}
                          placeholder="Specific details for this check item..."
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <Link href="/hr/recruitment/background-checks">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? (
              'Creating...'
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Background Check
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
