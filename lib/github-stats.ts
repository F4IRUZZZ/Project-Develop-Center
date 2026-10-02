// Statistik GitHub native via GraphQL (server-side, token user tak pernah
// ke client). 1 query: contributionsCollection (total + kalender streak)
// + repositories (stars + agregat bahasa). Cache memori 1 jam per user.
import { tokenGitHub } from "./server-auth";
import { pesan, type LangApi } from "./galat-api";
import { hitungStreak, type Hari, type InfoStreak } from "./streak";

const GQL = "https://api.github.com/graphql";
const TTL_MS = 60 * 60 * 1000;

export interface Bahasa {
  nama: string;
  warna: string | null;
  byte: number;
  persen: number;
}

export interface StatsGitHub {
  login: string;
  bintang: number;
  commitSetahun: number;
  pr: number;
  issue: number;
  repoDisentuh: number;
  streak: InfoStreak;
  bahasa: Bahasa[];
}

interface Cache {
  at: number;
  data: StatsGitHub;
}
const cache = new Map<string, Cache>();

const QUERY = `
query($dari: DateTime!) {
  viewer {
    login
    contributionsCollection(from: $dari) {
      totalCommitContributions
      totalIssueContributions
      totalPullRequestContributions
      totalRepositoriesWithContributedCommits
      contributionCalendar {
        weeks { contributionDays { date contributionCount } }
      }
    }
    repositories(first: 100, ownerAffiliations: OWNER, orderBy: {field: STARGAZERS, direction: DESC}) {
      nodes {
        stargazerCount
        languages(first: 5, orderBy: {field: SIZE, direction: DESC}) {
          edges { size node { name color } }
        }
      }
    }
  }
}`;

export async function statsGitHub(userId: string, lang: LangApi = "id"): Promise<StatsGitHub> {
  const lawas = cache.get(userId);
  if (lawas && Date.now() - lawas.at < TTL_MS) return lawas.data;

  const token = await tokenGitHub(userId);
  if (!token) throw new Error(pesan("tokenGithub", lang));

  const dari = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
  const res = await fetch(GQL, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: QUERY, variables: { dari } }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`GitHub GraphQL ${res.status}`);
  const json = (await res.json()) as {
    data?: {
      viewer: {
        login: string;
        contributionsCollection: {
          totalCommitContributions: number;
          totalIssueContributions: number;
          totalPullRequestContributions: number;
          totalRepositoriesWithContributedCommits: number;
          contributionCalendar: { weeks: Array<{ contributionDays: Array<{ date: string; contributionCount: number }> }> };
        };
        repositories: {
          nodes: Array<{
            stargazerCount: number;
            languages: { edges: Array<{ size: number; node: { name: string; color: string | null } }> };
          }>;
        };
      };
    };
    errors?: Array<{ message: string }>;
  };
  if (!json.data) throw new Error(json.errors?.[0]?.message ?? "GitHub GraphQL tanpa data");

  const v = json.data.viewer;
  const cc = v.contributionsCollection;
  const hari: Hari[] = cc.contributionCalendar.weeks.flatMap((w) =>
    w.contributionDays.map((d) => ({ tanggal: d.date, jumlah: d.contributionCount }))
  );
  const streak = hitungStreak(hari);

  let bintang = 0;
  const perBahasa = new Map<string, { byte: number; warna: string | null }>();
  for (const r of v.repositories.nodes) {
    bintang += r.stargazerCount;
    for (const e of r.languages.edges) {
      const s = perBahasa.get(e.node.name) ?? { byte: 0, warna: e.node.color };
      s.byte += e.size;
      perBahasa.set(e.node.name, s);
    }
  }
  const totalByte = [...perBahasa.values()].reduce((s, b) => s + b.byte, 0);
  const bahasa: Bahasa[] = [...perBahasa.entries()]
    .map(([nama, b]) => ({ nama, warna: b.warna, byte: b.byte, persen: totalByte > 0 ? (b.byte / totalByte) * 100 : 0 }))
    .sort((a, b) => b.byte - a.byte)
    .slice(0, 8);

  const data: StatsGitHub = {
    login: v.login,
    bintang,
    commitSetahun: cc.totalCommitContributions,
    pr: cc.totalPullRequestContributions,
    issue: cc.totalIssueContributions,
    repoDisentuh: cc.totalRepositoriesWithContributedCommits,
    streak,
    bahasa,
  };
  cache.set(userId, { at: Date.now(), data });
  return data;
}
