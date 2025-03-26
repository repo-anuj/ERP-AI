'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  AlertCircle, 
  ArrowUpDown, 
  Copy, 
  Edit, 
  Eye, 
  MoreHorizontal, 
  Package, 
  Trash2, 
  TrendingUp 
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export type InventoryItem = {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  price: number;
  status: string;
  description?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
};

// Component for the product details dialog
const ProductDetailsDialog = ({ item, isOpen, onClose }: { 
  item: InventoryItem; 
  isOpen: boolean; 
  onClose: () => void 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{item.name}</DialogTitle>
          <DialogDescription>
            SKU: {item.sku}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Category</p>
            <p>{item.category}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Price</p>
            <p>{formatCurrency(item.price)}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Quantity</p>
            <p>{item.quantity}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <p>
              <Badge
                variant={
                  item.status === 'In Stock' 
                    ? 'default' 
                    : item.status === 'Low Stock' 
                    ? 'secondary' 
                    : 'destructive'
                }
              >
                {item.status}
              </Badge>
            </p>
          </div>
          
          <div className="space-y-1 col-span-2">
            <p className="text-sm font-medium text-muted-foreground">Description</p>
            <p className="text-sm">{item.description || 'No description available'}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Created</p>
            <p className="text-sm">{formatDate(item.createdAt)}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
            <p className="text-sm">{formatDate(item.updatedAt)}</p>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Component for the edit product dialog
const EditProductDialog = ({ 
  item, 
  isOpen, 
  onClose, 
  onUpdate 
}: { 
  item: InventoryItem; 
  isOpen: boolean; 
  onClose: () => void;
  onUpdate: (updatedItem: InventoryItem) => void;
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: item.id,
    name: item.name,
    sku: item.sku,
    category: item.category,
    quantity: item.quantity,
    price: item.price,
    status: item.status,
    description: item.description || ''
  });

  // Reset form data when item changes
  useEffect(() => {
    setFormData({
      id: item.id,
      name: item.name,
      sku: item.sku,
      category: item.category,
      quantity: item.quantity,
      price: item.price,
      status: item.status,
      description: item.description || ''
    });
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate form data
      if (formData.quantity < 0) {
        throw new Error('Quantity cannot be negative');
      }
      
      if (formData.price < 0) {
        throw new Error('Price cannot be negative');
      }
      
      const response = await fetch('/api/inventory', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update product');
      }

      const updatedItem = await response.json();
      
      toast({
        title: 'Success',
        description: 'Product updated successfully',
      });
      
      onUpdate(updatedItem);
      onClose();
      
    } catch (error) {
      console.error('Error updating inventory item:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update product. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Product Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sku">SKU</Label>
              <Input
                id="edit-sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Input
                id="edit-category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-quantity">Quantity</Label>
              <Input
                id="edit-quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-price">Price</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                required
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
                  <SelectItem value="In Stock">In Stock</SelectItem>
                  <SelectItem value="Low Stock">Low Stock</SelectItem>
                  <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Component for the delete confirmation dialog
const DeleteConfirmationDialog = ({ 
  item, 
  isOpen, 
  onClose, 
  onDelete 
}: { 
  item: InventoryItem; 
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
            This will permanently delete the product "{item.name}" (SKU: {item.sku}).
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

// Cell component for the name column with tooltip
const NameCell = ({ row }: { row: any }) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const item = row.original;
  
  return (
    <>
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4 text-muted-foreground" />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="link" 
                className="p-0 h-auto font-medium"
                onClick={() => setIsDetailsOpen(true)}
              >
                {item.name}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Click to view details</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <ProductDetailsDialog 
        item={item} 
        isOpen={isDetailsOpen} 
        onClose={() => setIsDetailsOpen(false)} 
      />
    </>
  );
};

export const columns: ColumnDef<InventoryItem>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 font-medium"
        >
          Product
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: NameCell,
  },
  {
    accessorKey: 'sku',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 font-medium"
        >
          SKU
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: 'category',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 font-medium"
        >
          Category
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'quantity',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 font-medium"
        >
          Quantity
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const quantity = parseInt(row.getValue('quantity'));
      const status = row.getValue('status') as string;
      
      return (
        <div className="flex items-center">
          <span className="mr-2">{quantity}</span>
          {quantity <= 5 && status !== 'Out of Stock' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-800 border-yellow-300">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Low
                    </Badge>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Low stock - consider reordering</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'price',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 font-medium"
        >
          Price
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const price = parseFloat(row.getValue('price'));
      return formatCurrency(price);
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 font-medium"
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      
      let variant: 'default' | 'destructive' | 'outline' | 'secondary' = 'default';
      let icon = null;
      
      switch (status) {
        case 'In Stock':
          variant = 'default';
          icon = <Package className="h-3 w-3 mr-1" />;
          break;
        case 'Low Stock':
          variant = 'secondary';
          icon = <AlertCircle className="h-3 w-3 mr-1" />;
          break;
        case 'Out of Stock':
          variant = 'destructive';
          icon = <AlertCircle className="h-3 w-3 mr-1" />;
          break;
        default:
          variant = 'outline';
      }
      
      return (
        <Badge variant={variant} className="flex items-center">
          {icon}
          {status}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'updatedAt',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 font-medium"
        >
          Last Updated
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue('updatedAt'));
      return formatDate(date);
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created At',
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'));
      return formatDate(date);
    },
  },
  {
    id: 'actions',
    cell: ({ row, table }) => {
      const { toast } = useToast();
      const [isDetailsOpen, setIsDetailsOpen] = useState(false);
      const [isEditOpen, setIsEditOpen] = useState(false);
      const [isDeleteOpen, setIsDeleteOpen] = useState(false);
      const item = row.original;
      
      const copyToClipboard = () => {
        const text = `${item.name} (${item.sku}) - ${formatCurrency(item.price)} - Qty: ${item.quantity}`;
        navigator.clipboard.writeText(text);
        toast({
          title: "Copied to clipboard",
          description: "Product information has been copied to clipboard",
          duration: 2000,
        });
      };
      
      const handleUpdate = (updatedItem: InventoryItem) => {
        // Update the data in the table
        const data = table.options.data as InventoryItem[];
        const updatedData = data.map(d => d.id === updatedItem.id ? updatedItem : d);
        
        // @ts-ignore - We know this exists but TypeScript doesn't
        table.options.meta?.updateData(updatedData);
      };
      
      const handleDelete = async () => {
        try {
          const response = await fetch(`/api/inventory?id=${item.id}`, {
            method: 'DELETE',
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete product');
          }
          
          toast({
            title: 'Success',
            description: 'Product deleted successfully',
          });
          
          // Remove the item from the table
          const data = table.options.data as InventoryItem[];
          const updatedData = data.filter(d => d.id !== item.id);
          
          // @ts-ignore - We know this exists but TypeScript doesn't
          table.options.meta?.updateData(updatedData);
          
        } catch (error) {
          console.error('Error deleting inventory item:', error);
          toast({
            title: 'Error',
            description: error instanceof Error ? error.message : 'Failed to delete product. Please try again.',
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
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyToClipboard}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Info
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={() => setIsDeleteOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* View Details Dialog */}
          <ProductDetailsDialog 
            item={item} 
            isOpen={isDetailsOpen} 
            onClose={() => setIsDetailsOpen(false)} 
          />
          
          {/* Edit Product Dialog */}
          {isEditOpen && (
            <EditProductDialog
              item={item}
              isOpen={isEditOpen}
              onClose={() => setIsEditOpen(false)}
              onUpdate={handleUpdate}
            />
          )}
          
          {/* Delete Confirmation Dialog */}
          <DeleteConfirmationDialog
            item={item}
            isOpen={isDeleteOpen}
            onClose={() => setIsDeleteOpen(false)}
            onDelete={handleDelete}
          />
        </>
      );
    },
    meta: {
      align: 'center',
    },
  },
];
