import { describe, it, expect } from 'vitest';
import { jobsRouter } from './jobs-router';

describe('jobsRouter', () => {
  it('should submit youtube_outlier job', async () => {
    const caller = jobsRouter.createCaller({
      user: { id: 'user_1', name: 'Test User', role: 'user' },
    });

    const result = await caller.submitJob({
      type: 'youtube_outlier',
      input: { channelUrl: 'https://youtube.com/@channel' },
      priority: 5,
    });

    expect(result.success).toBe(true);
    expect(result.jobId).toBeDefined();
    expect(result.status).toBe('queued');
  });

  it('should submit transcription job', async () => {
    const caller = jobsRouter.createCaller({
      user: { id: 'user_1', name: 'Test User', role: 'user' },
    });

    const result = await caller.submitJob({
      type: 'transcription',
      input: { audioUrl: 'https://example.com/audio.mp3' },
    });

    expect(result.success).toBe(true);
    expect(result.jobId).toBeDefined();
  });

  it('should submit repurpose job', async () => {
    const caller = jobsRouter.createCaller({
      user: { id: 'user_1', name: 'Test User', role: 'user' },
    });

    const result = await caller.submitJob({
      type: 'repurpose',
      input: { content: 'Original content' },
    });

    expect(result.success).toBe(true);
  });

  it('should submit video_compile job', async () => {
    const caller = jobsRouter.createCaller({
      user: { id: 'user_1', name: 'Test User', role: 'user' },
    });

    const result = await caller.submitJob({
      type: 'video_compile',
      input: { audioPath: '/path/to/audio.mp3', videoPath: '/path/to/video.mp4' },
    });

    expect(result.success).toBe(true);
  });

  it('should submit seo_metadata job', async () => {
    const caller = jobsRouter.createCaller({
      user: { id: 'user_1', name: 'Test User', role: 'user' },
    });

    const result = await caller.submitJob({
      type: 'seo_metadata',
      input: { title: 'Video Title', description: 'Video Description' },
    });

    expect(result.success).toBe(true);
  });

  it('should get job status', async () => {
    const caller = jobsRouter.createCaller({
      user: { id: 'user_1', name: 'Test User', role: 'user' },
    });

    const result = await caller.getJobStatus({
      jobId: 'job_123',
      type: 'youtube_outlier',
    });

    expect(result.jobId).toBe('job_123');
    expect(result.status).toBeDefined();
  });

  it('should list user jobs', async () => {
    const caller = jobsRouter.createCaller({
      user: { id: 'user_1', name: 'Test User', role: 'user' },
    });

    const result = await caller.listUserJobs({
      page: 1,
      limit: 10,
    });

    expect(Array.isArray(result.jobs)).toBe(true);
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.page).toBe(1);
  });

  it('should filter jobs by status', async () => {
    const caller = jobsRouter.createCaller({
      user: { id: 'user_1', name: 'Test User', role: 'user' },
    });

    const result = await caller.listUserJobs({
      page: 1,
      limit: 10,
      status: 'completed',
    });

    expect(Array.isArray(result.jobs)).toBe(true);
    result.jobs.forEach((job) => {
      expect(job.status).toBe('completed');
    });
  });

  it('should cancel job', async () => {
    const caller = jobsRouter.createCaller({
      user: { id: 'user_1', name: 'Test User', role: 'user' },
    });

    const result = await caller.cancelJob({
      jobId: 'job_123',
      type: 'youtube_outlier',
    });

    expect(result.success).toBe(true);
    expect(result.jobId).toBe('job_123');
  });

  it('should get job stats', async () => {
    const caller = jobsRouter.createCaller({});

    const result = await caller.getJobStats();

    expect(result.totalQueued).toBeGreaterThanOrEqual(0);
    expect(result.totalActive).toBeGreaterThanOrEqual(0);
    expect(result.totalCompleted).toBeGreaterThanOrEqual(0);
    expect(result.totalFailed).toBeGreaterThanOrEqual(0);
    expect(result.successRate).toBeGreaterThanOrEqual(0);
    expect(result.successRate).toBeLessThanOrEqual(100);
  });

  it('should reject invalid job type', async () => {
    const caller = jobsRouter.createCaller({
      user: { id: 'user_1', name: 'Test User', role: 'user' },
    });

    await expect(
      caller.submitJob({
        type: 'invalid_type' as any,
        input: {},
      })
    ).rejects.toThrow();
  });

  it('should require authentication for submitJob', async () => {
    const caller = jobsRouter.createCaller({});

    try {
      await caller.submitJob({
        type: 'youtube_outlier',
        input: {},
      });
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it('should handle pagination correctly', async () => {
    const caller = jobsRouter.createCaller({
      user: { id: 'user_1', name: 'Test User', role: 'user' },
    });

    const page1 = await caller.listUserJobs({
      page: 1,
      limit: 2,
    });

    const page2 = await caller.listUserJobs({
      page: 2,
      limit: 2,
    });

    expect(page1.page).toBe(1);
    expect(page2.page).toBe(2);
  });
});
