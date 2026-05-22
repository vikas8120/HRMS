import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, CircleDollarSign, Sparkles, Target, TrendingUp } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getPremiumCrmOverview } from '../../api/premiumCrmApi'

const icons = [CircleDollarSign, Target, CheckCircle2, TrendingUp]
const currency = (value) => `$${Number(value || 0).toLocaleString()}`

function PremiumDashboardView() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await getPremiumCrmOverview()
        if (!active) return
        setData(res?.data || null)
      } catch (err) {
        if (!active) return
        setError(err?.response?.data?.message || 'Failed to load dashboard data')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const kpis = useMemo(() => {
    const stats = data?.stats || {}
    return [
      { label: 'Revenue', value: currency(stats.monthlyRevenue), delta: 'Current month' },
      { label: 'Active Leads', value: String((data?.salesFunnel || []).find((s) => s.stage === 'Leads')?.count || 0), delta: 'Lead stage' },
      { label: 'Won Deals', value: String((data?.salesFunnel || []).find((s) => s.stage === 'Paid')?.count || 0), delta: 'Closed won' },
      { label: 'Active Subscriptions', value: String(stats.activeSubscriptions || 0), delta: 'Live subscriptions' }
    ]
  }, [data])

  const trendData = useMemo(() => (data?.revenueDeals || []).map((x) => ({ name: x.month, revenue: Number(x.revenue || 0), leads: Number(x.deals || 0) })), [data])

  if (loading) return <div className="crm-glass-card">Loading dashboard...</div>
  if (error) return <div className="crm-glass-card">{error}</div>

  return (
    <div className="crm-view-grid">
      <div className="crm-kpi-grid">
        {kpis.map((k, i) => {
          const Icon = icons[i % icons.length]
          return (
            <motion.div key={k.label} className="crm-glass-card crm-kpi" whileHover={{ y: -3 }}>
              <div><p>{k.label}</p><h3>{k.value}</h3><small>{k.delta}</small></div>
              <Icon size={20} />
            </motion.div>
          )
        })}
      </div>
      <div className="crm-glass-card crm-chart-card">
        <h3>Revenue & Deal Growth</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6C63FF" stopOpacity={0.7} /><stop offset="100%" stopColor="#6C63FF" stopOpacity={0.06} /></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#33415566" />
            <XAxis dataKey="name" stroke="#cbd5e1" />
            <YAxis stroke="#cbd5e1" />
            <Tooltip />
            <Area type="monotone" dataKey="revenue" stroke="#6C63FF" fill="url(#rev)" />
            <Line type="monotone" dataKey="leads" stroke="#06B6D4" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="crm-glass-card">
        <h3>AI Insights</h3>
        <ul className="crm-list">
          {(data?.aiInsights || []).map((insight) => (
            <li key={insight.title}><Sparkles size={14} /> {insight.message}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default PremiumDashboardView
