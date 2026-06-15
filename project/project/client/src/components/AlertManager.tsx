/**
 * ALERT MANAGER - Gerenciador de Alertas Customizáveis
 */

import { useState } from 'react';
import { Plus, Trash2, ToggleLeft, ToggleRight, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/hooks/useToast';

interface Alert {
  id: string;
  name: string;
  type: 'performance' | 'failure' | 'threshold' | 'trend';
  threshold?: number;
  isEnabled: boolean;
  createdAt: Date;
}

// Mock alerts
const MOCK_ALERTS: Alert[] = [
  {
    id: 'alert-1',
    name: 'Taxa de Sucesso Baixa',
    type: 'performance',
    threshold: 80,
    isEnabled: true,
    createdAt: new Date(Date.now() - 7 * 24 * 3600000),
  },
  {
    id: 'alert-2',
    name: 'Falha de Execução',
    type: 'failure',
    threshold: 5,
    isEnabled: true,
    createdAt: new Date(Date.now() - 3 * 24 * 3600000),
  },
  {
    id: 'alert-3',
    name: 'Tempo de Execução Alto',
    type: 'threshold',
    threshold: 60000,
    isEnabled: false,
    createdAt: new Date(Date.now() - 1 * 24 * 3600000),
  },
];

const ALERT_TEMPLATES = [
  { id: 'template-1', name: 'Taxa de Sucesso < 85%', type: 'performance' },
  { id: 'template-2', name: 'Mais de 5 falhas', type: 'failure' },
  { id: 'template-3', name: 'Tempo > 60s', type: 'threshold' },
  { id: 'template-4', name: 'Tendência Negativa', type: 'trend' },
];

export function AlertManager() {
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [alertName, setAlertName] = useState('');
  const [alertType, setAlertType] = useState<'performance' | 'failure' | 'threshold' | 'trend'>('performance');
  const [threshold, setThreshold] = useState<string>('80');
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [editingThreshold, setEditingThreshold] = useState<{ alertId: string; value: string } | null>(null);
  const { success, error } = useToast();

  // Mutations
  const createAlertMutation = trpc.alertsCustomizable.createAlert.useMutation({
    onSuccess: () => {
      setAlertName('');
      setThreshold('80');
      setFeedbackMessage({ type: 'success', message: 'Alerta criado com sucesso!' });
      setTimeout(() => setFeedbackMessage(null), 3000);
    },
    onError: (error) => {
      setFeedbackMessage({ type: 'error', message: `Erro ao criar alerta: ${error.message}` });
    },
  });

  const updateAlertMutation = trpc.alertsCustomizable.updateAlert.useMutation({
    onSuccess: () => {
      setEditingThreshold(null);
      setFeedbackMessage({ type: 'success', message: 'Alerta atualizado com sucesso!' });
      success('Alerta atualizado com sucesso!');
      setTimeout(() => setFeedbackMessage(null), 3000);
    },
    onError: (err) => {
      const errorMsg = `Erro ao atualizar alerta: ${err.message}`;
      setFeedbackMessage({ type: 'error', message: errorMsg });
      error(errorMsg);
      setEditingThreshold(null);
    },
  });

  const deleteAlertMutation = trpc.alertsCustomizable.deleteAlert.useMutation({
    onSuccess: () => {
      setFeedbackMessage({ type: 'success', message: 'Alerta deletado com sucesso!' });
      success('Alerta deletado com sucesso!');
      setTimeout(() => setFeedbackMessage(null), 3000);
    },
    onError: (err) => {
      const errorMsg = `Erro ao deletar alerta: ${err.message}`;
      setFeedbackMessage({ type: 'error', message: errorMsg });
      error(errorMsg);
    },
  });

  // Validation
  const validateThreshold = (value: string): boolean => {
    const num = parseFloat(value);
    return !isNaN(num) && isFinite(num) && num > 0;
  };

  const handleCreateAlert = async () => {
    if (!alertName || !validateThreshold(threshold)) {
      const errorMsg = 'Preencha todos os campos corretamente';
      setFeedbackMessage({ type: 'error', message: errorMsg });
      error(errorMsg);
      return;
    }

    try {
      await createAlertMutation.mutateAsync({
        name: alertName,
        type: alertType,
        condition: `${alertType} > ${threshold}`,
        threshold: parseFloat(threshold),
      });

      // Add to local state
      const newAlert: Alert = {
        id: `alert-${Date.now()}`,
        name: alertName,
        type: alertType,
        threshold: parseFloat(threshold),
        isEnabled: true,
        createdAt: new Date(),
      };
      setAlerts([...alerts, newAlert]);
    } catch (error) {
      console.error('Erro ao criar alerta:', error);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      await deleteAlertMutation.mutateAsync({ alertId });
      setAlerts(alerts.filter(a => a.id !== alertId));
    } catch (error) {
      console.error('Erro ao deletar alerta:', error);
    }
  };

  const handleToggleAlert = (alertId: string) => {
    setAlerts(
      alerts.map(a =>
        a.id === alertId ? { ...a, isEnabled: !a.isEnabled } : a
      )
    );
  };

  const handleSaveThreshold = async (alertId: string, newValue: string) => {
    if (!validateThreshold(newValue)) {
      setFeedbackMessage({ type: 'error', message: 'Valor inválido' });
      return;
    }

    try {
      await updateAlertMutation.mutateAsync({
        alertId,
        threshold: parseFloat(newValue),
      });

      setAlerts(
        alerts.map(a =>
          a.id === alertId ? { ...a, threshold: parseFloat(newValue) } : a
        )
      );
    } catch (error) {
      console.error('Erro ao atualizar alerta:', error);
    }
  };

  const handleCreateFromTemplate = async (templateId: string) => {
    const template = ALERT_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    try {
      await createAlertMutation.mutateAsync({
        name: template.name,
        type: template.type as any,
        condition: `${template.type} > 80`,
        threshold: 80,
      });

      const newAlert: Alert = {
        id: `alert-${Date.now()}`,
        name: template.name,
        type: template.type as any,
        threshold: 80,
        isEnabled: true,
        createdAt: new Date(),
      };
      setAlerts([...alerts, newAlert]);
      setSelectedTemplate('');
    } catch (error) {
      console.error('Erro ao criar alerta:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Message */}
      {feedbackMessage && (
        <div className={`p-3 rounded-lg flex items-center gap-2 ${
          feedbackMessage.type === 'success'
            ? 'bg-green-900/20 border border-green-500/30 text-green-300'
            : 'bg-red-900/20 border border-red-500/30 text-red-300'
        }`}>
          {feedbackMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <XCircle className="w-4 h-4" />
          )}
          {feedbackMessage.message}
        </div>
      )}

      {/* Create Alert Form */}
      <Card className="p-6 bg-slate-800/50 border-purple-500/20">
        <h3 className="text-lg font-semibold mb-4">Criar Novo Alerta</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Nome do Alerta</label>
              <Input
                placeholder="Ex: Taxa de Sucesso Baixa"
                value={alertName}
                onChange={(e) => setAlertName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo</label>
              <Select value={alertType} onValueChange={(value) => setAlertType(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="failure">Falha</SelectItem>
                  <SelectItem value="threshold">Threshold</SelectItem>
                  <SelectItem value="trend">Tendência</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Threshold</label>
            <Input
              type="number"
              placeholder="80"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
            />
          </div>
          <Button onClick={handleCreateAlert} className="w-full gap-2">
            <Plus className="w-4 h-4" />
            Criar Alerta
          </Button>
        </div>
      </Card>

      {/* Alert Templates */}
      <Card className="p-6 bg-slate-800/50 border-purple-500/20">
        <h3 className="text-lg font-semibold mb-4">Templates Rápidos</h3>
        <Select value={selectedTemplate} onValueChange={handleCreateFromTemplate}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um template..." />
          </SelectTrigger>
          <SelectContent>
            {ALERT_TEMPLATES.map(template => (
              <SelectItem key={template.id} value={template.id}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {/* Alerts List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Alertas Configurados ({alerts.length})</h3>
        {alerts.length > 0 ? (
          alerts.map(alert => (
            <Card key={alert.id} className="p-4 bg-slate-800/50 border-purple-500/20">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-white">{alert.name}</h4>
                    <div className={`px-2 py-1 rounded text-xs font-semibold ${
                      alert.isEnabled
                        ? 'bg-green-900/30 text-green-300'
                        : 'bg-gray-900/30 text-gray-300'
                    }`}>
                      {alert.isEnabled ? 'Ativo' : 'Inativo'}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">Tipo: {alert.type}</p>
                  {editingThreshold?.alertId === alert.id ? (
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        type="number"
                        value={editingThreshold.value}
                        onChange={(e) => setEditingThreshold({ alertId: alert.id, value: e.target.value })}
                        className="w-24"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSaveThreshold(alert.id, editingThreshold.value)}
                      >
                        Salvar
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 mt-2 cursor-pointer" onClick={() => setEditingThreshold({ alertId: alert.id, value: String(alert.threshold) })}>
                      Threshold: {alert.threshold}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleAlert(alert.id)}
                    className="text-gray-400"
                  >
                    {alert.isEnabled ? (
                      <ToggleRight className="w-4 h-4 text-green-400" />
                    ) : (
                      <ToggleLeft className="w-4 h-4 text-gray-400" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteAlert(alert.id)}
                    className="text-gray-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 text-gray-400">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum alerta configurado</p>
          </div>
        )}
      </div>
    </div>
  );
}
