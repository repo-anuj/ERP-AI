"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format, addDays } from "date-fns";

const leaveApplicationSchema = z.object({
  leaveTypeId: z.string().min(1, "Please select a leave type"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().min(10, "Please provide a detailed reason (minimum 10 characters)"),
  isHalfDay: z.boolean().default(false),
  halfDayPeriod: z.enum(["morning", "afternoon"]).optional(),
  emergencyContact: z.string().optional(),
  workHandover: z.string().optional(),
});

type LeaveApplicationFormData = z.infer<typeof leaveApplicationSchema>;

interface LeaveType {
  id: string;
  name: string;
  description?: string;
  maxDaysPerYear: number;
  minNoticeRequired: number;
  maxConsecutiveDays?: number;
  allowHalfDays: boolean;
  requiresApproval: boolean;
  approvalLevels: number;
  isActive: boolean;
}

interface LeaveBalance {
  id: string;
  totalEntitled: number;
  totalUsed: number;
  totalPending: number;
  availableBalance: number;
  leaveType: {
    id: string;
    name: string;
  };
}

interface LeaveApplication {
  id: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  isHalfDay: boolean;
  halfDayPeriod?: string;
  appliedAt: string;
  leaveType: {
    id: string;
    name: string;
  };
  approvals: any[];
}

interface EmployeeLeaveApplicationProps {
  employeeId: string;
}

export function EmployeeLeaveApplication({ employeeId }: EmployeeLeaveApplicationProps) {
  const { toast } = useToast();
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [myApplications, setMyApplications] = useState<LeaveApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("apply");
  
  // Dialog states
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form
  const applicationForm = useForm<LeaveApplicationFormData>({
    resolver: zodResolver(leaveApplicationSchema),
    defaultValues: {
      leaveTypeId: "",
      startDate: "",
      endDate: "",
      reason: "",
      isHalfDay: false,
      emergencyContact: "",
      workHandover: "",
    },
  });

  // Fetch data
  const fetchLeaveTypes = async () => {
    try {
      const response = await fetch('/api/leave/types');
      if (response.ok) {
        const data = await response.json();
        setLeaveTypes(data.filter((lt: LeaveType) => lt.isActive));
      }
    } catch (error) {
      console.error('Error fetching leave types:', error);
    }
  };

  const fetchLeaveBalances = async () => {
    try {
      const response = await fetch(`/api/employees/${employeeId}/leave-balances`);
      if (response.ok) {
        const data = await response.json();
        setLeaveBalances(data);
      }
    } catch (error) {
      console.error('Error fetching leave balances:', error);
    }
  };

  const fetchMyApplications = async () => {
    try {
      const response = await fetch(`/api/leave/applications?employeeId=${employeeId}`);
      if (response.ok) {
        const data = await response.json();
        setMyApplications(data);
      }
    } catch (error) {
      console.error('Error fetching leave applications:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([fetchLeaveTypes(), fetchLeaveBalances(), fetchMyApplications()]);
      setIsLoading(false);
    };
    fetchData();
  }, [employeeId]);

  // Handle leave application submission
  const onSubmitApplication = async (data: LeaveApplicationFormData) => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/leave/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const application = await response.json();
        toast({
          title: "Leave Application Submitted",
          description: `Your ${leaveTypes.find(lt => lt.id === data.leaveTypeId)?.name} application has been submitted successfully.`,
        });
        setIsApplicationDialogOpen(false);
        applicationForm.reset();
        fetchMyApplications();
        fetchLeaveBalances();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit leave application');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit leave application",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: Clock,
      approved: CheckCircle,
      rejected: XCircle,
      cancelled: AlertCircle,
    };
    const IconComponent = icons[status as keyof typeof icons] || Clock;
    return <IconComponent className="h-4 w-4" />;
  };

  // Calculate days between dates
  const calculateDays = (startDate: string, endDate: string, isHalfDay: boolean) => {
    if (!startDate || !endDate) return 0;
    if (isHalfDay) return 0.5;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const selectedLeaveType = leaveTypes.find(lt => lt.id === applicationForm.watch("leaveTypeId"));
  const selectedBalance = leaveBalances.find(lb => lb.leaveType.id === applicationForm.watch("leaveTypeId"));
  const calculatedDays = calculateDays(
    applicationForm.watch("startDate"),
    applicationForm.watch("endDate"),
    applicationForm.watch("isHalfDay")
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Calendar className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p>Loading leave information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Leave</h2>
          <p className="text-muted-foreground">
            Apply for leave and manage your leave applications
          </p>
        </div>
        <Dialog open={isApplicationDialogOpen} onOpenChange={setIsApplicationDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Apply for Leave
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Apply for Leave</DialogTitle>
              <DialogDescription>
                Submit a new leave application. Please ensure all details are accurate.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={applicationForm.handleSubmit(onSubmitApplication)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="leaveTypeId">Leave Type *</Label>
                <Select 
                  onValueChange={(value) => applicationForm.setValue("leaveTypeId", value)}
                  value={applicationForm.watch("leaveTypeId")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map((leaveType) => (
                      <SelectItem key={leaveType.id} value={leaveType.id}>
                        {leaveType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {applicationForm.formState.errors.leaveTypeId && (
                  <p className="text-red-500 text-sm">{applicationForm.formState.errors.leaveTypeId.message}</p>
                )}
              </div>

              {selectedLeaveType && selectedBalance && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Available Balance</span>
                        <p className="font-bold text-lg">{selectedBalance.availableBalance} days</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Min Notice Required</span>
                        <p className="font-medium">{selectedLeaveType.minNoticeRequired} days</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input 
                    id="startDate" 
                    type="date"
                    {...applicationForm.register("startDate")}
                    min={format(addDays(new Date(), selectedLeaveType?.minNoticeRequired || 1), "yyyy-MM-dd")}
                  />
                  {applicationForm.formState.errors.startDate && (
                    <p className="text-red-500 text-sm">{applicationForm.formState.errors.startDate.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input 
                    id="endDate" 
                    type="date"
                    {...applicationForm.register("endDate")}
                    min={applicationForm.watch("startDate") || format(addDays(new Date(), selectedLeaveType?.minNoticeRequired || 1), "yyyy-MM-dd")}
                  />
                  {applicationForm.formState.errors.endDate && (
                    <p className="text-red-500 text-sm">{applicationForm.formState.errors.endDate.message}</p>
                  )}
                </div>
              </div>

              {selectedLeaveType?.allowHalfDays && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isHalfDay"
                      {...applicationForm.register("isHalfDay")}
                      className="rounded"
                    />
                    <Label htmlFor="isHalfDay">This is a half day leave</Label>
                  </div>
                  
                  {applicationForm.watch("isHalfDay") && (
                    <Select 
                      onValueChange={(value) => applicationForm.setValue("halfDayPeriod", value as any)}
                      value={applicationForm.watch("halfDayPeriod")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select half day period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Morning (First Half)</SelectItem>
                        <SelectItem value="afternoon">Afternoon (Second Half)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {calculatedDays > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm">
                    <strong>Total Days:</strong> {calculatedDays} day{calculatedDays !== 1 ? 's' : ''}
                    {selectedBalance && (
                      <span className="ml-2">
                        (Remaining balance: {selectedBalance.availableBalance - calculatedDays} days)
                      </span>
                    )}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Leave *</Label>
                <Textarea 
                  id="reason" 
                  {...applicationForm.register("reason")}
                  placeholder="Please provide a detailed reason for your leave..."
                  rows={3}
                />
                {applicationForm.formState.errors.reason && (
                  <p className="text-red-500 text-sm">{applicationForm.formState.errors.reason.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Emergency Contact</Label>
                  <Input 
                    id="emergencyContact" 
                    {...applicationForm.register("emergencyContact")}
                    placeholder="Contact person during leave"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workHandover">Work Handover</Label>
                  <Input 
                    id="workHandover" 
                    {...applicationForm.register("workHandover")}
                    placeholder="Who will handle your work?"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsApplicationDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !selectedLeaveType || calculatedDays === 0}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="apply">Apply Leave</TabsTrigger>
          <TabsTrigger value="balances">Leave Balances</TabsTrigger>
          <TabsTrigger value="history">My Applications</TabsTrigger>
        </TabsList>

        {/* Apply Leave Tab */}
        <TabsContent value="apply" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {leaveTypes.map((leaveType) => {
              const balance = leaveBalances.find(lb => lb.leaveType.id === leaveType.id);
              return (
                <Card key={leaveType.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{leaveType.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {leaveType.description || 'No description available'}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Available</span>
                          <p className="font-bold text-lg">{balance?.availableBalance || 0}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total</span>
                          <p className="font-medium">{balance?.totalEntitled || 0}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p>Min notice: {leaveType.minNoticeRequired} days</p>
                        {leaveType.maxConsecutiveDays && (
                          <p>Max consecutive: {leaveType.maxConsecutiveDays} days</p>
                        )}
                        {leaveType.allowHalfDays && <p>Half days allowed</p>}
                      </div>

                      <Button 
                        className="w-full" 
                        size="sm"
                        onClick={() => {
                          applicationForm.setValue("leaveTypeId", leaveType.id);
                          setIsApplicationDialogOpen(true);
                        }}
                        disabled={!balance || balance.availableBalance <= 0}
                      >
                        Apply for {leaveType.name}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Leave Balances Tab */}
        <TabsContent value="balances" className="space-y-4">
          {leaveBalances.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Leave Balances</h3>
                <p className="text-muted-foreground text-center">
                  Your leave balances will appear here once leave types are configured.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {leaveBalances.map((balance) => (
                <Card key={balance.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{balance.leaveType.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Available</span>
                          <p className="font-bold text-2xl text-green-600">{balance.availableBalance}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total Entitled</span>
                          <p className="font-medium">{balance.totalEntitled}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Used</span>
                          <p className="font-medium">{balance.totalUsed}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Pending</span>
                          <p className="font-medium">{balance.totalPending}</p>
                        </div>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min((balance.totalUsed / balance.totalEntitled) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        {Math.round((balance.totalUsed / balance.totalEntitled) * 100)}% used
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* My Applications Tab */}
        <TabsContent value="history" className="space-y-4">
          {myApplications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Leave Applications</h3>
                <p className="text-muted-foreground text-center">
                  Your leave applications will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {myApplications.map((application) => (
                <Card key={application.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(application.status)}
                        <div>
                          <h4 className="font-medium">{application.leaveType.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Applied on {format(new Date(application.appliedAt), "MMM dd, yyyy")}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(application.status)}>
                        {application.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Start Date</span>
                          <span className="font-medium">
                            {format(new Date(application.startDate), "MMM dd, yyyy")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">End Date</span>
                          <span className="font-medium">
                            {format(new Date(application.endDate), "MMM dd, yyyy")}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Total Days</span>
                          <span className="font-medium">
                            {application.totalDays} {application.isHalfDay ? `(${application.halfDayPeriod})` : 'days'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Status</span>
                          <Badge className={getStatusColor(application.status)}>
                            {application.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Approvals</span>
                          <span className="font-medium">
                            {application.approvals.filter(a => a.status === 'approved').length} / {application.approvals.length}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm">
                        <strong>Reason:</strong> {application.reason}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
