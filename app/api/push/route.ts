import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isErr, sesiUser } from "@/lib/server-auth";
import { galat } from "@/lib/galat-api";

// Kelola langganan Web Push per perangkat. Endpoint unik global.
export async function POST(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  let body: { endpoint?: string; p256dh?: string; auth?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: galat(req, "bodyInvalid") }, { status: 400 });
  }
  const endpoint = body.endpoint?.trim() ?? "";
  const p256dh = body.p256dh?.trim() ?? "";
  const auth = body.auth?.trim() ?? "";
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: galat(req, "pushDataWajib") }, { status: 400 });
  }

  await db()`INSERT INTO push_langganan (endpoint, user_id, p256dh, auth)
    VALUES (${endpoint}, ${ctx.userId}, ${p256dh}, ${auth})
    ON CONFLICT (endpoint) DO UPDATE SET user_id = ${ctx.userId}, p256dh = ${p256dh}, auth = ${auth}`;
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  let body: { endpoint?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: galat(req, "bodyInvalid") }, { status: 400 });
  }
  if (!body.endpoint) {
    await db()`DELETE FROM push_langganan WHERE user_id = ${ctx.userId}`;
  } else {
    await db()`DELETE FROM push_langganan WHERE endpoint = ${body.endpoint} AND user_id = ${ctx.userId}`;
  }
  return NextResponse.json({ ok: true });
}
