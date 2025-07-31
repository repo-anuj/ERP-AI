'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Edit, Calendar, Clock, MapPin, Video, Phone, Users, 
  CheckCircle, XCircle, AlertTriangle, Star, MessageSquare, FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Interview {
  id: string;
  title: string;
  type: string;
  status: string;
  scheduledAt: string;
  duration: number;
  location?: string;
  meetingLink?: string;
  feedback?: string;
  notes?: string;
  candidate: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  jobPosting: {
    id: string;
    title: string;
    department?: { name: string };
  };
  interviewers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    rating?: number;
    recommendation?: string;
    feedback?: string;
  }>;
}

export default function InterviewDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [interview, setInterview] = useState<Interview | null>(null);

  useEffect(() => {
    fetchInterview();
  }, [params.id]);

  const fetchInterview = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/hr/recruitment/interviews/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch interview');
      
      const data = await response.json();
      setInterview(data.interview);
    } catch (error) {
      console.error('Error fetching interview:', error);
      toast({
        title: 'Error',
        description: 'Failed to load interview details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle },
      no_show: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    const Icon = config.icon;
    
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'phone':
        return <Phone className="w-4 h-4" />;
      case 'in_person':
        return <MapPin className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const renderRating = (rating?: number) => {
    if (!rating) return <span className="text-muted-foreground">Not rated</span>;
    
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm">({rating}/5)</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading interview details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Interview Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested interview could not be found.</p>
          <Button onClick={() => router.push('/hr/recruitment/interviews')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Interviews
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push('/hr/recruitment/interviews')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Interviews
        </Button>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{interview.title}</h1>
            <p className="text-muted-foreground">
              {interview.candidate.firstName} {interview.candidate.lastName} • {interview.jobPosting.title}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit Interview
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  {getTypeIcon(interview.type)}
                  <span className="ml-2">Interview Details</span>
                </span>
                {getStatusBadge(interview.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Date & Time</h4>
                  <div className="flex items-center mt-1">
                    <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span>{format(new Date(interview.scheduledAt), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex items-center mt-1">
                    <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span>{format(new Date(interview.scheduledAt), 'HH:mm')} ({interview.duration} min)</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Location</h4>
                  <div className="mt-1">
                    {interview.location ? (
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                        <span>{interview.location}</span>
                      </div>
                    ) : interview.meetingLink ? (
                      <div className="flex items-center">
                        <Video className="w-4 h-4 mr-2 text-muted-foreground" />
                        <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Join Meeting
                        </a>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Not specified</span>
                    )}
                  </div>
                </div>
              </div>

              {interview.notes && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Notes</h4>
                  <p className="text-sm bg-muted p-3 rounded-md">{interview.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="feedback" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
              <TabsTrigger value="interviewers">Interviewers</TabsTrigger>
            </TabsList>
            
            <TabsContent value="feedback" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Interview Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {interview.feedback ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Overall Feedback</h4>
                        <p className="text-sm bg-muted p-3 rounded-md">{interview.feedback}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No feedback provided yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="interviewers" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Interviewers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {interview.interviewers.length > 0 ? (
                    <div className="space-y-4">
                      {interview.interviewers.map((interviewer) => (
                        <div key={interviewer.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-medium">{interviewer.name}</h4>
                              <p className="text-sm text-muted-foreground">{interviewer.role}</p>
                              <p className="text-sm text-muted-foreground">{interviewer.email}</p>
                            </div>
                            <div className="text-right">
                              {renderRating(interviewer.rating)}
                            </div>
                          </div>
                          
                          {interviewer.recommendation && (
                            <div className="mb-3">
                              <h5 className="font-medium text-sm mb-1">Recommendation</h5>
                              <Badge variant={interviewer.recommendation === 'hire' ? 'default' : 'secondary'}>
                                {interviewer.recommendation}
                              </Badge>
                            </div>
                          )}
                          
                          {interviewer.feedback && (
                            <div>
                              <h5 className="font-medium text-sm mb-1">Feedback</h5>
                              <p className="text-sm bg-muted p-2 rounded">{interviewer.feedback}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No interviewers assigned</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Candidate Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Avatar className="w-8 h-8 mr-2">
                  <AvatarImage src="" />
                  <AvatarFallback>
                    {interview.candidate.firstName[0]}{interview.candidate.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                Candidate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="font-medium">
                    {interview.candidate.firstName} {interview.candidate.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{interview.candidate.email}</p>
                  {interview.candidate.phone && (
                    <p className="text-sm text-muted-foreground">{interview.candidate.phone}</p>
                  )}
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  View Candidate Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Job Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Job Position
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="font-medium">{interview.jobPosting.title}</p>
                  {interview.jobPosting.department && (
                    <p className="text-sm text-muted-foreground">{interview.jobPosting.department.name}</p>
                  )}
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  View Job Posting
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full">
                Reschedule Interview
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                Add Feedback
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                Send Reminder
              </Button>
              {interview.status === 'scheduled' && (
                <Button variant="destructive" size="sm" className="w-full">
                  Cancel Interview
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
