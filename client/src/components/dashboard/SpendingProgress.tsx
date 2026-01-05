import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { AlertCircle, CheckCircle, Pencil } from "lucide-react";
import { displayAmount } from "@/lib/currency";
import { useState } from "react";

export function SpendingProgress() {
  const summary = useStore((state) => state.dashboardSummary);
  const user = useStore((state) => state.user);
  const setMonthlySpendingLimit = useStore((state) => state.setMonthlySpendingLimit);
  const currency = user?.currency || 'USD';
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [limitInput, setLimitInput] = useState(user?.monthlySpendingLimit?.toString() || '3000');

  // Use server-computed current month expense
  const monthlyExpenses = summary?.currentMonth.expense ?? 0;

  const limit = user?.monthlySpendingLimit || 3000;
  const percentage = Math.min((monthlyExpenses / limit) * 100, 100);
  
  let status = 'good';
  let message = 'You are within your planned limit';
  
  if (percentage >= 100) {
    status = 'danger';
    message = `You are over your plan by ${displayAmount(monthlyExpenses - limit, currency)}`;
  } else if (percentage >= 80) {
    status = 'warning';
    message = `You are approaching your limit. ${displayAmount(limit - monthlyExpenses, currency)} available`;
  } else {
    message = `${displayAmount(limit - monthlyExpenses, currency)} of ${displayAmount(limit, currency)} remaining`;
  }

  const bgColor = status === 'danger' ? 'bg-destructive' : status === 'warning' ? 'bg-yellow-500' : 'bg-success';
  const borderColor = status === 'danger' ? 'border-destructive/20 bg-destructive/5' : status === 'warning' ? 'border-yellow-500/20 bg-yellow-50/5 dark:bg-yellow-900/10' : 'border-success/20 bg-success/5';
  const Icon = status === 'danger' || status === 'warning' ? AlertCircle : CheckCircle;
  const iconColor = status === 'danger' ? 'text-destructive' : status === 'warning' ? 'text-yellow-500' : 'text-success';

  const saveLimit = () => {
    const value = parseFloat(limitInput);
    if (isNaN(value) || value <= 0) return;
    setMonthlySpendingLimit(value);
    setIsEditingLimit(false);
  };

  return (
    <Card className={`border ${borderColor}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${iconColor} ${status !== 'good' ? 'animate-pulse' : ''}`} />
          <div>
            <CardTitle>Monthly Spending Limit</CardTitle>
            <CardDescription>Stay on plan with a calm buffer</CardDescription>
          </div>
        </div>
        {!isEditingLimit ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-muted-foreground transition-colors duration-200 hover:text-primary"
            onClick={() => setIsEditingLimit(true)}
          >
            <Pencil className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
            Edit limit
          </Button>
        ) : (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
            <Input
              type="number"
              min="0"
              value={limitInput}
              onChange={(e) => setLimitInput(e.target.value)}
              className="h-8 w-28 text-sm"
            />
            <Button size="sm" className="h-8 transition-transform duration-200 hover:scale-105" onClick={saveLimit}>Save</Button>
            <Button size="sm" variant="ghost" className="h-8 transition-colors duration-200" onClick={() => {
              setIsEditingLimit(false);
              setLimitInput(limit.toString());
            }}>Cancel</Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4 pt-0 pb-5">
        <div>
          <div className="flex justify-between mb-2 text-sm">
            <span className="font-medium">{displayAmount(monthlyExpenses, currency)}</span>
            <span className="text-muted-foreground">{displayAmount(limit, currency)} limit</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full ${bgColor} transition-all duration-500 ease-out`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}
