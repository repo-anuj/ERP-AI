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
import { CalendarIcon, PlusCircle } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Checkbox } from "@/components/ui/checkbox"

// Define the schema for task form validation
const taskFormSchema = z.object({
  name: z.string().min(2, "Task name is required"),
  description: z.string().optional(),
  status: z.enum(["not_started", "in_progress", "completed", "blocked"], {
    required_error: "Status is required",
  }),
  priority: z.enum(["low", "medium", "high", "urgent"], {
    required_error: "Priority is required",
  }),
  assigneeId: z.string().min(1, "Assignee is required"),
  startDate: z.date({
    required_error: "Start date is required",
  }),
  dueDate: z.date({
    required_error: "Due date is required",
  }),
  estimatedHours: z.coerce.number().int().min(0, "Estimated hours must be a positive number"),
  actualHours: z.coerce.number().min(0, "Actual hours must be a positive number"),
  completionPercentage: z.coerce.number().int().min(0).max(100, "Completion percentage must be between 0 and 100"),
  notes: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>

type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
}

type Task = {
  id: string;
  name: string;
}

interface AddTaskDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskAdded?: () => void;
}

export function AddTaskDialog({ projectId, open, onOpenChange, onTaskAdded }: AddTaskDialogProps) {
  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>([])
  const { toast } = useToast()

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "not_started",
      priority: "medium",
      assigneeId: "",
      startDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 7 days from now
      estimatedHours: 0,
      actualHours: 0,
      completionPercentage: 0,
      notes: "",
    },
  })

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

    // Fetch existing tasks for dependencies
    const fetchTasks = async () => {
      try {
        const response = await fetch(`/api/projects/tasks?projectId=${projectId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch tasks")
        }
        const data = await response.json()
        setTasks(data)
      } catch (error) {
        console.error("Error fetching tasks:", error)
        toast({
          title: "Error",
          description: "Failed to load existing tasks. Please try again.",
          variant: "destructive",
        })
      }
    }

    if (open) {
      fetchEmployees()
      fetchTasks()
    }
  }, [open, projectId, toast])

  // Toggle dependency selection
  const toggleDependency = (taskId: string) => {
    if (selectedDependencies.includes(taskId)) {
      setSelectedDependencies(selectedDependencies.filter(id => id !== taskId))
    } else {
      setSelectedDependencies([...selectedDependencies, taskId])
    }
  }

  async function onSubmit(data: TaskFormValues) {
    try {
      setLoading(true)

      // Get assignee name
      const assignee = employees.find(emp => emp.id === data.assigneeId)
      if (!assignee) {
        throw new Error("Selected assignee not found")
      }

      // Prepare the task data
      const taskData = {
        projectId,
        name: data.name,
        description: data.description,
        status: data.status,
        priority: data.priority,
        assigneeId: data.assigneeId,
        assigneeName: `${assignee.firstName} ${assignee.lastName}`,
        startDate: data.startDate.toISOString(),
        dueDate: data.dueDate.toISOString(),
        estimatedHours: data.estimatedHours,
        actualHours: data.actualHours,
        completionPercentage: data.completionPercentage,
        dependencies: selectedDependencies,
        notes: data.notes,
      }

      // Submit the task data
      const response = await fetch("/api/projects/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to add task")
      }

      const task = await response.json()

      // Reset form and close dialog
      onOpenChange(false)
      form.reset()
      setSelectedDependencies([])

      toast({
        title: "Task Added",
        description: `${task.name} has been added successfully.`,
        variant: "default",
      })

      // Notify parent component
      if (onTaskAdded) {
        onTaskAdded()
      }
    } catch (error) {
      console.error("Failed to add task:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add task. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span>Add Task</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] sm:h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>
            Add a task to the project and assign it to a team member.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Name *</FormLabel>
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
                        <SelectItem value="not_started">Not Started</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="assigneeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignee *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select assignee" />
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="estimatedHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Hours *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="actualHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actual Hours *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
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
                name="completionPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Completion % *</FormLabel>
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

            {tasks.length > 0 && (
              <div className="space-y-2">
                <FormLabel>Dependencies (Optional)</FormLabel>
                <div className="border rounded-md p-4 max-h-[150px] overflow-y-auto">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex items-center space-x-2 py-1">
                      <Checkbox
                        id={`task-${task.id}`}
                        checked={selectedDependencies.includes(task.id)}
                        onCheckedChange={() => toggleDependency(task.id)}
                      />
                      <label
                        htmlFor={`task-${task.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {task.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Adding..." : "Add Task"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
