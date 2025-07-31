'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Briefcase, Calendar, Clock, Mail, Phone, MapPin, FileText, User,
  ArrowLeft, Calendar as CalendarDays, FileText as FileCheck, Download, Mail as MailIcon, MessageSquare, Clock as FileClock,
  Clock as History, Search as FileSearch
} from 'lucide-react';
import { InterviewsTab } from './interviews';
import { EvaluationsTab } from './evaluations';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export interface Application {
  id: string;
  status: string;
  appliedAt: string;
  coverLetter?: string;
  resumeUrl?: string;
  notes?: string;
  candidate: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    currentCompany?: string;
    currentPosition?: string;
    totalExperience?: number;
    skills: string[];
  };
  jobPosting: {
    id: string;
    title: string;
    department?: {
      name: string;
    };
    location?: {
      name: string;
      city: string;
      country: string;
    };
  };
  interviews?: Array<{
    id: string;
    scheduledAt: string;
    status: string;
    type: string;
    interviewers: Array<{
      id: string;
      name: string;
      email: string;
    }>;
  }>;
  evaluations?: Array<{
    id: string;
    evaluationType: string;
    evaluatorName: string;
    technicalSkills?: number;
    communication?: number;
    problemSolving?: number;
    culturalFit?: number;
    experience?: number;
    motivation?: number;
    overallScore?: number;
    recommendation?: string;
    strengths?: string;
    weaknesses?: string;
    comments?: string;
    status: string;
    submittedBy: {
      id: string;
      name: string;
      role: string;
    };
    submittedAt: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  const handleScheduleInterview = () => {
    if (!application) return;

    // Navigate to interview scheduling page with application context
    router.push(`/hr/recruitment/interviews/create?applicationId=${application.id}&candidateId=${application.candidate.id}&jobPostingId=${application.jobPosting.id}`);
  };

  const handleMoveToNextStage = async () => {
    if (!application) return;

    try {
      const nextStageMap: Record<string, string> = {
        'applied': 'screening',
        'screening': 'interview',
        'interview': 'offer',
        'offer': 'hired'
      };

      const nextStage = nextStageMap[application.status];
      if (!nextStage) {
        toast({
          title: 'Info',
          description: 'Application is already at the final stage',
        });
        return;
      }

      const response = await fetch(`/api/hr/recruitment/applications/${application.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: nextStage,
          stage: nextStage,
        }),
      });

      if (!response.ok) throw new Error('Failed to update application');

      const updatedApplication = await response.json();
      setApplication({ ...application, status: nextStage });

      toast({
        title: 'Success',
        description: `Application moved to ${nextStage} stage`,
      });
    } catch (error) {
      console.error('Error updating application:', error);
      toast({
        title: 'Error',
        description: 'Failed to update application status',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/hr/recruitment/applications/${params.id}`);
        if (!response.ok) throw new Error('Failed to fetch application');
        const data = await response.json();
        setApplication(data);
      } catch (error) {
        console.error('Error fetching application:', error);
        toast({
          title: 'Error',
          description: 'Failed to load application details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchApplication();
    }
  }, [params.id, toast]);

  // Handle tab parameter from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, []);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' }> = {
      applied: { label: 'Applied', variant: 'outline' },
      screening: { label: 'Screening', variant: 'secondary' },
      interview: { label: 'Interview', variant: 'secondary' },
      offer: { label: 'Offer', variant: 'success' },
      hired: { label: 'Hired', variant: 'success' },
      rejected: { label: 'Rejected', variant: 'destructive' },
      withdrawn: { label: 'Withdrawn', variant: 'destructive' },
    };

    const { label, variant } = statusMap[status] || { label: status, variant: 'default' };
    return <Badge variant={variant} className="text-xs">{label}</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Application not found</h2>
          <p className="text-muted-foreground mt-2">
            The application you're looking for doesn't exist or has been removed.
          </p>
          <Button className="mt-4" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Applications
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
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Applications
        </Button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {application.candidate.firstName} {application.candidate.lastName}
            </h1>
            <p className="text-muted-foreground">
              Application for {application.jobPosting.title}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(application.status)}
            <Button
              variant="outline"
              size="sm"
              disabled={application.status === 'hired' || application.status === 'rejected'}
              onClick={handleMoveToNextStage}
            >
              Move to Next Stage
            </Button>
            <Button
              size="sm"
              disabled={application.status === 'hired' || application.status === 'rejected'}
              onClick={handleScheduleInterview}
            >
              Schedule Interview
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="resume">Resume</TabsTrigger>
          <TabsTrigger value="interviews">Interviews</TabsTrigger>
          <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Candidate</CardDescription>
                  <CardTitle className="text-lg">
                    {application.candidate.firstName} {application.candidate.lastName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={`/avatars/${application.candidate.id}.jpg`} />
                      <AvatarFallback>
                        {application.candidate.firstName[0]}{application.candidate.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{application.candidate.email}</span>
                      </div>
                      {application.candidate.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{application.candidate.phone}</span>
                        </div>
                      )}
                      {application.candidate.address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <span className="text-sm">{application.candidate.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Job Details</CardDescription>
                  <CardTitle className="text-lg">
                    {application.jobPosting.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Department</p>
                      <p className="text-sm">
                        {application.jobPosting.department?.name || 'Not specified'}
                      </p>
                    </div>
                    {application.jobPosting.location && (
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="text-sm">
                          {application.jobPosting.location.city}, {application.jobPosting.location.country}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Applied On</p>
                      <p className="text-sm">
                        {format(new Date(application.appliedAt), 'MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Application Status</CardDescription>
                  <CardTitle className="text-lg">
                    {getStatusBadge(application.status)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Current Stage</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: '75%' }}
                          ></div>
                        </div>
                        <span className="text-xs text-muted-foreground">75%</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Next Steps</p>
                      <ul className="space-y-2">
                        {application.status === 'applied' && (
                          <li className="flex items-center gap-2 text-sm">
                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                            <span>Application received</span>
                          </li>
                        )}
                        
                        {['screening', 'interview', 'offer', 'hired'].map((stage) => (
                          <li 
                            key={stage}
                            className={`flex items-center gap-2 text-sm ${
                              application.status === stage ? 'text-foreground' : 'text-muted-foreground'
                            }`}
                          >
                            {application.status === stage ? (
                              <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                            ) : (
                              <div className="h-2 w-2 rounded-full bg-gray-300"></div>
                            )}
                            <span className="capitalize">
                              {stage}
                              {stage === 'interview' && application.interviews?.length ? 
                                ` (${application.interviews.length} scheduled)` : ''}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Candidate Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Experience</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Current Position</span>
                        <span className="text-sm font-medium">
                          {application.candidate.currentPosition || 'Not specified'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Current Company</span>
                        <span className="text-sm font-medium">
                          {application.candidate.currentCompany || 'Not specified'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Total Experience</span>
                        <span className="text-sm font-medium">
                          {application.candidate.totalExperience ? 
                            `${application.candidate.totalExperience} years` : 'Not specified'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {application.candidate.skills && application.candidate.skills.length > 0 ? (
                        application.candidate.skills.map((skill) => (
                          <Badge key={skill} variant="secondary">
                            {skill}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No skills listed</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Application Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Documents</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Resume</span>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                      {application.coverLetter && (
                        <div className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Cover Letter</span>
                          </div>
                          <Button variant="ghost" size="sm" className="h-8">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Actions</h4>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Send Message
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <MailIcon className="h-4 w-4 mr-2" />
                        Send Email
                      </Button>
                      <Button variant="outline" className="w-full justify-start text-destructive">
                        Reject Application
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="resume">
          <Card>
            <CardHeader>
              <CardTitle>Resume & Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {application.resumeUrl ? (
                <div className="h-[800px] w-full bg-muted rounded-md flex items-center justify-center">
                  <div className="text-center p-8 max-w-md">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Resume Preview</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      This would display a preview of the candidate's resume if we had a PDF viewer integrated.
                    </p>
                    <Button>
                      <Download className="h-4 w-4 mr-2" />
                      Download Resume
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No resume available</h3>
                  <p className="text-sm text-muted-foreground">
                    This candidate has not uploaded a resume.
                  </p>
                </div>
              )}

              {application.coverLetter && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">Cover Letter</h3>
                  <div className="prose max-w-none p-4 border rounded-md bg-muted/10">
                    {application.coverLetter}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interviews">
          <InterviewsTab 
            application={application} 
            onScheduleInterview={handleScheduleInterview} 
          />
        </TabsContent>

        <TabsContent value="evaluations">
          <EvaluationsTab application={application} />
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/avatars/you.jpg" />
                      <AvatarFallback>Y</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">You</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {format(new Date(), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <FileSearch className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="mt-2">
                        <textarea
                          placeholder="Add a note about this candidate..."
                          className="w-full min-h-[100px] p-2 border rounded-md text-sm"
                        />
                        <div className="mt-2 flex justify-end">
                          <Button size="sm">Save Note</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {application.notes ? (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/avatars/you.jpg" />
                        <AvatarFallback>Y</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">You</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {format(new Date(application.appliedAt), 'MMM d, yyyy h:mm a')}
                            </span>
                          </div>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <FileSearch className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="mt-2 text-sm">
                          {application.notes}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No notes yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Add notes about this candidate to keep track of your thoughts and feedback.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Activity History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200"></div>
                  
                  <div className="relative pl-8 pb-6">
                    <div className="absolute left-0 top-0 h-3 w-3 rounded-full bg-primary mt-1"></div>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">Application Submitted</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(application.appliedAt), 'MMMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        Applied
                      </Badge>
                    </div>
                    <div className="mt-2 text-sm">
                      Candidate submitted their application for {application.jobPosting.title}.
                    </div>
                  </div>

                  {application.status !== 'applied' && (
                    <div className="relative pl-8 pb-6">
                      <div className="absolute left-0 top-0 h-3 w-3 rounded-full bg-primary mt-1"></div>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">Application Reviewed</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(), 'MMMM d, yyyy h:mm a')}
                          </p>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          Screening
                        </Badge>
                      </div>
                      <div className="mt-2 text-sm">
                        Application reviewed and moved to screening stage.
                      </div>
                    </div>
                  )}

                  {['interview', 'offer', 'hired'].includes(application.status) && (
                    <div className="relative pl-8 pb-6">
                      <div className="absolute left-0 top-0 h-3 w-3 rounded-full bg-primary mt-1"></div>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">Interview Scheduled</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(), 'MMMM d, yyyy h:mm a')}
                          </p>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          Interview
                        </Badge>
                      </div>
                      <div className="mt-2 text-sm">
                        Initial interview scheduled with hiring team.
                      </div>
                    </div>
                  )}

                  {['offer', 'hired'].includes(application.status) && (
                    <div className="relative pl-8 pb-6">
                      <div className="absolute left-0 top-0 h-3 w-3 rounded-full bg-primary mt-1"></div>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">Offer Extended</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(), 'MMMM d, yyyy h:mm a')}
                          </p>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          Offer
                        </Badge>
                      </div>
                      <div className="mt-2 text-sm">
                        Job offer extended to candidate.
                      </div>
                    </div>
                  )}

                  {application.status === 'hired' && (
                    <div className="relative pl-8">
                      <div className="absolute left-0 top-0 h-3 w-3 rounded-full bg-primary mt-1"></div>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">Candidate Hired</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(), 'MMMM d, yyyy h:mm a')}
                          </p>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          Hired
                        </Badge>
                      </div>
                      <div className="mt-2 text-sm">
                        Candidate accepted the offer and has been onboarded.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
