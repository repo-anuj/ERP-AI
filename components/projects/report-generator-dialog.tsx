'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Mail, FileText, Clock, Send, Calendar } from 'lucide-react';

interface ReportGeneratorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  clientEmail?: string;
}

export function ReportGeneratorDialog({ isOpen, onClose, projectId, projectName, clientEmail }: ReportGeneratorDialogProps) {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<'weekly' | 'milestone' | 'completion' | 'custom'>('weekly');
  const [formData, setFormData] = useState({
    recipients: clientEmail ? [clientEmail] : [''],
    includeFinancials: false,
    customTitle: '',
    additionalNotes: '',
    scheduleReport: false,
    frequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
    dayOfWeek: 1, // Monday
    time: '09:00'
  });
  const { toast } = useToast();

  const handleAddRecipient = () => {
    setFormData(prev => ({
      ...prev,
      recipients: [...prev.recipients, '']
    }));
  };

  const handleRemoveRecipient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index)
    }));
  };

  const handleRecipientChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.map((email, i) => i === index ? value : email)
    }));
  };

  const handleGenerateReport = async () => {
    const validRecipients = formData.recipients.filter(email => email.trim() && email.includes('@'));
    
    if (validRecipients.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one valid email recipient',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/projects/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate',
          projectId,
          reportType,
          recipients: validRecipients,
          title: formData.customTitle || undefined,
          includeFinancials: formData.includeFinancials,
          customContent: {
            additionalNotes: formData.additionalNotes || undefined
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate report');
      }

      toast({
        title: 'Success',
        description: `${reportType} report generated and sent to ${validRecipients.length} recipient(s)`,
      });

      onClose();
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate report',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleReport = async () => {
    const validRecipients = formData.recipients.filter(email => email.trim() && email.includes('@'));
    
    if (validRecipients.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one valid email recipient',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/projects/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'schedule',
          projectId,
          reportType,
          recipients: validRecipients,
          frequency: formData.frequency,
          dayOfWeek: formData.dayOfWeek,
          time: formData.time,
          isActive: true
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to schedule report');
      }

      toast({
        title: 'Success',
        description: `${reportType} report scheduled successfully`,
      });

      onClose();
    } catch (error) {
      console.error('Error scheduling report:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to schedule report',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Project Report
          </DialogTitle>
          <DialogDescription>
            Generate and send automated progress reports for "{projectName}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Type */}
          <div className="space-y-2">
            <Label>Report Type</Label>
            <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly Progress Report</SelectItem>
                <SelectItem value="milestone">Milestone Achievement Report</SelectItem>
                <SelectItem value="completion">Project Completion Report</SelectItem>
                <SelectItem value="custom">Custom Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recipients */}
          <div className="space-y-3">
            <Label>Email Recipients</Label>
            {formData.recipients.map((email, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  type="email"
                  placeholder="recipient@example.com"
                  value={email}
                  onChange={(e) => handleRecipientChange(index, e.target.value)}
                />
                {formData.recipients.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveRecipient(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={handleAddRecipient}>
              Add Recipient
            </Button>
          </div>

          {/* Custom Title */}
          {reportType === 'custom' && (
            <div className="space-y-2">
              <Label>Custom Report Title</Label>
              <Input
                placeholder="Enter custom report title"
                value={formData.customTitle}
                onChange={(e) => setFormData(prev => ({ ...prev, customTitle: e.target.value }))}
              />
            </div>
          )}

          {/* Options */}
          <div className="space-y-3">
            <Label>Report Options</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeFinancials"
                  checked={formData.includeFinancials}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, includeFinancials: checked as boolean }))
                  }
                />
                <Label htmlFor="includeFinancials">Include financial information</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="scheduleReport"
                  checked={formData.scheduleReport}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, scheduleReport: checked as boolean }))
                  }
                />
                <Label htmlFor="scheduleReport">Schedule recurring reports</Label>
              </div>
            </div>
          </div>

          {/* Scheduling Options */}
          {formData.scheduleReport && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Schedule Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Frequency</Label>
                    <Select
                      value={formData.frequency}
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, frequency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                    />
                  </div>
                </div>

                {formData.frequency === 'weekly' && (
                  <div>
                    <Label>Day of Week</Label>
                    <Select
                      value={formData.dayOfWeek.toString()}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, dayOfWeek: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Monday</SelectItem>
                        <SelectItem value="2">Tuesday</SelectItem>
                        <SelectItem value="3">Wednesday</SelectItem>
                        <SelectItem value="4">Thursday</SelectItem>
                        <SelectItem value="5">Friday</SelectItem>
                        <SelectItem value="6">Saturday</SelectItem>
                        <SelectItem value="0">Sunday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label>Additional Notes (Optional)</Label>
            <Textarea
              placeholder="Add any additional information to include in the report..."
              value={formData.additionalNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {formData.scheduleReport ? (
            <Button onClick={handleScheduleReport} disabled={loading}>
              {loading ? 'Scheduling...' : 'Schedule Report'}
            </Button>
          ) : (
            <Button onClick={handleGenerateReport} disabled={loading}>
              {loading ? 'Generating...' : 'Generate & Send Report'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
