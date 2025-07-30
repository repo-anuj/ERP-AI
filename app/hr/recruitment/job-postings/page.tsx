'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter, Eye, Edit, Trash2, Users, Calendar, MapPin, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { format } from 'date-fns';
import { JobPostingsEmptyState } from '@/components/hr/recruitment/job-postings-empty-state';

interface JobPosting {
  id: string;
  title: string;
  description: string;
  department?: { id: string; name: string };
  location?: { id: string; name: string; city: string };
  jobType: string;
  experienceLevel: string;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  status: string;
  isActive: boolean;
  isPublished: boolean;
  publishedAt?: string;
  applicationDeadline?: string;
  viewCount: number;
  applicationCount: number;
  createdAt: string;
  stats: {
    totalApplications: number;
    totalInterviews: number;
    applicationsByStatus: Record<string, number>;
  };
}

interface Department {
  id: string;
  name: string;
}

interface Location {
  id: string;
  name: string;
  city: string;
}

export default function JobPostingsPage() {
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  const fetchJobPostings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      });

      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (departmentFilter && departmentFilter !== 'all') params.append('department', departmentFilter);
      if (locationFilter && locationFilter !== 'all') params.append('location', locationFilter);

      const response = await fetch(`/api/hr/recruitment/job-postings?${params}`);
      if (!response.ok) throw new Error('Failed to fetch job postings');

      const data = await response.json();
      setJobPostings(data.jobPostings);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching job postings:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch job postings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (!response.ok) throw new Error('Failed to fetch departments');
      const data = await response.json();
      setDepartments(data.departments || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/locations');
      if (!response.ok) throw new Error('Failed to fetch locations');
      const data = await response.json();
      setLocations(data.locations || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  useEffect(() => {
    fetchJobPostings();
  }, [currentPage, searchTerm, statusFilter, departmentFilter, locationFilter]);

  useEffect(() => {
    fetchDepartments();
    fetchLocations();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job posting?')) return;

    try {
      const response = await fetch(`/api/hr/recruitment/job-postings/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete job posting');
      }

      toast({
        title: 'Success',
        description: 'Job posting deleted successfully',
      });

      fetchJobPostings();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string, isPublished: boolean) => {
    if (status === 'published' && isPublished) {
      return <Badge className="bg-green-100 text-green-800">Published</Badge>;
    } else if (status === 'draft') {
      return <Badge variant="secondary">Draft</Badge>;
    } else if (status === 'closed') {
      return <Badge variant="destructive">Closed</Badge>;
    } else if (status === 'cancelled') {
      return <Badge variant="outline">Cancelled</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  const formatSalary = (min?: number, max?: number, currency: string = 'INR') => {
    if (!min && !max) return 'Not specified';
    if (min && max) return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    if (min) return `${currency} ${min.toLocaleString()}+`;
    if (max) return `Up to ${currency} ${max.toLocaleString()}`;
    return 'Not specified';
  };

  const handleCreateJobPosting = () => {
    window.location.href = '/hr/recruitment/job-postings/create';
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Job Postings</h1>
          <p className="text-gray-600">Manage your job postings and track applications</p>
        </div>
        <Link href="/hr/recruitment/job-postings/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Job Posting
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search job postings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name} - {location.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setDepartmentFilter('');
                setLocationFilter('');
              }}
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Job Postings List */}
      {loading ? (
        <div className="text-center py-8">Loading job postings...</div>
      ) : jobPostings.length === 0 ? (
        <JobPostingsEmptyState onCreateJobPosting={handleCreateJobPosting} />
      ) : (
        <div className="space-y-4">
          {jobPostings.map((posting) => (
            <Card key={posting.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{posting.title}</h3>
                      {getStatusBadge(posting.status, posting.isPublished)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Building className="w-4 h-4 mr-2" />
                        {posting.department?.name || 'No Department'}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        {posting.location ? `${posting.location.name}, ${posting.location.city}` : 'Remote'}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        {posting.applicationDeadline 
                          ? `Deadline: ${format(new Date(posting.applicationDeadline), 'MMM dd, yyyy')}`
                          : 'No deadline'
                        }
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <span>Type: {posting.jobType.replace('_', ' ')}</span>
                      <span>Experience: {posting.experienceLevel}</span>
                      <span>Salary: {formatSalary(posting.salaryMin, posting.salaryMax, posting.currency)}</span>
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {posting.stats.totalApplications} Applications
                      </div>
                      <div className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        {posting.viewCount} Views
                      </div>
                      <span className="text-gray-500">
                        Created {format(new Date(posting.createdAt), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Link href={`/hr/recruitment/job-postings/${posting.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link href={`/hr/recruitment/job-postings/${posting.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(posting.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
