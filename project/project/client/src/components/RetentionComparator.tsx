/**
 * RETENTION COMPARATOR - Comparador de Retenção Visual com Slider
 * Mostra diferenças de retenção entre dois vídeos
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface RetentionData {
  timestamp: number;
  video1: number;
  video2: number;
}

const generateRetentionData = (): RetentionData[] => {
  const data: RetentionData[] = [];
  for (let i = 0; i <= 60; i += 5) {
    // Simular curva de retenção típica
    const decay1 = 100 * Math.exp(-i / 40) + Math.random() * 5;
    const decay2 = 100 * Math.exp(-i / 35) + Math.random() * 5;

    data.push({
      timestamp: i,
      video1: Math.max(0, Math.min(100, decay1)),
      video2: Math.max(0, Math.min(100, decay2)),
    });
  }
  return data;
};

export function RetentionComparator() {
  const [retentionData] = useState<RetentionData[]>(generateRetentionData());
  const [selectedTime, setSelectedTime] = useState(30);

  const currentData = retentionData.find(d => d.timestamp === selectedTime) || retentionData[0];
  const difference = Math.abs(currentData.video1 - currentData.video2);
  const winner = currentData.video1 > currentData.video2 ? 'video1' : 'video2';

  const avgRetention1 = (retentionData.reduce((sum, d) => sum + d.video1, 0) / retentionData.length).toFixed(1);
  const avgRetention2 = (retentionData.reduce((sum, d) => sum + d.video2, 0) / retentionData.length).toFixed(1);

  const comparisonData = [
    {
      name: 'Vídeo 1',
      value: parseFloat(avgRetention1),
      fill: '#8b5cf6',
    },
    {
      name: 'Vídeo 2',
      value: parseFloat(avgRetention2),
      fill: '#06b6d4',
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-purple-400" />
          Comparador de Retenção
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Analise a retenção de audiência entre dois vídeos em tempo real
        </p>
      </div>

      {/* Main Comparison Chart */}
      <Card className="bg-slate-800 border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Curva de Retenção ao Longo do Tempo</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={retentionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="timestamp"
              stroke="#94a3b8"
              label={{ value: 'Tempo (segundos)', position: 'insideBottomRight', offset: -5 }}
            />
            <YAxis
              stroke="#94a3b8"
              label={{ value: 'Retenção (%)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
              }}
              formatter={(value: number) => `${value.toFixed(1)}%`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="video1"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={false}
              name="Vídeo 1"
            />
            <Line
              type="monotone"
              dataKey="video2"
              stroke="#06b6d4"
              strokeWidth={2}
              dot={false}
              name="Vídeo 2"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Time Slider */}
      <Card className="bg-slate-800 border-slate-700 p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Análise em Tempo Real</h3>
            <span className="text-2xl font-bold text-purple-400">{selectedTime}s</span>
          </div>

          <Slider
            value={[selectedTime]}
            onValueChange={(value) => setSelectedTime(value[0])}
            min={0}
            max={60}
            step={5}
            className="w-full"
          />

          {/* Current Metrics */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-slate-700/50 p-4 rounded-lg">
              <p className="text-sm text-slate-400 mb-2">Vídeo 1 - Retenção</p>
              <p className="text-3xl font-bold text-purple-400">{currentData.video1.toFixed(1)}%</p>
            </div>
            <div className="bg-slate-700/50 p-4 rounded-lg">
              <p className="text-sm text-slate-400 mb-2">Vídeo 2 - Retenção</p>
              <p className="text-3xl font-bold text-cyan-400">{currentData.video2.toFixed(1)}%</p>
            </div>
          </div>

          {/* Winner Badge */}
          <div className={`p-4 rounded-lg border-2 ${
            winner === 'video1'
              ? 'bg-purple-900/30 border-purple-500'
              : 'bg-cyan-900/30 border-cyan-500'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Vídeo com Melhor Retenção</p>
                <p className="text-lg font-semibold text-white mt-1">
                  {winner === 'video1' ? 'Vídeo 1' : 'Vídeo 2'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">Diferença</p>
                <p className="text-2xl font-bold text-green-400">+{difference.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Comparison Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Average Retention */}
        <Card className="bg-slate-800 border-slate-700 p-6">
          <h3 className="text-sm font-semibold text-slate-400 mb-4">Retenção Média</h3>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => `${value.toFixed(1)}%`}
              />
              <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Drop-off Rate */}
        <Card className="bg-slate-800 border-slate-700 p-6">
          <h3 className="text-sm font-semibold text-slate-400 mb-4">Taxa de Queda</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-300">Vídeo 1</span>
                <span className="text-sm font-semibold text-purple-400">2.3%/s</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: '23%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-300">Vídeo 2</span>
                <span className="text-sm font-semibold text-cyan-400">2.8%/s</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div className="bg-cyan-600 h-2 rounded-full" style={{ width: '28%' }}></div>
              </div>
            </div>
          </div>
        </Card>

        {/* Performance Score */}
        <Card className="bg-slate-800 border-slate-700 p-6">
          <h3 className="text-sm font-semibold text-slate-400 mb-4">Score de Performance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Vídeo 1</span>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-lg font-bold text-green-400">8.2/10</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Vídeo 2</span>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="text-lg font-bold text-red-400">7.1/10</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
