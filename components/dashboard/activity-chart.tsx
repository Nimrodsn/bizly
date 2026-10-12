"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function ActivityChart({
  data,
}: {
  data: { name: string; total: number }[];
}) {
  if (!data.length) return null;
  return (
    <div className="h-64 w-full" aria-label="גרף הכנסות לפי תחום">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => `₪${Number(v ?? 0).toLocaleString("he-IL")}`} />
          <Bar dataKey="total" fill="#059669" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
