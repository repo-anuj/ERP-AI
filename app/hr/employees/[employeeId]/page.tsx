'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { 
  ArrowLeft, 
  Edit, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase, 
  User, 
  Clock,
  FileText,
  Award,
  GraduationCap,
  Building,
  Users,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { EmployeeIdProofs } from '@/components/hr/employee-id-proofs';
import { EmployeeDocuments } from '@/components/hr/employee-documents';
import { EmployeeEducation } from '@/components/hr/employee-education';
import { EmployeeCertifications } from '@/components/hr/employee-certifications';
import { EmployeeRewardDashboard } from '@/components/hr/employee-reward-dashboard';
import { ManualRewardAward } from '@/components/hr/manual-reward-award';
import { EmployeeLeaveApplication } from '@/components/hr/employee-leave-application';
import { EnhancedEditEmployeeModal } from '@/components/hr/enhanced-edit-employee-modal';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  department?: {
    id: string;
    name: string;
  } | string;
  startDate: string;
  salary?: number;
  status: string;
  role: string;
  employeeId?: string;
  avatar?: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  nationality?: string;
  personalEmail?: string;
  alternatePhone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  jobTitle?: string;
  workLocation?: string;
  manager?: string;
  hireDate?: string;
  contractType?: string;
  workType?: string;
  education?: Array<{
    id: string;
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    startDate?: string;
    endDate?: string;
    gpa?: string;
    description?: string;
  }>;
  skills?: string[];
  certifications?: Array<{
    id: string;
    name: string;
    issuingOrg: string;
    issueDate?: string;
    expiryDate?: string;
    credentialId?: string;
    description?: string;
  }>;
  bio?: string;
  notes?: string;
  projects?: Array<{
    id: string;
    name: string;
    status: string;
    projectManager: {
      employeeId: string;
      name: string;
    };
    teamMembers: Array<{
      employeeId: string;
      name: string;
    }>;
  }>;
  recentAttendance?: Array<{
    id: string;
    date: string;
    checkIn: string;
    checkOut?: string;
    status: string;
    notes?: string;
  }>;
  assignedTasks?: Array<{
    id: string;
    name: string;
    status: string;
    priority: string;
    dueDate: string;
    completionPercentage: number;
    project: {
      id: string;
      name: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function EmployeeProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const employeeId = params.employeeId as string;

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/employees/${employeeId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch employee data');
        }
        
        const data = await response.json();
        setEmployee(data);
      } catch (error) {
        console.error('Error fetching employee:', error);
        toast({
          title: 'Error',
          description: 'Failed to load employee data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (employeeId) {
      fetchEmployee();
    }
  }, [employeeId, toast]);

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Employee Not Found</h3>
            <p className="text-sm text-muted-foreground">
              The employee you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/hr'}
              className="mt-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to HR
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'on_leave':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const handleEditSuccess = () => {
    // Refresh employee data after successful edit
    const fetchEmployee = async () => {
      try {
        const response = await fetch(`/api/employees/${employeeId}`);
        if (response.ok) {
          const data = await response.json();
          setEmployee(data);
        }
      } catch (error) {
        console.error('Error refreshing employee data:', error);
      }
    };
    fetchEmployee();
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = '/hr'}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to HR
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {employee.firstName} {employee.lastName}
            </h2>
            <p className="text-muted-foreground">
              {employee.position} • {typeof employee.department === 'string' ? employee.department : employee.department?.name || 'No Department'}
            </p>
          </div>
        </div>
        <Button onClick={() => setIsEditModalOpen(true)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      {/* Profile Overview Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start space-x-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={employee.avatar} alt={`${employee.firstName} ${employee.lastName}`} />
              <AvatarFallback className="text-lg">
                {getInitials(employee.firstName, employee.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{employee.email}</span>
                  </div>
                  {employee.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{employee.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Started {formatDate(employee.startDate)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{employee.position}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{typeof employee.department === 'string' ? employee.department : employee.department?.name || 'No Department'}</span>
                  </div>
                  {employee.employeeId && (
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">ID: {employee.employeeId}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Badge variant={getStatusColor(employee.status) as any}>
                    {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    Role: {employee.role.charAt(0).toUpperCase() + employee.role.slice(1)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-10">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="leave">Leave</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="id-proofs">ID Proofs</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Personal Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {employee.dateOfBirth && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Date of Birth:</span>
                    <span className="text-sm">{formatDate(employee.dateOfBirth)}</span>
                  </div>
                )}
                {employee.gender && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Gender:</span>
                    <span className="text-sm capitalize">{employee.gender}</span>
                  </div>
                )}
                {employee.maritalStatus && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Marital Status:</span>
                    <span className="text-sm capitalize">{employee.maritalStatus}</span>
                  </div>
                )}
                {employee.nationality && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Nationality:</span>
                    <span className="text-sm">{employee.nationality}</span>
                  </div>
                )}
                {employee.personalEmail && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Personal Email:</span>
                    <span className="text-sm">{employee.personalEmail}</span>
                  </div>
                )}
                {employee.alternatePhone && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Alternate Phone:</span>
                    <span className="text-sm">{employee.alternatePhone}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Phone className="h-5 w-5" />
                  <span>Emergency Contact</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {employee.emergencyContactName && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Name:</span>
                    <span className="text-sm">{employee.emergencyContactName}</span>
                  </div>
                )}
                {employee.emergencyContactPhone && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Phone:</span>
                    <span className="text-sm">{employee.emergencyContactPhone}</span>
                  </div>
                )}
                {employee.emergencyContactRelation && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Relationship:</span>
                    <span className="text-sm capitalize">{employee.emergencyContactRelation}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Address Information */}
            {employee.address && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5" />
                    <span>Address</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    {employee.address.street && <div>{employee.address.street}</div>}
                    <div>
                      {employee.address.city && `${employee.address.city}, `}
                      {employee.address.state && `${employee.address.state} `}
                      {employee.address.zipCode}
                    </div>
                    {employee.address.country && <div>{employee.address.country}</div>}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Work Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Briefcase className="h-5 w-5" />
                  <span>Work Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {employee.jobTitle && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Job Title:</span>
                    <span className="text-sm">{employee.jobTitle}</span>
                  </div>
                )}
                {employee.workLocation && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Work Location:</span>
                    <span className="text-sm">{employee.workLocation}</span>
                  </div>
                )}
                {employee.hireDate && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Hire Date:</span>
                    <span className="text-sm">{formatDate(employee.hireDate)}</span>
                  </div>
                )}
                {employee.contractType && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Contract Type:</span>
                    <span className="text-sm capitalize">{employee.contractType}</span>
                  </div>
                )}
                {employee.workType && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Work Type:</span>
                    <span className="text-sm capitalize">{employee.workType.replace('_', ' ')}</span>
                  </div>
                )}
                {employee.salary && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Salary:</span>
                    <span className="text-sm">${employee.salary.toLocaleString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Skills Section */}
          {employee.skills && employee.skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5" />
                  <span>Skills</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {employee.skills.map((skill, index) => (
                    <Badge key={index} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bio Section */}
          {employee.bio && (
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{employee.bio}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Assigned Projects ({employee.projects?.length || 0})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {employee.projects && employee.projects.length > 0 ? (
                <div className="space-y-4">
                  {employee.projects.map((project) => (
                    <div key={project.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{project.name}</h4>
                        <Badge variant={project.status === 'completed' ? 'default' : 'outline'}>
                          {project.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {project.projectManager.employeeId === employee.id ? (
                          <span className="font-medium text-blue-600">Project Manager</span>
                        ) : (
                          <span>Team Member</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No projects assigned</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>Assigned Tasks ({employee.assignedTasks?.length || 0})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {employee.assignedTasks && employee.assignedTasks.length > 0 ? (
                <div className="space-y-4">
                  {employee.assignedTasks.map((task) => (
                    <div key={task.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{task.name}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge variant={
                            task.priority === 'high' ? 'destructive' :
                            task.priority === 'medium' ? 'default' :
                            'outline'
                          }>
                            {task.priority}
                          </Badge>
                          <Badge variant={task.status === 'completed' ? 'default' : 'outline'}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Project: {task.project.name}</span>
                        <span>Due: {formatDate(task.dueDate)}</span>
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{task.completionPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${task.completionPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No tasks assigned</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Recent Attendance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {employee.recentAttendance && employee.recentAttendance.length > 0 ? (
                <div className="space-y-4">
                  {employee.recentAttendance.map((attendance) => (
                    <div key={attendance.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{formatDate(attendance.date)}</span>
                        <Badge variant={
                          attendance.status === 'present' ? 'default' :
                          attendance.status === 'late' ? 'destructive' :
                          'outline'
                        }>
                          {attendance.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Check In: {new Date(attendance.checkIn).toLocaleTimeString()}</span>
                        {attendance.checkOut && (
                          <span>Check Out: {new Date(attendance.checkOut).toLocaleTimeString()}</span>
                        )}
                      </div>
                      {attendance.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{attendance.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No attendance records</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="space-y-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium">Employee Rewards</h3>
              <p className="text-muted-foreground">
                View {employee.firstName}'s reward progress and award manual rewards
              </p>
            </div>
            <ManualRewardAward
              employeeId={employee.id}
              employeeName={`${employee.firstName} ${employee.lastName}`}
              onRewardAwarded={() => {
                // Refresh the page or trigger a refresh of the reward dashboard
                window.location.reload();
              }}
            />
          </div>
          <EmployeeRewardDashboard employeeId={employee.id} />
        </TabsContent>

        {/* Leave Tab */}
        <TabsContent value="leave" className="space-y-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium">Employee Leave Management</h3>
              <p className="text-muted-foreground">
                Manage {employee.firstName}'s leave applications and balances
              </p>
            </div>
          </div>
          <EmployeeLeaveApplication employeeId={employee.id} />
        </TabsContent>

        {/* Education Tab */}
        <TabsContent value="education" className="space-y-4">
          <EmployeeEducation employeeId={employee.id} />
        </TabsContent>

        {/* Certifications Tab */}
        <TabsContent value="certifications" className="space-y-4">
          <EmployeeCertifications employeeId={employee.id} />
        </TabsContent>

        {/* ID Proofs Tab */}
        <TabsContent value="id-proofs" className="space-y-4">
          <EmployeeIdProofs employeeId={employee.id} />
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <EmployeeDocuments employeeId={employee.id} />
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      <EnhancedEditEmployeeModal
        employee={{
          ...employee,
          department: typeof employee.department === 'string'
            ? { id: '', name: employee.department }
            : employee.department
        }}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
