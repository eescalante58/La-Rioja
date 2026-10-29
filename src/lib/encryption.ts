import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const PREFIX = "enc:v1:";

/**
 * Obtiene una clave de 32 bytes exacta para AES-256-GCM a partir de
 * META_TOKEN_ENCRYPTION_KEY (o fallback seguro derivado).
 */
function getEncryptionKey(): Buffer {
  const secret =
    process.env.META_TOKEN_ENCRYPTION_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "la-rioja-meta-capi-default-secret-key-2026";

  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encripta un texto plano (como el CAPI Access Token) usando AES-256-GCM.
 * Formato retornado: `enc:v1:<ivHex>:<authTagHex>:<cipherHex>`
 * @param plainText Texto en claro a proteger.
 * @returns Cadena encriptada lista para guardar en base de datos.
 */
export function encryptToken(plainText: string): string {
  const trimmed = plainText.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith(PREFIX)) return trimmed;

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(trimmed, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${PREFIX}${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Desencripta un token cifrado con `encryptToken`.
 * Nunca debe exponerse el resultado al navegador; uso exclusivo en servidor.
 * @param cipherPayload Cadena almacenada en base de datos.
 * @returns Token desencriptado en texto plano o cadena vacía si falla.
 */
export function decryptToken(cipherPayload: string | null | undefined): string {
  if (!cipherPayload) return "";
  const trimmed = cipherPayload.trim();
  if (!trimmed) return "";

  if (!trimmed.startsWith(PREFIX)) {
    return trimmed;
  }

  try {
    const raw = trimmed.slice(PREFIX.length);
    const parts = raw.split(":");
    if (parts.length !== 3) return "";

    const [ivHex, authTagHex, encryptedHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch (error) {
    console.error("[Meta Encryption] Error al desencriptar CAPI token:", error);
    return "";
  }
}

/**
 * Genera una versión enmascarada del token para mostrar de forma segura en la UI del CMS.
 * @param plainOrEncrypted Token almacenado en la base de datos.
 */
export function maskToken(plainOrEncrypted: string | null | undefined): string {
  const decrypted = decryptToken(plainOrEncrypted);
  if (!decrypted) return "";
  if (decrypted.length <= 8) return "••••••••";
  return `${decrypted.slice(0, 4)}••••••••••••${decrypted.slice(-4)}`;
}
