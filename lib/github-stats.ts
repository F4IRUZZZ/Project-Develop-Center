// Statistik GitHub native via GraphQL (server-side, token user tak pernah
// ke client). Query 1: contributionsCollection (total + kalender streak).
// Query 2 (loop pagination penuh): viewer profil (avatar, nama, bio,
// followers/following, total repo) + repositories (stars + agregat bahasa +
// daftar teratas). Cache memori 15 mnt per user (bypass via segar=true).
import { tokenGitHub } from "./server-auth";
import { pesan, type LangApi } from "./galat-api";
import { hitungStreak, type Hari, type InfoStreak } from "./streak";

const GQL = "https://api.github.com/graphql";
const TTL_MS = 15 * 60 * 1000;

export interface Bahasa {
  nama: string;
  warna: string | null;
  byte: number;
  persen: number;
}

// Repo yang DIBINTANGI user (tab Stars GitHub) — beda dari perolehan
// bintang di repo sendiri. Ditampilkan apa adanya milik orang lain.
export interface RepoBintang {
  nama: string;
  pemilik: string;
  url: string;
  deskripsi: string | null;
  bintang: number;
  fork: number;
  bahasa: string | null;
  warnaBahasa: string | null;
  diperbarui: string;
}

export interface StatsGitHub {
  login: string;
  nama: string | null;
  avatar: string;
  bio: string | null;
  pengikut: number;
  mengikuti: number;
  totalRepo: number;
  bintangDiberi: number;
  repoBintang: RepoBintang[];
  commitSetahun: number;
  pr: number;
  issue: number;
  repoDisentuh: number;
  streak: InfoStreak;
  bahasa: Bahasa[];
  diperbarui: string;
}

interface Cache {
  at: number;
  data: StatsGitHub;
}
const cache = new Map<string, Cache>();

// Kontribusi setahun (1 query, tanpa pagination).
const QUERY_KONTRIB = `
query($dari: DateTime!) {
  viewer {
    contributionsCollection(from: $dari) {
      totalCommitContributions
      totalIssueContributions
      totalPullRequestContributions
      totalRepositoriesWithContributedCommits
      contributionCalendar {
        weeks { contributionDays { date contributionCount } }
      }
    }
  }
}`;

// Profil + repo per halaman (loop hingga pageInfo habis — repo ke-101+
// ikut terhitung, tak seperti first:100 dulu).
const QUERY_REPO = `
query($kursor: String) {
  viewer {
    login
    name
    avatarUrl
    bio
    followers { totalCount }
    following { totalCount }
    repositories(first: 100, after: $kursor, ownerAffiliations: OWNER, orderBy: {field: STARGAZERS, direction: DESC}) {
      totalCount
      pageInfo { hasNextPage endCursor }
      nodes {
        languages(first: 5, orderBy: {field: SIZE, direction: DESC}) {
          edges { size node { name color } }
        }
      }
    }
  }
}`;

interface NodeRepo {
  languages: { edges: Array<{ size: number; node: { name: string; color: string | null } }> };
}

async function gql<T>(token: string, query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(GQL, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`GitHub GraphQL ${res.status}`);
  const json = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (!json.data) throw new Error(json.errors?.[0]?.message ?? "GitHub GraphQL tanpa data");
  return json.data;
}

export async function statsGitHub(userId: string, lang: LangApi = "id", segar = false): Promise<StatsGitHub> {
  const lawas = cache.get(userId);
  if (!segar && lawas && Date.now() - lawas.at < TTL_MS) return lawas.data;

  const token = await tokenGitHub(userId);
  if (!token) throw new Error(pesan("tokenGithub", lang));

  const dari = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
  const dKon = await gql<{
    viewer: {
      contributionsCollection: {
        totalCommitContributions: number;
        totalIssueContributions: number;
        totalPullRequestContributions: number;
        totalRepositoriesWithContributedCommits: number;
        contributionCalendar: { weeks: Array<{ contributionDays: Array<{ date: string; contributionCount: number }> }> };
      };
    };
  }>(token, QUERY_KONTRIB, { dari });
  const cc = dKon.viewer.contributionsCollection;
  const hari: Hari[] = cc.contributionCalendar.weeks.flatMap((w) =>
    w.contributionDays.map((d) => ({ tanggal: d.date, jumlah: d.contributionCount }))
  );
  const streak = hitungStreak(hari);

  // Loop repo: profil diambil dari halaman pertama (identik tiap halaman).
  let login = "";
  let nama: string | null = null;
  let avatar = "";
  let bio: string | null = null;
  let pengikut = 0;
  let mengikuti = 0;
  let totalRepo = 0;
  const perBahasa = new Map<string, { byte: number; warna: string | null }>();
  let kursor: string | null = null;
  interface HalRepo {
    viewer: {
      login: string;
      name: string | null;
      avatarUrl: string;
      bio: string | null;
      followers: { totalCount: number };
      following: { totalCount: number };
      repositories: {
        totalCount: number;
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
        nodes: NodeRepo[];
      };
    };
  }
  for (let hal = 0; hal < 20; hal += 1) {
    const d: HalRepo = await gql<HalRepo>(token, QUERY_REPO, { kursor });
    const v = d.viewer;
    if (hal === 0) {
      login = v.login;
      nama = v.name;
      avatar = v.avatarUrl;
      bio = v.bio;
      pengikut = v.followers.totalCount;
      mengikuti = v.following.totalCount;
      totalRepo = v.repositories.totalCount;
    }
    for (const r of v.repositories.nodes) {
      for (const e of r.languages.edges) {
        const s = perBahasa.get(e.node.name) ?? { byte: 0, warna: e.node.color };
        s.byte += e.size;
        perBahasa.set(e.node.name, s);
      }
    }
    if (!v.repositories.pageInfo.hasNextPage) break;
    kursor = v.repositories.pageInfo.endCursor;
  }

  // Repo yang dibintangi user (1 query, 100 terbaru + total exact).
  const dStar = await gql<{
    viewer: {
      starredRepositories: {
        totalCount: number;
        nodes: Array<{
          nameWithOwner: string;
          url: string;
          description: string | null;
          stargazerCount: number;
          forkCount: number;
          updatedAt: string;
          primaryLanguage: { name: string; color: string | null } | null;
        }>;
      };
    };
  }>(
    token,
    `query {
      viewer {
        starredRepositories(first: 100, orderBy: {field: STARRED_AT, direction: DESC}) {
          totalCount
          nodes {
            nameWithOwner
            url
            description
            stargazerCount
            forkCount
            updatedAt
            primaryLanguage { name color }
          }
        }
      }
    }`,
    {}
  );
  const bintangDiberi = dStar.viewer.starredRepositories.totalCount;
  const repoBintang: RepoBintang[] = dStar.viewer.starredRepositories.nodes.map((r) => {
    const [pemilik = "", ...sisa] = r.nameWithOwner.split("/");
    return {
      nama: sisa.join("/") || r.nameWithOwner,
      pemilik,
      url: r.url,
      deskripsi: r.description,
      bintang: r.stargazerCount,
      fork: r.forkCount,
      bahasa: r.primaryLanguage?.name ?? null,
      warnaBahasa: r.primaryLanguage?.color ?? null,
      diperbarui: r.updatedAt,
    };
  });
  const totalByte = [...perBahasa.values()].reduce((s, b) => s + b.byte, 0);
  const bahasa: Bahasa[] = [...perBahasa.entries()]
    .map(([n, b]) => ({ nama: n, warna: b.warna, byte: b.byte, persen: totalByte > 0 ? (b.byte / totalByte) * 100 : 0 }))
    .sort((a, b) => b.byte - a.byte)
    .slice(0, 8);


  const kini = new Date().toISOString();
  const data: StatsGitHub = {
    login,
    nama,
    avatar,
    bio,
    pengikut,
    mengikuti,
    totalRepo,
    bintangDiberi,
    repoBintang,
    commitSetahun: cc.totalCommitContributions,
    pr: cc.totalPullRequestContributions,
    issue: cc.totalIssueContributions,
    repoDisentuh: cc.totalRepositoriesWithContributedCommits,
    streak,
    bahasa,
    diperbarui: kini,
  };
  cache.set(userId, { at: Date.now(), data });
  return data;
}
