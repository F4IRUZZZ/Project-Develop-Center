import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// AES-256-GCM untuk token GitHub (PRD §14.2). Format simpan: iv:tag:data (hex).
function kunci(): Buffer {
  const hex = process.env.ENCRYPTION_KEY ?? "";
  if (!/^[0-9a-f]{64}$/i.test(hex)) {
    throw new Error("ENCRYPTION_KEY harus 64 hex (32 byte). Lihat .env.example.");
  }
  return Buffer.from(hex, "hex");
}

export function enkrip(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", kunci(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${cipher.getAuthTag().toString("hex")}:${data.toString("hex")}`;
}

export function dekrip(paket: string): string {
  const [ivH, tagH, dataH] = paket.split(":");
  const decipher = createDecipheriv("aes-256-gcm", kunci(), Buffer.from(ivH, "hex"));
  decipher.setAuthTag(Buffer.from(tagH, "hex"));
  return Buffer.concat([decipher.update(Buffer.from(dataH, "hex")), decipher.final()]).toString("utf8");
}
