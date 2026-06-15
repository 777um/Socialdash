/**
 * SECURE SCRIPT EXECUTOR
 * Resolve P0: spawn() direto sem sandbox
 * Resolve P1: caminho hardcoded /home/ubuntu/social_ai_research
 *
 * Execução padrão: container Docker descartável (sem acesso a rede/host).
 * Fallback inseguro (spawn direto) apenas quando
 *   PYTHON_SANDBOX_ALLOW_UNSAFE_FALLBACK=true
 * e somente em ambiente de desenvolvimento.
 */

import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { z } from 'zod';
import winston from 'winston';
import { TRPCError } from '@trpc/server';
import { executePythonInSandbox } from './python-sandbox-executor';

// ============================================================================
// CONFIGURAÇÃO — caminhos portáveis, sem absolutos hardcoded
// ============================================================================

const SCRIPTS_DIR = path.resolve(process.cwd(), 'client', 'public');
const LOGS_DIR    = path.resolve(process.cwd(), 'logs');

const MAX_EXECUTION_TIME = 30_000; // 30 s
const MAX_OUTPUT_SIZE    = 10 * 1024 * 1024; // 10 MB

const ALLOWED_SCRIPTS = [
  'youtube_outlier_detector.py',
  'audio_transcriber_free.py',
  'repurpose_script.py',
  'seo_metadata_script.py',
  'multi_channel_orchestrator.py',
  'monetization_funnel_optimizer.py',
  'affiliate_tracking_dashboard.py',
] as const;

type AllowedScript = (typeof ALLOWED_SCRIPTS)[number];

// ============================================================================
// LOGGER
// ============================================================================

if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.File({ filename: path.join(LOGS_DIR, 'security-errors.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(LOGS_DIR, 'security-combined.log') }),
  ],
});

// ============================================================================
// VALIDAÇÃO DE ENTRADA
// ============================================================================

const ExecutionRequestSchema = z.object({
  scriptName: z.string().min(1).max(255),
  parameters: z.record(z.unknown()).optional().default({}),
  timeout: z.number().min(1000).max(MAX_EXECUTION_TIME).optional().default(MAX_EXECUTION_TIME),
});

export type ExecutionRequest = z.infer<typeof ExecutionRequestSchema>;

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionId: string;
  executionTime: number;
  scriptName: string;
}

// ============================================================================
// VALIDAÇÃO DE SCRIPT
// ============================================================================

function validateScriptName(name: string): AllowedScript {
  const base = path.basename(name);

  if (!(ALLOWED_SCRIPTS as readonly string[]).includes(base)) {
    securityLogger.warn('Script not in allowlist', { scriptName: name });
    throw new TRPCError({ code: 'FORBIDDEN', message: `Script '${base}' is not allowed.` });
  }

  // Verificar que o caminho resolvido não escapa do diretório de scripts
  const resolved = path.resolve(SCRIPTS_DIR, base);
  if (!resolved.startsWith(SCRIPTS_DIR + path.sep) && resolved !== SCRIPTS_DIR) {
    securityLogger.error('Path traversal attempt', { scriptName: name, resolved });
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Invalid script path.' });
  }

  if (!fs.existsSync(resolved)) {
    throw new TRPCError({ code: 'NOT_FOUND', message: `Script '${base}' not found.` });
  }

  return base as AllowedScript;
}

function buildArgList(parameters: Record<string, unknown>): string[] {
  return Object.entries(parameters).flatMap(([k, v]) => {
    const val = String(v);
    // Rejeitar injeção via argumentos
    if (/[;&|`$(){}[\]<>\\]/.test(val)) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: `Invalid character in parameter '${k}'.` });
    }
    return [`--${k}`, val];
  });
}

// ============================================================================
// EXECUÇÃO PRINCIPAL
// ============================================================================

export async function executeScript(request: ExecutionRequest): Promise<ExecutionResult> {
  const parsed = ExecutionRequestSchema.safeParse(request);
  if (!parsed.success) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid execution request.', cause: parsed.error });
  }

  const { scriptName, parameters, timeout } = parsed.data;
  const executionId = crypto.randomUUID();
  const startTime   = Date.now();

  const validScript = validateScriptName(scriptName);
  const args        = buildArgList(parameters as Record<string, unknown>);

  securityLogger.info('Script execution started', { executionId, scriptName: validScript, parameters });

  try {
    // Tentativa 1 — sandbox Docker
    const result = await executePythonInSandbox(validScript, args, timeout);
    const executionTime = Date.now() - startTime;

    securityLogger.info('Script execution completed', { executionId, executionTime, success: result.success });

    return {
      success: result.success,
      output: result.output.slice(0, MAX_OUTPUT_SIZE),
      error: result.error,
      executionId,
      executionTime,
      scriptName: validScript,
    };
  } catch (sandboxError) {
    // Tentativa 2 — fallback INSEGURO, bloqueado por padrão
    const allowFallback =
      process.env.PYTHON_SANDBOX_ALLOW_UNSAFE_FALLBACK === 'true' &&
      process.env.NODE_ENV !== 'production';

    if (!allowFallback) {
      securityLogger.error('Sandbox execution failed, unsafe fallback disabled', { executionId, error: String(sandboxError) });
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Script execution failed. Docker sandbox required.' });
    }

    // Fallback — apenas dev + variável de ambiente explícita
    securityLogger.warn('Using unsafe fallback executor (dev-only)', { executionId });
    const { spawn } = await import('child_process');
    const scriptPath = path.resolve(SCRIPTS_DIR, validScript);

    return new Promise((resolve, reject) => {
      let output = '';
      let errorOut = '';

      const child = spawn('python3', [scriptPath, ...args], {
        timeout,
        env: { ...process.env, PYTHONPATH: SCRIPTS_DIR },
        cwd: SCRIPTS_DIR,
      });

      child.stdout.on('data', (d: Buffer) => { output += d.toString(); });
      child.stderr.on('data', (d: Buffer) => { errorOut += d.toString(); });

      child.on('close', (code: number | null) => {
        resolve({
          success: code === 0,
          output: output.slice(0, MAX_OUTPUT_SIZE),
          error: errorOut || undefined,
          executionId,
          executionTime: Date.now() - startTime,
          scriptName: validScript,
        });
      });

      child.on('error', reject);
    });
  }
}

// Re-exportar tipos do sandbox para compatibilidade
export { executePythonInSandbox };
