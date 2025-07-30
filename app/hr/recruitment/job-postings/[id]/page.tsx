'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Trash2, Users, Calendar, MapPin, Building, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { format } from 'date-fns';

interface JobPosting {
  id: string;
  title: string;
  description: string;
  requirements: string;
  responsibilities: string;
  department?: { id: string; name: string };
  location?: { id: string; name: string; city: string; state: string };
  jobType: string;
  experienceLevel: string;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  benefits: string[];
  applicationDeadline?: string;
  maxApplications?: number;
  keywords: string[];
  status: string;
  isActive: boolean;
  isPublished: boolean;
  publishedAt?: string;
  viewCount: number;
  applicationCount: number;
  createdAt: string;
  updatedAt: string;
  applications: any[];
  interviews: any[];
  stats?: {
    totalApplications: number;
    totalInterviews: number;
    applicationsByStatus: Record<string, number>;
  };
}

export default function JobPostingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [jobPosting, setJobPosting] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchJobPosting(params.id as string);
    }
  }, [params.id]);

  const fetchJobPosting = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/hr/recruitment/job-postings/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: 'Job Posting Not Found',
            description: 'The job posting you are looking for does not exist.',
            variant: 'destructive',
          });
          router.push('/hr/recruitment/job-postings');
          return;
        }
        throw new Error('Failed to fetch job posting');
      }

      const data = await response.json();
      console.log('Job posting API response:', data);
      // API returns data wrapped in jobPosting property
      setJobPosting(data.jobPosting || data);
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

  const handleDelete = async () => {
    if (!jobPosting || !confirm('Are you sure you want to delete this job posting?')) return;

    try {
      const response = await fetch(`/api/hr/recruitment/job-postings/${jobPosting.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to delete job posting');
      }

      toast({
        title: 'Success',
        description: 'Job posting deleted successfully.',
      });

      router.push('/hr/recruitment/job-postings');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
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

  if (!jobPosting) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Job posting not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/hr/recruitment/job-postings">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Job Postings
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{jobPosting.title}</h1>
            <p className="text-gray-600">Job Posting Details</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Link href={`/hr/recruitment/job-postings/${jobPosting.id}/edit`}>
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Department:</span>
                  <span>{jobPosting.department?.name || 'Not specified'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Location:</span>
                  <span>
                    {jobPosting.location 
                      ? `${jobPosting.location.name} - ${jobPosting.location.city}`
                      : 'Not specified'
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Job Type:</span>
                  <Badge variant="outline">
                    {jobPosting.jobType ? jobPosting.jobType.replace('_', ' ') : 'Not specified'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Experience:</span>
                  <Badge variant="outline">{jobPosting.experienceLevel || 'Not specified'}</Badge>
                </div>
              </div>

              {(jobPosting.salaryMin || jobPosting.salaryMax) && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Salary:</span>
                  <span>
                    {jobPosting.salaryMin && jobPosting.salaryMax
                      ? `${jobPosting.currency || 'USD'} ${jobPosting.salaryMin.toLocaleString()} - ${jobPosting.salaryMax.toLocaleString()}`
                      : jobPosting.salaryMin
                      ? `${jobPosting.currency || 'USD'} ${jobPosting.salaryMin.toLocaleString()}+`
                      : jobPosting.salaryMax
                      ? `Up to ${jobPosting.currency || 'USD'} ${jobPosting.salaryMax.toLocaleString()}`
                      : 'Not specified'
                    }
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{jobPosting.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{jobPosting.requirements}</p>
              </div>
            </CardContent>
          </Card>

          {/* Responsibilities */}
          {jobPosting.responsibilities && (
            <Card>
              <CardHeader>
                <CardTitle>Responsibilities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{jobPosting.responsibilities}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Benefits */}
          {jobPosting.benefits && jobPosting.benefits.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {jobPosting.benefits.map((benefit, index) => (
                    <Badge key={index} variant="secondary">
                      {benefit}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <Badge variant={jobPosting.status === 'published' ? 'default' : 'secondary'}>
                  {jobPosting.status || 'Draft'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Published:</span>
                <span className="text-sm">{jobPosting.isPublished ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active:</span>
                <span className="text-sm">{jobPosting.isActive ? 'Yes' : 'No'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Views:</span>
                <span className="text-sm font-medium">{jobPosting.viewCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Applications:</span>
                <span className="text-sm font-medium">{jobPosting.stats?.totalApplications || jobPosting.applicationCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Interviews:</span>
                <span className="text-sm font-medium">{jobPosting.stats?.totalInterviews || jobPosting.interviews?.length || 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle>Important Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Created:</span>
                <span className="text-sm">
                  {jobPosting.createdAt ? format(new Date(jobPosting.createdAt), 'MMM dd, yyyy') : 'Unknown'}
                </span>
              </div>
              {jobPosting.publishedAt && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Published:</span>
                  <span className="text-sm">{format(new Date(jobPosting.publishedAt), 'MMM dd, yyyy')}</span>
                </div>
              )}
              {jobPosting.applicationDeadline && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Deadline:</span>
                  <span className="text-sm">{format(new Date(jobPosting.applicationDeadline), 'MMM dd, yyyy')}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
