import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { format, subDays, startOfDay } from "date-fns";

export function FinancialChart() {
  const transactions = useStore((state) => state.transactions);

  // Generate last 7 days data
  const data = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayStr = format(date, 'MMM dd');
    
    // Sum transactions for this day
    const dayTransactions = transactions.filter(t => 
      startOfDay(new Date(t.date)).getTime() === startOfDay(date).getTime()
    );

    const income = dayTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);

    const expense = dayTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);

    return {
      name: dayStr,
      income,
      expense
    };
  });

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Cash Flow</CardTitle>
        <CardDescription>Income vs Expenses over the last 7 days</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="name" 
              stroke="#888888" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis 
              stroke="#888888" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(value) => `$${value}`} 
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--popover))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
            />
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <Area 
              type="monotone" 
              dataKey="income" 
              stroke="hsl(var(--success))" 
              fillOpacity={1} 
              fill="url(#colorIncome)" 
              strokeWidth={2}
              animationBegin={0}
              animationDuration={1000}
              animationEasing="ease-out"
            />
            <Area 
              type="monotone" 
              dataKey="expense" 
              stroke="hsl(var(--destructive))" 
              fillOpacity={1} 
              fill="url(#colorExpense)" 
              strokeWidth={2}
              animationBegin={200}
              animationDuration={1000}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
