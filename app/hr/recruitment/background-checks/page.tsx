'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, Search, Filter, Eye, Edit, Calendar, Clock, User, 
  CheckCircle, XCircle, AlertTriangle, Shield, FileText, 
  Building, Phone, Mail, ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { format, differenceInDays, isAfter } from 'date-fns';

interface BackgroundCheck {
  id: string;
  referenceNumber: string;
  checkType: string;
  status: string;
  priority: string;
  vendorReferenceId?: string;
  overallResult?: string;
  reportUrl?: string;
  consentObtained: boolean;
  consentDate?: string;
  startedAt?: string;
  expectedCompletionDate?: string;
  completedAt?: string;
  notes?: string;
  createdAt: string;
  candidate: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    currentCompany?: string;
    currentPosition?: string;
  };
  vendor?: {
    id: string;
    name: string;
    contactEmail: string;
    apiEndpoint?: string;
  };
  checkItems: {
    id: string;
    itemType: string;
    status: string;
    result?: string;
    details?: any;
    completedAt?: string;
  }[];
  stats: {
    totalItems: number;
    completedItems: number;
    passedItems: number;
    flaggedItems: number;
    failedItems: number;
    completionPercentage: number;
  };
}

export default function BackgroundChecksPage() {
  const [backgroundChecks, setBackgroundChecks] = useState<BackgroundCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [checkTypeFilter, setCheckTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  const fetchBackgroundChecks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (checkTypeFilter && checkTypeFilter !== 'all') params.append('checkType', checkTypeFilter);
      if (priorityFilter && priorityFilter !== 'all') params.append('priority', priorityFilter);

      const response = await fetch(`/api/hr/recruitment/background-checks?${params}`);
      if (!response.ok) throw new Error('Failed to fetch background checks');

      const data = await response.json();
      setBackgroundChecks(data.backgroundChecks);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching background checks:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch background checks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackgroundChecks();
  }, [currentPage, searchTerm, statusFilter, checkTypeFilter, priorityFilter]);

  const getStatusBadge = (status: string, expectedDate?: string) => {
    const now = new Date();
    const expected = expectedDate ? new Date(expectedDate) : null;
    
    const statusConfig = {
      pending: { color: 'bg-gray-100 text-gray-800', label: 'Pending' },
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
    
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      urgent: { color: 'bg-red-100 text-red-800', label: 'Urgent' },
      high: { color: 'bg-orange-100 text-orange-800', label: 'High' },
      standard: { color: 'bg-blue-100 text-blue-800', label: 'Standard' },
      low: { color: 'bg-gray-100 text-gray-800', label: 'Low' },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.standard;
    
    return <Badge variant="outline" className={config.color}>{config.label}</Badge>;
  };

  const getResultBadge = (result?: string) => {
    if (!result) return null;

    const resultConfig = {
      clear: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Clear' },
      flagged: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle, label: 'Flagged' },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Failed' },
    };

    const config = resultConfig[result as keyof typeof resultConfig];
    if (!config) return null;

    const IconComponent = config.icon;
    
    return (
      <Badge className={config.color}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getCheckTypeIcon = (checkType: string) => {
    switch (checkType) {
      case 'criminal': return '🚔';
      case 'employment': return '💼';
      case 'education': return '🎓';
      case 'reference': return '👥';
      case 'credit': return '💳';
      case 'identity': return '🆔';
      case 'drug_test': return '🧪';
      case 'driving_record': return '🚗';
      default: return '📋';
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getDaysRemaining = (expectedDate?: string) => {
    if (!expectedDate) return null;
    
    const now = new Date();
    const expected = new Date(expectedDate);
    const days = differenceInDays(expected, now);
    
    if (days < 0) return { days: Math.abs(days), status: 'overdue' };
    if (days === 0) return { days: 0, status: 'today' };
    return { days, status: 'remaining' };
  };

  const getUrgencyIndicator = (check: BackgroundCheck) => {
    const daysInfo = getDaysRemaining(check.expectedCompletionDate);
    
    if (!daysInfo || check.status === 'completed') return null;
    
    if (daysInfo.status === 'overdue') {
      return <Badge variant="destructive" className="text-xs">{daysInfo.days} days overdue</Badge>;
    } else if (daysInfo.status === 'today') {
      return <Badge className="bg-orange-100 text-orange-800 text-xs">Due today</Badge>;
    } else if (daysInfo.days <= 2) {
      return <Badge className="bg-yellow-100 text-yellow-800 text-xs">{daysInfo.days} days left</Badge>;
    }
    
    return null;
  };

  const handleQuickAction = async (checkId: string, action: string) => {
    try {
      let endpoint = '';
      let method = 'PUT';
      let body = {};

      switch (action) {
        case 'start':
          endpoint = `/api/hr/recruitment/background-checks/${checkId}`;
          body = { status: 'in_progress' };
          break;
        case 'complete':
          endpoint = `/api/hr/recruitment/background-checks/${checkId}`;
          body = { status: 'completed', completedAt: new Date().toISOString() };
          break;
        case 'cancel':
          endpoint = `/api/hr/recruitment/background-checks/${checkId}`;
          body = { status: 'cancelled' };
          break;
      }

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error(`Failed to ${action} background check`);

      toast({
        title: 'Success',
        description: `Background check ${action}ed successfully`,
      });

      fetchBackgroundChecks();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Background Checks</h1>
          <p className="text-gray-600">Manage and track candidate background verification</p>
        </div>
        <div className="flex gap-2">
          <Link href="/hr/recruitment/background-check-vendors">
            <Button variant="outline">
              <Building className="w-4 h-4 mr-2" />
              Manage Vendors
            </Button>
          </Link>
          <Link href="/hr/recruitment/background-checks/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Background Check
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search checks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
              </SelectContent>
            </Select>

            <Select value={checkTypeFilter} onValueChange={setCheckTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="criminal">Criminal</SelectItem>
                <SelectItem value="employment">Employment</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="reference">Reference</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
                <SelectItem value="identity">Identity</SelectItem>
                <SelectItem value="drug_test">Drug Test</SelectItem>
                <SelectItem value="driving_record">Driving Record</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setCheckTypeFilter('all');
                setPriorityFilter('all');
              }}
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Background Checks Grid */}
      {loading ? (
        <div className="text-center py-8">Loading background checks...</div>
      ) : backgroundChecks.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No background checks found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {backgroundChecks.map((check) => (
            <Card key={check.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {getInitials(check.candidate.firstName, check.candidate.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">
                        {check.candidate.firstName} {check.candidate.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{check.referenceNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getUrgencyIndicator(check)}
                    <Link href={`/hr/recruitment/background-checks/${check.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    {getStatusBadge(check.status, check.expectedCompletionDate)}
                    {getPriorityBadge(check.priority)}
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">{getCheckTypeIcon(check.checkType)}</span>
                    {check.checkType.replace('_', ' ').toUpperCase()} Check
                  </div>

                  {check.vendor && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Building className="w-4 h-4 mr-2" />
                      {check.vendor.name}
                    </div>
                  )}

                  {check.expectedCompletionDate && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      Expected: {format(new Date(check.expectedCompletionDate), 'MMM dd, yyyy')}
                    </div>
                  )}

                  {check.overallResult && getResultBadge(check.overallResult)}
                </div>

                {/* Progress */}
                {check.stats.totalItems > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span>{Math.round(check.stats.completionPercentage)}%</span>
                    </div>
                    <Progress value={check.stats.completionPercentage} className="h-2" />
                  </div>
                )}

                {/* Check Items Summary */}
                {check.stats.totalItems > 0 && (
                  <div className="border-t pt-4 mb-4">
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div>
                        <div className="font-semibold text-green-600">{check.stats.passedItems}</div>
                        <div className="text-xs text-gray-500">Clear</div>
                      </div>
                      <div>
                        <div className="font-semibold text-yellow-600">{check.stats.flaggedItems}</div>
                        <div className="text-xs text-gray-500">Flagged</div>
                      </div>
                      <div>
                        <div className="font-semibold text-red-600">{check.stats.failedItems}</div>
                        <div className="text-xs text-gray-500">Failed</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="border-t pt-4">
                  <div className="flex gap-2">
                    {check.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => handleQuickAction(check.id, 'start')}
                        className="flex-1"
                      >
                        Start Check
                      </Button>
                    )}
                    
                    {check.status === 'in_progress' && (
                      <Button
                        size="sm"
                        onClick={() => handleQuickAction(check.id, 'complete')}
                        className="flex-1"
                      >
                        Mark Complete
                      </Button>
                    )}
                    
                    {(check.status === 'pending' || check.status === 'in_progress') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickAction(check.id, 'cancel')}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    )}

                    {check.reportUrl && (
                      <Button size="sm" variant="outline" asChild className="flex-1">
                        <a href={check.reportUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Report
                        </a>
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mt-4 text-xs text-gray-500">
                  Created {format(new Date(check.createdAt), 'MMM dd, yyyy')}
                  {check.completedAt && (
                    <span> • Completed {format(new Date(check.completedAt), 'MMM dd, yyyy')}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
