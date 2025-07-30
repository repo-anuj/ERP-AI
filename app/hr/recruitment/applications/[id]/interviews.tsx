'use client';

import { Calendar, Clock, User, CheckCircle, XCircle, Clock4, AlertCircle, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Application } from './page';

interface InterviewsTabProps {
  application: Application;
  onScheduleInterview: () => void;
}

const getInterviewStatusIcon = (status: string) => {
  switch (status) {
    case 'scheduled':
      return <Clock4 className="h-4 w-4 text-yellow-500" />;
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'cancelled':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-500" />;
  }
};

export function InterviewsTab({ application, onScheduleInterview }: InterviewsTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Interviews</CardTitle>
          <Button size="sm" onClick={onScheduleInterview}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Interview
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {application.interviews && application.interviews.length > 0 ? (
          <div className="space-y-4">
            {application.interviews.map((interview) => (
              <div key={interview.id} className="border rounded-lg p-4 hover:bg-muted/50">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      {getInterviewStatusIcon(interview.status)}
                      <h4 className="font-medium">
                        {interview.type} Interview
                      </h4>
                      <Badge variant="outline" className="ml-2">
                        {interview.status}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(interview.scheduledAt), 'EEEE, MMMM d, yyyy')}
                      </span>
                      <Clock className="h-4 w-4 ml-2" />
                      <span>
                        {format(new Date(interview.scheduledAt), 'h:mm a')}
                      </span>
                    </div>
                    {interview.interviewers.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground">Interviewers:</p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {interview.interviewers.map((interviewer) => (
                            <Badge key={interviewer.id} variant="outline">
                              <User className="h-3 w-3 mr-1" />
                              {interviewer.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
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
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No interviews scheduled</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Schedule an interview to move this candidate forward in the hiring process.
            </p>
            <Button onClick={onScheduleInterview}>
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Interview
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
