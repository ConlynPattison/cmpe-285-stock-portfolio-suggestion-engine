import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { TrendPoint } from "../types";

interface TrendChartProps {
  data: TrendPoint[];
  height?: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

export function TrendChart({ data, height = 280 }: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-60 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
        No history available.
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 12, right: 16, bottom: 4, left: 8 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tickLine={false}
            axisLine={{ stroke: "#cbd5e1" }}
            tick={{ fill: "#64748b", fontSize: 12 }}
          />
          <YAxis
            tickFormatter={formatCurrency}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
            width={70}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              fontSize: 12,
            }}
            labelFormatter={(label) => (typeof label === "string" ? formatDate(label) : label)}
            formatter={(value) => {
              const numericValue = typeof value === "number" ? value : Number(value);
              return [
                new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
                  numericValue,
                ),
                "Total value",
              ];
            }}
          />
          <Line
            type="monotone"
            dataKey="total_value_usd"
            stroke="#0f172a"
            strokeWidth={2.5}
            dot={{ r: 4, strokeWidth: 0, fill: "#0f172a" }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
