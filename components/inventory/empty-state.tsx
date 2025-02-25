import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function EmptyState({ onAddClick }: { onAddClick: () => void }) {
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
          <path d="M20 7.5L12 1.5L4 7.5V16.5L12 22.5L20 16.5V7.5Z" />
          <path d="M12 22.5V13.5" />
          <path d="M20 7.5L12 13.5L4 7.5" />
          <path d="M12 13.5L12 1.5" />
        </svg>
        <h3 className="mt-6 text-xl font-semibold">Start Managing Your Inventory</h3>
        <p className="mb-6 mt-3 text-sm text-muted-foreground max-w-[280px]">
          Begin tracking your products, monitoring stock levels, and streamlining your inventory management.
        </p>
        <DialogTrigger asChild>
          <Button size="lg" onClick={onAddClick}>
            <Plus className="mr-2 h-5 w-5" />
            Add Your First Item
          </Button>
        </DialogTrigger>
      </div>
    </div>
  );
}