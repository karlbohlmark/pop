import { Database } from "bun:sqlite";
import type { SavedConfiguration, Channel, Tunnel, LogLevel } from "./types";

// Ensure data directory exists
const dataDir = "./data";
try {
  await Bun.write(`${dataDir}/.gitkeep`, "");
} catch {
  // Directory might already exist
}

const db = new Database(`${dataDir}/ztv.db`);

// Initialize schema
db.run(`
  CREATE TABLE IF NOT EXISTS configurations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    data TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )
`);

// Prepared statements
const insertConfig = db.prepare(`
  INSERT INTO configurations (id, name, description, data, created_at, updated_at)
  VALUES ($id, $name, $description, $data, datetime('now'), datetime('now'))
`);

const updateConfig = db.prepare(`
  UPDATE configurations
  SET name = $name, description = $description, data = $data, updated_at = datetime('now')
  WHERE id = $id
`);

const selectConfig = db.prepare(`
  SELECT id, name, description, data, created_at, updated_at
  FROM configurations
  WHERE id = ?
`);

const selectAllConfigs = db.prepare(`
  SELECT id, name, description, data, created_at, updated_at
  FROM configurations
  ORDER BY updated_at DESC
`);

const deleteConfig = db.prepare(`
  DELETE FROM configurations WHERE id = ?
`);

const selectSetting = db.prepare(`
  SELECT value FROM settings WHERE key = ?
`);

const upsertSetting = db.prepare(`
  INSERT INTO settings (key, value) VALUES ($key, $value)
  ON CONFLICT(key) DO UPDATE SET value = $value
`);

function generateId(): string {
  return `cfg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

interface ConfigRow {
  id: string;
  name: string;
  description: string;
  data: string;
  created_at: string;
  updated_at: string;
}

function rowToConfig(row: ConfigRow): SavedConfiguration {
  const parsed = JSON.parse(row.data);
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    channels: parsed.channels || [],
    tunnels: parsed.tunnels || [],
    loggingLevel: parsed.loggingLevel || "debug",
  };
}

export const persistence = {
  // ============================================
  // Configuration Management
  // ============================================

  saveConfiguration(config: {
    name: string;
    description?: string;
    channels: Channel[];
    tunnels: Tunnel[];
    loggingLevel: LogLevel;
  }): SavedConfiguration {
    const id = generateId();
    const data = JSON.stringify({
      channels: config.channels,
      tunnels: config.tunnels,
      loggingLevel: config.loggingLevel,
    });

    insertConfig.run({
      $id: id,
      $name: config.name,
      $description: config.description || "",
      $data: data,
    });

    return this.getConfiguration(id)!;
  },

  updateConfiguration(
    id: string,
    config: {
      name?: string;
      description?: string;
      channels?: Channel[];
      tunnels?: Tunnel[];
      loggingLevel?: LogLevel;
    }
  ): SavedConfiguration | null {
    const existing = this.getConfiguration(id);
    if (!existing) return null;

    const data = JSON.stringify({
      channels: config.channels ?? existing.channels,
      tunnels: config.tunnels ?? existing.tunnels,
      loggingLevel: config.loggingLevel ?? existing.loggingLevel,
    });

    updateConfig.run({
      $id: id,
      $name: config.name ?? existing.name,
      $description: config.description ?? existing.description,
      $data: data,
    });

    return this.getConfiguration(id);
  },

  getConfiguration(id: string): SavedConfiguration | null {
    const row = selectConfig.get(id) as ConfigRow | null;
    if (!row) return null;
    return rowToConfig(row);
  },

  listConfigurations(): SavedConfiguration[] {
    const rows = selectAllConfigs.all() as ConfigRow[];
    return rows.map(rowToConfig);
  },

  deleteConfiguration(id: string): boolean {
    const result = deleteConfig.run(id);
    return result.changes > 0;
  },

  // ============================================
  // Settings Management
  // ============================================

  getSetting(key: string): string | null {
    const row = selectSetting.get(key) as { value: string } | null;
    return row?.value ?? null;
  },

  setSetting(key: string, value: string): void {
    upsertSetting.run({ $key: key, $value: value });
  },

  getLastLoadedConfigId(): string | null {
    return this.getSetting("lastLoadedConfigId");
  },

  setLastLoadedConfigId(id: string | null): void {
    if (id) {
      this.setSetting("lastLoadedConfigId", id);
    }
  },

  getDefaultZtvPath(): string {
    return this.getSetting("ztvPath") || "./ztv";
  },

  setDefaultZtvPath(path: string): void {
    this.setSetting("ztvPath", path);
  },
};
