"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarIcon, X, Plus, Upload, User, ChevronLeft, ChevronRight } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { EmployeeIdProofs } from "./employee-id-proofs"
import { EmployeeDocuments } from "./employee-documents"

// Enhanced schema for comprehensive employee creation
const employeeFormSchema = z.object({
  // Basic Information
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  position: z.string().min(1, "Position is required"),
  department: z.string().min(1, "Department is required"),
  startDate: z.date(),
  salary: z.preprocess(
    (val) => (val === "" || val === null || val === undefined) ? null : parseFloat(String(val)),
    z.number().positive("Salary must be positive").optional().nullable()
  ),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  role: z.enum(["employee", "manager", "admin"]).default("employee"),
  status: z.string().default("active"),

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

  // Profile Picture
  avatar: z.string().optional(),
})

type EmployeeFormValues = z.infer<typeof employeeFormSchema>

export function AddEmployeeDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState("")
  const [departments, setDepartments] = useState<string[]>([])
  const [newEmployeeId, setNewEmployeeId] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const { toast } = useToast()

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      position: "",
      department: "",
      startDate: new Date(),
      role: "employee",
      status: "active",
      skills: [],
    },
  })

  // Fetch departments from company data
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch('/api/departments?type=dropdown')
        if (response.ok) {
          const departmentList = await response.json()
          setDepartments(departmentList)
        } else {
          console.error('Failed to fetch departments:', response.statusText)
          // Fallback to default departments
          setDepartments([
            "Engineering",
            "Sales",
            "Marketing",
            "Human Resources",
            "Finance",
            "Operations",
            "Customer Support",
            "Product",
            "Design"
          ])
        }
      } catch (error) {
        console.error('Error fetching departments:', error)
        // Fallback to default departments
        setDepartments([
          "Engineering",
          "Sales",
          "Marketing",
          "Human Resources",
          "Finance",
          "Operations",
          "Customer Support",
          "Product",
          "Design"
        ])
      }
    }

    if (open) {
      fetchDepartments()
    }
  }, [open])

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      const updatedSkills = [...skills, newSkill.trim()]
      setSkills(updatedSkills)
      form.setValue("skills", updatedSkills)
      setNewSkill("")
    }
  }

  const removeSkill = (skillToRemove: string) => {
    const updatedSkills = skills.filter(skill => skill !== skillToRemove)
    setSkills(updatedSkills)
    form.setValue("skills", updatedSkills)
  }

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select a valid image file.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image size should be less than 5MB.",
          variant: "destructive",
        });
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setAvatarPreview(result);
        form.setValue("avatar", result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getInitials = () => {
    const firstName = form.watch("firstName") || "";
    const lastName = form.watch("lastName") || "";
    const firstInitial = firstName.charAt(0) || "";
    const lastInitial = lastName.charAt(0) || "";
    return (firstInitial + lastInitial).toUpperCase() || "?";
  };

  async function onSubmit(data: EmployeeFormValues) {
    try {
      setLoading(true)

      // Prepare the data with address object and skills
      const submitData = {
        ...data,
        skills,
        // Only include address if at least one field is filled
        address: (data.addressStreet || data.addressCity || data.addressState || data.addressZipCode || data.addressCountry) ? {
          street: data.addressStreet || null,
          city: data.addressCity || null,
          state: data.addressState || null,
          zipCode: data.addressZipCode || null,
          country: data.addressCountry || null,
        } : null,
        // Convert startDate to ISO string
        startDate: data.startDate.toISOString(),
        // Ensure salary is a number or null
        salary: data.salary ? Number(data.salary) : null,
      }

      // Remove address fields from root level
      delete submitData.addressStreet
      delete submitData.addressCity
      delete submitData.addressState
      delete submitData.addressZipCode
      delete submitData.addressCountry

      console.log("[ADD_EMPLOYEE] Submitting data:", submitData);

      const response = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("[ADD_EMPLOYEE] Error response:", errorData);

        // Handle specific error types
        if (response.status === 409) {
          throw new Error("An employee with this email already exists")
        } else if (response.status === 400) {
          throw new Error(errorData.details ?
            `Validation error: ${JSON.stringify(errorData.details)}` :
            "Please check your input data"
          )
        } else {
          throw new Error(errorData.message || `Server error (${response.status})`)
        }
      }

      const employee = await response.json()
      console.log("[ADD_EMPLOYEE] Employee created:", employee.id);
      setNewEmployeeId(employee.id)

      setOpen(false)
      form.reset()
      setSkills([])
      setAvatarPreview(null)

      toast({
        title: "Employee Added",
        description: `${employee.firstName} ${employee.lastName} has been added successfully.`,
        variant: "default",
      })

      // Refresh the page to show the new employee
      window.location.reload()
    } catch (error) {
      console.error("Failed to add employee:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add employee. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogDescription>
            Create a comprehensive employee profile with all necessary information.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="work">Work Info</TabsTrigger>
              <TabsTrigger value="additional">Additional</TabsTrigger>
            </TabsList>
            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-4">
              {/* Profile Picture Section */}
              <div className="flex items-center space-x-6 p-4 bg-muted/30 rounded-lg">
                <div className="flex flex-col items-center space-y-2">
                  <Avatar className="h-20 w-20">
                    {avatarPreview ? (
                      <AvatarImage src={avatarPreview} alt="Profile Preview" />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary text-lg">
                        {getInitials()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex flex-col items-center space-y-2">
                    <Label htmlFor="avatar-upload" className="cursor-pointer">
                      <div className="flex items-center space-x-2 px-3 py-1 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                        <Upload className="h-4 w-4" />
                        <span className="text-sm">Upload Photo</span>
                      </div>
                    </Label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      JPG, PNG up to 5MB
                    </p>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-lg">Profile Picture</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload a professional photo for the new employee. This will be displayed
                    throughout the system and helps colleagues identify team members.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input id="firstName" {...form.register("firstName")} />
                  {form.formState.errors.firstName && (
                    <p className="text-red-500 text-sm">{form.formState.errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input id="lastName" {...form.register("lastName")} />
                  {form.formState.errors.lastName && (
                    <p className="text-red-500 text-sm">{form.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Work Email *</Label>
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
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...form.register("dateOfBirth", {
                      setValueAs: (value) => value ? new Date(value) : undefined
                    })}
                    defaultValue={form.watch("dateOfBirth") ? format(form.watch("dateOfBirth")!, "yyyy-MM-dd") : ""}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    onValueChange={(value) => {
                      form.setValue("gender", value as any)
                      form.trigger("gender")
                    }}
                    value={form.watch("gender")}
                  >
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
                  <Select
                    onValueChange={(value) => {
                      form.setValue("maritalStatus", value as any)
                      form.trigger("maritalStatus")
                    }}
                    value={form.watch("maritalStatus")}
                  >
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
                  <Label htmlFor="position">Position *</Label>
                  <Input id="position" {...form.register("position")} />
                  {form.formState.errors.position && (
                    <p className="text-red-500 text-sm">{form.formState.errors.position.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Select
                    onValueChange={(value) => {
                      form.setValue("department", value)
                      form.trigger("department") // Trigger validation
                    }}
                    value={form.watch("department")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.department && (
                    <p className="text-red-500 text-sm">{form.formState.errors.department.message}</p>
                  )}
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
                  <Label htmlFor="role">Role</Label>
                  <Select
                    onValueChange={(value) => {
                      form.setValue("role", value as any)
                      form.trigger("role")
                    }}
                    value={form.watch("role")}
                  >
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    {...form.register("startDate", {
                      setValueAs: (value) => value ? new Date(value) : new Date()
                    })}
                    defaultValue={form.watch("startDate") ? format(form.watch("startDate")!, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")}
                  />
                  {form.formState.errors.startDate && (
                    <p className="text-red-500 text-sm">{form.formState.errors.startDate.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hireDate">Hire Date</Label>
                  <Input
                    id="hireDate"
                    type="date"
                    {...form.register("hireDate", {
                      setValueAs: (value) => value ? new Date(value) : undefined
                    })}
                    defaultValue={form.watch("hireDate") ? format(form.watch("hireDate")!, "yyyy-MM-dd") : ""}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contractType">Contract Type</Label>
                  <Select
                    onValueChange={(value) => {
                      form.setValue("contractType", value as any)
                      form.trigger("contractType")
                    }}
                    value={form.watch("contractType")}
                  >
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
                  <Select
                    onValueChange={(value) => {
                      form.setValue("workType", value as any)
                      form.trigger("workType")
                    }}
                    value={form.watch("workType")}
                  >
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

              <div className="space-y-2">
                <Label htmlFor="password">Initial Password</Label>
                <Input id="password" type="password" {...form.register("password")} placeholder="Set initial password for employee" />
                {form.formState.errors.password && (
                  <p className="text-red-500 text-sm">{form.formState.errors.password.message}</p>
                )}
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

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Next Steps</h4>
                <p className="text-sm text-blue-700">
                  After creating the employee, you can add ID proofs and documents from their profile page.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Employee"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
