import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { z } from 'zod';
import { protectedProcedure, router } from './_core/trpc';

const execAsync = promisify(exec);

// Paths to Python scripts
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const _dir = dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DIR = path.resolve(process.cwd(), 'client', 'public');

const scriptPaths = {
  youtubeOutlierDetector: path.join(SCRIPTS_DIR, 'youtube_outlier_detector.py'),
  audioTranscriberFree: path.join(SCRIPTS_DIR, 'audio_transcriber_free.py'),
  repurposeScript: path.join(SCRIPTS_DIR, 'repurpose_script.py'),
  seoMetadataScript: path.join(SCRIPTS_DIR, 'seo_metadata_script.py'),
  multiChannelOrchestrator: path.join(SCRIPTS_DIR, 'multi_channel_orchestrator.py'),
  monetizationFunnelOptimizer: path.join(SCRIPTS_DIR, 'monetization_funnel_optimizer.py'),
  affiliateTrackingDashboard: path.join(SCRIPTS_DIR, 'affiliate_tracking_dashboard.py'),
};

/**
 * Execute a Python script and capture output
 */
async function executePythonScript(
  scriptPath: string,
  args: string[] = [],
  timeout: number = 60000
): Promise<{ stdout: string; stderr: string; success: boolean }> {
  try {
    const command = `python3 "${scriptPath}" ${args.map(arg => `"${arg}"`).join(' ')}`;
    
    const { stdout, stderr } = await execAsync(command, { 
      timeout,
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    return {
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      success: true,
    };
  } catch (error: any) {
    return {
      stdout: error.stdout?.trim() || '',
      stderr: error.stderr?.trim() || error.message || 'Unknown error',
      success: false,
    };
  }
}

export const scriptsRouter = router({
  /**
   * Execute YouTube Outlier Detector
   * Analyzes a YouTube channel and detects viral videos
   */
  youtubeOutlierDetector: protectedProcedure
    .input(
      z.object({
        channelUrl: z.string().url('Invalid YouTube channel URL'),
        numVideos: z.number().int().min(10).max(100).default(30),
        multiplier: z.number().min(1).max(10).default(3),
      })
    )
    .mutation(async ({ input }) => {
      const args = [
        input.channelUrl,
        `--num-videos=${input.numVideos}`,
        `--multiplier=${input.multiplier}`,
      ];

      return executePythonScript(scriptPaths.youtubeOutlierDetector, args, 120000);
    }),

  /**
   * Execute Audio Transcriber (Free)
   * Transcribes YouTube videos using faster-whisper
   */
  audioTranscriberFree: protectedProcedure
    .input(
      z.object({
        videoUrl: z.string().url('Invalid YouTube video URL'),
        model: z.enum(['tiny', 'base', 'small', 'medium']).default('base'),
        language: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const args = [
        input.videoUrl,
        `--model=${input.model}`,
      ];

      if (input.language) {
        args.push(`--language=${input.language}`);
      }

      return executePythonScript(scriptPaths.audioTranscriberFree, args, 300000); // 5 min timeout
    }),

  /**
   * Execute Repurpose Script
   * Generates content ideas for multiple platforms
   */
  repurposeScript: protectedProcedure
    .input(
      z.object({
        transcription: z.string().min(10, 'Transcription too short'),
        niche: z.string().min(2, 'Niche is required'),
        platform: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const args = [input.transcription, input.niche];

      if (input.platform) {
        args.push(`--platform=${input.platform}`);
      }

      return executePythonScript(scriptPaths.repurposeScript, args);
    }),

  /**
   * Execute SEO Metadata Script
   * Generates optimized titles, descriptions, and tags
   */
  seoMetadataScript: protectedProcedure
    .input(
      z.object({
        transcription: z.string().min(10, 'Transcription too short'),
        niche: z.string().min(2, 'Niche is required'),
        platform: z.enum(['YouTube', 'TikTok', 'Instagram']).default('YouTube'),
      })
    )
    .mutation(async ({ input }) => {
      const args = [
        input.transcription,
        input.niche,
        `--platform=${input.platform}`,
      ];

      return executePythonScript(scriptPaths.seoMetadataScript, args);
    }),

  /**
   * Execute Multi-Channel Orchestrator
   * Manages multiple YouTube channels in parallel
   */
  multiChannelOrchestrator: protectedProcedure
    .input(
      z.object({
        channels: z.number().int().min(2).max(10).default(3),
        niche: z.string().min(2, 'Niche is required'),
      })
    )
    .mutation(async ({ input }) => {
      const args = [
        `--channels=${input.channels}`,
        `--niche=${input.niche}`,
      ];

      return executePythonScript(scriptPaths.multiChannelOrchestrator, args);
    }),

  /**
   * Execute Monetization Funnel Optimizer
   * Generates unique keywords and affiliate links
   */
  monetizationFunnelOptimizer: protectedProcedure
    .input(
      z.object({
        transcription: z.string().min(10, 'Transcription too short'),
        theme: z.string().min(2, 'Theme is required'),
        platform: z.enum(['amazon', 'udemy', 'hotmart', 'monetizze', 'kiwify']),
      })
    )
    .mutation(async ({ input }) => {
      const args = [input.transcription, input.theme, input.platform];

      return executePythonScript(scriptPaths.monetizationFunnelOptimizer, args);
    }),

  /**
   * Execute Affiliate Tracking Dashboard
   * Displays conversion metrics and ROI analysis
   */
  affiliateTrackingDashboard: protectedProcedure
    .input(
      z.object({
        reportType: z.enum(['daily', 'weekly', 'monthly']).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const args = [];

      if (input.reportType) {
        args.push(`--report=${input.reportType}`);
      } else {
        args.push('--analyze');
      }

      return executePythonScript(scriptPaths.affiliateTrackingDashboard, args);
    }),
});

export type ScriptsRouter = typeof scriptsRouter;
