import { ReactNode } from 'react';
import { Metadata } from 'next';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { DollarSign, BarChart3, CreditCard, ReceiptText, PiggyBank } from 'lucide-react';
import { CurrencyProviderWrapper } from '@/components/finance/currency-provider-wrapper';

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
            <TabsTrigger
              value="overview"
              className="data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none border-b-2 border-transparent px-4 py-3"
              asChild
            >
              <Link href="/dashboard/finance">
                <div className="flex items-center">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Overview
                </div>
              </Link>
            </TabsTrigger>

            <TabsTrigger
              value="transactions"
              className="data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none border-b-2 border-transparent px-4 py-3"
              asChild
            >
              <Link href="/dashboard/finance/transactions">
                <div className="flex items-center">
                  <ReceiptText className="mr-2 h-4 w-4" />
                  Transactions
                </div>
              </Link>
            </TabsTrigger>

            <TabsTrigger
              value="accounts"
              className="data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none border-b-2 border-transparent px-4 py-3"
              asChild
            >
              <Link href="/dashboard/finance/accounts">
                <div className="flex items-center">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Accounts
                </div>
              </Link>
            </TabsTrigger>

            <TabsTrigger
              value="budgets"
              className="data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none border-b-2 border-transparent px-4 py-3"
              asChild
            >
              <Link href="/dashboard/finance/budgets">
                <div className="flex items-center">
                  <PiggyBank className="mr-2 h-4 w-4" />
                  Budgets
                </div>
              </Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </nav>

      <div className="py-4">
        <CurrencyProviderWrapper>
          {children}
        </CurrencyProviderWrapper>
      </div>
    </div>
  );
}