/**
 * PATH MANAGER - Gerenciador de caminhos dinâmicos
 * Resolve problema P1: Caminho absoluto hardcoded
 * 
 * Usa process.cwd() e path.resolve() em vez de hardcoded paths
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

/**
 * Obter diretório raiz do projeto
 */
export function getProjectRoot(): string {
  return process.cwd();
}

/**
 * Obter diretório de scripts
 */
export function getScriptsDir(): string {
  return path.resolve(getProjectRoot(), 'scripts');
}

/**
 * Obter diretório de output
 */
export function getOutputDir(): string {
  return path.resolve(getProjectRoot(), 'output');
}

/**
 * Obter diretório de logs
 */
export function getLogsDir(): string {
  return path.resolve(getProjectRoot(), '.manus-logs');
}

/**
 * Obter diretório de uploads
 */
export function getUploadsDir(): string {
  return path.resolve(getProjectRoot(), 'uploads');
}

/**
 * Obter diretório de cache
 */
export function getCacheDir(): string {
  return path.resolve(getProjectRoot(), '.cache');
}

/**
 * Obter diretório do servidor
 */
export function getServerDir(): string {
  return path.resolve(getProjectRoot(), 'server');
}

/**
 * Obter diretório do cliente
 */
export function getClientDir(): string {
  return path.resolve(getProjectRoot(), 'client');
}

/**
 * Obter diretório de banco de dados
 */
export function getDatabaseDir(): string {
  return path.resolve(getProjectRoot(), 'drizzle');
}

/**
 * Validar se caminho está dentro do projeto
 */
export function isPathInProject(filePath: string): boolean {
  const projectRoot = getProjectRoot();
  const resolvedPath = path.resolve(filePath);
  return resolvedPath.startsWith(projectRoot);
}

/**
 * Validar se caminho está dentro de um diretório específico
 */
export function isPathInDirectory(filePath: string, directory: string): boolean {
  const resolvedPath = path.resolve(filePath);
  const resolvedDir = path.resolve(directory);
  return resolvedPath.startsWith(resolvedDir);
}

/**
 * Obter caminho relativo ao projeto
 */
export function getRelativePath(filePath: string): string {
  const projectRoot = getProjectRoot();
  return path.relative(projectRoot, filePath);
}

/**
 * Resolver caminho de forma segura
 */
export function resolvePath(basePath: string, relativePath: string): string {
  const resolved = path.resolve(basePath, relativePath);
  
  // Validar que o caminho resolvido está dentro do diretório base
  if (!isPathInDirectory(resolved, basePath)) {
    throw new Error(`Path traversal attempt detected: ${relativePath}`);
  }
  
  return resolved;
}

/**
 * Obter informações do ambiente
 */
export function getEnvironmentInfo() {
  return {
    projectRoot: getProjectRoot(),
    nodeEnv: process.env.NODE_ENV || 'development',
    platform: process.platform,
    arch: process.arch,
    cwd: process.cwd(),
  };
}

/**
 * Exibir estrutura de diretórios
 */
export function printDirectoryStructure(): void {
  console.log('[Path Manager] Estrutura de diretórios:');
  console.log(`  Project Root: ${getProjectRoot()}`);
  console.log(`  Scripts:      ${getScriptsDir()}`);
  console.log(`  Output:       ${getOutputDir()}`);
  console.log(`  Logs:         ${getLogsDir()}`);
  console.log(`  Uploads:      ${getUploadsDir()}`);
  console.log(`  Cache:        ${getCacheDir()}`);
  console.log(`  Server:       ${getServerDir()}`);
  console.log(`  Client:       ${getClientDir()}`);
  console.log(`  Database:     ${getDatabaseDir()}`);
}
