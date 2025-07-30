'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, FileText, Users, BarChart, MessageSquare, Target, TrendingUp, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface EvaluationsEmptyStateProps {
  onCreateEvaluation?: () => void;
}

export function EvaluationsEmptyState({ onCreateEvaluation }: EvaluationsEmptyStateProps) {
  return (
    <div className="flex flex-col space-y-8 py-8">
      <div className="flex h-[300px] shrink-0 items-center justify-center rounded-md border border-dashed bg-muted/20">
        <div className="mx-auto flex max-w-[500px] flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Star className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-2xl font-semibold">No Evaluations Yet</h3>
          <p className="mt-3 text-muted-foreground max-w-[380px] mb-6">
            Start evaluating candidates with structured assessments. Create evaluation forms, collect feedback, and make data-driven hiring decisions.
          </p>
          <div className="flex gap-2">
            {onCreateEvaluation && (
              <Button size="lg" onClick={onCreateEvaluation}>
                <Star className="mr-2 h-5 w-5" />
                Create Evaluation
              </Button>
            )}
            <Link href="/hr/recruitment/interviews">
              <Button variant="outline" size="lg">
                <MessageSquare className="mr-2 h-5 w-5" />
                View Interviews
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <Star className="h-4 w-4 mr-2 text-primary" />
              Structured Evaluations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Create standardized evaluation forms with scoring criteria for consistent candidate assessment.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <MessageSquare className="h-4 w-4 mr-2 text-primary" />
              Feedback Collection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Gather feedback from multiple interviewers and stakeholders for comprehensive candidate evaluation.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <BarChart className="h-4 w-4 mr-2 text-primary" />
              Scoring & Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Track evaluation scores, compare candidates, and analyze hiring patterns and success rates.
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mx-auto mb-3">
            <Target className="h-6 w-6 text-blue-600" />
          </div>
          <h4 className="font-medium text-sm mb-1">Technical Skills</h4>
          <p className="text-xs text-muted-foreground">Assess technical competencies</p>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mx-auto mb-3">
            <Users className="h-6 w-6 text-green-600" />
          </div>
          <h4 className="font-medium text-sm mb-1">Soft Skills</h4>
          <p className="text-xs text-muted-foreground">Evaluate communication & teamwork</p>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 mx-auto mb-3">
            <TrendingUp className="h-6 w-6 text-purple-600" />
          </div>
          <h4 className="font-medium text-sm mb-1">Cultural Fit</h4>
          <p className="text-xs text-muted-foreground">Assess company culture alignment</p>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 mx-auto mb-3">
            <CheckCircle className="h-6 w-6 text-orange-600" />
          </div>
          <h4 className="font-medium text-sm mb-1">Overall Rating</h4>
          <p className="text-xs text-muted-foreground">Comprehensive candidate score</p>
        </Card>
      </div>
      
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-6 flex flex-col justify-center">
            <h3 className="text-xl font-semibold mb-2">Standardize Your Evaluation Process</h3>
            <p className="text-muted-foreground mb-4">
              Create consistent evaluation criteria to ensure fair and objective candidate assessment. Our evaluation system helps you make data-driven hiring decisions.
            </p>
            <div className="flex gap-2">
              <Button className="gap-1">
                <Star className="h-4 w-4" />
                Create Evaluation
              </Button>
              <Button variant="outline" className="gap-1">
                <FileText className="h-4 w-4" />
                Evaluation Templates
              </Button>
            </div>
          </div>
          <div className="flex-1 bg-muted p-6 flex items-center justify-center">
            <div className="w-full max-w-sm">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Star className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">Candidate Evaluation</div>
                    <div className="text-xs text-muted-foreground">Software Engineer Position</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Technical Skills</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`h-3 w-3 ${star <= 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Communication</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`h-3 w-3 ${star <= 5 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Cultural Fit</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`h-3 w-3 ${star <= 3 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Overall Score</span>
                      <span className="text-primary">4.0/5.0</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
