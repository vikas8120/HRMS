import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import PageHeader from '../../components/ui/PageHeader'
import DataTable from '../../components/ui/DataTable'
import SearchBar from '../../components/ui/SearchBar'
import FilterDropdown from '../../components/ui/FilterDropdown'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import FormInput from '../../components/ui/FormInput'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import { fetchCompanies } from '../../api/companyManagementApi'
import { createPayment, deletePayment, listInvoices, listPayments, listSubscriptions, updatePayment } from '../../api/subscriptionBillingApi'
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

const defaultForm = { company: '', invoice: '', amount: 0, method: 'card', status: 'completed', transactionRef: '', transactionDate: '' }
const monthlyRevenuePage = 'Monthly Revenue'
const annualRevenuePage = 'Annual Revenue'
const revenueByPlanPage = 'Revenue by Plan'
const topPayingCustomersPage = 'Top Paying Customers'
const revenueModuleRoot = '/super-admin/revenue-and-analytics'
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
  const [items, setItems] = useState([])
  const [invoices, setInvoices] = useState([])
  const [companies, setCompanies] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [pagination, setPagination] = useState({ page: 1, limit: 10 })
  const [toast, setToast] = useState({ type: '', message: '' })

  const [open, setOpen] = useState(false)
  const [viewOnly, setViewOnly] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [form, setForm] = useState(defaultForm)
  const [saveBusy, setSaveBusy] = useState(false)
  const [formError, setFormError] = useState('')

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [targetId, setTargetId] = useState('')
  const activeWorkspaceGroupIndex = useMemo(() => {
    const foundIndex = revenueWorkspaceGroups.findIndex((group) =>
      group.items.some((item) => pathname === item.path || pathname.startsWith(`${item.path}/`))
    )
    return foundIndex >= 0 ? foundIndex : 0
  }, [pathname])
  const activeWorkspaceGroup = revenueWorkspaceGroups[activeWorkspaceGroupIndex] || revenueWorkspaceGroups[0]

  const notifyError = (message) => setToast({ type: 'error', message })
  const notifySuccess = (message) => setToast({ type: 'success', message })

  const load = async () => {
    setLoading(true)
    try {
      const [paymentRes, invoiceRes, companyRes, subscriptionRes] = await Promise.all([
        listPayments({ page: 1, limit: 1000, search, status }),
        listInvoices({ page: 1, limit: 500, search: '' }),
        fetchCompanies({ page: 1, limit: 500, search: '', status: 'all', plan: 'all' }),
        listSubscriptions({ page: 1, limit: 500, search: '', status: 'all' })
      ])
      setItems(paymentRes.items || [])
      setInvoices(invoiceRes.items || [])
      setCompanies(companyRes.items || [])
      setSubscriptions(subscriptionRes.items || [])
    } catch (error) {
      notifyError(error?.response?.data?.message || 'Failed to load revenue data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status])

  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }))
  }, [page, search, status])

  const enrichedRows = useMemo(
    () => {
      const companyNameById = new Map((companies || []).map((c) => [String(c._id || c.id), c.companyName]))
      const companyPlanById = new Map((companies || []).map((c) => [String(c._id || c.id), c.plan || '-']))
      const invoiceNoById = new Map((invoices || []).map((i) => [String(i._id || i.id), i.invoiceNumber || i.invoiceNo]))
      const planByCompanyId = new Map(
        (subscriptions || []).map((s) => [String(s.company?._id || s.company || ''), s.plan?.name || s.plan || '-'])
      )

      return items.map((item) => ({
        id: item._id,
        transactionRef: item.transactionRef || `TX-${String(item._id || '').slice(-6).toUpperCase()}`,
        company:
          item.company?.companyName ||
          item.companyName ||
          companyNameById.get(String(item.company || '')) ||
          item.company ||
          '-',
        invoiceNumber:
          item.invoice?.invoiceNumber ||
          item.invoiceNumber ||
          item.invoiceNo ||
          invoiceNoById.get(String(item.invoice || '')) ||
          item.invoice ||
          '-',
        amountRaw: Number(item.amount || 0),
        amount: Number(item.amount || 0).toFixed(2),
        status: item.status || 'pending',
        method: item.method || '-',
        transactionDateRaw: item.transactionDate ? new Date(item.transactionDate) : null,
        updatedAt: item.transactionDate
          ? formatDateTime(item.transactionDate)
          : item.updatedAt
            ? formatDateTime(item.updatedAt)
            : '-',
        updatedAtRaw: item.transactionDate ? new Date(item.transactionDate) : item.updatedAt ? new Date(item.updatedAt) : null,
        plan:
          item.plan?.name ||
          planByCompanyId.get(String(item.company?._id || item.company || '')) ||
          companyPlanById.get(String(item.company?._id || item.company || '')) ||
          '-'
      }))
    },
    [items, companies, invoices, subscriptions]
  )

  const viewConfig = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const isPaid = (value) => ['paid', 'completed', 'success'].includes(String(value || '').toLowerCase())

    if ((page || monthlyRevenuePage) === monthlyRevenuePage) {
      const rows = enrichedRows.filter((row) => row.updatedAtRaw && row.updatedAtRaw.getMonth() === currentMonth && row.updatedAtRaw.getFullYear() === currentYear)
      return { title: 'Monthly Revenue Records', rows, columns: revenueColumns, showActions: true, allowCreate: true, emptyTitle: 'No monthly revenue records found' }
    }

    if (page === annualRevenuePage) {
      const rows = enrichedRows.filter((row) => row.updatedAtRaw && row.updatedAtRaw.getFullYear() === currentYear)
      return { title: 'Annual Revenue Records', rows, columns: revenueColumns, showActions: true, allowCreate: true, emptyTitle: 'No annual revenue records found' }
    }

    if (page === revenueByPlanPage) {
      const grouped = new Map()
      for (const row of enrichedRows) {
        if (!row.updatedAtRaw || row.updatedAtRaw.getFullYear() !== currentYear || !isPaid(row.status)) continue
        const key = String(row.plan || '-')
        const current = grouped.get(key) || { id: key, plan: key, transactions: 0, revenue: 0 }
        current.transactions += 1
        current.revenue += row.amountRaw
        grouped.set(key, current)
      }
      const rows = [...grouped.values()].map((item) => ({ ...item, revenue: item.revenue.toFixed(2) }))
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
      const grouped = new Map()
      for (const row of enrichedRows) {
        if (!isPaid(row.status)) continue
        const key = String(row.company || '-')
        const current = grouped.get(key) || { id: key, company: key, transactions: 0, totalPaid: 0, lastPaidAtRaw: null }
        current.transactions += 1
        current.totalPaid += row.amountRaw
        if (row.updatedAtRaw && (!current.lastPaidAtRaw || row.updatedAtRaw > current.lastPaidAtRaw)) current.lastPaidAtRaw = row.updatedAtRaw
        grouped.set(key, current)
      }
      const rows = [...grouped.values()]
        .sort((a, b) => b.totalPaid - a.totalPaid)
        .map((item) => ({
          id: item.id,
          company: item.company,
          transactions: item.transactions,
          totalPaid: item.totalPaid.toFixed(2),
          lastPaidAt: item.lastPaidAtRaw ? formatDateTime(item.lastPaidAtRaw) : '-'
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

    return { title: `${page || monthlyRevenuePage} Records`, rows: enrichedRows, columns: revenueColumns, showActions: true, allowCreate: true, emptyTitle: 'No revenue records found' }
  }, [enrichedRows, page])

  const pagedRows = useMemo(() => {
    const start = (pagination.page - 1) * pagination.limit
    return viewConfig.rows.slice(start, start + pagination.limit)
  }, [viewConfig.rows, pagination.page, pagination.limit])

  const totalPages = Math.max(1, Math.ceil(viewConfig.rows.length / pagination.limit))
  const isCrudView = viewConfig.showActions

  const openCreate = () => {
    setSelectedId('')
    setForm(defaultForm)
    setFormError('')
    setViewOnly(false)
    setOpen(true)
  }

  const openView = (row) => {
    const found = items.find((item) => item._id === row.id)
    if (!found) return
    setSelectedId(found._id)
    setForm({
      company: found.company?._id || found.company || '',
      invoice: found.invoice?._id || found.invoice || '',
      amount: Number(found.amount || 0),
      method: found.method || 'card',
      status: found.status || 'pending',
      transactionRef: found.transactionRef || '',
      transactionDate: found.transactionDate ? new Date(found.transactionDate).toISOString().slice(0, 10) : ''
    })
    setFormError('')
    setViewOnly(true)
    setOpen(true)
  }

  const openEdit = (row) => {
    const found = items.find((item) => item._id === row.id)
    if (!found) return
    setSelectedId(found._id)
    setForm({
      company: found.company?._id || found.company || '',
      invoice: found.invoice?._id || found.invoice || '',
      amount: Number(found.amount || 0),
      method: found.method || 'card',
      status: found.status || 'pending',
      transactionRef: found.transactionRef || '',
      transactionDate: found.transactionDate ? new Date(found.transactionDate).toISOString().slice(0, 10) : ''
    })
    setFormError('')
    setViewOnly(false)
    setOpen(true)
  }

  const save = async () => {
    if (!form.company || Number(form.amount) <= 0) {
      setFormError('Please select company and enter amount greater than 0.')
      return notifyError('Company and valid amount are required')
    }
    try {
      setSaveBusy(true)
      setFormError('')
      const payload = {
        company: form.company,
        invoice: form.invoice || undefined,
        amount: Number(form.amount),
        method: form.method,
        status: form.status,
        transactionRef: form.transactionRef || undefined,
        transactionDate: form.transactionDate ? new Date(form.transactionDate).toISOString() : undefined
      }
      if (selectedId) {
        await updatePayment(selectedId, payload)
        notifySuccess('Revenue record updated')
      } else {
        await createPayment(payload)
        notifySuccess('Revenue record created')
      }
      setOpen(false)
      await load()
    } catch (error) {
      notifyError(error?.response?.data?.message || 'Failed to save revenue record')
      setFormError(error?.response?.data?.message || 'Failed to save revenue record')
    } finally {
      setSaveBusy(false)
    }
  }

  const remove = async () => {
    if (!targetId) return
    try {
      await deletePayment(targetId)
      notifySuccess('Revenue record deleted')
      setConfirmOpen(false)
      setTargetId('')
      await load()
    } catch (error) {
      notifyError(error?.response?.data?.message || 'Failed to delete revenue record')
    }
  }

  return (
    <section className="section-layout revenue-analytics-page">
      <PageHeader
        title="Revenue & Analytics"
        description="Live revenue records from payment transactions with real database CRUD."
        breadcrumb={['Super Admin', 'Revenue & Analytics', page || 'Monthly Revenue']}
        primaryActionLabel={viewConfig.allowCreate ? 'Add Revenue' : undefined}
        onPrimaryAction={viewConfig.allowCreate ? openCreate : undefined}
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
          {viewConfig.allowCreate ? <Button onClick={openCreate}>Add</Button> : null}
        </div>
        {loading ? (
          <LoadingSkeleton rows={8} />
        ) : viewConfig.rows.length ? (
          <>
            <DataTable
              columns={viewConfig.columns}
              rows={pagedRows}
              showActions={isCrudView}
              showViewAction={isCrudView}
              showEditAction={isCrudView}
              showDeleteAction={isCrudView}
              onView={openView}
              onEdit={openEdit}
              onDelete={(row) => {
                setTargetId(row.id)
                setConfirmOpen(true)
              }}
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

      <Modal open={open} title={viewOnly ? 'View Revenue Record' : selectedId ? 'Edit Revenue Record' : 'Add Revenue Record'} onClose={() => setOpen(false)}>
        <div className="form-grid">
          <FilterDropdown
            label="Company"
            value={form.company}
            onChange={(value) => setForm((p) => ({ ...p, company: value }))}
            disabled={viewOnly}
            options={[{ value: '', label: 'Select company' }, ...companies.map((company) => ({ value: company._id || company.id, label: company.companyName }))]}
          />
          <FilterDropdown
            label="Invoice"
            value={form.invoice}
            onChange={(value) => setForm((p) => ({ ...p, invoice: value }))}
            disabled={viewOnly}
            options={[{ value: '', label: 'Optional invoice' }, ...invoices.map((invoice) => ({ value: invoice._id, label: `${invoice.invoiceNumber} (${invoice.status})` }))]}
          />
          <FormInput label="Amount" type="number" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: Number(e.target.value) }))} disabled={viewOnly} />
          <FormInput label="Transaction Ref" value={form.transactionRef} onChange={(e) => setForm((p) => ({ ...p, transactionRef: e.target.value }))} disabled={viewOnly} />
          <FormInput label="Transaction Date" type="date" value={form.transactionDate} onChange={(e) => setForm((p) => ({ ...p, transactionDate: e.target.value }))} disabled={viewOnly} />
          <FilterDropdown
            label="Method"
            value={form.method}
            onChange={(value) => setForm((p) => ({ ...p, method: value }))}
            disabled={viewOnly}
            options={[{ value: 'card', label: 'Card' }, { value: 'bank', label: 'Bank' }, { value: 'upi', label: 'UPI' }, { value: 'wallet', label: 'Wallet' }]}
          />
          <FilterDropdown
            label="Status"
            value={form.status}
            onChange={(value) => setForm((p) => ({ ...p, status: value }))}
            disabled={viewOnly}
            options={[{ value: 'pending', label: 'Pending' }, { value: 'paid', label: 'Paid' }, { value: 'failed', label: 'Failed' }, { value: 'refunded', label: 'Refunded' }]}
          />
        </div>
        {formError ? <div className="field-error" style={{ marginTop: 8 }}>{formError}</div> : null}
        {viewOnly ? null : (
          <div className="actions-row">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saveBusy}>{saveBusy ? 'Saving...' : 'Save'}</Button>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Revenue Record"
        message="Are you sure you want to delete this revenue record?"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={remove}
      />
    </section>
  )
}

export default RevenueAnalyticsModulePage
