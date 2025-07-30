'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Edit, Mail, Phone, Building, MapPin, Star, Calendar, 
  Briefcase, GraduationCap, Award, FileText, Users, Clock, DollarSign,
  Download, ExternalLink, Globe
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { format } from 'date-fns';

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  currentLocation?: string;
  address?: any;
  linkedinUrl?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  currentCompany?: string;
  currentPosition?: string;
  totalExperience?: number;
  currentSalary?: number;
  expectedSalary?: number;
  noticePeriod?: number;
  resumeUrl?: string;
  coverLetterUrl?: string;
  skills: string[];
  education: any[];
  experience: any[];
  certifications: any[];
  source?: string;
  referredBy?: string;
  tags: string[];
  status: string;
  overallRating?: number;
  notes?: string;
  dataConsent: boolean;
  marketingConsent: boolean;
  createdAt: string;
  applications: any[];
  interviews: any[];
  offers: any[];
  evaluations: any[];
  backgroundChecks: any[];
  stats: {
    totalApplications: number;
    totalInterviews: number;
    totalOffers: number;
    totalEvaluations: number;
    totalBackgroundChecks: number;
    averageRating?: number;
    applicationsByStatus: Record<string, number>;
  };
}

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCandidate = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/hr/recruitment/candidates/${params.id}`);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchCandidate();
    }
  }, [params.id]);

  if (loading) {
    return <div className="container mx-auto p-6">Loading candidate details...</div>;
  }

  if (!candidate) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Candidate not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
      <div className="flex items-center gap-4 mb-6">
        <Link href="/hr/recruitment/candidates">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Candidates
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">
            {candidate.firstName} {candidate.lastName}
          </h1>
          <p className="text-gray-600">Candidate Profile</p>
        </div>
        <Link href={`/hr/recruitment/candidates/${candidate.id}/edit`}>
          <Button>
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </Link>
      </div>

      {/* Header Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src="" />
              <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
                {getInitials(candidate.firstName, candidate.lastName)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-2xl font-semibold">
                  {candidate.firstName} {candidate.lastName}
                </h2>
                {getStatusBadge(candidate.status)}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  {candidate.email}
                </div>
                {candidate.phone && (
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    {candidate.phone}
                  </div>
                )}
                {candidate.currentCompany && (
                  <div className="flex items-center text-gray-600">
                    <Building className="w-4 h-4 mr-2" />
                    {candidate.currentPosition} at {candidate.currentCompany}
                  </div>
                )}
                {candidate.currentLocation && (
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    {candidate.currentLocation}
                  </div>
                )}
                {candidate.totalExperience && (
                  <div className="flex items-center text-gray-600">
                    <Briefcase className="w-4 h-4 mr-2" />
                    {candidate.totalExperience} years experience
                  </div>
                )}
                {candidate.expectedSalary && (
                  <div className="flex items-center text-gray-600">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Expected: ₹{candidate.expectedSalary.toLocaleString()}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-6">
                <div>
                  <div className="text-sm text-gray-600">Overall Rating:</div>
                  {renderRating(candidate.overallRating)}
                </div>
                {candidate.resumeUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={candidate.resumeUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4 mr-2" />
                      Resume
                    </a>
                  </Button>
                )}
                {candidate.linkedinUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={candidate.linkedinUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      LinkedIn
                    </a>
                  </Button>
                )}
                {candidate.portfolioUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={candidate.portfolioUrl} target="_blank" rel="noopener noreferrer">
                      <Globe className="w-4 h-4 mr-2" />
                      Portfolio
                    </a>
                  </Button>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {candidate.stats.totalApplications}
                  </div>
                  <div className="text-sm text-gray-500">Applications</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {candidate.stats.totalInterviews}
                  </div>
                  <div className="text-sm text-gray-500">Interviews</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {candidate.stats.totalOffers}
                  </div>
                  <div className="text-sm text-gray-500">Offers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {candidate.stats.totalEvaluations}
                  </div>
                  <div className="text-sm text-gray-500">Evaluations</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="interviews">Interviews</TabsTrigger>
          <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
          <TabsTrigger value="offers">Offers</TabsTrigger>
          <TabsTrigger value="background">Background</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {candidate.dateOfBirth && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date of Birth:</span>
                    <span>{format(new Date(candidate.dateOfBirth), 'MMM dd, yyyy')}</span>
                  </div>
                )}
                {candidate.gender && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gender:</span>
                    <span>{candidate.gender}</span>
                  </div>
                )}
                {candidate.nationality && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nationality:</span>
                    <span>{candidate.nationality}</span>
                  </div>
                )}
                {candidate.noticePeriod && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Notice Period:</span>
                    <span>{candidate.noticePeriod} days</span>
                  </div>
                )}
                {candidate.currentSalary && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Salary:</span>
                    <span>₹{candidate.currentSalary.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Source:</span>
                  <span>{candidate.source?.replace('_', ' ') || 'Not specified'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle>Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                  {candidate.skills.length === 0 && (
                    <span className="text-gray-500">No skills listed</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Education */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GraduationCap className="w-5 h-5 mr-2" />
                  Education
                </CardTitle>
              </CardHeader>
              <CardContent>
                {candidate.education.length > 0 ? (
                  <div className="space-y-4">
                    {candidate.education.map((edu, index) => (
                      <div key={index} className="border-l-2 border-blue-200 pl-4">
                        <h4 className="font-semibold">{edu.degree}</h4>
                        <p className="text-gray-600">{edu.institution}</p>
                        {edu.fieldOfStudy && (
                          <p className="text-sm text-gray-500">{edu.fieldOfStudy}</p>
                        )}
                        {(edu.startDate || edu.endDate) && (
                          <p className="text-sm text-gray-500">
                            {edu.startDate && format(new Date(edu.startDate), 'yyyy')} - {' '}
                            {edu.endDate ? format(new Date(edu.endDate), 'yyyy') : 'Present'}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-500">No education information</span>
                )}
              </CardContent>
            </Card>

            {/* Experience */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="w-5 h-5 mr-2" />
                  Experience
                </CardTitle>
              </CardHeader>
              <CardContent>
                {candidate.experience.length > 0 ? (
                  <div className="space-y-4">
                    {candidate.experience.map((exp, index) => (
                      <div key={index} className="border-l-2 border-green-200 pl-4">
                        <h4 className="font-semibold">{exp.position}</h4>
                        <p className="text-gray-600">{exp.company}</p>
                        {(exp.startDate || exp.endDate) && (
                          <p className="text-sm text-gray-500">
                            {exp.startDate && format(new Date(exp.startDate), 'MMM yyyy')} - {' '}
                            {exp.isCurrent ? 'Present' : (exp.endDate && format(new Date(exp.endDate), 'MMM yyyy'))}
                          </p>
                        )}
                        {exp.description && (
                          <p className="text-sm text-gray-600 mt-1">{exp.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-500">No experience information</span>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          {candidate.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{candidate.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>Job Applications</CardTitle>
              <CardDescription>
                All job applications submitted by this candidate
              </CardDescription>
            </CardHeader>
            <CardContent>
              {candidate.applications.length > 0 ? (
                <div className="space-y-4">
                  {candidate.applications.map((application) => (
                    <div key={application.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">{application.jobPosting.title}</h4>
                          <p className="text-sm text-gray-600">
                            Applied on {format(new Date(application.appliedAt), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <Badge variant="outline">{application.status}</Badge>
                      </div>
                      {application.coverLetter && (
                        <p className="text-sm text-gray-700 mt-2">{application.coverLetter}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No applications found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interviews">
          <Card>
            <CardHeader>
              <CardTitle>Interviews</CardTitle>
              <CardDescription>
                Interview history and feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              {candidate.interviews.length > 0 ? (
                <div className="space-y-4">
                  {candidate.interviews.map((interview) => (
                    <div key={interview.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">{interview.title}</h4>
                          <p className="text-sm text-gray-600">
                            {interview.jobPosting.title}
                          </p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(interview.scheduledAt), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                        <Badge variant="outline">{interview.status}</Badge>
                      </div>
                      {interview.feedback && (
                        <p className="text-sm text-gray-700 mt-2">{interview.feedback}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No interviews scheduled</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluations">
          <Card>
            <CardHeader>
              <CardTitle>Evaluations</CardTitle>
              <CardDescription>
                Assessment scores and feedback from interviewers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {candidate.evaluations.length > 0 ? (
                <div className="space-y-4">
                  {candidate.evaluations.map((evaluation) => (
                    <div key={evaluation.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">{evaluation.evaluationType}</h4>
                          <p className="text-sm text-gray-600">
                            By {evaluation.evaluatorName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(evaluation.createdAt), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div className="text-right">
                          {evaluation.overallScore && (
                            <div className="text-lg font-semibold">
                              {evaluation.overallScore}/10
                            </div>
                          )}
                          {evaluation.recommendation && (
                            <Badge variant="outline">{evaluation.recommendation}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No evaluations available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offers">
          <Card>
            <CardHeader>
              <CardTitle>Offers</CardTitle>
              <CardDescription>
                Job offers extended to this candidate
              </CardDescription>
            </CardHeader>
            <CardContent>
              {candidate.offers.length > 0 ? (
                <div className="space-y-4">
                  {candidate.offers.map((offer) => (
                    <div key={offer.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">{offer.position}</h4>
                          <p className="text-sm text-gray-600">
                            Salary: ₹{offer.baseSalary.toLocaleString()} {offer.salaryFrequency}
                          </p>
                          {offer.sentAt && (
                            <p className="text-sm text-gray-600">
                              Sent on {format(new Date(offer.sentAt), 'MMM dd, yyyy')}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline">{offer.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No offers extended</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="background">
          <Card>
            <CardHeader>
              <CardTitle>Background Checks</CardTitle>
              <CardDescription>
                Background verification status and results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {candidate.backgroundChecks.length > 0 ? (
                <div className="space-y-4">
                  {candidate.backgroundChecks.map((check) => (
                    <div key={check.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">{check.checkType}</h4>
                          <p className="text-sm text-gray-600">
                            Requested on {format(new Date(check.requestedAt), 'MMM dd, yyyy')}
                          </p>
                          {check.vendor && (
                            <p className="text-sm text-gray-600">Vendor: {check.vendor}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{check.status}</Badge>
                          {check.result && (
                            <div className="text-sm text-gray-600 mt-1">{check.result}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No background checks initiated</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
