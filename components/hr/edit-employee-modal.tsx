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
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Employee } from "./columns"; // Reuse the type from columns.tsx

// Reusing the Zod schema (consider moving to a shared types file)
const employeeUpdateSchema = z.object({
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
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  role: z.enum(["employee", "admin", "manager"]).optional(),
  permissions: z.array(z.string()).optional(),
});

type EmployeeUpdateFormData = z.infer<typeof employeeUpdateSchema>;

interface EditEmployeeModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // To trigger data refresh on the main page
}

export function EditEmployeeModal({ employee, isOpen, onClose, onSuccess }: EditEmployeeModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EmployeeUpdateFormData>({
    resolver: zodResolver(employeeUpdateSchema),
    defaultValues: {},
  });

  // Reset form when employee data changes or modal opens/closes
  useEffect(() => {
    if (employee && isOpen) {
      form.reset({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        phone: employee.phone || '',
        position: employee.position || '',
        department: employee.department || '',
        salary: employee.salary || null,
        status: employee.status || '',
        // Cast the role to the expected enum type or default to 'employee'
        role: (employee.role === 'admin' || employee.role === 'manager' || employee.role === 'employee')
          ? employee.role as 'admin' | 'manager' | 'employee'
          : 'employee',
        // Don't set password - it will be entered by admin if needed
      });
    } else if (!isOpen) {
       form.reset({}); // Clear form when closed
    }
  }, [employee, isOpen, form]);

  const onSubmit = async (data: EmployeeUpdateFormData) => {
    if (!employee) return;
    setIsSubmitting(true);
    try {
      console.log("Submitting data:", data);
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        // Try to get error message from response body
        let errorMsg = "Failed to update employee details.";
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || JSON.stringify(errorData);
        } catch (parseError) {
          // If body isn't JSON or empty, use status text
          errorMsg = response.statusText;
        }
        throw new Error(errorMsg);
      }

      toast({ title: "Success", description: "Employee details updated." });
      onSuccess(); // Trigger refresh
      onClose(); // Close modal
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

  // Prevent modal close on outside click if needed
  const handleInteractOutside = (event: Event) => {
    // event.preventDefault(); // Uncomment to prevent closing on clicking outside
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={handleInteractOutside}>
        <DialogHeader>
          <DialogTitle>Edit Employee Details</DialogTitle>
          <DialogDescription>
            Make changes to {employee?.firstName} {employee?.lastName}'s profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
          {/* Form Fields Go Here - Example: First Name */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="firstName" className="text-right">
              First Name
            </Label>
            <Input id="firstName" {...form.register("firstName")} className="col-span-3" />
            {form.formState.errors.firstName && <p className="col-span-4 text-red-500 text-sm">{form.formState.errors.firstName.message}</p>}
          </div>
           {/* Add other fields similarly: lastName, email, phone, position, department, salary, status */}
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="lastName" className="text-right">
              Last Name
            </Label>
            <Input id="lastName" {...form.register("lastName")} className="col-span-3" />
            {form.formState.errors.lastName && <p className="col-span-4 text-red-500 text-sm">{form.formState.errors.lastName.message}</p>}
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input id="email" type="email" {...form.register("email")} className="col-span-3" />
            {form.formState.errors.email && <p className="col-span-4 text-red-500 text-sm">{form.formState.errors.email.message}</p>}
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Phone
            </Label>
            <Input id="phone" {...form.register("phone")} className="col-span-3" />
             {/* No specific error needed for optional phone */}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="position" className="text-right">
              Position
            </Label>
            <Input id="position" {...form.register("position")} className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="department" className="text-right">
              Department
            </Label>
            <Input id="department" {...form.register("department")} className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="salary" className="text-right">
              Salary
            </Label>
            <Input id="salary" type="number" step="0.01" {...form.register("salary")} className="col-span-3" />
             {form.formState.errors.salary && <p className="col-span-4 text-red-500 text-sm">{form.formState.errors.salary.message}</p>}
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
             <Label htmlFor="status" className="text-right">
              Status
            </Label>
            {/* Consider using a Select component for status */}
            <Input id="status" {...form.register("status")} className="col-span-3" />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Leave blank to keep current password"
              {...form.register("password")}
              className="col-span-3"
            />
            {form.formState.errors.password && <p className="col-span-4 text-red-500 text-sm">{form.formState.errors.password.message}</p>}
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Role
            </Label>
            <select
              id="role"
              {...form.register("role")}
              className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <DialogFooter>
             <DialogClose asChild>
                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
