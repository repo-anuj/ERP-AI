"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

// Define the schema for milestone form validation
const milestoneFormSchema = z.object({
  name: z.string().min(2, "Milestone name is required"),
  description: z.string().optional(),
  targetDate: z.date({
    required_error: "Target date is required",
  }),
  completionDate: z.date().optional().nullable(),
  status: z.enum(["pending", "completed", "missed"], {
    required_error: "Status is required",
  }),
  deliverables: z.string().optional(),
  notes: z.string().optional(),
});

type MilestoneFormValues = z.infer<typeof milestoneFormSchema>

interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  targetDate: string;
  completionDate?: string | null;
  status: string;
  deliverables?: string;
  notes?: string;
}

interface EditMilestoneDialogProps {
  milestone: Milestone;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMilestoneUpdated?: () => void;
}

export function EditMilestoneDialog({ 
  milestone, 
  open, 
  onOpenChange, 
  onMilestoneUpdated 
}: EditMilestoneDialogProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<MilestoneFormValues>({
    resolver: zodResolver(milestoneFormSchema),
    defaultValues: {
      name: "",
      description: "",
      targetDate: new Date(),
      completionDate: null,
      status: "pending" as const,
      deliverables: "",
      notes: "",
    },
  })

  // Set form values when milestone data is available
  useEffect(() => {
    if (milestone && open) {
      form.reset({
        name: milestone.name,
        description: milestone.description || "",
        targetDate: new Date(milestone.targetDate),
        completionDate: milestone.completionDate ? new Date(milestone.completionDate) : null,
        status: milestone.status as "pending" | "completed" | "missed",
        deliverables: milestone.deliverables || "",
        notes: milestone.notes || "",
      })
    }
  }, [milestone, form, open])

  async function onSubmit(data: MilestoneFormValues) {
    try {
      setLoading(true)

      // Prepare the milestone data
      const milestoneData = {
        id: milestone.id,
        projectId: milestone.projectId,
        name: data.name,
        description: data.description,
        targetDate: data.targetDate.toISOString(),
        completionDate: data.completionDate ? data.completionDate.toISOString() : null,
        status: data.status,
        deliverables: data.deliverables,
        notes: data.notes,
      }

      // Submit the milestone data
      const response = await fetch("/api/projects/milestones", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(milestoneData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to update milestone")
      }

      const updatedMilestone = await response.json()
      
      // Close dialog
      onOpenChange(false)
      
      toast({
        title: "Milestone Updated",
        description: `${updatedMilestone.name} has been updated successfully.`,
        variant: "default",
      })
      
      // Notify parent component
      if (onMilestoneUpdated) {
        onMilestoneUpdated()
      }
    } catch (error) {
      console.error("Failed to update milestone:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update milestone. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Edit Milestone</DialogTitle>
          <DialogDescription>
            Update milestone details and progress.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Milestone Name *</FormLabel>
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
                name="targetDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Target Date *</FormLabel>
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
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="missed">Missed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="completionDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Completion Date</FormLabel>
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
                            <span>Not completed yet</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="p-2 border-b">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full justify-start text-left font-normal"
                          onClick={() => field.onChange(null)}
                        >
                          Clear date
                        </Button>
                      </div>
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
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
              name="deliverables"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deliverables</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="List the deliverables expected for this milestone"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
                {loading ? "Updating..." : "Update Milestone"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
