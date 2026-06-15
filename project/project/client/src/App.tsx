import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Páginas leves carregadas no bundle principal
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

// Páginas pesadas: lazy-loaded em chunks separados
// Cada import vira um chunk independente no build (code splitting automático)
const Dashboard             = lazy(() => import("./pages/Dashboard"));
const ScriptExecutor        = lazy(() => import("./pages/ScriptExecutor"));
const NotificationHistory   = lazy(() => import("./pages/NotificationHistory"));
const NotificationPrefs     = lazy(() => import("./pages/NotificationPreferences"));

// Spinner inline leve — evita depender de componente pesado durante o carregamento
function PageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path=""                          component={Home} />
        <Route path="/dashboard"                component={Dashboard} />
        <Route path="/scripts"                  component={ScriptExecutor} />
        <Route path="/notifications"            component={NotificationHistory} />
        <Route path="/notification-preferences" component={NotificationPrefs} />
        <Route path="/404"                      component={NotFound} />
        <Route                                  component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
