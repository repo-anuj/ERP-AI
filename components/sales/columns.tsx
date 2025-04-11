"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { formatDate, formatCurrency } from "@/lib/utils"
import { 
  MoreHorizontal, 
  ArrowUpDown, 
  Eye, 
  Edit, 
  FileText, 
  Trash2, 
  Copy, 
  Download,
  ShoppingCart,
  User,
  Receipt
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"

// Define the Sale type based on our Prisma schema
export type Sale = {
  id: string
  invoiceNumber?: string | null
  customerId: string
  customer: {
    id: string
    name: string
    email?: string | null
    phone?: string | null
    address?: string | null
  }
  employeeId?: string | null
  employee?: {
    id: string
    firstName: string
    lastName: string
  } | null
  date: Date
  status: string
  total: number
  tax?: number | null
  notes?: string | null
  items: {
    id: string
    product: string
    productId: string
    description?: string
    quantity: number
    unitPrice: number
    total: number
  }[]
  companyId: string
  createdAt: Date
  updatedAt: Date
}

// Component for viewing sale details
const SaleDetailsDialog = ({ sale, isOpen, onClose }: { 
  sale: Sale; 
  isOpen: boolean; 
  onClose: () => void 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center">
            <ShoppingCart className="mr-2 h-5 w-5 text-primary" />
            Sale Details
          </DialogTitle>
          <DialogDescription>
            Invoice #{sale.invoiceNumber || `INV-${sale.id.substring(0, 8)}`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Date</p>
            <p>{formatDate(sale.date)}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <p>
              <Badge
                variant={
                  sale.status === "completed" ? "default" : 
                  sale.status === "pending" ? "outline" : 
                  "destructive"
                }
              >
                {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
              </Badge>
            </p>
          </div>
          
          <div className="col-span-2 border rounded-md p-4 space-y-3">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2 text-muted-foreground" />
              <h3 className="font-medium">Customer Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Name</p>
                <p className="font-medium">{sale.customer.name}</p>
              </div>
              {sale.customer.email && (
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p>{sale.customer.email}</p>
                </div>
              )}
              {sale.customer.phone && (
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p>{sale.customer.phone}</p>
                </div>
              )}
              {sale.customer.address && (
                <div>
                  <p className="text-muted-foreground">Address</p>
                  <p>{sale.customer.address}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="col-span-2 border rounded-md p-4 space-y-3">
            <div className="flex items-center">
              <ShoppingCart className="h-4 w-4 mr-2 text-muted-foreground" />
              <h3 className="font-medium">Items</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Product</th>
                    <th className="text-center py-2 font-medium">Quantity</th>
                    <th className="text-right py-2 font-medium">Unit Price</th>
                    <th className="text-right py-2 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">
                        <div>
                          <p className="font-medium">{item.product}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-2 text-center">{item.quantity}</td>
                      <td className="py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-2 text-right">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  {sale.tax && (
                    <tr>
                      <td colSpan={3} className="text-right py-2 font-medium">Subtotal</td>
                      <td className="text-right py-2">{formatCurrency(sale.total - sale.tax)}</td>
                    </tr>
                  )}
                  {sale.tax && (
                    <tr>
                      <td colSpan={3} className="text-right py-2 font-medium">Tax</td>
                      <td className="text-right py-2">{formatCurrency(sale.tax)}</td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={3} className="text-right py-2 font-medium">Total</td>
                    <td className="text-right py-2 font-bold">{formatCurrency(sale.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          
          {sale.notes && (
            <div className="col-span-2 space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Notes</p>
              <p className="text-sm">{sale.notes}</p>
            </div>
          )}
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Created</p>
            <p className="text-sm">{formatDate(sale.createdAt)}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
            <p className="text-sm">{formatDate(sale.updatedAt)}</p>
          </div>
        </div>
        
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => {
              // Generate and download invoice
              window.open(`/api/sales/invoice/${sale.id}`, '_blank');
            }}
          >
            <FileText className="mr-2 h-4 w-4" />
            Generate Invoice
          </Button>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Component for editing a sale
const EditSaleDialog = ({ 
  sale, 
  isOpen, 
  onClose, 
  onUpdate 
}: { 
  sale: Sale; 
  isOpen: boolean; 
  onClose: () => void;
  onUpdate: (updatedSale: Sale) => void;
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: sale.id,
    status: sale.status,
    notes: sale.notes || '',
    invoiceNumber: sale.invoiceNumber || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/sales', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update sale');
      }

      const updatedSale = await response.json();
      
      toast({
        title: 'Success',
        description: 'Sale updated successfully',
      });
      
      onUpdate(updatedSale);
      onClose();
      
    } catch (error) {
      console.error('Error updating sale:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update sale. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Sale</DialogTitle>
          <DialogDescription>
            Update sale information for Invoice #{sale.invoiceNumber || `INV-${sale.id.substring(0, 8)}`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-invoice-number">Invoice Number</Label>
            <Input
              id="edit-invoice-number"
              value={formData.invoiceNumber}
              onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
              placeholder="Invoice number (optional)"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger id="edit-status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this sale (optional)"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Sale'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Component for generating and viewing invoice
const InvoiceDialog = ({ 
  sale, 
  isOpen, 
  onClose 
}: { 
  sale: Sale; 
  isOpen: boolean; 
  onClose: () => void;
}) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);

  const generateInvoice = async () => {
    setIsGenerating(true);
    try {
      // In a real app, this would call an API to generate a PDF invoice
      // For now, we'll simulate it with a timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Set the URL to the invoice (in a real app, this would be a PDF URL)
      setInvoiceUrl(`/api/sales/invoice/${sale.id}`);
      
      toast({
        title: 'Invoice Generated',
        description: 'Your invoice has been generated successfully.',
      });
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate invoice. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadInvoice = () => {
    if (invoiceUrl) {
      // In a real app, this would download the PDF
      window.open(invoiceUrl, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Invoice</DialogTitle>
          <DialogDescription>
            Generate and download invoice for sale #{sale.invoiceNumber || `INV-${sale.id.substring(0, 8)}`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="border rounded-md p-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-lg">INVOICE</h3>
                <p className="text-sm text-muted-foreground">
                  #{sale.invoiceNumber || `INV-${sale.id.substring(0, 8)}`}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">Date</p>
                <p className="text-sm">{formatDate(sale.date)}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="font-medium mb-1">From</p>
                <p>Your Company Name</p>
                <p className="text-sm text-muted-foreground">company@example.com</p>
                <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
              </div>
              <div>
                <p className="font-medium mb-1">To</p>
                <p>{sale.customer.name}</p>
                {sale.customer.email && (
                  <p className="text-sm text-muted-foreground">{sale.customer.email}</p>
                )}
                {sale.customer.phone && (
                  <p className="text-sm text-muted-foreground">{sale.customer.phone}</p>
                )}
                {sale.customer.address && (
                  <p className="text-sm text-muted-foreground">{sale.customer.address}</p>
                )}
              </div>
            </div>
            
            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Item</th>
                  <th className="text-center py-2 font-medium">Qty</th>
                  <th className="text-right py-2 font-medium">Price</th>
                  <th className="text-right py-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{item.product}</td>
                    <td className="py-2 text-center">{item.quantity}</td>
                    <td className="py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-2 text-right">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {sale.tax && (
                  <tr>
                    <td colSpan={3} className="text-right py-2 font-medium">Subtotal</td>
                    <td className="text-right py-2">{formatCurrency(sale.total - sale.tax)}</td>
                  </tr>
                )}
                {sale.tax && (
                  <tr>
                    <td colSpan={3} className="text-right py-2 font-medium">Tax</td>
                    <td className="text-right py-2">{formatCurrency(sale.tax)}</td>
                  </tr>
                )}
                <tr>
                  <td colSpan={3} className="text-right py-2 font-medium">Total</td>
                  <td className="text-right py-2 font-bold">{formatCurrency(sale.total)}</td>
                </tr>
              </tfoot>
            </table>
            
            {sale.notes && (
              <div className="border-t pt-2">
                <p className="font-medium">Notes</p>
                <p className="text-sm">{sale.notes}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-between">
          {!invoiceUrl ? (
            <Button 
              onClick={generateInvoice} 
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>Generating...</>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Invoice
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={downloadInvoice}
              variant="default"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Invoice
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Component for delete confirmation
const DeleteConfirmationDialog = ({ 
  sale, 
  isOpen, 
  onClose, 
  onDelete 
}: { 
  sale: Sale; 
  isOpen: boolean; 
  onClose: () => void;
  onDelete: () => void;
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the sale with invoice #{sale.invoiceNumber || `INV-${sale.id.substring(0, 8)}`}.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// Cell component for the invoice number with tooltip
const InvoiceNumberCell = ({ row }: { row: any }) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const sale = row.original;
  
  return (
    <>
      <div className="flex items-center gap-2">
        <Receipt className="h-4 w-4 text-muted-foreground" />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="link" 
                className="p-0 h-auto font-medium"
                onClick={() => setIsDetailsOpen(true)}
              >
                {sale.invoiceNumber || `INV-${sale.id.substring(0, 8)}`}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Click to view details</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <SaleDetailsDialog 
        sale={sale} 
        isOpen={isDetailsOpen} 
        onClose={() => setIsDetailsOpen(false)} 
      />
    </>
  );
};

export const columns: ColumnDef<Sale>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "invoiceNumber",
    header: "Invoice #",
    cell: InvoiceNumberCell,
  },
  {
    accessorKey: "customer.name",
    header: "Customer",
    cell: ({ row }) => <div>{row.original.customer.name}</div>,
  },
  {
    accessorKey: "date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div>{formatDate(row.original.date)}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      
      return (
        <Badge 
          variant={
            status === "completed" ? "default" : 
            status === "pending" ? "outline" : 
            "destructive"
          }
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      )
    },
  },
  {
    accessorKey: "total",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Total
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div>{formatCurrency(row.getValue("total"))}</div>,
  },
  {
    accessorKey: "updatedAt",
    header: "Last Updated",
    cell: ({ row }) => <div>{formatDate(row.original.updatedAt)}</div>,
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => <div>{formatDate(row.original.createdAt)}</div>,
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const router = useRouter();
      const { toast } = useToast();
      const [isDetailsOpen, setIsDetailsOpen] = useState(false);
      const [isEditOpen, setIsEditOpen] = useState(false);
      const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
      const [isDeleteOpen, setIsDeleteOpen] = useState(false);
      const sale = row.original;
      
      const copyToClipboard = () => {
        const text = `Invoice #${sale.invoiceNumber || `INV-${sale.id.substring(0, 8)}`} - ${sale.customer.name} - ${formatCurrency(sale.total)}`;
        navigator.clipboard.writeText(text);
        toast({
          title: "Copied to clipboard",
          description: "Sale information has been copied to clipboard",
          duration: 2000,
        });
      };
      
      const handleUpdate = (updatedSale: Sale) => {
        // Update the data in the table
        const data = table.options.data as Sale[];
        const updatedData = data.map(d => d.id === updatedSale.id ? updatedSale : d);
        
        // @ts-ignore - We know this exists but TypeScript doesn't
        table.options.meta?.updateData(updatedData);
      };
      
      const handleDelete = async () => {
        try {
          const response = await fetch(`/api/sales?id=${sale.id}`, {
            method: 'DELETE',
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete sale');
          }
          
          toast({
            title: 'Success',
            description: 'Sale deleted successfully',
          });
          
          // Remove the item from the table
          const data = table.options.data as Sale[];
          const updatedData = data.filter(d => d.id !== sale.id);
          
          // @ts-ignore - We know this exists but TypeScript doesn't
          table.options.meta?.updateData(updatedData);
          
        } catch (error) {
          console.error('Error deleting sale:', error);
          toast({
            title: 'Error',
            description: error instanceof Error ? error.message : 'Failed to delete sale. Please try again.',
            variant: 'destructive',
          });
        }
        
        setIsDeleteOpen(false);
      };
      
      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setIsDetailsOpen(true)}>
                <Eye className="mr-2 h-4 w-4" />
                View details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit sale
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsInvoiceOpen(true)}>
                <FileText className="mr-2 h-4 w-4" />
                Generate invoice
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyToClipboard}>
                <Copy className="mr-2 h-4 w-4" />
                Copy info
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => setIsDeleteOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete sale
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* View Details Dialog */}
          <SaleDetailsDialog 
            sale={sale} 
            isOpen={isDetailsOpen} 
            onClose={() => setIsDetailsOpen(false)} 
          />
          
          {/* Edit Sale Dialog */}
          {isEditOpen && (
            <EditSaleDialog
              sale={sale}
              isOpen={isEditOpen}
              onClose={() => setIsEditOpen(false)}
              onUpdate={handleUpdate}
            />
          )}
          
          {/* Invoice Dialog */}
          <InvoiceDialog
            sale={sale}
            isOpen={isInvoiceOpen}
            onClose={() => setIsInvoiceOpen(false)}
          />
          
          {/* Delete Confirmation Dialog */}
          <DeleteConfirmationDialog
            sale={sale}
            isOpen={isDeleteOpen}
            onClose={() => setIsDeleteOpen(false)}
            onDelete={handleDelete}
          />
        </>
      );
    },
  },
]
