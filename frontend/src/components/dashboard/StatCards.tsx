import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, CreditCard } from 'lucide-react';
import { formatCurrency } from '../../services/api';

interface StatCardsProps {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  transactionCount: number;
  monthlyChange?: { isPositive: boolean; percentage: number };
}

export const StatCards: React.FC<StatCardsProps> = ({
  totalIncome,
  totalExpenses,
  netBalance,
  transactionCount,
  monthlyChange,
}) => {
  const cards = [
    {
      label: 'Total Income',
      value: formatCurrency(totalIncome),
      icon: TrendingUp,
      gradient: 'linear-gradient(135deg, #059669, #10b981)',
      glow: 'rgba(16, 185, 129, 0.15)',
      textColor: '#34d399',
      delay: 'delay-100',
    },
    {
      label: 'Total Expenses',
      value: formatCurrency(-totalExpenses),
      icon: TrendingDown,
      gradient: 'linear-gradient(135deg, #e11d48, #f43f5e)',
      glow: 'rgba(244, 63, 94, 0.15)',
      textColor: '#fb7185',
      delay: 'delay-200',
    },
    {
      label: 'Net Balance',
      value: formatCurrency(netBalance),
      icon: DollarSign,
      gradient: netBalance >= 0 
        ? 'linear-gradient(135deg, #059669, #10b981)' 
        : 'linear-gradient(135deg, #e11d48, #f43f5e)',
      glow: netBalance >= 0 
        ? 'rgba(16, 185, 129, 0.15)' 
        : 'rgba(244, 63, 94, 0.15)',
      textColor: netBalance >= 0 ? '#34d399' : '#fb7185',
      delay: 'delay-300',
      extra: monthlyChange ? (
        <p className="text-xs mt-1" style={{ color: monthlyChange.isPositive ? '#34d399' : '#fb7185' }}>
          {monthlyChange.isPositive ? '+' : ''}{monthlyChange.percentage.toFixed(1)}% from last month
        </p>
      ) : null,
    },
    {
      label: 'Transactions',
      value: transactionCount.toString(),
      icon: CreditCard,
      gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      glow: 'rgba(99, 102, 241, 0.15)',
      textColor: '#a78bfa',
      delay: 'delay-400',
      extra: <p className="text-xs mt-1" style={{ color: '#64748b' }}>this month</p>,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className={`glass-card p-5 animate-slide-up ${card.delay}`}
            style={{ boxShadow: `0 8px 32px rgba(0,0,0,0.2), 0 0 20px ${card.glow}` }}
          >
            <div className="flex items-center">
              <div
                className="p-2.5 rounded-xl flex-shrink-0"
                style={{ background: card.gradient, boxShadow: `0 4px 15px ${card.glow}` }}
              >
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="ml-4 min-w-0">
                <p className="text-xs font-medium" style={{ color: '#64748b' }}>
                  {card.label}
                </p>
                <p className="text-xl font-bold truncate" style={{ color: card.textColor }}>
                  {card.value}
                </p>
                {card.extra}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
