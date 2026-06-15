/**
 * NOTIFICATION CENTER - Centro de Notificações em Tempo Real
 */

import { useState, useEffect } from 'react';
import { Bell, X, Check, AlertCircle, CheckCircle, Info, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { useNotificationWebSocket } from '@/hooks/useNotificationWebSocket';
import { useToast } from '@/hooks/useToast';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

// Mock notifications para teste
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Script Executado com Sucesso',
    body: 'YouTube Outlier Detector foi executado com 92% de sucesso',
    type: 'success',
    read: false,
    createdAt: new Date(Date.now() - 5 * 60000),
  },
  {
    id: '2',
    title: 'Webhook Disparado',
    body: 'Seu webhook foi acionado 3 vezes nos últimos 10 minutos',
    type: 'info',
    read: false,
    createdAt: new Date(Date.now() - 15 * 60000),
  },
  {
    id: '3',
    title: 'Alerta de Performance',
    body: 'Taxa de sucesso caiu para 78% - Verifique sua configuração',
    type: 'warning',
    read: true,
    createdAt: new Date(Date.now() - 1 * 3600000),
  },
  {
    id: '4',
    title: 'Erro de Transcrição',
    body: 'Falha ao transcrever vídeo - Tente novamente',
    type: 'error',
    read: true,
    createdAt: new Date(Date.now() - 2 * 3600000),
  },
];

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [error, setError] = useState<string | null>(null);
  const [useRealData, setUseRealData] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const { success, error: showError } = useToast();

  // WebSocket integration
  const { isConnected } = useNotificationWebSocket(
    (notification) => {
      // Adicionar notificação recebida via WebSocket
      setNotifications(prev => [notification, ...prev]);
    },
    (notifications) => {
      // Atualizar lista de notificações
      setNotifications(notifications);
    }
  );

  useEffect(() => {
    setWsConnected(isConnected());
  }, [isConnected]);

  // Queries (apenas se usar dados reais)
  const listNotificationsQuery = trpc.notifications.listNotifications.useQuery(
    { limit: 20, unreadOnly: false },
    { enabled: isOpen && useRealData }
  );

  const unreadCountQuery = trpc.notifications.countUnread.useQuery(undefined, { enabled: useRealData });

  // Mutations
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onError: (error) => {
      setError('Erro ao marcar como lida');
      setTimeout(() => setError(null), 3000);
    },
  });

  const deleteNotificationMutation = trpc.notifications.deleteNotification.useMutation({
    onError: (error) => {
      setError('Erro ao deletar notificação');
      setTimeout(() => setError(null), 3000);
    },
  });

  const clearAllMutation = trpc.notifications.clearAll.useMutation({
    onError: (error) => {
      setError('Erro ao limpar notificações');
      setTimeout(() => setError(null), 3000);
    },
  });

  // Atualizar notificações quando a query retorna dados
  useEffect(() => {
    if (useRealData && listNotificationsQuery.data) {
      setNotifications(listNotificationsQuery.data);
      setError(null);
    }
  }, [listNotificationsQuery.data, useRealData]);

  // Lidar com erros de query
  useEffect(() => {
    if (useRealData && listNotificationsQuery.error) {
      setError('Erro ao carregar notificações');
    }
  }, [listNotificationsQuery.error, useRealData]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      if (useRealData) {
        await markAsReadMutation.mutateAsync({ notificationId });
        await unreadCountQuery.refetch();
        await listNotificationsQuery.refetch();
      } else {
        // Mock: marcar como lida localmente
        setNotifications(
          notifications.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
      }
    } catch (err) {
      console.error('Erro ao marcar como lida:', err);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      if (useRealData) {
        await deleteNotificationMutation.mutateAsync({ notificationId });
        await listNotificationsQuery.refetch();
        success('Notificação deletada com sucesso!');
      } else {
        // Mock: deletar localmente
        setNotifications(notifications.filter(n => n.id !== notificationId));
        success('Notificação deletada com sucesso!');
      }
    } catch (err) {
      console.error('Erro ao deletar:', err);
      showError('Erro ao deletar notificação');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Tem certeza que deseja limpar todas as notificações?')) return;

    try {
      if (useRealData) {
        await clearAllMutation.mutateAsync();
        await listNotificationsQuery.refetch();
        success('Todas as notificações foram limpas!');
      } else {
        // Mock: limpar localmente
        setNotifications([]);
        success('Todas as notificações foram limpas!');
      }
    } catch (err) {
      console.error('Erro ao limpar:', err);
      showError('Erro ao limpar notificações');
    }
  };

  // Monitorar conexão WebSocket
  useEffect(() => {
    const checkConnection = setInterval(() => {
      setWsConnected(isConnected());
    }, 1000);
    return () => clearInterval(checkConnection);
  }, [isConnected]);

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-4">
      {/* Header com Controles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold">
            Notificações {unreadCount > 0 && <Badge variant="destructive">{unreadCount}</Badge>}
          </h3>
          <div className="flex items-center gap-1 ml-2">
            <div className={`w-2 h-2 rounded-full ${
              wsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`} />
            <span className="text-xs text-gray-400">
              {wsConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={useRealData ? 'default' : 'outline'}
            onClick={() => setUseRealData(!useRealData)}
            className="text-xs"
          >
            {useRealData ? 'Dados Reais' : 'Dados Demo'}
          </Button>
          {notifications.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleClearAll} className="text-xs">
              Limpar Tudo
            </Button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Notifications List */}
      {notifications.length > 0 ? (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {notifications.map(notification => (
            <Card
              key={notification.id}
              className={`p-4 border-l-4 cursor-pointer transition-all ${
                notification.read
                  ? 'bg-slate-800/30 border-gray-600/30'
                  : 'bg-slate-800/50 border-purple-500/50'
              }`}
              onClick={() => handleMarkAsRead(notification.id)}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">{getIcon(notification.type)}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white">{notification.title}</h4>
                  <p className="text-sm text-gray-300 mt-1">{notification.body}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(notification.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(notification.id);
                  }}
                  className="text-gray-400 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhuma notificação</p>
        </div>
      )}
    </div>
  );
}
