import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getPremiumCrmOverview } from '../../api/premiumCrmApi'

const stageColors = ['#6C63FF', '#8B5CF6', '#06B6D4', '#10B981']

function PremiumAnalyticsView() {
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
        setError(err?.response?.data?.message || 'Failed to load analytics data')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const retentionData = useMemo(() => {
    const total = (data?.stats?.activeUsers || 0) + ((data?.stats?.totalUsers || 0) - (data?.stats?.activeUsers || 0))
    const retention = total > 0 ? Math.round(((data?.stats?.activeUsers || 0) / total) * 100) : 0
    return [
      { name: 'Current', retention, churn: Math.max(0, 100 - retention) }
    ]
  }, [data])

  const segmentData = useMemo(() => (data?.leadSources || []).map((item, idx) => ({ name: item.source, value: item.value, color: stageColors[idx % stageColors.length] })), [data])
  const trendData = useMemo(() => (data?.revenueDeals || []).map((x) => ({ name: x.month, revenue: Number(x.revenue || 0) })), [data])

  if (loading) return <div className="crm-glass-card">Loading analytics...</div>
  if (error) return <div className="crm-glass-card">{error}</div>

  return (
    <div className="crm-view-grid">
      <div className="crm-glass-card crm-chart-card">
        <h3>Retention vs Churn</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={retentionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#33415566" />
            <XAxis dataKey="name" stroke="#cbd5e1" />
            <YAxis stroke="#cbd5e1" />
            <Tooltip />
            <Bar dataKey="retention" fill="#10B981" radius={[8, 8, 0, 0]} />
            <Bar dataKey="churn" fill="#EF4444" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="crm-glass-card crm-chart-card">
        <h3>Lead Source Split</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={segmentData} cx="50%" cy="50%" dataKey="value" outerRadius={75}>
              {segmentData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="crm-glass-card crm-chart-card">
        <h3>Revenue Trend</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#33415566" />
            <XAxis dataKey="name" stroke="#cbd5e1" />
            <YAxis stroke="#cbd5e1" />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default PremiumAnalyticsView
