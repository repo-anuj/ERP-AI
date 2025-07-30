'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Plus, Search, Filter, Eye, Edit, DollarSign, Calendar, Clock, 
  CheckCircle, XCircle, AlertCircle, TrendingUp, FileText, Send,
  User, Building, MapPin, Briefcase
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { format, isAfter, isBefore, addDays } from 'date-fns';

interface Offer {
  id: string;
  position: string;
  department?: string;
  location?: string;
  startDate?: string;
  baseSalary: number;
  currency: string;
  salaryFrequency: string;
  bonus?: number;
  equity?: string;
  benefits: string[];
  employmentType?: string;
  probationPeriod?: number;
  noticePeriod?: number;
  status: string;
  sentAt?: string;
  responseDeadline?: string;
  respondedAt?: string;
  negotiationRounds: number;
  approvedBy?: string;
  approvedAt?: string;
  offerLetterUrl?: string;
  contractUrl?: string;
  candidateResponse?: string;
  createdAt: string;
  candidate: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    currentCompany?: string;
    currentPosition?: string;
    expectedSalary?: number;
  };
  jobPosting?: {
    id: string;
    title: string;
    department?: {
      id: string;
      name: string;
    };
    location?: {
      id: string;
      name: string;
      city: string;
    };
  };
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  const fetchOffers = async () => {
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

      const response = await fetch(`/api/hr/recruitment/offers?${params}`);
      if (!response.ok) throw new Error('Failed to fetch offers');

      const data = await response.json();
      setOffers(data.offers);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching offers:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch offers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [currentPage, searchTerm, statusFilter]);

  const getStatusBadge = (status: string, responseDeadline?: string) => {
    const now = new Date();
    const deadline = responseDeadline ? new Date(responseDeadline) : null;
    
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: FileText, label: 'Draft' },
      pending_approval: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending Approval' },
      approved: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Approved' },
      sent: { 
        color: deadline && isAfter(now, deadline) 
          ? 'bg-orange-100 text-orange-800' 
          : 'bg-green-100 text-green-800', 
        icon: Send, 
        label: deadline && isAfter(now, deadline) ? 'Overdue' : 'Sent' 
      },
      accepted: { color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle, label: 'Accepted' },
      declined: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Declined' },
      negotiating: { color: 'bg-purple-100 text-purple-800', icon: TrendingUp, label: 'Negotiating' },
      expired: { color: 'bg-gray-100 text-gray-800', icon: Clock, label: 'Expired' },
      withdrawn: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Withdrawn' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const IconComponent = config.icon;
    
    return (
      <Badge className={config.color}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const formatSalary = (amount: number, currency: string, frequency: string) => {
    const formattedAmount = amount.toLocaleString();
    const frequencyLabel = frequency === 'monthly' ? '/month' : frequency === 'annually' ? '/year' : '';
    return `${currency} ${formattedAmount}${frequencyLabel}`;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getUrgencyIndicator = (offer: Offer) => {
    if (!offer.responseDeadline || offer.status !== 'sent') return null;
    
    const now = new Date();
    const deadline = new Date(offer.responseDeadline);
    const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDeadline < 0) {
      return <Badge variant="destructive" className="text-xs">Overdue</Badge>;
    } else if (daysUntilDeadline <= 2) {
      return <Badge className="bg-orange-100 text-orange-800 text-xs">Due in {daysUntilDeadline} days</Badge>;
    } else if (daysUntilDeadline <= 7) {
      return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Due in {daysUntilDeadline} days</Badge>;
    }
    
    return null;
  };

  const handleQuickAction = async (offerId: string, action: string) => {
    try {
      let endpoint = '';
      let method = 'PUT';
      let body = {};

      switch (action) {
        case 'approve':
          endpoint = `/api/hr/recruitment/offers/${offerId}/approve`;
          method = 'POST';
          body = { sendImmediately: true };
          break;
        case 'send':
          endpoint = `/api/hr/recruitment/offers/${offerId}`;
          body = { status: 'sent' };
          break;
        case 'withdraw':
          endpoint = `/api/hr/recruitment/offers/${offerId}`;
          body = { status: 'withdrawn' };
          break;
      }

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error(`Failed to ${action} offer`);

      toast({
        title: 'Success',
        description: `Offer ${action}ed successfully`,
      });

      fetchOffers();
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
          <h1 className="text-3xl font-bold">Job Offers</h1>
          <p className="text-gray-600">Manage job offers and track candidate responses</p>
        </div>
        <Link href="/hr/recruitment/offers/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Offer
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search offers..."
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
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
                <SelectItem value="negotiating">Negotiating</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="withdrawn">Withdrawn</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
              }}
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Offers Grid */}
      {loading ? (
        <div className="text-center py-8">Loading offers...</div>
      ) : offers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No offers found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <Card key={offer.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {getInitials(offer.candidate.firstName, offer.candidate.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">
                        {offer.candidate.firstName} {offer.candidate.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{offer.position}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getUrgencyIndicator(offer)}
                    <Link href={`/hr/recruitment/offers/${offer.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    {getStatusBadge(offer.status, offer.responseDeadline)}
                    {offer.negotiationRounds > 0 && (
                      <Badge variant="outline" className="text-xs">
                        Round {offer.negotiationRounds}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="w-4 h-4 mr-2" />
                    {formatSalary(offer.baseSalary, offer.currency, offer.salaryFrequency)}
                    {offer.bonus && ` + ${offer.currency} ${offer.bonus.toLocaleString()} bonus`}
                  </div>

                  {offer.jobPosting && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Briefcase className="w-4 h-4 mr-2" />
                      {offer.jobPosting.title}
                    </div>
                  )}

                  {offer.department && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Building className="w-4 h-4 mr-2" />
                      {offer.department}
                    </div>
                  )}

                  {offer.location && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      {offer.location}
                    </div>
                  )}

                  {offer.startDate && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      Start: {format(new Date(offer.startDate), 'MMM dd, yyyy')}
                    </div>
                  )}

                  {offer.responseDeadline && offer.status === 'sent' && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      Response due: {format(new Date(offer.responseDeadline), 'MMM dd, yyyy')}
                    </div>
                  )}
                </div>

                {offer.benefits.length > 0 && (
                  <div className="mb-4">
                    <h5 className="text-sm font-medium mb-2">Benefits:</h5>
                    <div className="flex flex-wrap gap-1">
                      {offer.benefits.slice(0, 3).map((benefit, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {benefit}
                        </Badge>
                      ))}
                      {offer.benefits.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{offer.benefits.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="border-t pt-4">
                  <div className="flex gap-2">
                    {offer.status === 'pending_approval' && (
                      <Button
                        size="sm"
                        onClick={() => handleQuickAction(offer.id, 'approve')}
                        className="flex-1"
                      >
                        Approve & Send
                      </Button>
                    )}
                    
                    {offer.status === 'approved' && (
                      <Button
                        size="sm"
                        onClick={() => handleQuickAction(offer.id, 'send')}
                        className="flex-1"
                      >
                        Send Offer
                      </Button>
                    )}
                    
                    {(offer.status === 'sent' || offer.status === 'negotiating') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickAction(offer.id, 'withdraw')}
                        className="flex-1"
                      >
                        Withdraw
                      </Button>
                    )}

                    <Link href={`/hr/recruitment/offers/${offer.id}/edit`} className="flex-1">
                      <Button size="sm" variant="outline" className="w-full">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="mt-4 text-xs text-gray-500">
                  Created {format(new Date(offer.createdAt), 'MMM dd, yyyy')}
                  {offer.sentAt && (
                    <span> • Sent {format(new Date(offer.sentAt), 'MMM dd, yyyy')}</span>
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
