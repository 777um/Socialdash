import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateCSRFToken,
  validateCSRFToken,
  sanitizeString,
  validateURL,
  validateEmail,
  validateJSON,
} from './security-middleware';

describe('Security Middleware', () => {
  describe('CSRF Protection', () => {
    it('should generate CSRF token', () => {
      const token = generateCSRFToken('session-1');
      expect(token).toBeDefined();
      expect(token.length).toBe(64); // 32 bytes in hex
    });

    it('should validate correct CSRF token', () => {
      const sessionId = 'session-1';
      const token = generateCSRFToken(sessionId);
      const isValid = validateCSRFToken(sessionId, token);

      expect(isValid).toBe(true);
    });

    it('should reject invalid CSRF token', () => {
      const sessionId = 'session-1';
      generateCSRFToken(sessionId);
      const isValid = validateCSRFToken(sessionId, 'invalid-token');

      expect(isValid).toBe(false);
    });

    it('should reject token for wrong session', () => {
      const token = generateCSRFToken('session-1');
      const isValid = validateCSRFToken('session-2', token);

      expect(isValid).toBe(false);
    });

    it('should generate different tokens for same session', () => {
      const sessionId = 'session-1';
      const token1 = generateCSRFToken(sessionId);
      const token2 = generateCSRFToken(sessionId);

      expect(token1).not.toBe(token2);
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize XSS attempts', () => {
      const input = '<script>alert("xss")</script>';
      const sanitized = sanitizeString(input);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('&lt;script&gt;');
    });

    it('should sanitize HTML entities', () => {
      const input = '<div onclick="alert()">Click me</div>';
      const sanitized = sanitizeString(input);

      expect(sanitized).toContain('&lt;div');
      expect(sanitized).toContain('&gt;');
    });

    it('should sanitize quotes', () => {
      const input = 'He said "Hello" and \'Goodbye\'';
      const sanitized = sanitizeString(input);

      expect(sanitized).toContain('&quot;');
      expect(sanitized).toContain('&#x27;');
    });

    it('should sanitize ampersands', () => {
      const input = 'A & B';
      const sanitized = sanitizeString(input);

      expect(sanitized).toBe('A &amp; B');
    });
  });

  describe('URL Validation', () => {
    it('should validate http URL', () => {
      const isValid = validateURL('http://example.com');
      expect(isValid).toBe(true);
    });

    it('should validate https URL', () => {
      const isValid = validateURL('https://example.com');
      expect(isValid).toBe(true);
    });

    it('should reject invalid URL', () => {
      const isValid = validateURL('not-a-url');
      expect(isValid).toBe(false);
    });

    it('should reject ftp URL', () => {
      const isValid = validateURL('ftp://example.com');
      expect(isValid).toBe(false);
    });

    it('should reject javascript URL', () => {
      const isValid = validateURL('javascript:alert()');
      expect(isValid).toBe(false);
    });
  });

  describe('Email Validation', () => {
    it('should validate correct email', () => {
      const isValid = validateEmail('user@example.com');
      expect(isValid).toBe(true);
    });

    it('should validate email with subdomain', () => {
      const isValid = validateEmail('user@mail.example.co.uk');
      expect(isValid).toBe(true);
    });

    it('should reject email without @', () => {
      const isValid = validateEmail('userexample.com');
      expect(isValid).toBe(false);
    });

    it('should reject email without domain', () => {
      const isValid = validateEmail('user@');
      expect(isValid).toBe(false);
    });

    it('should reject email with spaces', () => {
      const isValid = validateEmail('user @example.com');
      expect(isValid).toBe(false);
    });

    it('should reject very long email', () => {
      const longEmail = 'a'.repeat(255) + '@example.com';
      const isValid = validateEmail(longEmail);
      expect(isValid).toBe(false);
    });
  });

  describe('JSON Validation', () => {
    it('should validate valid JSON', () => {
      const isValid = validateJSON('{"key": "value"}');
      expect(isValid).toBe(true);
    });

    it('should validate JSON array', () => {
      const isValid = validateJSON('[1, 2, 3]');
      expect(isValid).toBe(true);
    });

    it('should validate JSON null', () => {
      const isValid = validateJSON('null');
      expect(isValid).toBe(true);
    });

    it('should reject invalid JSON', () => {
      const isValid = validateJSON('{invalid}');
      expect(isValid).toBe(false);
    });

    it('should reject JSON with trailing comma', () => {
      const isValid = validateJSON('{"key": "value",}');
      expect(isValid).toBe(false);
    });

    it('should reject empty string', () => {
      const isValid = validateJSON('');
      expect(isValid).toBe(false);
    });
  });

  describe('Security Integration', () => {
    it('should prevent XSS in email validation', () => {
      const xssEmail = '<script>alert()</script>@example.com';
      const isValid = validateEmail(xssEmail);
      expect(isValid).toBe(false);
    });

    it('should prevent XSS in URL validation', () => {
      const xssUrl = 'javascript:alert("xss")';
      const isValid = validateURL(xssUrl);
      expect(isValid).toBe(false);
    });

    it('should sanitize JSON content', () => {
      const jsonWithXSS = '{"script": "<script>alert()</script>"}';
      const isValid = validateJSON(jsonWithXSS);
      expect(isValid).toBe(true); // JSON é válido, sanitização é responsabilidade da aplicação
    });
  });

  describe('CSRF Token Expiry', () => {
    it('should handle multiple sessions', () => {
      const token1 = generateCSRFToken('session-1');
      const token2 = generateCSRFToken('session-2');

      expect(validateCSRFToken('session-1', token1)).toBe(true);
      expect(validateCSRFToken('session-2', token2)).toBe(true);
      expect(validateCSRFToken('session-1', token2)).toBe(false);
      expect(validateCSRFToken('session-2', token1)).toBe(false);
    });
  });
});
