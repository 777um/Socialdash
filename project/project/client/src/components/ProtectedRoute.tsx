import { useAuth } from '@/_core/hooks/useAuth';
import { getLoginUrl } from '@/const';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  component: React.ComponentType<any>;
  [key: string]: any;
}

export function ProtectedRoute({ component: Component, ...props }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = getLoginUrl();
    }
  }, [loading, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-purple-400" />
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <Component {...props} />;
}
