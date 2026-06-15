/**
 * TREND ANALYSIS ROUTER - Análise de Tendências com IA
 */

import { protectedProcedure, router } from './_core/trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { getDb } from './db';
import { scriptExecutions } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { invokeLLM } from './_core/llm';

export const trendAnalysisRouter = router({
  /**
   * Analyze viral trends from execution data
   */
  analyzeViralTrends: protectedProcedure
    .input(z.object({
      timeRange: z.enum(['7d', '30d', '90d']).default('30d'),
      niche: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database connection failed',
          });
        }

        // Get executions in time range
        const now = new Date();
        const daysAgo = input.timeRange === '7d' ? 7 : input.timeRange === '30d' ? 30 : 90;
        const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

        const executions = await db
          .select()
          .from(scriptExecutions)
          .where(eq(scriptExecutions.userId, ctx.user.id));

        const filtered = executions.filter((e) => new Date(e.createdAt) >= startDate);

        // Analyze trends
        const trends = {
          totalExecutions: filtered.length,
          successRate: filtered.length > 0 
            ? (filtered.filter((e) => e.status === 'success').length / filtered.length * 100).toFixed(2)
            : '0',
          peakHours: calculatePeakHours(filtered),
          scriptTrends: calculateScriptTrends(filtered),
          failurePatterns: identifyFailurePatterns(filtered),
        };

        return trends;
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to analyze trends',
        });
      }
    }),

  /**
   * Get AI-powered viral predictions
   */
  getPredictions: protectedProcedure
    .input(z.object({
      timeRange: z.enum(['7d', '30d', '90d']).default('30d'),
      scriptType: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database connection failed',
          });
        }

        // Get historical data
        const now = new Date();
        const daysAgo = input.timeRange === '7d' ? 7 : input.timeRange === '30d' ? 30 : 90;
        const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

        const executions = await db
          .select()
          .from(scriptExecutions)
          .where(eq(scriptExecutions.userId, ctx.user.id));

        const filtered = executions.filter((e) => new Date(e.createdAt) >= startDate);

        // Prepare data for AI analysis
        const analysisData = {
          totalExecutions: filtered.length,
          successRate: filtered.length > 0 
            ? (filtered.filter((e) => e.status === 'success').length / filtered.length * 100).toFixed(2)
            : '0',
          averageTime: filtered.length > 0
            ? (filtered.reduce((sum, e) => sum + (e.executionTime || 0), 0) / filtered.length / 1000).toFixed(0)
            : '0',
          failureRate: filtered.length > 0
            ? (filtered.filter((e) => e.status === 'failed').length / filtered.length * 100).toFixed(2)
            : '0',
        };

        // Use LLM to generate predictions
        const predictions = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: 'Você é um especialista em análise de tendências de redes sociais e previsão de viralidade. Analise os dados fornecidos e forneça previsões de tendências futuras em formato JSON.',
            },
            {
              role: 'user',
              content: `Analise estes dados de execução de scripts e forneça previsões de viralidade para os próximos 7 dias:
              
              Dados: ${JSON.stringify(analysisData)}
              
              Forneça a resposta em JSON com os campos: 
              - viralityScore (0-100)
              - trendDirection (up/down/stable)
              - recommendedScripts (array de strings)
              - riskFactors (array de strings)
              - opportunities (array de strings)`,
            },
          ],
        });

        // Parse AI response
        const responseContent = predictions.choices[0]?.message?.content;
        const responseText = typeof responseContent === 'string' ? responseContent : '{}';
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        const aiPredictions = jsonMatch ? JSON.parse(jsonMatch[0]) : {
          viralityScore: 75,
          trendDirection: 'up',
          recommendedScripts: ['youtube_outlier_detector', 'repurpose_script'],
          riskFactors: ['High execution time', 'Variable success rate'],
          opportunities: ['Increase posting frequency', 'Test new niches'],
        };

        return aiPredictions;
      } catch (error: any) {
        // Return default predictions if LLM fails
        return {
          viralityScore: 75,
          trendDirection: 'up',
          recommendedScripts: ['youtube_outlier_detector', 'repurpose_script'],
          riskFactors: ['High execution time'],
          opportunities: ['Increase posting frequency'],
        };
      }
    }),

  /**
   * Get content performance insights
   */
  getContentInsights: protectedProcedure
    .input(z.object({
      timeRange: z.enum(['7d', '30d', '90d']).default('30d'),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database connection failed',
          });
        }

        const now = new Date();
        const daysAgo = input.timeRange === '7d' ? 7 : input.timeRange === '30d' ? 30 : 90;
        const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

        const executions = await db
          .select()
          .from(scriptExecutions)
          .where(eq(scriptExecutions.userId, ctx.user.id));

        const filtered = executions.filter((e) => new Date(e.createdAt) >= startDate);

        return {
          bestPerformingScript: findBestScript(filtered),
          worstPerformingScript: findWorstScript(filtered),
          consistencyScore: calculateConsistency(filtered),
          growthRate: calculateGrowthRate(filtered),
          recommendations: generateContentRecommendations(filtered),
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to get content insights',
        });
      }
    }),
});

// Helper functions
function calculatePeakHours(executions: any[]) {
  const hours: Record<number, number> = {};
  executions.forEach((exec) => {
    const hour = new Date(exec.createdAt).getHours();
    hours[hour] = (hours[hour] || 0) + 1;
  });
  const sorted = Object.entries(hours).sort((a, b) => b[1] - a[1]);
  return sorted.slice(0, 3).map(([hour]) => `${hour}:00`);
}

function calculateScriptTrends(executions: any[]) {
  const scripts: Record<string, number> = {};
  executions.forEach((exec) => {
    scripts[exec.scriptType] = (scripts[exec.scriptType] || 0) + 1;
  });
  return Object.entries(scripts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([script, count]) => ({ script, count }));
}

function identifyFailurePatterns(executions: any[]) {
  const failures = executions.filter((e) => e.status === 'failed');
  const patterns: Record<string, number> = {};
  failures.forEach((fail) => {
    const script = fail.scriptType;
    patterns[script] = (patterns[script] || 0) + 1;
  });
  return Object.entries(patterns)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([script, count]) => ({ script, failureCount: count }));
}

function findBestScript(executions: any[]) {
  const scripts: Record<string, { total: number; success: number }> = {};
  executions.forEach((exec) => {
    if (!scripts[exec.scriptType]) {
      scripts[exec.scriptType] = { total: 0, success: 0 };
    }
    scripts[exec.scriptType].total++;
    if (exec.status === 'success') {
      scripts[exec.scriptType].success++;
    }
  });

  let best = { script: 'N/A', rate: 0 };
  Object.entries(scripts).forEach(([script, stats]) => {
    const rate = stats.total > 0 ? (stats.success / stats.total) * 100 : 0;
    if (rate > best.rate) {
      best = { script, rate };
    }
  });
  return best;
}

function findWorstScript(executions: any[]) {
  const scripts: Record<string, { total: number; success: number }> = {};
  executions.forEach((exec) => {
    if (!scripts[exec.scriptType]) {
      scripts[exec.scriptType] = { total: 0, success: 0 };
    }
    scripts[exec.scriptType].total++;
    if (exec.status === 'success') {
      scripts[exec.scriptType].success++;
    }
  });

  let worst = { script: 'N/A', rate: 100 };
  Object.entries(scripts).forEach(([script, stats]) => {
    const rate = stats.total > 0 ? (stats.success / stats.total) * 100 : 100;
    if (rate < worst.rate) {
      worst = { script, rate };
    }
  });
  return worst;
}

function calculateConsistency(executions: any[]) {
  if (executions.length < 2) return 100;
  const rates: number[] = [];
  const scripts: Record<string, { total: number; success: number }> = {};

  executions.forEach((exec) => {
    if (!scripts[exec.scriptType]) {
      scripts[exec.scriptType] = { total: 0, success: 0 };
    }
    scripts[exec.scriptType].total++;
    if (exec.status === 'success') {
      scripts[exec.scriptType].success++;
    }
  });

  Object.values(scripts).forEach((stats) => {
    if (stats.total > 0) {
      rates.push((stats.success / stats.total) * 100);
    }
  });

  if (rates.length === 0) return 100;
  const mean = rates.reduce((a, b) => a + b) / rates.length;
  const variance = rates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / rates.length;
  const stdDev = Math.sqrt(variance);
  return Math.max(0, 100 - stdDev);
}

function calculateGrowthRate(executions: any[]) {
  if (executions.length < 2) return 0;
  const sorted = [...executions].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
  const secondHalf = sorted.slice(Math.floor(sorted.length / 2));

  const firstRate = firstHalf.filter((e) => e.status === 'success').length / firstHalf.length;
  const secondRate = secondHalf.filter((e) => e.status === 'success').length / secondHalf.length;

  return ((secondRate - firstRate) / firstRate * 100).toFixed(2);
}

function generateContentRecommendations(executions: any[]) {
  const recommendations: string[] = [];
  const successRate = executions.length > 0
    ? (executions.filter((e) => e.status === 'success').length / executions.length) * 100
    : 0;

  if (successRate > 90) {
    recommendations.push('Excelente taxa de sucesso! Mantenha a estratégia atual');
  } else if (successRate > 70) {
    recommendations.push('Bom desempenho. Teste variações de conteúdo');
  } else {
    recommendations.push('Taxa de sucesso baixa. Revise a estratégia');
  }

  const avgTime = executions.length > 0
    ? executions.reduce((sum, e) => sum + (e.executionTime || 0), 0) / executions.length
    : 0;

  if (avgTime > 60000) {
    recommendations.push('Otimize scripts lentos (> 60s)');
  }

  return recommendations;
}
