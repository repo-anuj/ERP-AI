'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { Copy, Edit, MoreHorizontal, Trash, ShoppingCart, Receipt, Eye, FileText } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

// Define status badge styling
const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  completed: 'bg-green-100 text-green-800 hover:bg-green-100',
  failed: 'bg-red-100 text-red-800 hover:bg-red-100',
  paid: 'bg-green-100 text-green-800 hover:bg-green-100',
  unpaid: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  cancelled: 'bg-red-100 text-red-800 hover:bg-red-100',
  inprogress: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  returned: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
  default: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
};

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  categoryColor?: string;
  categoryIcon?: string;
  account: string;
  reference?: string;
  status: string;
  sourceType?: 'sales' | 'inventory';
  originalData?: any;
}

interface TransactionsTableProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onDuplicate: (transaction: Transaction) => void;
  onViewOriginal?: (transaction: Transaction) => void;
}

export function TransactionsTable({
  transactions,
  onEdit,
  onDelete,
  onDuplicate,
  onViewOriginal,
}: TransactionsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow
              key={transaction.id}
              className={transaction.sourceType
                ? transaction.sourceType === 'sales'
                  ? "bg-blue-50 hover:bg-blue-100"
                  : "bg-amber-50 hover:bg-amber-100"
                : undefined
              }
            >
              <TableCell>
                {transaction.date ? format(new Date(transaction.date), 'MMM dd, yyyy') : 'N/A'}
              </TableCell>
              <TableCell className="font-medium">
                <div className="flex items-center">
                  {transaction.sourceType === 'sales' && (
                    <Receipt className="h-4 w-4 mr-2 text-blue-500" />
                  )}
                  {transaction.sourceType === 'inventory' && (
                    <ShoppingCart className="h-4 w-4 mr-2 text-amber-500" />
                  )}
                  <span className="font-medium">{transaction.description}</span>
                </div>
                {transaction.reference && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Ref: {transaction.reference}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {transaction.categoryIcon ? (
                    <span className="text-lg">{transaction.categoryIcon}</span>
                  ) : transaction.categoryColor ? (
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: transaction.categoryColor }}
                    />
                  ) : null}
                  {transaction.category}
                </div>
              </TableCell>
              <TableCell>{transaction.account}</TableCell>
              <TableCell className={transaction.type === 'income' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                {transaction.type === 'income' ? '+' : '-'}
                {formatCurrency(transaction.amount)}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={statusStyles[transaction.status.toLowerCase()] || statusStyles.default}>
                  {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {!transaction.sourceType ? (
                      <>
                        <DropdownMenuItem onClick={() => onEdit(transaction)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDuplicate(transaction)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(transaction.id)}
                          className="text-red-600"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem
                          onClick={() => onViewOriginal && onViewOriginal(transaction)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Source
                        </DropdownMenuItem>
                        {transaction.sourceType === 'sales' && (
                          <DropdownMenuItem onClick={() => window.open(`/api/sales/invoice/${transaction.id.replace('sales-', '')}/pdf`, '_blank')}>
                            <FileText className="mr-2 h-4 w-4" />
                            Invoice
                          </DropdownMenuItem>
                        )}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}