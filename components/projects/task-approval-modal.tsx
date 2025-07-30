'use client';

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  Users,
  MessageSquare,
  FileText,
  Target,
  TrendingUp
} from "lucide-react";

interface TaskApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  taskName?: string;
  projectName?: string;
  assigneeName?: string;
  estimatedValue?: number;
  businessImpact?: string;
  action: 'approve' | 'reject' | null;
  onApprove: (taskId: string, data: ApprovalData) => void;
  onReject: (taskId: string, data: RejectionData) => void;
}

interface ApprovalData {
  comments?: string;
  qualityRating?: number;
  bonusRecommendation?: boolean;
  nextActions?: string;
  notifyStakeholders?: boolean;
}

interface RejectionData {
  comments: string;
  rejectionReason: string;
  requiredChanges?: string;
  estimatedRevisionTime?: number;
  scheduleFollowUp?: boolean;
  followUpDate?: string;
}

export function TaskApprovalModal({
  isOpen,
  onClose,
  taskId,
  taskName,
  projectName,
  assigneeName,
  estimatedValue,
  businessImpact,
  action,
  onApprove,
  onReject
}: TaskApprovalModalProps) {
  // Form state for approval
  const [comments, setComments] = useState('');
  const [qualityRating, setQualityRating] = useState<number>(5);
  const [bonusRecommendation, setBonusRecommendation] = useState(false);
  const [nextActions, setNextActions] = useState('');
  const [notifyStakeholders, setNotifyStakeholders] = useState(false);

  // Form state for rejection
  const [rejectionReason, setRejectionReason] = useState('');
  const [requiredChanges, setRequiredChanges] = useState('');
  const [estimatedRevisionTime, setEstimatedRevisionTime] = useState<number>(0);
  const [scheduleFollowUp, setScheduleFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setComments('');
    setQualityRating(5);
    setBonusRecommendation(false);
    setNextActions('');
    setNotifyStakeholders(false);
    setRejectionReason('');
    setRequiredChanges('');
    setEstimatedRevisionTime(0);
    setScheduleFollowUp(false);
    setFollowUpDate('');
  };

  const handleSubmit = async () => {
    if (!action) return;

    setIsSubmitting(true);

    try {
      if (action === 'approve') {
        const approvalData: ApprovalData = {
          comments,
          qualityRating,
          bonusRecommendation,
          nextActions,
          notifyStakeholders
        };
        await onApprove(taskId, approvalData);
      } else {
        const rejectionData: RejectionData = {
          comments,
          rejectionReason,
          requiredChanges,
          estimatedRevisionTime,
          scheduleFollowUp,
          followUpDate
        };
        await onReject(taskId, rejectionData);
      }

      // Reset form and close modal
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error submitting approval/rejection:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    if (action === 'approve') {
      return comments.length >= 10;
    } else {
      return comments.length >= 10 && rejectionReason && requiredChanges.length >= 20;
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg">
            {action === 'approve' ? (
              <>
                <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                Approve Task Completion
              </>
            ) : (
              <>
                <XCircle className="h-6 w-6 text-red-500 mr-2" />
                Reject Task Submission
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-base">
            {action === 'approve'
              ? 'Review and approve this task completion. Your decision will impact project timeline and team performance.'
              : 'Provide detailed feedback for task revision. Clear guidance helps ensure quality delivery.'}
          </DialogDescription>
        </DialogHeader>

        {/* Task Information Summary */}
        <Card className="bg-muted/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Task Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Task:</span>
                <p className="font-medium">{taskName || 'Task Name'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Project:</span>
                <p className="font-medium">{projectName || 'Project Name'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Assignee:</span>
                <p className="font-medium">{assigneeName || 'Employee Name'}</p>
              </div>
              {estimatedValue && (
                <div>
                  <span className="text-muted-foreground">Business Value:</span>
                  <p className="font-medium flex items-center">
                    <DollarSign className="h-3 w-3 mr-1" />
                    {estimatedValue.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
            {businessImpact && (
              <div className="pt-2">
                <Badge variant="outline" className={`
                  ${businessImpact === 'critical' ? 'border-red-500 text-red-700' : ''}
                  ${businessImpact === 'high' ? 'border-orange-500 text-orange-700' : ''}
                  ${businessImpact === 'medium' ? 'border-yellow-500 text-yellow-700' : ''}
                  ${businessImpact === 'low' ? 'border-green-500 text-green-700' : ''}
                `}>
                  {businessImpact.toUpperCase()} BUSINESS IMPACT
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="space-y-6">
          {action === 'approve' ? (
            // Approval Form
            <div className="space-y-4">
              <div>
                <Label htmlFor="comments" className="text-sm font-medium flex items-center">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Approval Comments
                </Label>
                <Textarea
                  id="comments"
                  placeholder="Provide feedback on the task completion, quality of work, and any commendations..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="mt-2"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum 10 characters required
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Quality Rating
                  </Label>
                  <Select value={qualityRating.toString()} onValueChange={(value) => setQualityRating(Number(value))}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 - Exceptional</SelectItem>
                      <SelectItem value="4">4 - Above Average</SelectItem>
                      <SelectItem value="3">3 - Meets Expectations</SelectItem>
                      <SelectItem value="2">2 - Below Average</SelectItem>
                      <SelectItem value="1">1 - Needs Improvement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox
                    id="bonus"
                    checked={bonusRecommendation}
                    onCheckedChange={(checked) => setBonusRecommendation(checked as boolean)}
                  />
                  <Label htmlFor="bonus" className="text-sm">
                    Recommend for bonus/recognition
                  </Label>
                </div>
              </div>

              <div>
                <Label htmlFor="nextActions" className="text-sm font-medium">
                  Next Actions / Follow-up Tasks
                </Label>
                <Textarea
                  id="nextActions"
                  placeholder="Suggest any follow-up actions or next steps..."
                  value={nextActions}
                  onChange={(e) => setNextActions(e.target.value)}
                  className="mt-2"
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notify"
                  checked={notifyStakeholders}
                  onCheckedChange={(checked) => setNotifyStakeholders(checked as boolean)}
                />
                <Label htmlFor="notify" className="text-sm">
                  Notify project stakeholders of completion
                </Label>
              </div>
            </div>
          ) : (
            // Rejection Form
            <div className="space-y-4">
              <div>
                <Label htmlFor="rejectionReason" className="text-sm font-medium flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Primary Rejection Reason *
                </Label>
                <Select value={rejectionReason} onValueChange={setRejectionReason}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select primary reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quality">Quality does not meet standards</SelectItem>
                    <SelectItem value="incomplete">Task is incomplete</SelectItem>
                    <SelectItem value="requirements">Does not meet requirements</SelectItem>
                    <SelectItem value="timeline">Submitted past deadline</SelectItem>
                    <SelectItem value="documentation">Missing documentation</SelectItem>
                    <SelectItem value="testing">Insufficient testing/validation</SelectItem>
                    <SelectItem value="other">Other (specify in comments)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="comments" className="text-sm font-medium flex items-center">
                  <FileText className="h-4 w-4 mr-1" />
                  Detailed Feedback *
                </Label>
                <Textarea
                  id="comments"
                  placeholder="Provide specific feedback on what needs to be improved or corrected..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="mt-2"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum 10 characters required
                </p>
              </div>

              <div>
                <Label htmlFor="requiredChanges" className="text-sm font-medium">
                  Required Changes *
                </Label>
                <Textarea
                  id="requiredChanges"
                  placeholder="List specific changes that must be made before resubmission..."
                  value={requiredChanges}
                  onChange={(e) => setRequiredChanges(e.target.value)}
                  className="mt-2"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum 20 characters required
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="revisionTime" className="text-sm font-medium flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Estimated Revision Time (hours)
                  </Label>
                  <Input
                    id="revisionTime"
                    type="number"
                    min="0"
                    step="0.5"
                    value={estimatedRevisionTime}
                    onChange={(e) => setEstimatedRevisionTime(Number(e.target.value))}
                    className="mt-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 pt-6">
                    <Checkbox
                      id="followUp"
                      checked={scheduleFollowUp}
                      onCheckedChange={(checked) => setScheduleFollowUp(checked as boolean)}
                    />
                    <Label htmlFor="followUp" className="text-sm">
                      Schedule follow-up meeting
                    </Label>
                  </div>

                  {scheduleFollowUp && (
                    <Input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="mt-2"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <Separator />

        <DialogFooter className="flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            {action === 'approve'
              ? 'This action will mark the task as completed and notify the assignee.'
              : 'This action will send the task back for revision with your feedback.'
            }
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant={action === 'approve' ? 'default' : 'destructive'}
              onClick={handleSubmit}
              disabled={isSubmitting || !isFormValid()}
              className={action === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {isSubmitting ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : action === 'approve' ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve & Complete
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject & Return
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
