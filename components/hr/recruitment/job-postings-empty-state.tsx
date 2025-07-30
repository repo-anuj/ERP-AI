'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Briefcase, Users, TrendingUp, Plus, FileText, Target } from 'lucide-react';

interface JobPostingsEmptyStateProps {
  onCreateJobPosting: () => void;
}

export function JobPostingsEmptyState({ onCreateJobPosting }: JobPostingsEmptyStateProps) {
  return (
    <Card className="w-full">
      <CardContent className="flex flex-col items-center justify-center py-12 space-y-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Briefcase className="h-10 w-10 text-primary" />
        </div>
        
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-medium">No Job Postings Yet</h3>
          <p className="text-muted-foreground max-w-md">
            Start building your team by creating your first job posting. Attract top talent and streamline your recruitment process.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
          <Card className="p-4 flex flex-col items-center text-center space-y-2 hover:bg-muted/50 transition-colors cursor-pointer" onClick={onCreateJobPosting}>
            <Plus className="h-8 w-8 text-primary mb-2" />
            <h4 className="font-medium">Create Job Posting</h4>
            <p className="text-sm text-muted-foreground">Post your first job opening</p>
          </Card>
          
          <Card className="p-4 flex flex-col items-center text-center space-y-2 hover:bg-muted/50 transition-colors cursor-pointer">
            <Users className="h-8 w-8 text-primary mb-2" />
            <h4 className="font-medium">Manage Applications</h4>
            <p className="text-sm text-muted-foreground">Track and review candidates</p>
          </Card>
          
          <Card className="p-4 flex flex-col items-center text-center space-y-2 hover:bg-muted/50 transition-colors cursor-pointer">
            <TrendingUp className="h-8 w-8 text-primary mb-2" />
            <h4 className="font-medium">Analytics & Reports</h4>
            <p className="text-sm text-muted-foreground">Track hiring performance</p>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mt-8">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <FileText className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium text-sm">Professional Job Descriptions</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Create detailed job descriptions with requirements, responsibilities, and benefits
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Target className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-sm">Targeted Recruitment</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Set specific criteria and reach the right candidates for your open positions
              </p>
            </div>
          </div>
        </div>
        
        <Button onClick={onCreateJobPosting} className="mt-6">
          <Plus className="h-4 w-4 mr-2" />
          Create Your First Job Posting
        </Button>
      </CardContent>
    </Card>
  );
}
