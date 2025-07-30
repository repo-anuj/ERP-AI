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
import { Plus, Edit, Calendar, Users, CheckCircle, XCircle, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";

// Schemas
const leaveTypeSchema = z.object({
  name: z.string().min(1, "Leave type name is required"),
  description: z.string().optional(),
  maxDaysPerYear: z.number().min(1, "Maximum days must be at least 1"),
  carryOverDays: z.number().min(0, "Carry over days cannot be negative"),
  minNoticeRequired: z.number().min(0, "Notice required cannot be negative"),
  maxConsecutiveDays: z.number().optional(),
  requiresApproval: z.boolean().default(true),
  approvalLevels: z.number().min(1, "At least 1 approval level required"),
  accrualRate: z.number().min(0, "Accrual rate cannot be negative"),
  accrualStartDate: z.enum(["hire_date", "year_start"]).default("hire_date"),
  allowHalfDays: z.boolean().default(true),
  allowNegativeBalance: z.boolean().default(false),
});

type LeaveTypeFormData = z.infer<typeof leaveTypeSchema>;

interface LeaveType {
  id: string;
  name: string;
  description?: string;
  maxDaysPerYear: number;
  carryOverDays: number;
  minNoticeRequired: number;
  maxConsecutiveDays?: number;
  requiresApproval: boolean;
  approvalLevels: number;
  accrualRate: number;
  accrualStartDate: string;
  allowHalfDays: boolean;
  allowNegativeBalance: boolean;
  isActive: boolean;
  _count: {
    leaveApplications: number;
    employeeLeaveBalances: number;
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
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId?: string;
    department?: { name: string };
  };
  leaveType: {
    id: string;
    name: string;
    requiresApproval: boolean;
    approvalLevels: number;
  };
  approvals: any[];
}

export function LeaveManagement() {
  const { toast } = useToast();
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("leave-types");
  
  // Dialog states
  const [isLeaveTypeDialogOpen, setIsLeaveTypeDialogOpen] = useState(false);
  const [editingLeaveType, setEditingLeaveType] = useState<LeaveType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form
  const leaveTypeForm = useForm<LeaveTypeFormData>({
    resolver: zodResolver(leaveTypeSchema),
    defaultValues: {
      name: "",
      description: "",
      maxDaysPerYear: 20,
      carryOverDays: 5,
      minNoticeRequired: 1,
      requiresApproval: true,
      approvalLevels: 1,
      accrualRate: 1.67,
      accrualStartDate: "hire_date",
      allowHalfDays: true,
      allowNegativeBalance: false,
    },
  });

  // Fetch data
  const fetchLeaveTypes = async () => {
    try {
      const response = await fetch('/api/leave/types');
      if (response.ok) {
        const data = await response.json();
        setLeaveTypes(data);
      }
    } catch (error) {
      console.error('Error fetching leave types:', error);
    }
  };

  const fetchLeaveApplications = async () => {
    try {
      const response = await fetch('/api/leave/applications');
      if (response.ok) {
        const data = await response.json();
        setLeaveApplications(data);
      }
    } catch (error) {
      console.error('Error fetching leave applications:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([fetchLeaveTypes(), fetchLeaveApplications()]);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  // Handle leave type submission
  const onSubmitLeaveType = async (data: LeaveTypeFormData) => {
    try {
      setIsSubmitting(true);
      const url = editingLeaveType 
        ? `/api/leave/types/${editingLeaveType.id}`
        : '/api/leave/types';
      
      const method = editingLeaveType ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Leave type ${editingLeaveType ? 'updated' : 'created'} successfully`,
        });
        setIsLeaveTypeDialogOpen(false);
        setEditingLeaveType(null);
        leaveTypeForm.reset();
        fetchLeaveTypes();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save leave type');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save leave type",
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
      cancelled: XCircle,
    };
    const IconComponent = icons[status as keyof typeof icons] || Clock;
    return <IconComponent className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Calendar className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p>Loading leave management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Leave Management</h2>
          <p className="text-muted-foreground">
            Configure leave types and manage employee leave applications
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>{leaveTypes.length} Leave Types</span>
          </Badge>
          <Badge variant="outline" className="flex items-center space-x-1">
            <Users className="h-3 w-3" />
            <span>{leaveApplications.length} Applications</span>
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="leave-types" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Leave Types</span>
          </TabsTrigger>
          <TabsTrigger value="applications" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Applications</span>
          </TabsTrigger>
          <TabsTrigger value="balances" className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>Balances</span>
          </TabsTrigger>
        </TabsList>

        {/* Leave Types Tab */}
        <TabsContent value="leave-types" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Leave Types Configuration</h3>
            <Dialog open={isLeaveTypeDialogOpen} onOpenChange={setIsLeaveTypeDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingLeaveType(null);
                  leaveTypeForm.reset();
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Leave Type
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingLeaveType ? 'Edit Leave Type' : 'Add New Leave Type'}
                  </DialogTitle>
                  <DialogDescription>
                    Configure leave type settings and policies for your organization.
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={leaveTypeForm.handleSubmit(onSubmitLeaveType)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input 
                        id="name" 
                        {...leaveTypeForm.register("name")}
                        placeholder="Annual Leave"
                      />
                      {leaveTypeForm.formState.errors.name && (
                        <p className="text-red-500 text-sm">{leaveTypeForm.formState.errors.name.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxDaysPerYear">Max Days Per Year *</Label>
                      <Input 
                        id="maxDaysPerYear" 
                        type="number"
                        {...leaveTypeForm.register("maxDaysPerYear", { valueAsNumber: true })}
                        placeholder="20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      {...leaveTypeForm.register("description")}
                      placeholder="Describe this leave type..."
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="carryOverDays">Carry Over Days</Label>
                      <Input 
                        id="carryOverDays" 
                        type="number"
                        {...leaveTypeForm.register("carryOverDays", { valueAsNumber: true })}
                        placeholder="5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minNoticeRequired">Min Notice (Days)</Label>
                      <Input 
                        id="minNoticeRequired" 
                        type="number"
                        {...leaveTypeForm.register("minNoticeRequired", { valueAsNumber: true })}
                        placeholder="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="approvalLevels">Approval Levels</Label>
                      <Input 
                        id="approvalLevels" 
                        type="number"
                        {...leaveTypeForm.register("approvalLevels", { valueAsNumber: true })}
                        placeholder="1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accrualStartDate">Accrual Start Date</Label>
                    <Select 
                      onValueChange={(value) => leaveTypeForm.setValue("accrualStartDate", value as any)}
                      value={leaveTypeForm.watch("accrualStartDate")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select start date" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hire_date">Employee Hire Date</SelectItem>
                        <SelectItem value="year_start">Calendar Year Start</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="requiresApproval"
                        {...leaveTypeForm.register("requiresApproval")}
                        className="rounded"
                      />
                      <Label htmlFor="requiresApproval">Requires Approval</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="allowHalfDays"
                        {...leaveTypeForm.register("allowHalfDays")}
                        className="rounded"
                      />
                      <Label htmlFor="allowHalfDays">Allow Half Days</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="allowNegativeBalance"
                        {...leaveTypeForm.register("allowNegativeBalance")}
                        className="rounded"
                      />
                      <Label htmlFor="allowNegativeBalance">Allow Negative Balance</Label>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsLeaveTypeDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : (editingLeaveType ? 'Update' : 'Create')}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {leaveTypes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Leave Types</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first leave type to start managing employee leave.
                </p>
                <Button onClick={() => setIsLeaveTypeDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Leave Type
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {leaveTypes.map((leaveType) => (
                <Card key={leaveType.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{leaveType.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {leaveType.description || 'No description'}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingLeaveType(leaveType);
                          leaveTypeForm.reset({
                            ...leaveType,
                            accrualStartDate: leaveType.accrualStartDate as "hire_date" | "year_start"
                          });
                          setIsLeaveTypeDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Max Days/Year</span>
                          <p className="font-medium">{leaveType.maxDaysPerYear}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Carry Over</span>
                          <p className="font-medium">{leaveType.carryOverDays}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Min Notice</span>
                          <p className="font-medium">{leaveType.minNoticeRequired} days</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Approval Levels</span>
                          <p className="font-medium">{leaveType.approvalLevels}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {leaveType.requiresApproval && (
                          <Badge variant="secondary" className="text-xs">Requires Approval</Badge>
                        )}
                        {leaveType.allowHalfDays && (
                          <Badge variant="secondary" className="text-xs">Half Days</Badge>
                        )}
                        {leaveType.allowNegativeBalance && (
                          <Badge variant="secondary" className="text-xs">Negative Balance</Badge>
                        )}
                      </div>

                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Applications</span>
                          <span className="font-medium">{leaveType._count.leaveApplications}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Employees</span>
                          <span className="font-medium">{leaveType._count.employeeLeaveBalances}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications" className="space-y-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Leave Applications Coming Soon</h3>
              <p className="text-muted-foreground text-center">
                Leave application management will be available in the next update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Balances Tab */}
        <TabsContent value="balances" className="space-y-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Leave Balances Coming Soon</h3>
              <p className="text-muted-foreground text-center">
                Employee leave balance management will be available in the next update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
