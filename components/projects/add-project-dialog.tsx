"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Calendar, Clock, DollarSign, Users, Target, FileText, X, Plus, AlertCircle, File, Layout } from "lucide-react"
import { TemplateManager } from './template-manager'

// Define the schema for project form validation
const projectFormSchema = z.object({
  name: z.string().min(2, "Project name is required"),
  description: z.string().optional(),
  type: z.enum(["internal", "client", "research", "maintenance"], {
    required_error: "Project type is required",
  }),
  status: z.enum(["planning", "in_progress", "on_hold", "completed", "cancelled"], {
    required_error: "Project status is required",
  }),
  startDate: z.string().min(2, "Start date is required"),
  endDate: z.string().min(2, "End date is required"),
  completionPercentage: z.coerce.number().min(0).max(100),
  projectManagerId: z.string().min(1, "Project manager is required"),
  budget: z.coerce.number().min(0, "Budget must be a positive number"),
  expenses: z.coerce.number().min(0, "Expenses must be a positive number"),
  priority: z.enum(["low", "medium", "high"], {
    required_error: "Priority is required",
  }),
  notes: z.string().optional(),
  clientName: z.string().optional(),
  clientCompany: z.string().optional(),
  clientEmail: z.string().email().optional().or(z.literal('')),
  // Enhanced fields for Phase 2
  estimatedHours: z.coerce.number().min(0).optional(),
  riskLevel: z.enum(["low", "medium", "high"]).optional(),
  category: z.string().optional(),
  deliverables: z.string().optional(),
  successCriteria: z.string().optional(),
})

type ProjectFormValues = z.infer<typeof projectFormSchema>

type Employee = {
  id: string;
  firstName: string | { name: string };
  lastName: string | { name: string };
  position: string;
  department: string | { name: string };
  status?: string;
  role?: string;
}

export function AddProjectDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [milestones, setMilestones] = useState<Array<{name: string, targetDate: string, description: string}>>([])
  const [currentMilestone, setCurrentMilestone] = useState({name: '', targetDate: '', description: ''})
  const [showTemplates, setShowTemplates] = useState(false)
  const { toast } = useToast()

  // Fetch employees for dropdown selection
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch("/api/employees")
        if (!response.ok) {
          throw new Error("Failed to fetch employees")
        }
        const data = await response.json()

        // Filter employees to show only active employees with manager or admin roles for project manager
        // and all active employees for team members
        const activeEmployees = data.filter((emp: Employee) =>
          emp.status === 'active' || !emp.status
        )

        console.log('Fetched active employees:', activeEmployees.length)
        setEmployees(activeEmployees)
      } catch (error) {
        console.error("Error fetching employees:", error)
        toast({
          title: "Error",
          description: "Failed to load employees. Please try again.",
          variant: "destructive",
        })
      }
    }

    if (open) {
      fetchEmployees()
    }
  }, [open, toast])

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "internal",
      status: "planning",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // Default to 30 days from now
      completionPercentage: 0,
      projectManagerId: "",
      budget: 0,
      expenses: 0,
      priority: "medium",
      notes: "",
      clientName: "",
      clientCompany: "",
      clientEmail: "",
      estimatedHours: 0,
      riskLevel: "medium",
      category: "",
      deliverables: "",
      successCriteria: "",
    },
  })

  // Handle adding a tag
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput("")
    }
  }

  // Handle removing a tag
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  // Handle tag input keydown (add tag on Enter)
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTag()
    }
  }

  // Toggle team member selection
  const toggleTeamMember = (employeeId: string) => {
    if (selectedTeamMembers.includes(employeeId)) {
      setSelectedTeamMembers(selectedTeamMembers.filter(id => id !== employeeId))
    } else {
      setSelectedTeamMembers([...selectedTeamMembers, employeeId])
    }
  }

  // Get employee name by ID
  const getEmployeeName = (id: string) => {
    const employee = employees.find(emp => emp.id === id)
    if (!employee) return ""

    // Handle both string and object cases for firstName/lastName
    const firstName = typeof employee.firstName === 'string'
      ? employee.firstName
      : (employee.firstName as { name: string }).name
    const lastName = typeof employee.lastName === 'string'
      ? employee.lastName
      : (employee.lastName as { name: string }).name

    return `${firstName} ${lastName}`.trim()
  }

  // Handle adding a milestone
  const handleAddMilestone = () => {
    if (currentMilestone.name.trim() && currentMilestone.targetDate) {
      setMilestones([...milestones, { ...currentMilestone }])
      setCurrentMilestone({name: '', targetDate: '', description: ''})
    }
  }

  // Handle removing a milestone
  const handleRemoveMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index))
  }

  async function onSubmit(data: ProjectFormValues) {
    try {
      setLoading(true)

      // Prepare team members data
      const teamMembers = selectedTeamMembers.map(id => {
        const employee = employees.find(emp => emp.id === id)
        return {
          employeeId: id,
          name: `${employee?.firstName} ${employee?.lastName}`,
          role: employee?.position,
          department: employee?.department,
        }
      })

      // Prepare project manager data
      const manager = employees.find(emp => emp.id === data.projectManagerId)
      const projectManager = {
        employeeId: data.projectManagerId,
        name: `${manager?.firstName} ${manager?.lastName}`,
        role: manager?.position,
        department: manager?.department,
      }

      // Prepare client data if provided
      let client = undefined
      if (data.clientName) {
        client = {
          name: data.clientName,
          company: data.clientCompany || undefined,
          email: data.clientEmail || undefined,
        }
      }

      // Prepare the complete project data
      const projectData = {
        name: data.name,
        description: data.description,
        type: data.type,
        status: data.status,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        completionPercentage: data.completionPercentage,
        projectManager,
        teamMembers,
        client,
        budget: data.budget,
        expenses: data.expenses,
        priority: data.priority,
        tags,
        notes: data.notes,
        // Enhanced fields
        estimatedHours: data.estimatedHours || 0,
        riskLevel: data.riskLevel || 'medium',
        category: data.category || '',
        deliverables: data.deliverables || '',
        successCriteria: data.successCriteria || '',
        milestones: milestones.map(m => ({
          ...m,
          targetDate: new Date(m.targetDate).toISOString(),
          status: 'pending'
        }))
      }

      // Submit the project data
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to add project")
      }

      const project = await response.json()
      
      // Reset form and close dialog
      setOpen(false)
      form.reset()
      setSelectedTeamMembers([])
      setTags([])
      setMilestones([])
      setCurrentMilestone({name: '', targetDate: '', description: ''})
      
      toast({
        title: "Project Added",
        description: `${project.name} has been added successfully.`,
        variant: "default",
      })
      
      // Instead of reloading the page, we'll update the parent component
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        // Create a custom event to notify the projects page that a new project was added
        const event = new CustomEvent('projectAdded', { detail: project });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error("Failed to add project:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add project. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Project</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] sm:h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Project</DialogTitle>
          <DialogDescription>
            Fill in the project details below. All required fields are marked with an asterisk (*).          
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pr-6">
            <Tabs defaultValue="template" className="w-full">
              <TabsList className="grid grid-cols-6 mb-4">
                <TabsTrigger value="template">Template</TabsTrigger>
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="team">Team</TabsTrigger>
                <TabsTrigger value="client">Client</TabsTrigger>
                <TabsTrigger value="planning">Planning</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>

              {/* Template Selection Tab */}
              <TabsContent value="template" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Layout className="h-5 w-5" />
                      Choose a Template
                    </CardTitle>
                    <CardDescription>
                      Start with a pre-built template or create from scratch
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4">
                      <Button
                        variant="outline"
                        className="flex-1 h-20 flex-col"
                        onClick={() => setShowTemplates(true)}
                      >
                        <Layout className="h-6 w-6 mb-2" />
                        Use Template
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 h-20 flex-col"
                        onClick={() => {
                          // Skip to basic info tab
                          const basicTab = document.querySelector('[value="basic"]') as HTMLElement;
                          basicTab?.click();
                        }}
                      >
                        <Plus className="h-6 w-6 mb-2" />
                        Start from Scratch
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select project type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="internal">Internal</SelectItem>
                            <SelectItem value="client">Client</SelectItem>
                            <SelectItem value="research">Research</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="planning">Planning</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="on_hold">On Hold</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="riskLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Risk Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select risk level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low Risk</SelectItem>
                            <SelectItem value="medium">Medium Risk</SelectItem>
                            <SelectItem value="high">High Risk</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="completionPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Completion %</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Web Development, Mobile App" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estimatedHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Hours</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.5"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                            placeholder="Total estimated hours"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
              
              {/* Team Tab */}
              <TabsContent value="team" className="space-y-4">
                <FormField
                  control={form.control}
                  name="projectManagerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Manager *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select project manager" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {employees
                            .filter(employee =>
                              employee.role === 'manager' ||
                              employee.role === 'admin' ||
                              employee.position?.toLowerCase().includes('manager') ||
                              employee.position?.toLowerCase().includes('lead')
                            )
                            .map((employee) => {
                              const firstName = typeof employee.firstName === 'string'
                                ? employee.firstName
                                : (employee.firstName as { name: string }).name
                              const lastName = typeof employee.lastName === 'string'
                                ? employee.lastName
                                : (employee.lastName as { name: string }).name
                              const fullName = `${firstName} ${lastName}`.trim()

                              return (
                                <SelectItem key={employee.id} value={employee.id}>
                                  {fullName} - {employee.position} {employee.role ? `(${employee.role})` : ''}
                                </SelectItem>
                              )
                            })}
                          {employees.filter(employee =>
                            employee.role === 'manager' ||
                            employee.role === 'admin' ||
                            employee.position?.toLowerCase().includes('manager') ||
                            employee.position?.toLowerCase().includes('lead')
                          ).length === 0 && (
                            <SelectItem value="none" disabled>
                              No managers available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-2">
                  <FormLabel>Team Members</FormLabel>
                  <div className="border rounded-md p-4 max-h-[200px] overflow-y-auto">
                    {employees.length > 0 ? (
                      employees
                        .filter(emp => emp.id !== form.getValues("projectManagerId"))
                        .map((employee) => {
                          const firstName = typeof employee.firstName === 'string'
                            ? employee.firstName
                            : (employee.firstName as { name: string }).name
                          const lastName = typeof employee.lastName === 'string'
                            ? employee.lastName
                            : (employee.lastName as { name: string }).name
                          const fullName = `${firstName} ${lastName}`.trim()

                          // Handle department - it can be an object {id, name} or a string
                          const departmentName = typeof employee.department === 'string'
                            ? employee.department
                            : (employee.department as { name: string }).name

                          return (
                            <div key={employee.id} className="flex items-center space-x-2 py-2">
                              <Checkbox
                                id={`employee-${employee.id}`}
                                checked={selectedTeamMembers.includes(employee.id)}
                                onCheckedChange={() => toggleTeamMember(employee.id)}
                              />
                              <label
                                htmlFor={`employee-${employee.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {fullName} - {employee.position} ({departmentName})
                              </label>
                            </div>
                          )
                        })
                    ) : (
                      <p className="text-sm text-muted-foreground">Loading employees...</p>
                    )}
                  </div>
                </div>
                
                {selectedTeamMembers.length > 0 && (
                  <div>
                    <FormLabel>Selected Team Members:</FormLabel>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedTeamMembers.map((id) => (
                        <Badge key={id} variant="secondary" className="flex items-center gap-1">
                          {getEmployeeName(id)}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => toggleTeamMember(id)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              {/* Client Tab */}
              <TabsContent value="client" className="space-y-4">
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="clientCompany"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Company</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="clientEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Planning Tab */}
              <TabsContent value="planning" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Project Milestones
                    </CardTitle>
                    <CardDescription>
                      Define key milestones and deliverables for this project
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input
                        placeholder="Milestone name"
                        value={currentMilestone.name}
                        onChange={(e) => setCurrentMilestone(prev => ({ ...prev, name: e.target.value }))}
                      />
                      <Input
                        type="date"
                        value={currentMilestone.targetDate}
                        onChange={(e) => setCurrentMilestone(prev => ({ ...prev, targetDate: e.target.value }))}
                      />
                      <div className="flex gap-2">
                        <Input
                          placeholder="Description (optional)"
                          value={currentMilestone.description}
                          onChange={(e) => setCurrentMilestone(prev => ({ ...prev, description: e.target.value }))}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddMilestone}
                          disabled={!currentMilestone.name.trim() || !currentMilestone.targetDate}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {milestones.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Added Milestones:</h4>
                        {milestones.map((milestone, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-medium">{milestone.name}</div>
                              <div className="text-sm text-gray-600">
                                Target: {new Date(milestone.targetDate).toLocaleDateString()}
                                {milestone.description && ` • ${milestone.description}`}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMilestone(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <FormField
                  control={form.control}
                  name="deliverables"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Key Deliverables
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="List the main deliverables for this project..."
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="successCriteria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Success Criteria
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Define what success looks like for this project..."
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Additional Details Tab */}
              <TabsContent value="details" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Budget & Financial Information
                    </CardTitle>
                    <CardDescription>
                      Set the financial parameters for this project
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="budget"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Budget *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                {...field}
                                onChange={e => field.onChange(parseFloat(e.target.value))}
                                placeholder="0.00"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="expenses"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Initial Expenses</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                {...field}
                                onChange={e => field.onChange(parseFloat(e.target.value))}
                                placeholder="0.00"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Additional Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Add any additional notes, requirements, or important information..."
                              rows={4}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-2">
                      <FormLabel>Project Tags</FormLabel>
                      <div className="flex items-center space-x-2">
                        <Input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={handleTagKeyDown}
                          placeholder="Add tag and press Enter"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAddTag}
                        >
                          Add
                        </Button>
                      </div>

                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="flex items-center gap-1">
                              {tag}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => handleRemoveTag(tag)}
                              />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Project Summary */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Project Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <div>
                      <div className="font-medium">Duration</div>
                      <div className="text-gray-600">
                        {form.watch('startDate') && form.watch('endDate')
                          ? `${Math.ceil((new Date(form.watch('endDate')).getTime() - new Date(form.watch('startDate')).getTime()) / (1000 * 60 * 60 * 24))} days`
                          : 'Not set'
                        }
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <div>
                      <div className="font-medium">Budget</div>
                      <div className="text-gray-600">${form.watch('budget') || 0}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-500" />
                    <div>
                      <div className="font-medium">Team Size</div>
                      <div className="text-gray-600">{selectedTeamMembers.length + 1} members</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-orange-500" />
                    <div>
                      <div className="font-medium">Milestones</div>
                      <div className="text-gray-600">{milestones.length} defined</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <DialogFooter className="mt-6">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating Project..." : "Create Project"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>

      {/* Template Selection Dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Choose Project Template</DialogTitle>
            <DialogDescription>
              Select a template to pre-fill your project details
            </DialogDescription>
          </DialogHeader>
          <TemplateManager
            showActions={false}
            onCreateFromTemplate={(template) => {
              // Pre-fill form with template data
              form.setValue('name', template.name);
              form.setValue('description', template.description || '');
              form.setValue('type', template.type as any);
              form.setValue('priority', template.priority as any);
              form.setValue('budget', template.defaultBudget || 0);
              form.setValue('estimatedHours', template.estimatedHours || 0);
              form.setValue('riskLevel', template.riskLevel as any);
              form.setValue('category', template.category || '');
              form.setValue('deliverables', template.deliverables || '');
              form.setValue('successCriteria', template.successCriteria || '');
              form.setValue('notes', (template as any).notes || '');

              // Set tags and milestones
              setTags(template.tags || []);
              setMilestones(template.milestones?.map((m: any) => ({
                name: m.name,
                targetDate: '',
                description: m.description || ''
              })) || []);

              setShowTemplates(false);

              // Navigate to basic info tab
              const basicTab = document.querySelector('[value="basic"]') as HTMLElement;
              basicTab?.click();

              toast({
                title: "Template Applied",
                description: `Project pre-filled with "${template.name}" template`,
              });
            }}
          />
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
