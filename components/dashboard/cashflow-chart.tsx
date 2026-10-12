"use client";

import {
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function CashflowChart({
  data,
}: {
  data: { month: string; income: number; expenses: number; net: number; cumulative: number }[];
}) {
  return (
    <div className="h-72" aria-label="גרף תזרים חודשי">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(v) => `₪${Number(v ?? 0).toLocaleString("he-IL")}`} />
          <Legend />
          <Line type="monotone" dataKey="income" stroke="#059669" name="הכנסות" />
          <Line type="monotone" dataKey="expenses" stroke="#ea580c" name="הוצאות" />
          <Line type="monotone" dataKey="net" stroke="#4f46e5" name="נטו" />
          <Line type="monotone" dataKey="cumulative" stroke="#64748b" name="מצטבר" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
