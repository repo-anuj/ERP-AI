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
import { X } from "lucide-react"
import { useRouter } from "next/navigation"
import { Project, ProjectMember } from "./columns"

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
})

type ProjectFormValues = z.infer<typeof projectFormSchema>

type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
}

interface EditProjectDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectUpdated?: () => void;
}

export function EditProjectDialog({ projectId, open, onOpenChange, onProjectUpdated }: EditProjectDialogProps) {
  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [project, setProject] = useState<Project | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "internal",
      status: "planning",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      completionPercentage: 0,
      projectManagerId: "",
      budget: 0,
      expenses: 0,
      priority: "medium",
      notes: "",
      clientName: "",
      clientCompany: "",
      clientEmail: "",
    },
  })

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects?id=${projectId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch project");
        }
        const data = await response.json();
        setProject(data);
        
        // Set form values
        form.reset({
          name: data.name,
          description: data.description || "",
          type: data.type,
          status: data.status,
          startDate: new Date(data.startDate).toISOString().split("T")[0],
          endDate: new Date(data.endDate).toISOString().split("T")[0],
          completionPercentage: data.completionPercentage,
          projectManagerId: data.projectManager.employeeId,
          budget: data.budget,
          expenses: data.expenses,
          priority: data.priority,
          notes: data.notes || "",
          clientName: data.client?.name || "",
          clientCompany: data.client?.company || "",
          clientEmail: data.client?.email || "",
        });
        
        // Set team members
        if (data.teamMembers && data.teamMembers.length > 0) {
          setSelectedTeamMembers(data.teamMembers.map((member: ProjectMember) => member.employeeId));
        }
        
        // Set tags
        if (data.tags && data.tags.length > 0) {
          setTags(data.tags);
        }
      } catch (error) {
        console.error("Error fetching project:", error);
        toast({
          title: "Error",
          description: "Failed to load project details. Please try again.",
          variant: "destructive",
        });
      }
    };

    if (open && projectId) {
      fetchProject();
    }
  }, [projectId, open, form, toast]);

  // Fetch employees for dropdown selection
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch("/api/employees")
        if (!response.ok) {
          throw new Error("Failed to fetch employees")
        }
        const data = await response.json()
        setEmployees(data)
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
    return employee ? `${employee.firstName} ${employee.lastName}` : ""
  }

  async function onSubmit(data: ProjectFormValues) {
    if (!projectId) return;
    
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
        id: projectId,
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
      }

      // Submit the project data
      const response = await fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to update project")
      }

      const updatedProject = await response.json()
      
      // Close dialog
      onOpenChange(false)
      
      toast({
        title: "Project Updated",
        description: `${updatedProject.name} has been updated successfully.`,
        variant: "default",
      })
      
      // Notify parent component
      if (onProjectUpdated) {
        onProjectUpdated();
      }
      
      // Refresh the page to show updated data
      router.refresh();
      
    } catch (error) {
      console.error("Failed to update project:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update project. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] sm:h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update the project details below. All required fields are marked with an asterisk (*).          
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pr-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="team">Team</TabsTrigger>
                <TabsTrigger value="client">Client</TabsTrigger>
                <TabsTrigger value="details">Additional Details</TabsTrigger>
              </TabsList>
              
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
                        <Select onValueChange={field.onChange} value={field.value}>
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
                        <Select onValueChange={field.onChange} value={field.value}>
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
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
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
                    name="completionPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Completion Percentage *</FormLabel>
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
                          {employees.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.firstName} {employee.lastName} - {employee.position}
                            </SelectItem>
                          ))}
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
                        .map((employee) => (
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
                              {employee.firstName} {employee.lastName} - {employee.position} ({employee.department})
                            </label>
                          </div>
                        ))
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
              
              {/* Additional Details Tab */}
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            step="0.01" 
                            {...field} 
                            onChange={e => field.onChange(parseFloat(e.target.value))} 
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
                        <FormLabel>Current Expenses *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            step="0.01" 
                            {...field} 
                            onChange={e => field.onChange(parseFloat(e.target.value))} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-2">
                  <FormLabel>Tags</FormLabel>
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
              </TabsContent>
            </Tabs>
            
            <DialogFooter className="mt-6">
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Project"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
