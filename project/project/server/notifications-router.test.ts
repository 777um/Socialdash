/**
 * NOTIFICATIONS ROUTER TESTS
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { notificationsRouter } from './notifications-router';
import { router, protectedProcedure } from './_core/trpc';

// Mock context
const mockContext = {
  user: {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    role: 'user' as const,
  },
  req: {} as any,
  res: {} as any,
};

describe('Notifications Router', () => {
  describe('sendNotification', () => {
    it('should send a notification successfully', async () => {
      const caller = notificationsRouter.createCaller(mockContext);

      const result = await caller.sendNotification({
        title: 'Test Notification',
        body: 'This is a test notification',
        type: 'info',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('sucesso');
    });

    it('should validate input data', async () => {
      const caller = notificationsRouter.createCaller(mockContext);

      try {
        await caller.sendNotification({
          title: 'a'.repeat(101), // Exceeds max length
          body: 'Test',
          type: 'info',
        });
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('listNotifications', () => {
    it('should list notifications for user', async () => {
      const caller = notificationsRouter.createCaller(mockContext);

      // Send a notification first
      await caller.sendNotification({
        title: 'Test',
        body: 'Test body',
        type: 'success',
      });

      // List notifications
      const notifications = await caller.listNotifications({
        limit: 20,
        offset: 0,
        unreadOnly: false,
      });

      expect(Array.isArray(notifications)).toBe(true);
      expect(notifications.length).toBeGreaterThan(0);
    });

    it('should filter unread notifications', async () => {
      const caller = notificationsRouter.createCaller(mockContext);

      // Send a notification
      await caller.sendNotification({
        title: 'Unread Test',
        body: 'This should be unread',
        type: 'warning',
      });

      // List only unread
      const unreadNotifications = await caller.listNotifications({
        limit: 20,
        offset: 0,
        unreadOnly: true,
      });

      expect(Array.isArray(unreadNotifications)).toBe(true);
      unreadNotifications.forEach((notif) => {
        expect(notif.read).toBe(false);
      });
    });

    it('should respect pagination', async () => {
      const caller = notificationsRouter.createCaller(mockContext);

      // Send multiple notifications
      for (let i = 0; i < 5; i++) {
        await caller.sendNotification({
          title: `Notification ${i}`,
          body: `Body ${i}`,
          type: 'info',
        });
      }

      // Get first page
      const page1 = await caller.listNotifications({
        limit: 2,
        offset: 0,
        unreadOnly: false,
      });

      expect(page1.length).toBeLessThanOrEqual(2);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const caller = notificationsRouter.createCaller(mockContext);

      // Send a notification
      await caller.sendNotification({
        title: 'Mark as Read Test',
        body: 'Test',
        type: 'info',
      });

      // Get notifications
      const notifications = await caller.listNotifications({
        limit: 20,
        offset: 0,
        unreadOnly: false,
      });

      if (notifications.length > 0) {
        const notificationId = notifications[0].id;

        // Mark as read
        const result = await caller.markAsRead({
          notificationId,
        });

        expect(result.success).toBe(true);
      }
    });
  });

  describe('countUnread', () => {
    it('should count unread notifications', async () => {
      const caller = notificationsRouter.createCaller(mockContext);

      // Send notifications
      await caller.sendNotification({
        title: 'Unread 1',
        body: 'Test',
        type: 'info',
      });

      await caller.sendNotification({
        title: 'Unread 2',
        body: 'Test',
        type: 'warning',
      });

      // Count unread
      const count = await caller.countUnread();

      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      const caller = notificationsRouter.createCaller(mockContext);

      // Send a notification
      await caller.sendNotification({
        title: 'Delete Test',
        body: 'Test',
        type: 'info',
      });

      // Get notifications
      const notifications = await caller.listNotifications({
        limit: 20,
        offset: 0,
        unreadOnly: false,
      });

      if (notifications.length > 0) {
        const notificationId = notifications[0].id;

        // Delete
        const result = await caller.deleteNotification({
          notificationId,
        });

        expect(result.success).toBe(true);
      }
    });
  });

  describe('clearAll', () => {
    it('should clear all notifications', async () => {
      const caller = notificationsRouter.createCaller(mockContext);

      // Send notifications
      await caller.sendNotification({
        title: 'Clear Test 1',
        body: 'Test',
        type: 'info',
      });

      await caller.sendNotification({
        title: 'Clear Test 2',
        body: 'Test',
        type: 'success',
      });

      // Clear all
      const result = await caller.clearAll();

      expect(result.success).toBe(true);

      // Verify cleared
      const notifications = await caller.listNotifications({
        limit: 20,
        offset: 0,
        unreadOnly: false,
      });

      expect(notifications.length).toBe(0);
    });
  });
});
