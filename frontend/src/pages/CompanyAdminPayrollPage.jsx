import { useEffect, useMemo, useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import FilterDropdown from '../components/ui/FilterDropdown'
import FormInput from '../components/ui/FormInput'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'
import EmptyState from '../components/ui/EmptyState'
import StatCard from '../components/ui/StatCard'
import {
  generatePayroll,
  getPayrollList,
  getPayrollById,
  updatePayroll,
  getPayslipBlob,
  getDepartments,
  getEmployees
} from '../api/adminPayrollApi'

const initialEdit = {
  basicSalary: '',
  hra: '',
  allowances: '',
  bonus: '',
  deductions: '',
  tax: '',
  status: 'generated'
}

const monthOptions = Array.from({ length: 12 }, (_, i) => {
  const val = String(i + 1).padStart(2, '0')
  return { value: val, label: val }
})

const statusOptions = [
  { value: 'all', label: 'All' },
  { value: 'generated', label: 'Generated' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' }
]

function CompanyAdminPayrollPage() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')

  const [month, setMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'))
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [employeeFilter, setEmployeeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const [departments, setDepartments] = useState([])
  const [employees, setEmployees] = useState([])

  const [editOpen, setEditOpen] = useState(false)
  const [payslipOpen, setPayslipOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [editForm, setEditForm] = useState(initialEdit)
  const [payslipDetails, setPayslipDetails] = useState(null)

  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(null), 2800)
    return () => clearTimeout(t)
  }, [toast])

  const deptMap = useMemo(() => Object.fromEntries(departments.map((d) => [String(d.id || d._id), d.name || 'Department'])), [departments])

  const loadMeta = async () => {
    try {
      const [deptRes, empRes] = await Promise.all([
        getDepartments({ status: 'all' }),
        getEmployees({ status: 'all', limit: 500 })
      ])
      setDepartments(deptRes?.data || [])
      setEmployees(empRes?.data || [])
    } catch (_err) {
      setDepartments([])
      setEmployees([])
    }
  }

  const loadPayroll = async ({ keepLoading = false } = {}) => {
    if (!keepLoading) setLoading(true)
    setError('')
    try {
      const res = await getPayrollList({
        month,
        year,
        employeeId: employeeFilter,
        departmentId: departmentFilter
      })
      setRows(res?.data || [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load payroll')
      setRows([])
    } finally {
      if (!keepLoading) setLoading(false)
    }
  }

  useEffect(() => {
    loadMeta()
    loadPayroll()
  }, [])

  const filteredRows = useMemo(() => {
    if (statusFilter === 'all') return rows
    return rows.filter((row) => String(row.status || '').toLowerCase() === statusFilter)
  }, [rows, statusFilter])

  const cards = useMemo(() => {
    const total = filteredRows.length
    const paid = filteredRows.filter((row) => row.status === 'paid').length
    const pending = filteredRows.filter((row) => row.status === 'pending').length
    const net = filteredRows.reduce((sum, row) => sum + Number(row.netSalary || 0), 0)
    return [
      { title: 'Payroll Records', value: String(total), trend: `${month}/${year}` },
      { title: 'Paid', value: String(paid), trend: `${pending} pending` },
      { title: 'Pending', value: String(pending), trend: 'Need payout action' },
      { title: 'Total Net Salary', value: net.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }), trend: 'Selected filters' }
    ]
  }, [filteredRows, month, year])

  const onGenerate = async () => {
    setSubmitting(true)
    try {
      const payload = {
        month,
        year: Number(year),
        employeeId: employeeFilter !== 'all' ? employeeFilter : undefined,
        status: 'generated'
      }
      await generatePayroll(payload)
      await loadPayroll({ keepLoading: true })
      setToast({ type: 'success', message: 'Payroll generated successfully' })
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Payroll generation failed' })
    } finally {
      setSubmitting(false)
    }
  }

  const openEdit = (row) => {
    setSelected(row)
    setEditForm({
      basicSalary: String(row.basicSalary ?? ''),
      hra: String(row.hra ?? ''),
      allowances: String(row.allowances ?? ''),
      bonus: String(row.bonus ?? ''),
      deductions: String(row.deductions ?? ''),
      tax: String(row.tax ?? ''),
      status: row.status || 'generated'
    })
    setEditOpen(true)
  }

  const submitEdit = async (event) => {
    event.preventDefault()
    if (!selected?.id) return

    setSubmitting(true)
    try {
      const payload = {
        basicSalary: Number(editForm.basicSalary || 0),
        hra: Number(editForm.hra || 0),
        allowances: Number(editForm.allowances || 0),
        bonus: Number(editForm.bonus || 0),
        deductions: Number(editForm.deductions || 0),
        tax: Number(editForm.tax || 0),
        status: editForm.status
      }
      const res = await updatePayroll(selected.id, payload)
      const updated = res?.data
      setRows((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      setEditOpen(false)
      setSelected(null)
      setToast({ type: 'success', message: 'Payroll updated successfully' })
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Payroll update failed' })
    } finally {
      setSubmitting(false)
    }
  }

  const markPaid = async (row) => {
    try {
      const res = await updatePayroll(row.id, { status: 'paid' })
      const updated = res?.data
      setRows((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      setToast({ type: 'success', message: 'Marked as paid' })
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to mark paid' })
    }
  }

  const openPayslip = async (row) => {
    setSelected(row)
    setPayslipDetails(null)
    setPayslipOpen(true)
    try {
      const res = await getPayrollById(row.id)
      setPayslipDetails(res?.data || null)
    } catch (_err) {
      setPayslipDetails(null)
    }
  }

  const downloadPayslip = async (row) => {
    try {
      const blob = await getPayslipBlob(row.id)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `payslip-${row.employeeId || row.id}-${row.month}-${row.year}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      setToast({ type: 'success', message: 'Payslip downloaded successfully' })
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to download payslip' })
    }
  }

  return (
    <section className="section-layout">
      <PageHeader
        title="Payroll"
        description="Generate, review, and finalize payroll records with payslip access."
        breadcrumb={['Company Admin', 'Payroll']}
        primaryActionLabel="Generate Payroll"
        onPrimaryAction={onGenerate}
      />

      {toast ? <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>{toast.message}</div> : null}

      <div className="stats-grid">
        {cards.map((card) => <StatCard key={card.title} title={card.title} value={card.value} trend={card.trend} />)}
      </div>

      <div className="panel filters-panel">
        <div className="filters-row admin-filters-grid">
          <FilterDropdown label="Month" value={month} onChange={setMonth} options={monthOptions} />
          <FormInput label="Year" value={year} onChange={(e) => setYear(e.target.value)} placeholder="YYYY" />
          <FilterDropdown
            label="Department"
            value={departmentFilter}
            onChange={setDepartmentFilter}
            options={[{ value: 'all', label: 'All Departments' }, ...departments.map((d) => ({ value: String(d.id || d._id), label: d.name || 'Department' }))]}
          />
          <FilterDropdown
            label="Employee"
            value={employeeFilter}
            onChange={setEmployeeFilter}
            options={[{ value: 'all', label: 'All Employees' }, ...employees.map((e) => ({ value: String(e.employeeId || e.id || e._id), label: `${e.name} (${e.employeeId || e.id || e._id})` }))]}
          />
          <FilterDropdown label="Status" value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
        </div>

        <div className="actions-row" style={{ marginTop: 10 }}>
          <Button variant="ghost" onClick={() => loadPayroll()}><RefreshCw size={14} /> Refresh</Button>
          <Button onClick={onGenerate} disabled={submitting}>{submitting ? 'Generating...' : 'Generate Payroll'}</Button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Payroll Records</h3></div>
        {loading ? <LoadingSkeleton rows={8} /> : error ? (
          <EmptyState title="Unable to load payroll" description={error} />
        ) : filteredRows.length === 0 ? (
          <EmptyState title="No payroll records" description="Generate payroll to see records." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Month</th>
                  <th>Year</th>
                  <th>Basic</th>
                  <th>Net Salary</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.employeeName || row.employeeId || '-'}</td>
                    <td>{deptMap[String(row.departmentId || '')] || '-'}</td>
                    <td>{row.month}</td>
                    <td>{row.year}</td>
                    <td>{Number(row.basicSalary || 0).toLocaleString()}</td>
                    <td>{Number(row.netSalary || 0).toLocaleString()}</td>
                    <td><span className={`badge badge-${row.status}`}>{row.status}</span></td>
                    <td>
                      <div className="table-actions">
                        <button className="text-btn" onClick={() => openEdit(row)}>Edit</button>
                        <button className="text-btn" onClick={() => openPayslip(row)}>View Payslip</button>
                        <button className="text-btn" onClick={() => downloadPayslip(row)}><Download size={13} /> Download</button>
                        {row.status !== 'paid' ? <button className="text-btn" onClick={() => markPaid(row)}>Mark as Paid</button> : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={editOpen} title={`Edit Payroll - ${selected?.employeeName || selected?.employeeId || ''}`} onClose={() => { if (!submitting) setEditOpen(false) }}>
        <form className="modal-form" onSubmit={submitEdit}>
          <FormInput label="Basic Salary" type="number" value={editForm.basicSalary} onChange={(e) => setEditForm((p) => ({ ...p, basicSalary: e.target.value }))} />
          <FormInput label="HRA" type="number" value={editForm.hra} onChange={(e) => setEditForm((p) => ({ ...p, hra: e.target.value }))} />
          <FormInput label="Allowances" type="number" value={editForm.allowances} onChange={(e) => setEditForm((p) => ({ ...p, allowances: e.target.value }))} />
          <FormInput label="Bonus" type="number" value={editForm.bonus} onChange={(e) => setEditForm((p) => ({ ...p, bonus: e.target.value }))} />
          <FormInput label="Deductions" type="number" value={editForm.deductions} onChange={(e) => setEditForm((p) => ({ ...p, deductions: e.target.value }))} />
          <FormInput label="Tax" type="number" value={editForm.tax} onChange={(e) => setEditForm((p) => ({ ...p, tax: e.target.value }))} />
          <FilterDropdown label="Status" value={editForm.status} onChange={(value) => setEditForm((p) => ({ ...p, status: value }))} options={statusOptions.filter((item) => item.value !== 'all')} />
          <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Payroll'}</Button>
        </form>
      </Modal>

      <Modal open={payslipOpen} title={`Payslip Preview - ${selected?.employeeName || selected?.employeeId || ''}`} onClose={() => setPayslipOpen(false)}>
        {!payslipDetails ? <LoadingSkeleton rows={4} /> : (
          <div className="modal-form">
            <div className="inline-action-card"><strong>Employee:</strong> <span>{payslipDetails.employeeName || '-'}</span></div>
            <div className="inline-action-card"><strong>Month/Year:</strong> <span>{payslipDetails.month}/{payslipDetails.year}</span></div>
            <div className="inline-action-card"><strong>Basic Salary:</strong> <span>{payslipDetails.basicSalary}</span></div>
            <div className="inline-action-card"><strong>HRA:</strong> <span>{payslipDetails.hra}</span></div>
            <div className="inline-action-card"><strong>Allowances:</strong> <span>{payslipDetails.allowances}</span></div>
            <div className="inline-action-card"><strong>Bonus:</strong> <span>{payslipDetails.bonus}</span></div>
            <div className="inline-action-card"><strong>Deductions:</strong> <span>{payslipDetails.deductions}</span></div>
            <div className="inline-action-card"><strong>Tax:</strong> <span>{payslipDetails.tax}</span></div>
            <div className="inline-action-card"><strong>Net Salary:</strong> <span>{payslipDetails.netSalary}</span></div>
            <div className="actions-row">
              <Button onClick={() => downloadPayslip(selected)}><Download size={14} /> Download Payslip</Button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  )
}

export default CompanyAdminPayrollPage
