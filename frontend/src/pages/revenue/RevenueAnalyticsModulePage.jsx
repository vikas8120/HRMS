import { useEffect, useMemo, useState } from 'react'
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
import { createPayment, deletePayment, listInvoices, listPayments, updatePayment } from '../../api/subscriptionBillingApi'

const revenueColumns = [
  { key: 'transactionRef', label: 'Transaction Ref' },
  { key: 'company', label: 'Company' },
  { key: 'invoiceNumber', label: 'Invoice #' },
  { key: 'amount', label: 'Amount' },
  { key: 'status', label: 'Status' },
  { key: 'method', label: 'Method' },
  { key: 'updatedAt', label: 'Updated' }
]

const defaultForm = { company: '', invoice: '', amount: 0, method: 'card', status: 'pending', transactionRef: '' }

function RevenueAnalyticsModulePage({ page }) {
  const [items, setItems] = useState([])
  const [invoices, setInvoices] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 })
  const [toast, setToast] = useState({ type: '', message: '' })

  const [open, setOpen] = useState(false)
  const [viewOnly, setViewOnly] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [form, setForm] = useState(defaultForm)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [targetId, setTargetId] = useState('')

  const notifyError = (message) => setToast({ type: 'error', message })
  const notifySuccess = (message) => setToast({ type: 'success', message })

  const load = async () => {
    setLoading(true)
    try {
      const [paymentRes, invoiceRes, companyRes] = await Promise.all([
        listPayments({ page: pagination.page, limit: pagination.limit, search, status }),
        listInvoices({ page: 1, limit: 500, search: '' }),
        fetchCompanies({ page: 1, limit: 500, search: '', status: 'all', plan: 'all' })
      ])
      setItems(paymentRes.items || [])
      setPagination(paymentRes.pagination || { page: 1, limit: 10, totalPages: 1 })
      setInvoices(invoiceRes.items || [])
      setCompanies(companyRes.items || [])
    } catch (error) {
      notifyError(error?.response?.data?.message || 'Failed to load revenue data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, search, status])

  const rows = useMemo(
    () =>
      items.map((item) => ({
        id: item._id,
        transactionRef: item.transactionRef || `TX-${String(item._id || '').slice(-6).toUpperCase()}`,
        company: item.company?.companyName || '-',
        invoiceNumber: item.invoice?.invoiceNumber || '-',
        amount: Number(item.amount || 0).toFixed(2),
        status: item.status || 'pending',
        method: item.method || '-',
        updatedAt: item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '-'
      })),
    [items]
  )

  const openCreate = () => {
    setSelectedId('')
    setForm(defaultForm)
    setViewOnly(false)
    setOpen(true)
  }

  const openView = (row) => {
    const found = items.find((item) => item._id === row.id)
    if (!found) return
    setSelectedId(found._id)
    setForm({
      company: found.company?._id || '',
      invoice: found.invoice?._id || '',
      amount: Number(found.amount || 0),
      method: found.method || 'card',
      status: found.status || 'pending',
      transactionRef: found.transactionRef || ''
    })
    setViewOnly(true)
    setOpen(true)
  }

  const openEdit = (row) => {
    const found = items.find((item) => item._id === row.id)
    if (!found) return
    setSelectedId(found._id)
    setForm({
      company: found.company?._id || '',
      invoice: found.invoice?._id || '',
      amount: Number(found.amount || 0),
      method: found.method || 'card',
      status: found.status || 'pending',
      transactionRef: found.transactionRef || ''
    })
    setViewOnly(false)
    setOpen(true)
  }

  const save = async () => {
    if (!form.company || Number(form.amount) <= 0) {
      return notifyError('Company and valid amount are required')
    }
    try {
      const payload = {
        company: form.company,
        invoice: form.invoice || undefined,
        amount: Number(form.amount),
        method: form.method,
        status: form.status,
        transactionRef: form.transactionRef || undefined
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
    <section className="section-layout">
      <PageHeader
        title="Revenue & Analytics"
        description="Live revenue records from payment transactions with real database CRUD."
        breadcrumb={['Super Admin', 'Revenue & Analytics', page || 'Monthly Revenue']}
        primaryActionLabel="Add Revenue"
        onPrimaryAction={openCreate}
      />

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
              { value: 'failed', label: 'Failed' },
              { value: 'refunded', label: 'Refunded' }
            ]}
          />
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>{page || 'Monthly Revenue'} Records</h3>
          <Button onClick={openCreate}>Add</Button>
        </div>
        {loading ? (
          <LoadingSkeleton rows={8} />
        ) : rows.length ? (
          <>
            <DataTable
              columns={revenueColumns}
              rows={rows}
              onView={openView}
              onEdit={openEdit}
              onDelete={(row) => {
                setTargetId(row.id)
                setConfirmOpen(true)
              }}
            />
            <div className="pagination-row">
              <Button variant="ghost" disabled={pagination.page <= 1} onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}>Prev</Button>
              <span>Page {pagination.page} of {pagination.totalPages || 1}</span>
              <Button variant="ghost" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}>Next</Button>
            </div>
          </>
        ) : (
          <EmptyState title="No revenue records found" description="Create your first revenue transaction to begin analytics tracking." />
        )}
      </div>

      <Modal open={open} title={viewOnly ? 'View Revenue Record' : selectedId ? 'Edit Revenue Record' : 'Add Revenue Record'} onClose={() => setOpen(false)}>
        <div className="form-grid">
          <FilterDropdown
            label="Company"
            value={form.company}
            onChange={(value) => setForm((p) => ({ ...p, company: value }))}
            disabled={viewOnly}
            options={[{ value: '', label: 'Select company' }, ...companies.map((company) => ({ value: company.id || company._id, label: company.companyName }))]}
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
        {viewOnly ? null : (
          <div className="actions-row">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
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
