'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, FileText as FileCheck, Clock, CheckCircle, AlertTriangle, XCircle, Search, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface BackgroundChecksEmptyStateProps {
  onInitiateCheck?: () => void;
}

export function BackgroundChecksEmptyState({ onInitiateCheck }: BackgroundChecksEmptyStateProps) {
  return (
    <div className="flex flex-col space-y-8 py-8">
      <div className="flex h-[300px] shrink-0 items-center justify-center rounded-md border border-dashed bg-muted/20">
        <div className="mx-auto flex max-w-[500px] flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Shield className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-2xl font-semibold">No Background Checks</h3>
          <p className="mt-3 text-muted-foreground max-w-[380px] mb-6">
            Ensure secure hiring with comprehensive background verification. Initiate and track background checks for your candidates.
          </p>
          <div className="flex gap-2">
            {onInitiateCheck && (
              <Button size="lg" onClick={onInitiateCheck}>
                <Shield className="mr-2 h-5 w-5" />
                Initiate Check
              </Button>
            )}
            <Link href="/hr/recruitment/offers">
              <Button variant="outline" size="lg">
                <FileCheck className="mr-2 h-5 w-5" />
                View Offers
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <Shield className="h-4 w-4 mr-2 text-primary" />
              Comprehensive Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Conduct thorough background checks including criminal records, employment history, and education verification.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <Search className="h-4 w-4 mr-2 text-primary" />
              Multi-Source Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Integrate with multiple verification providers for comprehensive and accurate background screening.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-primary" />
              Compliance Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Ensure compliance with local regulations and maintain audit trails for all background verification processes.
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mx-auto mb-3">
            <Clock className="h-6 w-6 text-blue-600" />
          </div>
          <h4 className="font-medium text-sm mb-1">In Progress</h4>
          <p className="text-xs text-muted-foreground">Checks being processed</p>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mx-auto mb-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h4 className="font-medium text-sm mb-1">Clear</h4>
          <p className="text-xs text-muted-foreground">Successful verifications</p>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 mx-auto mb-3">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
          </div>
          <h4 className="font-medium text-sm mb-1">Review Required</h4>
          <p className="text-xs text-muted-foreground">Manual review needed</p>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-3">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <h4 className="font-medium text-sm mb-1">Failed</h4>
          <p className="text-xs text-muted-foreground">Verification issues found</p>
        </Card>
      </div>
      
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-6 flex flex-col justify-center">
            <h3 className="text-xl font-semibold mb-2">Secure Your Hiring Process</h3>
            <p className="text-muted-foreground mb-4">
              Protect your organization with thorough background verification. Our integrated system helps you conduct comprehensive checks while maintaining compliance with regulations.
            </p>
            <div className="flex gap-2">
              <Button className="gap-1">
                <Shield className="h-4 w-4" />
                Start Background Check
              </Button>
              <Button variant="outline" className="gap-1">
                <FileCheck className="h-4 w-4" />
                Verification Guide
              </Button>
            </div>
          </div>
          <div className="flex-1 bg-muted p-6 flex items-center justify-center">
            <div className="w-full max-w-sm">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium mb-1">Criminal Record Check</div>
                    <div className="text-xs text-muted-foreground">Verified - Clear</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium mb-1">Employment History</div>
                    <div className="text-xs text-muted-foreground">Verified - Clear</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium mb-1">Education Verification</div>
                    <div className="text-xs text-muted-foreground">In Progress</div>
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
