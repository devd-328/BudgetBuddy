import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAnalyticsData } from '../hooks/useAnalyticsData'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Doughnut, Line } from 'react-chartjs-2'

// Register Chart.js elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function Analytics() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [period, setPeriod] = useState('month') // 'week' | 'month' | 'quarter' | 'year'
  const { donutData, lineData, topCategory, budgetProgress, loading } = useAnalyticsData(user?.id, period)

  const currency = profile?.currency || 'Rs'
  const totalPeriodSpend = donutData.reduce((sum, d) => sum + d.amount, 0)

  // 1. Doughnut Chart Config
  const doughnutChartData = {
    labels: donutData.map(d => d.name),
    datasets: [
      {
        data: donutData.map(d => d.amount),
        backgroundColor: donutData.map(d => d.color),
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  }

  const doughnutOptions = {
    responsive: true,
    cutout: '75%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1a1a2e',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        callbacks: {
          label: (ctx) => ` ${currency}${ctx.raw.toFixed(2)}`
        }
      }
    }
  }

  // 2. Line Chart Config (6 Month History)
  const lineChartData = {
    labels: lineData.labels,
    datasets: [
      {
        label: 'Income',
        data: lineData.income,
        borderColor: '#5DCAA5', // Income Teal
        backgroundColor: 'rgba(93, 202, 165, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        pointHitRadius: 10
      },
      {
        label: 'Expense',
        data: lineData.expense,
        borderColor: '#F0997B', // Expense Coral
        backgroundColor: 'rgba(240, 153, 123, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        pointHitRadius: 10
      }
    ]
  }

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
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
        callbacks: {
           label: (ctx) => ` ${ctx.dataset.label}: ${currency}${ctx.raw.toFixed(2)}`
        }
      }
    }
  }

  return (
    <div className="page-enter pb-24">
      {/* Header & Tabs */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors active:scale-95 text-white/50 hover:text-white">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold">Analytics</h1>
      </div>
      
      <div className="flex bg-white/5 rounded-full p-1 mb-8">
        {['week', 'month', 'quarter', 'year'].map(p => (
           <button
             key={p}
             onClick={() => setPeriod(p)}
             className={`flex-1 py-1.5 text-xs font-semibold rounded-full capitalize transition-all ${period === p ? 'bg-white/10 text-white shadow-sm' : 'text-white/40'}`}
           >
             {p}
           </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center p-10">
           <span className="loader shrink-0 inline-block w-8 h-8 border-4 border-white/20 border-t-accent rounded-full animate-spin"></span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="flex flex-col">
              {/* Doughnut Chart Block */}
              <div className="card-navy border border-white/10 mb-6 relative py-8">
                 {donutData.length === 0 ? (
                    <div className="text-center text-white/40 text-sm py-4">No structured expenses for this period.</div>
                 ) : (
                    <div className="relative w-48 h-48 mx-auto">
                       <Doughnut data={doughnutChartData} options={doughnutOptions} />
                       <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <p className="text-xs text-white/50">Total Spent</p>
                          <p className="text-xl font-bold">{currency}{totalPeriodSpend.toFixed(0)}</p>
                       </div>
                    </div>
                 )}

                 {/* Top Category Callout */}
                 {topCategory && (
                    <div className="mt-8 bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                       <div>
                          <p className="text-xs text-white/50 mb-1">Top Spend Category</p>
                          <div className="flex items-center gap-2">
                             <span className="w-3 h-3 rounded-full" style={{backgroundColor: topCategory.color}}></span>
                             <p className="text-sm font-semibold">{topCategory.name}</p>
                          </div>
                       </div>
                       <p className="text-lg font-bold text-expense">{currency}{topCategory.amount.toFixed(0)}</p>
                    </div>
                 )}
              </div>

               {/* Budget Progress Bounds */}
               {budgetProgress.length > 0 && (
                  <div className="mb-4 bg-white/5 p-5 rounded-2xl border border-white/5">
                     <h2 className="text-sm font-semibold mb-3">Current Limits Overview</h2>
                     <div className="space-y-4">
                        {budgetProgress.map(cat => {
                           let percent = 0
                           if (cat.limit > 0) percent = Math.min((cat.spent / cat.limit) * 100, 100)
                           else percent = cat.spent > 0 ? 100 : 0
                           
                           let barColor = cat.color
                           if (cat.limit > 0) {
                              if (percent >= 90) barColor = '#FF7676'
                              else if (percent >= 75) barColor = '#FFB84C'
                           }
                           
                           return (
                              <div key={cat.id}>
                                 <div className="flex justify-between text-xs mb-1">
                                    <span className="flex items-center gap-2"><span className="opacity-50">{cat.icon}</span> {cat.name}</span>
                                    <span className="opacity-70">{currency}{cat.spent.toFixed(0)} / {cat.limit > 0 ? `${cat.limit}` : '∞'}</span>
                                 </div>
                                 <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full transition-all duration-500" style={{ width: `${percent}%`, backgroundColor: barColor }} />
                                 </div>
                              </div>
                           )
                        })}
                     </div>
                  </div>
               )}
          </div>

          <div className="flex flex-col">
              {/* Line Chart Block */}
              <div className="mb-8 flex-1 flex flex-col">
                 <div className="flex justify-between items-end mb-4">
                    <div>
                       <h2 className="text-sm font-semibold">6-Month Trend</h2>
                       <p className="text-[10px] text-white/40 mt-1 flex gap-3">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full border border-income"></span> Income</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full border border-expense"></span> Expense</span>
                       </p>
                    </div>
                 </div>
                 <div className="bg-white/5 rounded-2xl p-4 h-64 lg:h-full min-h-[300px] border border-white/5 relative">
                    {lineData.labels.length === 0 ? (
                       <p className="text-center text-white/40 mt-10">No history available</p>
                    ) : (
                       <Line data={lineChartData} options={lineOptions} />
                    )}
                 </div>
              </div>
          </div>

        </div>
      )}
    </div>
  )
}
