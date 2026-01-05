import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { TrendingUp, TrendingDown } from "lucide-react";
import { displayAmount } from "@/lib/currency";

export function MonthAtAGlance() {
  const summary = useStore((state) => state.dashboardSummary);
  const currency = useStore((state) => state.user?.currency || "USD");
  const topCategory = summary?.expenseByCategory?.[0];
  const thisMonthTotal = summary?.currentMonth.expense ?? 0;
  const lastMonthTotal = summary?.lastMonth.expense ?? 0;
  const trend = thisMonthTotal > lastMonthTotal ? 'up' : 'down';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">This Month at a Glance</CardTitle>
        <CardDescription>Quick financial snapshot</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Highest Spending */}
          <div className="space-y-2 p-3 rounded-lg transition-colors duration-200 hover:bg-muted/50">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Highest Spending
            </p>
            {topCategory ? (
              <div>
                <p className="text-lg font-semibold text-foreground">{topCategory.category}</p>
                <p className="text-sm font-mono text-destructive">{displayAmount(topCategory.total, currency)}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground animate-pulse">No expenses yet</p>
            )}
          </div>

          {/* Spending Trend */}
          <div className="space-y-2 p-3 rounded-lg transition-colors duration-200 hover:bg-muted/50">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Spending Trend
            </p>
            <div className="flex items-center gap-2">
              {trend === 'up' ? (
                <>
                  <TrendingUp className="h-5 w-5 text-destructive transition-transform duration-300 hover:scale-110" />
                  <span className="text-sm text-destructive font-semibold">Higher than usual</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-5 w-5 text-success transition-transform duration-300 hover:scale-110" />
                  <span className="text-sm text-success font-semibold">Lower than usual</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
