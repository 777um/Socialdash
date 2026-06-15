import crypto from 'crypto';

/**
 * Gerenciador de criptografia para chaves de API
 * Usa AES-256-GCM para máxima segurança
 */
export class CryptoManager {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits
  private masterKey: Buffer;

  constructor(masterKeyOrPassword?: string) {
    if (masterKeyOrPassword) {
      // Derivar chave do password usando PBKDF2
      this.masterKey = crypto.pbkdf2Sync(
        masterKeyOrPassword,
        'social-media-ai-salt',
        100000,
        this.keyLength,
        'sha256'
      );
    } else {
      // Usar chave do ambiente ou gerar nova
      const envKey = process.env.ENCRYPTION_MASTER_KEY;
      if (!envKey) {
        throw new Error('ENCRYPTION_MASTER_KEY não definida no ambiente');
      }
      this.masterKey = Buffer.from(envKey, 'hex');
      if (this.masterKey.length !== this.keyLength) {
        throw new Error(`ENCRYPTION_MASTER_KEY deve ter ${this.keyLength} bytes`);
      }
    }
  }

  /**
   * Criptografar dados
   */
  encrypt(plaintext: string): string {
    // Gerar IV aleatório
    const iv = crypto.randomBytes(this.ivLength);

    // Criar cipher
    const cipher = crypto.createCipheriv(this.algorithm, this.masterKey, iv);

    // Criptografar
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Obter auth tag
    const authTag = cipher.getAuthTag();

    // Combinar IV + authTag + encrypted
    const combined = iv.toString('hex') + authTag.toString('hex') + encrypted;

    return combined;
  }

  /**
   * Descriptografar dados
   */
  decrypt(ciphertext: string): string {
    try {
      // Extrair componentes
      const iv = Buffer.from(ciphertext.slice(0, this.ivLength * 2), 'hex');
      const authTag = Buffer.from(
        ciphertext.slice(this.ivLength * 2, this.ivLength * 2 + this.tagLength * 2),
        'hex'
      );
      const encrypted = ciphertext.slice(this.ivLength * 2 + this.tagLength * 2);

      // Criar decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.masterKey, iv);
      decipher.setAuthTag(authTag);

      // Descriptografar
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`Falha ao descriptografar: ${error instanceof Error ? error.message : 'Desconhecido'}`);
    }
  }

  /**
   * Hash de senha com salt
   */
  hashPassword(password: string): string {
    const salt = crypto.randomBytes(16);
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
    return salt.toString('hex') + hash.toString('hex');
  }

  /**
   * Verificar password
   */
  verifyPassword(password: string, hash: string): boolean {
    try {
      const salt = Buffer.from(hash.slice(0, 32), 'hex');
      const storedHash = Buffer.from(hash.slice(32), 'hex');
      const computedHash = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
      return crypto.timingSafeEqual(storedHash, computedHash);
    } catch {
      return false;
    }
  }

  /**
   * Gerar chave mestre aleatória
   */
  static generateMasterKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Gerar token aleatório
   */
  static generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash SHA-256
   */
  static hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * HMAC SHA-256
   */
  static hmac(data: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  /**
   * Verificar integridade com HMAC
   */
  static verifyHmac(data: string, signature: string, secret: string): boolean {
    const computed = Buffer.from(CryptoManager.hmac(data, secret), 'hex');
    const provided = Buffer.from(signature, 'hex');

    if (computed.length !== provided.length) {
      return false;
    }

    try {
      return crypto.timingSafeEqual(computed, provided);
    } catch {
      return false;
    }
  }
}

// Singleton
let cryptoManager: CryptoManager | null = null;

/**
 * Obter instância do CryptoManager
 */
export function getCryptoManager(): CryptoManager {
  if (!cryptoManager) {
    cryptoManager = new CryptoManager();
  }
  return cryptoManager;
}

/**
 * Inicializar CryptoManager com password
 */
export function initializeCryptoManager(password: string): CryptoManager {
  cryptoManager = new CryptoManager(password);
  return cryptoManager;
}
