// Notifikasi Telegram keluar (PRD F13). Token bot terenkripsi AES-256-GCM
// di DB (pola provider_keys); tak pernah kembali ke client utuh.
// Gagal kirim = diam: notif eksternal tak boleh ganggu alur utama.
import { db } from "@/lib/db";
import { dekrip } from "@/lib/crypto";

const API_TG = "https://api.telegram.org";

export interface TujuanTelegram {
  id: string;
  label: string;
  chat_id: string;
  aktif: boolean;
}

export async function tujuanAktif(userId: string): Promise<TujuanTelegram[]> {
  const rows = (await db()`SELECT id, label, chat_id FROM notif_tujuan WHERE user_id = ${userId} AND aktif = true AND channel = 'telegram'`) as Array<{
    id: string;
    label: string;
    chat_id: string;
  }>;
  return rows.map((r) => ({ id: String(r.id), label: String(r.label), chat_id: String(r.chat_id), aktif: true }));
}

async function tokenUntuk(id: string, userId: string): Promise<string | null> {
  const rows = (await db()`SELECT bot_token_enc FROM notif_tujuan WHERE id = ${id} AND user_id = ${userId}`) as Array<{
    bot_token_enc: string;
  }>;
  if (rows.length === 0) return null;
  try {
    return dekrip(String(rows[0].bot_token_enc));
  } catch {
    return null;
  }
}

export async function kirimTelegram(botToken: string, chatId: string, pesan: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_TG}/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: pesan.slice(0, 4000) }),
      signal: AbortSignal.timeout(15000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Siarkan 1 pesan ke semua tujuan aktif user. Best-effort per tujuan.
// Hasil rinci (#227): tanpa token/isi rahasia, aman dilog + dikembalikan
// ke endpoint diagnosis. Gagal kirim = diam di sisi alur utama.
export interface HasilSiar {
  tujuan: number;
  terkirim: number;
  gagalDekrip: number;
  gagalKirim: number;
}

export async function siarTelegramRinci(userId: string, pesan: string): Promise<HasilSiar> {
  const hasil: HasilSiar = { tujuan: 0, terkirim: 0, gagalDekrip: 0, gagalKirim: 0 };
  let daftar: TujuanTelegram[] = [];
  try {
    daftar = await tujuanAktif(userId);
  } catch {
    return hasil;
  }
  hasil.tujuan = daftar.length;
  for (const t of daftar) {
    const token = await tokenUntuk(t.id, userId);
    if (!token) {
      hasil.gagalDekrip += 1;
      continue;
    }
    if (await kirimTelegram(token, t.chat_id, pesan)) hasil.terkirim += 1;
    else hasil.gagalKirim += 1;
  }
  return hasil;
}

export async function siarTelegram(userId: string, pesan: string): Promise<number> {
  return (await siarTelegramRinci(userId, pesan)).terkirim;
}
