import { NextResponse, type NextRequest } from "next/server";
import { isErr, sesiUser } from "@/lib/server-auth";
import { galat, langApi } from "@/lib/galat-api";
import { statsGitHub } from "@/lib/github-stats";

// Statistik GitHub user (profil + streak + bahasa + angka). Token tetap
// server-side. ?segar=1 = bypass cache (tombol Segarkan); respons biasa
// boleh di-cache privat 15 mnt (server juga cache memori).
export async function GET(req: NextRequest) {
  const ctx = await sesiUser(req);
  if (isErr(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const segar = new URL(req.url).searchParams.get("segar") === "1";
  try {
    const data = await statsGitHub(ctx.userId, langApi(req), segar);
    return NextResponse.json(data, {
      headers: { "Cache-Control": segar ? "no-store" : "private, max-age=900" },
    });
  } catch (e) {
    const tokenMsg = galat(req, "tokenGithub");
    const isToken = e instanceof Error && e.message === tokenMsg;
    return NextResponse.json(
      { error: isToken ? tokenMsg : galat(req, "statsGagal") },
      { status: isToken ? 401 : 502 }
    );
  }
}
