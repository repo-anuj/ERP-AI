'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Edit, DollarSign, Calendar, FileText, User, 
  CheckCircle, XCircle, Clock, AlertTriangle, Download, Send
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInDays } from 'date-fns';

interface Offer {
  id: string;
  status: string;
  salary: number;
  currency: string;
  startDate: string;
  expiryDate: string;
  benefits: string[];
  terms: string;
  notes?: string;
  sentAt?: string;
  respondedAt?: string;
  withdrawnAt?: string;
  candidate: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  jobPosting: {
    id: string;
    title: string;
    department?: { name: string };
    location?: { name: string; city: string; state: string };
  };
  createdAt: string;
  updatedAt: string;
}

export default function OfferDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [offer, setOffer] = useState<Offer | null>(null);

  useEffect(() => {
    fetchOffer();
  }, [params.id]);

  const fetchOffer = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/hr/recruitment/offers/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch offer');
      
      const data = await response.json();
      setOffer(data.offer);
    } catch (error) {
      console.error('Error fetching offer:', error);
      toast({
        title: 'Error',
        description: 'Failed to load offer details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, expiryDate?: string) => {
    const now = new Date();
    const expiry = expiryDate ? new Date(expiryDate) : null;
    const isExpired = expiry && now > expiry;
    
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: FileText },
      sent: { 
        color: isExpired ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800', 
        icon: isExpired ? AlertTriangle : Clock 
      },
      accepted: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      declined: { color: 'bg-red-100 text-red-800', icon: XCircle },
      withdrawn: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
      expired: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
    };

    const finalStatus = isExpired && status === 'sent' ? 'expired' : status;
    const config = statusConfig[finalStatus as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;
    
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {finalStatus.toUpperCase()}
      </Badge>
    );
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const days = differenceInDays(expiry, now);
    
    if (days < 0) return 'Expired';
    if (days === 0) return 'Expires today';
    if (days === 1) return 'Expires tomorrow';
    return `${days} days remaining`;
  };

  const handleAction = async (action: string) => {
    try {
      const response = await fetch(`/api/hr/recruitment/offers/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${action} offer`);
      }

      toast({
        title: 'Success',
        description: `Offer ${action} successfully`,
      });

      fetchOffer();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading offer details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Offer Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested offer could not be found.</p>
          <Button onClick={() => router.push('/hr/recruitment/offers')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Offers
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
          onClick={() => router.push('/hr/recruitment/offers')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Offers
        </Button>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Job Offer</h1>
            <p className="text-muted-foreground">
              {offer.candidate.firstName} {offer.candidate.lastName} • {offer.jobPosting.title}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/hr/recruitment/offers/${offer.id}/edit`)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Offer
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Offer Details
                </span>
                {getStatusBadge(offer.status, offer.expiryDate)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Salary</h4>
                  <p className="text-2xl font-bold text-green-600">
                    {offer.currency} {offer.salary.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">per year</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Start Date</h4>
                  <div className="flex items-center mt-1">
                    <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span>{format(new Date(offer.startDate), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Expiry</h4>
                <div className="flex items-center justify-between">
                  <span>{format(new Date(offer.expiryDate), 'MMM dd, yyyy')}</span>
                  <Badge variant={offer.status === 'sent' ? 'destructive' : 'secondary'}>
                    {getDaysUntilExpiry(offer.expiryDate)}
                  </Badge>
                </div>
              </div>

              {offer.benefits && offer.benefits.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Benefits</h4>
                  <div className="flex flex-wrap gap-2">
                    {offer.benefits.map((benefit, index) => (
                      <Badge key={index} variant="outline">
                        {benefit}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="terms" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>
            
            <TabsContent value="terms" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Terms & Conditions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {offer.terms ? (
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap bg-muted p-4 rounded-md">
                        {offer.terms}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No terms specified</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="timeline" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Offer Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">Offer Created</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(offer.createdAt), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                    
                    {offer.sentAt && (
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm font-medium">Offer Sent</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(offer.sentAt), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {offer.respondedAt && (
                      <div className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          offer.status === 'accepted' ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <div>
                          <p className="text-sm font-medium">
                            Offer {offer.status === 'accepted' ? 'Accepted' : 'Declined'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(offer.respondedAt), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {offer.withdrawnAt && (
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-gray-500 rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm font-medium">Offer Withdrawn</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(offer.withdrawnAt), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
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
                <Avatar className="w-8 h-8 mr-2">
                  <AvatarImage src="" />
                  <AvatarFallback>
                    {offer.candidate.firstName[0]}{offer.candidate.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                Candidate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="font-medium">
                    {offer.candidate.firstName} {offer.candidate.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{offer.candidate.email}</p>
                  {offer.candidate.phone && (
                    <p className="text-sm text-muted-foreground">{offer.candidate.phone}</p>
                  )}
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  View Candidate Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Job Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Job Position
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="font-medium">{offer.jobPosting.title}</p>
                  {offer.jobPosting.department && (
                    <p className="text-sm text-muted-foreground">{offer.jobPosting.department.name}</p>
                  )}
                  {offer.jobPosting.location && (
                    <p className="text-sm text-muted-foreground">
                      {offer.jobPosting.location.city}, {offer.jobPosting.location.state}
                    </p>
                  )}
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  View Job Posting
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {offer.status === 'draft' && (
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleAction('send')}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Offer
                </Button>
              )}
              
              <Button variant="outline" size="sm" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              
              <Button variant="outline" size="sm" className="w-full">
                Duplicate Offer
              </Button>
              
              {offer.status === 'sent' && (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleAction('withdraw')}
                >
                  Withdraw Offer
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {offer.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{offer.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
