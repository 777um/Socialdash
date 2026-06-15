import { useEffect, useRef, useCallback } from 'react';

export interface NotificationUpdate {
  id: string;
  title: string;
  body: string;
  type: 'success' | 'error' | 'warning' | 'info';
  read: boolean;
  createdAt: Date;
}

interface WebSocketMessage {
  type: 'client_id' | 'notification' | 'notifications_update' | 'pong' | 'subscribed' | 'unsubscribed';
  clientId?: string;
  notification?: NotificationUpdate;
  notifications?: NotificationUpdate[];
  timestamp?: string;
}

export function useNotificationWebSocket(
  onNotification?: (notification: NotificationUpdate) => void,
  onBulkUpdate?: (notifications: NotificationUpdate[]) => void
) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttemptsRef = useRef(5);
  const reconnectDelayRef = useRef(1000);

  const connect = useCallback(() => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/ws`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('[WebSocket] Conectado ao servidor');
        reconnectAttemptsRef.current = 0;
        reconnectDelayRef.current = 1000;

        // Enviar ping para manter conexão viva
        const pingInterval = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping' }));
          } else {
            clearInterval(pingInterval);
          }
        }, 30000);
      };

      wsRef.current.onmessage = (event: MessageEvent<string>) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          if (message.type === 'notification' && message.notification && onNotification) {
            onNotification(message.notification);
          } else if (message.type === 'notifications_update' && message.notifications && onBulkUpdate) {
            onBulkUpdate(message.notifications);
          }
        } catch (error) {
          console.error('[WebSocket] Erro ao processar mensagem:', error);
        }
      };

      wsRef.current.onerror = (error: Event) => {
        console.error('[WebSocket] Erro:', error);
      };

      wsRef.current.onclose = () => {
        console.log('[WebSocket] Desconectado');
        
        // Tentar reconectar com backoff exponencial
        if (reconnectAttemptsRef.current < maxReconnectAttemptsRef.current) {
          reconnectAttemptsRef.current++;
          const delay = reconnectDelayRef.current * Math.pow(2, reconnectAttemptsRef.current - 1);
          console.log(`[WebSocket] Tentando reconectar em ${delay}ms (tentativa ${reconnectAttemptsRef.current})`);
          
          setTimeout(() => {
            connect();
          }, delay);
        } else {
          console.error('[WebSocket] Máximo de tentativas de reconexão atingido');
        }
      };
    } catch (error) {
      console.error('[WebSocket] Erro ao conectar:', error);
    }
  }, [onNotification, onBulkUpdate]);

  const send = useCallback((message: Record<string, any>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocket] Conexão não está aberta');
    }
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const isConnected = useCallback(() => {
    return wsRef.current?.readyState === WebSocket.OPEN;
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    send,
    disconnect,
    isConnected,
  };
}
