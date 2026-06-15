import { Queue, Worker, QueueEvents } from 'bullmq';
import { Redis } from 'ioredis';
import { EventEmitter } from 'events';

// Configuração do Redis
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
};

// Tipos de jobs
export type JobType = 'youtube_outlier' | 'transcription' | 'repurpose' | 'video_compile' | 'seo_metadata';

export interface JobData {
  type: JobType;
  userId: string;
  input: Record<string, unknown>;
  priority?: number;
  retries?: number;
}

export interface JobResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  duration: number;
}

// Gerenciador de filas
export class QueueManager extends EventEmitter {
  private queues: Map<JobType, Queue> = new Map();
  private workers: Map<JobType, Worker> = new Map();
  private redis: Redis;
  private queueEvents: Map<JobType, QueueEvents> = new Map();

  constructor() {
    super();
    this.redis = new Redis(redisConfig);
  }

  /**
   * Inicializar filas e workers
   */
  async initialize(): Promise<void> {
    const jobTypes: JobType[] = [
      'youtube_outlier',
      'transcription',
      'repurpose',
      'video_compile',
      'seo_metadata',
    ];

    for (const jobType of jobTypes) {
      await this.initializeQueue(jobType);
    }

    console.log('[QueueManager] Inicializado com sucesso');
  }

  /**
   * Inicializar fila específica
   */
  private async initializeQueue(jobType: JobType): Promise<void> {
    // Criar fila
    const queue = new Queue(jobType, { connection: redisConfig });
    this.queues.set(jobType, queue);

    // Criar eventos de fila
    const queueEvents = new QueueEvents(jobType, { connection: redisConfig });
    this.queueEvents.set(jobType, queueEvents);

    // Criar worker
    const worker = new Worker(
      jobType,
      async (job) => {
        const startTime = Date.now();
        try {
          console.log(`[${jobType}] Iniciando job ${job.id || 'unknown'}...`);

          // Emitir evento de início
          this.emit('job:start', { jobId: job.id || '', jobType, userId: job.data.userId });

          // Processar job
          const result = await this.processJob(job.data);

          const duration = Date.now() - startTime;

          // Emitir evento de sucesso
          this.emit('job:success', {
            jobId: job.id || '',
            jobType,
            userId: job.data.userId,
            duration,
            result,
          });

          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';

          console.error(`[${jobType}] Erro no job ${job.id}: ${errorMessage}`);

          // Emitir evento de erro
          this.emit('job:error', {
            jobId: job.id || '',
            jobType,
            userId: job.data.userId,
            duration,
            error: errorMessage,
          });

          throw error;
        }
      },
      { connection: redisConfig, concurrency: 2 }
    );

    this.workers.set(jobType, worker);

    // Listeners de eventos
    worker.on('completed', (job) => {
      console.log(`[${jobType}] Job ${job.id || 'unknown'} concluído`);
    });

    worker.on('failed', (job, err) => {
      console.error(`[${jobType}] Job ${job?.id || 'unknown'} falhou: ${err.message}`);
    });
  }

  /**
   * Adicionar job à fila
   */
  async addJob(data: JobData): Promise<string> {
    const queue = this.queues.get(data.type);
    if (!queue) {
      throw new Error(`Fila não encontrada para tipo: ${data.type}`);
    }

    const job = await queue.add(
      `${data.type}-${data.userId}`,
      data,
      {
        priority: data.priority || 5,
        attempts: data.retries || 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      }
    );

    const jobId = job.id || '';
    console.log(`[QueueManager] Job adicionado: ${jobId}`);
    return jobId;
  }

  /**
   * Obter status do job
   */
  async getJobStatus(jobId: string, jobType: JobType): Promise<string> {
    const queue = this.queues.get(jobType);
    if (!queue) {
      throw new Error(`Fila não encontrada para tipo: ${jobType}`);
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      return 'not_found';
    }

    if (await job.isCompleted()) return 'completed';
    if (await job.isFailed()) return 'failed';
    if (await job.isActive()) return 'active';
    if (await job.isWaiting()) return 'waiting';
    if (await job.isDelayed()) return 'delayed';

    return 'unknown';
  }

  /**
   * Obter resultado do job
   */
  async getJobResult(jobId: string, jobType: JobType): Promise<JobResult | null> {
    const queue = this.queues.get(jobType);
    if (!queue) {
      throw new Error(`Fila não encontrada para tipo: ${jobType}`);
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      return null;
    }

    if (await job.isCompleted()) {
      return {
        success: true,
        data: job.returnvalue as Record<string, unknown>,
        duration: job.finishedOn ? job.finishedOn - job.processedOn! : 0,
      };
    }

    if (await job.isFailed()) {
      return {
        success: false,
        error: job.failedReason || 'Unknown error',
        duration: job.finishedOn ? job.finishedOn - job.processedOn! : 0,
      };
    }

    return null;
  }

  /**
   * Processar job (implementação específica por tipo)
   */
  private async processJob(data: JobData): Promise<Record<string, unknown>> {
    switch (data.type) {
      case 'youtube_outlier':
        return this.processYoutubeOutlier(data.input);
      case 'transcription':
        return this.processTranscription(data.input);
      case 'repurpose':
        return this.processRepurpose(data.input);
      case 'video_compile':
        return this.processVideoCompile(data.input);
      case 'seo_metadata':
        return this.processSeoMetadata(data.input);
      default:
        throw new Error(`Tipo de job desconhecido: ${data.type}`);
    }
  }

  /**
   * Processar YouTube outlier detection
   */
  private async processYoutubeOutlier(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    // Simular processamento
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return {
      channelId: input.channelId,
      outliers: [
        { videoId: 'vid1', views: 100000, title: 'Viral Video 1' },
        { videoId: 'vid2', views: 95000, title: 'Viral Video 2' },
      ],
      average: 45000,
    };
  }

  /**
   * Processar transcrição
   */
  private async processTranscription(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    // Simular processamento
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return {
      audioUrl: input.audioUrl,
      transcription: 'Transcrição do áudio...',
      language: 'pt-BR',
      duration: 120,
    };
  }

  /**
   * Processar repurpose
   */
  private async processRepurpose(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    // Simular processamento
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return {
      originalContent: input.content,
      repurposedIdeas: [
        { platform: 'TikTok', idea: 'Ideia 1' },
        { platform: 'Instagram', idea: 'Ideia 2' },
        { platform: 'YouTube', idea: 'Ideia 3' },
      ],
    };
  }

  /**
   * Processar compilação de vídeo
   */
  private async processVideoCompile(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    // Simular processamento
    await new Promise((resolve) => setTimeout(resolve, 5000));
    return {
      videoUrl: '/manus-storage/video_compiled.mp4',
      duration: 60,
      resolution: '1080x1920',
      format: 'mp4',
    };
  }

  /**
   * Processar metadados SEO
   */
  private async processSeoMetadata(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    // Simular processamento
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      title: 'Título SEO otimizado',
      description: 'Descrição otimizada para YouTube',
      tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
    };
  }

  /**
   * Limpar recursos
   */
  async cleanup(): Promise<void> {
    const workers = Array.from(this.workers.values());
    for (const worker of workers) {
      await worker.close();
    }
    const queues = Array.from(this.queues.values());
    for (const queue of queues) {
      await queue.close();
    }
    const events = Array.from(this.queueEvents.values());
    for (const queueEvent of events) {
      await queueEvent.close();
    }
    await this.redis.quit();
  }
}

class InMemoryQueueManager {
  private jobs = new Map<string, { type: JobType; status: string; result?: Record<string, unknown> }>();

  async addJob(data: JobData): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.jobs.set(jobId, { type: data.type, status: 'queued' });
    return jobId;
  }

  async getJobStatus(jobId: string, jobType: JobType): Promise<string> {
    const job = this.jobs.get(jobId);
    if (!job || job.type !== jobType) return 'not_found';
    return job.status;
  }

  async getJobResult(jobId: string, jobType: JobType): Promise<JobResult | null> {
    const job = this.jobs.get(jobId);
    if (!job || job.type !== jobType) return null;

    return {
      success: job.status === 'completed',
      data: job.result,
      duration: 0,
    };
  }
}

// Singleton
let queueManager: QueueManager | InMemoryQueueManager | null = null;

export async function getQueueManager(): Promise<QueueManager | InMemoryQueueManager> {
  if (!queueManager) {
    if (process.env.NODE_ENV === 'test') {
      queueManager = new InMemoryQueueManager();
    } else {
      try {
        queueManager = new QueueManager();
        await queueManager.initialize();
      } catch (error) {
        console.warn('[QueueManager] Falling back to in-memory queue:', error);
        queueManager = new InMemoryQueueManager();
      }
    }
  }
  return queueManager;
}
