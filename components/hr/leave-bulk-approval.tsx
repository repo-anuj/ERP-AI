'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users, CheckCircle, XCircle, User, Calendar, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

interface PendingApplication {
  id: string;
  employee: {
    id: string;
    name: string;
    employeeId: string;
  };
  leaveType: {
    id: string;
    name: string;
  };
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  appliedAt: string;
  urgency: 'high' | 'medium' | 'low';
  currentApprovalLevel: number;
}

interface LeaveBulkApprovalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LeaveBulkApproval({
  open,
  onClose,
  onSuccess,
}: LeaveBulkApprovalProps) {
  const [pendingApplications, setPendingApplications] = useState<PendingApplication[]>([]);
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const [comments, setComments] = useState('');
  const { toast } = useToast();

  // Fetch pending applications when dialog opens
  useEffect(() => {
    if (open) {
      fetchPendingApplications();
    }
  }, [open]);

  const fetchPendingApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/hr/leave/applications?status=pending&limit=50');
      if (response.ok) {
        const data = await response.json();
        setPendingApplications(data.applications || []);
      }
    } catch (error) {
      console.error('Error fetching pending applications:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch pending applications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedApplications(pendingApplications.map(app => app.id));
    } else {
      setSelectedApplications([]);
    }
  };

  const handleSelectApplication = (applicationId: string, checked: boolean) => {
    if (checked) {
      setSelectedApplications(prev => [...prev, applicationId]);
    } else {
      setSelectedApplications(prev => prev.filter(id => id !== applicationId));
    }
  };

  const handleBulkAction = async () => {
    if (selectedApplications.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one application',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);

      const promises = selectedApplications.map(applicationId => {
        const application = pendingApplications.find(app => app.id === applicationId);
        if (!application) return Promise.resolve();

        return fetch(`/api/hr/leave/applications/${applicationId}/approve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action,
            comments,
            approverLevel: application.currentApprovalLevel,
          }),
        });
      });

      const results = await Promise.allSettled(promises);
      
      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;

      if (successful > 0) {
        toast({
          title: 'Success',
          description: `${successful} application(s) ${action}d successfully${failed > 0 ? `, ${failed} failed` : ''}`,
        });
      }

      if (failed > 0 && successful === 0) {
        toast({
          title: 'Error',
          description: `Failed to ${action} applications`,
          variant: 'destructive',
        });
      }

      // Refresh the list
      await fetchPendingApplications();
      setSelectedApplications([]);
      setComments('');

      if (successful > 0) {
        onSuccess?.();
      }

    } catch (error) {
      console.error('Error processing bulk action:', error);
      toast({
        title: 'Error',
        description: `Failed to ${action} applications`,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getUrgencyBadge = (urgency: 'high' | 'medium' | 'low') => {
    switch (urgency) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">Low</Badge>;
    }
  };

  const getUrgencyColor = (urgency: 'high' | 'medium' | 'low') => {
    switch (urgency) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-orange-600';
      case 'low':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Leave Approval
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Total Pending</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">{pendingApplications.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Selected</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-blue-600">{selectedApplications.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">High Priority</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-red-600">
                  {pendingApplications.filter(app => app.urgency === 'high').length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Selection */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="action"
                  value="approve"
                  checked={action === 'approve'}
                  onChange={(e) => setAction(e.target.value as 'approve' | 'reject')}
                />
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Approve Selected</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="action"
                  value="reject"
                  checked={action === 'reject'}
                  onChange={(e) => setAction(e.target.value as 'approve' | 'reject')}
                />
                <XCircle className="h-4 w-4 text-red-500" />
                <span>Reject Selected</span>
              </label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comments">Comments (Optional)</Label>
              <Textarea
                id="comments"
                placeholder={`Add comments for ${action} action...`}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Applications Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : pendingApplications.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                  <h3 className="mt-2 text-sm font-semibold text-muted-foreground">No pending approvals</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    All leave applications have been processed.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedApplications.length === pendingApplications.length && pendingApplications.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded"
                        />
                      </TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Applied</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingApplications.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedApplications.includes(application.id)}
                            onChange={(e) => handleSelectApplication(application.id, e.target.checked)}
                            className="rounded"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                              <User className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-medium">{application.employee.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {application.employee.employeeId}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{application.leaveType.name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{application.totalDays} days</div>
                        </TableCell>
                        <TableCell>
                          <div className={`text-sm ${getUrgencyColor(application.urgency)}`}>
                            {format(new Date(application.startDate), 'MMM dd')} - {format(new Date(application.endDate), 'MMM dd')}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getUrgencyBadge(application.urgency)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(new Date(application.appliedAt), 'MMM dd, yyyy')}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4">
            <div className="text-sm text-muted-foreground">
              {selectedApplications.length} of {pendingApplications.length} applications selected
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleBulkAction}
                disabled={submitting || selectedApplications.length === 0}
                variant={action === 'approve' ? 'default' : 'destructive'}
              >
                {submitting ? 'Processing...' : `${action === 'approve' ? 'Approve' : 'Reject'} Selected (${selectedApplications.length})`}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
