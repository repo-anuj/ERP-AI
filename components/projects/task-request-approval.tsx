'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2 } from "lucide-react";

interface TaskRequestApprovalProps {
  taskId: string;
  taskName: string;
  onRequestApproval: (taskId: string, message: string) => Promise<void>;
  disabled?: boolean;
}

export function TaskRequestApproval({ 
  taskId, 
  taskName, 
  onRequestApproval,
  disabled = false
}: TaskRequestApprovalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onRequestApproval(taskId, message);
      
      toast({
        title: "Approval Requested",
        description: "Your task has been submitted for approval.",
      });
      
      setIsOpen(false);
      setMessage('');
    } catch (error) {
      console.error('Error requesting approval:', error);
      toast({
        title: "Error",
        description: "Failed to request approval. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className="text-green-600 border-green-600 hover:bg-green-50"
        onClick={() => setIsOpen(true)}
        disabled={disabled}
      >
        <CheckCircle2 className="h-4 w-4 mr-1" />
        Request Approval
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Request Task Approval</DialogTitle>
            <DialogDescription>
              Submit this task for approval by your project manager.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <h3 className="font-medium">Task: {taskName}</h3>
            </div>
            
            <Label htmlFor="approval-message" className="mb-2 block">
              Message (Optional)
            </Label>
            <Textarea
              id="approval-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add any comments or notes about the completed task..."
              rows={5}
              className="resize-none"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              variant="default"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
