/**
 * KPI DASHBOARD - Métricas Profissionais de Sucesso
 */

import { useState, useMemo } from 'react';
import { TrendingUp, Users, Video, Zap, Target, Award, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/lib/trpc';

interface KPIMetric {
  label: string;
  value: number | string;
  change?: number;
  unit?: string;
  icon: React.ReactNode;
  color: string;
}

// Mock data para teste imediato
const MOCK_KPI_DATA = {
  successRate: 87.5,
  totalExecutions: 342,
  averageExecutionTime: 45000,
  failedExecutions: 12,
};

const MOCK_SCRIPT_PERFORMANCE = [
  { scriptType: 'YouTube Outlier', successRate: 92, executionCount: 45 },
  { scriptType: 'Transcription', successRate: 88, executionCount: 78 },
  { scriptType: 'Repurpose', successRate: 85, executionCount: 62 },
  { scriptType: 'SEO Metadata', successRate: 95, executionCount: 89 },
];

export function KPIDashboard() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [useRealData, setUseRealData] = useState(false);

  // Fetch KPI data from backend
  const { data: kpiMetrics, isLoading: metricsLoading, error: metricsError } = trpc.kpi.getMetrics.useQuery(
    { timeRange },
    { enabled: useRealData }
  );
  const { data: scriptPerformance, isLoading: scriptLoading } = trpc.kpi.getScriptPerformance.useQuery(
    { timeRange },
    { enabled: useRealData }
  );

  // Use real data if available, otherwise use mock
  const displayMetrics = useRealData && kpiMetrics ? kpiMetrics : MOCK_KPI_DATA;
  const displayScriptPerformance = useRealData && scriptPerformance ? scriptPerformance : MOCK_SCRIPT_PERFORMANCE;

  // Build KPI cards from real data
  const kpis = useMemo<KPIMetric[]>(() => {
    return [
      {
        label: 'Taxa de Sucesso',
        value: displayMetrics.successRate.toFixed(1),
        unit: '%',
        change: displayMetrics.successRate > 85 ? 5 : -3,
        icon: <TrendingUp className="w-5 h-5" />,
        color: 'text-green-500',
      },
      {
        label: 'Scripts Executados',
        value: displayMetrics.totalExecutions,
        change: 8.2,
        icon: <Zap className="w-5 h-5" />,
        color: 'text-blue-500',
      },
      {
        label: 'Tempo Médio',
        value: `${(displayMetrics.averageExecutionTime / 1000).toFixed(1)}s`,
        change: displayMetrics.averageExecutionTime > 60000 ? -2 : 1,
        icon: <Target className="w-5 h-5" />,
        color: 'text-purple-500',
      },
      {
        label: 'Taxa de Falha',
        value: displayMetrics.failedExecutions || 0,
        change: -2.1,
        icon: <Award className="w-5 h-5" />,
        color: 'text-red-500',
      },
    ];
  }, [displayMetrics]);

  const niches = [
    { value: 'all', label: 'Todos os Nichos' },
    { value: 'gaming', label: 'Gaming' },
    { value: 'comedy', label: 'Comédia' },
    { value: 'curiosity', label: 'Curiosidade' },
    { value: 'news', label: 'Notícias' },
    { value: 'lifestyle', label: 'Lifestyle' },
    { value: 'business', label: 'Negócios' },
  ];

  const isLoading = useRealData && (metricsLoading || scriptLoading);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold">Dashboard de Métricas</h2>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as '7d' | '30d' | '90d')}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={useRealData ? 'default' : 'outline'}
            onClick={() => setUseRealData(!useRealData)}
            className="text-xs"
          >
            {useRealData ? 'Dados Reais' : 'Dados Demo'}
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <Card key={index} className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 border-purple-500/20">
            <div className="flex items-start justify-between mb-4">
              <div className={`${kpi.color} bg-opacity-10 p-3 rounded-lg`}>
                {kpi.icon}
              </div>
              {kpi.change !== undefined && (
                <span className={`text-xs font-semibold ${kpi.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {kpi.change >= 0 ? '+' : ''}{kpi.change}%
                </span>
              )}
            </div>
            <h3 className="text-sm text-gray-400 mb-1">{kpi.label}</h3>
            <p className="text-3xl font-bold text-white">
              {kpi.value}
              {kpi.unit && <span className="text-lg ml-1">{kpi.unit}</span>}
            </p>
          </Card>
        ))}
      </div>

      {/* Performance by Script Type */}
      <Card className="p-6 bg-slate-800/50 border-purple-500/20">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Video className="w-5 h-5 text-purple-400" />
          Performance por Tipo de Script
        </h3>
        {displayScriptPerformance && displayScriptPerformance.length > 0 ? (
          <div className="space-y-3">
            {displayScriptPerformance.map((script, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-white mb-1">{script.scriptType}</p>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                      style={{ width: `${script.successRate}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{script.successRate}%</p>
                  <p className="text-xs text-gray-400">{script.executionCount} exec.</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p>Nenhuma execução registrada</p>
          </div>
        )}
      </Card>

      {/* Recommendations */}
      <Card className="p-6 bg-slate-800/50 border-purple-500/20">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-400" />
          Recomendações de Otimização
        </h3>
        <div className="space-y-3">
          <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
            <p className="text-sm text-green-300">✓ Taxa de sucesso acima de 85% - Excelente desempenho!</p>
          </div>
          <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-300">→ Considere aumentar frequência de execução</p>
          </div>
          <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
            <p className="text-sm text-purple-300">⚡ Tempo médio está otimizado - Manter configuração atual</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
