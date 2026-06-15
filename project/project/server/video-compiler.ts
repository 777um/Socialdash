import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { EventEmitter } from 'events';

export interface VideoCompileOptions {
  inputPath: string;
  outputPath: string;
  format?: 'mp4' | 'webm' | 'mov';
  quality?: 'low' | 'medium' | 'high';
  width?: number;
  height?: number;
  fps?: number;
  bitrate?: string;
  audioCodec?: 'aac' | 'libmp3lame' | 'libopus';
  videoCodec?: 'h264' | 'h265' | 'vp9' | 'av1';
}

export interface VideoCompileProgress {
  frame: number;
  fps: number;
  q: number;
  Lsize: number;
  time: string;
  bitrate: string;
  speed: string;
  progress: number; // 0-100
}

/**
 * Compilador de vídeos usando FFmpeg
 */
export class VideoCompiler extends EventEmitter {
  private ffmpegPath: string = 'ffmpeg';
  private ffprobePath: string = 'ffprobe';

  constructor(ffmpegPath?: string, ffprobePath?: string) {
    super();
    if (ffmpegPath) this.ffmpegPath = ffmpegPath;
    if (ffprobePath) this.ffprobePath = ffprobePath;
  }

  /**
   * Compilar vídeo com opções customizadas
   */
  async compile(options: VideoCompileOptions): Promise<string> {
    // Validar entrada
    await this.validateInputFile(options.inputPath);

    // Obter duração do vídeo
    const duration = await this.getVideoDuration(options.inputPath);

    // Construir argumentos do FFmpeg
    const args = this.buildFFmpegArgs(options, duration);

    // Executar FFmpeg
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn(this.ffmpegPath, args);
      let stderr = '';
      let lastProgress: VideoCompileProgress | null = null;

      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();

        // Parsear progresso
        const progress = this.parseFFmpegProgress(data.toString(), duration);
        if (progress) {
          lastProgress = progress;
          this.emit('progress', progress);
        }
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          this.emit('complete', {
            outputPath: options.outputPath,
            lastProgress,
          });
          resolve(options.outputPath);
        } else {
          reject(new Error(`FFmpeg falhou com código ${code}: ${stderr}`));
        }
      });

      ffmpeg.on('error', (error) => {
        reject(new Error(`Erro ao executar FFmpeg: ${error.message}`));
      });
    });
  }

  /**
   * Compilar para múltiplos formatos
   */
  async compileMultiple(
    inputPath: string,
    outputDir: string,
    formats: Array<'mp4' | 'webm' | 'mov'>
  ): Promise<string[]> {
    const outputs: string[] = [];

    for (const format of formats) {
      const filename = path.basename(inputPath, path.extname(inputPath));
      const outputPath = path.join(outputDir, `${filename}.${format}`);

      await this.compile({
        inputPath,
        outputPath,
        format,
        quality: 'high',
      });

      outputs.push(outputPath);
    }

    return outputs;
  }

  /**
   * Extrair thumbnail do vídeo
   */
  async extractThumbnail(
    inputPath: string,
    outputPath: string,
    timeOffset: string = '00:00:01'
  ): Promise<string> {
    const args = [
      '-i', inputPath,
      '-ss', timeOffset,
      '-vframes', '1',
      '-vf', 'scale=320:-1',
      outputPath,
    ];

    return new Promise((resolve, reject) => {
      const ffmpeg = spawn(this.ffmpegPath, args);

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve(outputPath);
        } else {
          reject(new Error(`Falha ao extrair thumbnail: código ${code}`));
        }
      });

      ffmpeg.on('error', (error) => {
        reject(new Error(`Erro ao extrair thumbnail: ${error.message}`));
      });
    });
  }

  /**
   * Obter informações do vídeo
   */
  async getVideoInfo(inputPath: string): Promise<{
    duration: number;
    width: number;
    height: number;
    fps: number;
    bitrate: number;
    codec: string;
  }> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn(this.ffprobePath, [
        '-v', 'error',
        '-select_streams', 'v:0',
        '-show_entries', 'stream=duration,width,height,r_frame_rate,bit_rate,codec_name',
        '-of', 'default=noprint_wrappers=1:nokey=1:noinvalidate_string_escape=1',
        inputPath,
      ]);

      let output = '';

      ffprobe.stdout.on('data', (data) => {
        output += data.toString();
      });

      ffprobe.on('close', (code) => {
        if (code === 0) {
          const lines = output.trim().split('\n');
          const [duration, width, height, fps, bitrate, codec] = lines;

          resolve({
            duration: parseFloat(duration) || 0,
            width: parseInt(width) || 0,
            height: parseInt(height) || 0,
            fps: this.parseFps(fps),
            bitrate: parseInt(bitrate) || 0,
            codec: codec || 'unknown',
          });
        } else {
          reject(new Error('Falha ao obter informações do vídeo'));
        }
      });

      ffprobe.on('error', (error) => {
        reject(new Error(`Erro ao executar ffprobe: ${error.message}`));
      });
    });
  }

  /**
   * Validar arquivo de entrada
   */
  private async validateInputFile(inputPath: string): Promise<void> {
    try {
      await fs.access(inputPath);
    } catch {
      throw new Error(`Arquivo de entrada não encontrado: ${inputPath}`);
    }
  }

  /**
   * Obter duração do vídeo
   */
  private async getVideoDuration(inputPath: string): Promise<number> {
    const info = await this.getVideoInfo(inputPath);
    return info.duration;
  }

  /**
   * Construir argumentos do FFmpeg
   */
  private buildFFmpegArgs(options: VideoCompileOptions, duration: number): string[] {
    const args = ['-i', options.inputPath];

    // Codec de vídeo
    const videoCodec = options.videoCodec || 'h264';
    args.push('-c:v', videoCodec);

    // Qualidade/Bitrate
    if (options.bitrate) {
      args.push('-b:v', options.bitrate);
    } else {
      const bitrateMap: Record<string, string> = {
        low: '500k',
        medium: '1500k',
        high: '5000k',
      };
      args.push('-b:v', bitrateMap[options.quality || 'medium']);
    }

    // Resolução
    if (options.width && options.height) {
      args.push('-vf', `scale=${options.width}:${options.height}`);
    }

    // FPS
    if (options.fps) {
      args.push('-r', options.fps.toString());
    }

    // Codec de áudio
    const audioCodec = options.audioCodec || 'aac';
    args.push('-c:a', audioCodec);
    args.push('-b:a', '128k');

    // Formato
    if (options.format === 'webm') {
      args.push('-f', 'webm');
    } else if (options.format === 'mov') {
      args.push('-f', 'mov');
    } else {
      args.push('-f', 'mp4');
    }

    // Progresso
    args.push('-progress', 'pipe:2');

    // Output
    args.push('-y', options.outputPath);

    return args;
  }

  /**
   * Parsear progresso do FFmpeg
   */
  private parseFFmpegProgress(output: string, duration: number): VideoCompileProgress | null {
    const rawLines = output.split('\n').map(line => line.trim()).filter(Boolean);
    const progress: Partial<VideoCompileProgress> = {};

    for (const rawLine of rawLines) {
      const line = rawLine.replace(/\s+/g, ' ');
      const tokens = line.split(' ');

      for (const token of tokens) {
        const [key, value] = token.split('=');
        if (!key || value === undefined) continue;

        if (key === 'frame') progress.frame = parseInt(value, 10) || 0;
        else if (key === 'fps') progress.fps = parseFloat(value) || 0;
        else if (key === 'q') progress.q = parseFloat(value) || 0;
        else if (key === 'Lsize') progress.Lsize = parseInt(value, 10) || 0;
        else if (key === 'time') progress.time = value;
        else if (key === 'bitrate') progress.bitrate = value;
        else if (key === 'speed') progress.speed = value;
      }
    }

    // Calcular porcentagem
    if (progress.time && duration > 0) {
      const timeSeconds = this.timeToSeconds(progress.time);
      progress.progress = Math.min(100, Math.round((timeSeconds / duration) * 100));
    }

    return Object.keys(progress).length > 0 ? (progress as VideoCompileProgress) : null;
  }

  /**
   * Converter tempo para segundos
   */
  private timeToSeconds(time: string): number {
    const parts = time.split(':');
    if (parts.length !== 3) return 0;

    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    const seconds = parseFloat(parts[2]) || 0;

    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * Parsear FPS
   */
  private parseFps(fpsStr: string): number {
    if (!fpsStr) return 0;

    const parts = fpsStr.split('/');
    if (parts.length === 2) {
      return parseInt(parts[0]) / parseInt(parts[1]);
    }

    return parseFloat(fpsStr) || 0;
  }
}

// Singleton
let videoCompiler: VideoCompiler | null = null;

/**
 * Obter instância do VideoCompiler
 */
export function getVideoCompiler(): VideoCompiler {
  if (!videoCompiler) {
    videoCompiler = new VideoCompiler();
  }
  return videoCompiler;
}
