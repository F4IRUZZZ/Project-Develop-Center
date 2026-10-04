import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isErr, sesiUser, buatId } from "@/lib/server-auth";
import { enkrip } from "@/lib/crypto";
import { galat } from "@/lib/galat-api";

// Kelola tujuan Telegram. Token tak pernah kembali ke client utuh.
export async function GET(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const rows = (await db()`SELECT id, label, chat_id, aktif, created_at FROM notif_tujuan WHERE user_id = ${ctx.userId} ORDER BY created_at DESC`) as Array<Record<string, unknown>>;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  let body: { label?: string; bot_token?: string; chat_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: galat(req, "bodyInvalid") }, { status: 400 });
  }
  const label = body.label?.trim().slice(0, 60) || "Telegram";
  const token = body.bot_token?.trim() ?? "";
  const chatId = body.chat_id?.trim() ?? "";
  if (!/^\d+:[\w-]{20,}$/.test(token)) {
    return NextResponse.json({ error: galat(req, "tgFormatInvalid") }, { status: 400 });
  }
  if (!chatId) {
    return NextResponse.json({ error: galat(req, "tgChatWajib") }, { status: 400 });
  }

  const id = buatId("tg");
  await db()`INSERT INTO notif_tujuan (id, user_id, channel, label, bot_token_enc, chat_id) VALUES (${id}, ${ctx.userId}, 'telegram', ${label}, ${enkrip(token)}, ${chatId})`;
  return NextResponse.json({ id }, { status: 201 });
}
