'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Save, User, Shield, Building, Calendar, Clock, 
  CheckCircle, XCircle, AlertTriangle, FileText, ExternalLink,
  Edit, Trash2, Download, Upload
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInDays, isAfter } from 'date-fns';

interface BackgroundCheck {
  id: string;
  candidateId: string;
  checkType: string;
  status: string;
  result?: string;
  vendor?: string;
  vendorComments?: string;
  internalNotes?: string;
  referenceNumber: string;
  requestedAt: string;
  completedAt?: string;
  expectedDate?: string;
  cost?: number;
  verificationData?: any;
  documents?: string[];
  candidate: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    currentCompany?: string;
    currentPosition?: string;
  };
}

export default function BackgroundCheckDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backgroundCheck, setBackgroundCheck] = useState<BackgroundCheck | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    status: '',
    result: '',
    vendor: '',
    vendorComments: '',
    internalNotes: '',
    cost: '',
    completedAt: '',
  });

  useEffect(() => {
    fetchBackgroundCheck();
  }, [params.id]);

  const fetchBackgroundCheck = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/hr/recruitment/background-checks/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch background check');
      
      const data = await response.json();
      setBackgroundCheck(data.backgroundCheck);
      
      // Initialize edit data
      setEditData({
        status: data.backgroundCheck.status || '',
        result: data.backgroundCheck.result || '',
        vendor: data.backgroundCheck.vendor || '',
        vendorComments: data.backgroundCheck.vendorComments || '',
        internalNotes: data.backgroundCheck.internalNotes || '',
        cost: data.backgroundCheck.cost?.toString() || '',
        completedAt: data.backgroundCheck.completedAt ? 
          new Date(data.backgroundCheck.completedAt).toISOString().split('T')[0] : '',
      });
    } catch (error) {
      console.error('Error fetching background check:', error);
      toast({
        title: 'Error',
        description: 'Failed to load background check details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const updateData = {
        ...editData,
        cost: editData.cost ? parseFloat(editData.cost) : null,
        completedAt: editData.completedAt ? new Date(editData.completedAt).toISOString() : null,
      };

      const response = await fetch(`/api/hr/recruitment/background-checks/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update background check');
      }

      const data = await response.json();
      setBackgroundCheck(data.backgroundCheck);
      setIsEditing(false);
      
      toast({
        title: 'Success',
        description: 'Background check updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this background check? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/hr/recruitment/background-checks/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete background check');
      }

      toast({
        title: 'Success',
        description: 'Background check deleted successfully',
      });

      router.push('/hr/recruitment/background-checks');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string, expectedDate?: string) => {
    const now = new Date();
    const expected = expectedDate ? new Date(expectedDate) : null;
    
    const statusConfig = {
      pending: { color: 'bg-gray-100 text-gray-800', label: 'Pending' },
      initiated: { color: 'bg-blue-100 text-blue-800', label: 'Initiated' },
      in_progress: { 
        color: expected && isAfter(now, expected) 
          ? 'bg-orange-100 text-orange-800' 
          : 'bg-blue-100 text-blue-800', 
        label: expected && isAfter(now, expected) ? 'Overdue' : 'In Progress' 
      },
      completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
      on_hold: { color: 'bg-yellow-100 text-yellow-800', label: 'On Hold' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getResultBadge = (result: string) => {
    const resultConfig = {
      clear: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      concerns: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle },
    };

    const config = resultConfig[result as keyof typeof resultConfig];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {result.charAt(0).toUpperCase() + result.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading background check details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!backgroundCheck) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Background Check Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested background check could not be found.</p>
          <Button onClick={() => router.push('/hr/recruitment/background-checks')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Background Checks
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push('/hr/recruitment/background-checks')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Background Checks
        </Button>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Background Check Details</h1>
            <p className="text-muted-foreground">
              Reference: {backgroundCheck.referenceNumber}
            </p>
          </div>
          
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Check Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Check Type</Label>
                      <p className="font-medium">{backgroundCheck.checkType}</p>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <div className="mt-1">
                        {getStatusBadge(backgroundCheck.status, backgroundCheck.expectedDate)}
                      </div>
                    </div>
                    <div>
                      <Label>Requested Date</Label>
                      <p>{format(new Date(backgroundCheck.requestedAt), 'MMM dd, yyyy')}</p>
                    </div>
                    {backgroundCheck.expectedDate && (
                      <div>
                        <Label>Expected Completion</Label>
                        <p>{format(new Date(backgroundCheck.expectedDate), 'MMM dd, yyyy')}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="results" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Check Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select value={editData.status} onValueChange={(value) => setEditData(prev => ({ ...prev, status: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="initiated">Initiated</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                            <SelectItem value="on_hold">On Hold</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="result">Result</Label>
                        <Select value={editData.result} onValueChange={(value) => setEditData(prev => ({ ...prev, result: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select result" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="clear">Clear</SelectItem>
                            <SelectItem value="concerns">Concerns Found</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label>Result</Label>
                        <div className="mt-1">
                          {backgroundCheck.result ? getResultBadge(backgroundCheck.result) : <span className="text-muted-foreground">Pending</span>}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Documents
                    </span>
                    <Button size="sm" variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {backgroundCheck.documents && backgroundCheck.documents.length > 0 ? (
                    <div className="space-y-2">
                      {backgroundCheck.documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 mr-2 text-muted-foreground" />
                            <span>{doc}</span>
                          </div>
                          <Button size="sm" variant="ghost">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No documents uploaded yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Candidate Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Candidate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="font-medium">
                    {backgroundCheck.candidate.firstName} {backgroundCheck.candidate.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{backgroundCheck.candidate.email}</p>
                </div>
                {backgroundCheck.candidate.currentCompany && (
                  <div>
                    <Label className="text-xs">Current Company</Label>
                    <p className="text-sm">{backgroundCheck.candidate.currentCompany}</p>
                  </div>
                )}
                {backgroundCheck.candidate.currentPosition && (
                  <div>
                    <Label className="text-xs">Current Position</Label>
                    <p className="text-sm">{backgroundCheck.candidate.currentPosition}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Check Requested</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(backgroundCheck.requestedAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
                
                {backgroundCheck.completedAt && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Check Completed</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(backgroundCheck.completedAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          {isEditing ? (
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="vendor">Vendor</Label>
                  <Input
                    id="vendor"
                    value={editData.vendor}
                    onChange={(e) => setEditData(prev => ({ ...prev, vendor: e.target.value }))}
                    placeholder="Vendor name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="cost">Cost ($)</Label>
                  <Input
                    id="cost"
                    type="number"
                    value={editData.cost}
                    onChange={(e) => setEditData(prev => ({ ...prev, cost: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <Label htmlFor="completedAt">Completion Date</Label>
                  <Input
                    id="completedAt"
                    type="date"
                    value={editData.completedAt}
                    onChange={(e) => setEditData(prev => ({ ...prev, completedAt: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="vendorComments">Vendor Comments</Label>
                  <Textarea
                    id="vendorComments"
                    value={editData.vendorComments}
                    onChange={(e) => setEditData(prev => ({ ...prev, vendorComments: e.target.value }))}
                    placeholder="Comments from the vendor..."
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="internalNotes">Internal Notes</Label>
                  <Textarea
                    id="internalNotes"
                    value={editData.internalNotes}
                    onChange={(e) => setEditData(prev => ({ ...prev, internalNotes: e.target.value }))}
                    placeholder="Internal notes..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {backgroundCheck.vendor && (
                  <div>
                    <Label className="text-xs">Vendor</Label>
                    <p className="text-sm">{backgroundCheck.vendor}</p>
                  </div>
                )}
                
                {backgroundCheck.cost && (
                  <div>
                    <Label className="text-xs">Cost</Label>
                    <p className="text-sm">${backgroundCheck.cost}</p>
                  </div>
                )}
                
                {backgroundCheck.vendorComments && (
                  <div>
                    <Label className="text-xs">Vendor Comments</Label>
                    <p className="text-sm">{backgroundCheck.vendorComments}</p>
                  </div>
                )}
                
                {backgroundCheck.internalNotes && (
                  <div>
                    <Label className="text-xs">Internal Notes</Label>
                    <p className="text-sm">{backgroundCheck.internalNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
