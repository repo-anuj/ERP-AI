import { ReactNode } from 'react';
import { Metadata } from 'next';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { DollarSign, BarChart3, CreditCard, ReceiptText, PiggyBank } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Finance Management | ERP-AI',
  description: 'Manage your company finances, track expenses, income, and generate reports',
};

interface FinanceLayoutProps {
  children: ReactNode;
}

export default function FinanceLayout({ children }: FinanceLayoutProps) {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <DollarSign className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Finance</h1>
      </div>
      
      <nav className="border-b">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full h-auto justify-start rounded-none border-b bg-transparent p-0">
            <Link href="/dashboard/finance" passHref legacyBehavior>
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none border-b-2 border-transparent px-4 py-3"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Overview
              </TabsTrigger>
            </Link>
            
            <Link href="/dashboard/finance/transactions" passHref legacyBehavior>
              <TabsTrigger 
                value="transactions" 
                className="data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none border-b-2 border-transparent px-4 py-3"
              >
                <ReceiptText className="mr-2 h-4 w-4" />
                Transactions
              </TabsTrigger>
            </Link>
            
            <Link href="/dashboard/finance/accounts" passHref legacyBehavior>
              <TabsTrigger 
                value="accounts" 
                className="data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none border-b-2 border-transparent px-4 py-3"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Accounts
              </TabsTrigger>
            </Link>
            
            <Link href="/dashboard/finance/budgets" passHref legacyBehavior>
              <TabsTrigger 
                value="budgets" 
                className="data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none border-b-2 border-transparent px-4 py-3"
              >
                <PiggyBank className="mr-2 h-4 w-4" />
                Budgets
              </TabsTrigger>
            </Link>
          </TabsList>
        </Tabs>
      </nav>
      
      <div className="py-4">
        {children}
      </div>
    </div>
  );
} 