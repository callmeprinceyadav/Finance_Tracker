import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart as RechartsPieChart,
  Cell,
  ResponsiveContainer,
  Pie,
  Legend,
} from 'recharts';

interface PieChartSectionProps {
  categoryChartData: any[];
  hasRealData: boolean;
}

const darkTooltipStyle = {
  backgroundColor: 'rgba(30, 41, 59, 0.95)',
  border: '1px solid rgba(148, 163, 184, 0.15)',
  borderRadius: '12px',
  fontSize: '12px',
  color: '#e2e8f0',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  backdropFilter: 'blur(10px)',
};

export const PieChartSection: React.FC<PieChartSectionProps> = ({ categoryChartData, hasRealData }) => {
  return (
    <div className="glass-card-static p-4 sm:p-6" style={{ height: '100%' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
          💼 Spending Distribution
        </h3>
        {!hasRealData && (
          <span className="text-xs px-2 py-1 rounded-full" style={{ 
            background: 'rgba(99, 102, 241, 0.15)', 
            color: '#a78bfa' 
          }}>
            Sample Data
          </span>
        )}
      </div>

      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <Tooltip
              formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Amount']}
              labelFormatter={(label) => `Category: ${label}`}
              contentStyle={darkTooltipStyle}
              itemStyle={{ color: '#e2e8f0' }}
            />
            <Pie
              data={categoryChartData}
              cx="50%"
              cy="45%"
              labelLine={false}
              label={({ name, percent }: any) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
              outerRadius={100}
              innerRadius={40}
              fill="#8884d8"
              dataKey="value"
              stroke="rgba(15, 23, 42, 0.8)"
              strokeWidth={2}
            >
              {categoryChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Legend
              verticalAlign="bottom"
              height={50}
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              formatter={(value, entry: any) => (
                <span style={{ color: '#94a3b8' }}>
                  {value}: <span style={{ color: entry.color, fontWeight: 600 }}>${Number(entry.payload?.value || 0).toFixed(2)}</span>
                </span>
              )}
            />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>

      {!hasRealData && (
        <p className="text-xs text-center mt-2" style={{ color: '#64748b' }}>
          Sample data — upload bank statements to see your actual spending.
        </p>
      )}
    </div>
  );
};

interface BarChartSectionProps {
  monthlyChartData: any[];
}

export const BarChartSection: React.FC<BarChartSectionProps> = ({ monthlyChartData }) => {
  const chartData = monthlyChartData.length > 0 ? monthlyChartData : [
    { month: '1/2024', income: 5000, expenses: 3500 },
    { month: '2/2024', income: 5200, expenses: 3800 },
    { month: '3/2024', income: 4800, expenses: 3200 }
  ];

  return (
    <div className="glass-card-static p-6" style={{ height: '100%' }}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          📈 Income vs Expenses
        </h3>
        <p className="text-sm" style={{ color: '#64748b' }}>Monthly comparison of income and expenses</p>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.08)" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: '#64748b' }}
              axisLine={{ stroke: 'rgba(148, 163, 184, 0.1)' }}
              tickLine={{ stroke: 'rgba(148, 163, 184, 0.1)' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#64748b' }}
              axisLine={{ stroke: 'rgba(148, 163, 184, 0.1)' }}
              tickLine={{ stroke: 'rgba(148, 163, 184, 0.1)' }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value: any, name: string) => [
                `$${Number(value).toLocaleString()}`,
                name === 'income' ? 'Income' : 'Expenses'
              ]}
              labelFormatter={(label) => `Month: ${label}`}
              contentStyle={darkTooltipStyle}
              itemStyle={{ color: '#e2e8f0' }}
              cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
            />
            <Legend
              wrapperStyle={{
                fontSize: '14px',
                paddingTop: '20px',
                color: '#94a3b8'
              }}
            />
            <Bar
              dataKey="income"
              name="Income"
              fill="#10b981"
              radius={[6, 6, 0, 0]}
              maxBarSize={60}
            />
            <Bar
              dataKey="expenses"
              name="Expenses"
              fill="#f59e0b"
              radius={[6, 6, 0, 0]}
              maxBarSize={60}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {monthlyChartData.length === 0 && (
        <div className="mt-4 p-3 rounded-lg" style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
          <p className="text-sm" style={{ color: '#a78bfa' }}>
            Sample data — upload transactions to see your actual income vs expenses.
          </p>
        </div>
      )}
    </div>
  );
};
