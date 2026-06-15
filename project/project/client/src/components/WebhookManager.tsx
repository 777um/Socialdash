/**
 * WEBHOOK MANAGER - Gerenciamento de Webhooks para Zapier/Make
 */

import { useState } from 'react';
import { Plus, Trash2, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/hooks/useToast';

type ScriptType = 
  | 'youtube_outlier_detector'
  | 'audio_transcriber_free'
  | 'repurpose_script'
  | 'seo_metadata_script'
  | 'multi_channel_orchestrator'
  | 'monetization_funnel_optimizer'
  | 'affiliate_tracking_dashboard';

interface Webhook {
  id: string;
  scriptType: ScriptType;
  webhookUrl: string;
  isActive: boolean;
  lastTriggered?: Date;
  createdAt: Date;
}

// Mock webhooks
const MOCK_WEBHOOKS: Webhook[] = [
  {
    id: 'webhook-1',
    scriptType: 'youtube_outlier_detector',
    webhookUrl: 'https://hooks.zapier.com/hooks/catch/1234567/abc123',
    isActive: true,
    lastTriggered: new Date(Date.now() - 5 * 60000),
    createdAt: new Date(Date.now() - 7 * 24 * 3600000),
  },
  {
    id: 'webhook-2',
    scriptType: 'repurpose_script',
    webhookUrl: 'https://make.com/webhooks/1234567/xyz789',
    isActive: true,
    lastTriggered: new Date(Date.now() - 30 * 60000),
    createdAt: new Date(Date.now() - 3 * 24 * 3600000),
  },
];

export function WebhookManager() {
  const [webhooks, setWebhooks] = useState<Webhook[]>(MOCK_WEBHOOKS);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedScript, setSelectedScript] = useState<ScriptType>('youtube_outlier_detector');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const { success, error, info } = useToast();

  const validateMutation = trpc.webhooks.validate.useMutation({
    onSuccess: () => {
      setValidationStatus('success');
      success('Webhook validado com sucesso!');
      setTimeout(() => setValidationStatus('idle'), 3000);
    },
    onError: (err) => {
      setValidationStatus('error');
      error(`Erro ao validar webhook: ${err.message}`);
      setTimeout(() => setValidationStatus('idle'), 3000);
    },
  });

  const handleAddWebhook = async () => {
    if (!webhookUrl) {
      error('Preencha a URL do webhook');
      return;
    }

    // Validate webhook URL
    setValidationStatus('loading');
    try {
      await validateMutation.mutateAsync({ webhookUrl });

      const newWebhook: Webhook = {
        id: `webhook-${Date.now()}`,
        scriptType: selectedScript,
        webhookUrl,
        isActive: true,
        createdAt: new Date(),
      };

      setWebhooks([...webhooks, newWebhook]);
      setWebhookUrl('');
      setIsOpen(false);
      setValidationStatus('success');
      success('Webhook adicionado com sucesso!');
      setTimeout(() => setValidationStatus('idle'), 3000);
    } catch (err) {
      console.error('Erro ao validar webhook:', err);
      setValidationStatus('error');
      error(`Erro ao adicionar webhook: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }
  };

  const handleDeleteWebhook = (id: string) => {
    setWebhooks(webhooks.filter(w => w.id !== id));
    success('Webhook deletado com sucesso!');
  };

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    info('URL copiada para a área de transferência');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const scriptLabels: Record<ScriptType, string> = {
    youtube_outlier_detector: 'YouTube Outlier Detector',
    audio_transcriber_free: 'Audio Transcriber',
    repurpose_script: 'Repurpose Script',
    seo_metadata_script: 'SEO Metadata',
    multi_channel_orchestrator: 'Multi-Channel Orchestrator',
    monetization_funnel_optimizer: 'Monetization Funnel',
    affiliate_tracking_dashboard: 'Affiliate Tracking',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Webhooks Configurados</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Webhook
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Webhook</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Script Type</Label>
                <Select value={selectedScript} onValueChange={(value) => setSelectedScript(value as ScriptType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(scriptLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Webhook URL</Label>
                <Input
                  placeholder="https://hooks.zapier.com/..."
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
              </div>
              {validationStatus === 'success' && (
                <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg flex items-center gap-2 text-green-300">
                  <CheckCircle className="w-4 h-4" />
                  Webhook válido!
                </div>
              )}
              {validationStatus === 'error' && (
                <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-300">
                  <AlertCircle className="w-4 h-4" />
                  URL inválida. Verifique e tente novamente.
                </div>
              )}
              <Button onClick={handleAddWebhook} disabled={validationStatus === 'loading'} className="w-full">
                {validationStatus === 'loading' ? 'Validando...' : 'Adicionar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Webhooks List */}
      {webhooks.length > 0 ? (
        <div className="space-y-3">
          {webhooks.map(webhook => (
            <Card key={webhook.id} className="p-4 bg-slate-800/50 border-purple-500/20">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-white">{scriptLabels[webhook.scriptType]}</h4>
                    <div className={`px-2 py-1 rounded text-xs font-semibold ${
                      webhook.isActive
                        ? 'bg-green-900/30 text-green-300'
                        : 'bg-gray-900/30 text-gray-300'
                    }`}>
                      {webhook.isActive ? 'Ativo' : 'Inativo'}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 truncate">{webhook.webhookUrl}</p>
                  {webhook.lastTriggered && (
                    <p className="text-xs text-gray-500 mt-2">
                      Último disparo: {new Date(webhook.lastTriggered).toLocaleTimeString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyUrl(webhook.webhookUrl, webhook.id)}
                    className="text-gray-400 hover:text-purple-400"
                  >
                    {copiedId === webhook.id ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteWebhook(webhook.id)}
                    className="text-gray-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum webhook configurado</p>
          <p className="text-sm mt-2">Crie um novo webhook para começar</p>
        </div>
      )}

      {/* Documentation */}
      <Card className="p-4 bg-blue-900/20 border-blue-500/30">
        <h4 className="font-semibold text-blue-300 mb-2">Como usar com Zapier/Make:</h4>
        <ol className="text-sm text-blue-200 space-y-1 list-decimal list-inside">
          <li>Copie a URL do webhook acima</li>
          <li>Cole em seu Zap/Automação do Make</li>
          <li>Configure os dados que deseja enviar</li>
          <li>Teste o webhook</li>
        </ol>
      </Card>
    </div>
  );
}
