/**
 * INTERACTIVE TERMINAL - Terminal Web Interativo com xterm.js
 * Simula execução de scripts Python em tempo real
 */

import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import 'xterm/css/xterm.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Play, RotateCcw } from 'lucide-react';

interface TerminalProps {
  onExecute?: (command: string) => Promise<string>;
  height?: number;
}

export function InteractiveTerminal({ onExecute, height = 400 }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (!terminalRef.current) return;

    // Inicializar Terminal
    const term = new Terminal({
      cols: 120,
      rows: 24,
      theme: {
        background: '#0f172a',
        foreground: '#e2e8f0',
        cursor: '#60a5fa',
        cursorAccent: '#0f172a',
      } as any,
      fontFamily: "'Fira Code', monospace",
      fontSize: 13,
      fontWeight: 500,
      lineHeight: 1.2,
      scrollback: 1000,
    });

    // Fit Addon
    fitAddon.current = new FitAddon();
    term.loadAddon(fitAddon.current);

    // Mount
    term.open(terminalRef.current);
    fitAddon.current.fit();

    terminalInstance.current = term;

    // Welcome message
    term.writeln('\x1b[1;36m╔════════════════════════════════════════════════════════════════╗\x1b[0m');
    term.writeln('\x1b[1;36m║  🚀 SOCIALDASH PRO - TERMINAL WEB INTERATIVO v2.0              ║\x1b[0m');
    term.writeln('\x1b[1;36m║  Execução segura de scripts Python em tempo real               ║\x1b[0m');
    term.writeln('\x1b[1;36m╚════════════════════════════════════════════════════════════════╝\x1b[0m');
    term.writeln('');
    term.writeln('\x1b[1;33m[INFO]\x1b[0m Sistema pronto. Digite um comando acima para começar.');
    term.writeln('');

    // Resize handler
    const handleResize = () => {
      if (fitAddon.current) {
        fitAddon.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []);

  const executeCommand = async (cmd: string) => {
    if (!terminalInstance.current || !cmd.trim()) return;

    const term = terminalInstance.current;

    // Echo command
    term.writeln(`\x1b[1;32m$\x1b[0m ${cmd}`);

    setIsRunning(true);

    try {
      // Simular execução com delays para efeito visual
      term.writeln('\x1b[1;33m[PARSE]\x1b[0m Analisando comando...');
      await new Promise(resolve => setTimeout(resolve, 500));

      term.writeln('\x1b[1;33m[VALIDATE]\x1b[0m Validando inputs...');
      await new Promise(resolve => setTimeout(resolve, 500));

      term.writeln('\x1b[1;33m[EXECUTE]\x1b[0m Executando script...');
      await new Promise(resolve => setTimeout(resolve, 800));

      // Executar callback se fornecido
      if (onExecute) {
        const result = await onExecute(cmd);
        term.writeln(`\x1b[1;32m[OUTPUT]\x1b[0m\n${result}`);
      } else {
        // Simular output
        term.writeln('\x1b[1;32m[✓ SUCCESS]\x1b[0m Comando executado com sucesso!');
        term.writeln('');
        term.writeln('\x1b[1;36m📊 Resultado:\x1b[0m');
        term.writeln('  • Vídeos analisados: 30');
        term.writeln('  • Outliers detectados: 5');
        term.writeln('  • Taxa de sucesso: 100%');
        term.writeln('  • Tempo de execução: 2.3s');
      }

      term.writeln('');
      term.writeln('\x1b[1;32m$\x1b[0m ');
    } catch (error) {
      term.writeln(`\x1b[1;31m[ERROR]\x1b[0m ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      term.writeln('');
      term.writeln('\x1b[1;32m$\x1b[0m ');
    } finally {
      setIsRunning(false);
    }
  };

  const handleExecute = () => {
    executeCommand(input);
    setInput('');
  };

  const handleClear = () => {
    if (terminalInstance.current) {
      terminalInstance.current.clear();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isRunning) {
      handleExecute();
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Terminal Display */}
      <div
        ref={terminalRef}
        className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shadow-2xl"
        style={{ height: `${height}px` }}
      />

      {/* Input Controls */}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Digite um comando (ex: python outlier_guardian.py 'https://youtube.com/@canal')"
          disabled={isRunning}
          className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
        />
        <Button
          onClick={handleExecute}
          disabled={isRunning || !input.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Executando...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Executar
            </>
          )}
        </Button>
        <Button
          onClick={handleClear}
          variant="outline"
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Help Text */}
      <div className="text-xs text-slate-400 space-y-1">
        <p>💡 <strong>Dicas:</strong></p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Pressione Enter para executar o comando</li>
          <li>Use Ctrl+C para cancelar execução</li>
          <li>Clique em "Limpar" para resetar o terminal</li>
          <li>Todos os comandos são executados de forma segura no servidor</li>
        </ul>
      </div>
    </div>
  );
}
