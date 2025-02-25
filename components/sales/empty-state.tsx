import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex h-[450px] shrink-0 items-center justify-center rounded-md border border-dashed">
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
        <svg
          className="h-32 w-32 text-muted-foreground/30"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        >
          <path d="M3 3h18v18H3V3z" />
          <path d="M16 8h.01" />
          <path d="M16 12h.01" />
          <path d="M16 16h.01" />
          <path d="M8 8h.01" />
          <path d="M8 12h.01" />
          <path d="M8 16h.01" />
          <path d="M12 8h.01" />
          <path d="M12 12h.01" />
          <path d="M12 16h.01" />
        </svg>
        <h3 className="mt-6 text-xl font-semibold">Start Managing Your Sales</h3>
        <p className="mb-6 mt-3 text-sm text-muted-foreground max-w-[280px]">
          Begin tracking your sales, monitoring revenue, and managing customer transactions all in one place.
        </p>
        <Button size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Add Your First Sale
        </Button>
      </div>
    </div>
  );
}