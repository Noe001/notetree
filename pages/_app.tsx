import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { NotificationProvider } from '@/components/notification/notification-provider';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Component {...pageProps} />
      </NotificationProvider>
    </AuthProvider>
  );
} 
