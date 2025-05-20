'use client';

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle, XCircle, Clock, HelpCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface TaskApprovalStatusProps {
  status: string;
  approvalStatus?: string;
  approvedByName?: string;
  approvedAt?: Date;
  rejectionReason?: string;
}

export function TaskApprovalStatus({ 
  status, 
  approvalStatus, 
  approvedByName,
  approvedAt,
  rejectionReason
}: TaskApprovalStatusProps) {
  // If task is not in approval workflow, return null
  if (status !== 'awaiting_approval' && approvalStatus !== 'approved' && approvalStatus !== 'rejected') {
    return null;
  }
  
  let badgeContent;
  let tooltipContent;
  
  if (status === 'awaiting_approval') {
    badgeContent = (
      <div className="flex items-center">
        <Clock className="h-3 w-3 mr-1" />
        <span>Awaiting Approval</span>
      </div>
    );
    tooltipContent = "This task is waiting for manager approval";
  } else if (approvalStatus === 'approved') {
    badgeContent = (
      <div className="flex items-center">
        <CheckCircle className="h-3 w-3 mr-1" />
        <span>Approved</span>
      </div>
    );
    tooltipContent = approvedByName && approvedAt
      ? `Approved by ${approvedByName} on ${formatDate(approvedAt)}`
      : "This task has been approved";
  } else if (approvalStatus === 'rejected') {
    badgeContent = (
      <div className="flex items-center">
        <XCircle className="h-3 w-3 mr-1" />
        <span>Rejected</span>
      </div>
    );
    tooltipContent = rejectionReason
      ? `Rejected: ${rejectionReason}`
      : "This task has been rejected";
  } else {
    badgeContent = (
      <div className="flex items-center">
        <HelpCircle className="h-3 w-3 mr-1" />
        <span>Unknown</span>
      </div>
    );
    tooltipContent = "Unknown approval status";
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={
              status === 'awaiting_approval' ? "outline" : 
              approvalStatus === 'approved' ? "default" : 
              approvalStatus === 'rejected' ? "destructive" : 
              "secondary"
            }
            className={
              status === 'awaiting_approval' ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20" : 
              approvalStatus === 'approved' ? "bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20" : 
              approvalStatus === 'rejected' ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20" : 
              ""
            }
          >
            {badgeContent}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
