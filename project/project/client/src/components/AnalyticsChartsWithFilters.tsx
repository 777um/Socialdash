import { useState, useRef } from 'react';
import { DateRangePicker, type DateRange } from './DateRangePicker';

// Tipo de dados de analytics
interface AnalyticsData {
  totalExecutions: number;
  successRate: number;
  avgExecutionTime?: number;
  uniqueScripts: number;
  data: Record<string, any>[];
}

interface PerformanceData {
  data: Record<string, any>[];
}
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, BarChart3 } from 'lucide-react';
import {
  exportToCSV,
  exportToJSON,
  exportToPDF,
  exportChartAsImage,
  generateFilename,
  formatDataForExport,
} from '@/lib/export-utils';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface AnalyticsChartsWithFiltersProps {
  userId?: string;
}

/**
 * COMPONENTE ANALYTICS COM FILTROS E EXPORTAÇÃO
 * Integra DateRangePicker com gráficos e opções de exportação
 */
export function AnalyticsChartsWithFilters({ userId }: AnalyticsChartsWithFiltersProps) {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 dias atrás
    to: new Date(),
  });
  const [isExporting, setIsExporting] = useState(false);
  const chartsRef = useRef<HTMLDivElement>(null);

  // Buscar dados com filtro de data
  const { data: analyticsData, isLoading } = trpc.analytics.stats.useQuery(
    {
      days: Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)),
    },
    {
      enabled: !!dateRange.from && !!dateRange.to,
    }
  );

  const { data: performanceData } = trpc.analytics.performance.useQuery(
    {
      days: Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)),
    },
    {
      enabled: !!dateRange.from && !!dateRange.to,
    }
  );

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const data = formatDataForExport(analyticsData?.stats?.timeline || [], 'br');
      exportToCSV(data, {
        filename: generateFilename('analytics', 'csv'),
        dateRange,
        metadata: {
          totalExecutions: analyticsData?.stats?.totalExecutions,
          successRate: analyticsData?.stats?.successRate,
        },
      });
      toast.success('✅ Dados exportados como CSV');
    } catch (error) {
      toast.error('❌ Erro ao exportar CSV');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = async () => {
    try {
      setIsExporting(true);
      exportToJSON(analyticsData?.stats?.timeline || [], {
        filename: generateFilename('analytics', 'json'),
        dateRange,
        metadata: {
          totalExecutions: analyticsData?.stats?.totalExecutions,
          successRate: analyticsData?.stats?.successRate,
          period: `${dateRange.from.toLocaleDateString('pt-BR')} - ${dateRange.to.toLocaleDateString('pt-BR')}`,
        },
      });
      toast.success('✅ Dados exportados como JSON');
    } catch (error) {
      toast.error('❌ Erro ao exportar JSON');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      await exportToPDF(formatDataForExport(analyticsData?.stats?.timeline || [], 'br'), 'Relatório de Analytics', {
        filename: generateFilename('analytics', 'pdf'),
        dateRange,
        metadata: {
          totalExecutions: analyticsData?.stats?.totalExecutions,
          successRate: analyticsData?.stats?.successRate,
        },
      });
      toast.success('✅ Relatório exportado como PDF');
    } catch (error) {
      toast.error('❌ Erro ao exportar PDF');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportChartImage = async () => {
    try {
      setIsExporting(true);
      if (chartsRef.current) {
        await exportChartAsImage(chartsRef.current, generateFilename('grafico', 'png'));
        toast.success('✅ Gráfico exportado como imagem');
      }
    } catch (error) {
      toast.error('❌ Erro ao exportar gráfico');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com Filtros e Exportação */}
      <div className="bg-slate-800/50 border border-purple-500/30 rounded-lg p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Filtro de Data */}
          <div className="flex-1">
            <p className="text-sm text-gray-400 mb-2">📅 Selecione o Período</p>
            <DateRangePicker
              onDateRangeChange={setDateRange}
              defaultRange={dateRange}
              maxDays={365}
            />
          </div>

          {/* Botões de Exportação */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportCSV}
              disabled={isExporting || isLoading}
              className="text-xs"
            >
              <Download className="h-3 w-3 mr-1" />
              CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportJSON}
              disabled={isExporting || isLoading}
              className="text-xs"
            >
              <Download className="h-3 w-3 mr-1" />
              JSON
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportPDF}
              disabled={isExporting || isLoading}
              className="text-xs"
            >
              <Download className="h-3 w-3 mr-1" />
              PDF
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportChartImage}
              disabled={isExporting || isLoading}
              className="text-xs"
            >
              <BarChart3 className="h-3 w-3 mr-1" />
              Imagem
            </Button>
          </div>
        </div>

        {/* Resumo de Dados */}
        {analyticsData?.stats && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-700/50 p-3 rounded">
              <p className="text-xs text-gray-400">Execuções</p>
              <p className="text-lg font-bold text-purple-400">{analyticsData.stats.totalExecutions}</p>
            </div>
            <div className="bg-slate-700/50 p-3 rounded">
              <p className="text-xs text-gray-400">Taxa de Sucesso</p>
              <p className="text-lg font-bold text-green-400">{(analyticsData.stats.successRate * 100).toFixed(1)}%</p>
            </div>
            <div className="bg-slate-700/50 p-3 rounded">
              <p className="text-xs text-gray-400">Tempo Médio</p>
              <p className="text-lg font-bold text-blue-400">{analyticsData.stats.averageExecutionTime?.toFixed(2)}s</p>
            </div>
            <div className="bg-slate-700/50 p-3 rounded">
              <p className="text-xs text-gray-400">Scripts Usados</p>
              <p className="text-lg font-bold text-yellow-400">{Object.keys(analyticsData.stats.byScript || {}).length}</p>
            </div>
          </div>
        )}
      </div>

      {/* Gráficos */}
      <div ref={chartsRef} className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-96 bg-slate-800/50 rounded-lg">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-purple-400 mx-auto mb-4 animate-pulse" />
              <p className="text-gray-400">Carregando dados...</p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/50 border border-purple-500/30 rounded-lg p-6">
            <p className="text-gray-300 text-center">Graficos interativos com dados do periodo selecionado</p>
          </div>
        )}
      </div>

      {/* Dica de Exportação */}
      <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
        <p className="text-xs text-purple-300">
          💡 <strong>Dica:</strong> Use os filtros de data para analisar períodos específicos e exporte os dados em seu formato preferido (CSV para Excel, JSON para APIs, PDF para relatórios, ou Imagem para apresentações).
        </p>
      </div>
    </div>
  );
}
