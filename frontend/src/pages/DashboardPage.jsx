import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  BarChart3,
  Building2,
  CalendarDays,
  CircleAlert,
  CreditCard,
  Database,
  HardDrive,
  LifeBuoy,
  Mail,
  RefreshCw,
  Receipt,
  Server,
  ShieldCheck,
  Sparkles,
  Users
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  PolarRadiusAxis,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
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
import { getDashboardStats, getOverview } from '../api/dashboardApi'

const formatCurrency = (value) => Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
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

const demoOverviewData = {
  stats: {
    totalCompanies: 128,
    activeCompanies: 104,
    totalUsers: 12480,
    activeUsers: 9862,
    activeSubscriptions: 92,
    monthlyRevenue: 4281900,
    systemHealth: 'Optimal'
  },
  revenueDeals: [
    { month: 'Jan', revenue: 2200000, deals: 82 },
    { month: 'Feb', revenue: 2480000, deals: 91 },
    { month: 'Mar', revenue: 2310000, deals: 87 },
    { month: 'Apr', revenue: 2960000, deals: 109 },
    { month: 'May', revenue: 3340000, deals: 118 },
    { month: 'Jun', revenue: 3720000, deals: 124 }
  ],
  leadSources: [
    { source: 'Facebook', value: 32 },
    { source: 'Instagram', value: 18 },
    { source: 'LinkedIn', value: 15 },
    { source: 'Website', value: 22 },
    { source: 'WhatsApp', value: 8 },
    { source: 'Referral', value: 5 }
  ],
  salesFunnel: [
    { stage: 'Leads', count: 980 },
    { stage: 'Demo Booked', count: 640 },
    { stage: 'Proposal', count: 380 },
    { stage: 'Paid', count: 210 }
  ],
  supportSummary: { totalTickets: 112, openTickets: 24, pendingTickets: 18, resolvedTickets: 70 },
  aiInsights: [
    { title: 'Revenue Growth', message: 'Monthly revenue is up 12.4% vs last month.', severity: 'success' },
    { title: 'Lead Quality', message: 'LinkedIn campaigns show highest close probability.', severity: 'info' },
    { title: 'Churn Risk', message: '4 enterprise accounts need proactive outreach.', severity: 'warning' }
  ],
  recentActivities: [
    { title: 'New Enterprise Deal', description: 'Acme Corp signed annual plan.', type: 'sales', createdAt: new Date().toISOString() },
    { title: 'Ticket Resolved', description: 'Priority support issue closed for NeoTech.', type: 'support', createdAt: new Date(Date.now() - 3600 * 1000).toISOString() },
    { title: 'Payment Captured', description: 'Subscription payment received from Quantum Analytics.', type: 'billing', createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString() }
  ]
}

const demoStatsMeta = {
  systemHealth: {
    apiStatus: 'Operational',
    databaseStatus: 'Operational',
    storageStatus: 'Operational',
    uptime: '99.98%'
  }
}

const demoRevenueTrendData = [
  { month: 'Jan', revenue: 2200000 },
  { month: 'Feb', revenue: 2480000 },
  { month: 'Mar', revenue: 2310000 },
  { month: 'Apr', revenue: 2960000 },
  { month: 'May', revenue: 3340000 },
  { month: 'Jun', revenue: 3720000 }
]

const demoTicketDistribution = [
  { name: 'Open', value: 24 },
  { name: 'Pending', value: 18 },
  { name: 'Resolved', value: 70 }
]

function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [overview, setOverview] = useState(null)
  const [statsMeta, setStatsMeta] = useState(null)
  const [revenueView, setRevenueView] = useState('6m')
  const [dateFilter, setDateFilter] = useState('this-month')

  const loadDashboard = async () => {
    setLoading(true)
    setError('')
    try {
      const [overviewRes, statsRes] = await Promise.all([getOverview(), getDashboardStats()])
      setOverview(overviewRes?.data || null)
      setStatsMeta(statsRes?.data || null)
    } catch (err) {
      if (err?.response?.status === 401) {
        localStorage.removeItem('super_admin_token')
        window.location.href = '/login'
        return
      }
      setError(err?.response?.data?.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const shouldUseDemoData = useMemo(() => {
    if (!overview) return false
    const stats = overview.stats || {}
    const noCoreStats = Number(stats.totalCompanies || 0) === 0
      && Number(stats.totalUsers || 0) === 0
      && Number(stats.monthlyRevenue || 0) === 0
    const noRevenue = !(overview.revenueDeals || []).some((r) => Number(r.revenue || 0) > 0 || Number(r.deals || 0) > 0)
    return noCoreStats && noRevenue
  }, [overview])

  const displayOverview = shouldUseDemoData ? demoOverviewData : overview
  const displayStatsMeta = shouldUseDemoData ? demoStatsMeta : statsMeta

  const revenueDeals = useMemo(() => {
    const source = displayOverview?.revenueDeals || []
    if (revenueView === '12m') return source.slice(-12)
    if (revenueView === 'year') return source
    return source.slice(-6)
  }, [displayOverview, revenueView])

  const leadSources = displayOverview?.leadSources || []
  const leadTotal = leadSources.reduce((sum, item) => sum + Number(item.value || 0), 0)
  const salesFunnel = displayOverview?.salesFunnel || []
  const support = displayOverview?.supportSummary || {}
  const activities = displayOverview?.recentActivities || []
  const insights = displayOverview?.aiInsights || []
  const systemHealth = displayStatsMeta?.systemHealth || {}

  const revenueGrowth = calcGrowth(
    revenueDeals[revenueDeals.length - 1]?.revenue || 0,
    revenueDeals[revenueDeals.length - 2]?.revenue || 0
  )

  const cards = useMemo(
    () => [
      { title: 'Total Companies', value: String(displayOverview?.stats?.totalCompanies ?? 0), trend: `${displayOverview?.stats?.activeCompanies ?? 0} active companies`, icon: Building2, trendTone: 'info' },
      { title: 'Active Users', value: String(displayOverview?.stats?.activeUsers ?? 0), trend: `${displayOverview?.stats?.totalUsers ?? 0} total users`, icon: Users, trendTone: 'success' },
      { title: 'Active Subscriptions', value: String(displayOverview?.stats?.activeSubscriptions ?? 0), trend: `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth.toFixed(1)}% this period`, icon: Receipt, trendTone: revenueGrowth >= 0 ? 'success' : 'danger' },
      { title: 'Monthly Revenue', value: formatCurrency(displayOverview?.stats?.monthlyRevenue ?? 0), trend: `${formatCompact(displayOverview?.stats?.monthlyRevenue ?? 0)} booked`, icon: BarChart3, trendTone: 'success' },
      { title: 'Support Tickets', value: String(support.totalTickets ?? 0), trend: `${support.openTickets ?? 0} open · ${support.pendingTickets ?? 0} pending`, icon: LifeBuoy, trendTone: 'warning' },
      { title: 'System Health', value: displayOverview?.stats?.systemHealth ?? 'Unknown', trend: `${systemHealth.uptime || 'N/A'} uptime`, icon: ShieldCheck, trendTone: 'success' }
    ],
    [displayOverview, support, revenueGrowth, systemHealth]
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
      ['System Health', stats.systemHealth ?? 'Unknown'],
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
    { name: 'Open', value: Number(support.openTickets || 0) },
    { name: 'Pending', value: Number(support.pendingTickets || 0) },
    { name: 'Resolved', value: Number(support.resolvedTickets || 0) }
  ]
  const hasTicketData = supportChartData.some((item) => Number(item.value || 0) > 0)
  const ticketChartDisplayData = hasTicketData ? supportChartData : demoTicketDistribution
  const leadRadarData = leadSources.map((entry) => ({ source: entry.source, value: Number(entry.value || 0) }))
  const revenueTrendDisplayData = hasMeaningfulRevenueData
    ? revenueDeals.map((item) => ({ month: item.month, revenue: Number(item.revenue || 0) }))
    : demoRevenueTrendData

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
                <div key={item.month} className="revenue-bar-item" title={`${item.month}: ${formatCurrency(item.revenue)} · Deals ${item.deals}`}>
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
                      <span>{item.count} · {pct}%</span>
                    </div>
                    <div className="funnel-track"><span style={{ width: `${Math.max(pct, 4)}%` }} /></div>
                    <small>Conversion: {conv}%</small>
                  </div>
                )
              })}
            </div>
          )}
        </article>

        <article className="panel ai-insights-card">
          <div className="panel-head">
            <h3><Sparkles size={16} /> AI Insights</h3>
            <Button variant="ghost">View Recommendations</Button>
          </div>
          {loading ? <LoadingSkeleton rows={4} /> : insights.length === 0 ? <EmptyState title="No AI insights yet" description="Insights will populate once enough activity and revenue data is available." /> : (
            <div className="insights-list">
              {insights.map((item) => (
                <div key={item.title} className={`insight-tile ${item.severity || 'info'}`}>
                  <h4>{item.title}</h4>
                  <p>{item.message}</p>
                </div>
              ))}
            </div>
          )}
        </article>
      </div>

      <div className="dashboard-main-grid">
        <article className="panel support-summary-card">
          <div className="panel-head"><h3>Support Ticket Summary</h3></div>
          {loading ? <LoadingSkeleton rows={3} /> : (
            <div className="support-grid">
              <div className="support-item open"><strong>Open</strong><span>{support.openTickets ?? 0}</span></div>
              <div className="support-item pending"><strong>Pending</strong><span>{support.pendingTickets ?? 0}</span></div>
              <div className="support-item resolved"><strong>Resolved</strong><span>{support.resolvedTickets ?? 0}</span></div>
              <div className="support-item critical"><strong>Critical</strong><span>{Math.max((support.openTickets || 0) - (support.resolvedTickets || 0), 0)}</span></div>
            </div>
          )}
        </article>

        <article className="panel system-health-card">
          <div className="panel-head"><h3>System Health</h3></div>
          {loading ? <LoadingSkeleton rows={4} /> : (
            <div className="health-list">
              <div><Server size={15} /><span>API</span><strong>{systemHealth.apiStatus || 'Operational'}</strong></div>
              <div><Database size={15} /><span>Database</span><strong>{systemHealth.databaseStatus || 'Operational'}</strong></div>
              <div><HardDrive size={15} /><span>Storage</span><strong>{systemHealth.storageStatus || 'Operational'}</strong></div>
              <div><Activity size={15} /><span>Queue/Jobs</span><strong>Operational</strong></div>
              <div><Mail size={15} /><span>Email/SMS</span><strong>Operational</strong></div>
              <div><ShieldCheck size={15} /><span>Uptime</span><strong>{systemHealth.uptime || '99.9%'}</strong></div>
            </div>
          )}
        </article>
      </div>

      <div className="dashboard-main-grid">
        <article className="panel">
          <div className="panel-head"><h3>Revenue Trend Area</h3></div>
          {loading ? <LoadingSkeleton rows={4} /> : (
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrendDisplayData}>
                  <defs>
                    <linearGradient id="revFillGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.7} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.08} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
                  <XAxis dataKey="month" tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${Math.round(Number(v || 0) / 1000000)}M`} />
                  <Tooltip
                    contentStyle={{ background: 'var(--panel-tint)', border: '1px solid var(--line)', borderRadius: 10 }}
                    labelStyle={{ color: 'var(--text)' }}
                    itemStyle={{ color: 'var(--text)' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#a78bfa" fill="url(#revFillGrad)" strokeWidth={2.5} />
                </AreaChart>
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
        <div className="panel-head"><h3>Lead Source Radar</h3></div>
        {loading || leadRadarData.length === 0 ? <LoadingSkeleton rows={4} /> : (
          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={leadRadarData} outerRadius="76%">
                <PolarGrid stroke="rgba(255,255,255,0.16)" />
                <PolarAngleAxis dataKey="source" tick={{ fill: 'var(--text)', fontSize: 13 }} />
                <PolarRadiusAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} />
                <Radar dataKey="value" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.35} />
                <Tooltip
                  contentStyle={{ background: 'var(--panel-tint)', border: '1px solid var(--line)', borderRadius: 10 }}
                  labelStyle={{ color: 'var(--text)' }}
                  itemStyle={{ color: 'var(--text)' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </article>

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
                  <small>{timeAgo(item.createdAt)} · {item.type}</small>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  )
}

export default DashboardPage
