import { useAuth } from '@/_core/hooks/useAuth';
import { getLoginUrl } from '@/const';
import { Button } from '@/components/ui/button';
import { KPIDashboard } from '@/components/KPIDashboard';
import { TrendAnalysisDashboard } from '@/components/TrendAnalysisDashboard';
import { NotificationCenter } from '@/components/NotificationCenter';
import { WebhookManager } from '@/components/WebhookManager';
import { AlertManager } from '@/components/AlertManager';

/**
 * Home page - Dashboard principal com todos os componentes
 */
export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Social Media AI Automation</h1>
          <p className="text-gray-300 mb-8">Faça login para acessar o dashboard</p>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition"
          >
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Social Media AI Automation
          </h1>
          <p className="text-lg text-gray-300">
            O sistema definitivo para dominar redes sociais em 2026
          </p>
        </div>

        {/* KPI Dashboard */}
        <div className="mb-12">
          <KPIDashboard />
        </div>

        {/* Trend Analysis Dashboard */}
        <div className="mb-12">
          <TrendAnalysisDashboard />
        </div>

        {/* Notifications */}
        <div className="mb-12">
          <NotificationCenter />
        </div>

        {/* Webhooks */}
        <div className="mb-12">
          <WebhookManager />
        </div>

        {/* Alerts */}
        <div className="mb-12">
          <AlertManager />
        </div>

        {/* Footer */}
        <div className="text-center py-8 border-t border-purple-500/20">
          <p className="text-sm text-gray-400">
            © 2026 Social Media AI Automation. Desenvolvido com ❤️ para criadores de conteúdo
          </p>
        </div>
      </div>
    </div>
  );
}
