import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui/card';

interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

/**
 * COMPONENTES DE GRÁFICOS
 * Visualizações interativas com Recharts
 */

export function ExecutionTrendChart({ data }: { data: ChartData[] }) {
  return (
    <Card className="bg-slate-800/50 border-purple-500/30 p-6">
      <h3 className="text-lg font-bold mb-4">📈 Tendência de Execuções</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="name" stroke="#888" />
          <YAxis stroke="#888" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #8b5cf6',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="executions"
            stroke="#a78bfa"
            strokeWidth={2}
            dot={{ fill: '#a78bfa', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="success"
            stroke="#4ade80"
            strokeWidth={2}
            dot={{ fill: '#4ade80', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function SuccessRateChart({ data }: { data: ChartData[] }) {
  return (
    <Card className="bg-slate-800/50 border-purple-500/30 p-6">
      <h3 className="text-lg font-bold mb-4">📊 Taxa de Sucesso por Script</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="name" stroke="#888" />
          <YAxis stroke="#888" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #8b5cf6',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Bar dataKey="successRate" fill="#a78bfa" radius={[8, 8, 0, 0]} />
          <Bar dataKey="failureRate" fill="#f87171" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function ScriptDistributionChart({ data }: { data: ChartData[] }) {
  const COLORS = ['#a78bfa', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <Card className="bg-slate-800/50 border-purple-500/30 p-6">
      <h3 className="text-lg font-bold mb-4">🎯 Distribuição de Scripts</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #8b5cf6',
              borderRadius: '8px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function PerformanceMetricsChart({ data }: { data: ChartData[] }) {
  return (
    <Card className="bg-slate-800/50 border-purple-500/30 p-6">
      <h3 className="text-lg font-bold mb-4">⚡ Métricas de Performance</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="name" stroke="#888" />
          <YAxis stroke="#888" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #8b5cf6',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Bar dataKey="avgTime" fill="#06b6d4" name="Tempo Médio (ms)" radius={[8, 8, 0, 0]} />
          <Bar dataKey="maxTime" fill="#f59e0b" name="Tempo Máximo (ms)" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function AlertsTrendChart({ data }: { data: ChartData[] }) {
  return (
    <Card className="bg-slate-800/50 border-purple-500/30 p-6">
      <h3 className="text-lg font-bold mb-4">🚨 Tendência de Alertas</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="name" stroke="#888" />
          <YAxis stroke="#888" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #8b5cf6',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="criticos"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ fill: '#ef4444', r: 4 }}
            name="Críticos"
          />
          <Line
            type="monotone"
            dataKey="avisos"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ fill: '#f59e0b', r: 4 }}
            name="Avisos"
          />
          <Line
            type="monotone"
            dataKey="erros"
            stroke="#f87171"
            strokeWidth={2}
            dot={{ fill: '#f87171', r: 4 }}
            name="Erros"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
