'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, User, Mail, Briefcase, Calendar, Building, UserPlus, CheckCircle, FileText, Upload } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { OnboardingChecklist } from '@/components/recruitment/onboarding-checklist';
import { useToast } from '@/hooks/use-toast';

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  department: string;
  startDate: string;
  status: 'pending' | 'in-progress' | 'completed' | 'withdrawn';
  hireDate: string;
  salary: number;
  manager: {
    id: string;
    name: string;
    email: string;
  };
  offer: {
    id: string;
    title: string;
    description: string;
    salary: number;
    status: string;
    sentDate: string;
    acceptedDate?: string;
  };
}

export default function OnboardingPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  // In a real app, this would be fetched from an API
  const [candidate, setCandidate] = useState<Candidate>({
    id: params.id as string,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '(555) 123-4567',
    position: 'Senior Software Engineer',
    department: 'Engineering',
    startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
    status: 'in-progress',
    hireDate: new Date().toISOString(),
    salary: 125000,
    manager: {
      id: 'm1',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
    },
    offer: {
      id: 'o1',
      title: 'Senior Software Engineer Offer',
      description: 'Full-time position with benefits',
      salary: 125000,
      status: 'accepted',
      sentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      acceptedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    },
  });

  const handleTaskUpdate = (taskId: string, status: string) => {
    console.log(`Task ${taskId} updated to status: ${status}`);
    // In a real app, this would update the task status in the database
    toast({
      title: 'Task updated',
      description: 'The task status has been updated successfully.',
    });
  };

  const handleCompleteOnboarding = () => {
    // In a real app, this would update the onboarding status in the database
    setCandidate(prev => ({
      ...prev,
      status: 'completed',
    }));
    
    toast({
      title: 'Onboarding completed',
      description: `${candidate.firstName}'s onboarding has been marked as complete.`,
    });
    
    // Optionally redirect to the employee profile
    // router.push(`/employees/${candidate.id}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">In Progress</Badge>;
      case 'withdrawn':
        return <Badge variant="destructive">Withdrawn</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
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
          Back to Candidates
        </Button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {candidate.firstName} {candidate.lastName}
            </h1>
            <p className="text-muted-foreground">
              Onboarding for {candidate.position}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(candidate.status)}
            <Button variant="outline" size="sm" disabled={candidate.status === 'completed'}>
              <UserPlus className="h-4 w-4 mr-2" />
              Create Employee Profile
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Candidate</CardDescription>
              <CardTitle className="text-lg">
                {candidate.firstName} {candidate.lastName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={`/avatars/${candidate.id}.jpg`} />
                  <AvatarFallback>
                    {candidate.firstName[0]}{candidate.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{candidate.email}</span>
                  </div>
                  {candidate.phone && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{candidate.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Position</CardDescription>
              <CardTitle className="text-lg">
                {candidate.position}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="text-sm">{candidate.department}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="text-sm">
                    {format(new Date(candidate.startDate), 'MMMM d, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hire Date</p>
                  <p className="text-sm">
                    {format(new Date(candidate.hireDate), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Manager</CardDescription>
              <CardTitle className="text-lg">
                {candidate.manager.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{candidate.manager.email}</span>
                </div>
                <div className="pt-2">
                  <Button variant="outline" size="sm" className="w-full">
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Manager
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Offer Details</CardDescription>
              <CardTitle className="text-lg">
                {candidate.offer.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={candidate.offer.status === 'accepted' ? 'success' : 'outline'}>
                    {candidate.offer.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Salary</p>
                  <p className="text-sm">
                    ${candidate.offer.salary.toLocaleString()}/year
                  </p>
                </div>
                {candidate.offer.acceptedDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Accepted On</p>
                    <p className="text-sm">
                      {format(new Date(candidate.offer.acceptedDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="checklist" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5">
            <TabsTrigger value="checklist">Onboarding Checklist</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
            <TabsTrigger value="training">Training</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="checklist" className="pt-6">
            <OnboardingChecklist 
              candidate={{
                id: candidate.id,
                name: `${candidate.firstName} ${candidate.lastName}`,
                email: candidate.email,
                position: candidate.position,
                department: candidate.department,
                startDate: new Date(candidate.startDate),
              }}
              onTaskUpdate={handleTaskUpdate}
              onCompleteOnboarding={handleCompleteOnboarding}
            />
          </TabsContent>
          
          <TabsContent value="documents" className="pt-6">
            <Card>
              <CardHeader>
                <CardTitle>Onboarding Documents</CardTitle>
                <CardDescription>
                  All documents related to {candidate.firstName}'s onboarding
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No documents uploaded yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload and manage all onboarding documents here.
                  </p>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="equipment" className="pt-6">
            <Card>
              <CardHeader>
                <CardTitle>Equipment Assignment</CardTitle>
                <CardDescription>
                  Manage {candidate.firstName}'s equipment and assets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Laptop</CardDescription>
                      <CardTitle className="text-lg">
                        MacBook Pro 16"
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">Status:</span> Ready for pickup
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Assigned:</span> {format(new Date(), 'MMM d, yyyy')}
                        </p>
                        <Button variant="outline" size="sm" className="w-full mt-2">
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Access Card</CardDescription>
                      <CardTitle className="text-lg">
                        Office Access
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">Status:</span> Not issued
                        </p>
                        <Button variant="outline" size="sm" className="w-full mt-2">
                          Request Access Card
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Other Equipment</CardDescription>
                      <CardTitle className="text-lg">
                        Additional Items
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          No additional equipment assigned yet.
                        </p>
                        <Button variant="outline" size="sm" className="w-full mt-2">
                          Add Equipment
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="training" className="pt-6">
            <Card>
              <CardHeader>
                <CardTitle>Training & Development</CardTitle>
                <CardDescription>
                  Training modules and development plan for {candidate.firstName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Company Onboarding</h4>
                        <p className="text-sm text-muted-foreground">
                          Mandatory company policies and procedures
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span>100%</span>
                      </div>
                      <div className="mt-1 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: '100%' }}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Security Training</h4>
                        <p className="text-sm text-muted-foreground">
                          Information security and data protection
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        In Progress
                      </Badge>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span>45%</span>
                      </div>
                      <div className="mt-1 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: '45%' }}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Technical Training</h4>
                        <p className="text-sm text-muted-foreground">
                          Role-specific technical skills and tools
                        </p>
                      </div>
                      <Badge variant="outline">Not Started</Badge>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span>0%</span>
                      </div>
                      <div className="mt-1 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gray-300" style={{ width: '0%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notes" className="pt-6">
            <Card>
              <CardHeader>
                <CardTitle>Onboarding Notes</CardTitle>
                <CardDescription>
                  Add and review notes about {candidate.firstName}'s onboarding process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="/avatars/you.jpg" />
                        <AvatarFallback>Y</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">You</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {format(new Date(), 'MMM d, yyyy h:mm a')}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <textarea
                            placeholder="Add a note about the onboarding process..."
                            className="w-full min-h-[100px] p-2 border rounded-md text-sm"
                          />
                          <div className="mt-2 flex justify-end">
                            <Button size="sm">Add Note</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src="/avatars/jane.jpg" />
                          <AvatarFallback>JS</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium">Jane Smith</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                {format(new Date(Date.now() - 86400000), 'MMM d, yyyy h:mm a')}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 text-sm">
                            John has completed all the required paperwork and is scheduled for IT equipment setup on his start date. He's been very responsive throughout the process.
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src="/avatars/mike.jpg" />
                          <AvatarFallback>MR</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium">Mike Ross</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                {format(new Date(Date.now() - 2 * 86400000), 'MMM d, yyyy h:mm a')}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 text-sm">
                            Initial onboarding meeting scheduled. John seems excited to join the team and has already started reviewing the company handbook.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
