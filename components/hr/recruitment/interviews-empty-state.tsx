'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Video, Users, Clock, MapPin, Phone, MessageSquare, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface InterviewsEmptyStateProps {
  onScheduleInterview?: () => void;
}

export function InterviewsEmptyState({ onScheduleInterview }: InterviewsEmptyStateProps) {
  return (
    <div className="flex flex-col space-y-8 py-8">
      <div className="flex h-[300px] shrink-0 items-center justify-center rounded-md border border-dashed bg-muted/20">
        <div className="mx-auto flex max-w-[500px] flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Calendar className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-2xl font-semibold">No Interviews Scheduled</h3>
          <p className="mt-3 text-muted-foreground max-w-[380px] mb-6">
            Start scheduling interviews with qualified candidates. Manage interview rounds, feedback, and evaluations all in one place.
          </p>
          <div className="flex gap-2">
            {onScheduleInterview && (
              <Button size="lg" onClick={onScheduleInterview}>
                <Calendar className="mr-2 h-5 w-5" />
                Schedule Interview
              </Button>
            )}
            <Link href="/hr/recruitment/candidates">
              <Button variant="outline" size="lg">
                <Users className="mr-2 h-5 w-5" />
                View Candidates
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-primary" />
              Interview Scheduling
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Schedule interviews with candidates, set reminders, and manage interview rounds efficiently.
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
              Collect structured feedback from interviewers and track candidate evaluations.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-primary" />
              Interview Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Track interview success rates, time-to-hire, and interviewer performance metrics.
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mx-auto mb-3">
            <Phone className="h-6 w-6 text-blue-600" />
          </div>
          <h4 className="font-medium text-sm mb-1">Phone Screening</h4>
          <p className="text-xs text-muted-foreground">Initial phone interviews</p>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mx-auto mb-3">
            <Video className="h-6 w-6 text-green-600" />
          </div>
          <h4 className="font-medium text-sm mb-1">Video Interview</h4>
          <p className="text-xs text-muted-foreground">Remote video calls</p>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 mx-auto mb-3">
            <MapPin className="h-6 w-6 text-purple-600" />
          </div>
          <h4 className="font-medium text-sm mb-1">On-site Interview</h4>
          <p className="text-xs text-muted-foreground">In-person meetings</p>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 mx-auto mb-3">
            <Users className="h-6 w-6 text-orange-600" />
          </div>
          <h4 className="font-medium text-sm mb-1">Panel Interview</h4>
          <p className="text-xs text-muted-foreground">Multiple interviewers</p>
        </Card>
      </div>
      
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-6 flex flex-col justify-center">
            <h3 className="text-xl font-semibold mb-2">Streamline Your Interview Process</h3>
            <p className="text-muted-foreground mb-4">
              Our interview management system helps you schedule, conduct, and evaluate interviews efficiently. Set up interview rounds, collect feedback, and make data-driven hiring decisions.
            </p>
            <div className="flex gap-2">
              <Button className="gap-1">
                <Calendar className="h-4 w-4" />
                Schedule Interview
              </Button>
              <Button variant="outline" className="gap-1">
                <MessageSquare className="h-4 w-4" />
                Interview Guide
              </Button>
            </div>
          </div>
          <div className="flex-1 bg-muted p-6 flex items-center justify-center">
            <div className="w-full max-w-sm">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium mb-1">Today, 2:00 PM</div>
                    <div className="text-xs text-muted-foreground">Phone Screening</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Video className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium mb-1">Tomorrow, 10:00 AM</div>
                    <div className="text-xs text-muted-foreground">Technical Interview</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Users className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium mb-1">Friday, 3:00 PM</div>
                    <div className="text-xs text-muted-foreground">Final Round</div>
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
