import { join } from 'node:path';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js';
import { drizzle } from 'drizzle-orm/sql-js';
import type { SqlJsDatabase as DrizzleSqlJsDatabase } from 'drizzle-orm/sql-js';
import { DB_FILENAME } from '@vas/shared';
import * as schema from './schema/index.js';
import * as relations from './relations.js';

export type VasDatabase = DrizzleSqlJsDatabase<typeof schema & typeof relations>;

let dbInstance: VasDatabase | null = null;
let sqliteInstance: SqlJsDatabase | null = null;
let dbPath: string = '';
let saveInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Initialize the VAS database at the given data path.
 *
 * - Creates the directory if it doesn't exist
 * - Opens (or creates) the SQLite database file using sql.js (WASM)
 * - Wraps with Drizzle ORM and returns the typed instance
 * - Sets up periodic auto-save to persist in-memory changes to disk
 *
 * The instance is cached — subsequent calls return the same connection.
 */
export async function initDatabase(dataPath: string): Promise<VasDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  // Ensure the data directory exists
  mkdirSync(dataPath, { recursive: true });

  dbPath = join(dataPath, DB_FILENAME);

  // Initialize sql.js WASM engine
  const SQL = await initSqlJs();

  // Load existing database or create new one
  let sqlite: SqlJsDatabase;
  if (existsSync(dbPath)) {
    const fileBuffer = readFileSync(dbPath);
    sqlite = new SQL.Database(fileBuffer);
  } else {
    sqlite = new SQL.Database();
  }

  // Performance & integrity pragmas
  sqlite.run('PRAGMA journal_mode = WAL;');
  sqlite.run('PRAGMA foreign_keys = ON;');
  sqlite.run('PRAGMA busy_timeout = 5000;');
  sqlite.run('PRAGMA synchronous = NORMAL;');
  sqlite.run('PRAGMA cache_size = -20000;');
  sqlite.run('PRAGMA temp_store = MEMORY;');

  // Wrap with Drizzle ORM
  const db = drizzle(sqlite, {
    schema: { ...schema, ...relations },
  });

  sqliteInstance = sqlite;
  dbInstance = db;

  // Auto-save every 5 seconds to persist changes from in-memory to disk
  saveInterval = setInterval(() => {
    saveDatabase();
  }, 5000);

  return db;
}

/**
 * Save the in-memory database to disk.
 */
export function saveDatabase(): void {
  if (sqliteInstance && dbPath) {
    const data = sqliteInstance.export();
    const buffer = Buffer.from(data);
    writeFileSync(dbPath, buffer);
  }
}

/**
 * Get the current database instance.
 * Throws if the database has not been initialized.
 */
export function getDatabase(): VasDatabase {
  if (!dbInstance) {
    throw new Error(
      'Database not initialized. Call initDatabase(dataPath) first.',
    );
  }
  return dbInstance;
}

/**
 * Get the raw sql.js instance for advanced operations.
 * Throws if the database has not been initialized.
 */
export function getSqlite(): SqlJsDatabase {
  if (!sqliteInstance) {
    throw new Error(
      'Database not initialized. Call initDatabase(dataPath) first.',
    );
  }
  return sqliteInstance;
}

/**
 * Close the database connection and release resources.
 * Saves to disk before closing.
 */
export function closeDatabase(): void {
  if (saveInterval) {
    clearInterval(saveInterval);
    saveInterval = null;
  }
  if (sqliteInstance) {
    // Final save before closing
    saveDatabase();
    sqliteInstance.close();
    sqliteInstance = null;
    dbInstance = null;
  }
}
