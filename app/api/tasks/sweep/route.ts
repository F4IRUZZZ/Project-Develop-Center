import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isErr, sesiUser } from "@/lib/server-auth";
import { sapuStuck } from "@/lib/stuck-sweep";

// P2: sweep stuck manual/cron. Auth sesi ATAU Bearer API key (MCP/cron).
// GET ?dry=1 -> hitung tanpa tulis. GET/POST biasa -> tulis.
export async function GET(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const kering = new URL(req.url).searchParams.get("dry") === "1";
  if (kering) {
    const sql = db();
    const basi = (await sql`
      SELECT COUNT(*)::int AS n FROM tasks
      WHERE user_id = ${ctx.userId} AND status = 'working'
        AND updated_at < now() - interval '30 minutes'
    `) as unknown as Array<{ n: number }>;
    const yatim = (await sql`
      SELECT COUNT(*)::int AS n FROM command_queue
      WHERE user_id = ${ctx.userId} AND status IN ('pending', 'processing')
        AND created_at < now() - interval '30 minutes'
    `) as unknown as Array<{ n: number }>;
    return NextResponse.json({ tasks: basi[0]?.n ?? 0, pendingYatim: yatim[0]?.n ?? 0, dry: true });
  }
  const hasil = await sapuStuck(ctx.userId);
  return NextResponse.json({ ...hasil, dry: false });
}

export async function POST(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const hasil = await sapuStuck(ctx.userId);
  return NextResponse.json({ ...hasil, dry: false });
}
