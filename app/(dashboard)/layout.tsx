import { Inter } from 'next/font/google';
import '../globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}