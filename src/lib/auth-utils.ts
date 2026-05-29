import { pbkdf2Sync, randomBytes, createHmac } from "crypto";

// 1. Password Hashing (PBKDF2-SHA512)
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedValue: string): boolean {
  if (!storedValue) return false;
  
  // If not hashed in salt:hash format, do a safe fallback check for dev migration
  if (!storedValue.includes(":")) {
    return password === storedValue;
  }
  const [salt, hash] = storedValue.split(":");
  const testHash = pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return hash === testHash;
}

// 2. Base32 Decoding for TOTP
function base32Decode(base32: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = base32.toUpperCase().replace(/=+$/, "");
  let bits = 0;
  let value = 0;
  const buffer = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = alphabet.indexOf(cleaned[i]);
    if (idx === -1) throw new Error("Invalid base32 character");
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      buffer.push((value >> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(buffer);
}

// 3. Generate TOTP Secret (Base32)
export function generateTOTPSecret(length = 16): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let secret = "";
  for (let i = 0; i < length; i++) {
    secret += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return secret;
}

// 4. Verify TOTP Token (Google Authenticator)
export function verifyTOTPToken(token: string, secret: string, window = 1): boolean {
  try {
    const key = base32Decode(secret);
    const epoch = Math.floor(Date.now() / 1000);
    const counter = Math.floor(epoch / 30);

    for (let i = -window; i <= window; i++) {
      const c = counter + i;
      // Convert counter to 8-byte buffer
      const buffer = Buffer.alloc(8);
      let temp = c;
      for (let j = 7; j >= 0; j--) {
        buffer[j] = temp & 0xff;
        temp = temp >> 8;
      }

      const hmac = createHmac("sha1", key).update(buffer).digest();
      const offset = hmac[hmac.length - 1] & 0xf;
      const code =
        ((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff);

      const otp = (code % 1_000_000).toString().padStart(6, "0");
      if (otp === token.trim()) {
        return true;
      }
    }
  } catch (e) {
    return false;
  }
  return false;
}

// 5. Get TOTP Authentication URL for QR Code
export function getTOTPAuthUrl(email: string, secret: string): string {
  return `otpauth://totp/EliteCleaning:${email}?secret=${secret}&issuer=EliteCleaning`;
}

// 6. Generate 6-Digit Email OTP
export function generateEmailOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

