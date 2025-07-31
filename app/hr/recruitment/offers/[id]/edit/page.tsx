'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FormData {
  salary: string;
  currency: string;
  startDate: string;
  expiryDate: string;
  benefits: string[];
  terms: string;
  notes: string;
}

interface Offer {
  id: string;
  salary: number;
  currency: string;
  startDate: string;
  expiryDate: string;
  benefits: string[];
  terms: string;
  notes?: string;
  candidate: {
    firstName: string;
    lastName: string;
  };
  jobPosting: {
    title: string;
  };
}

const availableBenefits = [
  'Health Insurance',
  'Dental Insurance',
  'Vision Insurance',
  '401(k) Matching',
  'Paid Time Off',
  'Sick Leave',
  'Life Insurance',
  'Disability Insurance',
  'Flexible Schedule',
  'Remote Work',
  'Professional Development',
  'Gym Membership',
  'Stock Options',
  'Bonus Eligible',
  'Company Car',
  'Parking',
  'Meal Allowance',
  'Phone Allowance',
];

export default function EditOfferPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [formData, setFormData] = useState<FormData>({
    salary: '',
    currency: 'USD',
    startDate: '',
    expiryDate: '',
    benefits: [],
    terms: '',
    notes: '',
  });

  useEffect(() => {
    fetchOffer();
  }, [params.id]);

  const fetchOffer = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/hr/recruitment/offers/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch offer');
      
      const data = await response.json();
      setOffer(data.offer);
      
      // Initialize form data
      setFormData({
        salary: data.offer.salary.toString(),
        currency: data.offer.currency,
        startDate: new Date(data.offer.startDate).toISOString().split('T')[0],
        expiryDate: new Date(data.offer.expiryDate).toISOString().split('T')[0],
        benefits: data.offer.benefits || [],
        terms: data.offer.terms || '',
        notes: data.offer.notes || '',
      });
    } catch (error) {
      console.error('Error fetching offer:', error);
      toast({
        title: 'Error',
        description: 'Failed to load offer details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBenefitChange = (benefit: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      benefits: checked
        ? [...prev.benefits, benefit]
        : prev.benefits.filter(b => b !== benefit)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.salary || !formData.startDate || !formData.expiryDate) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const salary = parseFloat(formData.salary);
    if (isNaN(salary) || salary <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid salary amount',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      const updateData = {
        salary,
        currency: formData.currency,
        startDate: new Date(formData.startDate).toISOString(),
        expiryDate: new Date(formData.expiryDate).toISOString(),
        benefits: formData.benefits,
        terms: formData.terms,
        notes: formData.notes,
      };

      const response = await fetch(`/api/hr/recruitment/offers/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update offer');
      }

      toast({
        title: 'Success',
        description: 'Offer updated successfully',
      });

      router.push(`/hr/recruitment/offers/${params.id}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading offer details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Offer Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested offer could not be found.</p>
          <Button onClick={() => router.push('/hr/recruitment/offers')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Offers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push(`/hr/recruitment/offers/${params.id}`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Offer
        </Button>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Job Offer</h1>
          <p className="text-muted-foreground">
            {offer.candidate.firstName} {offer.candidate.lastName} • {offer.jobPosting.title}
          </p>
        </div>
      </div>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Offer Details
          </CardTitle>
          <CardDescription>
            Update the job offer details and terms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Compensation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Label htmlFor="salary">Annual Salary *</Label>
                <Input
                  id="salary"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.salary}
                  onChange={(e) => handleInputChange('salary', e.target.value)}
                  placeholder="75000"
                  required
                />
              </div>

              <div>
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                </select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="expiryDate">Offer Expiry Date *</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Benefits */}
            <div>
              <Label className="text-base font-medium">Benefits Package</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Select all benefits included in this offer
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto border rounded-md p-4">
                {availableBenefits.map((benefit) => (
                  <div key={benefit} className="flex items-center space-x-2">
                    <Checkbox
                      id={benefit}
                      checked={formData.benefits.includes(benefit)}
                      onCheckedChange={(checked) => 
                        handleBenefitChange(benefit, checked as boolean)
                      }
                    />
                    <Label htmlFor={benefit} className="text-sm font-normal">
                      {benefit}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Terms */}
            <div>
              <Label htmlFor="terms">Terms & Conditions</Label>
              <Textarea
                id="terms"
                value={formData.terms}
                onChange={(e) => handleInputChange('terms', e.target.value)}
                placeholder="Enter the detailed terms and conditions of employment..."
                rows={8}
                className="resize-none"
              />
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Internal Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Internal notes about this offer (not visible to candidate)..."
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/hr/recruitment/offers/${params.id}`)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
