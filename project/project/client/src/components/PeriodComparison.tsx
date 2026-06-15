import { useState } from 'react';
import { DateRangePicker, type DateRange } from './DateRangePicker';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

interface ComparisonMetric {
  label: string;
  current: number;
  previous: number;
  unit?: string;
  isPercentage?: boolean;
}

interface PeriodComparisonProps {
  metrics: ComparisonMetric[];
  onCompare?: (current: DateRange, previous: DateRange) => void;
}

/**
 * COMPONENTE PERIOD COMPARISON
 * Compara métricas entre dois períodos
 */
export function PeriodComparison({ metrics, onCompare }: PeriodComparisonProps) {
  const [currentRange, setCurrentRange] = useState<DateRange>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });

  const [previousRange, setPreviousRange] = useState<DateRange>({
    from: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    to: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  });

  const handleCompare = () => {
    onCompare?.(currentRange, previousRange);
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) {
      return <TrendingUp className="h-4 w-4 text-green-400" />;
    } else if (change < 0) {
      return <TrendingDown className="h-4 w-4 text-red-400" />;
    }
    return null;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <div className="space-y-6">
      {/* Seletores de Período */}
      <div className="bg-slate-800/50 border border-purple-500/30 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Período Atual */}
          <div>
            <p className="text-sm text-purple-300 font-semibold mb-2">📊 Período Atual</p>
            <DateRangePicker
              onDateRangeChange={setCurrentRange}
              defaultRange={currentRange}
              maxDays={365}
            />
          </div>

          {/* Seta de Comparação */}
          <div className="flex justify-center">
            <div className="flex items-center gap-2 text-gray-400">
              <div className="h-px w-8 bg-purple-500/30"></div>
              <ArrowRight className="h-5 w-5 text-purple-400" />
              <div className="h-px w-8 bg-purple-500/30"></div>
            </div>
          </div>

          {/* Período Anterior */}
          <div>
            <p className="text-sm text-purple-300 font-semibold mb-2">📅 Período Anterior</p>
            <DateRangePicker
              onDateRangeChange={setPreviousRange}
              defaultRange={previousRange}
              maxDays={365}
            />
          </div>
        </div>

        {/* Botão de Comparação */}
        <Button
          onClick={handleCompare}
          className="w-full mt-4 bg-purple-600 hover:bg-purple-700"
        >
          Comparar Períodos
        </Button>
      </div>

      {/* Métricas de Comparação */}
      {metrics.length > 0 && (
        <div className="bg-slate-800/50 border border-purple-500/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-purple-300 mb-4">📈 Comparação de Métricas</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metrics.map((metric, idx) => {
              const change = calculateChange(metric.current, metric.previous);
              const changePercent = change.toFixed(1);

              return (
                <div key={idx} className="bg-slate-700/50 border border-purple-500/20 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-3">{metric.label}</p>

                  <div className="space-y-2">
                    {/* Período Atual */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Atual:</span>
                      <span className="text-lg font-bold text-purple-400">
                        {metric.current.toLocaleString('pt-BR')}
                        {metric.unit && <span className="text-sm ml-1">{metric.unit}</span>}
                      </span>
                    </div>

                    {/* Período Anterior */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Anterior:</span>
                      <span className="text-lg font-bold text-gray-400">
                        {metric.previous.toLocaleString('pt-BR')}
                        {metric.unit && <span className="text-sm ml-1">{metric.unit}</span>}
                      </span>
                    </div>

                    {/* Variação */}
                    <div className="flex items-center justify-between pt-2 border-t border-purple-500/10">
                      <span className="text-xs text-gray-500">Variação:</span>
                      <div className={`flex items-center gap-2 ${getTrendColor(change)}`}>
                        {getTrendIcon(change)}
                        <span className="font-bold">
                          {changePercent}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Barra de Progresso */}
                  <div className="mt-3 bg-slate-800/50 rounded h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        change > 0 ? 'bg-green-500' : change < 0 ? 'bg-red-500' : 'bg-gray-500'
                      }`}
                      style={{
                        width: `${Math.min(Math.abs(change), 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resumo */}
          <div className="mt-6 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
            <p className="text-sm text-purple-300">
              💡 <strong>Dica:</strong> Use a comparação de períodos para identificar tendências, sazonalidade e impacto de mudanças implementadas.
            </p>
          </div>
        </div>
      )}

      {/* Sem Métricas */}
      {metrics.length === 0 && (
        <div className="bg-slate-800/50 border border-purple-500/30 rounded-lg p-6 text-center">
          <p className="text-gray-400">Nenhuma métrica disponível para comparação</p>
        </div>
      )}
    </div>
  );
}
