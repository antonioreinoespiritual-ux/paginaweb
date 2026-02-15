"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function KpiChart({ data }: { data: Array<{ name: string; value: number; target: number }> }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#3b82f6" />
          <Bar dataKey="target" fill="#10b981" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
