import { NextResponse, type NextRequest } from "next/server";
import { isErr, sesiUser } from "@/lib/server-auth";
import { galat, langApi } from "@/lib/galat-api";
import { statsGitHub } from "@/lib/github-stats";

// Statistik GitHub user (streak + bahasa + angka). Token tetap server-side;
// respons boleh di-cache privat 1 jam (server juga cache memori).
export async function GET(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  try {
    const data = await statsGitHub(ctx.userId, langApi(req));
    return NextResponse.json(data, { headers: { "Cache-Control": "private, max-age=3600" } });
  } catch (e) {
    const tokenMsg = galat(req, "tokenGithub");
    const isToken = e instanceof Error && e.message === tokenMsg;
    return NextResponse.json(
      { error: isToken ? tokenMsg : galat(req, "statsGagal") },
      { status: isToken ? 401 : 502 }
    );
  }
}
