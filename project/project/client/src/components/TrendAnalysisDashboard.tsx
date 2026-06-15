/**
 * TREND ANALYSIS DASHBOARD - Análise de Tendências com IA
 */

import { useState } from 'react';
import { TrendingUp, Zap, AlertCircle, Target, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/lib/trpc';

// Mock data
const MOCK_TRENDS = {
  viralTrends: [
    { trend: '#FYP', score: 92, growth: '+45%' },
    { trend: '#ForYouPage', score: 88, growth: '+38%' },
    { trend: '#Viral', score: 85, growth: '+32%' },
  ],
};

const MOCK_PREDICTIONS = {
  viralityScore: 78,
  recommendedScriptTypes: ['YouTube Outlier', 'Repurpose', 'SEO Metadata'],
  bestTimeToPost: '19:00 - 21:00',
  estimatedReach: '50K - 100K',
};

const MOCK_INSIGHTS = {
  recommendations: [
    'Aumentar frequência de posts em horário de pico',
    'Focar em conteúdo de curiosidade e educação',
    'Usar hashtags de tendência nos primeiros 3 segundos',
  ],
  risks: [
    'Saturação de conteúdo similar detectada',
    'Taxa de engajamento abaixo da média em Reels',
  ],
};

export function TrendAnalysisDashboard() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [useRealData, setUseRealData] = useState(false);

  // Fetch trend analysis data (apenas se usar dados reais)
  const { data: trends, isLoading: trendsLoading, error: trendsError } = trpc.trendAnalysis.analyzeViralTrends.useQuery(
    { timeRange },
    { enabled: useRealData }
  );
  const { data: predictions, isLoading: predictionsLoading, error: predictionsError } = trpc.trendAnalysis.getPredictions.useQuery(
    { timeRange },
    { enabled: useRealData }
  );
  const { data: insights, isLoading: insightsLoading, error: insightsError } = trpc.trendAnalysis.getContentInsights.useQuery(
    { timeRange },
    { enabled: useRealData }
  );

  const isLoading = useRealData && (trendsLoading || predictionsLoading || insightsLoading);
  const hasError = useRealData && (trendsError || predictionsError || insightsError);

  // Use real data if available, otherwise use mock
  const displayTrends = (useRealData && trends) ? trends : MOCK_TRENDS;
  const displayPredictions = (useRealData && predictions) ? predictions : MOCK_PREDICTIONS;
  const displayInsights = (useRealData && insights) ? insights : MOCK_INSIGHTS;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-lg">
        <p className="text-red-400 font-semibold">Erro ao carregar análise de tendências</p>
        <p className="text-sm text-red-300 mt-2">Tente novamente em alguns momentos</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold">Análise de Tendências com IA</h2>
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

      {/* Virality Score */}
      <Card className="p-6 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-purple-500/30">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Score de Viralidade Previsto</h3>
            <p className="text-sm text-gray-400">Baseado em análise de tendências atuais</p>
          </div>
          <TrendingUp className="w-8 h-8 text-purple-400" />
        </div>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <div className="text-5xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text">
              {displayPredictions.viralityScore}
            </div>
            <p className="text-sm text-gray-400 mt-2">Potencial de viralidade: {displayPredictions.viralityScore > 70 ? 'Alto' : 'Médio'}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400 mb-2">Melhor horário:</p>
            <p className="font-semibold text-white">{displayPredictions.bestTimeToPost}</p>
            <p className="text-sm text-gray-400 mt-2">Alcance estimado:</p>
            <p className="font-semibold text-white">{displayPredictions.estimatedReach}</p>
          </div>
        </div>
      </Card>

      {/* Trending Hashtags */}
      <Card className="p-6 bg-slate-800/50 border-purple-500/20">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-400" />
          Tendências em Alta
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(displayTrends as any).viralTrends?.map((trend: any, idx: number) => (
            <div key={idx} className="p-4 bg-slate-700/50 rounded-lg border border-purple-500/20">
              <p className="font-semibold text-white mb-2">{trend.trend}</p>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                      style={{ width: `${trend.score}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-semibold text-green-400 ml-2">{trend.growth}</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">Score: {trend.score}/100</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Recommended Script Types */}
      <Card className="p-6 bg-slate-800/50 border-purple-500/20">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-400" />
          Scripts Recomendados
        </h3>
        <div className="flex flex-wrap gap-2">
          {displayPredictions.recommendedScriptTypes?.map((script: string, idx: number) => (
            <div key={idx} className="px-4 py-2 bg-purple-600/30 border border-purple-500/50 rounded-lg text-sm text-purple-200">
              {script}
            </div>
          ))}
        </div>
      </Card>

      {/* Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 bg-slate-800/50 border-green-500/20">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-green-400" />
            Recomendações
          </h3>
          <ul className="space-y-2">
            {displayInsights.recommendations?.map((rec, idx) => (
              <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                <span className="text-green-400 font-bold mt-1">✓</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6 bg-slate-800/50 border-red-500/20">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            Riscos Detectados
          </h3>
          <ul className="space-y-2">
            {(displayInsights as any).risks?.map((risk: string, idx: number) => (
              <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                <span className="text-red-400 font-bold mt-1">⚠</span>
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
