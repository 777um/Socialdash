import { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Download, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

/**
 * SCRIPT EXECUTOR - Componente Profissional
 * Executa scripts Python com interface visual completa
 * Inclui tratamento de erros, loading states e feedback em tempo real
 */

const SCRIPTS = [
  {
    id: 'youtube_outlier_detector',
    nome: 'Detector de Outliers YouTube',
    descricao: 'Analisa últimos 30 vídeos e detecta performance acima da média',
    icone: '📊',
    parametros: [
      { nome: 'channel_url', label: 'URL do Canal', tipo: 'text', obrigatorio: true },
    ],
  },
  {
    id: 'audio_transcriber_free',
    nome: 'Transcritor de Áudio (Gratuito)',
    descricao: 'Transcreve áudio de vídeos YouTube usando Whisper local',
    icone: '🎵',
    parametros: [
      { nome: 'video_url', label: 'URL do Vídeo', tipo: 'text', obrigatorio: true },
    ],
  },
  {
    id: 'repurpose_script',
    nome: 'Gerador de Repurpose',
    descricao: 'Gera 3 ideias de conteúdo para diferentes plataformas',
    icone: '✨',
    parametros: [
      { nome: 'transcription', label: 'Transcrição', tipo: 'textarea', obrigatorio: true },
      { nome: 'niche', label: 'Nicho', tipo: 'text', obrigatorio: true },
      { nome: 'platform', label: 'Plataforma', tipo: 'select', opcoes: ['TikTok', 'Instagram', 'YouTube'], obrigatorio: true },
    ],
  },
  {
    id: 'seo_metadata_script',
    nome: 'Gerador de Metadados SEO',
    descricao: 'Gera títulos, descrições e tags otimizadas para YouTube',
    icone: '🎯',
    parametros: [
      { nome: 'transcription', label: 'Transcrição', tipo: 'textarea', obrigatorio: true },
      { nome: 'niche', label: 'Nicho', tipo: 'text', obrigatorio: true },
    ],
  },
  {
    id: 'multi_channel_orchestrator',
    nome: 'Orquestrador de Canais',
    descricao: 'Gerencia múltiplos canais em paralelo',
    icone: '🕸️',
    parametros: [
      { nome: 'channels', label: 'Número de Canais', tipo: 'number', obrigatorio: true },
      { nome: 'niche', label: 'Nicho', tipo: 'text', obrigatorio: true },
    ],
  },
  {
    id: 'monetization_funnel_optimizer',
    nome: 'Otimizador de Funil',
    descricao: 'Gera palavras-chave e links de afiliado rastreados',
    icone: '💰',
    parametros: [
      { nome: 'transcription', label: 'Transcrição', tipo: 'textarea', obrigatorio: true },
      { nome: 'topic', label: 'Tema', tipo: 'text', obrigatorio: true },
      { nome: 'affiliate_program', label: 'Programa de Afiliado', tipo: 'text', obrigatorio: true },
    ],
  },
  {
    id: 'affiliate_tracking_dashboard',
    nome: 'Dashboard de Rastreamento',
    descricao: 'Rastreia conversões, cliques e ROI por vídeo',
    icone: '📈',
    parametros: [
      { nome: 'analyze', label: 'Analisar', tipo: 'checkbox', obrigatorio: false },
    ],
  },
];

interface Execucao {
  id: string;
  scriptId: string;
  status: 'pendente' | 'executando' | 'sucesso' | 'erro';
  resultado?: string;
  erro?: string;
  tempo?: number;
  dataInicio: Date;
}

export default function ScriptExecutor() {
  const { user, loading: authLoading } = useAuth();
  const [scriptSelecionado, setScriptSelecionado] = useState<string | null>(null);
  const [parametros, setParametros] = useState<Record<string, any>>({});
  const [executando, setExecutando] = useState(false);
  const [execucoes, setExecucoes] = useState<Execucao[]>([]);
  const [abaSelecionada, setAbaSelecionada] = useState<'executor' | 'historico'>('executor');

  // Consultas tRPC
  const { mutate: executarScript, isPending } = trpc.scripts.youtubeOutlierDetector.useMutation({
    onSuccess: (resultado: any) => {
      toast.success('Script executado com sucesso!');
      setExecucoes(prev => [
        {
          id: `exec-${Date.now()}`,
          scriptId: scriptSelecionado || '',
          status: 'sucesso',
          resultado: JSON.stringify(resultado, null, 2),
          dataInicio: new Date(),
          tempo: Date.now(),
        },
        ...prev,
      ]);
      setParametros({});
    },
    onError: (erro: any) => {
      toast.error(`Erro: ${erro.message}`);
      setExecucoes(prev => [
        {
          id: `exec-${Date.now()}`,
          scriptId: scriptSelecionado || '',
          status: 'erro',
          erro: erro.message,
          dataInicio: new Date(),
        },
        ...prev,
      ]);
    },
  });

  const { data: analytics } = trpc.analytics.stats.useQuery(
    { days: 7, scriptType: scriptSelecionado || undefined },
    { enabled: !!scriptSelecionado }
  );

  // Proteção de autenticação
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-gray-300">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
        <Card className="bg-slate-800/50 border-purple-500/30 p-8 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Autenticação Necessária</h2>
          <p className="text-gray-300 mb-4">Você precisa estar autenticado para usar o Script Executor.</p>
          <Button className="w-full bg-purple-600 hover:bg-purple-700">
            Fazer Login
          </Button>
        </Card>
      </div>
    );
  }

  const scriptAtual = SCRIPTS.find(s => s.id === scriptSelecionado);

  const handleExecutar = () => {
    if (!scriptSelecionado) {
      toast.error('Selecione um script');
      return;
    }

    const scriptConfig = SCRIPTS.find(s => s.id === scriptSelecionado);
    if (!scriptConfig) return;

    // Validar parâmetros obrigatórios
    const parametrosObrigatorios = scriptConfig.parametros.filter(p => p.obrigatorio);
    for (const param of parametrosObrigatorios) {
      if (!parametros[param.nome]) {
        toast.error(`Preencha o campo: ${param.label}`);
        return;
      }
    }

    setExecutando(true);
    if (scriptSelecionado === 'youtube_outlier_detector') {
      executarScript({
        channelUrl: parametros.channel_url,
        numVideos: 30,
        multiplier: 1.5,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Script Executor
          </h1>
          <p className="text-gray-300">Bem-vindo, {user.name}! Execute scripts de automação com facilidade.</p>
        </div>

        {/* Abas */}
        <div className="flex gap-4 mb-8 border-b border-purple-500/30">
          <button
            onClick={() => setAbaSelecionada('executor')}
            className={`px-4 py-2 font-semibold transition ${
              abaSelecionada === 'executor'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Executor
          </button>
          <button
            onClick={() => setAbaSelecionada('historico')}
            className={`px-4 py-2 font-semibold transition ${
              abaSelecionada === 'historico'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Histórico ({execucoes.length})
          </button>
        </div>

        {/* Conteúdo das Abas */}
        {abaSelecionada === 'executor' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Seleção de Scripts */}
            <div className="lg:col-span-1">
              <h2 className="text-xl font-bold mb-4 text-purple-300">Scripts Disponíveis</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {SCRIPTS.map(script => (
                  <button
                    key={script.id}
                    onClick={() => {
                      setScriptSelecionado(script.id);
                      setParametros({});
                    }}
                    className={`w-full text-left p-3 rounded-lg transition ${
                      scriptSelecionado === script.id
                        ? 'bg-purple-600 border border-purple-400'
                        : 'bg-slate-800/50 border border-purple-500/30 hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{script.icone}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{script.nome}</p>
                        <p className="text-xs text-gray-400 truncate">{script.descricao}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Formulário de Parâmetros */}
            <div className="lg:col-span-2">
              {scriptAtual ? (
                <Card className="bg-slate-800/50 border-purple-500/30 p-6">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <span>{scriptAtual.icone}</span>
                    {scriptAtual.nome}
                  </h2>
                  <p className="text-gray-300 mb-6">{scriptAtual.descricao}</p>

                  {/* Parâmetros */}
                  <div className="space-y-4 mb-6">
                    {scriptAtual.parametros.map(param => (
                      <div key={param.nome}>
                        <label className="block text-sm font-semibold mb-2">
                          {param.label}
                          {param.obrigatorio && <span className="text-red-400">*</span>}
                        </label>

                        {param.tipo === 'text' && (
                          <Input
                            type="text"
                            placeholder={`Digite ${param.label.toLowerCase()}`}
                            value={parametros[param.nome] || ''}
                            onChange={e => setParametros(prev => ({ ...prev, [param.nome]: e.target.value }))}
                            className="bg-slate-700/50 border-purple-500/30 text-white placeholder-gray-500"
                          />
                        )}

                        {param.tipo === 'textarea' && (
                          <textarea
                            placeholder={`Digite ${param.label.toLowerCase()}`}
                            value={parametros[param.nome] || ''}
                            onChange={e => setParametros(prev => ({ ...prev, [param.nome]: e.target.value }))}
                            className="w-full bg-slate-700/50 border border-purple-500/30 rounded text-white placeholder-gray-500 p-3 min-h-24"
                          />
                        )}

                        {param.tipo === 'number' && (
                          <Input
                            type="number"
                            placeholder={`Digite ${param.label.toLowerCase()}`}
                            value={parametros[param.nome] || ''}
                            onChange={e => setParametros(prev => ({ ...prev, [param.nome]: parseInt(e.target.value) }))}
                            className="bg-slate-700/50 border-purple-500/30 text-white"
                          />
                        )}

                        {param.tipo === 'select' && (
                          <select
                            value={parametros[param.nome] || ''}
                            onChange={e => setParametros(prev => ({ ...prev, [param.nome]: e.target.value }))}
                            className="w-full bg-slate-700/50 border border-purple-500/30 rounded text-white p-2"
                          >
                            <option value="">Selecione uma opção</option>
                            {param.opcoes?.map(opcao => (
                              <option key={opcao} value={opcao}>{opcao}</option>
                            ))}
                          </select>
                        )}

                        {param.tipo === 'checkbox' && (
                          <input
                            type="checkbox"
                            checked={parametros[param.nome] || false}
                            onChange={e => setParametros(prev => ({ ...prev, [param.nome]: e.target.checked }))}
                            className="w-4 h-4"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Estatísticas */}
                  {analytics?.stats && (
                    <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-slate-700/30 rounded">
                      <div>
                        <p className="text-xs text-gray-400">Taxa de Sucesso</p>
                        <p className="text-lg font-bold text-green-400">{analytics.stats.successRate.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Tempo Médio</p>
                        <p className="text-lg font-bold text-blue-400">{(analytics.stats.averageExecutionTime / 1000).toFixed(1)}s</p>
                      </div>
                    </div>
                  )}

                  {/* Botão de Execução */}
                  <Button
                    onClick={handleExecutar}
                    disabled={isPending || executando}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 rounded-lg transition"
                  >
                    {isPending || executando ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Executando...
                      </>
                    ) : (
                      'Executar Script'
                    )}
                  </Button>
                </Card>
              ) : (
                <Card className="bg-slate-800/50 border-purple-500/30 p-8 text-center">
                  <p className="text-gray-400">Selecione um script para começar</p>
                </Card>
              )}
            </div>
          </div>
        ) : (
          /* Histórico */
          <div className="space-y-4">
            {execucoes.length === 0 ? (
              <Card className="bg-slate-800/50 border-purple-500/30 p-8 text-center">
                <Clock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">Nenhuma execução ainda</p>
              </Card>
            ) : (
              execucoes.map(exec => (
                <Card key={exec.id} className="bg-slate-800/50 border-purple-500/30 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {exec.status === 'sucesso' && <CheckCircle className="w-5 h-5 text-green-400" />}
                      {exec.status === 'erro' && <AlertCircle className="w-5 h-5 text-red-400" />}
                      {exec.status === 'executando' && <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />}
                      <div>
                        <p className="font-semibold">{SCRIPTS.find(s => s.id === exec.scriptId)?.nome}</p>
                        <p className="text-xs text-gray-400">{exec.dataInicio.toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                    {exec.resultado && (
                      <Button size="sm" variant="outline" className="text-xs">
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>
                  {exec.resultado && (
                    <pre className="bg-slate-900/50 p-3 rounded text-xs overflow-x-auto max-h-32 text-green-400">
                      {exec.resultado.slice(0, 500)}...
                    </pre>
                  )}
                  {exec.erro && (
                    <pre className="bg-slate-900/50 p-3 rounded text-xs overflow-x-auto max-h-32 text-red-400">
                      {exec.erro}
                    </pre>
                  )}
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
