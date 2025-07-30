'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Search, Filter, Eye, Edit, Mail, Phone, Building, MapPin, Star, Calendar, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { format } from 'date-fns';

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  currentCompany?: string;
  currentPosition?: string;
  totalExperience?: number;
  expectedSalary?: number;
  currentLocation?: string;
  status: string;
  source?: string;
  overallRating?: number;
  skills: string[];
  createdAt: string;
  stats: {
    totalApplications: number;
    totalInterviews: number;
    totalOffers: number;
    latestApplication?: {
      id: string;
      status: string;
      jobPosting: {
        id: string;
        title: string;
      };
    };
    latestInterview?: {
      id: string;
      scheduledAt: string;
      status: string;
    };
  };
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const { toast } = useToast();

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        sortBy,
        sortOrder,
      });

      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (sourceFilter && sourceFilter !== 'all') params.append('source', sourceFilter);

      const response = await fetch(`/api/hr/recruitment/candidates?${params}`);
      if (!response.ok) throw new Error('Failed to fetch candidates');

      const data = await response.json();
      setCandidates(data.candidates);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching candidates:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch candidates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [currentPage, searchTerm, statusFilter, sourceFilter, sortBy, sortOrder]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      new: { color: 'bg-blue-100 text-blue-800', label: 'New' },
      screening: { color: 'bg-yellow-100 text-yellow-800', label: 'Screening' },
      interviewing: { color: 'bg-purple-100 text-purple-800', label: 'Interviewing' },
      offered: { color: 'bg-green-100 text-green-800', label: 'Offered' },
      hired: { color: 'bg-emerald-100 text-emerald-800', label: 'Hired' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
      withdrawn: { color: 'bg-gray-100 text-gray-800', label: 'Withdrawn' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.new;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getSourceBadge = (source?: string) => {
    if (!source) return null;
    
    const sourceConfig = {
      job_board: { color: 'bg-indigo-100 text-indigo-800', label: 'Job Board' },
      referral: { color: 'bg-green-100 text-green-800', label: 'Referral' },
      social_media: { color: 'bg-pink-100 text-pink-800', label: 'Social Media' },
      company_website: { color: 'bg-blue-100 text-blue-800', label: 'Website' },
      recruiter: { color: 'bg-orange-100 text-orange-800', label: 'Recruiter' },
    };

    const config = sourceConfig[source as keyof typeof sourceConfig];
    return config ? <Badge variant="outline" className={config.color}>{config.label}</Badge> : null;
  };

  const renderRating = (rating?: number) => {
    if (!rating) return <span className="text-gray-400">Not rated</span>;
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">({rating}/5)</span>
      </div>
    );
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Candidates</h1>
          <p className="text-gray-600">Manage and track all candidates in your recruitment pipeline</p>
        </div>
        <Link href="/hr/recruitment/candidates/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Candidate
          </Button>
        </Link>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search candidates..."
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
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="screening">Screening</SelectItem>
                <SelectItem value="interviewing">Interviewing</SelectItem>
                <SelectItem value="offered">Offered</SelectItem>
                <SelectItem value="hired">Hired</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="withdrawn">Withdrawn</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="job_board">Job Board</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="social_media">Social Media</SelectItem>
                <SelectItem value="company_website">Website</SelectItem>
                <SelectItem value="recruiter">Recruiter</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Date Added</SelectItem>
                <SelectItem value="firstName">Name</SelectItem>
                <SelectItem value="totalExperience">Experience</SelectItem>
                <SelectItem value="expectedSalary">Expected Salary</SelectItem>
                <SelectItem value="overallRating">Rating</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setSourceFilter('all');
                setSortBy('createdAt');
                setSortOrder('desc');
              }}
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Candidates Grid */}
      {loading ? (
        <div className="text-center py-8">Loading candidates...</div>
      ) : candidates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No candidates found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates.map((candidate) => (
            <Card key={candidate.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {getInitials(candidate.firstName, candidate.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {candidate.firstName} {candidate.lastName}
                      </h3>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(candidate.status)}
                        {getSourceBadge(candidate.source)}
                      </div>
                    </div>
                  </div>
                  <Link href={`/hr/recruitment/candidates/${candidate.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2" />
                    {candidate.email}
                  </div>
                  {candidate.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      {candidate.phone}
                    </div>
                  )}
                  {candidate.currentCompany && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Building className="w-4 h-4 mr-2" />
                      {candidate.currentPosition} at {candidate.currentCompany}
                    </div>
                  )}
                  {candidate.currentLocation && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      {candidate.currentLocation}
                    </div>
                  )}
                  {candidate.totalExperience && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Briefcase className="w-4 h-4 mr-2" />
                      {candidate.totalExperience} years experience
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-1">Rating:</div>
                  {renderRating(candidate.overallRating)}
                </div>

                {candidate.skills.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm text-gray-600 mb-2">Skills:</div>
                    <div className="flex flex-wrap gap-1">
                      {candidate.skills.slice(0, 3).map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {candidate.skills.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{candidate.skills.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-blue-600">
                        {candidate.stats.totalApplications}
                      </div>
                      <div className="text-xs text-gray-500">Applications</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-purple-600">
                        {candidate.stats.totalInterviews}
                      </div>
                      <div className="text-xs text-gray-500">Interviews</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-green-600">
                        {candidate.stats.totalOffers}
                      </div>
                      <div className="text-xs text-gray-500">Offers</div>
                    </div>
                  </div>
                </div>

                {candidate.stats.latestApplication && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm">
                      <div className="font-medium">Latest Application:</div>
                      <div className="text-gray-600">
                        {candidate.stats.latestApplication.jobPosting.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {candidate.stats.latestApplication.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 text-xs text-gray-500">
                  Added {format(new Date(candidate.createdAt), 'MMM dd, yyyy')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
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
