import React from 'react'
import { useAuth } from '../context/AuthContext'
import { useDashboardData } from '../hooks/useDashboardData'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip)

const CATEGORY_ICONS = {
  Food: '🍔',
  Transport: '🚌',
  Education: '📚',
  Health: '💊',
  Shopping: '🛍',
  Entertainment: '🎮',
  Bills: '💡',
  Custom: '➕'
}

export default function Dashboard() {
  const { user, profile } = useAuth()
  const { data, loading, error } = useDashboardData(user?.id)

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
         <span className="loader shrink-0 inline-block w-8 h-8 border-4 border-white/20 border-t-accent rounded-full animate-spin"></span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center text-expense">
        <p>Failed to load dashboard data.</p>
        <p className="text-sm opacity-70 mt-2">{error}</p>
      </div>
    )
  }

  const {
    totalIncome,
    totalExpense,
    totalBalance,
    totalLentOut,
    recentTransactions,
    weeklyData,
    categoriesSpends,
  } = data

  const currency = profile?.currency || '$'

  const chartData = {
    labels: weeklyData.map(d => d.label),
    datasets: [
      {
        label: 'Expenses',
        data: weeklyData.map(d => d.amount),
        backgroundColor: '#378ADD',
        borderRadius: 4,
        barPercentage: 0.6,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { display: false, beginAtZero: true },
      x: { 
        grid: { display: false, drawBorder: false },
        ticks: { color: 'rgba(255, 255, 255, 0.4)', font: { size: 10 } }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1a1a2e',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          label: (ctx) => `${currency} ${ctx.raw.toFixed(2)}`
        }
      }
    }
  }

  return (
    <div className="page-enter pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-white/50 text-sm">Good morning 👋</p>
          <h1 className="text-xl font-bold truncate pr-4">{profile?.name || 'User'}</h1>
        </div>
        <div className="w-10 h-10 shrink-0 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold uppercase">
          {profile?.name?.substring(0, 2) || 'BB'}
        </div>
      </div>

      {/* Balance Card */}
      <div className="card-navy mb-6 border border-white/10 shadow-xl">
        <p className="text-white/50 text-xs mb-1">Total Balance</p>
        <p className="text-3xl font-bold text-white mb-6">
          {currency} {totalBalance.toFixed(2)}
        </p>
        
        <div className="flex justify-between flex-wrap gap-4">
          <div>
            <p className="text-income text-xs font-medium mb-1 drop-shadow-sm flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-income inline-block"></span> Income
            </p>
            <p className="text-white font-semibold text-sm">{currency} {totalIncome.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-expense text-xs font-medium mb-1 drop-shadow-sm flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-expense inline-block"></span> Expenses
            </p>
            <p className="text-white font-semibold text-sm">{currency} {totalExpense.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-accent text-xs font-medium mb-1 drop-shadow-sm flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-accent inline-block"></span> Lent Out
            </p>
            <p className="text-white font-semibold text-sm">{currency} {totalLentOut.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      {categoriesSpends.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold mb-3">Top Expenses</h2>
          <div className="grid grid-cols-4 gap-3">
            {categoriesSpends.map((cat, i) => (
              <div key={i} className="flex flex-col items-center bg-white/5 rounded-2xl p-3 border border-white/5">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl mb-2">
                  {CATEGORY_ICONS[cat.name] || '🏷️'}
                </div>
                <p className="text-[10px] text-white/60 truncate w-full text-center">{cat.name}</p>
                <p className="text-xs font-medium text-white max-w-full truncate">{currency}{cat.amount.toFixed(0)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Chart */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold mb-3">Weekly Trend</h2>
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 h-48">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex justify-between items-end mb-3">
           <h2 className="text-sm font-semibold">Recent Transactions</h2>
           {recentTransactions.length > 0 && <span className="text-xs text-accent cursor-pointer">See All</span>}
        </div>
        
        {recentTransactions.length === 0 ? (
          <div className="text-center py-8 bg-white/5 rounded-2xl border border-white/5">
            <span className="text-3xl block mb-2">📝</span>
            <p className="text-sm text-white/50">No recent transactions yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/5">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg shrink-0">
                      {CATEGORY_ICONS[tx.category] || '🏷️'}
                    </div>
                    <div className="overflow-hidden">
                       <p className="text-sm font-medium text-white truncate max-w-[150px]">{tx.description}</p>
                       <p className="text-xs text-white/40">{new Date(tx.date).toLocaleDateString()}</p>
                    </div>
                 </div>
                 <div className="text-right shrink-0">
                    <p className={`text-sm font-semibold ${tx.type === 'income' ? 'text-income' : 'text-white'}`}>
                      {tx.type === 'income' ? '+' : '-'}{currency}{Number(tx.amount).toFixed(2)}
                    </p>
                    {tx.note && <p className="text-[10px] text-white/30 truncate max-w-[80px]">{tx.note}</p>}
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
