import { NextResponse, type NextRequest } from "next/server";
import { isErr, sesiUser } from "@/lib/server-auth";
import { statsGitHub } from "@/lib/github-stats";

// Statistik GitHub user (streak + bahasa + angka). Token tetap server-side;
// respons boleh di-cache privat 1 jam (server juga cache memori).
export async function GET(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  try {
    const data = await statsGitHub(ctx.userId);
    return NextResponse.json(data, { headers: { "Cache-Control": "private, max-age=3600" } });
  } catch (e) {
    const pesan = e instanceof Error ? e.message : "Gagal mengambil statistik GitHub";
    const status = pesan.includes("login ulang") ? 401 : 502;
    return NextResponse.json({ error: pesan }, { status });
  }
}
