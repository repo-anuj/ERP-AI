'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Plus, Search, Filter, Eye, Edit, Calendar, Clock, MapPin, Users, 
  Video, Phone, Building, Star, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { format, isToday, isTomorrow, isPast, isFuture } from 'date-fns';

interface Interview {
  id: string;
  title: string;
  type: string;
  round: number;
  scheduledAt: string;
  endTime?: string;
  duration?: number;
  location?: string;
  meetingLink?: string;
  status: string;
  overallRating?: number;
  recommendation?: string;
  feedbackSubmitted: boolean;
  candidate: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    currentCompany?: string;
    currentPosition?: string;
  };
  jobPosting: {
    id: string;
    title: string;
    department?: {
      id: string;
      name: string;
    };
    location?: {
      id: string;
      name: string;
      city: string;
    };
  };
  application?: {
    id: string;
    status: string;
    stage: string;
  };
  interviewers: {
    id: string;
    interviewerId: string;
    interviewerName: string;
    role: string;
    hasAccepted: boolean;
    feedbackSubmitted: boolean;
    rating?: number;
    recommendation?: string;
  }[];
  evaluations: {
    id: string;
    overallScore?: number;
    recommendation?: string;
    evaluatorName: string;
  }[];
}

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        sortBy: 'scheduledAt',
        sortOrder: 'asc',
      });

      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter && typeFilter !== 'all') params.append('type', typeFilter);

      // Handle date filters
      if (dateFilter && dateFilter !== 'all') {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        switch (dateFilter) {
          case 'today':
            params.append('dateFrom', today.toISOString().split('T')[0]);
            params.append('dateTo', today.toISOString().split('T')[0]);
            break;
          case 'tomorrow':
            params.append('dateFrom', tomorrow.toISOString().split('T')[0]);
            params.append('dateTo', tomorrow.toISOString().split('T')[0]);
            break;
          case 'this_week':
            params.append('dateFrom', today.toISOString().split('T')[0]);
            params.append('dateTo', nextWeek.toISOString().split('T')[0]);
            break;
          case 'past':
            params.append('dateTo', today.toISOString().split('T')[0]);
            break;
        }
      }

      const response = await fetch(`/api/hr/recruitment/interviews?${params}`);
      if (!response.ok) throw new Error('Failed to fetch interviews');

      const data = await response.json();
      setInterviews(data.interviews);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching interviews:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch interviews',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, [currentPage, searchTerm, statusFilter, typeFilter, dateFilter]);

  const getStatusBadge = (status: string, scheduledAt: string) => {
    const interviewDate = new Date(scheduledAt);
    
    if (status === 'completed') {
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    } else if (status === 'cancelled') {
      return <Badge variant="destructive">Cancelled</Badge>;
    } else if (status === 'no_show') {
      return <Badge className="bg-red-100 text-red-800">No Show</Badge>;
    } else if (status === 'in_progress') {
      return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
    } else if (status === 'scheduled') {
      if (isPast(interviewDate)) {
        return <Badge className="bg-orange-100 text-orange-800">Overdue</Badge>;
      } else if (isToday(interviewDate)) {
        return <Badge className="bg-yellow-100 text-yellow-800">Today</Badge>;
      } else if (isTomorrow(interviewDate)) {
        return <Badge className="bg-blue-100 text-blue-800">Tomorrow</Badge>;
      } else {
        return <Badge variant="outline">Scheduled</Badge>;
      }
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      phone: { icon: Phone, color: 'bg-green-100 text-green-800', label: 'Phone' },
      video: { icon: Video, color: 'bg-blue-100 text-blue-800', label: 'Video' },
      in_person: { icon: Building, color: 'bg-purple-100 text-purple-800', label: 'In Person' },
      technical: { icon: Building, color: 'bg-orange-100 text-orange-800', label: 'Technical' },
      hr: { icon: Users, color: 'bg-pink-100 text-pink-800', label: 'HR' },
      panel: { icon: Users, color: 'bg-indigo-100 text-indigo-800', label: 'Panel' },
      final: { icon: Star, color: 'bg-yellow-100 text-yellow-800', label: 'Final' },
    };

    const config = typeConfig[type as keyof typeof typeConfig] || { 
      icon: Calendar, 
      color: 'bg-gray-100 text-gray-800', 
      label: type 
    };
    
    const IconComponent = config.icon;
    
    return (
      <Badge variant="outline" className={config.color}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getInterviewerStatus = (interviewers: Interview['interviewers']) => {
    const total = interviewers.length;
    const accepted = interviewers.filter(i => i.hasAccepted).length;
    const feedbackSubmitted = interviewers.filter(i => i.feedbackSubmitted).length;
    
    return { total, accepted, feedbackSubmitted };
  };

  const renderRating = (rating?: number) => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-xs text-gray-600 ml-1">({rating}/5)</span>
      </div>
    );
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getDateLabel = (scheduledAt: string) => {
    const date = new Date(scheduledAt);
    
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isPast(date)) return 'Past';
    return format(date, 'MMM dd');
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Interviews</h1>
          <p className="text-gray-600">Schedule and manage candidate interviews</p>
        </div>
        <Link href="/hr/recruitment/interviews/schedule">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Schedule Interview
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search interviews..."
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
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="in_person">In Person</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="panel">Panel</SelectItem>
                <SelectItem value="final">Final</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Dates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="tomorrow">Tomorrow</SelectItem>
                <SelectItem value="this_week">This Week</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setTypeFilter('');
                setDateFilter('');
              }}
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Interviews Grid */}
      {loading ? (
        <div className="text-center py-8">Loading interviews...</div>
      ) : interviews.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No interviews found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {interviews.map((interview) => {
            const interviewerStatus = getInterviewerStatus(interview.interviewers);
            
            return (
              <Card key={interview.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {getInitials(interview.candidate.firstName, interview.candidate.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">
                          {interview.candidate.firstName} {interview.candidate.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">{interview.title}</p>
                      </div>
                    </div>
                    <Link href={`/hr/recruitment/interviews/${interview.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      {getStatusBadge(interview.status, interview.scheduledAt)}
                      {getTypeBadge(interview.type)}
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span className="font-medium">{getDateLabel(interview.scheduledAt)}</span>
                      <span className="ml-2">
                        {format(new Date(interview.scheduledAt), 'HH:mm')}
                        {interview.endTime && ` - ${format(new Date(interview.endTime), 'HH:mm')}`}
                      </span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <Building className="w-4 h-4 mr-2" />
                      {interview.jobPosting.title}
                    </div>

                    {interview.location && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        {interview.location}
                      </div>
                    )}

                    {interview.meetingLink && (
                      <div className="flex items-center text-sm text-blue-600">
                        <Video className="w-4 h-4 mr-2" />
                        <a 
                          href={interview.meetingLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          Join Meeting
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Interviewers:</span>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {interviewerStatus.accepted}/{interviewerStatus.total}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {interview.interviewers.slice(0, 3).map((interviewer) => (
                        <div key={interviewer.id} className="flex items-center gap-1">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              interviewer.hasAccepted 
                                ? 'bg-green-50 text-green-700 border-green-200' 
                                : 'bg-gray-50 text-gray-600'
                            }`}
                          >
                            {interviewer.interviewerName}
                            {interviewer.hasAccepted && (
                              <CheckCircle className="w-3 h-3 ml-1" />
                            )}
                          </Badge>
                        </div>
                      ))}
                      {interview.interviewers.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{interview.interviewers.length - 3} more
                        </Badge>
                      )}
                    </div>

                    {interview.overallRating && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Rating:</span>
                        {renderRating(interview.overallRating)}
                      </div>
                    )}

                    {interview.recommendation && (
                      <div className="mt-2">
                        <Badge 
                          variant="outline"
                          className={
                            interview.recommendation === 'hire' 
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : interview.recommendation === 'no_hire'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          }
                        >
                          {interview.recommendation.replace('_', ' ')}
                        </Badge>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                      <span>Round {interview.round}</span>
                      {interview.feedbackSubmitted && (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          Feedback Submitted
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
