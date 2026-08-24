import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_BYTES = 32;

function getEncryptionKey(): Buffer | null {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) return null;
  const buffer = Buffer.from(key, "hex");
  // A malformed key (wrong length / not hex) is treated as unconfigured rather
  // than producing runtime cipher errors on every request.
  return buffer.length === KEY_BYTES ? buffer : null;
}

/** Whether secrets can be encrypted at rest. Callers storing secrets MUST check this. */
export function isEncryptionConfigured(): boolean {
  return getEncryptionKey() !== null;
}

/**
 * Encrypts a secret for storage. Fails CLOSED: returns null when no valid
 * ENCRYPTION_KEY is configured — callers must refuse to store the secret
 * rather than silently persisting plaintext.
 */
export function encrypt(plaintext: string): string | null {
  const key = getEncryptionKey();
  if (!key) return null;

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

/**
 * Decrypts a stored secret. Tolerates legacy rows: if no key is configured or
 * the payload is not valid ciphertext, the input is returned unchanged so keys
 * stored before encryption was enabled keep working.
 */
export function decrypt(ciphertext: string): string | null {
  const key = getEncryptionKey();
  if (!key) return ciphertext;

  try {
    const data = Buffer.from(ciphertext, "base64");
    const iv = data.subarray(0, IV_LENGTH);
    const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encrypted = data.subarray(IV_LENGTH + TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  } catch {
    return ciphertext;
  }
}
