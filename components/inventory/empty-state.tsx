import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3, Package, Plus, RefreshCcw, Truck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export function EmptyState({ onAddClick }: { onAddClick: () => void }) {
  return (
    <div className="flex flex-col space-y-8 py-8">
      <div className="flex h-[300px] shrink-0 items-center justify-center rounded-md border border-dashed bg-muted/20">
        <div className="mx-auto flex max-w-[500px] flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Package className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-2xl font-semibold">Your Inventory Is Empty</h3>
          <p className="mt-3 text-muted-foreground max-w-[380px] mb-6">
            Start tracking your products, monitoring stock levels, and streamlining your inventory management.
          </p>
          <DialogTrigger asChild>
            <Button size="lg" onClick={onAddClick}>
              <Plus className="mr-2 h-5 w-5" />
              Add Your First Product
            </Button>
          </DialogTrigger>
        </div>
      </div>
      
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <Package className="h-4 w-4 mr-2 text-primary" />
              Track Inventory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Keep track of all your products in one place. Monitor stock levels, prices, and product details.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <RefreshCcw className="h-4 w-4 mr-2 text-primary" />
              Automate Reordering
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Set up low stock alerts and automate your reordering process to prevent stockouts.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <BarChart3 className="h-4 w-4 mr-2 text-primary" />
              Analyze Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Generate reports and analyze inventory performance to make data-driven decisions.
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-6 flex flex-col justify-center">
            <h3 className="text-xl font-semibold mb-2">Need to import existing inventory?</h3>
            <p className="text-muted-foreground mb-4">
              You can easily import your existing inventory data from a CSV file or connect with your existing systems.
            </p>
            <div>
              <Button variant="outline" className="gap-1">
                Learn More
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 bg-muted p-6 flex items-center justify-center">
            <div className="w-full max-w-sm">
              <div className="space-y-2 mb-4">
                <div className="h-2 w-full rounded-full bg-primary/20"></div>
                <div className="h-2 w-5/6 rounded-full bg-primary/20"></div>
                <div className="h-2 w-4/6 rounded-full bg-primary/20"></div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="h-16 rounded-md bg-primary/10 flex items-center justify-center">
                  <Package className="h-6 w-6 text-primary/60" />
                </div>
                <div className="h-16 rounded-md bg-primary/10 flex items-center justify-center">
                  <Truck className="h-6 w-6 text-primary/60" />
                </div>
                <div className="h-16 rounded-md bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-primary/60" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
