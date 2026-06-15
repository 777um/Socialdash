import { z } from 'zod';
import { protectedProcedure, router } from './_core/trpc';
import { sanitizeString, validateInput } from './_core/security';
import { TRPCError } from '@trpc/server';
import { getDb } from './db';
import { userTemplates } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';

/**
 * TEMPLATES ROUTER
 * Manages user-saved script templates for quick reuse
 * Implements full CRUD with security validation
 */

const TemplateInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  scriptType: z.string(),
  parameters: z.record(z.string(), z.any()),
});

const TemplateUpdateSchema = TemplateInputSchema.partial().extend({
  id: z.number(),
});

// Helper functions
async function saveTemplate(data: any) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.insert(userTemplates).values(data);
  const result = await db.select().from(userTemplates).where(eq(userTemplates.userId, data.userId)).orderBy(userTemplates.id).limit(1);
  return result[0] || data;
}

async function getTemplates(userId: number, scriptType?: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const conditions = [eq(userTemplates.userId, userId)];
  if (scriptType) conditions.push(eq(userTemplates.scriptType, scriptType));
  
  return db.select().from(userTemplates).where(and(...conditions));
}

async function getTemplate(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const result = await db
    .select()
    .from(userTemplates)
    .where(and(eq(userTemplates.id, id), eq(userTemplates.userId, userId)))
    .limit(1);
  
  return result[0] || null;
}

async function deleteTemplate(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db
    .delete(userTemplates)
    .where(and(eq(userTemplates.id, id), eq(userTemplates.userId, userId)));
}

export const templatesRouter = router({
  /**
   * Create a new template
   * Saves user's script configuration for reuse
   */
  save: protectedProcedure
    .input(TemplateInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Validate input
        validateInput(input);

        // Sanitize string fields
        const sanitizedInput = {
          ...input,
          name: sanitizeString(input.name),
          description: input.description ? sanitizeString(input.description) : undefined,
        };

        // Save to database
        const template = await saveTemplate({
          userId: ctx.user.id,
          name: sanitizedInput.name,
          description: sanitizedInput.description,
          scriptType: sanitizedInput.scriptType,
          parameters: sanitizedInput.parameters,
        });

        return {
          success: true,
          template,
          message: 'Template saved successfully',
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to save template',
        });
      }
    }),

  /**
   * Get all templates for current user
   * Supports filtering and pagination
   */
  list: protectedProcedure
    .input(
      z.object({
        scriptType: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const templates = await getTemplates(ctx.user.id, input.scriptType);

        return {
          success: true,
          templates: templates || [],
          total: templates?.length || 0,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch templates',
        });
      }
    }),

  /**
   * Get single template by ID
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const template = await getTemplate(input.id, ctx.user.id);

        if (!template) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Template not found',
          });
        }

        return {
          success: true,
          template,
        };
      } catch (error: any) {
        if (error.code === 'NOT_FOUND') throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch template',
        });
      }
    }),

  /**
   * Update template
   */
  update: protectedProcedure
    .input(TemplateUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        validateInput(input);

        const existing = await getTemplate(input.id, ctx.user.id);
        if (!existing) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Template not found',
          });
        }

        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const sanitizedInput: any = {};
        if (input.name) sanitizedInput.name = sanitizeString(input.name);
        if (input.description) sanitizedInput.description = sanitizeString(input.description);
        if (input.scriptType) sanitizedInput.scriptType = input.scriptType;
        if (input.parameters) sanitizedInput.parameters = input.parameters;

        await db
          .update(userTemplates)
          .set(sanitizedInput)
          .where(and(eq(userTemplates.id, input.id), eq(userTemplates.userId, ctx.user.id)));

        const updated = await getTemplate(input.id, ctx.user.id);

        return {
          success: true,
          template: updated,
          message: 'Template updated successfully',
        };
      } catch (error: any) {
        if (error.code === 'NOT_FOUND') throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to update template',
        });
      }
    }),

  /**
   * Delete template
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const template = await getTemplate(input.id, ctx.user.id);

        if (!template) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Template not found',
          });
        }

        await deleteTemplate(input.id, ctx.user.id);

        return {
          success: true,
          message: 'Template deleted successfully',
        };
      } catch (error: any) {
        if (error.code === 'NOT_FOUND') throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete template',
        });
      }
    }),

  /**
   * Duplicate template
   * Creates a copy with a new name
   */
  duplicate: protectedProcedure
    .input(z.object({ id: z.number(), newName: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      try {
        const template = await getTemplate(input.id, ctx.user.id);

        if (!template) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Template not found',
          });
        }

        const newTemplate = await saveTemplate({
          userId: ctx.user.id,
          name: sanitizeString(input.newName),
          description: template.description,
          scriptType: template.scriptType,
          parameters: template.parameters,
        });

        return {
          success: true,
          template: newTemplate,
          message: 'Template duplicated successfully',
        };
      } catch (error: any) {
        if (error.code === 'NOT_FOUND') throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to duplicate template',
        });
      }
    }),

  /**
   * Search templates
   * Full-text search across name, description, and tags
   */
  search: protectedProcedure
    .input(z.object({ query: z.string().min(1).max(100) }))
    .query(async ({ ctx, input }) => {
      try {
        const query = sanitizeString(input.query).toLowerCase();
        const templates = await getTemplates(ctx.user.id);

        const filtered = (templates || []).filter((template: any) =>
          template.name.toLowerCase().includes(query) ||
          template.description?.toLowerCase().includes(query)
        );

      return {
        success: true,
        templates: filtered || [],
        total: filtered?.length || 0,
      };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to search templates',
        });
      }
    }),

  /**
   * Get template statistics
   * Shows usage patterns and popular templates
   */
  stats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const templates = await getTemplates(ctx.user.id);

      const stats = {
        totalTemplates: templates?.length || 0,
        byScript: {} as Record<string, number>,
        mostRecent: templates?.[0] || null,
      };

      (templates || []).forEach((template: any) => {
        stats.byScript[template.scriptType] = (stats.byScript[template.scriptType] || 0) + 1;
      });

      return {
        success: true,
        stats,
      };
    } catch (error: any) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch statistics',
      });
    }
  }),
});
