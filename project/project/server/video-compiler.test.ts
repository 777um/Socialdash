import { describe, it, expect, beforeEach } from 'vitest';
import { VideoCompiler } from './video-compiler';

describe('VideoCompiler', () => {
  let videoCompiler: VideoCompiler;

  beforeEach(() => {
    videoCompiler = new VideoCompiler();
  });

  describe('Initialization', () => {
    it('should create VideoCompiler instance', () => {
      expect(videoCompiler).toBeDefined();
      expect(videoCompiler).toBeInstanceOf(VideoCompiler);
    });

    it('should allow custom ffmpeg paths', () => {
      const custom = new VideoCompiler('/custom/ffmpeg', '/custom/ffprobe');
      expect(custom).toBeDefined();
    });
  });

  describe('FFmpeg Arguments', () => {
    it('should build mp4 arguments', () => {
      const args = (videoCompiler as any).buildFFmpegArgs(
        {
          inputPath: 'input.mov',
          outputPath: 'output.mp4',
          format: 'mp4',
          quality: 'high',
        },
        100
      );

      expect(args).toContain('-i');
      expect(args).toContain('input.mov');
      expect(args).toContain('-c:v');
      expect(args).toContain('h264');
      expect(args).toContain('output.mp4');
    });

    it('should build webm arguments', () => {
      const args = (videoCompiler as any).buildFFmpegArgs(
        {
          inputPath: 'input.mov',
          outputPath: 'output.webm',
          format: 'webm',
          quality: 'medium',
        },
        100
      );

      expect(args).toContain('-f');
      expect(args).toContain('webm');
    });

    it('should include resolution if specified', () => {
      const args = (videoCompiler as any).buildFFmpegArgs(
        {
          inputPath: 'input.mov',
          outputPath: 'output.mp4',
          width: 1280,
          height: 720,
        },
        100
      );

      expect(args).toContain('-vf');
      expect(args).toContain('scale=1280:720');
    });

    it('should include fps if specified', () => {
      const args = (videoCompiler as any).buildFFmpegArgs(
        {
          inputPath: 'input.mov',
          outputPath: 'output.mp4',
          fps: 30,
        },
        100
      );

      expect(args).toContain('-r');
      expect(args).toContain('30');
    });

    it('should include custom bitrate if specified', () => {
      const args = (videoCompiler as any).buildFFmpegArgs(
        {
          inputPath: 'input.mov',
          outputPath: 'output.mp4',
          bitrate: '2000k',
        },
        100
      );

      expect(args).toContain('-b:v');
      expect(args).toContain('2000k');
    });

    it('should use quality presets', () => {
      const lowArgs = (videoCompiler as any).buildFFmpegArgs(
        {
          inputPath: 'input.mov',
          outputPath: 'output.mp4',
          quality: 'low',
        },
        100
      );

      const highArgs = (videoCompiler as any).buildFFmpegArgs(
        {
          inputPath: 'input.mov',
          outputPath: 'output.mp4',
          quality: 'high',
        },
        100
      );

      expect(lowArgs).toContain('500k');
      expect(highArgs).toContain('5000k');
    });
  });

  describe('Progress Parsing', () => {
    it('should parse ffmpeg progress output', () => {
      const output = `frame=100 fps=30 q=25.0 Lsize=1024 time=00:00:03.33 bitrate=2048k speed=1.0x`;
      const progress = (videoCompiler as any).parseFFmpegProgress(output, 100);

      expect(progress).toBeDefined();
      expect(progress?.frame).toBe(100);
      expect(progress?.fps).toBe(30);
      expect(progress?.time).toBe('00:00:03.33');
    });

    it('should calculate progress percentage', () => {
      const output = `time=00:00:50.00`;
      const progress = (videoCompiler as any).parseFFmpegProgress(output, 100);

      expect(progress?.progress).toBe(50);
    });

    it('should handle 100% progress', () => {
      const output = `time=00:01:40.00`;
      const progress = (videoCompiler as any).parseFFmpegProgress(output, 100);

      expect(progress?.progress).toBe(100);
    });

    it('should return null for empty output', () => {
      const progress = (videoCompiler as any).parseFFmpegProgress('', 100);
      expect(progress).toBeNull();
    });
  });

  describe('Time Conversion', () => {
    it('should convert time to seconds', () => {
      const seconds = (videoCompiler as any).timeToSeconds('00:00:30');
      expect(seconds).toBe(30);
    });

    it('should convert time with minutes', () => {
      const seconds = (videoCompiler as any).timeToSeconds('00:01:30');
      expect(seconds).toBe(90);
    });

    it('should convert time with hours', () => {
      const seconds = (videoCompiler as any).timeToSeconds('01:00:00');
      expect(seconds).toBe(3600);
    });

    it('should convert complex time', () => {
      const seconds = (videoCompiler as any).timeToSeconds('01:23:45');
      expect(seconds).toBe(5025);
    });

    it('should handle invalid time format', () => {
      const seconds = (videoCompiler as any).timeToSeconds('invalid');
      expect(seconds).toBe(0);
    });
  });

  describe('FPS Parsing', () => {
    it('should parse fps as fraction', () => {
      const fps = (videoCompiler as any).parseFps('30000/1001');
      expect(fps).toBeCloseTo(29.97, 1);
    });

    it('should parse fps as decimal', () => {
      const fps = (videoCompiler as any).parseFps('30');
      expect(fps).toBe(30);
    });

    it('should handle 60fps', () => {
      const fps = (videoCompiler as any).parseFps('60000/1001');
      expect(fps).toBeCloseTo(59.94, 1);
    });

    it('should return 0 for invalid fps', () => {
      const fps = (videoCompiler as any).parseFps('');
      expect(fps).toBe(0);
    });
  });

  describe('Event Emitter', () => {
    it('should emit progress events', async () => {
      let progressCount = 0;

      const completePromise = new Promise<void>((resolve) => {
        videoCompiler.once('complete', () => resolve());
      });

      videoCompiler.on('progress', () => {
        progressCount++;
      });

      videoCompiler.emit('progress', {
        frame: 100,
        fps: 30,
        q: 25,
        Lsize: 1024,
        time: '00:00:03.33',
        bitrate: '2048k',
        speed: '1.0x',
        progress: 50,
      });

      videoCompiler.emit('complete', {
        outputPath: 'output.mp4',
        lastProgress: null,
      });

      await completePromise;
      expect(progressCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Video Formats', () => {
    it('should support mp4 format', () => {
      const args = (videoCompiler as any).buildFFmpegArgs(
        {
          inputPath: 'input.mov',
          outputPath: 'output.mp4',
          format: 'mp4',
        },
        100
      );

      expect(args).toContain('-f');
      expect(args).toContain('mp4');
    });

    it('should support webm format', () => {
      const args = (videoCompiler as any).buildFFmpegArgs(
        {
          inputPath: 'input.mov',
          outputPath: 'output.webm',
          format: 'webm',
        },
        100
      );

      expect(args).toContain('-f');
      expect(args).toContain('webm');
    });

    it('should support mov format', () => {
      const args = (videoCompiler as any).buildFFmpegArgs(
        {
          inputPath: 'input.mov',
          outputPath: 'output.mov',
          format: 'mov',
        },
        100
      );

      expect(args).toContain('-f');
      expect(args).toContain('mov');
    });
  });

  describe('Audio Codecs', () => {
    it('should support aac codec', () => {
      const args = (videoCompiler as any).buildFFmpegArgs(
        {
          inputPath: 'input.mov',
          outputPath: 'output.mp4',
          audioCodec: 'aac',
        },
        100
      );

      expect(args).toContain('-c:a');
      expect(args).toContain('aac');
    });

    it('should support libmp3lame codec', () => {
      const args = (videoCompiler as any).buildFFmpegArgs(
        {
          inputPath: 'input.mov',
          outputPath: 'output.mp4',
          audioCodec: 'libmp3lame',
        },
        100
      );

      expect(args).toContain('-c:a');
      expect(args).toContain('libmp3lame');
    });
  });
});
