import { randomUUID, createHash } from "crypto";
import {
  type Budget,
  type BudgetCreate,
  type BudgetUpdate,
  type InsertUser,
  type MoneyFlow,
  type MoneyFlowCreate,
  type MoneyFlowUpdate,
  type Transaction,
  type TransactionCreate,
  type TransactionUpdate,
  type User,
} from "@shared/schema";
import { db } from "./db/database";

// Try to import bcrypt, fall back to simple hash if unavailable
let bcrypt: any;
let useSimpleHash = false;

try {
  bcrypt = await import("bcrypt");
  bcrypt = bcrypt.default || bcrypt;
} catch (error) {
  console.warn("⚠️ bcrypt not available, using simple hashing (not recommended for production)");
  useSimpleHash = true;
}

// Simple hash functions as fallback (WARNING: Not secure for production!)
const simpleHash = (password: string): string => {
  return createHash('sha256').update(password).digest('hex');
};

const simpleCompare = async (password: string, hash: string): Promise<boolean> => {
  return simpleHash(password) === hash;
};

// Storage contract
export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyPassword(password: string, hash: string): Promise<boolean>;
  hashPassword(password: string): Promise<string>;

  // User settings
  getUserSettings(userId: string): Promise<{ preferred_currency: string; monthly_spending_limit: number } | null>;
  saveUserSettings(userId: string, settings: { preferred_currency?: string; monthly_spending_limit?: number }): Promise<{ preferred_currency: string; monthly_spending_limit: number }>;

  // Transactions with search
  listTransactions(userId: string, searchQuery?: string, limit?: number): Promise<Transaction[]>;
  createTransaction(userId: string, input: TransactionCreate): Promise<Transaction>;
  updateTransaction(userId: string, id: string, input: TransactionUpdate): Promise<Transaction | undefined>;
  deleteTransaction(userId: string, id: string): Promise<boolean>;

  listMoneyFlows(userId: string): Promise<MoneyFlow[]>;
  createMoneyFlow(userId: string, input: MoneyFlowCreate): Promise<MoneyFlow>;
  updateMoneyFlow(userId: string, id: string, input: MoneyFlowUpdate): Promise<MoneyFlow | undefined>;
  deleteMoneyFlow(userId: string, id: string): Promise<boolean>;

  listBudgets(userId: string): Promise<Budget[]>;
  createBudget(userId: string, input: BudgetCreate): Promise<Budget>;
  updateBudget(userId: string, id: string, input: BudgetUpdate): Promise<Budget | undefined>;
  deleteBudget(userId: string, id: string): Promise<boolean>;

  getDashboardSummary(userId: string): Promise<{
    totals: { income: number; expense: number; balance: number };
    currentMonth: { income: number; expense: number };
    lastMonth: { income: number; expense: number };
    expenseByCategory: { category: string; total: number }[];
    incomeByCategory: { category: string; total: number }[];
  }>;
}

// SQLite-backed storage; database is the single source of truth
export class SQLiteStorage implements IStorage {
  private insertUserStmt = db.prepare(`
    INSERT INTO users (id, name, email, password_hash)
    VALUES (@id, @name, @email, @password_hash)
  `);

  private getUserByIdStmt = db.prepare(
    `SELECT id, name, email, password_hash FROM users WHERE id = @id LIMIT 1`
  );

  private getUserByEmailStmt = db.prepare(
    `SELECT id, name, email, password_hash FROM users WHERE email = @email LIMIT 1`
  );

  private listTransactionsStmt = db.prepare(
    `SELECT id, user_id, type, amount, category, description, created_at FROM transactions WHERE user_id = @user_id ORDER BY datetime(created_at) DESC`
  );

  private searchTransactionsStmt = db.prepare(
    `SELECT id, user_id, type, amount, category, description, created_at FROM transactions 
     WHERE user_id = @user_id 
       AND (description LIKE @search OR category LIKE @search)
     ORDER BY datetime(created_at) DESC 
     LIMIT @limit`
  );

  private getUserSettingsStmt = db.prepare(
    `SELECT preferred_currency, monthly_spending_limit FROM user_settings WHERE user_id = @user_id LIMIT 1`
  );

  private insertUserSettingsStmt = db.prepare(`
    INSERT INTO user_settings (id, user_id, preferred_currency, monthly_spending_limit)
    VALUES (@id, @user_id, @preferred_currency, @monthly_spending_limit)
  `);

  private updateUserSettingsStmt = db.prepare(`
    UPDATE user_settings 
    SET preferred_currency = COALESCE(@preferred_currency, preferred_currency),
        monthly_spending_limit = COALESCE(@monthly_spending_limit, monthly_spending_limit),
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = @user_id
  `);

  private insertTransactionStmt = db.prepare(`
    INSERT INTO transactions (id, user_id, type, amount, category, description, created_at)
    VALUES (@id, @user_id, @type, @amount, @category, @description, @created_at)
  `);

  private getTransactionByIdStmt = db.prepare(
    `SELECT id, user_id, type, amount, category, description, created_at FROM transactions WHERE id = @id AND user_id = @user_id LIMIT 1`
  );

  private deleteTransactionStmt = db.prepare(
    `DELETE FROM transactions WHERE id = @id AND user_id = @user_id`
  );

  private updateTransactionStmt = db.prepare(
    `UPDATE transactions SET amount = COALESCE(@amount, amount), category = COALESCE(@category, category), description = COALESCE(@description, description) WHERE id = @id AND user_id = @user_id`
  );

  private listMoneyFlowStmt = db.prepare(
    `SELECT id, user_id, direction, amount, counterparty, note, created_at FROM money_flow WHERE user_id = @user_id ORDER BY datetime(created_at) DESC`
  );

  private insertMoneyFlowStmt = db.prepare(`
    INSERT INTO money_flow (id, user_id, direction, amount, counterparty, note, created_at)
    VALUES (@id, @user_id, @direction, @amount, @counterparty, @note, @created_at)
  `);

  private getMoneyFlowByIdStmt = db.prepare(
    `SELECT id, user_id, direction, amount, counterparty, note, created_at FROM money_flow WHERE id = @id AND user_id = @user_id LIMIT 1`
  );

  private updateMoneyFlowStmt = db.prepare(
    `UPDATE money_flow SET amount = COALESCE(@amount, amount), counterparty = COALESCE(@counterparty, counterparty), note = COALESCE(@note, note) WHERE id = @id AND user_id = @user_id`
  );

  private deleteMoneyFlowStmt = db.prepare(
    `DELETE FROM money_flow WHERE id = @id AND user_id = @user_id`
  );

  private listBudgetsStmt = db.prepare(
    `SELECT id, user_id, name, amount, period, category, created_at FROM budgets WHERE user_id = @user_id ORDER BY datetime(created_at) DESC`
  );

  private insertBudgetStmt = db.prepare(`
    INSERT INTO budgets (id, user_id, name, amount, period, category, created_at)
    VALUES (@id, @user_id, @name, @amount, @period, @category, @created_at)
  `);

  private getBudgetByIdStmt = db.prepare(
    `SELECT id, user_id, name, amount, period, category, created_at FROM budgets WHERE id = @id AND user_id = @user_id LIMIT 1`
  );

  private updateBudgetStmt = db.prepare(
    `UPDATE budgets SET name = COALESCE(@name, name), amount = COALESCE(@amount, amount), period = COALESCE(@period, period), category = COALESCE(@category, category) WHERE id = @id AND user_id = @user_id`
  );

  private deleteBudgetStmt = db.prepare(
    `DELETE FROM budgets WHERE id = @id AND user_id = @user_id`
  );

  private totalsStmt = db.prepare(
    `SELECT type, SUM(amount) as total FROM transactions WHERE user_id = @user_id GROUP BY type`
  );

  private monthlyTotalsStmt = db.prepare(
    `SELECT type, SUM(amount) as total
     FROM transactions
     WHERE user_id = @user_id
       AND date(created_at) >= date('now', 'start of month')
     GROUP BY type`
  );

  private lastMonthTotalsStmt = db.prepare(
    `SELECT type, SUM(amount) as total
     FROM transactions
     WHERE user_id = @user_id
       AND date(created_at) >= date('now', 'start of month', '-1 month')
       AND date(created_at) < date('now', 'start of month')
     GROUP BY type`
  );

  private expenseByCategoryStmt = db.prepare(
    `SELECT category, SUM(amount) as total
     FROM transactions
     WHERE user_id = @user_id AND type = 'expense' AND date(created_at) >= date('now', 'start of month')
     GROUP BY category
     ORDER BY total DESC`
  );

  private incomeByCategoryStmt = db.prepare(
    `SELECT category, SUM(amount) as total
     FROM transactions
     WHERE user_id = @user_id AND type = 'income' AND date(created_at) >= date('now', 'start of month')
     GROUP BY category
     ORDER BY total DESC`
  );

  async getDashboardSummary(userId: string) {
    const totalsRows = this.totalsStmt.all({ user_id: userId }) as { type: string; total: number }[];
    const monthlyRows = this.monthlyTotalsStmt.all({ user_id: userId }) as { type: string; total: number }[];
    const lastMonthRows = this.lastMonthTotalsStmt.all({ user_id: userId }) as { type: string; total: number }[];

    const reduceTotals = (rows: { type: string; total: number }[]) => rows.reduce(
      (acc, row) => {
        if (row.type === "income") acc.income += row.total || 0;
        if (row.type === "expense") acc.expense += row.total || 0;
        return acc;
      },
      { income: 0, expense: 0 }
    );

    const totals = reduceTotals(totalsRows);
    const currentMonth = reduceTotals(monthlyRows);
    const lastMonth = reduceTotals(lastMonthRows);

    const expenseByCategory = this.expenseByCategoryStmt.all({ user_id: userId }) as { category: string; total: number }[];
    const incomeByCategory = this.incomeByCategoryStmt.all({ user_id: userId }) as { category: string; total: number }[];

    return {
      totals: { ...totals, balance: totals.income - totals.expense },
      currentMonth,
      lastMonth,
      expenseByCategory,
      incomeByCategory,
    };
  }

  async getUser(id: string): Promise<User | undefined> {
    const row = this.getUserByIdStmt.get({ id });
    return row ? this.mapRowToUser(row) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const normalized = email.trim().toLowerCase();
    const row = this.getUserByEmailStmt.get({ email: normalized });
    return row ? this.mapRowToUser(row) : undefined;
  }

  async hashPassword(password: string): Promise<string> {
    if (useSimpleHash) {
      return simpleHash(password);
    }
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    if (useSimpleHash) {
      return simpleCompare(password, hash);
    }
    return bcrypt.compare(password, hash);
  }

  private deriveName(email: string) {
    const prefix = email.split("@")[0];
    return prefix ? prefix.replace(/[^a-zA-Z0-9 ]/g, " ").trim() || "Money Manager" : "Money Manager";
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const email = insertUser.email.trim().toLowerCase();
    const name = insertUser.name?.trim() || this.deriveName(insertUser.email);
    const password_hash = await this.hashPassword(insertUser.password);

    this.insertUserStmt.run({ id, name, email, password_hash });

    return {
      id,
      email,
      name,
      password: password_hash,
    };
  }

  private mapRowToUser(row: { id: string; name: string; email: string; password_hash: string }): User {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      password: row.password_hash,
    };
  }

  // User Settings
  async getUserSettings(userId: string): Promise<{ preferred_currency: string; monthly_spending_limit: number } | null> {
    const row = this.getUserSettingsStmt.get({ user_id: userId }) as { preferred_currency: string; monthly_spending_limit: number } | undefined;
    return row || null;
  }

  async saveUserSettings(userId: string, settings: { preferred_currency?: string; monthly_spending_limit?: number }): Promise<{ preferred_currency: string; monthly_spending_limit: number }> {
    const existing = await this.getUserSettings(userId);
    
    if (existing) {
      this.updateUserSettingsStmt.run({
        user_id: userId,
        preferred_currency: settings.preferred_currency ?? null,
        monthly_spending_limit: settings.monthly_spending_limit ?? null,
      });
    } else {
      const id = randomUUID();
      this.insertUserSettingsStmt.run({
        id,
        user_id: userId,
        preferred_currency: settings.preferred_currency || 'USD',
        monthly_spending_limit: settings.monthly_spending_limit || 3000,
      });
    }
    
    return (await this.getUserSettings(userId))!;
  }

  // Transactions
  async listTransactions(userId: string, searchQuery?: string, limit?: number): Promise<Transaction[]> {
    if (searchQuery && searchQuery.trim()) {
      const rows = this.searchTransactionsStmt.all({ 
        user_id: userId, 
        search: `%${searchQuery.trim()}%`,
        limit: limit || 100
      });
      return rows.map(this.mapRowToTransaction);
    }
    const rows = this.listTransactionsStmt.all({ user_id: userId });
    return rows.map(this.mapRowToTransaction);
  }

  async createTransaction(userId: string, input: TransactionCreate): Promise<Transaction> {
    const id = randomUUID();
    const created_at = input.date || new Date().toISOString();
    this.insertTransactionStmt.run({
      id,
      user_id: userId,
      type: input.type,
      amount: input.amount,
      category: input.category,
      description: input.description ?? null,
      created_at,
    });

    return {
      id,
      user_id: userId,
      type: input.type,
      amount: input.amount,
      category: input.category,
      description: input.description ?? null,
      created_at,
    };
  }

  async updateTransaction(userId: string, id: string, input: TransactionUpdate): Promise<Transaction | undefined> {
    const existing = this.getTransactionByIdStmt.get({ id, user_id: userId });
    if (!existing) return undefined;

    this.updateTransactionStmt.run({
      id,
      user_id: userId,
      amount: input.amount ?? null,
      category: input.category ?? null,
      description: input.description ?? null,
    });

    const updated = this.getTransactionByIdStmt.get({ id, user_id: userId });
    return updated ? this.mapRowToTransaction(updated) : undefined;
  }

  async deleteTransaction(userId: string, id: string): Promise<boolean> {
    const result = this.deleteTransactionStmt.run({ id, user_id: userId });
    return result.changes > 0;
  }

  private mapRowToTransaction = (row: any): Transaction => ({
    id: row.id,
    user_id: row.user_id,
    type: row.type,
    amount: row.amount,
    category: row.category,
    description: row.description ?? null,
    created_at: row.created_at,
  });

  // Money flow
  async listMoneyFlows(userId: string): Promise<MoneyFlow[]> {
    const rows = this.listMoneyFlowStmt.all({ user_id: userId });
    return rows.map(this.mapRowToMoneyFlow);
  }

  async createMoneyFlow(userId: string, input: MoneyFlowCreate): Promise<MoneyFlow> {
    const id = randomUUID();
    const created_at = new Date().toISOString();
    this.insertMoneyFlowStmt.run({
      id,
      user_id: userId,
      direction: input.direction,
      amount: input.amount,
      counterparty: input.counterparty ?? null,
      note: input.note ?? null,
      created_at,
    });

    return {
      id,
      user_id: userId,
      direction: input.direction,
      amount: input.amount,
      counterparty: input.counterparty ?? null,
      note: input.note ?? null,
      created_at,
    };
  }

  async updateMoneyFlow(userId: string, id: string, input: MoneyFlowUpdate): Promise<MoneyFlow | undefined> {
    const existing = this.getMoneyFlowByIdStmt.get({ id, user_id: userId });
    if (!existing) return undefined;

    this.updateMoneyFlowStmt.run({
      id,
      user_id: userId,
      amount: input.amount ?? null,
      counterparty: input.counterparty ?? null,
      note: input.note ?? null,
    });

    const updated = this.getMoneyFlowByIdStmt.get({ id, user_id: userId });
    return updated ? this.mapRowToMoneyFlow(updated) : undefined;
  }

  async deleteMoneyFlow(userId: string, id: string): Promise<boolean> {
    const result = this.deleteMoneyFlowStmt.run({ id, user_id: userId });
    return result.changes > 0;
  }

  private mapRowToMoneyFlow = (row: any): MoneyFlow => ({
    id: row.id,
    user_id: row.user_id,
    direction: row.direction,
    amount: row.amount,
    counterparty: row.counterparty ?? null,
    note: row.note ?? null,
    created_at: row.created_at,
  });

  // Budgets
  async listBudgets(userId: string): Promise<Budget[]> {
    const rows = this.listBudgetsStmt.all({ user_id: userId });
    return rows.map(this.mapRowToBudget);
  }

  async createBudget(userId: string, input: BudgetCreate): Promise<Budget> {
    const id = randomUUID();
    const created_at = new Date().toISOString();
    this.insertBudgetStmt.run({
      id,
      user_id: userId,
      name: input.name,
      amount: input.amount,
      period: input.period,
      category: input.category ?? null,
      created_at,
    });

    return {
      id,
      user_id: userId,
      name: input.name,
      amount: input.amount,
      period: input.period,
      category: input.category ?? null,
      created_at,
    };
  }

  async updateBudget(userId: string, id: string, input: BudgetUpdate): Promise<Budget | undefined> {
    const existing = this.getBudgetByIdStmt.get({ id, user_id: userId });
    if (!existing) return undefined;

    this.updateBudgetStmt.run({
      id,
      user_id: userId,
      name: input.name ?? null,
      amount: input.amount ?? null,
      period: input.period ?? null,
      category: input.category ?? null,
    });

    const updated = this.getBudgetByIdStmt.get({ id, user_id: userId });
    return updated ? this.mapRowToBudget(updated) : undefined;
  }

  async deleteBudget(userId: string, id: string): Promise<boolean> {
    const result = this.deleteBudgetStmt.run({ id, user_id: userId });
    return result.changes > 0;
  }

  private mapRowToBudget = (row: any): Budget => ({
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    amount: row.amount,
    period: row.period,
    category: row.category ?? null,
    created_at: row.created_at,
  });
}

export const storage = new SQLiteStorage();
