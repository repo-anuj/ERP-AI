'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Eye, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface Department {
  id: string;
  name: string;
}

interface Location {
  id: string;
  name: string;
  city: string;
}

interface FormData {
  title: string;
  description: string;
  requirements: string;
  responsibilities: string;
  departmentId: string;
  locationId: string;
  jobType: string;
  experienceLevel: string;
  salaryMin: string;
  salaryMax: string;
  currency: string;
  benefits: string[];
  applicationDeadline: string;
  maxApplications: string;
  keywords: string[];
  metaDescription: string;
  isPublished: boolean;
}

export default function CreateJobPostingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true); // Start with loading true for initial data fetch
  const [departments, setDepartments] = useState<Department[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [benefitInput, setBenefitInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    requirements: '',
    responsibilities: '',
    departmentId: '',
    locationId: '',
    jobType: '',
    experienceLevel: '',
    salaryMin: '',
    salaryMax: '',
    currency: 'INR',
    benefits: [],
    applicationDeadline: '',
    maxApplications: '',
    keywords: [],
    metaDescription: '',
    isPublished: false,
  });

  // Distribution settings state
  const [distributionSettings, setDistributionSettings] = useState({
    selectedPlatforms: [] as string[],
    schedulePost: false,
    scheduledDate: '',
    scheduledTime: '',
  });

  // Available platforms state
  const [availablePlatforms, setAvailablePlatforms] = useState<any[]>([]);

  useEffect(() => {
    // Fetch departments, locations, and job board settings in parallel
    const fetchData = async () => {
      setLoading(true);
      try {
        const [deptsResponse, locsResponse, jobBoardResponse] = await Promise.all([
          fetch('/api/departments?type=simple', { next: { revalidate: 3600 } }), // Cache for 1 hour
          fetch('/api/locations', { next: { revalidate: 3600 } }), // Cache for 1 hour
          fetch('/api/hr/recruitment/settings', { next: { revalidate: 3600 } }) // Cache for 1 hour
        ]);

        if (!deptsResponse.ok || !locsResponse.ok) {
          throw new Error('Failed to fetch required data');
        }

        const [deptsData, locsData, jobBoardData] = await Promise.all([
          deptsResponse.json(),
          locsResponse.json(),
          jobBoardResponse.ok ? jobBoardResponse.json() : null
        ]);

        // APIs return arrays directly, not wrapped in objects
        setDepartments(Array.isArray(deptsData) ? deptsData : []);
        setLocations(Array.isArray(locsData) ? locsData : []);

        // Process job board settings
        if (jobBoardData) {
          const platforms = [
            { id: 'linkedin', name: 'LinkedIn', icon: '💼', enabled: jobBoardData.linkedin?.enabled || false, status: jobBoardData.linkedin?.status || 'disconnected' },
            { id: 'indeed', name: 'Indeed', icon: '🌐', enabled: jobBoardData.indeed?.enabled || false, status: jobBoardData.indeed?.status || 'disconnected' },
            { id: 'website', name: 'Company Website', icon: '🏢', enabled: jobBoardData.website?.enabled || false, status: jobBoardData.website?.status || 'active' },
            { id: 'glassdoor', name: 'Glassdoor', icon: '⭐', enabled: jobBoardData.glassdoor?.enabled || false, status: jobBoardData.glassdoor?.status || 'disconnected' },
            { id: 'naukri', name: 'Naukri.com', icon: '🇮🇳', enabled: jobBoardData.naukri?.enabled || false, status: jobBoardData.naukri?.status || 'disconnected' },
            { id: 'monster', name: 'Monster', icon: '👹', enabled: jobBoardData.monster?.enabled || false, status: jobBoardData.monster?.status || 'disconnected' }
          ].filter(platform => platform.enabled);

          setAvailablePlatforms(platforms);

          // Set default selected platforms
          setDistributionSettings(prev => ({
            ...prev,
            selectedPlatforms: jobBoardData.defaultPlatforms || ['website']
          }));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load required data. Please refresh the page.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  const addKeyword = () => {
    if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, keywordInput.trim()]
      }));
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields: (keyof FormData)[] = ['title', 'description', 'requirements', 'responsibilities'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      toast({
        title: 'Missing Information',
        description: `Please fill in all required fields: ${missingFields.join(', ').replace(/([A-Z])/g, ' $1').toLowerCase()}`,
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      // Optimize payload by removing empty strings and null values
      const payload = Object.entries(formData).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      // Add distribution settings
      payload.externalJobBoards = distributionSettings.selectedPlatforms;

      // Add company ID and timestamps
      payload.companyId = ''; // Will be set by the API middleware
      payload.createdAt = new Date().toISOString();
      payload.updatedAt = new Date().toISOString();
      
      const response = await fetch('/api/hr/recruitment/job-postings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to create job posting');
      }

      const data = await response.json();
      
      toast({
        title: 'Success',
        description: 'Job posting created successfully',
      });

      // Redirect to the new job posting
      router.push(`/hr/recruitment/job-postings/${data.jobPosting.id}`);
      
      // Prefetch the job posting page for better UX
      router.prefetch(`/hr/recruitment/job-postings/${data.jobPosting.id}`);
    } catch (error: any) {
      console.error('Error creating job posting:', error);
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/hr/recruitment/job-postings">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Job Postings
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create Job Posting</h1>
          <p className="text-gray-600">Create a new job posting to attract candidates</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Essential details about the job position</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Senior Software Engineer"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="department">Department</Label>
                <Select value={formData.departmentId} onValueChange={(value) => handleInputChange('departmentId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Select value={formData.locationId} onValueChange={(value) => handleInputChange('locationId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name} - {location.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="jobType">Job Type</Label>
                <Select value={formData.jobType} onValueChange={(value) => handleInputChange('jobType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="experienceLevel">Experience Level</Label>
                <Select value={formData.experienceLevel} onValueChange={(value) => handleInputChange('experienceLevel', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry Level</SelectItem>
                    <SelectItem value="mid">Mid Level</SelectItem>
                    <SelectItem value="senior">Senior Level</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Job Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Provide a detailed description of the job..."
                rows={4}
                required
              />
            </div>

            <div>
              <Label htmlFor="requirements">Requirements *</Label>
              <Textarea
                id="requirements"
                value={formData.requirements}
                onChange={(e) => handleInputChange('requirements', e.target.value)}
                placeholder="List the required qualifications, skills, and experience..."
                rows={4}
                required
              />
            </div>

            <div>
              <Label htmlFor="responsibilities">Responsibilities *</Label>
              <Textarea
                id="responsibilities"
                value={formData.responsibilities}
                onChange={(e) => handleInputChange('responsibilities', e.target.value)}
                placeholder="Describe the key responsibilities and duties..."
                rows={4}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Compensation */}
        <Card>
          <CardHeader>
            <CardTitle>Compensation</CardTitle>
            <CardDescription>Salary range and benefits information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="salaryMin">Minimum Salary</Label>
                <Input
                  id="salaryMin"
                  type="number"
                  value={formData.salaryMin}
                  onChange={(e) => handleInputChange('salaryMin', e.target.value)}
                  placeholder="50000"
                />
              </div>

              <div>
                <Label htmlFor="salaryMax">Maximum Salary</Label>
                <Input
                  id="salaryMax"
                  type="number"
                  value={formData.salaryMax}
                  onChange={(e) => handleInputChange('salaryMax', e.target.value)}
                  placeholder="80000"
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

        {/* Distribution Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution Settings</CardTitle>
            <CardDescription>Choose where to post this job</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {availablePlatforms.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availablePlatforms.map((platform) => (
                    <div key={platform.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        id={platform.id}
                        checked={distributionSettings.selectedPlatforms.includes(platform.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setDistributionSettings(prev => ({
                              ...prev,
                              selectedPlatforms: [...prev.selectedPlatforms, platform.id]
                            }));
                          } else {
                            setDistributionSettings(prev => ({
                              ...prev,
                              selectedPlatforms: prev.selectedPlatforms.filter(p => p !== platform.id)
                            }));
                          }
                        }}
                      />
                      <div className="flex items-center space-x-2 flex-1">
                        <span className="text-lg">{platform.icon}</span>
                        <div>
                          <Label htmlFor={platform.id} className="font-medium cursor-pointer">
                            {platform.name}
                          </Label>
                          <Badge
                            variant={platform.status === 'connected' || platform.status === 'active' ? 'default' : 'secondary'}
                            className="ml-2 text-xs"
                          >
                            {platform.status === 'connected' || platform.status === 'active' ? 'Ready' : 'Setup Required'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center space-x-2 pt-4">
                  <Checkbox
                    id="schedule-post"
                    checked={distributionSettings.schedulePost}
                    onCheckedChange={(checked) =>
                      setDistributionSettings(prev => ({ ...prev, schedulePost: checked as boolean }))
                    }
                  />
                  <Label htmlFor="schedule-post">Schedule for later</Label>
                </div>

                {distributionSettings.schedulePost && (
                  <div className="grid grid-cols-2 gap-4 pl-6">
                    <div>
                      <Label htmlFor="scheduled-date">Date</Label>
                      <Input
                        id="scheduled-date"
                        type="date"
                        value={distributionSettings.scheduledDate}
                        onChange={(e) =>
                          setDistributionSettings(prev => ({ ...prev, scheduledDate: e.target.value }))
                        }
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <Label htmlFor="scheduled-time">Time</Label>
                      <Input
                        id="scheduled-time"
                        type="time"
                        value={distributionSettings.scheduledTime}
                        onChange={(e) =>
                          setDistributionSettings(prev => ({ ...prev, scheduledTime: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Globe className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No platforms configured</p>
                <p className="text-sm">Configure job board settings in HR Settings to enable distribution.</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/hr/settings?tab=job-posting">
                    Configure Platforms
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Application Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Application Settings</CardTitle>
            <CardDescription>Configure application deadline and limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="applicationDeadline">Application Deadline</Label>
                <Input
                  id="applicationDeadline"
                  type="date"
                  value={formData.applicationDeadline}
                  onChange={(e) => handleInputChange('applicationDeadline', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="maxApplications">Maximum Applications</Label>
                <Input
                  id="maxApplications"
                  type="number"
                  value={formData.maxApplications}
                  onChange={(e) => handleInputChange('maxApplications', e.target.value)}
                  placeholder="Leave empty for unlimited"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="keywords">Keywords (for search)</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  placeholder="Add a keyword..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                />
                <Button type="button" onClick={addKeyword} variant="outline">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm cursor-pointer"
                    onClick={() => removeKeyword(keyword)}
                  >
                    {keyword} ×
                  </span>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="metaDescription">Meta Description (for SEO)</Label>
              <Textarea
                id="metaDescription"
                value={formData.metaDescription}
                onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                placeholder="Brief description for search engines..."
                rows={2}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPublished"
                checked={formData.isPublished}
                onCheckedChange={(checked) => handleInputChange('isPublished', checked)}
              />
              <Label htmlFor="isPublished">Publish immediately</Label>
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <Link href="/hr/recruitment/job-postings">
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
                Create Job Posting
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
