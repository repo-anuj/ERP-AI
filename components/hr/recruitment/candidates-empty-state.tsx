'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserPlus, Search, Filter, Upload, FileText, Target, TrendingUp } from 'lucide-react';

interface CandidatesEmptyStateProps {
  onAddCandidate?: () => void;
}

export function CandidatesEmptyState({ onAddCandidate }: CandidatesEmptyStateProps) {
  return (
    <div className="flex flex-col space-y-8 py-8">
      <div className="flex h-[300px] shrink-0 items-center justify-center rounded-md border border-dashed bg-muted/20">
        <div className="mx-auto flex max-w-[500px] flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Users className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-2xl font-semibold">No Candidates Yet</h3>
          <p className="mt-3 text-muted-foreground max-w-[380px] mb-6">
            Start building your talent pipeline by adding candidates. Track applications, schedule interviews, and manage your recruitment process.
          </p>
          {onAddCandidate && (
            <Button size="lg" onClick={onAddCandidate}>
              <UserPlus className="mr-2 h-5 w-5" />
              Add Your First Candidate
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <UserPlus className="h-4 w-4 mr-2 text-primary" />
              Add Candidates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Manually add candidates or import from job applications. Build a comprehensive candidate database.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <Search className="h-4 w-4 mr-2 text-primary" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Easily find candidates using advanced search and filtering options by skills, experience, and location.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-primary" />
              Track Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Monitor candidate progress through your recruitment pipeline from application to hire.
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-6 flex flex-col justify-center">
            <h3 className="text-xl font-semibold mb-2">Import Existing Candidates?</h3>
            <p className="text-muted-foreground mb-4">
              You can easily import your existing candidate data from CSV files or integrate with external recruitment platforms.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-1">
                <Upload className="h-4 w-4" />
                Import CSV
              </Button>
              <Button variant="outline" className="gap-1">
                <FileText className="h-4 w-4" />
                Learn More
              </Button>
            </div>
          </div>
          <div className="flex-1 bg-muted p-6 flex items-center justify-center">
            <div className="w-full max-w-sm">
              <div className="space-y-2 mb-4">
                <div className="h-2 w-full rounded-full bg-primary/20"></div>
                <div className="h-2 w-5/6 rounded-full bg-primary/20"></div>
                <div className="h-2 w-4/6 rounded-full bg-primary/20"></div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="h-16 rounded-md bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary/60" />
                </div>
                <div className="h-16 rounded-md bg-primary/10 flex items-center justify-center">
                  <Target className="h-6 w-6 text-primary/60" />
                </div>
                <div className="h-16 rounded-md bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary/60" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
