'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  BarChart, 
  PieChart, 
  LineChart, 
  RefreshCw, 
  FileBarChart2,
  DatabaseIcon,
  ArrowRight
} from 'lucide-react';

interface EmptyAnalyticsProps {
  onRefresh?: () => void;
}

export function EmptyAnalytics({ onRefresh }: EmptyAnalyticsProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-8">
      <div className="flex items-center justify-center mb-8 relative">
        <BarChart className="h-16 w-16 text-muted-foreground absolute -left-8 -top-4 opacity-50" />
        <PieChart className="h-20 w-20 text-primary" />
        <LineChart className="h-16 w-16 text-muted-foreground absolute -right-8 -top-4 opacity-50" />
      </div>
      
      <h2 className="text-2xl font-bold text-center mb-4">No Analytics Data Available</h2>
      <p className="text-center text-muted-foreground max-w-md mb-8">
        Start adding data to your ERP system to generate valuable analytics and insights. 
        Add transactions, inventory, projects, and more to see them reflected here.
      </p>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 w-full max-w-4xl mb-8">
        <Card className="bg-background/50">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <DatabaseIcon className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-lg font-medium mb-2">Add Data First</h3>
              <p className="text-sm text-muted-foreground">
                Create transactions, add inventory items, and set up projects to start
                generating analytics.
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-background/50">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <FileBarChart2 className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-lg font-medium mb-2">View Insights</h3>
              <p className="text-sm text-muted-foreground">
                Analytics will automatically generate charts and insights based on your
                business data.
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-background/50 lg:col-span-1 md:col-span-2">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="relative h-10 w-10">
                  <RefreshCw className="h-10 w-10 text-primary absolute inset-0" />
                </div>
              </div>
              <h3 className="text-lg font-medium mb-2">Real-time Updates</h3>
              <p className="text-sm text-muted-foreground">
                Analytics will update in real-time as new data is added to your ERP system.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <Button onClick={onRefresh} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Data
        </Button>
        <Button asChild>
          <a href="/dashboard">
            Go to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
} 