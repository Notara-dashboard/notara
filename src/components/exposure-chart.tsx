"use client";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { exposure, money } from "@/lib/data";
export default function ExposureChart() {
  return (
    <div
      className="exposure-chart"
      role="img"
      aria-label="Sample gross debit exposure fell from R 92,000 in May to R 66,250 in October. Exact values are available in Arrears & Financials."
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart
          data={exposure}
          margin={{ top: 8, right: 9, left: -27, bottom: 0 }}
        >
          <defs>
            <linearGradient id="exposure-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7872ff" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#7872ff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="var(--border)"
            vertical={false}
            strokeDasharray="3 4"
          />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted)", fontSize: 10 }}
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted)", fontSize: 10 }}
            tickFormatter={(v) => `${v}k`}
            domain={[0, 120]}
            ticks={[0, 40, 80, 120]}
          />
          <Tooltip
            contentStyle={{
              background: "var(--panel)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              color: "var(--text)",
              fontSize: 12,
            }}
            formatter={(value) => [money(Number(value) * 1000), "Gross debit"]}
          />
          <Area
            type="monotone"
            dataKey="debit"
            stroke="#8a80ff"
            strokeWidth={2.5}
            fill="url(#exposure-fill)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
