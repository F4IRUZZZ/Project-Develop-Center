import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isErr, sesiUser } from "@/lib/server-auth";

// Hapus akun + seluruh data milik user. Destruktif & permanen:
// revoke keys, hapus baris users (CASCADE membersihkan projects, tasks,
// command_queue, activity_log, notification_reads, provider_keys).
// Klien wajib signOut() setelah 200.
export async function DELETE(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const sql = db();
  await sql`UPDATE api_keys SET revoked = true WHERE user_id = ${ctx.userId}`;
  await sql`DELETE FROM users WHERE id = ${ctx.userId}`;
  return NextResponse.json({ ok: true });
}
