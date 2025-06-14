"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Employee } from "./columns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { EmployeeIdProofs } from "./employee-id-proofs";
import { EmployeeDocuments } from "./employee-documents";

// Enhanced schema for employee updates
const enhancedEmployeeUpdateSchema = z.object({
  // Basic Information
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional().nullable(),
  position: z.string().optional(),
  department: z.string().optional(),
  salary: z.preprocess(
    (val) => (val === "" || val === null || val === undefined) ? null : parseFloat(String(val)),
    z.number().positive("Salary must be positive").optional().nullable()
  ),
  status: z.string().optional(),
  role: z.enum(["employee", "admin", "manager"]).optional(),
  
  // Extended Information
  employeeId: z.string().optional(),
  dateOfBirth: z.date().optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  maritalStatus: z.enum(["single", "married", "divorced", "widowed"]).optional(),
  nationality: z.string().optional(),
  personalEmail: z.string().email().optional().or(z.literal("")),
  alternatePhone: z.string().optional(),
  
  // Emergency Contact
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelation: z.string().optional(),
  
  // Address
  addressStreet: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressZipCode: z.string().optional(),
  addressCountry: z.string().optional(),
  
  // Work Information
  jobTitle: z.string().optional(),
  workLocation: z.string().optional(),
  hireDate: z.date().optional(),
  contractType: z.enum(["permanent", "contract", "temporary", "intern"]).optional(),
  workType: z.enum(["full_time", "part_time", "contract", "freelance"]).optional(),
  
  // Skills and Bio
  skills: z.array(z.string()).optional(),
  bio: z.string().optional(),
  notes: z.string().optional(),
});

type EnhancedEmployeeUpdateFormData = z.infer<typeof enhancedEmployeeUpdateSchema>;

interface Project {
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
}

interface EnhancedEditEmployeeModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EnhancedEditEmployeeModal({ 
  employee, 
  isOpen, 
  onClose, 
  onSuccess 
}: EnhancedEditEmployeeModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");

  const form = useForm<EnhancedEmployeeUpdateFormData>({
    resolver: zodResolver(enhancedEmployeeUpdateSchema),
    defaultValues: {},
  });

  // Fetch projects for assignment
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen]);

  // Reset form when employee data changes or modal opens/closes
  useEffect(() => {
    if (employee && isOpen) {
      const formData: any = {
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        phone: employee.phone || '',
        position: employee.position || '',
        department: employee.department || '',
        salary: employee.salary || null,
        status: employee.status || '',
        role: (employee.role === 'admin' || employee.role === 'manager' || employee.role === 'employee')
          ? employee.role as 'admin' | 'manager' | 'employee'
          : 'employee',
      };

      // Add extended fields if they exist
      if (employee.employeeId) formData.employeeId = employee.employeeId;
      if (employee.dateOfBirth) formData.dateOfBirth = new Date(employee.dateOfBirth);
      if (employee.personalEmail) formData.personalEmail = employee.personalEmail;
      if (employee.alternatePhone) formData.alternatePhone = employee.alternatePhone;
      if (employee.emergencyContactName) formData.emergencyContactName = employee.emergencyContactName;
      if (employee.emergencyContactPhone) formData.emergencyContactPhone = employee.emergencyContactPhone;
      if (employee.emergencyContactRelation) formData.emergencyContactRelation = employee.emergencyContactRelation;
      if (employee.jobTitle) formData.jobTitle = employee.jobTitle;
      if (employee.workLocation) formData.workLocation = employee.workLocation;
      if (employee.hireDate) formData.hireDate = new Date(employee.hireDate);
      if (employee.bio) formData.bio = employee.bio;
      if (employee.notes) formData.notes = employee.notes;

      // Handle address
      if (employee.address) {
        if (employee.address.street) formData.addressStreet = employee.address.street;
        if (employee.address.city) formData.addressCity = employee.address.city;
        if (employee.address.state) formData.addressState = employee.address.state;
        if (employee.address.zipCode) formData.addressZipCode = employee.address.zipCode;
        if (employee.address.country) formData.addressCountry = employee.address.country;
      }

      form.reset(formData);
      setSkills(employee.skills || []);
    } else if (!isOpen) {
      form.reset({});
      setSkills([]);
    }
  }, [employee, isOpen, form]);

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const onSubmit = async (data: EnhancedEmployeeUpdateFormData) => {
    if (!employee) return;
    setIsSubmitting(true);
    
    try {
      // Prepare the data with address object and skills
      const submitData = {
        ...data,
        skills,
        address: {
          street: data.addressStreet,
          city: data.addressCity,
          state: data.addressState,
          zipCode: data.addressZipCode,
          country: data.addressCountry,
        }
      };

      // Remove address fields from root level
      delete submitData.addressStreet;
      delete submitData.addressCity;
      delete submitData.addressState;
      delete submitData.addressZipCode;
      delete submitData.addressCountry;

      const response = await fetch(`/api/employees/${employee.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        let errorMsg = "Failed to update employee details.";
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || JSON.stringify(errorData);
        } catch (parseError) {
          errorMsg = response.statusText;
        }
        throw new Error(errorMsg);
      }

      toast({ title: "Success", description: "Employee details updated." });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Failed to update employee:", error);
      const errorMsg = error.message || "Failed to update employee details.";
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Employee Details</DialogTitle>
          <DialogDescription>
            Update {employee?.firstName} {employee?.lastName}'s profile information.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="work">Work Info</TabsTrigger>
              <TabsTrigger value="additional">Additional</TabsTrigger>
              <TabsTrigger value="id-proofs">ID Proofs</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" {...form.register("firstName")} />
                  {form.formState.errors.firstName && (
                    <p className="text-red-500 text-sm">{form.formState.errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" {...form.register("lastName")} />
                  {form.formState.errors.lastName && (
                    <p className="text-red-500 text-sm">{form.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Work Email</Label>
                  <Input id="email" type="email" {...form.register("email")} />
                  {form.formState.errors.email && (
                    <p className="text-red-500 text-sm">{form.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" {...form.register("phone")} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeId">Employee ID</Label>
                  <Input id="employeeId" {...form.register("employeeId")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !form.watch("dateOfBirth") && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch("dateOfBirth") ? (
                          format(form.watch("dateOfBirth")!, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={form.watch("dateOfBirth")}
                        onSelect={(date) => form.setValue("dateOfBirth", date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select onValueChange={(value) => form.setValue("gender", value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maritalStatus">Marital Status</Label>
                  <Select onValueChange={(value) => form.setValue("maritalStatus", value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married</SelectItem>
                      <SelectItem value="divorced">Divorced</SelectItem>
                      <SelectItem value="widowed">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality</Label>
                <Input id="nationality" {...form.register("nationality")} />
              </div>
            </TabsContent>

            {/* Contact Information Tab */}
            <TabsContent value="contact" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="personalEmail">Personal Email</Label>
                  <Input id="personalEmail" type="email" {...form.register("personalEmail")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alternatePhone">Alternate Phone</Label>
                  <Input id="alternatePhone" {...form.register("alternatePhone")} />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Emergency Contact</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactName">Name</Label>
                    <Input id="emergencyContactName" {...form.register("emergencyContactName")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactPhone">Phone</Label>
                    <Input id="emergencyContactPhone" {...form.register("emergencyContactPhone")} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactRelation">Relationship</Label>
                  <Input id="emergencyContactRelation" {...form.register("emergencyContactRelation")} />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Address</h4>
                <div className="space-y-2">
                  <Label htmlFor="addressStreet">Street Address</Label>
                  <Input id="addressStreet" {...form.register("addressStreet")} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="addressCity">City</Label>
                    <Input id="addressCity" {...form.register("addressCity")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addressState">State/Province</Label>
                    <Input id="addressState" {...form.register("addressState")} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="addressZipCode">ZIP/Postal Code</Label>
                    <Input id="addressZipCode" {...form.register("addressZipCode")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addressCountry">Country</Label>
                    <Input id="addressCountry" {...form.register("addressCountry")} />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Work Information Tab */}
            <TabsContent value="work" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input id="position" {...form.register("position")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input id="department" {...form.register("department")} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input id="jobTitle" {...form.register("jobTitle")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workLocation">Work Location</Label>
                  <Input id="workLocation" {...form.register("workLocation")} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salary">Salary</Label>
                  <Input id="salary" type="number" step="0.01" {...form.register("salary")} />
                  {form.formState.errors.salary && (
                    <p className="text-red-500 text-sm">{form.formState.errors.salary.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select onValueChange={(value) => form.setValue("status", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="on_leave">On Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select onValueChange={(value) => form.setValue("role", value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hireDate">Hire Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !form.watch("hireDate") && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch("hireDate") ? (
                          format(form.watch("hireDate")!, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={form.watch("hireDate")}
                        onSelect={(date) => form.setValue("hireDate", date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contractType">Contract Type</Label>
                  <Select onValueChange={(value) => form.setValue("contractType", value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="permanent">Permanent</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="temporary">Temporary</SelectItem>
                      <SelectItem value="intern">Intern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workType">Work Type</Label>
                  <Select onValueChange={(value) => form.setValue("workType", value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">Full Time</SelectItem>
                      <SelectItem value="part_time">Part Time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="freelance">Freelance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* Additional Information Tab */}
            <TabsContent value="additional" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Skills</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Add a skill"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    />
                    <Button type="button" onClick={addSkill} variant="outline">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1">
                        {skill}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeSkill(skill)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    {...form.register("bio")}
                    placeholder="Brief description about the employee"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Internal Notes</Label>
                  <Textarea
                    id="notes"
                    {...form.register("notes")}
                    placeholder="Internal HR notes (not visible to employee)"
                    rows={3}
                  />
                </div>
              </div>

              {/* Project Assignments Display */}
              <div className="space-y-4">
                <h4 className="font-medium">Current Project Assignments</h4>
                {employee?.assignments && employee.assignments.length > 0 ? (
                  <div className="space-y-2">
                    {employee.assignments.map((assignment) => (
                      <div key={assignment.id} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">{assignment.name}</span>
                        <Badge variant="outline">Assigned</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No project assignments</p>
                )}
              </div>
            </TabsContent>

            {/* ID Proofs Tab */}
            <TabsContent value="id-proofs" className="space-y-4">
              {employee && <EmployeeIdProofs employeeId={employee.id} />}
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-4">
              {employee && <EmployeeDocuments employeeId={employee.id} />}
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
