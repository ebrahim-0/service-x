"use client";

// This file will contain hooks or functions to fetch and process dashboard data from Firebase.
import { useState, useEffect } from "react";
import { firestore } from "@/lib/firebase/firebase.browser";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  orderBy,
  limit,
  getCountFromServer,
  startAt,
  endAt,
} from "firebase/firestore";

// --- Interfaces --- (Adjust based on actual Firestore data)
interface User {
  id: string;
  createdAt: Timestamp;
  email: string;
  displayName: string;
  isAdmin: boolean;
  blocked: boolean;
}

export interface OrderProduct {
  code: string;
  imageUrl: string;
  name: string;
  price: number;
  quantity: number;
}

export interface ShippingAddress {
  address: string;
  addressdetails: string;
  city: string;
  email: string;
  name: string;
  phone: string;
}

export interface Order {
  id: string;
  orderId: string;
  date: string;
  userId: string;
  orderProducts: OrderProduct[];
  paymentMethod: string;
  shippingAddressModel: ShippingAddress;
  status: "pending" | "reject" | "approve";
  totalPrice: number;
  uId: string;
}

// --- Helper Functions ---

// Get start/end Timestamps for periods (e.g., today, yesterday, past week)
const getTimestamps = (
  period: "today" | "yesterday" | "past_week" | "specific_month",
  date?: Date
) => {
  const now = new Date();
  let start: Date;
  let end: Date;

  switch (period) {
    case "yesterday":
      start = new Date(now);
      start.setDate(now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setHours(23, 59, 59, 999);
      break;
    case "past_week":
      end = new Date(now);
      end.setDate(now.getDate() - 1); // End of yesterday
      end.setHours(23, 59, 59, 999);
      start = new Date(end);
      start.setDate(end.getDate() - 6); // 7 days including yesterday
      start.setHours(0, 0, 0, 0);
      break;
    case "specific_month":
      if (!date) date = new Date();
      start = new Date(date.getFullYear(), date.getMonth(), 1);
      end = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );
      break;
    case "today":
    default:
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
      break;
  }
  return { start: Timestamp.fromDate(start), end: Timestamp.fromDate(end) };
};

// Calculate percentage change
const calculateChange = (
  current: number | null,
  previous: number | null
): { percentage: number | null; type: "up" | "down" | "neutral" } => {
  if (current === null || previous === null || previous === 0) {
    return { percentage: null, type: "neutral" };
  }
  const change = ((current - previous) / previous) * 100;
  return {
    percentage: Math.abs(change),
    type: change > 0 ? "up" : change < 0 ? "down" : "neutral",
  };
};

// Format currency
export const formatCurrency = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return "$...";
  return `EGP ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

// Format large numbers
export const formatNumber = (num: number | null | undefined) => {
  if (num === null || num === undefined) return "...";
  return num.toLocaleString();
};

// Format percentage change string
export const formatChange = (
  change: { percentage: number | null; type: "up" | "down" | "neutral" },
  periodText: string
): string | null => {
  if (change.percentage === null) return null;
  const direction = change.type === "up" ? "Up" : "Down";
  return `${change.percentage.toFixed(1)}% ${direction} ${periodText}`;
};

// --- Data Fetching Hooks ---

// Fetch total count for a collection within a time range
export const useTotalCount = (
  collectionName: string,
  period: "today" | "yesterday" | "past_week" | "all"
) => {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        setLoading(true);
        const colRef = collection(firestore, collectionName);
        let snapshot;
        if (period === "all") {
          snapshot = await getCountFromServer(colRef);
        } else {
          const { start, end } = getTimestamps(period);
          const q = query(
            colRef,
            where("createdAt", ">=", start),
            where("createdAt", "<=", end)
          );
          snapshot = await getCountFromServer(q);
        }
        setCount(snapshot.data().count);
      } catch (err) {
        setError(err as Error);
        console.error(
          `Error fetching ${collectionName} count for ${period}:`,
          err
        );
      } finally {
        setLoading(false);
      }
    };
    fetchCount();
  }, [collectionName, period]);

  return { count, loading, error };
};

// Fetch sum of a field for a collection within a time range
export const useTotalSum = (
  collectionName: string,
  fieldName: string,
  period: "today" | "yesterday" | "past_week" | "all"
) => {
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTotal = async () => {
      try {
        setLoading(true);
        const colRef = collection(firestore, collectionName);
        let q;
        if (period === "all") {
          q = query(colRef);
        } else {
          const { start, end } = getTimestamps(period);
          q = query(
            colRef,
            where("createdAt", ">=", start),
            where("createdAt", "<=", end)
          );
        }
        const querySnapshot = await getDocs(q);
        let sum = 0;
        querySnapshot.forEach((doc) => {
          sum += doc.data()[fieldName] || 0;
        });
        setTotal(sum);
      } catch (err) {
        setError(err as Error);
        console.error(
          `Error fetching ${fieldName} sum for ${collectionName} (${period}):`,
          err
        );
      } finally {
        setLoading(false);
      }
    };
    fetchTotal();
  }, [collectionName, fieldName, period]);

  return { total, loading, error };
};

// Hook for Stat Card Data (combines counts/sums and calculates change)
export const useStatCardData = (
  collectionName: string,
  type: "count" | "sum",
  fieldName?: string
) => {
  const { count: totalCountAll } = useTotalCount(collectionName, "all");
  const { total: totalSumAll } = useTotalSum(
    collectionName,
    fieldName || "",
    "all"
  );

  // Fetch data for comparison periods (e.g., yesterday, past week)
  const { count: countYesterday } = useTotalCount(collectionName, "yesterday");
  const { total: sumYesterday } = useTotalSum(
    collectionName,
    fieldName || "",
    "yesterday"
  );
  const { count: countToday } = useTotalCount(collectionName, "today"); // Needed for 'yesterday' comparison
  const { total: sumToday } = useTotalSum(
    collectionName,
    fieldName || "",
    "today"
  ); // Needed for 'yesterday' comparison

  const { count: countPastWeek } = useTotalCount(collectionName, "past_week");
  const { total: sumPastWeek } = useTotalSum(
    collectionName,
    fieldName || "",
    "past_week"
  );

  // Determine current value based on type
  const currentValue = type === "count" ? totalCountAll : totalSumAll;

  // Calculate changes (examples)
  const changeFromYesterday = calculateChange(
    type === "count" ? countToday : sumToday,
    type === "count" ? countYesterday : sumYesterday
  );
  const changeFromPastWeek = calculateChange(
    type === "count" ? countToday : sumToday,
    type === "count" ? countPastWeek : sumPastWeek
  ); // Note: This compares today vs past week avg, adjust if needed

  // Select appropriate change based on card (example logic)
  let change: { percentage: number | null; type: "up" | "down" | "neutral" } = {
    percentage: null,
    type: "neutral",
  };
  let changeText: string | null = null;

  // This logic needs refinement based on exact requirements for each card
  if (collectionName === "users") {
    change = changeFromYesterday;
    changeText = formatChange(change, "from yesterday");
  } else if (collectionName === "orders" && type === "count") {
    // Assuming 'Total Orders' compares to past week - NEEDS CLARIFICATION
    // Let's compare today's orders vs avg orders last week for now
    const avgOrdersLastWeek = countPastWeek !== null ? countPastWeek / 7 : null;
    change = calculateChange(countToday, avgOrdersLastWeek);
    changeText = formatChange(change, "from past week avg"); // Adjust text
  } else if (collectionName === "orders" && type === "sum") {
    // Assuming 'Total Sales' compares to yesterday
    change = changeFromYesterday;
    changeText = formatChange(change, "from yesterday");
  }
  // TODO: Add logic for 'Earnings' card change

  return {
    value: currentValue,
    change: changeText,
    changeType: change.type,
    loading: false, // Simplification: loading state needs aggregation from underlying hooks
    error: null, // Simplification: error state needs aggregation
  };
};

// Hook for Sales Details Chart Data
export const useSalesDetailsData = (month: Date) => {
  const [data, setData] = useState<Array<{ name: string; sales: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { start, end } = getTimestamps("specific_month", month);
        const ordersCol = collection(firestore, "orders");
        const q = query(
          ordersCol,
          where("createdAt", ">=", start),
          where("createdAt", "<=", end),
          orderBy("createdAt")
        );

        // If "createdAt" is not available, fallback to "date"
        const fallbackQ = query(
          ordersCol,
          where("date", ">=", start.toDate().toISOString()),
          where("date", "<=", end.toDate().toISOString()),
          orderBy("date")
        );

        // Use "createdAt" query if possible, otherwise fallback to "date"
        let querySnapshot;
        try {
          querySnapshot = await getDocs(q);
        } catch {
          querySnapshot = await getDocs(fallbackQ);
        }

        // Aggregate sales data (e.g., daily)
        const aggregatedData: { [key: string]: number } = {}; // Key: day of month
        querySnapshot.forEach((doc) => {
          const order = doc.data() as Order;
          const dayOfMonth = new Date(order.date).getDate().toString();
          aggregatedData[dayOfMonth] =
            (aggregatedData[dayOfMonth] || 0) + order.totalPrice;
        });

        // Format for Recharts
        const daysInMonth = end.toDate().getDate();
        const chartData = Array.from({ length: daysInMonth }, (_, i) => {
          const day = (i + 1).toString();
          return {
            name: day, // Use day number as label
            sales: aggregatedData[day] || 0, // Default to 0 if no sales
          };
        });

        setData(chartData);
      } catch (err) {
        setError(err as Error);
        console.error("Error fetching sales details data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [month]);

  return { data, loading, error };
};

// Hook for Customers Chart Data (New vs Repeated)
export const useCustomersData = () => {
  const [data, setData] = useState<{
    newCustomers: number;
    repeatedCustomers: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const ordersCol = collection(firestore, "orders");
        const ordersSnapshot = await getDocs(ordersCol);

        const customerOrderCounts: { [userId: string]: number } = {};
        ordersSnapshot.forEach((doc) => {
          const order = doc.data() as Order;
          if (order.userId) {
            customerOrderCounts[order.userId] =
              (customerOrderCounts[order.userId] || 0) + 1;
          }
        });

        let newCustomers = 0;
        let repeatedCustomers = 0;
        for (const userId in customerOrderCounts) {
          if (customerOrderCounts[userId] === 1) {
            newCustomers++;
          } else if (customerOrderCounts[userId] > 1) {
            repeatedCustomers++;
          }
        }

        setData({ newCustomers, repeatedCustomers });
      } catch (err) {
        setError(err as Error);
        console.error("Error fetching customer data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return { data, loading, error };
};

// Hook for Monthly Income Chart Data (Placeholder - requires specific data structure)
export const useMonthlyIncomeData = () => {
  // THIS IS A PLACEHOLDER - Requires knowledge of how 'income', 'spent', 'left' are stored or calculated
  const [data, setData] = useState<{
    spent: number;
    left: number;
    total: number;
  } | null>(null);
  const [loading, setLoading] = useState(false); // Set to false as it's placeholder
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Placeholder logic - replace with actual fetching and calculation
    const spent = 5600;
    const left = 5900;
    const total = spent + left; // Example calculation
    setData({ spent, left, total });
  }, []);

  // In a real scenario, you would fetch actual expense/income data from Firebase here.
  // Example: Fetch total orders amount for the current month as 'spent'
  // const { total: spent } = useTotalSum('orders', 'totalAmount', 'specific_month');
  // 'left' and 'total' would depend on how budget/income is defined.

  return { data, loading, error };
};

// Hook for Visitors Chart Data (Placeholder - requires specific data source)
export const useVisitorsData = (month: Date) => {
  // THIS IS A PLACEHOLDER - Requires knowledge of how 'visitors' are tracked (e.g., Analytics, separate collection)
  const [data, setData] = useState<{
    total: number;
    segments: Array<{ name: string; value: number; fill: string }>;
  } | null>(null);
  const [loading, setLoading] = useState(false); // Set to false as it's placeholder
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Placeholder logic - replace with actual fetching
    // Simulating data structure based on previous placeholder
    const placeholderVisitorData = {
      April: {
        total: 534,
        segments: [
          { name: "Segment A", value: 200, fill: "#f59e0b" },
          { name: "Segment B", value: 150, fill: "#ec4899" },
          { name: "Segment C", value: 100, fill: "#8b5cf6" },
          { name: "Segment D", value: 84, fill: "#3b82f6" },
        ],
      },
      May: {
        total: 621,
        segments: [
          { name: "Segment A", value: 250, fill: "#f59e0b" },
          { name: "Segment B", value: 180, fill: "#ec4899" },
          { name: "Segment C", value: 120, fill: "#8b5cf6" },
          { name: "Segment D", value: 71, fill: "#3b82f6" },
        ],
      },
    };
    // Select data based on month (simple example)
    const monthKey = month.toLocaleString("default", {
      month: "long",
    }) as keyof typeof placeholderVisitorData;
    setData(placeholderVisitorData[monthKey] || placeholderVisitorData.April);
  }, [month]);

  // In a real scenario, you would fetch actual visitor data here.

  return { data, loading, error };
};

// Note: This file is becoming large. Consider splitting hooks into separate files for better organization.
