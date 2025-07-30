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
import { ArrowLeft, Save, User, DollarSign, Calendar, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  currentCompany?: string;
  currentPosition?: string;
  expectedSalary?: number;
  currentSalary?: number;
  noticePeriod?: number;
}

interface JobPosting {
  id: string;
  title: string;
  department?: { name: string };
  location?: { name: string; city: string };
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
}

interface FormData {
  candidateId: string;
  jobPostingId: string;
  position: string;
  department: string;
  location: string;
  startDate: string;
  baseSalary: string;
  currency: string;
  salaryFrequency: string;
  bonus: string;
  equity: string;
  benefits: string[];
  employmentType: string;
  probationPeriod: string;
  noticePeriod: string;
  responseDeadline: string;
  approvalComments: string;
  submitForApproval: boolean;
}

export default function CreateOfferPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [selectedJobPosting, setSelectedJobPosting] = useState<JobPosting | null>(null);
  const [benefitInput, setBenefitInput] = useState('');

  const [formData, setFormData] = useState<FormData>({
    candidateId: searchParams.get('candidateId') || '',
    jobPostingId: searchParams.get('jobPostingId') || '',
    position: '',
    department: '',
    location: '',
    startDate: '',
    baseSalary: '',
    currency: 'INR',
    salaryFrequency: 'monthly',
    bonus: '',
    equity: '',
    benefits: [],
    employmentType: 'full_time',
    probationPeriod: '6',
    noticePeriod: '30',
    responseDeadline: '',
    approvalComments: '',
    submitForApproval: false,
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

  const fetchJobPostings = async () => {
    try {
      const response = await fetch('/api/hr/recruitment/job-postings?limit=100');
      if (!response.ok) throw new Error('Failed to fetch job postings');
      const data = await response.json();
      setJobPostings(data.jobPostings || []);
    } catch (error) {
      console.error('Error fetching job postings:', error);
    }
  };

  useEffect(() => {
    if (formData.candidateId) {
      fetchCandidate(formData.candidateId);
    }
    fetchJobPostings();
  }, [formData.candidateId]);

  useEffect(() => {
    if (formData.jobPostingId) {
      const jobPosting = jobPostings.find(jp => jp.id === formData.jobPostingId);
      if (jobPosting) {
        setSelectedJobPosting(jobPosting);
        setFormData(prev => ({
          ...prev,
          position: jobPosting.title,
          department: jobPosting.department?.name || '',
          location: jobPosting.location ? `${jobPosting.location.name}, ${jobPosting.location.city}` : '',
          currency: jobPosting.currency,
          baseSalary: jobPosting.salaryMin ? jobPosting.salaryMin.toString() : '',
        }));
      }
    }
  }, [formData.jobPostingId, jobPostings]);

  // Set default response deadline to 7 days from now
  useEffect(() => {
    if (!formData.responseDeadline) {
      const defaultDeadline = new Date();
      defaultDeadline.setDate(defaultDeadline.getDate() + 7);
      setFormData(prev => ({
        ...prev,
        responseDeadline: defaultDeadline.toISOString().split('T')[0]
      }));
    }
  }, []);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addBenefit = () => {
    if (benefitInput.trim() && !formData.benefits.includes(benefitInput.trim())) {
      setFormData(prev => ({
        ...prev,
        benefits: [...prev.benefits, benefitInput.trim()]
      }));
      setBenefitInput('');
    }
  };

  const removeBenefit = (benefit: string) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter(b => b !== benefit)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.candidateId || !formData.position || !formData.baseSalary) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/hr/recruitment/offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          baseSalary: parseFloat(formData.baseSalary),
          bonus: formData.bonus ? parseFloat(formData.bonus) : null,
          probationPeriod: formData.probationPeriod ? parseInt(formData.probationPeriod) : null,
          noticePeriod: formData.noticePeriod ? parseInt(formData.noticePeriod) : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create offer');
      }

      const data = await response.json();
      
      // If submitting for approval, update the offer status
      if (formData.submitForApproval) {
        await fetch(`/api/hr/recruitment/offers/${data.offer.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'pending_approval',
            approvalComments: formData.approvalComments,
          }),
        });
      }
      
      toast({
        title: 'Success',
        description: formData.submitForApproval 
          ? 'Offer created and submitted for approval'
          : 'Offer created successfully',
      });

      router.push(`/hr/recruitment/offers/${data.offer.id}`);
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

  const getSalaryRecommendation = () => {
    if (!candidate?.expectedSalary && !selectedJobPosting?.salaryMin) return null;
    
    const expectedSalary = candidate?.expectedSalary;
    const jobMinSalary = selectedJobPosting?.salaryMin;
    const jobMaxSalary = selectedJobPosting?.salaryMax;
    
    let recommendation = '';
    if (expectedSalary && jobMinSalary) {
      if (expectedSalary <= jobMaxSalary!) {
        recommendation = `Candidate expects ₹${expectedSalary.toLocaleString()}. Job range: ₹${jobMinSalary.toLocaleString()} - ₹${jobMaxSalary?.toLocaleString()}`;
      } else {
        recommendation = `⚠️ Candidate expects ₹${expectedSalary.toLocaleString()}, above job max of ₹${jobMaxSalary?.toLocaleString()}`;
      }
    }
    
    return recommendation;
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/hr/recruitment/offers">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Offers
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create Job Offer</h1>
          <p className="text-gray-600">Create a comprehensive job offer for the candidate</p>
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
              <div className="space-y-2">
                {candidate.expectedSalary && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expected Salary:</span>
                    <span>₹{candidate.expectedSalary.toLocaleString()}</span>
                  </div>
                )}
                {candidate.currentSalary && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Salary:</span>
                    <span>₹{candidate.currentSalary.toLocaleString()}</span>
                  </div>
                )}
                {candidate.noticePeriod && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Notice Period:</span>
                    <span>{candidate.noticePeriod} days</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Position Details */}
        <Card>
          <CardHeader>
            <CardTitle>Position Details</CardTitle>
            <CardDescription>Define the role and organizational details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="jobPostingId">Related Job Posting (Optional)</Label>
              <Select value={formData.jobPostingId} onValueChange={(value) => handleInputChange('jobPostingId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select job posting" />
                </SelectTrigger>
                <SelectContent>
                  {jobPostings.map((posting) => (
                    <SelectItem key={posting.id} value={posting.id}>
                      {posting.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="position">Position Title *</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  placeholder="e.g., Senior Software Engineer"
                  required
                />
              </div>

              <div>
                <Label htmlFor="employmentType">Employment Type</Label>
                <Select value={formData.employmentType} onValueChange={(value) => handleInputChange('employmentType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  placeholder="e.g., Engineering"
                />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="e.g., Mumbai, India"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="startDate">Proposed Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Compensation Package */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Compensation Package
            </CardTitle>
            <CardDescription>Define salary, bonuses, and benefits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {getSalaryRecommendation() && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">{getSalaryRecommendation()}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="baseSalary">Base Salary *</Label>
                <Input
                  id="baseSalary"
                  type="number"
                  value={formData.baseSalary}
                  onChange={(e) => handleInputChange('baseSalary', e.target.value)}
                  placeholder="50000"
                  required
                />
              </div>

              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="salaryFrequency">Frequency</Label>
                <Select value={formData.salaryFrequency} onValueChange={(value) => handleInputChange('salaryFrequency', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bonus">Signing Bonus (Optional)</Label>
                <Input
                  id="bonus"
                  type="number"
                  value={formData.bonus}
                  onChange={(e) => handleInputChange('bonus', e.target.value)}
                  placeholder="10000"
                />
              </div>

              <div>
                <Label htmlFor="equity">Equity/Stock Options (Optional)</Label>
                <Input
                  id="equity"
                  value={formData.equity}
                  onChange={(e) => handleInputChange('equity', e.target.value)}
                  placeholder="e.g., 0.1% equity"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="benefits">Benefits</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={benefitInput}
                  onChange={(e) => setBenefitInput(e.target.value)}
                  placeholder="Add a benefit..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                />
                <Button type="button" onClick={addBenefit} variant="outline">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.benefits.map((benefit, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm cursor-pointer"
                    onClick={() => removeBenefit(benefit)}
                  >
                    {benefit} ×
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employment Terms */}
        <Card>
          <CardHeader>
            <CardTitle>Employment Terms</CardTitle>
            <CardDescription>Define probation, notice period, and response deadline</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="probationPeriod">Probation Period (months)</Label>
                <Input
                  id="probationPeriod"
                  type="number"
                  value={formData.probationPeriod}
                  onChange={(e) => handleInputChange('probationPeriod', e.target.value)}
                  placeholder="6"
                />
              </div>

              <div>
                <Label htmlFor="noticePeriod">Notice Period (days)</Label>
                <Input
                  id="noticePeriod"
                  type="number"
                  value={formData.noticePeriod}
                  onChange={(e) => handleInputChange('noticePeriod', e.target.value)}
                  placeholder="30"
                />
              </div>

              <div>
                <Label htmlFor="responseDeadline">Response Deadline</Label>
                <Input
                  id="responseDeadline"
                  type="date"
                  value={formData.responseDeadline}
                  onChange={(e) => handleInputChange('responseDeadline', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Approval Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Approval Settings
            </CardTitle>
            <CardDescription>Configure approval workflow and comments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="approvalComments">Comments for Approver</Label>
              <Textarea
                id="approvalComments"
                value={formData.approvalComments}
                onChange={(e) => handleInputChange('approvalComments', e.target.value)}
                placeholder="Any additional context for the approver..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="submitForApproval"
                checked={formData.submitForApproval}
                onCheckedChange={(checked) => handleInputChange('submitForApproval', checked)}
              />
              <Label htmlFor="submitForApproval">Submit for approval immediately</Label>
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <Link href="/hr/recruitment/offers">
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
                {formData.submitForApproval ? 'Create & Submit for Approval' : 'Create Offer'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
