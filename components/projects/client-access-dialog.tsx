'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Mail, Eye, DollarSign, MessageSquare, CheckCircle, Calendar, ExternalLink } from 'lucide-react';

interface ClientAccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  clientEmail?: string;
}

interface ClientAccessData {
  clientEmail: string;
  permissions: string[];
  lastAccessAt?: string;
  expiresAt?: string;
  isActive: boolean;
}

const PERMISSION_OPTIONS = [
  { id: 'view_progress', label: 'View Progress', icon: Eye, description: 'View project status and completion' },
  { id: 'view_documents', label: 'View Documents', icon: Eye, description: 'Access project files and documents' },
  { id: 'view_budget', label: 'View Budget', icon: DollarSign, description: 'See budget and financial information' },
  { id: 'comment', label: 'Comment', icon: MessageSquare, description: 'Add comments and feedback' },
  { id: 'approve_milestones', label: 'Approve Milestones', icon: CheckCircle, description: 'Approve milestone completions' }
];

export function ClientAccessDialog({ isOpen, onClose, projectId, projectName, clientEmail }: ClientAccessDialogProps) {
  const [loading, setLoading] = useState(false);
  const [existingAccess, setExistingAccess] = useState<ClientAccessData | null>(null);
  const [formData, setFormData] = useState({
    clientEmail: clientEmail || '',
    permissions: ['view_progress'] as string[],
    expiresAt: '',
    notificationPrefs: {
      emailReports: true,
      frequency: 'weekly' as 'daily' | 'weekly' | 'milestone',
      includeFinancials: false
    }
  });
  const [generatedAccess, setGeneratedAccess] = useState<{ accessToken: string; accessUrl: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && projectId) {
      fetchExistingAccess();
    }
  }, [isOpen, projectId]);

  useEffect(() => {
    if (clientEmail) {
      setFormData(prev => ({ ...prev, clientEmail }));
    }
  }, [clientEmail]);

  const fetchExistingAccess = async () => {
    try {
      const response = await fetch(`/api/projects/client-portal?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setExistingAccess(data);
        setFormData(prev => ({
          ...prev,
          clientEmail: data.clientEmail,
          permissions: data.permissions
        }));
      }
    } catch (error) {
      console.error('Error fetching existing access:', error);
    }
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked
        ? [...prev.permissions, permissionId]
        : prev.permissions.filter(p => p !== permissionId)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.clientEmail) {
      toast({
        title: 'Error',
        description: 'Please enter a client email address',
        variant: 'destructive',
      });
      return;
    }

    if (formData.permissions.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one permission',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/projects/client-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_access',
          projectId,
          clientEmail: formData.clientEmail,
          permissions: formData.permissions,
          expiresAt: formData.expiresAt || undefined,
          notificationPrefs: formData.notificationPrefs
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create client access');
      }

      setGeneratedAccess({
        accessToken: data.accessToken,
        accessUrl: data.accessUrl
      });

      toast({
        title: 'Success',
        description: 'Client access created successfully and email sent to client',
      });

      // Refresh existing access data
      await fetchExistingAccess();
    } catch (error) {
      console.error('Error creating client access:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create client access',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: `${label} copied to clipboard`,
    });
  };

  const handleClose = () => {
    setGeneratedAccess(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Client Portal Access</DialogTitle>
          <DialogDescription>
            Grant your client secure access to view project progress for "{projectName}"
          </DialogDescription>
        </DialogHeader>

        {existingAccess && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Current Access
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Client Email:</span>
                  <span className="font-medium">{existingAccess.clientEmail}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <Badge variant={existingAccess.isActive ? "default" : "secondary"}>
                    {existingAccess.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {existingAccess.lastAccessAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last Access:</span>
                    <span className="text-sm">{new Date(existingAccess.lastAccessAt).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Permissions:</span>
                  <div className="flex flex-wrap gap-1">
                    {existingAccess.permissions.map(permission => (
                      <Badge key={permission} variant="outline" className="text-xs">
                        {permission.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {generatedAccess ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Access Created Successfully
              </CardTitle>
              <CardDescription>
                The client has been sent an email with access instructions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Access URL</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={generatedAccess.accessUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(generatedAccess.accessUrl, 'Access URL')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(generatedAccess.accessUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Access Token</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={generatedAccess.accessToken}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(generatedAccess.accessToken, 'Access Token')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="clientEmail">Client Email Address</Label>
              <Input
                id="clientEmail"
                type="email"
                placeholder="client@example.com"
                value={formData.clientEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
              />
            </div>

            <div className="space-y-3">
              <Label>Permissions</Label>
              <div className="grid grid-cols-1 gap-3">
                {PERMISSION_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <div key={option.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        id={option.id}
                        checked={formData.permissions.includes(option.id)}
                        onCheckedChange={(checked) => handlePermissionChange(option.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-gray-500" />
                          <Label htmlFor={option.id} className="font-medium cursor-pointer">
                            {option.label}
                          </Label>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <Label>Notification Preferences</Label>
              <div className="space-y-3 p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="emailReports"
                    checked={formData.notificationPrefs.emailReports}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({
                        ...prev,
                        notificationPrefs: { ...prev.notificationPrefs, emailReports: checked as boolean }
                      }))
                    }
                  />
                  <Label htmlFor="emailReports">Send automated progress reports</Label>
                </div>
                
                {formData.notificationPrefs.emailReports && (
                  <div className="ml-6 space-y-3">
                    <div>
                      <Label className="text-sm">Report Frequency</Label>
                      <Select
                        value={formData.notificationPrefs.frequency}
                        onValueChange={(value: 'daily' | 'weekly' | 'milestone') =>
                          setFormData(prev => ({
                            ...prev,
                            notificationPrefs: { ...prev.notificationPrefs, frequency: value }
                          }))
                        }
                      >
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="milestone">On Milestone Completion</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeFinancials"
                        checked={formData.notificationPrefs.includeFinancials}
                        onCheckedChange={(checked) => 
                          setFormData(prev => ({
                            ...prev,
                            notificationPrefs: { ...prev.notificationPrefs, includeFinancials: checked as boolean }
                          }))
                        }
                      />
                      <Label htmlFor="includeFinancials" className="text-sm">Include financial information in reports</Label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiresAt">Access Expiration (Optional)</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
              />
              <p className="text-sm text-gray-600">Leave empty for permanent access</p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {generatedAccess ? 'Close' : 'Cancel'}
          </Button>
          {!generatedAccess && (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Creating Access...' : existingAccess ? 'Update Access' : 'Create Access'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
