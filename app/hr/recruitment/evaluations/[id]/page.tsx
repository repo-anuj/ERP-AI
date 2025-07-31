'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, Edit, Star, User, FileText, Calendar, 
  CheckCircle, XCircle, AlertTriangle, MessageSquare, Award
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Evaluation {
  id: string;
  evaluationType: string;
  technicalSkills: number;
  communication: number;
  problemSolving: number;
  culturalFit: number;
  experience: number;
  motivation: number;
  overallScore: number;
  recommendation: string;
  strengths: string;
  weaknesses: string;
  comments: string;
  status: string;
  evaluatorName: string;
  evaluatorId: string;
  createdAt: string;
  updatedAt: string;
  candidate: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  interview?: {
    id: string;
    title: string;
    type: string;
    scheduledAt: string;
  };
}

export default function EvaluationDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);

  useEffect(() => {
    fetchEvaluation();
  }, [params.id]);

  const fetchEvaluation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/hr/recruitment/evaluations/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch evaluation');
      
      const data = await response.json();
      setEvaluation(data.evaluation);
    } catch (error) {
      console.error('Error fetching evaluation:', error);
      toast({
        title: 'Error',
        description: 'Failed to load evaluation details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: FileText },
      submitted: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      reviewed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;
    
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getRecommendationBadge = (recommendation: string) => {
    const config = {
      hire: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'hire_with_conditions': { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
      'not_hire': { color: 'bg-red-100 text-red-800', icon: XCircle },
      'need_more_info': { color: 'bg-blue-100 text-blue-800', icon: MessageSquare },
    };

    const recommendationConfig = config[recommendation as keyof typeof config] || config.need_more_info;
    const Icon = recommendationConfig.icon;
    
    return (
      <Badge className={recommendationConfig.color}>
        <Icon className="w-3 h-3 mr-1" />
        {recommendation.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const renderScoreBar = (label: string, score: number, maxScore: number = 10) => {
    const percentage = (score / maxScore) * 100;
    const getScoreColor = (score: number) => {
      if (score >= 8) return 'bg-green-500';
      if (score >= 6) return 'bg-yellow-500';
      return 'bg-red-500';
    };

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">{label}</span>
          <span className="text-sm text-muted-foreground">{score}/{maxScore}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${getScoreColor(score)}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading evaluation details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Evaluation Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested evaluation could not be found.</p>
          <Button onClick={() => router.push('/hr/recruitment/evaluations')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Evaluations
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
          onClick={() => router.push('/hr/recruitment/evaluations')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Evaluations
        </Button>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Candidate Evaluation</h1>
            <p className="text-muted-foreground">
              {evaluation.candidate.firstName} {evaluation.candidate.lastName} • {evaluation.evaluationType}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit Evaluation
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overall Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Award className="w-5 h-5 mr-2" />
                  Overall Assessment
                </span>
                {getStatusBadge(evaluation.status)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-primary mb-2">
                  {evaluation.overallScore}/10
                </div>
                <div className="text-muted-foreground">Overall Score</div>
                {getRecommendationBadge(evaluation.recommendation)}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Scores */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Assessment</CardTitle>
              <CardDescription>
                Breakdown of evaluation criteria and scores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderScoreBar('Technical Skills', evaluation.technicalSkills)}
              {renderScoreBar('Communication', evaluation.communication)}
              {renderScoreBar('Problem Solving', evaluation.problemSolving)}
              {renderScoreBar('Cultural Fit', evaluation.culturalFit)}
              {renderScoreBar('Experience', evaluation.experience)}
              {renderScoreBar('Motivation', evaluation.motivation)}
            </CardContent>
          </Card>

          {/* Feedback */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Detailed Feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {evaluation.strengths && (
                <div>
                  <h4 className="font-medium text-green-700 mb-2">Strengths</h4>
                  <p className="text-sm bg-green-50 p-3 rounded-md border border-green-200">
                    {evaluation.strengths}
                  </p>
                </div>
              )}

              {evaluation.weaknesses && (
                <div>
                  <h4 className="font-medium text-orange-700 mb-2">Areas for Improvement</h4>
                  <p className="text-sm bg-orange-50 p-3 rounded-md border border-orange-200">
                    {evaluation.weaknesses}
                  </p>
                </div>
              )}

              {evaluation.comments && (
                <div>
                  <h4 className="font-medium mb-2">Additional Comments</h4>
                  <p className="text-sm bg-muted p-3 rounded-md">
                    {evaluation.comments}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
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
                    {evaluation.candidate.firstName[0]}{evaluation.candidate.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                Candidate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="font-medium">
                    {evaluation.candidate.firstName} {evaluation.candidate.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{evaluation.candidate.email}</p>
                  {evaluation.candidate.phone && (
                    <p className="text-sm text-muted-foreground">{evaluation.candidate.phone}</p>
                  )}
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  View Candidate Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Interview Information */}
          {evaluation.interview && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Related Interview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium">{evaluation.interview.title}</p>
                    <p className="text-sm text-muted-foreground">{evaluation.interview.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(evaluation.interview.scheduledAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    View Interview Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Evaluator Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Evaluator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="font-medium">{evaluation.evaluatorName}</p>
                  <p className="text-sm text-muted-foreground">Evaluator</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Submitted: {format(new Date(evaluation.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                  {evaluation.updatedAt !== evaluation.createdAt && (
                    <p>Updated: {format(new Date(evaluation.updatedAt), 'MMM dd, yyyy HH:mm')}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full">
                Export Evaluation
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                Share with Team
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                Add to Candidate Notes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
