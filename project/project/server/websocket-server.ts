import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { EventEmitter } from 'events';

export interface LogMessage {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  jobId: string;
  jobType: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface JobStatusUpdate {
  jobId: string;
  jobType: string;
  status: 'queued' | 'active' | 'completed' | 'failed';
  progress?: number;
  duration?: number;
  result?: Record<string, unknown>;
  error?: string;
}

export class WebSocketServerManager extends EventEmitter {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, Set<WebSocket>> = new Map();
  private logBuffer: Map<string, LogMessage[]> = new Map();
  private maxBufferSize = 100;

  /**
   * Inicializar WebSocket server
   */
  async initialize(httpServer: Server): Promise<void> {
    this.wss = new WebSocketServer({ server: httpServer, path: '/api/ws' });

    this.wss.on('connection', (ws: WebSocket, req: any) => {
      const clientId = this.generateClientId();
      console.log(`[WebSocket] Cliente conectado: ${clientId}`);

      // Enviar ID do cliente
      ws.send(JSON.stringify({ type: 'client_id', clientId }));

      // Listener para mensagens do cliente
      ws.on('message', (data: string) => {
        try {
          const message = JSON.parse(data);
          this.handleClientMessage(clientId, ws, message);
        } catch (error) {
          console.error(`[WebSocket] Erro ao parsear mensagem: ${error}`);
        }
      });

      // Listener para desconexão
      ws.on('close', () => {
        console.log(`[WebSocket] Cliente desconectado: ${clientId}`);
        this.removeClient(clientId, ws);
      });

      // Listener para erro
      ws.on('error', (error: any) => {
        console.error(`[WebSocket] Erro no cliente ${clientId}: ${error.message}`);
      });
    });

    console.log('[WebSocketServerManager] Inicializado com sucesso');
  }

  /**
   * Enviar log para clientes inscritos
   */
  broadcastLog(log: LogMessage): void {
    // Armazenar em buffer
    const key = log.jobId;
    if (!this.logBuffer.has(key)) {
      this.logBuffer.set(key, []);
    }

    const buffer = this.logBuffer.get(key)!;
    buffer.push(log);

    // Manter tamanho máximo do buffer
    if (buffer.length > this.maxBufferSize) {
      buffer.shift();
    }

    // Enviar para clientes inscritos
    const subscribers = this.clients.get(key);
    if (subscribers) {
      const message = JSON.stringify({
        type: 'log',
        log,
      });

      const subscriberArray = Array.from(subscribers);
      for (const client of subscriberArray) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      }
    }

    this.emit('log', log);
  }

  /**
   * Enviar atualização de status do job
   */
  broadcastJobStatus(update: JobStatusUpdate): void {
    const key = update.jobId;
    const subscribers = this.clients.get(key);

    if (subscribers) {
      const message = JSON.stringify({
        type: 'job_status',
        update,
      });

      const subscriberArray = Array.from(subscribers);
      for (const client of subscriberArray) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      }
    }

    this.emit('job_status', update);
  }

  /**
   * Enviar atualização de progresso
   */
  broadcastProgress(jobId: string, progress: number, message?: string): void {
    const subscribers = this.clients.get(jobId);

    if (subscribers) {
      const update = JSON.stringify({
        type: 'progress',
        jobId,
        progress,
        message,
        timestamp: new Date(),
      });

      const subscriberArray = Array.from(subscribers);
      for (const client of subscriberArray) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(update);
        }
      }
    }
  }

  /**
   * Lidar com mensagens do cliente
   */
  private handleClientMessage(clientId: string, ws: WebSocket, message: any): void {
    const { type, jobId } = message;

    if (type === 'subscribe') {
      this.subscribeToJob(clientId, jobId, ws);
    } else if (type === 'unsubscribe') {
      this.unsubscribeFromJob(clientId, jobId, ws);
    } else if (type === 'get_logs') {
      this.sendBufferedLogs(ws, jobId);
    } else if (type === 'ping') {
      ws.send(JSON.stringify({ type: 'pong' }));
    }
  }

  /**
   * Inscrever cliente em job
   */
  private subscribeToJob(clientId: string, jobId: string, ws: WebSocket): void {
    if (!this.clients.has(jobId)) {
      this.clients.set(jobId, new Set());
    }

    this.clients.get(jobId)!.add(ws);

    // Enviar confirmação
    ws.send(JSON.stringify({
      type: 'subscribed',
      jobId,
      message: `Inscrito em ${jobId}`,
    }));

    // Enviar logs em buffer se existirem
    this.sendBufferedLogs(ws, jobId);
  }

  /**
   * Enviar logs em buffer para cliente
   */
  private sendBufferedLogsInternal(ws: WebSocket, jobId: string): void {
    const logs = this.logBuffer.get(jobId) || [];

    ws.send(JSON.stringify({
      type: 'buffered_logs',
      jobId,
      logs,
      count: logs.length,
    }));
  }

  /**
   * Desinscrever cliente de job
   */
  private unsubscribeFromJob(clientId: string, jobId: string, ws: WebSocket): void {
    const subscribers = this.clients.get(jobId);
    if (subscribers) {
      subscribers.delete(ws);

      if (subscribers.size === 0) {
        this.clients.delete(jobId);
      }
    }

    ws.send(JSON.stringify({
      type: 'unsubscribed',
      jobId,
    }));
  }

  /**
   * Enviar logs em buffer para cliente
   */
  private sendBufferedLogs(ws: WebSocket, jobId: string): void {
    const logs = this.logBuffer.get(jobId) || [];

    ws.send(JSON.stringify({
      type: 'buffered_logs',
      jobId,
      logs,
      count: logs.length,
    }));
  }

  /**
   * Remover cliente
   */
  private removeClient(clientId: string, ws: WebSocket): void {
    const entries = Array.from(this.clients.entries());
    for (const [jobId, subscribers] of entries) {
      subscribers.delete(ws);

      if (subscribers.size === 0) {
        this.clients.delete(jobId);
      }
    }
  }

  /**
   * Gerar ID único para cliente
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obter estatísticas
   */
  getStats(): {
    connectedClients: number;
    subscribedJobs: number;
    bufferedLogs: number;
  } {
    let bufferedLogs = 0;
    const logBuffers = Array.from(this.logBuffer.values());
    for (const logs of logBuffers) {
      bufferedLogs += logs.length;
    }

    return {
      connectedClients: this.wss?.clients.size || 0,
      subscribedJobs: this.clients.size,
      bufferedLogs,
    };
  }

  /**
   * Limpar recursos
   */
  async cleanup(): Promise<void> {
    if (this.wss) {
      const clientsArray = Array.from(this.wss.clients);
      for (const client of clientsArray) {
        client.close();
      }
      this.wss.close();
    }

    this.clients.clear();
    this.logBuffer.clear();
  }
}

// Singleton
let wsManager: WebSocketServerManager | null = null;

export async function getWebSocketManager(): Promise<WebSocketServerManager> {
  if (!wsManager) {
    wsManager = new WebSocketServerManager();
  }
  return wsManager;
}
