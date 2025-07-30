'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Briefcase, Users, Filter, Eye, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface ApplicationsEmptyStateProps {
  onCreateJobPosting?: () => void;
}

export function ApplicationsEmptyState({ onCreateJobPosting }: ApplicationsEmptyStateProps) {
  return (
    <div className="flex flex-col space-y-8 py-8">
      <div className="flex h-[300px] shrink-0 items-center justify-center rounded-md border border-dashed bg-muted/20">
        <div className="mx-auto flex max-w-[500px] flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-4">
            <FileText className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-2xl font-semibold">No Applications Yet</h3>
          <p className="mt-3 text-muted-foreground max-w-[380px] mb-6">
            Start receiving applications by posting job openings. Track candidate applications and manage your recruitment pipeline.
          </p>
          <div className="flex gap-2">
            {onCreateJobPosting && (
              <Button size="lg" onClick={onCreateJobPosting}>
                <Briefcase className="mr-2 h-5 w-5" />
                Post a Job
              </Button>
            )}
            <Link href="/hr/recruitment/job-postings">
              <Button variant="outline" size="lg">
                <Eye className="mr-2 h-5 w-5" />
                View Job Postings
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <FileText className="h-4 w-4 mr-2 text-primary" />
              Application Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Track all applications in one place. Review resumes, cover letters, and candidate information.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <Filter className="h-4 w-4 mr-2 text-primary" />
              Smart Filtering
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Filter applications by status, job posting, skills, experience level, and other criteria.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-primary" />
              Pipeline Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Move candidates through your recruitment stages from application to hire.
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mx-auto mb-3">
            <Clock className="h-6 w-6 text-blue-600" />
          </div>
          <h4 className="font-medium text-sm mb-1">New Applications</h4>
          <p className="text-xs text-muted-foreground">Fresh applications waiting for review</p>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 mx-auto mb-3">
            <Eye className="h-6 w-6 text-yellow-600" />
          </div>
          <h4 className="font-medium text-sm mb-1">Under Review</h4>
          <p className="text-xs text-muted-foreground">Applications being evaluated</p>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 mx-auto mb-3">
            <Users className="h-6 w-6 text-purple-600" />
          </div>
          <h4 className="font-medium text-sm mb-1">Interview Stage</h4>
          <p className="text-xs text-muted-foreground">Candidates scheduled for interviews</p>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mx-auto mb-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h4 className="font-medium text-sm mb-1">Approved</h4>
          <p className="text-xs text-muted-foreground">Applications ready for offer</p>
        </Card>
      </div>
      
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-6 flex flex-col justify-center">
            <h3 className="text-xl font-semibold mb-2">Ready to Start Hiring?</h3>
            <p className="text-muted-foreground mb-4">
              Create your first job posting to start receiving applications. Our system will help you track and manage candidates throughout the hiring process.
            </p>
            <div>
              <Link href="/hr/recruitment/job-postings/create">
                <Button className="gap-1">
                  <Briefcase className="h-4 w-4" />
                  Create Job Posting
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex-1 bg-muted p-6 flex items-center justify-center">
            <div className="w-full max-w-sm">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="h-2 w-full rounded-full bg-primary/20 mb-1"></div>
                    <div className="h-2 w-3/4 rounded-full bg-primary/10"></div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="h-2 w-full rounded-full bg-primary/20 mb-1"></div>
                    <div className="h-2 w-2/3 rounded-full bg-primary/10"></div>
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
