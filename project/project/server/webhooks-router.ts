import { z } from 'zod';
import { publicProcedure, router } from './_core/trpc';
import { TRPCError } from '@trpc/server';
import { generateWebhookSignature, verifyWebhookSignature, sanitizeString, validateUrl } from './_core/security';
import { getDb } from './db';
import { scriptExecutions } from '../drizzle/schema';
import { spawn } from 'child_process';
import path from 'path';
import { logSecurityEvent } from './_core/security';
import { eq } from 'drizzle-orm';

/**
 * WEBHOOKS ROUTER
 * Enables automation with Zapier/Make
 * Allows external services to trigger script execution
 */

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'dev-secret-key';
const SCRIPTS_DIR = path.join(process.cwd(), '../social_ai_research');

const WebhookTriggerSchema = z.object({
  scriptType: z.enum([
    'youtube_outlier_detector',
    'audio_transcriber_free',
    'repurpose_script',
    'seo_metadata_script',
    'multi_channel_orchestrator',
    'monetization_funnel_optimizer',
    'affiliate_tracking_dashboard',
  ]),
  parameters: z.record(z.string(), z.any()),
  webhookSignature: z.string().optional(),
  userId: z.number().optional(),
});

/**
 * Execute script asynchronously
 * Returns immediately with execution ID
 */
async function executeScriptAsync(
  scriptType: string,
  parameters: Record<string, any>,
  userId?: number
): Promise<string> {
  const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Log execution start
  const db = await getDb();
  if (db && userId) {
    await db.insert(scriptExecutions).values({
      userId,
      scriptType,
      parameters: parameters as any,
      status: 'pending',
    });
  }

  // Execute in background (don't await)
  setImmediate(async () => {
    try {
      const scriptPath = path.join(SCRIPTS_DIR, `${scriptType}.py`);
      const args = Object.entries(parameters)
        .map(([key, value]) => `--${key}=${value}`)
        .flat();

      const process = spawn('python3', [scriptPath, ...args], {
        cwd: SCRIPTS_DIR,
        timeout: 300000, // 5 minutes max
      });

      let output = '';
      let error = '';

      process.stdout?.on('data', data => {
        output += data.toString();
      });

      process.stderr?.on('data', data => {
        error += data.toString();
      });

      process.on('close', async code => {
        const status = code === 0 ? 'success' : 'failed';
        const executionTime = Date.now();

        if (db && userId) {
          const executions = await db
            .select()
            .from(scriptExecutions)
            .where(eq(scriptExecutions.userId, userId))
            .limit(1);

          if (executions.length > 0) {
            await db
              .update(scriptExecutions)
              .set({
                status: status as any,
                output: output.slice(0, 10000),
                error: error.slice(0, 10000),
                executionTime,
              })
              .where(eq(scriptExecutions.id, executions[0].id));
          }
        }

        logSecurityEvent('script_execution_completed', userId?.toString() || null, {
          scriptType,
          status,
          executionTime,
        });
      });
    } catch (err: any) {
      logSecurityEvent('script_execution_error', userId?.toString() || null, {
        scriptType,
        error: err.message,
      });
    }
  });

  return executionId;
}

export const webhooksRouter = router({
  /**
   * Trigger script execution via webhook
   * Supports Zapier, Make, and other automation platforms
   */
  trigger: publicProcedure
    .input(WebhookTriggerSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Verify webhook signature if provided
        if (input.webhookSignature) {
          const payload = JSON.stringify({
            scriptType: input.scriptType,
            parameters: input.parameters,
          });

          const isValid = verifyWebhookSignature(payload, input.webhookSignature, WEBHOOK_SECRET);

          if (!isValid) {
            logSecurityEvent('webhook_signature_verification_failed', null, {
              scriptType: input.scriptType,
            });

            throw new TRPCError({
              code: 'UNAUTHORIZED',
              message: 'Invalid webhook signature',
            });
          }
        }

        // Validate parameters
        for (const [key, value] of Object.entries(input.parameters)) {
          if (typeof value === 'string' && value.includes('http')) {
            if (!validateUrl(value)) {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: `Invalid URL in parameter: ${key}`,
              });
            }
          }
        }

        // Execute script
        const executionId = await executeScriptAsync(
          input.scriptType,
          input.parameters,
          input.userId
        );

        logSecurityEvent('webhook_triggered', input.userId?.toString() || null, {
          scriptType: input.scriptType,
          executionId,
        });

        return {
          success: true,
          executionId,
          message: 'Script execution started',
          statusUrl: `/api/webhooks/status/${executionId}`,
        };
      } catch (error: any) {
        logSecurityEvent('webhook_error', input.userId?.toString() || null, {
          scriptType: input.scriptType,
          error: error.message,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to trigger script',
        });
      }
    }),

  /**
   * Get webhook signature for request signing
   * Used by external services to sign their requests
   */
  getSignature: publicProcedure
    .input(
      z.object({
        payload: z.string(),
      })
    )
    .query(({ input }) => {
      const signature = generateWebhookSignature(input.payload, WEBHOOK_SECRET);

      return {
        success: true,
        signature,
      };
    }),

  /**
   * Validate webhook configuration
   * Test webhook connectivity
   */
  validate: publicProcedure
    .input(
      z.object({
        webhookUrl: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Validate URL format
        if (!validateUrl(input.webhookUrl)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid webhook URL',
          });
        }

        // Test connectivity
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(input.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: true }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const isHealthy = response.ok;

        logSecurityEvent('webhook_validation', null, {
          webhookUrl: input.webhookUrl,
          isHealthy,
        });

        return {
          success: true,
          isHealthy,
          statusCode: response.status,
        };
      } catch (error: any) {
        logSecurityEvent('webhook_validation_error', null, {
          webhookUrl: input.webhookUrl,
          error: error.message,
        });

        const message = error.name === 'AbortError' ? 'Webhook timeout' : 'Webhook validation failed';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message,
        });
      }
    }),

  /**
   * Get webhook documentation
   * Returns OpenAPI spec for webhook integration
   */
  docs: publicProcedure.query(() => {
    return {
      success: true,
      documentation: {
        title: 'Social Media AI Automation Webhooks',
        version: '1.0.0',
        baseUrl: process.env.VITE_FRONTEND_FORGE_API_URL || 'https://api.socialdash.pro',
        endpoints: {
          trigger: {
            method: 'POST',
            path: '/api/trpc/webhooks.trigger',
            description: 'Trigger script execution',
            authentication: 'Optional (webhook signature)',
            parameters: {
              scriptType: 'string (required)',
              parameters: 'object (required)',
              webhookSignature: 'string (optional)',
              userId: 'number (optional)',
            },
            example: {
              scriptType: 'youtube_outlier_detector',
              parameters: {
                channel_url: 'https://www.youtube.com/@channelname',
              },
            },
          },
          getSignature: {
            method: 'GET',
            path: '/api/trpc/webhooks.getSignature',
            description: 'Generate webhook signature',
            parameters: {
              payload: 'string (required)',
            },
          },
          validate: {
            method: 'POST',
            path: '/api/trpc/webhooks.validate',
            description: 'Validate webhook configuration',
            parameters: {
              webhookUrl: 'string (required)',
            },
          },
        },
        examples: {
          zapier: {
            description: 'Zapier integration example',
            steps: [
              '1. Create new Zap with Webhook trigger',
              '2. Use endpoint: POST /api/trpc/webhooks.trigger',
              '3. Add body with scriptType and parameters',
              '4. Test and enable',
            ],
          },
          make: {
            description: 'Make.com integration example',
            steps: [
              '1. Create new scenario with Webhooks trigger',
              '2. Configure URL: POST /api/trpc/webhooks.trigger',
              '3. Map fields to scriptType and parameters',
              '4. Test and activate',
            ],
          },
        },
      },
    };
  }),
});
