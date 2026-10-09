import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isErr, sesiUser } from "@/lib/server-auth";
import { galat } from "@/lib/galat-api";
import { kirimTelegram, siarTelegramRinci } from "@/lib/telegram";
import { dekrip } from "@/lib/crypto";

// Hapus tujuan, kirim pesan tes ({ aksi: "test" }), atau uji jalur siar
// Selesai ({ aksi: "uji-selesai" }) — lewat siarTelegramRinci yang sama
// dengan catatSelesai (#227). Balikan counts saja, tanpa token.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { id } = await params;
  let body: { aksi?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  if (body.aksi !== "test" && body.aksi !== "uji-selesai") {
    return NextResponse.json({ error: galat(req, "bodyInvalid") }, { status: 400 });
  }

  if (body.aksi === "uji-selesai") {
    // #231: validasi :id dulu agar kontrak per-ID jujur (404 bila tak ada).
    // Catatan kontrak: siar di bawah menguji JALUR siar global ke semua
    // tujuan aktif user, bukan hanya :id tersebut (200 = jalur sehat).
    const ada = (await db()`SELECT id FROM notif_tujuan WHERE id = ${id} AND user_id = ${ctx.userId}`) as Array<{ id: string }>;
    if (ada.length === 0) return NextResponse.json({ error: galat(req, "tgHilang") }, { status: 404 });
    const hasil = await siarTelegramRinci(ctx.userId, "Uji jalur Selesai PDC: siar berfungsi. 🤖");
    return NextResponse.json({ ok: hasil.terkirim > 0, ...hasil });
  }

  const rows = (await db()`SELECT bot_token_enc, chat_id FROM notif_tujuan WHERE id = ${id} AND user_id = ${ctx.userId}`) as Array<{
    bot_token_enc: string;
    chat_id: string;
  }>;
  if (rows.length === 0) return NextResponse.json({ error: galat(req, "tgHilang") }, { status: 404 });
  let token = "";
  try {
    token = dekrip(String(rows[0].bot_token_enc));
  } catch {
    return NextResponse.json({ error: galat(req, "tgTokenRusak") }, { status: 500 });
  }
  const ok = await kirimTelegram(token, String(rows[0].chat_id), "Tes notifikasi PDC: bot terhubung. 🤖");
  if (!ok) return NextResponse.json({ error: galat(req, "tgGagalKirim") }, { status: 502 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { id } = await params;
  const rows = await db()`DELETE FROM notif_tujuan WHERE id = ${id} AND user_id = ${ctx.userId} RETURNING id`;
  if (rows.length === 0) return NextResponse.json({ error: galat(req, "tgHilang") }, { status: 404 });
  return NextResponse.json({ ok: true });
}
