/**
 * TERMINAL EXECUTOR - Backend para Execução Segura de Scripts Python
 * Conecta Terminal Web (xterm.js) ao Express com proteção enterprise
 */

import { spawn } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';
import winston from 'winston';
import { z } from 'zod';

// Logger profissional
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'terminal-errors.log', level: 'error' }),
    new winston.transports.File({ filename: 'terminal-combined.log' }),
  ],
});

// Whitelist de scripts permitidos
const ALLOWED_SCRIPTS = [
  'outlier_guardian.py',
  'audio_transcriber_free.py',
  'roteiro_generator_free.py',
];

const SCRIPTS_DIR = join(process.cwd(), '../social_ai_research/core');

// Validação de input
const ExecuteScriptSchema = z.object({
  script: z.string().refine(
    (val) => ALLOWED_SCRIPTS.includes(val),
    'Script não permitido'
  ),
  args: z.array(z.string()).optional().default([]),
  timeout: z.number().optional().default(30000),
});

type ExecuteScriptInput = z.infer<typeof ExecuteScriptSchema>;

/**
 * Executa script Python com segurança profissional
 */
export async function executeScript(input: ExecuteScriptInput): Promise<{
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
  exitCode?: number;
}> {
  const startTime = Date.now();

  try {
    const validated = ExecuteScriptSchema.parse(input);
    const scriptPath = join(SCRIPTS_DIR, validated.script);

    if (!existsSync(scriptPath)) {
      throw new Error(`Script não encontrado: ${validated.script}`);
    }

    const sanitizedArgs = validated.args.map((arg) =>
      arg.replace(/[;&|`$()]/g, '').substring(0, 500)
    );

    return await new Promise((resolve) => {
      let output = '';
      let errorOutput = '';

      const child = spawn('python3', [scriptPath, ...sanitizedArgs], {
        shell: false,
        cwd: SCRIPTS_DIR,
        timeout: validated.timeout,
      }) as any;

      if (child.stdout) {
        child.stdout.on('data', (data: Buffer) => {
          output += data.toString();
        });
      }

      if (child.stderr) {
        child.stderr.on('data', (data: Buffer) => {
          errorOutput += data.toString();
        });
      }

      child.on('error', (err: Error) => {
        logger.error(`Erro ao executar ${validated.script}:`, err);
        resolve({
          success: false,
          output,
          error: err.message,
          executionTime: Date.now() - startTime,
        });
      });

      child.on('close', (code: number | null) => {
        logger.info(`Script ${validated.script} finalizado com código ${code}`);
        resolve({
          success: code === 0,
          output: output || errorOutput,
          error: code !== 0 ? errorOutput : undefined,
          executionTime: Date.now() - startTime,
          exitCode: code || undefined,
        });
      });

      setTimeout(() => {
        child.kill('SIGTERM');
        logger.warn(`Script ${validated.script} excedeu timeout`);
      }, validated.timeout);
    });
  } catch (error) {
    logger.error('Erro ao validar input:', error);
    return {
      success: false,
      output: '',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      executionTime: Date.now() - startTime,
    };
  }
}

/**
 * Obter lista de scripts disponíveis
 */
export function getAvailableScripts() {
  return ALLOWED_SCRIPTS.map((script) => ({
    name: script,
    path: join(SCRIPTS_DIR, script),
    exists: existsSync(join(SCRIPTS_DIR, script)),
  }));
}
