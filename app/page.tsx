import EnhancedMemoApp from '@/components/memo-app-enhanced';
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function Home() {
  return (
    <ProtectedRoute>
      <EnhancedMemoApp />
    </ProtectedRoute>
  );
} 
