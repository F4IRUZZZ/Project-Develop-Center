import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isErr, sesiUser } from "@/lib/server-auth";
import { galat } from "@/lib/galat-api";

// DELETE = cabut lunak (revoke). ?permanen=1 = hapus baris permanen,
// hanya bila sudah dicabut (409 bila masih aktif — cabut dulu).
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { id } = await params;
  if (new URL(req.url).searchParams.get("permanen") === "1") {
    const cur = (await db()`SELECT revoked FROM api_keys WHERE id = ${id} AND user_id = ${ctx.userId}`) as unknown as Array<{
      revoked: boolean;
    }>;
    if (cur.length === 0) return NextResponse.json({ error: galat(req, "keyHilang") }, { status: 404 });
    if (!cur[0].revoked) {
      return NextResponse.json({ error: galat(req, "keyAktifDulu") }, { status: 409 });
    }
    await db()`DELETE FROM api_keys WHERE id = ${id} AND user_id = ${ctx.userId}`;
    return NextResponse.json({ ok: true, hapus: true });
  }

  const rows = await db()`UPDATE api_keys SET revoked = true WHERE id = ${id} AND user_id = ${ctx.userId} RETURNING id`;
  if (rows.length === 0) return NextResponse.json({ error: galat(req, "keyHilang") }, { status: 404 });
  return NextResponse.json({ ok: true });
}
