import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Assuming shadcn setup places components here

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  change?: string;
  changeType?: "up" | "down" | "neutral";
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  change,
  changeType,
}) => {
  const changeColor =
    changeType === "up"
      ? "text-green-500"
      : changeType === "down"
      ? "text-red-500"
      : "text-gray-500";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-bold">{title}</CardTitle>
        <Icon className="size-8 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && <p className={`text-xs ${changeColor}`}>{change}</p>}
      </CardContent>
    </Card>
  );
};

export default StatCard;
