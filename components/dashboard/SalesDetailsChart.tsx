import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Import Select
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Placeholder data - replace with actual data fetching later
const placeholderSalesData = [
  { name: "5k", sales: 4000 },
  { name: "10k", sales: 3000 },
  { name: "15k", sales: 2000 },
  { name: "20k", sales: 2780 },
  { name: "25k", sales: 1890 },
  { name: "30k", sales: 2390 },
  { name: "35k", sales: 3490 },
  { name: "40k", sales: 4300 },
  { name: "45k", sales: 3700 },
  { name: "50k", sales: 2900 },
  { name: "55k", sales: 3800 },
  { name: "60k", sales: 4100 },
];

// Simulate the peak value from the image
placeholderSalesData[3].sales = 6436; // Around 20k mark

const SalesDetailsChart = () => {
  // TODO: Implement state and handler for month selection
  const currentMonth = "October"; // Placeholder

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Sales Details</CardTitle>
        <Select defaultValue={currentMonth.toLowerCase()}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Month" />
          </SelectTrigger>
          <SelectContent>
            {/* TODO: Populate with actual months */}
            <SelectItem value="october">October</SelectItem>
            <SelectItem value="september">September</SelectItem>
            <SelectItem value="august">August</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={placeholderSalesData}
            margin={{
              top: 5,
              right: 30,
              left: 0, // Adjusted left margin
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${value / 1000}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "black",
                border: "none",
                borderRadius: "5px",
              }}
              labelStyle={{ color: "white" }}
              itemStyle={{ color: "white" }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, "Sales"]}
            />
            {/* <Legend /> */}
            <Line
              type="monotone"
              dataKey="sales"
              stroke="#ef4444" // Red color
              strokeWidth={2}
              dot={{ r: 4, fill: "#3b82f6" }} // Blue dots
              activeDot={{ r: 6 }}
            />
            {/* TODO: Add area fill if needed like the reference image */}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default SalesDetailsChart;
