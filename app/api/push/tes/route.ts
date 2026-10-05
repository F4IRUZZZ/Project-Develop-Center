import { NextResponse, type NextRequest } from "next/server";
import { isErr, sesiUser } from "@/lib/server-auth";
import { galat } from "@/lib/galat-api";
import { kirimPush } from "@/lib/push";

// Kirim push tes ke perangkat sendiri. Rate-limit sederhana: 1x/menit
// per user (anti-spam/anti-boros kuota push service).
const terakhirTes = new Map<string, number>();

export async function POST(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const lalu = terakhirTes.get(ctx.userId) ?? 0;
  if (Date.now() - lalu < 60 * 1000) {
    return NextResponse.json({ error: galat(req, "pushTesSabar") }, { status: 429 });
  }
  terakhirTes.set(ctx.userId, Date.now());

  const hasil = await kirimPush(ctx.userId, "PDC: tes push", "Notifikasi tray HP bekerja. Ketuk untuk membuka.");
  if (hasil.terkirim === 0) {
    return NextResponse.json({ error: galat(req, "pushTanpaPerangkat") }, { status: 404 });
  }
  return NextResponse.json({ ok: true, ...hasil });
}
