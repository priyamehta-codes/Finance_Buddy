import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  budgetCreateSchema,
  budgetUpdateSchema,
  loginSchema,
  moneyFlowCreateSchema,
  moneyFlowUpdateSchema,
  signUpSchema,
  transactionCreateSchema,
  transactionUpdateSchema,
  type User,
} from "@shared/schema";
import { ZodError } from "zod";
import { getExchangeRates, convertCurrency } from "./exchange-rates";
import type { SessionData } from "express-session";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Augment express-session types
declare module "express-session" {
  interface SessionData {
    userId?: string;
    email?: string;
    name?: string;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const requireAuth = (req: any, res: any): string | undefined => {
    const userId = req.session.userId;
    if (!userId) {
      res.status(401).json({ message: "Not authenticated" });
      return undefined;
    }
    return userId;
  };

  // Sign up endpoint
  app.post("/api/auth/signup", async (req, res) => {
    console.log("📝 POST /api/auth/signup received");
    try {
      const { email, password, name } = signUpSchema.parse(req.body);
      console.log(`✓ Validation passed for email: ${email}`);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        console.log(`✗ User already exists: ${email}`);
        return res.status(400).json({ message: "Email already registered" });
      }

      // Create new user with hashed password
      const user = await storage.createUser({ email, password, name });
      console.log(`✓ User created: ${user.id}`);

      // Store in session
      req.session.userId = user.id;
      req.session.email = user.email;
      req.session.name = user.name;

      // Save session explicitly
      if (req.session.save) {
        req.session.save((err?: any) => {
          if (err) {
            console.error("❌ Session save error:", err);
            return res.status(500).json({ message: "Failed to create session" });
          }
          console.log(`✓ Session saved for user: ${email}`);
          
          // Return user without password
          const { password: _, ...userWithoutPassword } = user;
          res.json({ 
            user: userWithoutPassword,
            message: "Sign up successful"
          });
        });
      } else {
        console.log("⚠️ No session.save method, responding directly");
        const { password: _, ...userWithoutPassword } = user;
        res.json({ 
          user: userWithoutPassword,
          message: "Sign up successful"
        });
      }
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldError = error.errors[0];
        console.error(`✗ Validation error: ${fieldError.message}`);
        return res.status(400).json({ 
          message: fieldError.message,
          field: fieldError.path[0]
        });
      }
      
      console.error("❌ Signup error:", error);
      res.status(500).json({ message: "Sign up failed" });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    console.log("🔓 POST /api/auth/login received");
    try {
      const { email, password } = loginSchema.parse(req.body);
      console.log(`✓ Validation passed for email: ${email}`);

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.log(`✗ User not found: ${email}`);
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password
      const passwordMatch = await storage.verifyPassword(password, user.password);
      if (!passwordMatch) {
        console.log(`✗ Password mismatch for: ${email}`);
        return res.status(401).json({ message: "Invalid email or password" });
      }

      console.log(`✓ Password verified for: ${email}`);

      // Store in session
      req.session.userId = user.id;
      req.session.email = user.email;
      req.session.name = user.name;

      // Save session explicitly
      if (req.session.save) {
        req.session.save((err?: any) => {
          if (err) {
            console.error("❌ Session save error:", err);
            return res.status(500).json({ message: "Failed to create session" });
          }
          console.log(`✓ Session saved for user: ${email}`);
          
          // Return user without password
          const { password: _, ...userWithoutPassword } = user;
          res.json({ 
            user: userWithoutPassword,
            message: "Login successful"
          });
        });
      } else {
        console.log("⚠️ No session.save method, responding directly");
        const { password: _, ...userWithoutPassword } = user;
        res.json({ 
          user: userWithoutPassword,
          message: "Login successful"
        });
      }
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldError = error.errors[0];
        console.error(`✗ Validation error: ${fieldError.message}`);
        return res.status(400).json({ 
          message: fieldError.message,
          field: fieldError.path[0]
        });
      }

      console.error("❌ Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Get current user endpoint
  app.get("/api/auth/me", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get user settings (currency preference)
      const settings = await storage.getUserSettings(req.session.userId);

      // Return user without password, with settings
      const { password: _, ...userWithoutPassword } = user;
      res.json({ 
        user: {
          ...userWithoutPassword,
          preferred_currency: settings?.preferred_currency || 'USD',
          monthly_spending_limit: settings?.monthly_spending_limit || 3000,
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User settings endpoints
  app.get("/api/user/settings", async (req, res) => {
    const userId = requireAuth(req, res);
    if (!userId) return;
    
    try {
      const settings = await storage.getUserSettings(userId);
      res.json(settings || { preferred_currency: 'USD', monthly_spending_limit: 3000 });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.post("/api/user/settings", async (req, res) => {
    const userId = requireAuth(req, res);
    if (!userId) return;
    
    try {
      const { preferred_currency, monthly_spending_limit } = req.body;
      
      // Validate currency
      const validCurrencies = ['USD', 'INR', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF'];
      if (preferred_currency && !validCurrencies.includes(preferred_currency)) {
        return res.status(400).json({ message: "Invalid currency" });
      }
      
      const settings = await storage.saveUserSettings(userId, {
        preferred_currency,
        monthly_spending_limit: typeof monthly_spending_limit === 'number' ? monthly_spending_limit : undefined,
      });
      
      res.json(settings);
    } catch (error) {
      console.error("Save settings error:", error);
      res.status(500).json({ message: "Failed to save settings" });
    }
  });

  // Transactions CRUD
  app.get("/api/transactions", async (req, res) => {
    const userId = requireAuth(req, res);
    if (!userId) return;
    
    const searchQuery = req.query.q as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    
    const rows = await storage.listTransactions(userId, searchQuery, limit);
    res.json(rows);
  });

  app.post("/api/transactions", async (req, res) => {
    const userId = requireAuth(req, res);
    if (!userId) return;
    try {
      const input = transactionCreateSchema.parse(req.body);
      const created = await storage.createTransaction(userId, input);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message });
      }
      console.error("Create transaction error", error);
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  app.put("/api/transactions/:id", async (req, res) => {
    const userId = requireAuth(req, res);
    if (!userId) return;
    try {
      const input = transactionUpdateSchema.parse(req.body);
      const updated = await storage.updateTransaction(userId, req.params.id, input);
      if (!updated) return res.status(404).json({ message: "Transaction not found" });
      res.json(updated);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message });
      }
      res.status(500).json({ message: "Failed to update transaction" });
    }
  });

  app.delete("/api/transactions/:id", async (req, res) => {
    const userId = requireAuth(req, res);
    if (!userId) return;
    const deleted = await storage.deleteTransaction(userId, req.params.id);
    if (!deleted) return res.status(404).json({ message: "Transaction not found" });
    res.status(204).send();
  });

  // Money flow CRUD
  app.get("/api/money-flow", async (req, res) => {
    const userId = requireAuth(req, res);
    if (!userId) return;
    const rows = await storage.listMoneyFlows(userId);
    res.json(rows);
  });

  app.post("/api/money-flow", async (req, res) => {
    const userId = requireAuth(req, res);
    if (!userId) return;
    try {
      const input = moneyFlowCreateSchema.parse(req.body);
      const created = await storage.createMoneyFlow(userId, input);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message });
      }
      res.status(500).json({ message: "Failed to create money flow" });
    }
  });

  app.put("/api/money-flow/:id", async (req, res) => {
    const userId = requireAuth(req, res);
    if (!userId) return;
    try {
      const input = moneyFlowUpdateSchema.parse(req.body);
      const updated = await storage.updateMoneyFlow(userId, req.params.id, input);
      if (!updated) return res.status(404).json({ message: "Money flow not found" });
      res.json(updated);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message });
      }
      res.status(500).json({ message: "Failed to update money flow" });
    }
  });

  app.delete("/api/money-flow/:id", async (req, res) => {
    const userId = requireAuth(req, res);
    if (!userId) return;
    const deleted = await storage.deleteMoneyFlow(userId, req.params.id);
    if (!deleted) return res.status(404).json({ message: "Money flow not found" });
    res.status(204).send();
  });

  // Budgets CRUD
  app.get("/api/budgets", async (req, res) => {
    const userId = requireAuth(req, res);
    if (!userId) return;
    const rows = await storage.listBudgets(userId);
    res.json(rows);
  });

  app.post("/api/budgets", async (req, res) => {
    const userId = requireAuth(req, res);
    if (!userId) return;
    try {
      const input = budgetCreateSchema.parse(req.body);
      const created = await storage.createBudget(userId, input);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message });
      }
      res.status(500).json({ message: "Failed to create budget" });
    }
  });

  app.put("/api/budgets/:id", async (req, res) => {
    const userId = requireAuth(req, res);
    if (!userId) return;
    try {
      const input = budgetUpdateSchema.parse(req.body);
      const updated = await storage.updateBudget(userId, req.params.id, input);
      if (!updated) return res.status(404).json({ message: "Budget not found" });
      res.json(updated);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message });
      }
      res.status(500).json({ message: "Failed to update budget" });
    }
  });

  app.delete("/api/budgets/:id", async (req, res) => {
    const userId = requireAuth(req, res);
    if (!userId) return;
    const deleted = await storage.deleteBudget(userId, req.params.id);
    if (!deleted) return res.status(404).json({ message: "Budget not found" });
    res.status(204).send();
  });

  // Dashboard summary (aggregates are computed server-side per user)
  app.get("/api/dashboard/summary", async (req, res) => {
    const userId = requireAuth(req, res);
    if (!userId) return;
    try {
      const summary = await storage.getDashboardSummary(userId);
      res.json(summary);
    } catch (error) {
      console.error("Failed to load dashboard summary", error);
      res.status(500).json({ message: "Failed to load summary" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy?.((err?: any) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  // Financial Insight (Gemini with rule-based fallback)
  app.post("/api/financial-insight", async (req, res) => {
    const userId = requireAuth(req, res);
    if (!userId) return;

    const {
      principal,
      rate,
      years,
      monthlyIncome,
      monthlyExpenses,
      existingEMIs,
      calculatedEMI,
      currency,
    } = req.body || {};

    const cleanNumber = (n: any) => (typeof n === "number" && Number.isFinite(n) ? n : 0);

    const payload = {
      principal: cleanNumber(principal),
      rate: cleanNumber(rate),
      years: cleanNumber(years),
      income: cleanNumber(monthlyIncome),
      expenses: cleanNumber(monthlyExpenses),
      emis: cleanNumber(existingEMIs),
      emi: cleanNumber(calculatedEMI),
      currency: typeof currency === "string" ? currency : "USD",
    };

    if (!payload.principal || !payload.rate || !payload.years || !payload.income) {
      return res.status(400).json({ message: "Missing required financial data" });
    }

    const deriveVerdict = (dti: number, buffer: number, income: number) => {
      if (dti <= 25 && buffer >= income * 0.3) return "COMFORTABLE";
      if (dti <= 35 && buffer >= income * 0.2) return "AFFORDABLE";
      if (dti <= 45 && buffer >= income * 0.1) return "BORDERLINE";
      return "RISKY";
    };

    const buildRuleInsight = () => {
      const debtToIncome = payload.income > 0 ? ((payload.emis + payload.emi) / payload.income) * 100 : 0;
      const buffer = payload.income - payload.expenses - payload.emis - payload.emi;
      const bufferPct = payload.income > 0 ? (buffer / payload.income) * 100 : 0;
      const verdict = deriveVerdict(debtToIncome, buffer, payload.income);

      const bullets = [
        `EMI is ${debtToIncome.toFixed(1)}% of monthly income`,
        `Buffer after EMI is ${payload.currency} ${buffer.toFixed(0)}`,
        `Debt-to-income ratio ${debtToIncome.toFixed(1)}% with buffer ${bufferPct.toFixed(1)}%`,
        `Total monthly obligations ${payload.currency} ${(payload.expenses + payload.emis + payload.emi).toFixed(0)}`,
      ];

      const condition = buffer < payload.income * 0.1 ? "Condition: Cushion is thin; keep buffer healthy." : undefined;

      return { verdict, bullets: bullets.slice(0, 4), condition, source: "rule" as const };
    };

    const ruleInsight = buildRuleInsight();

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return res.json(ruleInsight);
    }

    const prompt = `You are an analytical finance model. Use ONLY the numbers provided. Return EXACTLY this format:
1) A single-word UPPERCASE verdict (AFFORDABLE, BORDERLINE, RISKY, COMFORTABLE)
2) 3-4 bullet points, each numeric and concise
3) Optional condition line starting with "Condition:" if relevant.
Do NOT give advice. Keep it neutral and short.

Data:
- Principal: ${payload.currency} ${payload.principal}
- Rate: ${payload.rate}% annual
- Duration: ${payload.years} years
- Calculated EMI: ${payload.currency} ${payload.emi}
- Monthly income: ${payload.currency} ${payload.income}
- Monthly expenses: ${payload.currency} ${payload.expenses}
- Existing EMIs: ${payload.currency} ${payload.emis}
- Debt-to-income: ${payload.income > 0 ? (((payload.emis + payload.emi) / payload.income) * 100).toFixed(1) : "0.0"}%
- Buffer after EMI: ${payload.currency} ${(payload.income - payload.expenses - payload.emis - payload.emi).toFixed(0)}`;

    const normalize = (text: string) => text.replace(/\r?\n+/g, "\n").trim();

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const response = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 220 },
      });

      const text = normalize(response.response.text() || "");
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      const verdictLine = lines.shift() || "";
      const verdict = verdictLine.split(/[ .]/)[0]?.toUpperCase() || ruleInsight.verdict;
      const bullets: string[] = [];
      let condition: string | undefined;

      for (const line of lines) {
        if (line.toLowerCase().startsWith("condition:")) {
          condition = line.replace(/^condition:/i, "Condition:").trim();
        } else if (line.startsWith("-") || line.startsWith("•")) {
          bullets.push(line.replace(/^[-•]\s*/, "").trim());
        } else if (/^[0-9]/.test(line) || line.includes("%")) {
          bullets.push(line.trim());
        }
      }

      const cleaned = bullets.filter(Boolean).slice(0, 4);
      if (!cleaned.length || !verdict) {
        return res.json(ruleInsight);
      }

      return res.json({ verdict, bullets: cleaned, condition, source: "ai" as const });
    } catch (error) {
      console.error("Gemini insight error", error);
      return res.json(ruleInsight);
    }
  });

  // Exchange rates endpoint
  app.get("/api/exchange-rates", async (req, res) => {
    try {
      const base = (req.query.base as string)?.toUpperCase() || 'USD';
      const symbols = (req.query.symbols as string)?.split(',').map((s) => s.trim().toUpperCase()) || ['INR', 'EUR', 'GBP'];

      // Validate base currency
      if (!/^[A-Z]{3}$/.test(base)) {
        return res.status(400).json({ message: "Invalid base currency code" });
      }

      // Validate symbols
      if (!Array.isArray(symbols) || symbols.some((s) => !/^[A-Z]{3}$/.test(s))) {
        return res.status(400).json({ message: "Invalid currency symbols" });
      }

      const result = await getExchangeRates(base, symbols);
      res.json(result);
    } catch (error) {
      console.error("Exchange rate error:", error);
      res.status(500).json({ 
        message: "Failed to fetch exchange rates",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Currency conversion endpoint
  app.post("/api/convert", async (req, res) => {
    try {
      const { amount, from, to } = req.body;

      // Validate inputs
      if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      if (!from || !to || !/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to)) {
        return res.status(400).json({ message: "Invalid currencies" });
      }

      const result = await convertCurrency(amount, from, to);
      res.json(result);
    } catch (error) {
      console.error("Conversion error:", error);
      res.status(500).json({ 
        message: "Conversion failed",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  return httpServer;
}
