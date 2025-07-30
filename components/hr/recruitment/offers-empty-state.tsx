'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, Send, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface OffersEmptyStateProps {
  onCreateOffer?: () => void;
}

export function OffersEmptyState({ onCreateOffer }: OffersEmptyStateProps) {
  return (
    <div className="flex flex-col space-y-8 py-8">
      <div className="flex h-[300px] shrink-0 items-center justify-center rounded-md border border-dashed bg-muted/20">
        <div className="mx-auto flex max-w-[500px] flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-4">
            <FileText className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-2xl font-semibold">No Offers Created</h3>
          <p className="mt-3 text-muted-foreground max-w-[380px] mb-6">
            Start extending offers to qualified candidates. Create, send, and track job offers with salary details and terms.
          </p>
          <div className="flex gap-2">
            {onCreateOffer && (
              <Button size="lg" onClick={onCreateOffer}>
                <Send className="mr-2 h-5 w-5" />
                Create Offer
              </Button>
            )}
            <Link href="/hr/recruitment/candidates">
              <Button variant="outline" size="lg">
                <CheckCircle className="mr-2 h-5 w-5" />
                View Candidates
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <FileText className="h-4 w-4 mr-2 text-primary" />
              Offer Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Create professional offer letters with salary, benefits, and terms. Track offer status and responses.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-primary" />
              Salary Negotiation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Manage salary negotiations, counteroffers, and approval workflows for different compensation levels.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-primary" />
              Offer Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Track offer acceptance rates, time-to-acceptance, and compensation benchmarks.
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mx-auto mb-3">
            <Clock className="h-6 w-6 text-blue-600" />
          </div>
          <h4 className="font-medium text-sm mb-1">Pending</h4>
          <p className="text-xs text-muted-foreground">Offers awaiting response</p>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mx-auto mb-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h4 className="font-medium text-sm mb-1">Accepted</h4>
          <p className="text-xs text-muted-foreground">Successful offers</p>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-3">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <h4 className="font-medium text-sm mb-1">Declined</h4>
          <p className="text-xs text-muted-foreground">Rejected offers</p>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 mx-auto mb-3">
            <AlertCircle className="h-6 w-6 text-orange-600" />
          </div>
          <h4 className="font-medium text-sm mb-1">Expired</h4>
          <p className="text-xs text-muted-foreground">Time-expired offers</p>
        </Card>
      </div>
      
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-6 flex flex-col justify-center">
            <h3 className="text-xl font-semibold mb-2">Ready to Extend Your First Offer?</h3>
            <p className="text-muted-foreground mb-4">
              Create professional offer letters with competitive compensation packages. Our system helps you manage the entire offer process from creation to acceptance.
            </p>
            <div className="flex gap-2">
              <Button className="gap-1">
                <Send className="h-4 w-4" />
                Create Offer
              </Button>
              <Button variant="outline" className="gap-1">
                <DollarSign className="h-4 w-4" />
                Salary Guide
              </Button>
            </div>
          </div>
          <div className="flex-1 bg-muted p-6 flex items-center justify-center">
            <div className="w-full max-w-sm">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">Job Offer</div>
                    <div className="text-xs text-muted-foreground">Software Engineer</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Base Salary</span>
                    <span className="font-medium">$85,000</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Benefits</span>
                    <span className="font-medium">$12,000</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Bonus</span>
                    <span className="font-medium">$8,000</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Total Package</span>
                      <span>$105,000</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
