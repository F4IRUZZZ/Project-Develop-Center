-- D3: users minimal + command_queue (PRD §10, subset).
-- Tabel projects/tasks/activity_log menyusul di D3b/D4.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  github_id TEXT NOT NULL UNIQUE,
  github_username TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  access_token_enc TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS command_queue (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  command_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  result TEXT
);

CREATE INDEX IF NOT EXISTS idx_command_queue_user
  ON command_queue (user_id, created_at DESC);

-- D3b: projects/tasks/activity_log (PRD §10, subset).

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  repo_name TEXT NOT NULL,
  repo_full TEXT NOT NULL,
  repo_url TEXT,
  default_branch TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, repo_full)
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  command_id TEXT REFERENCES command_queue(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle'
    CHECK (status IN ('idle', 'working', 'waiting', 'completed', 'failed', 'stuck')),
  progress INTEGER NOT NULL DEFAULT 0,
  result_summary TEXT,
  git_branch TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_project
  ON tasks (project_id, created_at DESC);

-- P2: sweep stuck (working basi per user).
CREATE INDEX IF NOT EXISTS idx_tasks_stuck
  ON tasks (user_id, status, updated_at);

CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'info'
    CHECK (type IN ('progress', 'commit', 'pr', 'issue', 'error', 'info')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user
  ON activity_log (user_id, created_at DESC);

-- G: status dibaca notifikasi turunan (tanpa FK ke activity agar tahan hapus).
CREATE TABLE IF NOT EXISTS notification_reads (
  activity_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (activity_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_reads_user
  ON notification_reads (user_id);

-- Audit-2 M7: dedup pengiriman webhook GitHub (anti-replay).
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  delivery_id TEXT PRIMARY KEY,
  diterima TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Presence: sesi AI per repo (dilaporkan plugin OpenCode, bukan LLM).
-- ended_at NULL = belum ditutup eksplisit; last_seen basi >3 mnt = nonaktif (display).
-- last_edit_at = sunting file terakhir (jejak metadata, tanpa isi konten).
-- ringkasan_terakhir = teks balasan asisten giliran terakhir, latest-only,
-- sudah diredaksi (tanpa blok kode, cap 500). Berlaku semua repo (retensi
-- DB sendiri; redaksi regex bukan kedap — jangan share/invoice isinya).
CREATE TABLE IF NOT EXISTS agent_sessions (
  session_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  repo_full TEXT,
  mode TEXT NOT NULL DEFAULT 'build',
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_edit_at TIMESTAMPTZ,
  ringkasan_terakhir TEXT,
  ringkasan_waktu TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_agent_sessions_user
  ON agent_sessions (user_id, last_seen_at DESC);

-- Jejak aktivitas sesi (metadata saja: path + angka stat, TANPA isi file).
-- kind: 'edit' (file disentuh) | 'commit' (milestone komit baru).
CREATE TABLE IF NOT EXISTS session_file_events (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES agent_sessions(session_id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'edit',
  file_path TEXT,
  files_changed INT,
  lines_added INT,
  lines_removed INT,
  commit_sha TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_session_file_events_sesi
  ON session_file_events (session_id, created_at DESC);

-- Kesehatan plugin per repo (untuk halaman Status): versi salinan template
-- yang melapor + kapan terakhir. Versi basi = di bawah VERSI_PLUGIN_TERKINI.
CREATE TABLE IF NOT EXISTS repo_health (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  repo_full TEXT NOT NULL,
  plugin_version TEXT,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, repo_full)
);

-- D4: API keys untuk MCP bridge (hash, bukan secret mentah).

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  prefix TEXT NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT false,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash
  ON api_keys (key_hash);

-- F-batch DIBATALKAN total (2026-09-27): kolom mode dihapus di semua DB.
ALTER TABLE command_queue DROP COLUMN IF EXISTS mode;

-- F-batch: visibilitas repo (cache dari GitHub).
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_private BOOLEAN;

-- Audit-1 H1: kunci provider BYOK (nilai terenkripsi, tak pernah dibaca balik).
CREATE TABLE IF NOT EXISTS provider_keys (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  key_enc TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, provider)
);
