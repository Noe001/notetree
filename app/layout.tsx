import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './styles/globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { NotificationProvider } from '@/components/notification/notification-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NoteTree',
  description: 'ツリー型に整理できるノートアプリ',
  applicationName: 'NoteTree',
  icons: {
    icon: [{ url: '/icon.png', type: 'image/png' }],
    apple: [{ url: '/icon.png', type: 'image/png' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <NotificationProvider>{children}</NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
