'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Globe } from 'lucide-react';
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

export default function EditJobPostingPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [benefitInput, setBenefitInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');

  // Distribution settings state
  const [distributionSettings, setDistributionSettings] = useState({
    selectedPlatforms: [] as string[],
    schedulePost: false,
    scheduledDate: '',
    scheduledTime: '',
  });

  // Available platforms state
  const [availablePlatforms, setAvailablePlatforms] = useState<any[]>([]);

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

  useEffect(() => {
    if (params.id) {
      fetchJobPosting(params.id as string);
      fetchData();
    }
  }, [params.id]);

  const fetchData = async () => {
    try {
      const [deptsResponse, locsResponse, jobBoardResponse] = await Promise.all([
        fetch('/api/departments?type=simple'),
        fetch('/api/locations'),
        fetch('/api/hr/recruitment/settings')
      ]);

      if (deptsResponse.ok && locsResponse.ok) {
        const [deptsData, locsData, jobBoardData] = await Promise.all([
          deptsResponse.json(),
          locsResponse.json(),
          jobBoardResponse.ok ? jobBoardResponse.json() : null
        ]);

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
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchJobPosting = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/hr/recruitment/job-postings/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: 'Job Posting Not Found',
            description: 'The job posting you are trying to edit does not exist.',
            variant: 'destructive',
          });
          router.push('/hr/recruitment/job-postings');
          return;
        }
        throw new Error('Failed to fetch job posting');
      }

      const data = await response.json();
      console.log('Job posting API response for edit:', data);
      // API returns data wrapped in jobPosting property
      const jobPosting = data.jobPosting || data;

      // Populate form with existing data
      setFormData({
        title: jobPosting.title || '',
        description: jobPosting.description || '',
        requirements: jobPosting.requirements || '',
        responsibilities: jobPosting.responsibilities || '',
        departmentId: jobPosting.department?.id || '',
        locationId: jobPosting.location?.id || '',
        jobType: jobPosting.jobType || '',
        experienceLevel: jobPosting.experienceLevel || '',
        salaryMin: jobPosting.salaryMin ? jobPosting.salaryMin.toString() : '',
        salaryMax: jobPosting.salaryMax ? jobPosting.salaryMax.toString() : '',
        currency: jobPosting.currency || 'INR',
        benefits: jobPosting.benefits || [],
        applicationDeadline: jobPosting.applicationDeadline ? new Date(jobPosting.applicationDeadline).toISOString().split('T')[0] : '',
        maxApplications: jobPosting.maxApplications ? jobPosting.maxApplications.toString() : '',
        keywords: jobPosting.keywords || [],
        metaDescription: jobPosting.metaDescription || '',
        isPublished: jobPosting.isPublished || false,
      });

      // Set distribution settings
      setDistributionSettings(prev => ({
        ...prev,
        selectedPlatforms: jobPosting.externalJobBoards || []
      }));
    } catch (error) {
      console.error('Error fetching job posting:', error);
      toast({
        title: 'Error',
        description: 'Failed to load job posting details.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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
    const requiredFields: (keyof FormData)[] = ['title', 'description', 'requirements'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      toast({
        title: 'Missing Information',
        description: `Please fill in all required fields: ${missingFields.join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      
      // Prepare payload
      const payload = Object.entries(formData).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      // Add distribution settings
      payload.externalJobBoards = distributionSettings.selectedPlatforms;
      
      const response = await fetch(`/api/hr/recruitment/job-postings/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to update job posting');
      }

      toast({
        title: 'Success',
        description: 'Job posting updated successfully!',
      });

      router.push(`/hr/recruitment/job-postings/${params.id}`);
    } catch (error: any) {
      console.error('Error updating job posting:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading job posting...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/hr/recruitment/job-postings/${params.id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Job Posting
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Job Posting</h1>
          <p className="text-gray-600">Update job posting details</p>
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

            <div>
              <Label htmlFor="description">Job Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the job role and what the candidate will be doing..."
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
                placeholder="List the required skills, experience, and qualifications..."
                rows={4}
                required
              />
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

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <Link href={`/hr/recruitment/job-postings/${params.id}`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              'Updating...'
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Update Job Posting
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
