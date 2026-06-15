/**
 * NOTIFICATION HISTORY - Página de Histórico de Notificações
 */

import { useState, useMemo } from 'react';
import { Bell, Filter, Download, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/hooks/useToast';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  read: boolean;
  createdAt: Date;
}

// Mock notifications para demo
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Análise Concluída',
    body: 'YouTube Outlier Detector finalizou a análise do canal',
    type: 'success',
    read: true,
    createdAt: new Date(Date.now() - 24 * 3600000),
  },
  {
    id: '2',
    title: 'Erro de Transcrição',
    body: 'Falha ao transcrever vídeo - Tente novamente',
    type: 'error',
    read: true,
    createdAt: new Date(Date.now() - 48 * 3600000),
  },
  {
    id: '3',
    title: 'Webhook Acionado',
    body: 'Zapier webhook foi acionado com sucesso',
    type: 'info',
    read: false,
    createdAt: new Date(Date.now() - 1 * 3600000),
  },
  {
    id: '4',
    title: 'Aviso de Taxa Limite',
    body: 'Você atingiu 80% do limite de requisições',
    type: 'warning',
    read: false,
    createdAt: new Date(Date.now() - 30 * 60000),
  },
];

export default function NotificationHistory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | NotificationType>('all');
  const [filterRead, setFilterRead] = useState<'all' | 'read' | 'unread'>('all');
  const { success, error } = useToast();

  // Queries
  const listNotificationsQuery = trpc.notifications.listNotifications.useQuery(
    { limit: 100, unreadOnly: false },
    { enabled: true }
  );

  // Usar dados do backend ou mock como fallback
  const notifications = listNotificationsQuery.data || MOCK_NOTIFICATIONS;

  // Mutations
  const deleteNotificationMutation = trpc.notifications.deleteNotification.useMutation({
    onSuccess: () => {
      success('Notificação deletada com sucesso!');
    },
    onError: (err) => {
      error(`Erro ao deletar: ${err.message}`);
    },
  });

  const clearAllMutation = trpc.notifications.clearAll.useMutation({
    onSuccess: () => {
      success('Histórico limpo com sucesso!');
    },
    onError: (err) => {
      error(`Erro ao limpar: ${err.message}`);
    },
  });

  // Filtrar notificações
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notif => {
      const matchesSearch =
        notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notif.body.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = filterType === 'all' || notif.type === filterType;

      const matchesRead =
        filterRead === 'all' ||
        (filterRead === 'read' && notif.read) ||
        (filterRead === 'unread' && !notif.read);

      return matchesSearch && matchesType && matchesRead;
    });
  }, [notifications, searchTerm, filterType, filterRead]);

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotificationMutation.mutateAsync({ notificationId });
      await listNotificationsQuery.refetch();
    } catch (err) {
      console.error('Erro ao deletar:', err);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Tem certeza que deseja limpar todo o histórico?')) return;

    try {
      await clearAllMutation.mutateAsync();
      await listNotificationsQuery.refetch();
    } catch (err) {
      console.error('Erro ao limpar:', err);
    }
  };

  const handleExport = () => {
    const csv = [
      ['ID', 'Título', 'Descrição', 'Tipo', 'Lida', 'Data'],
      ...filteredNotifications.map(n => [
        n.id,
        n.title,
        n.body,
        n.type,
        n.read ? 'Sim' : 'Não',
        new Date(n.createdAt).toLocaleString(),
      ]),
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notificacoes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    success('Arquivo exportado com sucesso!');
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
    }
  };

  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'bg-green-900/20 border-green-500/30 text-green-400';
      case 'error':
        return 'bg-red-900/20 border-red-500/30 text-red-400';
      case 'warning':
        return 'bg-yellow-900/20 border-yellow-500/30 text-yellow-400';
      case 'info':
        return 'bg-blue-900/20 border-blue-500/30 text-blue-400';
    }
  };

  // Loading state
  if (listNotificationsQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">⏳</div>
          <p className="text-gray-400">Carregando notificações...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (listNotificationsQuery.isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Erro ao carregar notificações</p>
          <Button onClick={() => listNotificationsQuery.refetch()}>Tentar Novamente</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Histórico de Notificações
            </h1>
          </div>
          <p className="text-gray-400">
            Visualize e gerencie todo o histórico de notificações do seu dashboard
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-purple-500/30 p-4">
            <p className="text-sm text-gray-400 mb-1">Total</p>
            <p className="text-2xl font-bold text-purple-400">{notifications.length}</p>
          </Card>
          <Card className="bg-slate-800/50 border-green-500/30 p-4">
            <p className="text-sm text-gray-400 mb-1">Sucesso</p>
            <p className="text-2xl font-bold text-green-400">
              {notifications.filter(n => n.type === 'success').length}
            </p>
          </Card>
          <Card className="bg-slate-800/50 border-red-500/30 p-4">
            <p className="text-sm text-gray-400 mb-1">Erros</p>
            <p className="text-2xl font-bold text-red-400">
              {notifications.filter(n => n.type === 'error').length}
            </p>
          </Card>
          <Card className="bg-slate-800/50 border-yellow-500/30 p-4">
            <p className="text-sm text-gray-400 mb-1">Não Lidas</p>
            <p className="text-2xl font-bold text-yellow-400">
              {notifications.filter(n => !n.read).length}
            </p>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-slate-800/50 border-purple-500/30 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold">Filtros</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar notificações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-900/50 border-purple-500/30"
              />
            </div>

            {/* Type Filter */}
            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger className="bg-slate-900/50 border-purple-500/30">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
                <SelectItem value="warning">Aviso</SelectItem>
                <SelectItem value="info">Informação</SelectItem>
              </SelectContent>
            </Select>

            {/* Read Filter */}
            <Select value={filterRead} onValueChange={(value: any) => setFilterRead(value)}>
              <SelectTrigger className="bg-slate-900/50 border-purple-500/30">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="read">Lidas</SelectItem>
                <SelectItem value="unread">Não Lidas</SelectItem>
              </SelectContent>
            </Select>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar
              </Button>
              {notifications.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  className="flex-1 flex items-center justify-center gap-2 text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                  Limpar
                </Button>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-400 mt-4">
            Mostrando {filteredNotifications.length} de {notifications.length} notificações
          </p>
        </Card>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map(notification => (
              <Card
                key={notification.id}
                className={`p-4 border-l-4 transition-all ${getTypeColor(notification.type)} ${
                  notification.read ? 'opacity-60' : 'opacity-100'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-2xl mt-1">{getIcon(notification.type)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white">{notification.title}</h3>
                      {!notification.read && (
                        <span className="px-2 py-1 bg-purple-600/50 text-purple-300 text-xs rounded-full">
                          Não Lida
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-300 mb-2">{notification.body}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(notification.id)}
                    className="text-gray-400 hover:text-red-400 flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <Card className="bg-slate-800/30 border-purple-500/20 p-12 text-center">
              <Bell className="w-12 h-12 mx-auto mb-3 text-gray-500 opacity-50" />
              <p className="text-gray-400">Nenhuma notificação encontrada</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
