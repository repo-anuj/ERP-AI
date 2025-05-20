import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[80vh] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary mb-2">
            <FileQuestion className="h-5 w-5" />
            <CardTitle>Page Not Found</CardTitle>
          </div>
          <CardDescription>
            The page you are looking for doesn't exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-6">
            <div className="text-8xl font-bold text-muted-foreground">404</div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/">Go to Dashboard</Link>
          </Button>
          <Button asChild>
            <Link href="/settings">Go to Settings</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
