import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  TrendingUp,
  Bell,
  Webhook,
  Zap,
  Settings,
} from 'lucide-react';
import { KPIDashboard } from './KPIDashboard';
import { TrendAnalysisDashboard } from './TrendAnalysisDashboard';
import { NotificationCenter } from './NotificationCenter';
import { WebhookManager } from './WebhookManager';
import { AlertManager } from './AlertManager';

export function TabsLayout() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Social Media AI Automation
          </h1>
          <p className="text-lg text-gray-300">
            O sistema definitivo para dominar redes sociais em 2026
          </p>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-slate-800/50 border border-purple-500/30 rounded-lg p-1 mb-8">
            <TabsTrigger
              value="overview"
              className="flex items-center gap-2 data-[state=active]:bg-purple-600"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>

            <TabsTrigger
              value="trends"
              className="flex items-center gap-2 data-[state=active]:bg-purple-600"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Tendências</span>
            </TabsTrigger>

            <TabsTrigger
              value="notifications"
              className="flex items-center gap-2 data-[state=active]:bg-purple-600"
            >
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notificações</span>
            </TabsTrigger>

            <TabsTrigger
              value="webhooks"
              className="flex items-center gap-2 data-[state=active]:bg-purple-600"
            >
              <Webhook className="w-4 h-4" />
              <span className="hidden sm:inline">Webhooks</span>
            </TabsTrigger>

            <TabsTrigger
              value="alerts"
              className="flex items-center gap-2 data-[state=active]:bg-purple-600"
            >
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Alertas</span>
            </TabsTrigger>

            <TabsTrigger
              value="settings"
              className="flex items-center gap-2 data-[state=active]:bg-purple-600"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Config</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Contents */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="bg-purple-900/30 border border-purple-500/30 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-purple-400">6</p>
                <p className="text-xs text-gray-400">NICHOS</p>
              </div>
              <div className="bg-purple-900/30 border border-purple-500/30 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-purple-400">60+</p>
                <p className="text-xs text-gray-400">HASHTAGS</p>
              </div>
              <div className="bg-purple-900/30 border border-purple-500/30 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-purple-400">7</p>
                <p className="text-xs text-gray-400">SCRIPTS</p>
              </div>
              <div className="bg-purple-900/30 border border-purple-500/30 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-purple-400">∞</p>
                <p className="text-xs text-gray-400">ROI</p>
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold mb-6 text-purple-300">📊 KPI Dashboard</h2>
              <KPIDashboard />
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-purple-300">📈 Análise de Tendências</h2>
              <TrendAnalysisDashboard />
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-purple-300">🔔 Centro de Notificações</h2>
              <NotificationCenter />
            </div>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-purple-300">🔗 Gerenciador de Webhooks</h2>
              <WebhookManager />
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-purple-300">⚡ Sistema de Alertas</h2>
              <AlertManager />
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="bg-slate-800/50 border border-purple-500/30 rounded-lg p-8">
              <h2 className="text-3xl font-bold mb-6 text-purple-300">⚙️ Configurações</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Preferências de Sistema</h3>
                  <p className="text-gray-400">
                    Configure as preferências globais da plataforma, incluindo notificações,
                    frequência de sincronização e limites de processamento.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Integração de APIs</h3>
                  <p className="text-gray-400">
                    Gerencie suas chaves de API para Groq, OpenAI, YouTube e outras plataformas.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Plano de Assinatura</h3>
                  <p className="text-gray-400">
                    Visualize seu plano atual e faça upgrade para acessar recursos premium.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-12 text-center py-8 border-t border-purple-500/20">
          <p className="text-sm text-gray-400">
            © 2026 Social Media AI Automation. Desenvolvido com ❤️ para criadores de conteúdo
          </p>
        </div>
      </div>
    </div>
  );
}
