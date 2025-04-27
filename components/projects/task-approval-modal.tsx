'use client';

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle } from "lucide-react";

interface TaskApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  action: 'approve' | 'reject' | null;
  onApprove: (taskId: string, comments?: string) => void;
  onReject: (taskId: string, comments?: string) => void;
}

export function TaskApprovalModal({ 
  isOpen, 
  onClose, 
  taskId, 
  action, 
  onApprove, 
  onReject 
}: TaskApprovalModalProps) {
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async () => {
    if (!action) return;
    
    setIsSubmitting(true);
    
    try {
      if (action === 'approve') {
        await onApprove(taskId, comments);
      } else {
        await onReject(taskId, comments);
      }
      
      // Reset form and close modal
      setComments('');
      onClose();
    } catch (error) {
      console.error('Error submitting approval/rejection:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {action === 'approve' ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                Approve Task
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-500 mr-2" />
                Reject Task
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {action === 'approve' 
              ? 'Approve this task and mark it as completed.' 
              : 'Reject this task and send it back to the assignee for revisions.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Label htmlFor="comments" className="mb-2 block">
            {action === 'approve' ? 'Approval Comments (Optional)' : 'Rejection Reason (Required)'}
          </Label>
          <Textarea
            id="comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder={action === 'approve' 
              ? "Add any comments about the approved task..." 
              : "Explain why the task is being rejected and what needs to be fixed..."}
            rows={5}
            className="resize-none"
          />
          {action === 'reject' && comments.length < 10 && (
            <p className="text-xs text-destructive mt-1">
              Please provide a detailed explanation for rejection (minimum 10 characters).
            </p>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            variant={action === 'approve' ? 'default' : 'destructive'}
            onClick={handleSubmit}
            disabled={isSubmitting || (action === 'reject' && comments.length < 10)}
          >
            {isSubmitting 
              ? 'Processing...' 
              : action === 'approve' 
                ? 'Approve Task' 
                : 'Reject Task'
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
