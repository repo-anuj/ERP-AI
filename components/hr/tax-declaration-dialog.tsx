'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

interface TaxDeclarationDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultFinancialYear?: string;
}

export function TaxDeclarationDialog({
  open,
  onClose,
  onSuccess,
  defaultFinancialYear = '2024-25',
}: TaxDeclarationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Tax Declaration
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-6 text-center">
          <p className="text-muted-foreground">Tax Declaration feature coming soon...</p>
          <p className="text-sm text-muted-foreground mt-2">
            This will allow employees to submit their tax declarations for {defaultFinancialYear}
          </p>
        </div>

        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
