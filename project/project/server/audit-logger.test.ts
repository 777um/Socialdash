import { describe, it, expect, beforeEach } from 'vitest';
import {
  logAuditEvent,
  getAuditHistory,
  clearAuditLog,
  auditNotificationCreated,
  auditNotificationDeleted,
  auditWebhookCreated,
  auditUserLogin,
  auditRateLimitExceeded,
} from './audit-logger';

describe('Audit Logger', () => {
  beforeEach(() => {
    clearAuditLog();
  });

  it('should log audit event with correct structure', () => {
    const event = logAuditEvent({
      eventType: 'notification.created',
      userId: 1,
      action: 'Test action',
      details: { test: true },
      severity: 'low',
      status: 'success',
    });

    expect(event.eventType).toBe('notification.created');
    expect(event.userId).toBe(1);
    expect(event.status).toBe('success');
    expect(event.timestamp).toBeInstanceOf(Date);
  });

  it('should retrieve audit history', () => {
    auditNotificationCreated(1, 'notif-1', { title: 'Test' });
    auditNotificationCreated(1, 'notif-2', { title: 'Test 2' });
    auditNotificationDeleted(1, 'notif-1');

    const history = getAuditHistory();
    expect(history.length).toBe(3);
  });

  it('should filter audit history by userId', () => {
    auditNotificationCreated(1, 'notif-1', { title: 'Test' });
    auditNotificationCreated(2, 'notif-2', { title: 'Test 2' });

    const user1History = getAuditHistory({ userId: 1 });
    expect(user1History.length).toBe(1);
    expect(user1History[0].userId).toBe(1);
  });

  it('should filter audit history by eventType', () => {
    auditNotificationCreated(1, 'notif-1', { title: 'Test' });
    auditUserLogin(1);
    auditRateLimitExceeded(1, 'notifications.sendNotification');

    const loginHistory = getAuditHistory({ eventType: 'user.login' });
    expect(loginHistory.length).toBe(1);
    expect(loginHistory[0].eventType).toBe('user.login');
  });

  it('should filter audit history by severity', () => {
    auditNotificationCreated(1, 'notif-1', { title: 'Test' });
    auditRateLimitExceeded(1, 'notifications.sendNotification');

    const highSeverity = getAuditHistory({ severity: 'high' });
    expect(highSeverity.length).toBe(1);
    expect(highSeverity[0].severity).toBe('high');
  });

  it('should respect limit and offset', () => {
    for (let i = 0; i < 10; i++) {
      auditNotificationCreated(1, `notif-${i}`, { title: `Test ${i}` });
    }

    const page1 = getAuditHistory({ limit: 5, offset: 0 });
    const page2 = getAuditHistory({ limit: 5, offset: 5 });

    expect(page1.length).toBe(5);
    expect(page2.length).toBe(5);
    expect(page1[0].resourceId).not.toBe(page2[0].resourceId);
  });

  it('should log notification created event', () => {
    const event = auditNotificationCreated(1, 'notif-123', { title: 'Test', type: 'info' });

    expect(event.eventType).toBe('notification.created');
    expect(event.resourceId).toBe('notif-123');
    expect(event.severity).toBe('low');
    expect(event.status).toBe('success');
  });

  it('should log notification deleted event', () => {
    const event = auditNotificationDeleted(1, 'notif-123');

    expect(event.eventType).toBe('notification.deleted');
    expect(event.resourceId).toBe('notif-123');
    expect(event.severity).toBe('medium');
  });

  it('should log webhook created event', () => {
    const event = auditWebhookCreated(1, 'webhook-123', 'https://example.com');

    expect(event.eventType).toBe('webhook.created');
    expect(event.resourceId).toBe('webhook-123');
    expect(event.details.url).toBe('https://example.com');
  });

  it('should log user login event', () => {
    const event = auditUserLogin(1, '192.168.1.1', 'Mozilla/5.0');

    expect(event.eventType).toBe('user.login');
    expect(event.ipAddress).toBe('192.168.1.1');
    expect(event.userAgent).toBe('Mozilla/5.0');
  });

  it('should log rate limit exceeded event', () => {
    const event = auditRateLimitExceeded(1, 'notifications.sendNotification');

    expect(event.eventType).toBe('system.rate_limit_exceeded');
    expect(event.severity).toBe('high');
    expect(event.status).toBe('failure');
  });

  it('should maintain audit log size limit', () => {
    // Criar mais de 10.000 eventos
    for (let i = 0; i < 10100; i++) {
      auditNotificationCreated(1, `notif-${i}`, { title: `Test ${i}` });
    }

    const history = getAuditHistory({ limit: 20000 });
    expect(history.length).toBeLessThanOrEqual(10000);
  });

  it('should sort history by timestamp descending', () => {
    auditNotificationCreated(1, 'notif-1', { title: 'Test 1' });
    
    // Pequeno delay para garantir timestamps diferentes
    const delay = new Promise(resolve => setTimeout(resolve, 10));
    
    return delay.then(() => {
      auditNotificationCreated(1, 'notif-2', { title: 'Test 2' });
      
      const history = getAuditHistory();
      expect(history[0].resourceId).toBe('notif-2');
      expect(history[1].resourceId).toBe('notif-1');
    });
  });
});
