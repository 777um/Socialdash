/**
 * NOTIFICATION PREFERENCES - Página de Preferências de Notificação
 */

import { useState } from 'react';
import { Settings, Bell, Mail, MessageSquare, Zap, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/useToast';

interface NotificationPreference {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  channels: {
    inApp: boolean;
    email: boolean;
    webhook: boolean;
  };
}

const DEFAULT_PREFERENCES: NotificationPreference[] = [
  {
    id: 'job-completed',
    name: 'Job Concluído',
    description: 'Notificação quando um job de processamento é concluído',
    enabled: true,
    channels: {
      inApp: true,
      email: true,
      webhook: false,
    },
  },
  {
    id: 'job-failed',
    name: 'Job Falhou',
    description: 'Notificação quando um job falha durante o processamento',
    enabled: true,
    channels: {
      inApp: true,
      email: true,
      webhook: true,
    },
  },
  {
    id: 'webhook-triggered',
    name: 'Webhook Acionado',
    description: 'Notificação quando um webhook é acionado com sucesso',
    enabled: true,
    channels: {
      inApp: true,
      email: false,
      webhook: false,
    },
  },
  {
    id: 'alert-triggered',
    name: 'Alerta Acionado',
    description: 'Notificação quando um alerta customizado é acionado',
    enabled: true,
    channels: {
      inApp: true,
      email: true,
      webhook: true,
    },
  },
  {
    id: 'quota-warning',
    name: 'Aviso de Quota',
    description: 'Notificação quando você atinge 80% do seu limite de uso',
    enabled: true,
    channels: {
      inApp: true,
      email: true,
      webhook: false,
    },
  },
];

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreference[]>(DEFAULT_PREFERENCES);
  const [emailFrequency, setEmailFrequency] = useState('immediate');
  const [timezone, setTimezone] = useState('America/Sao_Paulo');
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('08:00');
  const { success, error } = useToast();

  const handleTogglePreference = (id: string) => {
    setPreferences(
      preferences.map(pref =>
        pref.id === id ? { ...pref, enabled: !pref.enabled } : pref
      )
    );
  };

  const handleToggleChannel = (id: string, channel: 'inApp' | 'email' | 'webhook') => {
    setPreferences(
      preferences.map(pref =>
        pref.id === id
          ? {
              ...pref,
              channels: {
                ...pref.channels,
                [channel]: !pref.channels[channel],
              },
            }
          : pref
      )
    );
  };

  const handleSave = async () => {
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 500));
      success('Preferências salvas com sucesso!');
    } catch (err) {
      error('Erro ao salvar preferências');
    }
  };

  const enabledCount = preferences.filter(p => p.enabled).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Preferências de Notificação
            </h1>
          </div>
          <p className="text-gray-400">
            Customize como e quando você recebe notificações do seu dashboard
          </p>
        </div>

        {/* Global Settings */}
        <Card className="bg-slate-800/50 border-purple-500/30 p-6 mb-8">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-400" />
            Configurações Globais
          </h2>

          <div className="space-y-6">
            {/* Email Frequency */}
            <div>
              <Label className="text-white mb-2 block">Frequência de Resumo por Email</Label>
              <Select value={emailFrequency} onValueChange={setEmailFrequency}>
                <SelectTrigger className="bg-slate-900/50 border-purple-500/30 w-full md:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Imediato</SelectItem>
                  <SelectItem value="hourly">A cada hora</SelectItem>
                  <SelectItem value="daily">Diariamente</SelectItem>
                  <SelectItem value="weekly">Semanalmente</SelectItem>
                  <SelectItem value="never">Nunca</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Timezone */}
            <div>
              <Label className="text-white mb-2 block">Fuso Horário</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger className="bg-slate-900/50 border-purple-500/30 w-full md:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Leste (EST)</SelectItem>
                  <SelectItem value="America/Chicago">Centro (CST)</SelectItem>
                  <SelectItem value="America/Denver">Montanha (MST)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacífico (PST)</SelectItem>
                  <SelectItem value="America/Sao_Paulo">São Paulo (BRT)</SelectItem>
                  <SelectItem value="Europe/London">Londres (GMT)</SelectItem>
                  <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tóquio (JST)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quiet Hours */}
            <div className="border-t border-purple-500/20 pt-6">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-white">Horas Silenciosas</Label>
                <Switch checked={quietHoursEnabled} onCheckedChange={setQuietHoursEnabled} />
              </div>

              {quietHoursEnabled && (
                <div className="grid grid-cols-2 gap-4 ml-4">
                  <div>
                    <Label className="text-sm text-gray-400 block mb-2">Início</Label>
                    <input
                      type="time"
                      value={quietHoursStart}
                      onChange={(e) => setQuietHoursStart(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900/50 border border-purple-500/30 rounded text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-400 block mb-2">Fim</Label>
                    <input
                      type="time"
                      value={quietHoursEnd}
                      onChange={(e) => setQuietHoursEnd(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900/50 border border-purple-500/30 rounded text-white"
                    />
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Durante as horas silenciosas, apenas notificações críticas serão entregues
              </p>
            </div>
          </div>
        </Card>

        {/* Notification Types */}
        <Card className="bg-slate-800/50 border-purple-500/30 p-6 mb-8">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-400" />
            Tipos de Notificação ({enabledCount}/{preferences.length} ativados)
          </h2>

          <div className="space-y-6">
            {preferences.map(pref => (
              <div key={pref.id} className="border-b border-purple-500/20 pb-6 last:border-0 last:pb-0">
                {/* Preference Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-white">{pref.name}</h3>
                      <Switch
                        checked={pref.enabled}
                        onCheckedChange={() => handleTogglePreference(pref.id)}
                      />
                    </div>
                    <p className="text-sm text-gray-400">{pref.description}</p>
                  </div>
                </div>

                {/* Channels */}
                {pref.enabled && (
                  <div className="ml-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                      <Bell className="w-4 h-4 text-blue-400" />
                      <Label className="text-sm text-gray-300 cursor-pointer flex items-center gap-2">
                        <Switch
                          checked={pref.channels.inApp}
                          onCheckedChange={() => handleToggleChannel(pref.id, 'inApp')}
                        />
                        No App
                      </Label>
                    </div>

                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-green-400" />
                      <Label className="text-sm text-gray-300 cursor-pointer flex items-center gap-2">
                        <Switch
                          checked={pref.channels.email}
                          onCheckedChange={() => handleToggleChannel(pref.id, 'email')}
                        />
                        Email
                      </Label>
                    </div>

                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-4 h-4 text-purple-400" />
                      <Label className="text-sm text-gray-300 cursor-pointer flex items-center gap-2">
                        <Switch
                          checked={pref.channels.webhook}
                          onCheckedChange={() => handleToggleChannel(pref.id, 'webhook')}
                        />
                        Webhook
                      </Label>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button variant="outline">Cancelar</Button>
          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Salvar Preferências
          </Button>
        </div>
      </div>
    </div>
  );
}
