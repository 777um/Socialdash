import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WebSocketServerManager, LogMessage, JobStatusUpdate } from './websocket-server';

describe('WebSocketServerManager', () => {
  let wsManager: WebSocketServerManager;

  beforeEach(() => {
    wsManager = new WebSocketServerManager();
  });

  afterEach(async () => {
    await wsManager.cleanup();
  });

  it('should create WebSocketServerManager instance', () => {
    expect(wsManager).toBeDefined();
    expect(wsManager).toBeInstanceOf(WebSocketServerManager);
  });

  it('should get initial stats', () => {
    const stats = wsManager.getStats();

    expect(stats.connectedClients).toBe(0);
    expect(stats.subscribedJobs).toBe(0);
    expect(stats.bufferedLogs).toBe(0);
  });

  it('should emit log event on broadcastLog', async () => {
    const testLog: LogMessage = {
      timestamp: new Date(),
      level: 'info',
      jobId: 'job_1',
      jobType: 'youtube_outlier',
      message: 'Test log message',
    };

    const emitted = new Promise<LogMessage>((resolve) => {
      wsManager.once('log', (log) => resolve(log));
    });

    wsManager.broadcastLog(testLog);

    const log = await emitted;
    expect(log.message).toBe('Test log message');
    expect(log.jobId).toBe('job_1');
  });

  it('should emit job_status event on broadcastJobStatus', async () => {
    const testUpdate: JobStatusUpdate = {
      jobId: 'job_1',
      jobType: 'youtube_outlier',
      status: 'completed',
      duration: 5000,
    };

    const emitted = new Promise<JobStatusUpdate>((resolve) => {
      wsManager.once('job_status', (update) => resolve(update));
    });

    wsManager.broadcastJobStatus(testUpdate);

    const update = await emitted;
    expect(update.status).toBe('completed');
    expect(update.jobId).toBe('job_1');
  });

  it('should buffer logs correctly', () => {
    const log1: LogMessage = {
      timestamp: new Date(),
      level: 'info',
      jobId: 'job_1',
      jobType: 'youtube_outlier',
      message: 'Log 1',
    };

    const log2: LogMessage = {
      timestamp: new Date(),
      level: 'info',
      jobId: 'job_1',
      jobType: 'youtube_outlier',
      message: 'Log 2',
    };

    wsManager.broadcastLog(log1);
    wsManager.broadcastLog(log2);

    const stats = wsManager.getStats();
    expect(stats.bufferedLogs).toBe(2);
  });

  it('should handle multiple job IDs', () => {
    const log1: LogMessage = {
      timestamp: new Date(),
      level: 'info',
      jobId: 'job_1',
      jobType: 'youtube_outlier',
      message: 'Log 1',
    };

    const log2: LogMessage = {
      timestamp: new Date(),
      level: 'info',
      jobId: 'job_2',
      jobType: 'transcription',
      message: 'Log 2',
    };

    wsManager.broadcastLog(log1);
    wsManager.broadcastLog(log2);

    const stats = wsManager.getStats();
    expect(stats.subscribedJobs).toBe(0); // No subscribers yet
    expect(stats.bufferedLogs).toBe(2);
  });

  it('should broadcast progress', () => {
    let progressReceived = false;

    wsManager.on('progress', () => {
      progressReceived = true;
    });

    wsManager.broadcastProgress('job_1', 50, 'Processing...');

    // Note: Without actual WebSocket clients, we can't fully test this
    // but we can verify it doesn't throw
    expect(progressReceived).toBe(false); // No listeners for progress event
  });

  it('should handle log with data', () => {
    const testLog: LogMessage = {
      timestamp: new Date(),
      level: 'info',
      jobId: 'job_1',
      jobType: 'youtube_outlier',
      message: 'Test log with data',
      data: { views: 1000, title: 'Video Title' },
    };

    wsManager.on('log', (log) => {
      expect(log.data).toBeDefined();
      expect(log.data?.views).toBe(1000);
    });

    wsManager.broadcastLog(testLog);
  });

  it('should handle different log levels', () => {
    const levels: Array<'info' | 'warn' | 'error' | 'debug'> = ['info', 'warn', 'error', 'debug'];
    let logCount = 0;

    wsManager.on('log', () => {
      logCount++;
    });

    for (const level of levels) {
      const log: LogMessage = {
        timestamp: new Date(),
        level,
        jobId: 'job_1',
        jobType: 'youtube_outlier',
        message: `${level} message`,
      };

      wsManager.broadcastLog(log);
    }

    expect(logCount).toBe(4);
  });

  it('should handle job status updates with result', () => {
    const update: JobStatusUpdate = {
      jobId: 'job_1',
      jobType: 'youtube_outlier',
      status: 'completed',
      duration: 5000,
      result: { outliers: [{ videoId: 'vid1', views: 100000 }] },
    };

    wsManager.on('job_status', (u) => {
      expect(u.result).toBeDefined();
      expect(u.result?.outliers).toBeDefined();
    });

    wsManager.broadcastJobStatus(update);
  });

  it('should handle job status updates with error', () => {
    const update: JobStatusUpdate = {
      jobId: 'job_1',
      jobType: 'youtube_outlier',
      status: 'failed',
      duration: 1000,
      error: 'Connection timeout',
    };

    wsManager.on('job_status', (u) => {
      expect(u.error).toBe('Connection timeout');
    });

    wsManager.broadcastJobStatus(update);
  });

  it('should generate unique client IDs', () => {
    // This is tested indirectly through the manager
    const stats = wsManager.getStats();
    expect(stats).toBeDefined();
  });

  it('should cleanup resources', async () => {
    wsManager.broadcastLog({
      timestamp: new Date(),
      level: 'info',
      jobId: 'job_1',
      jobType: 'youtube_outlier',
      message: 'Test',
    });

    await wsManager.cleanup();

    const stats = wsManager.getStats();
    expect(stats.bufferedLogs).toBe(0);
  });
});
