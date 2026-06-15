/**
 * TERMINAL ROUTER - tRPC Procedures para Execução de Scripts
 */

import { router, protectedProcedure } from './_core/trpc';
import { z } from 'zod';
import { executeScript, getAvailableScripts } from './terminal-executor';

export const terminalRouter = router({
  /**
   * Executar script Python
   */
  executeScript: protectedProcedure
    .input(
      z.object({
        script: z.string(),
        args: z.array(z.string()).optional(),
        timeout: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await executeScript({
        script: input.script,
        args: input.args || [],
        timeout: input.timeout || 30000,
      });

      return result;
    }),

  /**
   * Listar scripts disponíveis
   */
  listScripts: protectedProcedure.query(() => {
    return getAvailableScripts();
  }),

  /**
   * Obter status de um script
   */
  getScriptStatus: protectedProcedure
    .input(z.object({ script: z.string() }))
    .query(({ input }) => {
      const scripts = getAvailableScripts();
      const script = scripts.find((s) => s.name === input.script);

      return {
        found: !!script,
        exists: script?.exists || false,
        name: script?.name,
      };
    }),
});
