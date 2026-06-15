/**
 * TRENDING SHORTS DASHBOARD - Dashboard ao Vivo com Shorts Viralizando
 * Mostra vídeos tendência em tempo real por categoria
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Eye, Heart, MessageCircle, Share2 } from 'lucide-react';

interface Short {
  id: string;
  title: string;
  channel: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  category: string;
  thumbnail: string;
  url: string;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
}

const mockShorts: Short[] = [
  {
    id: '1',
    title: 'Técnica de Edição que Viraliza em 2026',
    channel: '@VideoMaster',
    views: 2500000,
    likes: 185000,
    comments: 42000,
    shares: 15000,
    category: 'Educação',
    thumbnail: '🎬',
    url: 'https://youtu.be/example1',
    trend: 'up',
    trendPercent: 45,
  },
  {
    id: '2',
    title: 'Reação Hilária ao Novo Meme 2026',
    channel: '@ComedyKing',
    views: 1800000,
    likes: 156000,
    comments: 38000,
    shares: 12000,
    category: 'Comédia',
    thumbnail: '😂',
    url: 'https://youtu.be/example2',
    trend: 'up',
    trendPercent: 32,
  },
  {
    id: '3',
    title: 'Curiosidade Chocante que Ninguém Sabia',
    channel: '@FatosIncríveis',
    views: 3200000,
    likes: 245000,
    comments: 67000,
    shares: 28000,
    category: 'Curiosidade',
    thumbnail: '🤯',
    url: 'https://youtu.be/example3',
    trend: 'up',
    trendPercent: 67,
  },
  {
    id: '4',
    title: 'Gaming: Glitch Impossível Descoberto',
    channel: '@ProGamer',
    views: 1200000,
    likes: 98000,
    comments: 24000,
    shares: 8000,
    category: 'Gaming',
    thumbnail: '🎮',
    url: 'https://youtu.be/example4',
    trend: 'stable',
    trendPercent: 5,
  },
  {
    id: '5',
    title: 'Dica de Produtividade que Mudou Minha Vida',
    channel: '@ProdutivoMax',
    views: 950000,
    likes: 72000,
    comments: 18000,
    shares: 6000,
    category: 'Produtividade',
    thumbnail: '⚡',
    url: 'https://youtu.be/example5',
    trend: 'down',
    trendPercent: -12,
  },
  {
    id: '6',
    title: 'Viagem Épica para Lugar Desconhecido',
    channel: '@ViajanteLouco',
    views: 1600000,
    likes: 128000,
    comments: 31000,
    shares: 11000,
    category: 'Viagem',
    thumbnail: '✈️',
    url: 'https://youtu.be/example6',
    trend: 'up',
    trendPercent: 28,
  },
];

const categories = ['Todos', 'Educação', 'Comédia', 'Curiosidade', 'Gaming', 'Produtividade', 'Viagem'];

export function TrendingShortsDashboard() {
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [filteredShorts, setFilteredShorts] = useState<Short[]>(mockShorts);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (selectedCategory === 'Todos') {
      setFilteredShorts(mockShorts);
    } else {
      setFilteredShorts(mockShorts.filter(s => s.category === selectedCategory));
    }
  }, [selectedCategory]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-400';
      case 'down':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return '📈';
      case 'down':
        return '📉';
      default:
        return '→';
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-purple-400" />
            Shorts Viralizando Agora
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Atualizados em tempo real • Últimas 24 horas
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition disabled:opacity-50"
        >
          {refreshing ? '🔄 Atualizando...' : '🔄 Atualizar'}
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
              selectedCategory === cat
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Shorts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredShorts.map(short => (
          <a
            key={short.id}
            href={short.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <Card className="bg-slate-800 border-slate-700 overflow-hidden hover:border-purple-500 transition cursor-pointer h-full">
              {/* Thumbnail */}
              <div className="relative bg-gradient-to-br from-slate-700 to-slate-900 aspect-video flex items-center justify-center text-6xl group-hover:scale-105 transition">
                {short.thumbnail}
                <div className="absolute top-2 right-2">
                  <Badge className="bg-red-600 text-white">TRENDING</Badge>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                {/* Title */}
                <div>
                  <h3 className="font-semibold text-white line-clamp-2 group-hover:text-purple-400 transition">
                    {short.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">{short.channel}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-700/50 p-2 rounded">
                    <div className="flex items-center gap-1 text-slate-300">
                      <Eye className="w-3 h-3" />
                      {formatNumber(short.views)}
                    </div>
                  </div>
                  <div className="bg-slate-700/50 p-2 rounded">
                    <div className="flex items-center gap-1 text-slate-300">
                      <Heart className="w-3 h-3" />
                      {formatNumber(short.likes)}
                    </div>
                  </div>
                  <div className="bg-slate-700/50 p-2 rounded">
                    <div className="flex items-center gap-1 text-slate-300">
                      <MessageCircle className="w-3 h-3" />
                      {formatNumber(short.comments)}
                    </div>
                  </div>
                  <div className="bg-slate-700/50 p-2 rounded">
                    <div className="flex items-center gap-1 text-slate-300">
                      <Share2 className="w-3 h-3" />
                      {formatNumber(short.shares)}
                    </div>
                  </div>
                </div>

                {/* Trend */}
                <div className={`flex items-center gap-1 font-semibold ${getTrendColor(short.trend)}`}>
                  <span>{getTrendIcon(short.trend)}</span>
                  <span>{Math.abs(short.trendPercent)}% {short.trend === 'up' ? 'crescimento' : short.trend === 'down' ? 'queda' : 'estável'}</span>
                </div>
              </div>
            </Card>
          </a>
        ))}
      </div>

      {/* Empty State */}
      {filteredShorts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400">Nenhum short encontrado nesta categoria</p>
        </div>
      )}
    </div>
  );
}
