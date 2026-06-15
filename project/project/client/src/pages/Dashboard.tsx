import { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Info,
  TrendingUp,
  BarChart3,
  Clock,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * DASHBOARD - Página Principal com Alertas e Métricas
 * Responsivo para mobile e desktop
 */

export default function Dashboard() {
  const { user } = useAuth();
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Consultas tRPC
  const { data: alertas, refetch: refetchAlertas } = trpc.alerts.listar.useQuery({
    horas: 24,
  });

  const { data: statsAlertas } = trpc.alerts.stats.useQuery();

  const { data: analytics } = trpc.analytics.stats.useQuery({
    days: 7,
  });

  const { data: performance } = trpc.analytics.performance.useQuery({
    days: 7,
  });

  const { data: health } = trpc.analytics.health.useQuery();

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetchAlertas();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, refetchAlertas]);

  const getIconeAlerta = (tipo: string) => {
    switch (tipo) {
      case 'crítico':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'erro':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'aviso':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getCorAlerta = (tipo: string) => {
    switch (tipo) {
      case 'crítico':
        return 'border-red-500/30 bg-red-500/10';
      case 'erro':
        return 'border-orange-500/30 bg-orange-500/10';
      case 'aviso':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'info':
        return 'border-blue-500/30 bg-blue-500/10';
      default:
        return 'border-gray-500/30 bg-gray-500/10';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-gray-300">Bem-vindo de volta, {user?.name}!</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant={autoRefresh ? 'default' : 'outline'}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">
                {autoRefresh ? 'Auto' : 'Manual'}
              </span>
            </Button>
          </div>
        </div>

        {/* Grid de Métricas - Responsivo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Status de Saúde */}
          <Card className="bg-slate-800/50 border-purple-500/30 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-400">Status do Sistema</h3>
              {health?.status === 'healthy' && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              {health?.status === 'degraded' && (
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              )}
              {health?.status === 'unhealthy' && (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
            <p className="text-2xl font-bold mb-2">
              {health?.healthScore?.toFixed(0)}%
            </p>
            <p className="text-xs text-gray-400">
              {health?.recentExecutions} execuções recentes
            </p>
          </Card>

          {/* Taxa de Sucesso */}
          <Card className="bg-slate-800/50 border-purple-500/30 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-400">Taxa de Sucesso</h3>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold mb-2">
              {analytics?.stats.successRate?.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-400">
              {analytics?.stats.successCount} de{' '}
              {analytics?.stats.totalExecutions} execuções
            </p>
          </Card>

          {/* Alertas Críticos */}
          <Card className="bg-slate-800/50 border-purple-500/30 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-400">Alertas Críticos</h3>
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-2xl font-bold mb-2 text-red-400">
              {statsAlertas?.stats.criticos || 0}
            </p>
            <p className="text-xs text-gray-400">
              {statsAlertas?.stats.naoResolvidos || 0} não resolvidos
            </p>
          </Card>

          {/* Tempo Médio */}
          <Card className="bg-slate-800/50 border-purple-500/30 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-400">Tempo Médio</h3>
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold mb-2">
              {((analytics?.stats.averageExecutionTime || 0) / 1000)?.toFixed(1)}s
            </p>
            <p className="text-xs text-gray-400">por execução</p>
          </Card>
        </div>

        {/* Alertas Recentes - Responsivo */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Lista de Alertas */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800/50 border-purple-500/30 p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Alertas Recentes
              </h2>

              {alertas?.alertas && alertas.alertas.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {alertas.alertas.slice(0, 10).map(alerta => (
                    <div
                      key={alerta.id}
                      className={`border rounded-lg p-4 flex items-start gap-3 ${getCorAlerta(
                        alerta.tipo
                      )}`}
                    >
                      <div className="flex-shrink-0 mt-1">
                        {getIconeAlerta(alerta.tipo)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{alerta.titulo}</p>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                          {alerta.mensagem}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(alerta.timestamp).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      {!alerta.resolvido && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs flex-shrink-0"
                          onClick={() => toast.success('Alerta resolvido')}
                        >
                          ✓
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum alerta</p>
                </div>
              )}
            </Card>
          </div>

          {/* Performance por Script */}
          <div>
            <Card className="bg-slate-800/50 border-purple-500/30 p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                Performance
              </h2>

              {performance?.performance && performance.performance.length > 0 ? (
                <div className="space-y-3">
                  {performance.performance.slice(0, 5).map((perf: any) => (
                    <div key={perf.scriptType} className="text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="truncate text-xs font-semibold">
                          {perf.scriptType.split('_').join(' ')}
                        </span>
                        <span className="text-xs text-green-400">
                          {perf.successRate.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-700/50 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                          style={{
                            width: `${Math.min(perf.successRate, 100)}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {perf.executions} execuções
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">Sem dados</p>
              )}
            </Card>
          </div>
        </div>

        {/* Estatísticas Gerais */}
        <Card className="bg-slate-800/50 border-purple-500/30 p-6">
          <h2 className="text-xl font-bold mb-4">Resumo Geral</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">Total de Execuções</p>
              <p className="text-2xl font-bold text-purple-400">
                {analytics?.stats?.totalExecutions || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Sucessos</p>
              <p className="text-2xl font-bold text-green-400">
                {analytics?.stats?.successCount || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Falhas</p>
              <p className="text-2xl font-bold text-red-400">
                {analytics?.stats?.failureCount || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-400">
                {analytics?.stats?.pendingCount || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
