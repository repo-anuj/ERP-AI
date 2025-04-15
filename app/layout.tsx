import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { UserProvider } from '@/contexts/user-context';
import { CompanyProvider } from '@/contexts/company-context';
import { NotificationProvider } from '@/contexts/notification-context';
import { PermissionProvider } from '@/contexts/permission-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ERP-AI',
  description: 'AI-powered ERP System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CompanyProvider>
            <UserProvider>
              <NotificationProvider>
                <PermissionProvider>
                  <div className="flex min-h-screen">
                    <Sidebar />
                    <div className="flex-1 flex flex-col md:ml-64">
                      <Header />
                      <main className="flex-1 overflow-y-auto bg-background">
                        {children}
                      </main>
                    </div>
                  </div>
                  <Toaster />
                </PermissionProvider>
              </NotificationProvider>
            </UserProvider>
          </CompanyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}