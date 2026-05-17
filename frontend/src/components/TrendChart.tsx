import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { TrendPoint } from "../types";

interface TrendChartProps {
  data: TrendPoint[];
  height?: number;
  color?: string;
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

export function TrendChart({ data, height = 300, color = "#6366f1" }: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-60 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
        No history available for this period.
      </div>
    );
  }

  const first = data[0]?.total_value_usd ?? 0;
  const last = data[data.length - 1]?.total_value_usd ?? 0;
  const isPositive = last >= first;
  const lineColor = isPositive ? "#10b981" : "#f43f5e";
  const gradientId = `trendGrad-${lineColor.replace("#", "")}`;

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 12, right: 8, bottom: 4, left: 4 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity={0.18} />
              <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#f1f5f9" strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tickLine={false}
            axisLine={{ stroke: "#e2e8f0" }}
            tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "Inter, sans-serif" }}
          />
          <YAxis
            tickFormatter={formatCurrency}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "Inter, sans-serif" }}
            width={76}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              fontSize: 13,
              fontFamily: "Inter, sans-serif",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              padding: "10px 14px",
            }}
            labelStyle={{ color: "#64748b", marginBottom: 4 }}
            labelFormatter={(label) => (typeof label === "string" ? formatDate(label) : label)}
            formatter={(value) => {
              const numericValue = typeof value === "number" ? value : Number(value);
              return [
                new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(numericValue),
                "Portfolio value",
              ];
            }}
          />
          <Area
            type="monotone"
            dataKey="total_value_usd"
            stroke={lineColor}
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 0, fill: lineColor }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface TrendChartProps {
  data: TrendPoint[];
  height?: number;
}

