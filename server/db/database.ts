import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

// Ensure db folder exists
const dbDir = path.join(process.cwd(), "server", "db");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Database file path
const dbPath = path.join(dbDir, "finance-buddy.db");

// Create / open database
export const db = new Database(dbPath);

// Enable foreign keys so child rows are purged with the parent user
db.pragma("foreign_keys = ON");

// =======================
// USERS TABLE (authoritative)
// =======================
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// =======================
// TRANSACTIONS TABLE (user scoped)
// =======================
db.prepare(`
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`).run();

db.prepare(`CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id)`).run();
db.prepare(`CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at)`).run();

// =======================
// MONEY FLOW TABLE (pay / receive) - user scoped
// =======================
db.prepare(`
  CREATE TABLE IF NOT EXISTS money_flow (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    direction TEXT CHECK(direction IN ('pay', 'receive')) NOT NULL,
    amount REAL NOT NULL,
    counterparty TEXT,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`).run();

db.prepare(`CREATE INDEX IF NOT EXISTS idx_money_flow_user ON money_flow(user_id)`).run();
db.prepare(`CREATE INDEX IF NOT EXISTS idx_money_flow_created ON money_flow(created_at)`).run();

// =======================
// BUDGETS TABLE (user scoped)
// =======================
db.prepare(`
  CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    period TEXT CHECK(period IN ('monthly','yearly')) NOT NULL DEFAULT 'monthly',
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`).run();

db.prepare(`CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets(user_id)`).run();

console.log("✅ Database initialized at:", dbPath);
