import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  BarChart3,
  Building2,
  CalendarDays,
  CircleAlert,
  CreditCard,
  RefreshCw,
  Receipt,
  Users
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip
  ,
  XAxis,
  YAxis
} from 'recharts'
import StatCard from '../components/ui/StatCard'
import PageHeader from '../components/ui/PageHeader'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import { getDashboardStats, getOverview, listDashboardSectionWidgets, listPlatformOverviewItems } from '../api/dashboardApi'
import { logout as clearAuth } from '../utils/auth'

const FRONTEND_ONLY_DASHBOARD = true

const DASHBOARD_SEED_OVERVIEW = {
  stats: {
    totalCompanies: 32,
    activeCompanies: 24,
    totalAdmins: 58,
    totalUsers: 1240,
    activeUsers: 860,
    activeSubscriptions: 21,
    monthlyRevenue: 286000,
    systemHealth: 'Healthy'
  },
  revenueDeals: [
    { month: 'Jan', revenue: 162000, deals: 8 },
    { month: 'Feb', revenue: 174000, deals: 9 },
    { month: 'Mar', revenue: 182000, deals: 11 },
    { month: 'Apr', revenue: 196000, deals: 12 },
    { month: 'May', revenue: 214000, deals: 13 },
    { month: 'Jun', revenue: 228000, deals: 14 },
    { month: 'Jul', revenue: 236000, deals: 15 },
    { month: 'Aug', revenue: 244000, deals: 16 },
    { month: 'Sep', revenue: 258000, deals: 16 },
    { month: 'Oct', revenue: 267000, deals: 17 },
    { month: 'Nov', revenue: 276000, deals: 18 },
    { month: 'Dec', revenue: 286000, deals: 19 }
  ],
  leadSources: [
    { source: 'Organic', value: 34 },
    { source: 'Referrals', value: 26 },
    { source: 'Paid Campaigns', value: 22 },
    { source: 'Partnerships', value: 18 }
  ],
  salesFunnel: [
    { stage: 'Leads', count: 1200 },
    { stage: 'Qualified', count: 780 },
    { stage: 'Demo', count: 420 },
    { stage: 'Proposal', count: 260 },
    { stage: 'Won', count: 132 }
  ],
  supportSummary: {
    totalTickets: 74,
    openTickets: 11,
    pendingTickets: 8,
    resolvedTickets: 55
  },
  recentActivities: [
    { title: 'New enterprise signup', description: 'Acme Logistics onboarded with 420 seats.', type: 'subscription', createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString() },
    { title: 'Plan upgrade completed', description: 'Horizon Tech upgraded to Business Plus.', type: 'billing', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    { title: 'Security policy updated', description: 'Password policy minimum length set to 12.', type: 'security', createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
    { title: 'Support SLA recovery', description: 'Pending queue cleared below SLA threshold.', type: 'support', createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() }
  ],
  aiInsights: [
    { title: 'Renewal Risk Alert', message: '12 subscriptions are likely to churn in the next 30 days.', severity: 'warning' },
    { title: 'Revenue Momentum', message: 'Monthly revenue is trending +9.4% over last quarter.', severity: 'success' },
    { title: 'Support Optimization', message: 'Redistributing agents can reduce pending tickets by 18%.', severity: 'info' }
  ]
}

const DASHBOARD_SEED_STATS_META = {
  systemHealth: {
    apiStatus: 'Operational',
    databaseStatus: 'Operational',
    storageStatus: 'Operational',
    uptime: '99.97%'
  }
}

const DASHBOARD_SEED_PLATFORM_OVERVIEW_ROWS = [
  { id: 'ov-1', name: 'Tenant Adoption Trend' },
  { id: 'ov-2', name: 'Cross-Region Growth Pulse' }
]

const DASHBOARD_SEED_PLATFORM_WIDGETS = [
  { id: 'wd-1', name: 'Revenue Velocity' },
  { id: 'wd-2', name: 'Support SLA Heatmap' }
]

const formatCurrency = (value) => Number(value || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const formatCompact = (value) => Number(value || 0).toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: 1 })
const calcGrowth = (current, previous) => {
  const prev = Number(previous || 0)
  if (!prev) return 0
  return ((Number(current || 0) - prev) / prev) * 100
}
const timeAgo = (value) => {
  const date = new Date(value || 0)
  if (Number.isNaN(date.getTime())) return 'just now'
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  return `${Math.floor(hrs / 24)} d ago`
}

function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [overview, setOverview] = useState(null)
  const [statsMeta, setStatsMeta] = useState(null)
  const [platformOverviewRows, setPlatformOverviewRows] = useState([])
  const [platformWidgets, setPlatformWidgets] = useState([])
  const [platformDataError, setPlatformDataError] = useState('')
  const [revenueView, setRevenueView] = useState('6m')
  const [dateFilter, setDateFilter] = useState('this-month')

  const loadDashboard = async () => {
    setLoading(true)
    setError('')
    setPlatformDataError('')
    if (FRONTEND_ONLY_DASHBOARD) {
      setOverview(DASHBOARD_SEED_OVERVIEW)
      setStatsMeta(DASHBOARD_SEED_STATS_META)
      setPlatformOverviewRows(DASHBOARD_SEED_PLATFORM_OVERVIEW_ROWS)
      setPlatformWidgets(DASHBOARD_SEED_PLATFORM_WIDGETS)
      setLoading(false)
      return
    }
    try {
      const [overviewRes, statsRes, platformOverviewRes, widgetRes] = await Promise.all([
        getOverview(),
        getDashboardStats(),
        listPlatformOverviewItems({ page: 1, limit: 20, search: '', status: 'all' }),
        listDashboardSectionWidgets('platform-overview', { page: 1, limit: 20, search: '', status: 'all' })
      ])
      setOverview(overviewRes?.data || null)
      setStatsMeta(statsRes?.data || null)
      setPlatformOverviewRows(platformOverviewRes?.items || [])
      setPlatformWidgets(widgetRes?.items || [])
    } catch (err) {
      if (err?.response?.status === 401) {
        clearAuth()
        window.location.href = '/login'
        return
      }
      setError(err?.response?.data?.message || 'Failed to load dashboard data')
      setPlatformDataError(err?.response?.data?.message || 'Failed to load platform overview/widgets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const displayOverview = overview
  const displayStatsMeta = statsMeta

  const revenueDeals = useMemo(() => {
    const source = displayOverview?.revenueDeals || []
    if (revenueView === '12m') return source.slice(-12)
    if (revenueView === 'year') return source
    return source.slice(-6)
  }, [displayOverview, revenueView])

  const leadSources = displayOverview?.leadSources || []
  const leadTotal = leadSources.reduce((sum, item) => sum + Number(item.value || 0), 0)
  const salesFunnel = displayOverview?.salesFunnel || []
  const activities = displayOverview?.recentActivities || []

  const revenueGrowth = calcGrowth(
    revenueDeals[revenueDeals.length - 1]?.revenue || 0,
    revenueDeals[revenueDeals.length - 2]?.revenue || 0
  )

  const cards = useMemo(
    () => [
      { title: 'Total Companies', value: String(displayOverview?.stats?.totalCompanies ?? 0), trend: `${displayOverview?.stats?.activeCompanies ?? 0} active companies`, icon: Building2, trendTone: 'info' },
      { title: 'Active Companies', value: String(displayOverview?.stats?.activeCompanies ?? 0), trend: `${displayOverview?.stats?.totalCompanies ?? 0} total companies`, icon: Building2, trendTone: 'success' },
      { title: 'Total Admins', value: String(displayOverview?.stats?.totalAdmins ?? 0), trend: 'Company admins', icon: CreditCard, trendTone: 'info' },
      { title: 'Active Users', value: String(displayOverview?.stats?.activeUsers ?? 0), trend: `${displayOverview?.stats?.totalUsers ?? 0} total users`, icon: Users, trendTone: 'success' },
      { title: 'Active Subscriptions', value: String(displayOverview?.stats?.activeSubscriptions ?? 0), trend: `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth.toFixed(1)}% this period`, icon: Receipt, trendTone: revenueGrowth >= 0 ? 'success' : 'danger' },
      { title: 'Monthly Revenue', value: formatCurrency(displayOverview?.stats?.monthlyRevenue ?? 0), trend: `${formatCompact(displayOverview?.stats?.monthlyRevenue ?? 0)} booked`, icon: BarChart3, trendTone: 'success' }
    ],
    [displayOverview, revenueGrowth]
  )

  const exportCsv = () => {
    const stats = displayOverview?.stats || {}
    const rows = [
      ['Metric', 'Value'],
      ['Total Companies', stats.totalCompanies ?? 0],
      ['Active Companies', stats.activeCompanies ?? 0],
      ['Total Users', stats.totalUsers ?? 0],
      ['Active Users', stats.activeUsers ?? 0],
      ['Active Subscriptions', stats.activeSubscriptions ?? 0],
      ['Monthly Revenue', stats.monthlyRevenue ?? 0],
      [],
      ['Revenue & Deals'],
      ['Month', 'Revenue', 'Deals'],
      ...revenueDeals.map((r) => [r.month, r.revenue, r.deals]),
      [],
      ['Lead Sources'],
      ['Source', 'Value'],
      ...leadSources.map((r) => [r.source, r.value]),
      [],
      ['Sales Funnel'],
      ['Stage', 'Count'],
      ...salesFunnel.map((r) => [r.stage, r.count]),
      [],
      ['Recent Activities'],
      ['Title', 'Description', 'Type', 'Created At'],
      ...activities.map((a) => [a.title, a.description, a.type, a.createdAt])
    ]
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `super-admin-dashboard-snapshot-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const maxRevenue = Math.max(...revenueDeals.map((r) => Number(r.revenue || 0)), 1)
  const maxDeals = Math.max(...revenueDeals.map((r) => Number(r.deals || 0)), 1)
  const topFunnel = Math.max(...salesFunnel.map((s) => Number(s.count || 0)), 1)
  const hasMeaningfulRevenueData = revenueDeals.some((r) => Number(r.revenue || 0) > 0 || Number(r.deals || 0) > 0)
  const supportChartData = [
    { name: 'Open', value: Number(displayOverview?.supportSummary?.openTickets || 0) },
    { name: 'Pending', value: Number(displayOverview?.supportSummary?.pendingTickets || 0) },
    { name: 'Resolved', value: Number(displayOverview?.supportSummary?.resolvedTickets || 0) }
  ]
  const hasTicketData = supportChartData.some((item) => Number(item.value || 0) > 0)
  const ticketChartDisplayData = hasTicketData ? supportChartData : [
    { name: 'Open', value: 1 },
    { name: 'Pending', value: 1 },
    { name: 'Resolved', value: 1 }
  ]
  const revenueTrendDisplayData = revenueDeals.map((item) => ({ month: item.month, revenue: Number(item.revenue || 0), deals: Number(item.deals || 0) }))
  const salesFunnelChartData = salesFunnel.map((item) => ({ stage: item.stage, count: Number(item.count || 0) }))
  const hasSalesFunnelChartData = salesFunnelChartData.some((item) => item.count > 0)
  const kpiMixData = [
    { label: 'Companies', total: Number(displayOverview?.stats?.totalCompanies || 0), active: Number(displayOverview?.stats?.activeCompanies || 0) },
    { label: 'Users', total: Number(displayOverview?.stats?.totalUsers || 0), active: Number(displayOverview?.stats?.activeUsers || 0) },
    { label: 'Subscriptions', total: Number(displayOverview?.stats?.activeSubscriptions || 0), active: Number(displayOverview?.stats?.activeSubscriptions || 0) }
  ]
  const orgBreakdownData = [
    { name: 'Companies', value: Number(displayOverview?.stats?.totalCompanies || 0) },
    { name: 'Admins', value: Number(displayOverview?.stats?.totalAdmins || 0) },
    { name: 'Users', value: Number(displayOverview?.stats?.totalUsers || 0) }
  ]
  const hasOrgBreakdownData = orgBreakdownData.some((item) => item.value > 0)
  const orgBreakdownDisplayData = hasOrgBreakdownData ? orgBreakdownData : [
    { name: 'Companies', value: 1 },
    { name: 'Admins', value: 1 },
    { name: 'Users', value: 1 }
  ]

  return (
    <section className="section-layout dashboard-premium">
      <PageHeader
        title="Dashboard"
        description="Premium platform control center for business, subscriptions, support, and operational health."
        breadcrumb={['Super Admin', 'Dashboard']}
        primaryActionLabel=""
      />

      <div className="panel dashboard-header-actions">
        <div className="header-tagline">
          <h3>Platform Overview</h3>
          <p>Live operational intelligence across HRMS tenants and system workflows.</p>
        </div>
        <div className="actions-row">
          <label className="header-date-filter">
            <CalendarDays size={14} />
            <select className="form-input" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
              <option value="today">Today</option>
              <option value="this-week">This Week</option>
              <option value="this-month">This Month</option>
              <option value="this-quarter">This Quarter</option>
            </select>
          </label>
          <Button variant="ghost" onClick={loadDashboard}><RefreshCw size={14} /> Refresh</Button>
          <Button onClick={exportCsv}>Export Snapshot</Button>
        </div>
      </div>

      {error ? (
        <div className="panel dashboard-error-card">
          <CircleAlert size={18} />
          <div>
            <h4>Unable to load dashboard</h4>
            <p>{error}</p>
          </div>
          <Button variant="ghost" onClick={loadDashboard}>Retry</Button>
        </div>
      ) : null}

      {loading ? <LoadingSkeleton rows={8} /> : (
        <div className="stats-grid premium-stats-grid">
          {cards.map((item) => <StatCard key={item.title} {...item} />)}
        </div>
      )}

      <div className="dashboard-main-grid">
        <article className="panel revenue-chart-card">
          <div className="panel-head">
            <h3>Revenue &amp; Deals</h3>
            <div className="tabs-row">
              {[
                { key: '6m', label: 'Last 6 months' },
                { key: '12m', label: '12 months' },
                { key: 'year', label: 'This year' }
              ].map((tab) => (
                <button key={tab.key} type="button" className={`chip-btn ${revenueView === tab.key ? 'active' : ''}`} onClick={() => setRevenueView(tab.key)}>{tab.label}</button>
              ))}
            </div>
          </div>
          {loading ? <LoadingSkeleton rows={5} /> : revenueDeals.length === 0 || !hasMeaningfulRevenueData ? (
            <div className="dashboard-revenue-empty">
              <EmptyState title="No revenue data yet" description="Revenue and deals will appear here after the first tracked transactions." />
              <div className="dashboard-revenue-empty-bars" aria-hidden="true">
                {[32, 44, 36, 48, 42, 50].map((h, i) => <span key={`rev-${i}`} style={{ height: `${h}%` }} />)}
              </div>
            </div>
          ) : (
            <div className="revenue-grid">
              {revenueDeals.map((item) => (
                <div key={item.month} className="revenue-bar-item" title={`${item.month}: ${formatCurrency(item.revenue)} - Deals ${item.deals}`}>
                  <div className="bars-wrap">
                    <span className="bar revenue" style={{ height: `${Math.max((Number(item.revenue || 0) / maxRevenue) * 100, 6)}%` }} />
                    <span className="bar deals" style={{ height: `${Math.max((Number(item.deals || 0) / maxDeals) * 100, 6)}%` }} />
                  </div>
                  <p>{item.month}</p>
                </div>
              ))}
              <div className="chart-legend">
                <span><i className="dot revenue" /> Revenue</span>
                <span><i className="dot deals" /> Deals</span>
              </div>
            </div>
          )}
        </article>

        <article className="panel lead-sources-card">
          <div className="panel-head">
            <h3>Lead Sources</h3>
            <span className="badge badge-info">Total: {leadTotal}%</span>
          </div>
          {loading ? <LoadingSkeleton rows={4} /> : leadSources.length === 0 ? <EmptyState title="No lead source data" description="Lead source distribution will appear once lead records are available." /> : (
            <div className="lead-source-list">
              {leadSources.map((item) => (
                <div key={item.source} className="lead-row">
                  <div><strong>{item.source}</strong><p>{item.value}% contribution</p></div>
                  <div className="lead-progress"><span style={{ width: `${Math.min(item.value, 100)}%` }} /></div>
                  <span className="badge badge-neutral">{item.value}%</span>
                </div>
              ))}
            </div>
          )}
        </article>
      </div>

      <div className="dashboard-main-grid">
        <article className="panel sales-funnel-card">
          <div className="panel-head"><h3>Sales Funnel</h3></div>
          {loading ? <LoadingSkeleton rows={4} /> : salesFunnel.length === 0 ? <EmptyState title="No funnel data" description="Pipeline stage data will appear here once leads are tracked." /> : (
            <div className="funnel-list">
              {salesFunnel.map((item, index) => {
                const pct = Math.round((Number(item.count || 0) / topFunnel) * 100)
                const prev = Number(salesFunnel[index - 1]?.count || topFunnel)
                const conv = prev ? Math.round((Number(item.count || 0) / prev) * 100) : 100
                return (
                  <div key={item.stage} className="funnel-row">
                    <div className="funnel-label">
                      <strong>{item.stage}</strong>
                      <span>{item.count} - {pct}%</span>
                    </div>
                    <div className="funnel-track"><span style={{ width: `${Math.max(pct, 4)}%` }} /></div>
                    <small>Conversion: {conv}%</small>
                  </div>
                )
              })}
            </div>
          )}
        </article>

      </div>

      <div className="dashboard-main-grid">
        <article className="panel">
          <div className="panel-head"><h3>Monthly Revenue vs Deals</h3></div>
          {loading ? <LoadingSkeleton rows={4} /> : revenueTrendDisplayData.length === 0 || !hasMeaningfulRevenueData ? (
            <EmptyState title="No revenue trend data" description="Monthly revenue and deals trend will appear after transactions are tracked." />
          ) : (
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueTrendDisplayData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
                  <XAxis dataKey="month" tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${Math.round(Number(v || 0) / 1000000)}M`} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'var(--panel-tint)', border: '1px solid var(--line)', borderRadius: 10 }}
                    labelStyle={{ color: 'var(--text)' }}
                    itemStyle={{ color: 'var(--text)' }}
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 2 }} name="Revenue" />
                  <Line yAxisId="right" type="monotone" dataKey="deals" stroke="#22d3ee" strokeWidth={2.5} dot={{ r: 2 }} name="Deals" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        <article className="panel">
          <div className="panel-head"><h3>Ticket Distribution</h3></div>
          {loading ? <LoadingSkeleton rows={4} /> : (
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ticketChartDisplayData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={90}
                    paddingAngle={4}
                  >
                    {ticketChartDisplayData.map((entry) => {
                      const map = { Open: '#8b5cf6', Pending: '#f59e0b', Resolved: '#10b981' }
                      return <Cell key={`cell-${entry.name}`} fill={map[entry.name] || '#22d3ee'} />
                    })}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'var(--panel-tint)', border: '1px solid var(--line)', borderRadius: 10 }}
                    labelStyle={{ color: 'var(--text)' }}
                    itemStyle={{ color: 'var(--text)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>
      </div>

      <article className="panel">
        <div className="panel-head"><h3>Sales Funnel Stage Chart</h3></div>
        {loading ? <LoadingSkeleton rows={4} /> : !hasSalesFunnelChartData ? (
          <EmptyState title="No sales funnel chart data" description="Stage-wise opportunity count will appear once funnel data is tracked." />
        ) : (
          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesFunnelChartData}>
                <CartesianGrid stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
                <XAxis dataKey="stage" tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--panel-tint)', border: '1px solid var(--line)', borderRadius: 10 }}
                  labelStyle={{ color: 'var(--text)' }}
                  itemStyle={{ color: 'var(--text)' }}
                />
                <Legend />
                <Bar dataKey="count" name="Opportunities" radius={[8, 8, 0, 0]} fill="#60a5fa" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </article>

      <div className="dashboard-main-grid">
        <article className="panel">
          <div className="panel-head"><h3>Platform KPI Comparison</h3></div>
          {loading ? <LoadingSkeleton rows={4} /> : (
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kpiMixData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
                  <XAxis dataKey="label" tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--panel-tint)', border: '1px solid var(--line)', borderRadius: 10 }} />
                  <Legend />
                  <Bar dataKey="total" name="Total" fill="#6366f1" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="active" name="Active" fill="#22c55e" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        <article className="panel">
          <div className="panel-head"><h3>Organization Breakdown</h3></div>
          {loading ? <LoadingSkeleton rows={4} /> : (
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={orgBreakdownDisplayData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={92} paddingAngle={4}>
                    {orgBreakdownDisplayData.map((entry) => {
                      const colorMap = { Companies: '#3b82f6', Admins: '#f59e0b', Users: '#a855f7' }
                      return <Cell key={`org-${entry.name}`} fill={colorMap[entry.name] || '#22d3ee'} />
                    })}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--panel-tint)', border: '1px solid var(--line)', borderRadius: 10 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>
      </div>

      <article className="panel recent-activities-card">
        <div className="panel-head">
          <h3>Recent Activities</h3>
          <Button variant="ghost">View All</Button>
        </div>
        {loading ? <LoadingSkeleton rows={6} /> : activities.length === 0 ? (
          <EmptyState title="No recent activities" description="Activity feed will appear here once events are logged." />
        ) : (
          <div className="timeline">
            {activities.map((item, index) => (
              <div key={`${item.title}-${index}`} className="timeline-item">
                <span className="timeline-dot" />
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                  <small>{timeAgo(item.createdAt)} - {item.type}</small>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>

      <article className="panel">
        <div className="panel-head"><h3>Platform Overview Widgets</h3></div>
        {loading ? <LoadingSkeleton rows={4} /> : platformDataError ? (
          <EmptyState title="Failed to load platform overview/widgets" description={platformDataError} />
        ) : (platformOverviewRows.length === 0 && platformWidgets.length === 0) ? (
          <EmptyState title="No platform overview widgets found" description="Create platform overview records or dashboard widgets to populate this section." />
        ) : (
          <div className="modal-form">
            <div><strong>Platform Overview Items:</strong> {platformOverviewRows.length}</div>
            <div><strong>Dashboard Widgets:</strong> {platformWidgets.length}</div>
            <div><strong>Latest Overview:</strong> {platformOverviewRows[0]?.name || '-'}</div>
            <div><strong>Latest Widget:</strong> {platformWidgets[0]?.name || '-'}</div>
          </div>
        )}
      </article>
    </section>
  )
}

export default DashboardPage
