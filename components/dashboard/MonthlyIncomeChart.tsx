import React from "react";
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react"; // Icon for the center
import { useMonthlyIncomeData, formatCurrency } from "@/hooks/useDashboardData"; // Import hook

const MonthlyIncomeChart = () => {
  const { data: incomeData, loading, error } = useMonthlyIncomeData();

  // Prepare data for the chart (using placeholder logic for now)
  const spent = incomeData?.spent ?? 0;
  const left = incomeData?.left ?? 0;
  const totalBudget = incomeData?.total ?? spent + left; // Use total from hook or calculate
  const spentPercentage = totalBudget > 0 ? (spent / totalBudget) * 100 : 0;

  const chartData = [
    { name: "Income", value: spentPercentage, fill: "#ef4444" }, // Red bar for spent percentage
  ];

  const formattedSpent = formatCurrency(spent);
  const formattedLeft = formatCurrency(left);
  const formattedTotal = formatCurrency(totalBudget);

  // Handle loading and error states
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-center">
            Monthly Income
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[150px] w-full flex items-center justify-center">
          <p>Loading income data...</p>
        </CardContent>
      </Card>
    );
  }

  // Note: Error state might not be triggered if using placeholder hook
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-center">
            Monthly Income
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[150px] w-full flex items-center justify-center">
          <p className="text-red-500">Error loading income data.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-center">
          Monthly Income {formattedTotal}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[150px] w-full flex flex-col items-center relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="60%" // Adjust for gauge look
            outerRadius="80%" // Adjust for gauge look
            barSize={10}
            data={chartData}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar
              background={{ fill: "#d1d5db" }} // Background track color
              dataKey="value"
              cornerRadius={10}
              angleAxisId={0}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              itemStyle={{ color: "hsl(var(--foreground))" }}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        {/* Central Icon */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center h-10 w-10 bg-red-100 rounded-full">
          <User className="h-5 w-5 text-red-600" />
        </div>
        {/* Legend below chart */}
        <div className="flex justify-center gap-4 mt-2 text-sm">
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500"></span>
            <span>Spent: {formattedSpent}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-gray-300"></span>
            <span>Left: {formattedLeft}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyIncomeChart;
