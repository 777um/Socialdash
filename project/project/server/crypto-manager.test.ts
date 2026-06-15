import { describe, it, expect, beforeEach } from 'vitest';
import { CryptoManager } from './crypto-manager';

describe('CryptoManager', () => {
  let cryptoManager: CryptoManager;
  const testPassword = 'test-password-123';

  beforeEach(() => {
    cryptoManager = new CryptoManager(testPassword);
  });

  describe('Encryption/Decryption', () => {
    it('should encrypt and decrypt text', () => {
      const plaintext = 'sk_live_1234567890abcdef';
      const encrypted = cryptoManager.encrypt(plaintext);
      const decrypted = cryptoManager.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertexts for same plaintext', () => {
      const plaintext = 'sk_live_1234567890abcdef';
      const encrypted1 = cryptoManager.encrypt(plaintext);
      const encrypted2 = cryptoManager.encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should handle long API keys', () => {
      const longKey = 'sk_live_' + 'a'.repeat(100);
      const encrypted = cryptoManager.encrypt(longKey);
      const decrypted = cryptoManager.decrypt(encrypted);

      expect(decrypted).toBe(longKey);
    });

    it('should handle special characters', () => {
      const specialKey = 'sk_live_!@#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = cryptoManager.encrypt(specialKey);
      const decrypted = cryptoManager.decrypt(encrypted);

      expect(decrypted).toBe(specialKey);
    });

    it('should throw on invalid ciphertext', () => {
      const invalidCiphertext = 'invalid_ciphertext_data';

      expect(() => {
        cryptoManager.decrypt(invalidCiphertext);
      }).toThrow();
    });

    it('should throw on corrupted ciphertext', () => {
      const plaintext = 'sk_live_1234567890abcdef';
      const encrypted = cryptoManager.encrypt(plaintext);

      // Corromper o ciphertext
      const corrupted = encrypted.slice(0, -10) + '0000000000';

      expect(() => {
        cryptoManager.decrypt(corrupted);
      }).toThrow();
    });
  });

  describe('Password Hashing', () => {
    it('should hash password', () => {
      const password = 'my-secure-password';
      const hash = cryptoManager.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should verify correct password', () => {
      const password = 'my-secure-password';
      const hash = cryptoManager.hashPassword(password);
      const isValid = cryptoManager.verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', () => {
      const password = 'my-secure-password';
      const hash = cryptoManager.hashPassword(password);
      const isValid = cryptoManager.verifyPassword('wrong-password', hash);

      expect(isValid).toBe(false);
    });

    it('should produce different hashes for same password', () => {
      const password = 'my-secure-password';
      const hash1 = cryptoManager.hashPassword(password);
      const hash2 = cryptoManager.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Static Methods', () => {
    it('should generate master key', () => {
      const key = CryptoManager.generateMasterKey();

      expect(key).toBeDefined();
      expect(key.length).toBe(64); // 32 bytes in hex
    });

    it('should generate token', () => {
      const token = CryptoManager.generateToken();

      expect(token).toBeDefined();
      expect(token.length).toBe(64); // 32 bytes in hex
    });

    it('should generate token with custom length', () => {
      const token = CryptoManager.generateToken(16);

      expect(token.length).toBe(32); // 16 bytes in hex
    });

    it('should hash data', () => {
      const data = 'test-data';
      const hash = CryptoManager.hash(data);

      expect(hash).toBeDefined();
      expect(hash.length).toBe(64); // SHA-256 in hex
    });

    it('should produce same hash for same data', () => {
      const data = 'test-data';
      const hash1 = CryptoManager.hash(data);
      const hash2 = CryptoManager.hash(data);

      expect(hash1).toBe(hash2);
    });

    it('should compute HMAC', () => {
      const data = 'test-data';
      const secret = 'test-secret';
      const hmac = CryptoManager.hmac(data, secret);

      expect(hmac).toBeDefined();
      expect(hmac.length).toBe(64); // SHA-256 in hex
    });

    it('should verify valid HMAC', () => {
      const data = 'test-data';
      const secret = 'test-secret';
      const hmac = CryptoManager.hmac(data, secret);
      const isValid = CryptoManager.verifyHmac(data, hmac, secret);

      expect(isValid).toBe(true);
    });

    it('should reject invalid HMAC', () => {
      const data = 'test-data';
      const secret = 'test-secret';
      const invalidHmac = 'invalid_hmac_signature';
      const isValid = CryptoManager.verifyHmac(data, invalidHmac, secret);

      expect(isValid).toBe(false);
    });

    it('should reject HMAC with wrong secret', () => {
      const data = 'test-data';
      const secret = 'test-secret';
      const hmac = CryptoManager.hmac(data, secret);
      const isValid = CryptoManager.verifyHmac(data, hmac, 'wrong-secret');

      expect(isValid).toBe(false);
    });
  });

  describe('Integration', () => {
    it('should encrypt API key and verify integrity', () => {
      const apiKey = 'sk_live_1234567890abcdef';
      const encrypted = cryptoManager.encrypt(apiKey);
      const signature = CryptoManager.hmac(encrypted, 'signature-secret');
      const isValid = CryptoManager.verifyHmac(encrypted, signature, 'signature-secret');

      expect(isValid).toBe(true);

      const decrypted = cryptoManager.decrypt(encrypted);
      expect(decrypted).toBe(apiKey);
    });

    it('should handle multiple keys', () => {
      const keys = [
        'sk_live_key1',
        'sk_live_key2',
        'sk_live_key3',
      ];

      const encrypted = keys.map(k => cryptoManager.encrypt(k));
      const decrypted = encrypted.map(e => cryptoManager.decrypt(e));

      expect(decrypted).toEqual(keys);
    });
  });
});
