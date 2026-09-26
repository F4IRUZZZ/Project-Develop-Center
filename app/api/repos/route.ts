import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import type { Project } from "@/lib/types";

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  default_branch: string;
  pushed_at: string;
  private: boolean;
}

const MAX_REPO = 10;

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.accessToken) {
    return NextResponse.json({ error: "Belum login GitHub" }, { status: 401 });
  }

  const res = await fetch("https://api.github.com/user/repos?per_page=100&sort=pushed", {
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
      Accept: "application/vnd.github+json",
    },
    next: { revalidate: 120 },
  });

  if (!res.ok) {
    return NextResponse.json({ error: `GitHub API ${res.status}` }, { status: 502 });
  }

  const repos = (await res.json()) as GitHubRepo[];
  const projects: Project[] = repos
    .sort((a, b) => +new Date(b.pushed_at) - +new Date(a.pushed_at))
    .slice(0, MAX_REPO)
    .map((r) => ({
      id: `gh-${r.id}`,
      repoName: r.name,
      repoFull: r.full_name,
      status: "idle" as const,
      statusLabel: "Idle",
      taskLabel: `Branch ${r.default_branch}`,
      taskPrefix: "Terakhir" as const,
      progress: 100,
      progressTone: "success" as const,
      meta: `push ${r.pushed_at.slice(0, 10)} · ${r.default_branch}`,
      branch: r.default_branch,
      actions: ["detail", "command"] as Project["actions"],
    }));

  return NextResponse.json(projects);
}
