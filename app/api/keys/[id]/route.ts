import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isErr, sesiUser } from "@/lib/server-auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { id } = await params;
  const rows = await db()`UPDATE api_keys SET revoked = true WHERE id = ${id} AND user_id = ${ctx.userId} RETURNING id`;
  if (rows.length === 0) return NextResponse.json({ error: "Key tidak ketemu" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
