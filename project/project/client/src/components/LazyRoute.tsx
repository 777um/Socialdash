/**
 * LAZY ROUTE - Componente para lazy loading de rotas
 * Implementa code splitting e carregamento sob demanda
 */

import { Suspense, lazy, ComponentType } from 'react';
import { Loader2 } from 'lucide-react';

interface LazyRouteProps {
  component: () => Promise<any>;
  fallback?: React.ReactNode;
}

/**
 * Fallback padrão durante carregamento
 */
const DefaultFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
      <p className="text-gray-500">Carregando...</p>
    </div>
  </div>
);

/**
 * Wrapper para lazy loading de componentes
 */
export function LazyRoute({ component, fallback }: LazyRouteProps) {
  const LazyComponent = lazy(component);

  return (
    <Suspense fallback={fallback || <DefaultFallback />}>
      <LazyComponent />
    </Suspense>
  );
}

/**
 * Pré-carregar componente (prefetch)
 */
export function prefetchRoute(component: () => Promise<{ default: ComponentType<any> }>) {
  // Iniciar carregamento em background
  component().catch(err => console.error('Prefetch error:', err));
}

/**
 * Lazy load múltiplos componentes
 */
export const lazyComponents = {
  Dashboard: lazy(() => import('../pages/Dashboard')),
  NotificationHistory: lazy(() => import('../pages/NotificationHistory')),
  NotificationPreferences: lazy(() => import('../pages/NotificationPreferences')),
  Home: lazy(() => import('../pages/Home')),
};

/**
 * Prefetch routes ao hover
 */
export function usePrefetchRoute(routeName: keyof typeof lazyComponents) {
  return () => {
    // Prefetch component
    const component = lazyComponents[routeName];
    // Component will be loaded when accessed
  };
}
