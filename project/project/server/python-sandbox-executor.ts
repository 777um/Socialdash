/**
 * PYTHON SANDBOX EXECUTOR - Execução isolada de scripts Python
 * Resolve problema P0: Execução Python via spawn() sem isolamento
 * 
 * Usa Docker para isolar scripts em containers descartáveis
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  exitCode: number;
  executionTime: number;
}

/**
 * Whitelist de scripts permitidos
 */
const ALLOWED_SCRIPTS = [
  'youtube_outlier_detector.py',
  'audio_transcriber_free.py',
  'repurpose_script.py',
  'seo_metadata_script.py',
  'multi_channel_orchestrator.py',
  'monetization_funnel_optimizer.py',
  'affiliate_tracking_dashboard.py',
];

/**
 * Validar se script está na whitelist
 */
function validateScript(scriptName: string): boolean {
  return ALLOWED_SCRIPTS.includes(path.basename(scriptName));
}

/**
 * Executar script Python em container Docker isolado
 * 
 * Benefícios:
 * - Sem acesso ao host filesystem
 * - Sem acesso à rede (exceto se configurado)
 * - Timeout automático (30s)
 * - Recursos limitados (CPU, memória)
 * - Container descartável após execução
 */
export async function executePythonInSandbox(
  scriptName: string,
  args: string[] = [],
  timeout: number = 30000 // 30 segundos
): Promise<ExecutionResult> {
  const startTime = Date.now();

  // Validar script
  if (!validateScript(scriptName)) {
    return {
      success: false,
      output: '',
      error: `Script "${scriptName}" não está na whitelist de scripts permitidos`,
      exitCode: 1,
      executionTime: Date.now() - startTime,
    };
  }

  // Caminho do script
  const scriptPath = path.join(process.cwd(), 'scripts', scriptName);

  // Verificar se arquivo existe
  try {
    await fs.access(scriptPath);
  } catch {
    return {
      success: false,
      output: '',
      error: `Script "${scriptName}" não encontrado`,
      exitCode: 1,
      executionTime: Date.now() - startTime,
    };
  }

  return new Promise((resolve) => {
    let output = '';
    let errorOutput = '';

    // Usar Docker para executar script
    // Comando: docker run --rm -v /scripts:/scripts:ro -v /output:/output python-sandbox /scripts/script.py args
    const dockerArgs = [
      'run',
      '--rm', // Remover container após execução
      '--network', 'none', // Sem acesso à rede
      '--memory', '256m', // Limite de memória
      '--cpus', '0.5', // Limite de CPU
      '--read-only', // Filesystem read-only
      '--tmpfs', '/tmp:size=10m', // Temp filesystem isolado
      '-v', `${scriptPath}:/script.py:ro`, // Montar script (read-only)
      '-v', `${path.join(process.cwd(), 'output')}:/output`, // Output
      'social-media-ai-python-sandbox', // Nome da imagem
      '/script.py',
      ...args,
    ];

    const docker = spawn('docker', dockerArgs, {
      timeout,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    docker.stdout?.on('data', (data) => {
      output += data.toString();
    });

    docker.stderr?.on('data', (data) => {
      errorOutput += data.toString();
    });

    docker.on('close', (code: number | null) => {
      const executionTime = Date.now() - startTime;
      const exitCode = code ?? -1;

      if (exitCode === 0) {
        resolve({
          success: true,
          output,
          exitCode,
          executionTime,
        });
      } else if (exitCode === 124) {
        // Timeout
        resolve({
          success: false,
          output,
          error: `Script excedeu timeout de ${timeout}ms`,
          exitCode,
          executionTime,
        });
      } else {
        resolve({
          success: false,
          output,
          error: errorOutput || `Script falhou com código ${exitCode}`,
          exitCode,
          executionTime,
        });
      }
    });

    docker.on('error', (err) => {
      resolve({
        success: false,
        output,
        error: `Erro ao executar Docker: ${err.message}`,
        exitCode: -1,
        executionTime: Date.now() - startTime,
      });
    });
  });
}

/**
 * Executar script com fallback para spawn (se Docker não disponível)
 * Menos seguro, mas funciona sem Docker
 */
export async function executePythonWithFallback(
  scriptName: string,
  args: string[] = [],
  timeout: number = 30000
): Promise<ExecutionResult> {
  const startTime = Date.now();

  // Validar script
  if (!validateScript(scriptName)) {
    return {
      success: false,
      output: '',
      error: `Script "${scriptName}" não está na whitelist de scripts permitidos`,
      exitCode: 1,
      executionTime: Date.now() - startTime,
    };
  }

  // Tentar Docker primeiro
  try {
    return await executePythonInSandbox(scriptName, args, timeout);
  } catch (error) {
    console.warn('[Python Executor] Docker não disponível, usando fallback com spawn');
  }

  // Fallback: usar spawn diretamente (menos seguro)
  const scriptPath = path.join(process.cwd(), 'scripts', scriptName);

  return new Promise((resolve) => {
    let output = '';
    let errorOutput = '';

    const python = spawn('python3', [scriptPath, ...args], {
      timeout,
      cwd: path.join(process.cwd(), 'scripts'),
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    python.stdout?.on('data', (data) => {
      output += data.toString();
    });

    python.stderr?.on('data', (data) => {
      errorOutput += data.toString();
    });

    python.on('close', (code: number | null) => {
      const executionTime = Date.now() - startTime;
      const exitCode = code ?? -1;

      if (exitCode === 0) {
        resolve({
          success: true,
          output,
          exitCode,
          executionTime,
        });
      } else {
        resolve({
          success: false,
          output,
          error: errorOutput || `Script falhou com código ${exitCode}`,
          exitCode,
          executionTime,
        });
      }
    });

    python.on('error', (err) => {
      resolve({
        success: false,
        output,
        error: `Erro ao executar Python: ${err.message}`,
        exitCode: -1,
        executionTime: Date.now() - startTime,
      });
    });
  });
}

/**
 * Obter lista de scripts disponíveis
 */
export function getAvailableScripts(): string[] {
  return ALLOWED_SCRIPTS;
}

/**
 * Adicionar script à whitelist (apenas em desenvolvimento)
 */
export function addScriptToWhitelist(scriptName: string): void {
  if (process.env.NODE_ENV === 'development') {
    if (!ALLOWED_SCRIPTS.includes(scriptName)) {
      ALLOWED_SCRIPTS.push(scriptName);
      console.log(`[Python Executor] Script "${scriptName}" adicionado à whitelist`);
    }
  } else {
    throw new Error('Não é permitido modificar whitelist em produção');
  }
}
