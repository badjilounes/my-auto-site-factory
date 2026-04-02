'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
}

export function StatsCard({ title, value, description, icon, trend }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
        {icon && <div className="text-slate-400">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
        {trend && (
          <p className={`text-xs mt-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '+' : ''}{trend.value}% par rapport au mois dernier
          </p>
        )}
      </CardContent>
    </Card>
  );
}
