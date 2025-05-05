import React, { useState, useMemo } from "react"; // Added useMemo
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useVisitorsData } from "@/hooks/useDashboardData"; // Import hook

const VisitorsChart = () => {
  // State for selected month - default to current month
  const [selectedMonthDate, setSelectedMonthDate] = useState(new Date());

  // Fetch data using the hook based on selected month
  // NOTE: The hook currently returns PLACEHOLDER data
  const {
    data: visitorsData,
    loading,
    error,
  } = useVisitorsData(selectedMonthDate);

  // Memoize month options to avoid recalculation on every render
  const monthOptions = useMemo(() => {
    const options = [];
    const current = new Date();
    for (let i = 0; i < 6; i++) {
      // Show current month and previous 5 months
      const date = new Date(current.getFullYear(), current.getMonth() - i, 1);
      options.push({
        value: date.toISOString(), // Use ISO string as unique value
        label: date.toLocaleString("default", {
          month: "long",
          year: "numeric",
        }),
      });
    }
    return options;
  }, []);

  const handleMonthChange = (direction: "prev" | "next") => {
    setSelectedMonthDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
      // Basic boundary check (assuming 6 months range)
      const oldestDate = new Date(
        new Date().getFullYear(),
        new Date().getMonth() - 5,
        1
      );
      if (newDate < oldestDate || newDate > new Date()) {
        return prevDate; // Don't go out of bounds
      }
      return newDate;
    });
  };

  // Handle loading and error states (Placeholder hook doesn't have real loading/error)
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          {/* Header content during load */}
        </CardHeader>
        <CardContent className="h-[150px] w-full flex items-center justify-center">
          <p>Loading visitors data...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          {/* Header content on error */}
        </CardHeader>
        <CardContent className="h-[150px] w-full flex items-center justify-center">
          <p className="text-red-500">Error loading visitors data.</p>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for the chart
  const chartData = visitorsData?.segments ?? [];
  const totalVisitors = visitorsData?.total ?? 0;
  const currentMonthLabel = selectedMonthDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  // Disable logic for buttons (basic example)
  const isOldestMonth =
    selectedMonthDate <=
    new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1);
  const isLatestMonth =
    selectedMonthDate >=
    new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleMonthChange("prev")}
          disabled={isOldestMonth}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">{currentMonthLabel}</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleMonthChange("next")}
          disabled={isLatestMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="h-[150px] w-full flex flex-col items-center relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              itemStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={40} // Donut hole
              outerRadius={60}
              paddingAngle={2}
              dataKey="value"
              stroke="none" // No border between segments
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Central Text */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <p className="text-2xl font-bold">{totalVisitors}</p>
          <p className="text-xs text-muted-foreground">visitors this month</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default VisitorsChart;
