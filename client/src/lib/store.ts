import { create } from "zustand";

export type TransactionType = "income" | "expense";
export type Currency = "USD" | "INR" | "EUR" | "GBP";

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  description: string;
}

export interface MoneyFlow {
  id: string;
  direction: "pay" | "receive";
  amount: number;
  counterparty?: string | null;
  note?: string | null;
  created_at: string;
}

export interface Budget {
  id: string;
  name: string;
  amount: number;
  period: "monthly" | "yearly";
  category?: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
}

export interface DashboardSummary {
  totals: { income: number; expense: number; balance: number };
  currentMonth: { income: number; expense: number };
  lastMonth: { income: number; expense: number };
  expenseByCategory: { category: string; total: number }[];
  incomeByCategory: { category: string; total: number }[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  currency: Currency;
  monthlySpendingLimit: number;
}

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  transactions: Transaction[];
  moneyFlow: MoneyFlow[];
  budgets: Budget[];
  categories: Category[];
  lastCategory: string | null;
  dashboardSummary: DashboardSummary | null;

  // Actions
  login: (user: User) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
  hydrateData: () => Promise<void>;
  refreshSummary: () => Promise<void>;

  addTransaction: (input: Omit<Transaction, "id">) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  addMoneyFlow: (input: Omit<MoneyFlow, "id" | "created_at">) => Promise<void>;
  updateMoneyFlow: (id: string, updates: Partial<MoneyFlow>) => Promise<void>;
  deleteMoneyFlow: (id: string) => Promise<void>;

  addBudget: (input: Omit<Budget, "id" | "created_at">) => Promise<void>;
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;

  setLastCategory: (category: string | null) => void;
  updateUser: (updates: Partial<User>) => void;
  setCurrency: (currency: Currency) => Promise<void>;
  setMonthlySpendingLimit: (limit: number) => Promise<void>;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: "1", name: "Salary", type: "income", color: "#10b981" },
  { id: "2", name: "Freelance", type: "income", color: "#3b82f6" },
  { id: "3", name: "Investments", type: "income", color: "#8b5cf6" },
  { id: "4", name: "Side Gig", type: "income", color: "#06b6d4" },
  { id: "5", name: "Passive Income", type: "income", color: "#14b8a6" },
  { id: "6", name: "Rent", type: "expense", color: "#ef4444" },
  { id: "7", name: "Groceries", type: "expense", color: "#f97316" },
  { id: "8", name: "Food / Eating Out", type: "expense", color: "#fb923c" },
  { id: "9", name: "Utilities", type: "expense", color: "#eab308" },
  { id: "10", name: "Transport", type: "expense", color: "#6366f1" },
  { id: "11", name: "Entertainment", type: "expense", color: "#ec4899" },
];

const deriveNameFromEmail = (email: string) => {
  const prefix = email?.split("@")[0] || "";
  return prefix ? prefix.charAt(0).toUpperCase() + prefix.slice(1) : "Money Manager";
};

// Detect default currency from browser locale
const getDefaultCurrency = (): Currency => {
  try {
    const locale = navigator.language || 'en-US';
    const currencyMap: Record<string, Currency> = {
      'en-US': 'USD',
      'en-IN': 'INR',
      'hi-IN': 'INR',
      'en-GB': 'GBP',
      'de-DE': 'EUR',
      'fr-FR': 'EUR',
      'es-ES': 'EUR',
      'it-IT': 'EUR',
    };
    return currencyMap[locale] || 'USD';
  } catch {
    return 'USD';
  }
};

const hydrateUser = (user: any): User | null => {
  if (!user) return null;
  // Use server-provided currency preference, then browser locale, then USD
  const currency = (user.preferred_currency || user.currency || getDefaultCurrency()) as Currency;
  return {
    ...user,
    name: user.name || deriveNameFromEmail(user.email),
    currency,
    monthlySpendingLimit: user.monthly_spending_limit || user.monthlySpendingLimit || 3000,
  };
};

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || res.statusText);
  }
  return (await res.json()) as T;
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  transactions: [],
  moneyFlow: [],
  budgets: [],
  categories: DEFAULT_CATEGORIES,
  lastCategory: null,
  dashboardSummary: null,

  login: (user: User) => set({ isAuthenticated: true, user: hydrateUser(user) }),

  setUser: (user: User | null) => {
    set({ user: hydrateUser(user), isAuthenticated: !!user });
    if (!user) {
      set({ transactions: [], moneyFlow: [], budgets: [] });
    }
  },

  logout: () => {
    set({ isAuthenticated: false, user: null, transactions: [], moneyFlow: [], budgets: [], dashboardSummary: null });
  },

  hydrateData: async () => {
    const [transactions, moneyFlow, budgets, summary] = await Promise.all([
      fetchJson<any[]>("/api/transactions"),
      fetchJson<any[]>("/api/money-flow"),
      fetchJson<any[]>("/api/budgets"),
      fetchJson<DashboardSummary>("/api/dashboard/summary"),
    ]);

    set({
      transactions: transactions.map((t) => ({
        id: t.id,
        amount: t.amount,
        type: t.type,
        category: t.category,
        date: t.created_at,
        description: t.description || "",
      })),
      moneyFlow: moneyFlow.map((m) => ({
        id: m.id,
        direction: m.direction,
        amount: m.amount,
        counterparty: m.counterparty ?? null,
        note: m.note ?? null,
        created_at: m.created_at,
      })),
      budgets: budgets.map((b) => ({
        id: b.id,
        name: b.name,
        amount: b.amount,
        period: b.period,
        category: b.category ?? null,
        created_at: b.created_at,
      })),
      dashboardSummary: summary,
    });
  },

  refreshSummary: async () => {
    const summary = await fetchJson<DashboardSummary>("/api/dashboard/summary");
    set({ dashboardSummary: summary });
  },

  addTransaction: async (transaction) => {
    const payload = {
      type: transaction.type,
      amount: transaction.amount,
      category: transaction.category,
      description: transaction.description,
      date: transaction.date,
    };
    const created = await fetchJson<any>("/api/transactions", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    set((state) => ({
      transactions: [
        {
          id: created.id,
          amount: created.amount,
          type: created.type,
          category: created.category,
          date: created.created_at,
          description: created.description || "",
        },
        ...state.transactions,
      ],
    }));
  },

  updateTransaction: async (id, updates) => {
    const payload: any = {
      amount: updates.amount,
      category: updates.category,
      description: updates.description,
    };
    const updated = await fetchJson<any>(`/api/transactions/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id
          ? {
              ...t,
              amount: updated.amount,
              category: updated.category,
              description: updated.description || "",
              date: updated.created_at,
            }
          : t
      ),
    }));
  },

  deleteTransaction: async (id) => {
    await fetchJson<void>(`/api/transactions/${id}`, { method: "DELETE" });
    set((state) => ({ transactions: state.transactions.filter((t) => t.id !== id) }));
  },

  addMoneyFlow: async (input) => {
    const created = await fetchJson<any>("/api/money-flow", {
      method: "POST",
      body: JSON.stringify({
        direction: input.direction,
        amount: input.amount,
        counterparty: input.counterparty,
        note: input.note,
      }),
    });

    set((state) => ({
      moneyFlow: [
        {
          id: created.id,
          direction: created.direction,
          amount: created.amount,
          counterparty: created.counterparty ?? null,
          note: created.note ?? null,
          created_at: created.created_at,
        },
        ...state.moneyFlow,
      ],
    }));
  },

  updateMoneyFlow: async (id, updates) => {
    const updated = await fetchJson<any>(`/api/money-flow/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        amount: updates.amount,
        counterparty: updates.counterparty,
        note: updates.note,
      }),
    });

    set((state) => ({
      moneyFlow: state.moneyFlow.map((m) =>
        m.id === id
          ? {
              ...m,
              amount: updated.amount,
              counterparty: updated.counterparty ?? null,
              note: updated.note ?? null,
              created_at: updated.created_at,
            }
          : m
      ),
    }));
  },

  deleteMoneyFlow: async (id) => {
    await fetchJson<void>(`/api/money-flow/${id}`, { method: "DELETE" });
    set((state) => ({ moneyFlow: state.moneyFlow.filter((m) => m.id !== id) }));
  },

  addBudget: async (input) => {
    const created = await fetchJson<any>("/api/budgets", {
      method: "POST",
      body: JSON.stringify({
        name: input.name,
        amount: input.amount,
        period: input.period,
        category: input.category,
      }),
    });

    set((state) => ({
      budgets: [
        {
          id: created.id,
          name: created.name,
          amount: created.amount,
          period: created.period,
          category: created.category ?? null,
          created_at: created.created_at,
        },
        ...state.budgets,
      ],
    }));
  },

  updateBudget: async (id, updates) => {
    const updated = await fetchJson<any>(`/api/budgets/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        name: updates.name,
        amount: updates.amount,
        period: updates.period,
        category: updates.category,
      }),
    });

    set((state) => ({
      budgets: state.budgets.map((b) =>
        b.id === id
          ? {
              ...b,
              name: updated.name,
              amount: updated.amount,
              period: updated.period,
              category: updated.category ?? null,
              created_at: updated.created_at,
            }
          : b
      ),
    }));
  },

  deleteBudget: async (id) => {
    await fetchJson<void>(`/api/budgets/${id}`, { method: "DELETE" });
    set((state) => ({ budgets: state.budgets.filter((b) => b.id !== id) }));
  },

  setLastCategory: (category) => set({ lastCategory: category }),

  updateUser: (updates) =>
    set((state) => ({ user: state.user ? { ...state.user, ...updates } : null })),

  setCurrency: async (currency) => {
    set((state) => ({ user: state.user ? { ...state.user, currency } : null }));
    // Persist to server
    try {
      await fetchJson("/api/user/settings", {
        method: "POST",
        body: JSON.stringify({ preferred_currency: currency }),
      });
    } catch (error) {
      console.error("Failed to save currency preference:", error);
    }
  },

  setMonthlySpendingLimit: async (limit) => {
    set((state) => ({ user: state.user ? { ...state.user, monthlySpendingLimit: limit } : null }));
    // Persist to server
    try {
      await fetchJson("/api/user/settings", {
        method: "POST",
        body: JSON.stringify({ monthly_spending_limit: limit }),
      });
    } catch (error) {
      console.error("Failed to save spending limit:", error);
    }
  },
}));
