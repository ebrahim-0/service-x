"use client";

import StatCard from "@/components/dashboard/StatCard";
import SalesDetailsChart from "@/components/dashboard/SalesDetailsChart";
import CustomersChart from "@/components/dashboard/CustomersChart";
import MonthlyIncomeChart from "@/components/dashboard/MonthlyIncomeChart";
import VisitorsChart from "@/components/dashboard/VisitorsChart";
import { Users, Package, DollarSign, Clock, Loader } from "lucide-react";
// Import the correct hook and formatters
import {
  useStatCardData,
  formatCurrency,
  formatNumber,
} from "@/hooks/useDashboardData";

const DashboardPage = () => {
  // Fetch data using the correct hook for each stat card
  const {
    value: totalUsers,
    change: changeUsers,
    changeType: changeTypeUsers,
    loading: loadingUsers,
    error: errorUsers,
  } = useStatCardData("users", "count");
  const {
    value: totalOrders,
    change: changeOrders,
    changeType: changeTypeOrders,
    loading: loadingOrders,
    error: errorOrders,
  } = useStatCardData("orders", "count");
  const {
    value: totalSales,
    change: changeSales,
    changeType: changeTypeSales,
    loading: loadingSales,
    error: errorSales,
  } = useStatCardData("orders", "sum", "totalPrice");

  // Handle loading and error states (basic example - aggregate loading/error states)
  const isLoading = loadingUsers || loadingOrders || loadingSales; // Add other loading states
  const hasError = errorUsers || errorOrders || errorSales; // Add other error states

  if (isLoading) {
    return (
      <div className="flex h-screen justify-center items-center">
        <Loader className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (hasError) {
    // Log specific errors for debugging
    console.error("Dashboard Errors:", { errorUsers, errorOrders, errorSales });
    return (
      <div className="p-6 text-red-500">
        Error loading dashboard data. Please check console or try again later.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      {/* Top Row Stat Cards - Now using fetched data */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total User"
          value={formatNumber(totalUsers)} // Use fetched data
          icon={Users}
          change={changeUsers ?? ""} // Use fetched change with fallback
          changeType={changeTypeUsers}
        />
        <StatCard
          title="Total Order"
          value={formatNumber(totalOrders)} // Use fetched data
          icon={Package}
          change={changeOrders ?? ""} // Use fetched change
          changeType={changeTypeOrders}
        />
        <StatCard
          title="Total Sales"
          value={formatCurrency(totalSales)} // Use fetched data
          icon={DollarSign}
          change={changeSales ?? ""} // Use fetched change
          changeType={changeTypeSales}
        />
      </div>
    </div>
  );
};

export default DashboardPage;
