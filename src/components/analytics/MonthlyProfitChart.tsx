import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { SummaryBucket } from '@/domain';

const currencyFormatter = new Intl.NumberFormat('ja-JP', {
  style: 'currency',
  currency: 'JPY',
  maximumFractionDigits: 0,
});

const compactCurrencyFormatter = new Intl.NumberFormat('ja-JP', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const chartGridColor = '#31453d';
const chartTickColor = '#9aaba2';
const chartPositiveColor = '#22c77a';
const chartNegativeColor = '#ff6b6b';
const chartTooltipStyle = {
  backgroundColor: '#121815',
  border: '1px solid #263832',
  borderRadius: 8,
  color: '#f4fff8',
};
const chartTooltipLabelStyle = {
  color: '#9aaba2',
  fontWeight: 700,
};

export function MonthlyProfitChart({ buckets }: { buckets: SummaryBucket[] }) {
  if (buckets.length === 0) {
    return (
      <div className="rounded-[8px] bg-pwt-surface-muted px-4 py-3 text-sm font-bold text-pwt-muted">
        分析するログがまだありません。
      </div>
    );
  }

  const chartData = buckets.map((bucket) => ({
    name: bucket.label.replace('年', '/').replace('月', ''),
    profit: bucket.totalProfit,
  }));

  return (
    <div className="mt-4 h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: -18 }}>
          <CartesianGrid stroke={chartGridColor} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: chartTickColor, fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fill: chartTickColor, fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={formatCompactCurrency} />
          <Tooltip
            contentStyle={chartTooltipStyle}
            labelStyle={chartTooltipLabelStyle}
            cursor={{ fill: '#1b262180' }}
            formatter={(value) => formatCurrency(Number(value))}
            labelFormatter={(label) => `${label}月`}
          />
          <Bar dataKey="profit" radius={[6, 6, 0, 0]}>
            {chartData.map((item) => (
              <Cell key={item.name} fill={item.profit >= 0 ? chartPositiveColor : chartNegativeColor} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatCompactCurrency(value: number) {
  return compactCurrencyFormatter.format(value);
}
