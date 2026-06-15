import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  BarChart3,
  Building2,
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
  Users
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
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
import { redirectToLogin } from '../utils/navigation'

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

function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [overview, setOverview] = useState(null)
  const [statsMeta, setStatsMeta] = useState(null)
  const [platformOverviewRows, setPlatformOverviewRows] = useState([])
  const [platformWidgets, setPlatformWidgets] = useState([])
  const [platformDataError, setPlatformDataError] = useState('')
  const [revenueView, setRevenueView] = useState('6m')

  const loadDashboard = async () => {
    setLoading(true)
    setError('')
    setPlatformDataError('')
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
        redirectToLogin()
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
  const support = displayOverview?.supportSummary || {}
  const activities = displayOverview?.recentActivities || []
  const systemHealth = displayStatsMeta?.systemHealth || {}

  const revenueGrowth = calcGrowth(
    revenueDeals[revenueDeals.length - 1]?.revenue || 0,
    revenueDeals[revenueDeals.length - 2]?.revenue || 0
  )

  const cards = useMemo(
    () => ([
      { title: 'Total Companies', value: String(displayOverview?.stats?.totalCompanies ?? 0), trend: `${displayOverview?.stats?.activeCompanies ?? 0} active companies`, icon: Building2, trendTone: 'info' },
      { title: 'Total Admins', value: String(displayOverview?.stats?.totalAdmins ?? 0), trend: 'Company admins', icon: CreditCard, trendTone: 'info' },
      { title: 'Active Users', value: String(displayOverview?.stats?.activeUsers ?? 0), trend: `${displayOverview?.stats?.totalUsers ?? 0} total users`, icon: Users, trendTone: 'success' },
      { title: 'Active Subscriptions', value: String(displayOverview?.stats?.activeSubscriptions ?? 0), trend: `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth.toFixed(1)}% this period`, icon: Receipt, trendTone: revenueGrowth >= 0 ? 'success' : 'danger' },
      { title: 'Monthly Revenue', value: formatCurrency(displayOverview?.stats?.monthlyRevenue ?? 0), trend: `${formatCompact(displayOverview?.stats?.monthlyRevenue ?? 0)} booked`, icon: BarChart3, trendTone: 'success' }
    ]),
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

  const topFunnel = Math.max(...salesFunnel.map((s) => Number(s.count || 0)), 1)
  const hasMeaningfulRevenueData = revenueDeals.some((r) => Number(r.revenue || 0) > 0 || Number(r.deals || 0) > 0)
  const supportChartData = [
    { name: 'Open', value: Number(support.openTickets || 0) },
    { name: 'Pending', value: Number(support.pendingTickets || 0) },
    { name: 'Resolved', value: Number(support.resolvedTickets || 0) }
  ]
  const hasTicketData = supportChartData.some((item) => Number(item.value || 0) > 0)
  const ticketChartDisplayData = hasTicketData ? supportChartData : [{ name: 'No Data', value: 1 }]
  const revenueTrendDisplayData = revenueDeals.length
    ? revenueDeals.map((item) => ({ month: item.month, revenue: Number(item.revenue || 0) }))
    : [{ month: 'No Data', revenue: 0 }]
  const primaryCards = cards
  const secondaryCards = []
  const heroSignals = [
    { label: 'Uptime', value: systemHealth.uptime || 'N/A', tone: 'blue' },
    { label: 'Growth', value: `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth.toFixed(1)}%`, tone: revenueGrowth >= 0 ? 'green' : 'orange' },
    { label: 'Open Tickets', value: String(support.openTickets ?? 0), tone: 'orange' }
  ]

  return (
    <section className="section-layout dashboard-premium">
      <section className="dashboard-hero-premium panel">
        <div className="dashboard-hero-copy">
          <p className="dashboard-hero-eyebrow">Super Admin / Dashboard</p>
          <h2>Dashboard</h2>
        </div>
        <div className="dashboard-hero-visual" aria-hidden="true">
          <span className="hero-orb orb-a" />
          <span className="hero-orb orb-b" />
          <span className="hero-orb orb-c" />
          <span className="hero-tile tile-a" />
          <span className="hero-tile tile-b" />
        </div>
      </section>

      <div className="dashboard-hero-signals" aria-label="Executive summary">
        {heroSignals.map((item) => (
          <div key={item.label} className={`hero-signal-chip ${item.tone}`}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>

      <div className="panel dashboard-header-actions">
        <div className="header-tagline">
          <h3>Platform Overview</h3>
        </div>
        <div className="actions-row">
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
        <>
          <div className="stats-grid premium-stats-grid premium-stats-grid-primary">
            {primaryCards.map((item) => <StatCard key={item.title} {...item} />)}
          </div>
          {secondaryCards.length > 0 ? (
            <div className="stats-grid premium-stats-grid premium-stats-grid-secondary">
              {secondaryCards.map((item) => <StatCard key={item.title} {...item} />)}
            </div>
          ) : null}
        </>
      )}

      <div className="dashboard-main-grid">
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
        <article className="panel revenue-trend-card">
          <div className="panel-head">
            <h3>Revenue Trend Area</h3>
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
          {loading ? <LoadingSkeleton rows={4} /> : !hasMeaningfulRevenueData ? (
            <EmptyState title="No revenue data yet" description="Revenue trends will appear after transactions are recorded." />
          ) : (
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

        <article className="panel ticket-distribution-card">
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
                      const map = { Open: '#8b5cf6', Pending: '#f59e0b', Resolved: '#10b981', 'No Data': '#64748b' }
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

      <div className="dashboard-main-grid">
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
      </div>

      <div className="dashboard-main-grid">
        <article className="panel platform-widgets-card">
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
      </div>
    </section>
  )
}

export default DashboardPage
