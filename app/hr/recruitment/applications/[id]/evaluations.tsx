'use client';

import { Star, FileText as FileCheck, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Application } from './page';

interface EvaluationsTabProps {
  application: Application;
}

const getEvaluationStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'pending':
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    case 'rejected':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-500" />;
  }
};

export function EvaluationsTab({ application }: EvaluationsTabProps) {
  // Calculate average score if evaluations exist
  const averageScore = application.evaluations?.length
    ? (application.evaluations.reduce((sum: number, evalItem: any) => sum + (evalItem.overallScore || 0), 0) / application.evaluations.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Evaluations
            </CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{application.evaluations?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {application.evaluations?.length === 0 ? 'No evaluations yet' : 'From interviewers'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Score
            </CardTitle>
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageScore}/10</div>
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className={`h-4 w-4 ${
                    star <= Math.floor(Number(averageScore) / 2) 
                      ? 'fill-yellow-400 text-yellow-400' 
                      : 'text-gray-300'
                  }`} 
                />
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recommendation
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {application.status === 'hired' ? 'Hire' : 'In Progress'}
            </div>
            <p className="text-xs text-muted-foreground">
              {application.status === 'hired' 
                ? 'Candidate has been hired' 
                : 'Evaluation in progress'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evaluation Details</CardTitle>
        </CardHeader>
        <CardContent>
          {application.evaluations && application.evaluations.length > 0 ? (
            <div className="space-y-4">
              {application.evaluations.map((evaluation: any) => (
                <div key={evaluation.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        {getEvaluationStatusIcon(evaluation.status)}
                        <h4 className="font-medium">
                          Evaluation by {evaluation.submittedBy.name}
                        </h4>
                        <Badge variant="outline" className="ml-2">
                          {evaluation.status}
                        </Badge>
                      </div>
                      
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Overall Score:</span>
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= Math.floor((evaluation.overallScore || 0) / 2)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                            <span className="ml-2 text-sm text-muted-foreground">
                              {(evaluation.overallScore || 0).toFixed(1)}/10
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>Submitted by {evaluation.submittedBy.name} ({evaluation.submittedBy.role})</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>On {format(new Date(evaluation.submittedAt), 'MMMM d, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No evaluations yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Evaluations will appear here after interviewers submit their feedback.
              </p>
              <Button disabled={!application.interviews?.length}>
                Request Evaluation
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {application.evaluations && application.evaluations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Evaluation Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Strengths</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Technical Skills</Badge>
                  <Badge variant="secondary">Problem Solving</Badge>
                  <Badge variant="secondary">Communication</Badge>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Areas for Improvement</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Industry Knowledge</Badge>
                  <Badge variant="outline">Experience with [Specific Tech]</Badge>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Overall Recommendation</h4>
                <div className="p-4 bg-muted/50 rounded-md">
                  <p className="text-sm">
                    {application.evaluations.some((e: any) => (e.overallScore || 0) >= 8)
                      ? 'Strong candidate with excellent skills and potential. Recommended for the next round/hire.'
                      : application.evaluations.some((e: any) => (e.overallScore || 0) >= 6)
                      ? 'Competent candidate with some areas for improvement. Consider for the next round with additional training.'
                      : 'Candidate may not be the best fit for this role at this time.'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
