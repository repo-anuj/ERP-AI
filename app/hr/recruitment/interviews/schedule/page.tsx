'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Clock, MapPin, Users, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  type: z.string().min(1, 'Interview type is required'),
  date: z.date({
    required_error: 'Please select a date',
  }),
  startTime: z.string().min(1, 'Start time is required'),
  duration: z.string().min(1, 'Duration is required'),
  location: z.string().optional(),
  meetingLink: z.string().url().optional().or(z.literal('')),
  description: z.string().optional(),
  candidateId: z.string().min(1, 'Candidate is required'),
  jobPostingId: z.string().min(1, 'Job posting is required'),
  applicationId: z.string().optional(),
  interviewers: z.array(z.string()).min(1, 'At least one interviewer is required'),
});

type FormValues = z.infer<typeof formSchema>;

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface JobPosting {
  id: string;
  title: string;
  department?: { name: string };
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
}

export default function ScheduleInterviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Get URL parameters
  const applicationId = searchParams.get('applicationId');
  const candidateId = searchParams.get('candidateId');
  const jobPostingId = searchParams.get('jobPostingId');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      type: '',
      date: new Date(),
      startTime: '10:00',
      duration: '60',
      location: '',
      meetingLink: '',
      description: '',
      candidateId: candidateId || '',
      jobPostingId: jobPostingId || '',
      applicationId: applicationId || '',
      interviewers: [],
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch candidates
      const candidatesResponse = await fetch('/api/hr/recruitment/candidates');
      if (candidatesResponse.ok) {
        const candidatesData = await candidatesResponse.json();
        setCandidates(candidatesData.candidates || []);
      }

      // Fetch job postings
      const jobPostingsResponse = await fetch('/api/hr/recruitment/job-postings');
      if (jobPostingsResponse.ok) {
        const jobPostingsData = await jobPostingsResponse.json();
        setJobPostings(jobPostingsData.jobPostings || []);
      }

      // Fetch employees for interviewers
      const employeesResponse = await fetch('/api/employees');
      if (employeesResponse.ok) {
        const employeesData = await employeesResponse.json();
        setEmployees(Array.isArray(employeesData) ? employeesData : []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true);

      // Format the date and time
      const [hours, minutes] = data.startTime.split(':').map(Number);
      const scheduledDate = new Date(data.date);
      scheduledDate.setHours(hours, minutes, 0, 0);

      // Prepare the interview data
      const interviewData = {
        jobPostingId: data.jobPostingId,
        candidateId: data.candidateId,
        applicationId: data.applicationId || null,
        title: data.title,
        type: data.type,
        scheduledAt: scheduledDate.toISOString(),
        duration: parseInt(data.duration, 10),
        location: data.location || null,
        meetingLink: data.meetingLink || null,
        interviewers: data.interviewers.map(id => ({
          interviewerId: id,
          interviewerName: employees.find(e => e.id === id)?.firstName + ' ' + employees.find(e => e.id === id)?.lastName,
          interviewerEmail: employees.find(e => e.id === id)?.email,
          role: 'interviewer',
          isRequired: true,
        })),
      };

      const response = await fetch('/api/hr/recruitment/interviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(interviewData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to schedule interview');
      }

      const result = await response.json();

      toast({
        title: 'Success',
        description: 'Interview scheduled successfully',
      });

      // Navigate back to interviews list or application page
      if (applicationId) {
        router.push(`/hr/recruitment/applications/${applicationId}?tab=interviews`);
      } else {
        router.push('/hr/recruitment/interviews');
      }
    } catch (error: any) {
      console.error('Error scheduling interview:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to schedule interview',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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
          Back
        </Button>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">Schedule Interview</h1>
          <p className="text-muted-foreground">
            Schedule a new interview with a candidate
          </p>
        </div>
      </div>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Interview Details</CardTitle>
          <CardDescription>
            Fill in the details to schedule a new interview
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interview Title</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., Technical Interview - Round 1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interview Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select interview type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="phone">Phone Interview</SelectItem>
                          <SelectItem value="video">Video Interview</SelectItem>
                          <SelectItem value="in_person">In-Person Interview</SelectItem>
                          <SelectItem value="technical">Technical Interview</SelectItem>
                          <SelectItem value="hr">HR Interview</SelectItem>
                          <SelectItem value="panel">Panel Interview</SelectItem>
                          <SelectItem value="final">Final Interview</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="candidateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Candidate</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select candidate" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {candidates.map((candidate) => (
                            <SelectItem key={candidate.id} value={candidate.id}>
                              {candidate.firstName} {candidate.lastName} ({candidate.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="jobPostingId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Posting</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select job posting" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {jobPostings.map((job) => (
                            <SelectItem key={job.id} value={job.id}>
                              {job.title} {job.department && `(${job.department.name})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value ? field.value.toISOString().split('T')[0] : ''}
                          onChange={(e) => {
                            const date = e.target.value ? new Date(e.target.value) : new Date();
                            field.onChange(date);
                          }}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="45">45 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="90">1.5 hours</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., Conference Room A, Online" {...field} />
                      </FormControl>
                      <FormDescription>
                        Physical location or "Online" for virtual interviews
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="meetingLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meeting Link (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://zoom.us/j/..." {...field} />
                      </FormControl>
                      <FormDescription>
                        Video call link for virtual interviews
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="interviewers"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Interviewers</FormLabel>
                      <FormDescription>
                        Select the employees who will conduct this interview
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {employees.map((employee) => (
                        <FormField
                          key={employee.id}
                          control={form.control}
                          name="interviewers"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={employee.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(employee.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, employee.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== employee.id
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">
                                  {employee.firstName} {employee.lastName}
                                  <br />
                                  <span className="text-xs text-muted-foreground">
                                    {employee.position}
                                  </span>
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes or agenda for the interview..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Scheduling...' : 'Schedule Interview'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
