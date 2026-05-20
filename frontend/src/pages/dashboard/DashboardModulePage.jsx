import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import DataTable from '../../components/ui/DataTable'
import StatCard from '../../components/ui/StatCard'
import SearchBar from '../../components/ui/SearchBar'
import FilterDropdown from '../../components/ui/FilterDropdown'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import FormInput from '../../components/ui/FormInput'
import { formatDate, formatDateTime } from '../../utils/dateFormat'
import {
  deleteActivity,
  getActiveSubscriptions,
  getActiveUsers,
  getMonthlyRevenue,
  getOverview,
  getSupportTicketSummary,
  getSystemHealth,
  getTotalCompanies,
  listActivities,
  runHealthCheck
} from '../../api/dashboardApi'

const toCsv = (rows) => rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
const exportCsv = (filename, rows) => {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function DashboardModulePage({ type, title }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [payload, setPayload] = useState(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [priority, setPriority] = useState('all')
  const [severity, setSeverity] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [selected, setSelected] = useState(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      let res
      if (type === 'platform-overview') res = await getOverview()
      if (type === 'total-companies') res = await getTotalCompanies({ search, status })
      if (type === 'active-users') res = await getActiveUsers({ search, status })
      if (type === 'active-subscriptions') res = await getActiveSubscriptions({ status })
      if (type === 'monthly-revenue') res = await getMonthlyRevenue({ from: fromDate || undefined, to: toDate || undefined })
      if (type === 'support-ticket-summary') res = await getSupportTicketSummary({ status, priority })
      if (type === 'system-health-status') res = await getSystemHealth()
      if (type === 'recent-activities') res = await listActivities({ search, severity, page, limit })
      setPayload(res?.data || null)
    } catch (err) {
      setError(err?.response?.data?.message || `Failed to load ${title} data`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, search, status, priority, severity, page, fromDate, toDate])

  const cards = useMemo(() => {
    if (!payload) return []
    if (type === 'platform-overview') {
      return [
        ['Total Companies', payload.totalCompanies],
        ['Active Users', payload.activeUsers],
        ['Active Subscriptions', payload.activeSubscriptions],
        ['Monthly Revenue', payload.monthlyRevenue],
        ['Open Tickets', payload.openTickets],
        ['System Health', payload.systemHealthStatus]
      ]
    }
    if (type === 'total-companies') return [['Total', payload.total], ['Active', payload.active], ['Inactive', payload.inactive], ['Suspended', payload.suspended], ['Trial', payload.trial], ['Expired', payload.expired]]
    if (type === 'active-users') return [['Total Users', payload.total], ['Active Today', payload.activeToday], ['Active This Week', payload.activeThisWeek], ['Active This Month', payload.activeThisMonth], ['Inactive', payload.inactive], ['Blocked', payload.blocked]]
    if (type === 'active-subscriptions') return [['Total', payload.total], ['Active', payload.active], ['Trial', payload.trial], ['Expired', payload.expired], ['Cancelled', payload.cancelled], ['Expiring Soon', payload.expiringSoon]]
    if (type === 'monthly-revenue') return [['Current Month Revenue', payload.currentMonthRevenue], ['Previous Month Revenue', payload.previousMonthRevenue], ['Growth %', Number(payload.growthPercentage || 0).toFixed(2)], ['Paid Invoices', payload.paidInvoices], ['Unpaid Invoices', payload.unpaidInvoices], ['Failed Payments', payload.failedPayments]]
    if (type === 'support-ticket-summary') return [['Total', payload.totalTickets], ['Open', payload.openTickets], ['In Progress', payload.inProgressTickets], ['Escalated', payload.escalatedTickets], ['Resolved', payload.resolvedTickets], ['Closed', payload.closedTickets], ['Critical', payload.criticalTickets]]
    if (type === 'system-health-status') return [['API Status', payload.apiStatus], ['Database Status', payload.databaseStatus], ['Storage Status', payload.storageStatus], ['Uptime', payload.uptime], ['Last Checked', payload.lastCheckedAt ? formatDateTime(payload.lastCheckedAt) : '-']]
    return []
  }, [payload, type])

  const tableConfig = useMemo(() => {
    if (!payload) return { columns: [], rows: [] }
    if (type === 'platform-overview') return { columns: [{ key: 'id', label: 'ID' }, { key: 'actor', label: 'Actor' }, { key: 'action', label: 'Action' }, { key: 'module', label: 'Module' }, { key: 'severity', label: 'Severity' }, { key: 'time', label: 'Time' }], rows: (payload.recentActivities || []).map((a) => ({ ...a, time: a.time ? formatDateTime(a.time) : '-' })) }
    if (type === 'total-companies') return { columns: [{ key: 'companyName', label: 'Company Name' }, { key: 'code', label: 'Code' }, { key: 'industry', label: 'Industry' }, { key: 'status', label: 'Status' }, { key: 'createdAt', label: 'Created Date' }], rows: (payload.items || []).map((r) => ({ ...r, createdAt: r.createdAt ? formatDate(r.createdAt) : '-' })) }
    if (type === 'active-users') return { columns: [{ key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'role', label: 'Role' }, { key: 'company', label: 'Company' }, { key: 'status', label: 'Status' }, { key: 'lastLogin', label: 'Last Login' }], rows: (payload.items || []).map((r) => ({ ...r, lastLogin: r.lastLogin ? formatDateTime(r.lastLogin) : '-' })) }
    if (type === 'active-subscriptions') return { columns: [{ key: 'company', label: 'Company' }, { key: 'plan', label: 'Plan' }, { key: 'status', label: 'Status' }, { key: 'startDate', label: 'Start Date' }, { key: 'endDate', label: 'End Date' }, { key: 'autoRenew', label: 'Auto Renew' }], rows: (payload.items || []).map((r) => ({ ...r, startDate: r.startDate ? formatDate(r.startDate) : '-', endDate: r.endDate ? formatDate(r.endDate) : '-', autoRenew: r.autoRenew ? 'Yes' : 'No' })) }
    if (type === 'monthly-revenue') return { columns: [{ key: 'invoiceNo', label: 'Invoice No' }, { key: 'company', label: 'Company' }, { key: 'amount', label: 'Amount' }, { key: 'status', label: 'Status' }, { key: 'date', label: 'Date' }], rows: (payload.items || []).map((r) => ({ ...r, amount: Number(r.amount || 0).toFixed(2), date: r.date ? formatDate(r.date) : '-' })) }
    if (type === 'support-ticket-summary') return { columns: [{ key: 'ticketId', label: 'Ticket ID' }, { key: 'subject', label: 'Subject' }, { key: 'company', label: 'Company' }, { key: 'priority', label: 'Priority' }, { key: 'status', label: 'Status' }, { key: 'createdAt', label: 'Created Date' }], rows: (payload.items || []).map((r) => ({ ...r, createdAt: r.createdAt ? formatDate(r.createdAt) : '-' })) }
    if (type === 'system-health-status') return { columns: [{ key: 'status', label: 'Status' }, { key: 'apiStatus', label: 'API Status' }, { key: 'databaseStatus', label: 'Database Status' }, { key: 'storageStatus', label: 'Storage Status' }, { key: 'uptime', label: 'Uptime' }, { key: 'createdAt', label: 'Checked At' }], rows: (payload.logs || []).map((r) => ({ ...r, createdAt: r.createdAt ? formatDateTime(r.createdAt) : '-' })) }
    if (type === 'recent-activities') return { columns: [{ key: 'id', label: 'ID' }, { key: 'actor', label: 'Actor' }, { key: 'actorRole', label: 'Role' }, { key: 'module', label: 'Module' }, { key: 'action', label: 'Action' }, { key: 'description', label: 'Description' }, { key: 'severity', label: 'Severity' }, { key: 'time', label: 'Time' }], rows: (payload.items || []).map((r) => ({ ...r, time: r.time ? formatDateTime(r.time) : '-' })) }
    return { columns: [], rows: [] }
  }, [payload, type])

  const onExport = () => exportCsv(`${type}-${Date.now()}.csv`, [tableConfig.columns.map((c) => c.label), ...tableConfig.rows.map((r) => tableConfig.columns.map((c) => r[c.key]))])
  const onDelete = async () => {
    if (!selected) return
    await deleteActivity(selected.id)
    setConfirmOpen(false)
    setSelected(null)
    await load()
  }
  const onRunHealth = async () => {
    await runHealthCheck()
    await load()
  }

  return (
    <section className="section-layout">
      <PageHeader title={title} description={`${title} dashboard data`} breadcrumb={['Super Admin', 'Dashboard', title]} primaryActionLabel="Export CSV" onPrimaryAction={onExport} />
      {error ? <div className="toast toast-error">{error}</div> : null}

      <div className="panel filters-panel">
        <div className="filters-row">
          {(type === 'total-companies' || type === 'active-users' || type === 'recent-activities') ? <div className="search-wrap"><label>Search</label><SearchBar value={search} onChange={setSearch} placeholder={`Search ${title}`} /></div> : null}
          {(type === 'total-companies' || type === 'active-users' || type === 'active-subscriptions' || type === 'support-ticket-summary') ? <FilterDropdown label="Status" value={status} onChange={setStatus} options={[{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'suspended', label: 'Suspended' }, { value: 'trial', label: 'Trial' }, { value: 'expired', label: 'Expired' }, { value: 'cancelled', label: 'Cancelled' }, { value: 'open', label: 'Open' }, { value: 'in_progress', label: 'In Progress' }, { value: 'resolved', label: 'Resolved' }, { value: 'closed', label: 'Closed' }]} /> : null}
          {type === 'support-ticket-summary' ? <FilterDropdown label="Priority" value={priority} onChange={setPriority} options={[{ value: 'all', label: 'All' }, { value: 'critical', label: 'Critical' }, { value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]} /> : null}
          {type === 'recent-activities' ? <FilterDropdown label="Severity" value={severity} onChange={setSeverity} options={[{ value: 'all', label: 'All' }, { value: 'critical', label: 'Critical' }, { value: 'warning', label: 'Warning' }, { value: 'info', label: 'Info' }, { value: 'success', label: 'Success' }]} /> : null}
          {type === 'monthly-revenue' ? <><FormInput label="From" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} /><FormInput label="To" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} /></> : null}
          <Button variant="ghost" onClick={load}>Refresh</Button>
          {type === 'system-health-status' ? <Button onClick={onRunHealth}>Run Health Check</Button> : null}
        </div>
      </div>

      {loading ? <LoadingSkeleton rows={8} /> : cards.length ? <div className="stats-grid">{cards.map((item) => <StatCard key={item[0]} title={item[0]} value={String(item[1] ?? 0)} trend="Live from database" />)}</div> : null}

      <div className="panel">
        <div className="panel-head"><h3>{title}</h3></div>
        {loading ? <LoadingSkeleton rows={8} /> : tableConfig.rows.length === 0 ? <EmptyState title="No data found" description="No records available for current filters." /> : <DataTable columns={tableConfig.columns} rows={tableConfig.rows} onView={(row) => { setSelected(row); setViewOpen(true) }} onDelete={type === 'recent-activities' ? (row) => { setSelected(row); setConfirmOpen(true) } : undefined} />}
        {type === 'recent-activities' && payload?.pagination ? <div className="pagination-row"><Button variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button><span>Page {payload.pagination.page} of {payload.pagination.totalPages}</span><Button variant="ghost" disabled={payload.pagination.page >= payload.pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button></div> : null}
      </div>

      <Modal open={viewOpen} title="Activity Details" onClose={() => setViewOpen(false)}>
        {selected ? <div className="modal-form">{Object.keys(selected).map((key) => <div key={key}><strong>{key}:</strong> {String(selected[key] ?? '-')}</div>)}</div> : null}
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Activity"
        message={`Are you sure you want to delete ${selected?.id || 'this activity'}?`}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={onDelete}
      />
    </section>
  )
}

export default DashboardModulePage
