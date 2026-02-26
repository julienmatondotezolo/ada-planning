import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { getServerUser, redirectToAuth } from '@/lib/auth-server';
import { AuthProvider } from '@/contexts/AuthContext-v2';
import { redirect } from 'next/navigation';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'AdaPlanning - Staff Scheduling',
  description: 'Professional staff scheduling for restaurants',
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/apple-touch-icon.png',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get user data once at the server level
  const user = await getServerUser();
  
  // If this is a protected route and no user, redirect
  // (We can check this in middleware instead, but showing the pattern)
  
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider initialUser={user}>
          <div className="min-h-screen bg-background">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}