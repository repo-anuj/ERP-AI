'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  MessageSquare,
  Plus,
  Star,
  Users,
  TrendingUp,
  Search,
  RefreshCw,
  Eye,
  User
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

interface PerformanceFeedback {
  id: string;
  employee: {
    id: string;
    name: string;
    employeeId: string;
    email: string;
    department?: string;
  };
  review?: {
    id: string;
    reviewType: string;
    status: string;
  };
  feedbackType: string;
  feedbackCategory: string;
  rating?: number;
  comments: string;
  isAnonymous: boolean;
  providerName?: string;
  providerRole?: string;
  status: string;
  isVisible: boolean;
  createdAt: string;
}

export function PerformanceFeedback() {
  const [feedbacks, setFeedbacks] = useState<PerformanceFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  // Fetch feedbacks
  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(typeFilter !== 'all' && { feedbackType: typeFilter }),
        ...(categoryFilter !== 'all' && { feedbackCategory: categoryFilter }),
      });

      const response = await fetch(`/api/hr/performance/feedback?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch performance feedback');
      }

      const data = await response.json();
      setFeedbacks(data.feedbacks || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch performance feedback',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [currentPage, typeFilter, categoryFilter]);

  // Filter feedbacks based on search term
  const filteredFeedbacks = feedbacks.filter((feedback) => {
    const matchesSearch =
      feedback.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.feedbackType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.comments.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      self: 'bg-blue-100 text-blue-800',
      manager: 'bg-green-100 text-green-800',
      peer: 'bg-purple-100 text-purple-800',
      skip_level: 'bg-orange-100 text-orange-800',
      subordinate: 'bg-gray-100 text-gray-800',
      '360': 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[type] || colors.peer}`}>
        {type.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'strengths':
        return <Badge variant="default">Strengths</Badge>;
      case 'areas_for_improvement':
        return <Badge variant="secondary">Areas for Improvement</Badge>;
      case 'achievements':
        return <Badge variant="outline">Achievements</Badge>;
      case 'goals':
        return <Badge variant="outline">Goals</Badge>;
      default:
        return <Badge variant="outline">{category}</Badge>;
    }
  };

  const renderRating = (rating?: number) => {
    if (!rating) return <span className="text-muted-foreground">No rating</span>;

    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedbacks.length}</div>
            <p className="text-xs text-muted-foreground">
              All feedback
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {feedbacks.filter(f => {
                const feedbackDate = new Date(f.createdAt);
                const now = new Date();
                return feedbackDate.getMonth() === now.getMonth() &&
                       feedbackDate.getFullYear() === now.getFullYear();
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Recent feedback
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {feedbacks.filter(f => f.rating).length > 0
                ? (feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) /
                   feedbacks.filter(f => f.rating).length).toFixed(1)
                : '0.0'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Out of 5.0
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {new Set(feedbacks.map(f => f.employee.id)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Receiving feedback
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Feedback Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Performance Feedback</CardTitle>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Give Feedback
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search feedback..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="self">Self</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="peer">Peer</SelectItem>
                <SelectItem value="skip_level">Skip Level</SelectItem>
                <SelectItem value="subordinate">Subordinate</SelectItem>
                <SelectItem value="360">360 Feedback</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="strengths">Strengths</SelectItem>
                <SelectItem value="areas_for_improvement">Areas for Improvement</SelectItem>
                <SelectItem value="achievements">Achievements</SelectItem>
                <SelectItem value="goals">Goals</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={fetchFeedbacks}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredFeedbacks.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-muted-foreground">No feedback found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchTerm ? 'Try adjusting your search or give new feedback.' : 'Performance feedback will appear here.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFeedbacks.map((feedback) => (
                  <TableRow key={feedback.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{feedback.employee.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {feedback.employee.employeeId}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getTypeBadge(feedback.feedbackType)}
                    </TableCell>
                    <TableCell>
                      {getCategoryBadge(feedback.feedbackCategory)}
                    </TableCell>
                    <TableCell>
                      {renderRating(feedback.rating)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {feedback.isAnonymous ? (
                          <span className="text-muted-foreground">Anonymous</span>
                        ) : (
                          <div>
                            <div className="font-medium">{feedback.providerName || 'Unknown'}</div>
                            {feedback.providerRole && (
                              <div className="text-muted-foreground">{feedback.providerRole}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(feedback.createdAt), 'MMM dd, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
