import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAnalyticsData } from '../hooks/useAnalyticsData'

import SegmentedControl from '../components/ui/SegmentedControl'
import AmountDisplay from '../components/ui/AmountDisplay'
import ProgressBar from '../components/ui/ProgressBar'
import Skeleton from '../components/ui/Skeleton'
import Card from '../components/ui/Card'

// Chart.js — only for Line chart
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const PERIOD_OPTIONS = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'Year' },
]

// ─── Custom SVG Doughnut ───
function SVGDoughnut({ data, totalSpend, currency }) {
  const [hovered, setHovered] = useState(null)
  const radius = 70
  const strokeWidth = 10
  const center = 90
  const circumference = 2 * Math.PI * radius

  const segments = useMemo(() => {
    if (totalSpend === 0) return []
    let offset = -circumference / 4 // Start from 12 o'clock
    return data.map((d, i) => {
      const ratio = d.amount / totalSpend
      const arcLength = ratio * circumference
      const segment = { ...d, arcLength, offset, ratio }
      offset += arcLength
      return segment
    })
  }, [data, totalSpend, circumference])

  return (
    <div className="relative">
      <svg width={center * 2} height={center * 2} className="mx-auto block">
        {/* Background ring */}
        <circle
          cx={center} cy={center} r={radius}
          fill="none" stroke="currentColor" strokeWidth={strokeWidth}
          className="text-interactive"
        />
        {/* Data segments */}
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx={center} cy={center} r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={hovered === i ? strokeWidth + 3 : strokeWidth}
            strokeDasharray={`${seg.arcLength} ${circumference - seg.arcLength}`}
            strokeDashoffset={-seg.offset}
            strokeLinecap="round"
            className="transition-[stroke-width] duration-fast ease-out-expo cursor-pointer"
            style={{
              animationDelay: `${i * 80}ms`,
            }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
      </svg>

      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <p className="overline mb-1">Total Spent</p>
        <AmountDisplay value={totalSpend} currency={currency} size="lg" />
      </div>

      {/* Hover tooltip */}
      {hovered !== null && segments[hovered] && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-elevated border border-border-subtle rounded-xl px-3 py-2 shadow-lg animate-fade-in pointer-events-none z-10">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: segments[hovered].color }} />
            <span className="text-xs font-medium text-txt-primary">{segments[hovered].name}</span>
          </div>
          <p className="font-mono text-sm font-bold text-txt-primary mt-0.5">
            {currency}{segments[hovered].amount.toLocaleString()} ({Math.round(segments[hovered].ratio * 100)}%)
          </p>
        </div>
      )}
    </div>
  )
}

export default function Analytics() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [period, setPeriod] = useState('month')
  const { donutData, lineData, topCategory, budgetProgress, loading } = useAnalyticsData(user?.id, period)

  const currency = profile?.currency || 'Rs'
  const totalPeriodSpend = donutData.reduce((sum, d) => sum + d.amount, 0)

  // Line Chart Config
  const lineChartData = {
    labels: lineData.labels,
    datasets: [
      {
        label: 'Income',
        data: lineData.income,
        borderColor: '#34D399',
        backgroundColor: 'transparent',
        borderDash: [6, 4],
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        pointHitRadius: 10,
      },
      {
        label: 'Expense',
        data: lineData.expense,
        borderColor: '#FB7185',
        backgroundColor: 'transparent',
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        pointHitRadius: 10,
      },
    ],
  }

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    scales: {
      y: {
        display: true,
        beginAtZero: true,
        grid: { color: 'rgba(58,58,72,0.2)', drawBorder: false },
        ticks: {
          color: '#5A5A6E',
          font: { size: 10, family: 'JetBrains Mono' },
          maxTicksLimit: 4,
        },
        border: { display: false },
      },
      x: {
        grid: { display: false },
        ticks: {
          color: '#5A5A6E',
          font: { size: 10, family: 'Inter' },
        },
        border: { display: false },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#18181F',
        titleColor: '#E8E8F0',
        bodyColor: '#E8E8F0',
        borderColor: 'rgba(58,58,72,0.4)',
        borderWidth: 1,
        titleFont: { family: 'Inter', size: 12 },
        bodyFont: { family: 'JetBrains Mono', size: 12 },
        padding: 12,
        cornerRadius: 12,
        displayColors: false,
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${currency}${ctx.raw.toLocaleString()}`,
        },
      },
    },
  }

  return (
    <div className="page-enter pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-interactive border border-border-subtle 
                     hover:bg-elevated hover:border-border transition-[background,border-color] duration-fast
                     text-txt-muted hover:text-txt-primary"
        >
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Analytics</h1>
      </div>

      {/* Period Control */}
      <SegmentedControl
        options={PERIOD_OPTIONS}
        value={period}
        onChange={setPeriod}
        className="mb-8"
      />

      {loading ? (
        <div className="space-y-6">
          <Skeleton variant="rect" height={220} />
          <Skeleton variant="card" count={3} />
          <Skeleton variant="rect" height={200} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 stagger-children">

          {/* ═══ Doughnut + Legend ═══ */}
          <Card>
            {donutData.length === 0 ? (
              <div className="text-center text-txt-muted text-sm py-8">
                No expenses for this period
              </div>
            ) : (
              <>
                <SVGDoughnut
                  data={donutData}
                  totalSpend={totalPeriodSpend}
                  currency={currency}
                />

                {/* Legend */}
                <div className="mt-6 space-y-2">
                  {donutData.map((d, i) => (
                    <div key={i} className="flex items-center gap-3 py-1">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-sm text-txt-secondary flex-1">{d.name}</span>
                      <span className="font-mono text-sm font-medium text-txt-primary">
                        {currency}{d.amount.toLocaleString()}
                      </span>
                      <span className="font-mono text-2xs text-txt-muted w-10 text-right">
                        {totalPeriodSpend > 0 ? Math.round((d.amount / totalPeriodSpend) * 100) : 0}%
                      </span>
                    </div>
                  ))}
                </div>

                {/* Top Category Spotlight */}
                {topCategory && (
                  <div className="mt-4 bg-interactive/40 rounded-xl p-3 border-l-2 flex items-center justify-between"
                       style={{ borderLeftColor: topCategory.color }}>
                    <div>
                      <p className="overline mb-0.5">Top Spend</p>
                      <p className="text-sm font-semibold text-txt-primary">{topCategory.name}</p>
                    </div>
                    <p className="font-mono text-base font-bold text-expense">
                      {currency}{topCategory.amount.toLocaleString()}
                    </p>
                  </div>
                )}
              </>
            )}
          </Card>

          {/* ═══ Line Chart + Budget Progress ═══ */}
          <div className="flex flex-col gap-6">
            {/* Line Chart */}
            <Card>
              <div className="flex justify-between items-center mb-4">
                <p className="section-title">6-Month Trend</p>
                <div className="flex gap-3">
                  <span className="flex items-center gap-1.5 text-2xs text-txt-muted">
                    <span className="w-4 border-t-2 border-dashed border-income" /> Income
                  </span>
                  <span className="flex items-center gap-1.5 text-2xs text-txt-muted">
                    <span className="w-4 border-t-2 border-expense" /> Expense
                  </span>
                </div>
              </div>
              <div className="h-56 lg:h-64">
                {lineData.labels.length === 0 ? (
                  <p className="text-center text-txt-muted text-sm mt-16">No history available</p>
                ) : (
                  <Line data={lineChartData} options={lineOptions} />
                )}
              </div>
            </Card>

            {/* Budget Progress */}
            {budgetProgress.length > 0 && (
              <Card>
                <p className="section-title mb-4">Budget Limits</p>
                <div className="space-y-4">
                  {budgetProgress.map((cat, i) => {
                    const percent = cat.limit > 0 ? Math.min((cat.spent / cat.limit) * 100, 100) : 0

                    return (
                      <div key={cat.id} className={`${percent >= 80 ? 'p-2 -mx-2 rounded-xl bg-expense-tint/30' : ''}`}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-sm text-txt-secondary">{cat.name}</span>
                          <span className="font-mono text-2xs text-txt-muted">
                            {currency}{cat.spent.toLocaleString()} / {cat.limit > 0 ? cat.limit.toLocaleString() : '∞'}
                          </span>
                        </div>
                        <ProgressBar
                          value={cat.spent}
                          max={cat.limit}
                          color="adaptive"
                          height="sm"
                          delay={i * 80}
                        />
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
