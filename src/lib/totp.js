import * as OTPAuth from "otpauth";

// Generate secret key baru untuk 2FA
export const generateTOTPSecret = () => {
  const secret = new OTPAuth.Secret({ size: 20 });
  return secret.base32;
};

// Generate URI untuk QR Code
export const generateTOTPURI = (secret, email, issuer = "Photo Memory") => {
  const totp = new OTPAuth.TOTP({
    issuer: issuer,
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });

  return totp.toString();
};

// Verifikasi kode TOTP yang diinput user
export const verifyTOTP = (secret, token) => {
  const totp = new OTPAuth.TOTP({
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });

  // Delta 1 = toleransi 1 periode (30 detik sebelum/sesudah)
  const delta = totp.validate({ token, window: 1 });

  return delta !== null;
};

// Generate backup codes (untuk recovery jika user kehilangan HP)
export const generateBackupCodes = (count = 8) => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
};
