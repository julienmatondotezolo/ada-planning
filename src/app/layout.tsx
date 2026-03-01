import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { getServerUser } from '@/lib/auth-server';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryProvider } from '@/providers/QueryProvider';
import { Toaster } from '@/components/Toaster';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'AdaPlanning - Staff Scheduling',
  description: 'Professional staff scheduling for restaurants powered by AdaAuth',
  icons: {
    icon: [
      { url: '/icons/icon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180' },
      { url: '/icons/apple-touch-icon-152x152.png', sizes: '152x152' },
      { url: '/icons/apple-touch-icon-167x167.png', sizes: '167x167' },
      { url: '/icons/apple-touch-icon-180x180.png', sizes: '180x180' },
    ],
  },
  manifest: '/manifest.json',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-title': 'AdaPlanning',
    'apple-mobile-web-app-status-bar-style': 'default',
  }
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side user authentication
  // Middleware already validated the token — this fetches the full user profile
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
        <QueryProvider>
          <AuthProvider initialUser={user}>
            <div className="min-h-screen bg-background">
              {children}
            </div>
            <Toaster />
            <ServiceWorkerRegister />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
