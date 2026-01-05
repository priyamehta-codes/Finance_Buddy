import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, TrendingUp, TrendingDown, CheckCircle } from "lucide-react";
import { useStore } from "@/lib/store";
import { displayAmount } from "@/lib/currency";
import { useMemo } from "react";

interface Alert {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  description: string;
  icon: typeof AlertCircle;
  color: string;
}

export function NeedsAttention() {
  const summary = useStore((state) => state.dashboardSummary);
  const user = useStore((state) => state.user);
  const transactions = useStore((state) => state.transactions);
  const currency = user?.currency || 'USD';
  const monthlyLimit = user?.monthlySpendingLimit || 3000;

  // Derive alerts from real user data (server-computed summaries)
  const alerts = useMemo<Alert[]>(() => {
    const result: Alert[] = [];

    if (!summary) return result;

    const { currentMonth, lastMonth } = summary;

    // Alert: Expenses higher than last month
    if (lastMonth.expense > 0 && currentMonth.expense > lastMonth.expense) {
      const increase = ((currentMonth.expense - lastMonth.expense) / lastMonth.expense) * 100;
      if (increase >= 10) {
        result.push({
          id: 'expense-increase',
          type: 'warning',
          title: 'Expenses higher than last month',
          description: `Spending increased by ${increase.toFixed(0)}% compared to last month`,
          icon: TrendingUp,
          color: 'text-destructive',
        });
      }
    }

    // Alert: Approaching spending limit
    const limitUsed = (currentMonth.expense / monthlyLimit) * 100;
    if (limitUsed >= 80 && limitUsed < 100) {
      result.push({
        id: 'limit-warning',
        type: 'warning',
        title: 'Approaching spending limit',
        description: `${displayAmount(monthlyLimit - currentMonth.expense, currency)} left of your ${displayAmount(monthlyLimit, currency)} limit`,
        icon: AlertCircle,
        color: 'text-yellow-500',
      });
    } else if (limitUsed >= 100) {
      result.push({
        id: 'limit-exceeded',
        type: 'warning',
        title: 'Spending limit exceeded',
        description: `Over by ${displayAmount(currentMonth.expense - monthlyLimit, currency)}`,
        icon: AlertCircle,
        color: 'text-destructive',
      });
    }

    // Alert: Low income compared to expenses
    if (currentMonth.income > 0 && currentMonth.expense > currentMonth.income * 0.9) {
      result.push({
        id: 'high-expense-ratio',
        type: 'warning',
        title: 'High expense ratio',
        description: 'Expenses are over 90% of your income this month',
        icon: TrendingDown,
        color: 'text-yellow-500',
      });
    }

    // Positive: Expenses lower than last month
    if (lastMonth.expense > 0 && currentMonth.expense < lastMonth.expense * 0.85) {
      const decrease = ((lastMonth.expense - currentMonth.expense) / lastMonth.expense) * 100;
      result.push({
        id: 'expense-decrease',
        type: 'success',
        title: 'Great job reducing expenses!',
        description: `Spending decreased by ${decrease.toFixed(0)}% compared to last month`,
        icon: CheckCircle,
        color: 'text-success',
      });
    }

    return result;
  }, [summary, monthlyLimit, currency]);

  if (alerts.length === 0) {
    return (
      <Card className="border-success/20 bg-success/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success animate-pulse" />
            All Good
          </CardTitle>
          <CardDescription>Your finances look healthy</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">
            ✓ No alerts. Keep up the healthy financial habits!
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasWarning = alerts.some(a => a.type === 'warning');
  const borderClass = hasWarning 
    ? "border-yellow-500/20 bg-yellow-50/5 dark:bg-yellow-900/10" 
    : "border-success/20 bg-success/5";

  return (
    <Card className={borderClass}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          {hasWarning ? (
            <AlertCircle className="h-5 w-5 text-yellow-500 animate-pulse" />
          ) : (
            <CheckCircle className="h-5 w-5 text-success" />
          )}
          {hasWarning ? 'Needs Your Attention' : 'Financial Insights'}
        </CardTitle>
        <CardDescription>Based on your transaction history</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => {
          const Icon = alert.icon;
          return (
            <div key={alert.id} className="flex gap-3 p-3 rounded-lg bg-background border border-border/50 hover:border-border hover:shadow-sm transition-all duration-200 cursor-pointer group">
              <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${alert.color} transition-transform duration-200 group-hover:scale-110`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground transition-colors duration-200 group-hover:text-primary">{alert.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
