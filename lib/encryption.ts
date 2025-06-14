import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits

// Get encryption key from environment variable
function getEncryptionKey(): Buffer {
  const key = process.env.ID_PROOF_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ID_PROOF_ENCRYPTION_KEY environment variable is required');
  }
  
  // If key is shorter than required, pad it
  if (key.length < KEY_LENGTH) {
    return Buffer.concat([Buffer.from(key), Buffer.alloc(KEY_LENGTH - key.length)]);
  }
  
  // If key is longer, truncate it
  return Buffer.from(key).subarray(0, KEY_LENGTH);
}

/**
 * Encrypt sensitive ID proof data
 * @param text The text to encrypt
 * @returns Object containing encrypted data, IV, and auth tag
 */
export function encryptIdProof(text: string): {
  encrypted: string;
  iv: string;
  tag: string;
} {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // For AES-256-CBC, we don't have auth tags, so we'll use HMAC for integrity
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(encrypted + iv.toString('hex'));
    const tag = hmac.digest('hex');

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt ID proof data');
  }
}

/**
 * Decrypt sensitive ID proof data
 * @param encryptedData Object containing encrypted data, IV, and auth tag
 * @returns Decrypted text
 */
export function decryptIdProof(encryptedData: {
  encrypted: string;
  iv: string;
  tag: string;
}): string {
  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(encryptedData.iv, 'hex');

    // Verify HMAC tag for integrity
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(encryptedData.encrypted + encryptedData.iv);
    const expectedTag = hmac.digest('hex');

    if (expectedTag !== encryptedData.tag) {
      throw new Error('Data integrity check failed');
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt ID proof data');
  }
}

/**
 * Hash ID proof value for searching (one-way)
 * @param text The text to hash
 * @returns Hashed value
 */
export function hashIdProof(text: string): string {
  const key = getEncryptionKey();
  return crypto.createHmac('sha256', key).update(text).digest('hex');
}

/**
 * Mask ID proof value for display (show only last 4 characters)
 * @param text The text to mask
 * @returns Masked text
 */
export function maskIdProof(text: string): string {
  if (text.length <= 4) {
    return '*'.repeat(text.length);
  }
  
  const visiblePart = text.slice(-4);
  const maskedPart = '*'.repeat(text.length - 4);
  
  return maskedPart + visiblePart;
}

/**
 * Validate ID proof format using regex
 * @param value The value to validate
 * @param format The regex pattern to validate against
 * @returns True if valid, false otherwise
 */
export function validateIdProofFormat(value: string, format?: string): boolean {
  if (!format) return true;
  
  try {
    const regex = new RegExp(format);
    return regex.test(value);
  } catch (error) {
    console.error('Invalid regex format:', format);
    return true; // If regex is invalid, don't block the validation
  }
}

/**
 * Generate a secure random encryption key (for setup)
 * @returns Random hex string suitable for encryption key
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}
