import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCustomersData, formatNumber } from "@/hooks/useDashboardData"; // Import hook and formatter

const CustomersChart = () => {
  const { data: customerData, loading, error } = useCustomersData();

  // Prepare data for the Pie chart
  const chartData = customerData
    ? [
        {
          name: "New Customers",
          value: customerData.newCustomers,
          fill: "#3b82f6",
        }, // Blue
        {
          name: "Repeated",
          value: customerData.repeatedCustomers,
          fill: "#d1d5db",
        }, // Gray
      ]
    : [];

  const newCustomersValue = customerData ? customerData.newCustomers : null;
  const repeatedCustomersValue = customerData
    ? customerData.repeatedCustomers
    : null;

  // Handle loading and error states
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Customers</CardTitle>
        </CardHeader>
        <CardContent className="h-[150px] w-full flex items-center justify-center">
          <p>Loading customer data...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Customers</CardTitle>
        </CardHeader>
        <CardContent className="h-[150px] w-full flex items-center justify-center">
          <p className="text-red-500">Error loading customer data.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Customers</CardTitle>
      </CardHeader>
      <CardContent className="h-[150px] w-full flex flex-col items-center">
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
              innerRadius={40} // Creates the donut hole
              outerRadius={60}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.fill}
                  stroke={entry.fill}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 mt-2 text-sm">
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-blue-500"></span>
            <span>New Customers: {formatNumber(newCustomersValue)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-gray-300"></span>
            <span>Repeated: {formatNumber(repeatedCustomersValue)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomersChart;
