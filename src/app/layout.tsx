import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { getServerUser } from '@/lib/auth-server';
import { AuthProvider } from '@/contexts/AuthContext';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'AdaPlanning - Staff Scheduling',
  description: 'Professional staff scheduling for restaurants powered by AdaAuth',
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-title': 'AdaPlanning',
    'apple-mobile-web-app-status-bar-style': 'default',
  }
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side user authentication - single API call per request
  const user = await getServerUser();
  
  console.log('🏗️ Server Layout:', { 
    hasUser: !!user, 
    userEmail: user?.email,
    timestamp: new Date().toISOString() 
  });

  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <script dangerouslySetInnerHTML={{ __html: `document.addEventListener('contextmenu',function(e){e.preventDefault()});` }} />
        <AuthProvider initialUser={user}>
          <div className="min-h-screen bg-background">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}