import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, X } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangePickerProps {
  onDateRangeChange: (range: DateRange) => void;
  defaultRange?: DateRange;
  maxDays?: number;
}

/**
 * COMPONENTE DATE RANGE PICKER
 * Seletor de intervalo de datas com presets rápidos
 */
export function DateRangePicker({
  onDateRangeChange,
  defaultRange,
  maxDays = 365,
}: DateRangePickerProps) {
  const today = new Date();
  const [dateRange, setDateRange] = useState<DateRange>(
    defaultRange || {
      from: subDays(today, 30),
      to: today,
    }
  );
  const [isOpen, setIsOpen] = useState(false);

  const handlePreset = (preset: 'today' | '7d' | '30d' | '90d' | 'month' | 'lastMonth') => {
    let newRange: DateRange;

    switch (preset) {
      case 'today':
        newRange = { from: today, to: today };
        break;
      case '7d':
        newRange = { from: subDays(today, 7), to: today };
        break;
      case '30d':
        newRange = { from: subDays(today, 30), to: today };
        break;
      case '90d':
        newRange = { from: subDays(today, 90), to: today };
        break;
      case 'month':
        newRange = { from: startOfMonth(today), to: endOfMonth(today) };
        break;
      case 'lastMonth':
        const lastMonth = subMonths(today, 1);
        newRange = { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
        break;
    }

    setDateRange(newRange);
    onDateRangeChange(newRange);
    setIsOpen(false);
  };

  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFrom = new Date(e.target.value);
    const newRange = { from: newFrom, to: dateRange.to };
    setDateRange(newRange);
    onDateRangeChange(newRange);
  };

  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTo = new Date(e.target.value);
    const newRange = { from: dateRange.from, to: newTo };
    setDateRange(newRange);
    onDateRangeChange(newRange);
  };

  const handleClear = () => {
    const newRange = { from: subDays(today, 30), to: today };
    setDateRange(newRange);
    onDateRangeChange(newRange);
  };

  const formatDate = (date: Date) => format(date, 'dd/MM/yyyy', { locale: ptBR });
  const daysDiff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 border border-purple-500/30 rounded-lg transition text-sm text-gray-300"
      >
        <Calendar className="h-4 w-4" />
        <span>{formatDate(dateRange.from)}</span>
        <span className="text-gray-500">→</span>
        <span>{formatDate(dateRange.to)}</span>
        <span className="text-xs text-purple-400 ml-2">({daysDiff}d)</span>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-slate-800 border border-purple-500/30 rounded-lg p-4 w-96 shadow-lg z-50">
          {/* Presets Rápidos */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-purple-300 mb-2">PERÍODOS RÁPIDOS</p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePreset('today')}
                className="text-xs"
              >
                Hoje
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePreset('7d')}
                className="text-xs"
              >
                Últimos 7d
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePreset('30d')}
                className="text-xs"
              >
                Últimos 30d
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePreset('90d')}
                className="text-xs"
              >
                Últimos 90d
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePreset('month')}
                className="text-xs"
              >
                Este Mês
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePreset('lastMonth')}
                className="text-xs"
              >
                Mês Anterior
              </Button>
            </div>
          </div>

          {/* Seletor Customizado */}
          <div className="border-t border-purple-500/20 pt-4">
            <p className="text-xs font-semibold text-purple-300 mb-3">PERÍODO CUSTOMIZADO</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Data Inicial</label>
                <input
                  type="date"
                  value={format(dateRange.from, 'yyyy-MM-dd')}
                  onChange={handleFromDateChange}
                  max={format(dateRange.to, 'yyyy-MM-dd')}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-purple-500/30 rounded text-sm text-gray-300"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Data Final</label>
                <input
                  type="date"
                  value={format(dateRange.to, 'yyyy-MM-dd')}
                  onChange={handleToDateChange}
                  min={format(dateRange.from, 'yyyy-MM-dd')}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-purple-500/30 rounded text-sm text-gray-300"
                />
              </div>
            </div>

            {/* Informações */}
            <div className="mt-3 p-2 bg-slate-700/30 rounded text-xs text-gray-400">
              <p>📊 Total: <span className="text-purple-300 font-semibold">{daysDiff} dias</span></p>
              <p>📅 De: <span className="text-purple-300">{formatDate(dateRange.from)}</span></p>
              <p>📅 Até: <span className="text-purple-300">{formatDate(dateRange.to)}</span></p>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={handleClear}
                className="flex-1 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Limpar
              </Button>
              <Button
                size="sm"
                className="flex-1 text-xs bg-purple-600 hover:bg-purple-700"
                onClick={() => setIsOpen(false)}
              >
                Aplicar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
