'use client';

import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend
} from 'recharts';
import { BankAccount, MonthlyData } from '@/lib/types';

interface DashboardChartProps {
  chartData: MonthlyData[];
  accounts: BankAccount[];
}

export default function DashboardChart({ chartData, accounts }: DashboardChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis 
          dataKey="month" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#94a3b8', fontSize: 9 }}
          dy={5}
          interval={0}
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#94a3b8', fontSize: 10 }}
          tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toLocaleString()}k` : value}
          width={60}
        />
        <Tooltip 
          cursor={{ fill: '#f8fafc' }}
          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
          formatter={(value: any, name: any) => {
            const account = accounts.find(a => a.id === name);
            const numValue = typeof value === 'number' ? value : 0;
            return [
              `$${numValue.toLocaleString()}`, 
              account ? account.name : '未知帳戶'
            ];
          }}
        />
        <Legend 
          verticalAlign="top" 
          align="right" 
          iconType="circle" 
          wrapperStyle={{ fontSize: '10px', paddingBottom: '20px' }}
          formatter={(value) => {
            const account = accounts.find(a => a.id === value);
            return account ? account.name : value;
          }}
        />
        {/* Render bars in the exact order of the sorted accounts list */}
        {accounts.map((acc) => (
          <Bar 
            key={acc.id}
            dataKey={acc.id}
            stackId="a"
            fill={acc.color}
            barSize={16}
            radius={[0, 0, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
