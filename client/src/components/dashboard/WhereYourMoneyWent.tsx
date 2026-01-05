import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { displayAmount } from "@/lib/currency";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

export function WhereYourMoneyWent() {
  const summary = useStore((state) => state.dashboardSummary);
  const user = useStore((state) => state.user);
  const currency = user?.currency || 'USD';

  const data = (summary?.expenseByCategory || [])
    .map((item) => ({ name: item.category, value: item.total }))
    .slice(0, 6);

  // Muted colors for calm appearance
  const COLORS = ['#8fa3c1', '#a9b8d0', '#c7d2e0', '#9fb8ad', '#b8c4d9', '#d7c9a7'];

  const totalSpent = data.reduce((sum, item) => sum + item.value, 0);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Where Your Money Went</CardTitle>
          <CardDescription>Category-wise expense breakdown</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-muted-foreground animate-pulse">No expenses yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Where Your Money Went</CardTitle>
        <CardDescription>Top spending categories this month</CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={95}
              innerRadius={60}
              fill="#8884d8"
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                  className="transition-opacity duration-200 hover:opacity-80 cursor-pointer"
                />
              ))}
            </Pie>
            <text x="50%" y="50%" dy={-2} textAnchor="middle" fill="hsl(var(--foreground))" fontSize="12" fontWeight="600">
              Total Spent
            </text>
            <text x="50%" y="50%" dy={16} textAnchor="middle" fill="hsl(var(--foreground))" fontSize="14" fontWeight="700">
              {displayAmount(totalSpent, currency)}
            </text>
            <Tooltip 
              formatter={(value: number, name: string) => [`${displayAmount(value as number, currency)}`, name]}
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Legend 
              wrapperStyle={{
                paddingTop: '10px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
