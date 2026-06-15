import { z } from 'zod';
import { protectedProcedure, router } from './_core/trpc';
import {
  saveTemplate,
  getTemplatesByUserId,
  getTemplateById,
  deleteTemplate,
  getExecutionsByUserId,
} from './db';

export const templatesRouter = router({
  /**
   * Save a new template
   */
  save: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, 'Template name is required'),
        scriptType: z.string().min(1, 'Script type is required'),
        parameters: z.record(z.string(), z.any()),
        description: z.string().optional(),
        isPublic: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await saveTemplate({
          userId: ctx.user.id,
          name: input.name,
          scriptType: input.scriptType,
          parameters: input.parameters as any,
          description: input.description || null,
          isPublic: input.isPublic ? 1 : 0,
        });

        return {
          success: true,
          message: 'Template saved successfully',
        };
      } catch (error: any) {
        throw new Error(`Failed to save template: ${error.message}`);
      }
    }),

  /**
   * Get all templates for the current user
   */
      list: protectedProcedure.query(async ({ ctx }) => {
    try {
      const templates = await getTemplatesByUserId(ctx.user.id);
      return templates || [];
    } catch (error: any) {
      throw new Error(`Failed to fetch templates: ${error.message}`);
    }
  }),

  /**
   * Get a specific template by ID
   */
      get: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const template = await getTemplateById(input.templateId, ctx.user.id);
        if (!template) {
          throw new Error('Template not found');
        }
        return template;
      } catch (error: any) {
        throw new Error(`Failed to fetch template: ${error.message}`);
      }
    }),

  /**
   * Delete a template
   */
      delete: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        await deleteTemplate(input.templateId, ctx.user.id);
        return {
          success: true,
          message: 'Template deleted successfully',
        };
      } catch (error: any) {
        throw new Error(`Failed to delete template: ${error.message}`);
      }
    }),

  /**
   * Get execution history
   */
      getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const executions = await getExecutionsByUserId(ctx.user.id, input.limit);
        return executions || [];
      } catch (error: any) {
        throw new Error(`Failed to fetch execution history: ${error.message}`);
      }
    }),
});

export type TemplatesRouter = typeof templatesRouter;
