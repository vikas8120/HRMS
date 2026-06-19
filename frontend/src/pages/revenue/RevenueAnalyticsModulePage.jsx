import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import PageHeader from '../../components/ui/PageHeader'
import DataTable from '../../components/ui/DataTable'
import SearchBar from '../../components/ui/SearchBar'
import FilterDropdown from '../../components/ui/FilterDropdown'
import Button from '../../components/ui/Button'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import { getRevenueAnalyticsSummary, listRevenueAnalytics } from '../../api/revenueAnalyticsApi'
import { formatDateTime } from '../../utils/dateFormat'

const revenueColumns = [
  { key: 'transactionRef', label: 'Transaction Ref' },
  { key: 'company', label: 'Company' },
  { key: 'invoiceNumber', label: 'Invoice #' },
  { key: 'amount', label: 'Amount' },
  { key: 'status', label: 'Status' },
  { key: 'method', label: 'Method' },
  { key: 'updatedAt', label: 'Updated' }
]

const monthlyRevenuePage = 'Monthly Revenue'
const annualRevenuePage = 'Annual Revenue'
const revenueByPlanPage = 'Revenue by Plan'
const topPayingCustomersPage = 'Top Paying Customers'
const revenueModuleRoot = '/super-admin/revenue-and-analytics'
const revenueViewByPage = {
  [monthlyRevenuePage]: 'monthly-revenue',
  [annualRevenuePage]: 'annual-revenue',
  'mrr analytics': 'mrr-analytics',
  'arr analytics': 'arr-analytics',
  'revenue forecasting': 'revenue-forecasting',
  'renewal rate': 'renewal-rate',
  'churn analytics': 'churn-analytics',
  [revenueByPlanPage]: 'revenue-by-plan',
  [topPayingCustomersPage]: 'top-paying-customers'
}
const revenueWorkspaceGroups = [
  {
    title: 'Revenue Views',
    path: `${revenueModuleRoot}/monthly-revenue`,
    items: [
      { label: 'Monthly Revenue', path: `${revenueModuleRoot}/monthly-revenue` },
      { label: 'Annual Revenue', path: `${revenueModuleRoot}/annual-revenue` }
    ]
  },
  {
    title: 'Growth Metrics',
    path: `${revenueModuleRoot}/mrr-analytics`,
    items: [
      { label: 'MRR Analytics', path: `${revenueModuleRoot}/mrr-analytics` },
      { label: 'ARR Analytics', path: `${revenueModuleRoot}/arr-analytics` },
      { label: 'Revenue Forecasting', path: `${revenueModuleRoot}/revenue-forecasting` },
      { label: 'Renewal Rate', path: `${revenueModuleRoot}/renewal-rate` },
      { label: 'Churn Analytics', path: `${revenueModuleRoot}/churn-analytics` }
    ]
  }
]

function RevenueAnalyticsModulePage({ page }) {
  const { pathname } = useLocation()
  const [records, setRecords] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [pagination, setPagination] = useState({ page: 1, limit: 10 })
  const [toast, setToast] = useState({ type: '', message: '' })
  const activeWorkspaceGroupIndex = useMemo(() => {
    const foundIndex = revenueWorkspaceGroups.findIndex((group) =>
      group.items.some((item) => pathname === item.path || pathname.startsWith(`${item.path}/`))
    )
    return foundIndex >= 0 ? foundIndex : 0
  }, [pathname])
  const activeWorkspaceGroup = revenueWorkspaceGroups[activeWorkspaceGroupIndex] || revenueWorkspaceGroups[0]

  const notifyError = (message) => setToast({ type: 'error', message })

  const load = async () => {
    setLoading(true)
    try {
      const [recordRes, summaryRes] = await Promise.all([
        listRevenueAnalytics({
          page: 1,
          limit: 1000,
          search,
          status,
          view: revenueViewByPage[page] || revenueViewByPage[page?.toLowerCase?.()] || 'monthly-revenue'
        }),
        getRevenueAnalyticsSummary()
      ])
      setRecords(recordRes.items || [])
      setSummary(summaryRes || null)
    } catch (error) {
      notifyError(error?.response?.data?.message || 'Failed to load revenue data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, status])

  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }))
  }, [page, search, status])

  const enrichedRows = useMemo(
    () => {
      return records.map((item) => ({
        id: item._id,
        metricType: item.metricType,
        transactionRef: item.transactionRef || `TX-${String(item._id || '').slice(-6).toUpperCase()}`,
        company: item.companyName || '-',
        invoiceNumber: item.invoiceNumber || '-',
        amountRaw: Number(item.amount ?? item.metricValue ?? 0),
        amount: Number(item.amount ?? item.metricValue ?? 0).toFixed(2),
        metricValue: Number(item.metricValue ?? item.amount ?? 0),
        status: item.status || 'active',
        method: item.method || '-',
        transactionDateRaw: item.recordedAt ? new Date(item.recordedAt) : item.createdAt ? new Date(item.createdAt) : null,
        updatedAt: item.recordedAt
          ? formatDateTime(item.recordedAt)
          : item.updatedAt
            ? formatDateTime(item.updatedAt)
            : '-',
        updatedAtRaw: item.recordedAt ? new Date(item.recordedAt) : item.updatedAt ? new Date(item.updatedAt) : null,
        plan: item.planName || '-',
        periodKey: item.periodKey || '-',
        metadata: item.metadata || {}
      }))
    },
    [records]
  )

  const viewConfig = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const isPaid = (value) => ['paid', 'completed', 'success'].includes(String(value || '').toLowerCase())

    if ((page || monthlyRevenuePage) === monthlyRevenuePage) {
      const rows = enrichedRows.filter((row) => row.metricType === 'transaction' && row.updatedAtRaw && row.updatedAtRaw.getMonth() === currentMonth && row.updatedAtRaw.getFullYear() === currentYear && isPaid(row.status))
      return { title: 'Monthly Revenue Records', rows, columns: revenueColumns, showActions: false, allowCreate: false, emptyTitle: 'No monthly revenue records found' }
    }

    if (page === annualRevenuePage) {
      const rows = enrichedRows.filter((row) => row.metricType === 'transaction' && row.updatedAtRaw && row.updatedAtRaw.getFullYear() === currentYear && isPaid(row.status))
      return { title: 'Annual Revenue Records', rows, columns: revenueColumns, showActions: false, allowCreate: false, emptyTitle: 'No annual revenue records found' }
    }

    if (page === revenueByPlanPage) {
      const rows = enrichedRows
        .filter((row) => row.metricType === 'revenue_by_plan')
        .map((item) => ({
          id: item.id,
          plan: item.plan,
          transactions: Number(item.metadata?.paymentCount || 0),
          revenue: item.metricValue.toFixed(2)
        }))
      return {
        title: 'Revenue By Plan',
        rows,
        columns: [{ key: 'plan', label: 'Plan' }, { key: 'transactions', label: 'Transactions' }, { key: 'revenue', label: 'Revenue' }],
        showActions: false,
        allowCreate: false,
        emptyTitle: 'No revenue-by-plan data found'
      }
    }

    if (page === topPayingCustomersPage) {
      const rows = enrichedRows
        .filter((row) => row.metricType === 'top_paying_customer')
        .sort((a, b) => b.metricValue - a.metricValue)
        .map((item) => ({
          id: item.id,
          company: item.company,
          transactions: Number(item.metadata?.paymentCount || 0),
          totalPaid: item.metricValue.toFixed(2),
          lastPaidAt: item.updatedAtRaw ? formatDateTime(item.updatedAtRaw) : '-'
        }))
      return {
        title: 'Top Paying Customers',
        rows,
        columns: [{ key: 'company', label: 'Company' }, { key: 'transactions', label: 'Transactions' }, { key: 'totalPaid', label: 'Total Paid' }, { key: 'lastPaidAt', label: 'Last Payment' }],
        showActions: false,
        allowCreate: false,
        emptyTitle: 'No top customer data found'
      }
    }

    if (page === 'MRR Analytics' || page === 'ARR Analytics' || page === 'Revenue Forecasting' || page === 'Renewal Rate' || page === 'Churn Analytics') {
      const metricKey = {
        'MRR Analytics': 'mrr',
        'ARR Analytics': 'arr',
        'Revenue Forecasting': 'forecast',
        'Renewal Rate': 'renewal_rate',
        'Churn Analytics': 'churn_rate'
      }[page]
      const metricRecord = summary?.[metricKey === 'mrr' ? 'mrr' : metricKey === 'arr' ? 'arr' : metricKey === 'forecast' ? 'forecast' : metricKey === 'renewal_rate' ? 'renewalRate' : 'churnRate']
      const rows = metricRecord ? [{
        id: metricRecord._id,
        metric: metricKey.replace(/_/g, ' ').toUpperCase(),
        value: Number(metricRecord.metricValue ?? metricRecord.amount ?? 0).toFixed(2),
        period: metricRecord.periodKey || '-',
        updatedAt: metricRecord.recordedAt ? formatDateTime(metricRecord.recordedAt) : '-'
      }] : []
      return {
        title: `${page || monthlyRevenuePage} Snapshot`,
        rows,
        columns: [
          { key: 'metric', label: 'Metric' },
          { key: 'value', label: 'Value' },
          { key: 'period', label: 'Period' },
          { key: 'updatedAt', label: 'Updated' }
        ],
        showActions: false,
        allowCreate: false,
        emptyTitle: 'No analytics snapshot found'
      }
    }

    return { title: `${page || monthlyRevenuePage} Records`, rows: enrichedRows, columns: revenueColumns, showActions: false, allowCreate: false, emptyTitle: 'No revenue records found' }
  }, [enrichedRows, page, summary])

  const pagedRows = useMemo(() => {
    const start = (pagination.page - 1) * pagination.limit
    return viewConfig.rows.slice(start, start + pagination.limit)
  }, [viewConfig.rows, pagination.page, pagination.limit])

  const totalPages = Math.max(1, Math.ceil(viewConfig.rows.length / pagination.limit))
  return (
    <section className="section-layout revenue-analytics-page">
      <PageHeader
        title="Revenue & Analytics"
        description="Live revenue records from payment transactions."
        breadcrumb={['Super Admin', 'Revenue & Analytics', page || 'Monthly Revenue']}
      />

      <div className="workspace-nav revenue-workspace-nav" aria-label="Revenue category navigation">
        {revenueWorkspaceGroups.map((group) => (
          <NavLink
            key={group.title}
            to={group.path}
            className={({ isActive }) => `workspace-nav-chip ${isActive || activeWorkspaceGroup.title === group.title ? 'active' : ''}`}
            data-group={group.title.toLowerCase()}
          >
            {group.title.toUpperCase()}
          </NavLink>
        ))}
      </div>

      <div className="workspace-subnav revenue-workspace-subnav" aria-label="Revenue module navigation">
        {activeWorkspaceGroup.items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `workspace-nav-chip ${isActive ? 'active' : ''}`}
            data-group={activeWorkspaceGroup.title.toLowerCase()}
          >
            {item.label}
          </NavLink>
        ))}
      </div>

      {toast.message ? <div className={`toast toast-${toast.type}`}>{toast.message}</div> : null}

      <div className="panel filters-panel">
        <div className="filters-row">
          <div className="search-wrap">
            <label>Search</label>
            <SearchBar value={search} onChange={setSearch} placeholder="Search transaction ref, method, invoice..." />
          </div>
          <FilterDropdown
            label="Status Filter"
            value={status}
            onChange={setStatus}
            options={[
              { value: 'all', label: 'All' },
              { value: 'pending', label: 'Pending' },
              { value: 'paid', label: 'Paid' },
              { value: 'completed', label: 'Completed' },
              { value: 'failed', label: 'Failed' },
              { value: 'success', label: 'Success' },
              { value: 'refunded', label: 'Refunded' }
            ]}
          />
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>{viewConfig.title}</h3>
        </div>
        {loading ? (
          <LoadingSkeleton rows={8} />
        ) : viewConfig.rows.length ? (
          <>
            <DataTable
              columns={viewConfig.columns}
              rows={pagedRows}
              showActions={false}
              showViewAction={false}
              showEditAction={false}
              showDeleteAction={false}
            />
            <div className="pagination-row">
              <Button variant="ghost" disabled={pagination.page <= 1} onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}>Prev</Button>
              <span>Page {pagination.page} of {totalPages}</span>
              <Button variant="ghost" disabled={pagination.page >= totalPages} onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}>Next</Button>
            </div>
          </>
        ) : (
          <EmptyState title={viewConfig.emptyTitle} description="Try adjusting filters or add a new transaction in revenue views." />
        )}
      </div>

    </section>
  )
}

export default RevenueAnalyticsModulePage
