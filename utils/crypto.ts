import crypto from 'crypto';



const KEY =
  process.env.MASTER_KEY_HEX && process.env.MASTER_KEY_ENCODING !== "base64"
    ? Buffer.from(process.env.MASTER_KEY_HEX, "hex")
    : Buffer.from(process.env.MASTER_KEY_HEX ?? "", "base64");

if (KEY.length !== 32) {
  throw new Error("MASTER_KEY_HEX must be 32 bytes (hex length 64) or base64 for 32 bytes");
}

export function encrypt<T>(obj: T): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const plain = Buffer.from(JSON.stringify(obj));
  const enc = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decrypt<T = unknown>(b64: string): T {
  const raw = Buffer.from(b64, "base64");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const data = raw.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return JSON.parse(dec.toString("utf8")) as T;
}
/**
 * Generates a cryptographically secure 32-byte (256-bit) master key
 * @returns {string} A 64-character hexadecimal string (32 bytes)
 */
export function generateMasterKeyHex(): string {
  // Generate 32 random bytes (256 bits)
  const randomBytes = crypto.randomBytes(32);
  
  // Convert to hexadecimal string (64 characters)
  return randomBytes.toString('hex');
}

/**
 * Validates if a hex string is exactly 32 bytes (64 hex characters)
 * @param hexKey - The hexadecimal key to validate
 * @returns {boolean} True if valid 32-byte hex key
 */
export function isValidMasterKeyHex(hexKey: string): boolean {
  // Check if it's exactly 64 characters and contains only hex characters
  const hexPattern = /^[a-fA-F0-9]{64}$/;
  return hexPattern.test(hexKey);
}

/**
 * Converts a hex string to Buffer for cryptographic operations
 * @param hexKey - The hexadecimal key string
 * @returns {Buffer} The key as a Buffer
 * @throws {Error} If the hex key is invalid
 */
export function hexKeyToBuffer(hexKey: string): Buffer {
  if (!isValidMasterKeyHex(hexKey)) {
    throw new Error('Invalid master key: must be 64 hex characters (32 bytes)');
  }
  
  return Buffer.from(hexKey, 'hex');
}

/**
 * Gets or generates MASTER_KEY_HEX from environment variables
 * If not set, generates a new one (useful for development)
 * @returns {string} The master key hex string
 */
export function getMasterKeyHex(): string {
  const existingKey = process.env.MASTER_KEY_HEX;
  
  if (existingKey) {
    if (!isValidMasterKeyHex(existingKey)) {
      throw new Error('Invalid MASTER_KEY_HEX in environment: must be 64 hex characters (32 bytes)');
    }
    return existingKey;
  }
  
  // Generate new key if not set (development mode)
  const newKey = generateMasterKeyHex();
  console.warn('⚠️  MASTER_KEY_HEX not set in environment. Generated temporary key:', newKey);
  console.warn('🔒 Add this to your .env file: MASTER_KEY_HEX=' + newKey);
  
  return newKey;
}
