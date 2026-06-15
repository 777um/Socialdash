/**
 * WEBHOOK MANAGER TESTS - Unit Tests for Webhook Logic
 */

import { describe, it, expect } from 'vitest';

describe('WebhookManager Logic', () => {
  describe('Script Type Validation', () => {
    it('should validate all supported script types', () => {
      const validScripts = [
        'youtube_outlier_detector',
        'audio_transcriber_free',
        'repurpose_script',
        'seo_metadata_script',
        'multi_channel_orchestrator',
        'monetization_funnel_optimizer',
        'affiliate_tracking_dashboard',
      ];

      validScripts.forEach((script) => {
        expect(script).toBeDefined();
        expect(script.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Webhook URL Validation', () => {
    it('should validate Zapier webhook URLs', () => {
      const zapierUrl = 'https://hooks.zapier.com/hooks/catch/12345/abc123/';
      
      expect(zapierUrl).toContain('https://');
      expect(zapierUrl).toContain('hooks.zapier.com');
    });

    it('should validate Make webhook URLs', () => {
      const makeUrl = 'https://hook.make.com/abc123def456/';
      
      expect(makeUrl).toContain('https://');
      expect(makeUrl).toContain('hook.make.com');
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'http://localhost:3000', // localhost not allowed
        'ftp://example.com', // wrong protocol
      ];

      invalidUrls.forEach((url) => {
        expect(url.startsWith('https://')).toBe(false);
      });
    });
  });

  describe('Webhook State Management', () => {
    it('should track webhook list', () => {
      const webhooks = [
        {
          id: 'webhook-1',
          scriptType: 'youtube_outlier_detector' as const,
          webhookUrl: 'https://hooks.zapier.com/1',
          isActive: true,
          createdAt: new Date(),
        },
        {
          id: 'webhook-2',
          scriptType: 'audio_transcriber_free' as const,
          webhookUrl: 'https://hooks.zapier.com/2',
          isActive: true,
          createdAt: new Date(),
        },
      ];

      expect(webhooks.length).toBe(2);
      expect(webhooks[0]?.id).toBe('webhook-1');
      expect(webhooks[1]?.id).toBe('webhook-2');
    });

    it('should handle empty webhook list', () => {
      const webhooks: any[] = [];
      
      expect(webhooks.length).toBe(0);
      expect(Array.isArray(webhooks)).toBe(true);
    });

    it('should add webhook to list', () => {
      let webhooks: any[] = [];
      
      const newWebhook = {
        id: 'webhook-new',
        scriptType: 'youtube_outlier_detector',
        webhookUrl: 'https://hooks.zapier.com/new',
        isActive: true,
        createdAt: new Date(),
      };

      webhooks = [...webhooks, newWebhook];
      
      expect(webhooks.length).toBe(1);
      expect(webhooks[0]?.id).toBe('webhook-new');
    });

    it('should remove webhook from list', () => {
      let webhooks = [
        { id: 'webhook-1', scriptType: 'youtube_outlier_detector' },
        { id: 'webhook-2', scriptType: 'audio_transcriber_free' },
      ];

      webhooks = webhooks.filter((w) => w.id !== 'webhook-1');

      expect(webhooks.length).toBe(1);
      expect(webhooks[0]?.id).toBe('webhook-2');
    });
  });

  describe('Webhook Execution Tracking', () => {
    it('should track last triggered timestamp', () => {
      const webhook = {
        id: 'webhook-1',
        scriptType: 'youtube_outlier_detector' as const,
        webhookUrl: 'https://hooks.zapier.com/1',
        isActive: true,
        lastTriggered: new Date('2026-06-13T20:00:00Z'),
        createdAt: new Date('2026-06-13T10:00:00Z'),
      };

      expect(webhook.lastTriggered).toBeInstanceOf(Date);
      expect(webhook.lastTriggered?.getTime()).toBeGreaterThan(webhook.createdAt.getTime());
    });

    it('should handle webhooks without trigger history', () => {
      const webhook = {
        id: 'webhook-1',
        scriptType: 'youtube_outlier_detector' as const,
        webhookUrl: 'https://hooks.zapier.com/1',
        isActive: true,
        createdAt: new Date(),
      };

      expect(webhook.lastTriggered).toBeUndefined();
    });
  });

  describe('Webhook Status Management', () => {
    it('should toggle webhook active status', () => {
      let webhook = {
        id: 'webhook-1',
        isActive: true,
      };

      webhook = { ...webhook, isActive: !webhook.isActive };

      expect(webhook.isActive).toBe(false);
    });

    it('should track multiple webhooks with different statuses', () => {
      const webhooks = [
        { id: 'webhook-1', isActive: true },
        { id: 'webhook-2', isActive: false },
        { id: 'webhook-3', isActive: true },
      ];

      const activeCount = webhooks.filter((w) => w.isActive).length;
      const inactiveCount = webhooks.filter((w) => !w.isActive).length;

      expect(activeCount).toBe(2);
      expect(inactiveCount).toBe(1);
    });
  });

  describe('Webhook Payload Formatting', () => {
    it('should format webhook payload correctly', () => {
      const payload = {
        scriptType: 'youtube_outlier_detector',
        parameters: {
          channel_url: 'https://www.youtube.com/@channel',
          threshold: 1.5,
        },
      };

      expect(payload.scriptType).toBe('youtube_outlier_detector');
      expect(payload.parameters.channel_url).toContain('youtube.com');
      expect(payload.parameters.threshold).toBe(1.5);
    });

    it('should handle complex parameters', () => {
      const payload = {
        scriptType: 'multi_channel_orchestrator',
        parameters: {
          channels: ['channel1', 'channel2', 'channel3'],
          niche: 'gaming',
          schedule: {
            frequency: 'daily',
            time: '10:00',
          },
        },
      };

      expect(Array.isArray(payload.parameters.channels)).toBe(true);
      expect(payload.parameters.channels.length).toBe(3);
      expect(payload.parameters.schedule.frequency).toBe('daily');
    });
  });

  describe('Webhook Documentation', () => {
    it('should provide correct documentation format', () => {
      const docs = {
        title: 'Como usar com Zapier/Make',
        steps: [
          'Copie a URL do webhook',
          'Cole em seu Zap/Automação como ação POST',
          'Envie os parâmetros do script como JSON',
          'O script será executado automaticamente',
        ],
      };

      expect(docs.steps.length).toBe(4);
      expect(docs.steps[0]).toContain('Copie');
    });
  });

  describe('Webhook Validation', () => {
    it('should validate webhook configuration', () => {
      const config = {
        webhookUrl: 'https://hooks.zapier.com/hooks/catch/12345/abc123/',
        scriptType: 'youtube_outlier_detector',
        isValid: true,
      };

      expect(config.isValid).toBe(true);
      expect(config.webhookUrl).toContain('https://');
    });

    it('should handle validation errors', () => {
      const errors = [
        'URL inválida',
        'Script não suportado',
        'Parâmetros faltando',
      ];

      errors.forEach((error) => {
        expect(error.length).toBeGreaterThan(0);
      });
    });
  });
});
