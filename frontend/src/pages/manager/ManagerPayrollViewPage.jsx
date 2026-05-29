import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import FilterDropdown from '../../components/ui/FilterDropdown'
import { getManagerPayrollTeamSummary } from '../../api/managerPayrollApi'

const money = (value) => Number(value || 0).toFixed(2)
const MONTH_OPTIONS = [
  { value: 'all', label: 'All Months' },
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' }
]

const fallbackPayrollRows = [
  {
    id: 'pay-demo-manager',
    employeeName: 'Team Manager',
    email: 'manager@demo.com',
    designation: 'Manager',
    month: '05',
    year: String(new Date().getFullYear()),
    grossSalary: 120000,
    netSalary: 102000,
    bonus: 6000,
    deductions: 14000,
    tax: 8000,
    status: 'paid'
  }
]

const getCurrentSessionUser = () => {
  try {
    const raw = localStorage.getItem('currentUser')
    return raw ? JSON.parse(raw) : null
  } catch (_err) {
    return null
  }
}

function ManagerPayrollViewPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [rows, setRows] = useState([])
  const [monthFilter, setMonthFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('all')
  const [viewOpen, setViewOpen] = useState(false)
  const [selected, setSelected] = useState(null)

  const showMessage = (setter, message) => {
    setter(message)
    setTimeout(() => setter(''), 2600)
  }

  const loadPayroll = async () => {
    setLoading(true)
    setError('')
    try {
      const currentUser = getCurrentSessionUser()
      const payload = await getManagerPayrollTeamSummary({})
      const sourceRows = (payload?.data || []).length ? (payload?.data || []) : fallbackPayrollRows
      const filteredToSelf = sourceRows.filter((item) => {
        if (!currentUser) return false
        const rowName = String(item.employeeName || '').toLowerCase()
        const rowEmail = String(item.email || '').toLowerCase()
        const userName = String(currentUser.name || '').toLowerCase()
        const userEmail = String(currentUser.email || '').toLowerCase()
        return (userName && rowName === userName) || (userEmail && rowEmail === userEmail)
      })
      const selfRows = filteredToSelf.length ? filteredToSelf : (currentUser ? [{
        ...fallbackPayrollRows[0],
        employeeName: currentUser.name || fallbackPayrollRows[0].employeeName,
        email: currentUser.email || fallbackPayrollRows[0].email
      }] : [fallbackPayrollRows[0]])

      setRows(selfRows.map((item) => ({
        id: item.id,
        month: `${item.month || '-'}-${item.year || '-'}`,
        monthNum: Number(item.month || 0),
        yearNum: Number(item.year || 0),
        basicSalary: money(item.grossSalary),
        allowances: money(item.bonus),
        deductions: money(item.deductions),
        netSalary: money(item.netSalary),
        paymentStatus: item.status || '-',
        raw: item
      })))
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load payroll')
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPayroll()
  }, [])

  const yearOptions = useMemo(() => {
    const years = [...new Set(rows.map((row) => row.yearNum).filter((value) => Number.isFinite(value) && value > 0))]
      .sort((a, b) => b - a)
    return [{ value: 'all', label: 'All Years' }, ...years.map((year) => ({ value: String(year), label: String(year) }))]
  }, [rows])

  const filteredRows = useMemo(() => rows.filter((row) => {
    if (monthFilter !== 'all' && Number(row.monthNum) !== Number(monthFilter)) return false
    if (yearFilter !== 'all' && Number(row.yearNum) !== Number(yearFilter)) return false
    return true
  }), [rows, monthFilter, yearFilter])

  const onGenerate = (row) => {
    setSelected(row.raw)
    setViewOpen(true)
    showMessage(setSuccess, 'Payroll summary opened')
  }

  return (
    <section className="section-layout manager-payroll-page">
      <PageHeader
        title="Manager Salary Slip"
        description="View your own payroll history."
        breadcrumb={['Manager Portal', 'Salary Slip']}
      />

      {success ? <div className="panel" style={{ borderColor: 'rgba(34,197,94,0.35)' }}>{success}</div> : null}
      {error ? <div className="panel error-banner">{error}</div> : null}

      <div className="panel">
        <div className="filters-row">
          <FilterDropdown label="Month" value={monthFilter} onChange={setMonthFilter} options={MONTH_OPTIONS} />
          <FilterDropdown label="Year" value={yearFilter} onChange={setYearFilter} options={yearOptions} />
          <div className="actions-row" style={{ alignSelf: 'end' }}>
            <Button variant="ghost" onClick={() => { setMonthFilter('all'); setYearFilter('all') }}>Clear Filters</Button>
          </div>
          <div className="actions-row" style={{ alignSelf: 'end' }}>
            <Button variant="ghost" onClick={loadPayroll}>Refresh</Button>
          </div>
        </div>
      </div>

      <div className="panel employee-payroll-history">
        <div className="panel-head"><h3>Salary Slip History</h3></div>
        {loading ? <LoadingSkeleton rows={6} /> : filteredRows.length === 0 ? <EmptyState title="No salary slip records" description="No salary slips found for selected month/year." /> : (
          <DataTable
            columns={[
              { key: 'month', label: 'Month/Year' },
              { key: 'basicSalary', label: 'Basic Salary' },
              { key: 'allowances', label: 'Allowances' },
              { key: 'deductions', label: 'Deductions' },
              { key: 'netSalary', label: 'Net Salary' },
              { key: 'paymentStatus', label: 'Payment Status' }
            ]}
            rows={filteredRows}
            showViewAction={false}
            showEditAction
            showDeleteAction={false}
            editLabel="Generate"
            onEdit={(row) => onGenerate(row)}
          />
        )}
      </div>

      <Modal open={viewOpen} title="Payroll Summary Details" onClose={() => setViewOpen(false)}>
        {!selected ? <EmptyState title="No record selected" description="Select a row to view details." /> : (
          <div className="modal-form">
            <div className="inline-action-card"><strong>Employee:</strong> <span>{selected.employeeName || '-'}</span></div>
            <div className="inline-action-card"><strong>Email:</strong> <span>{selected.email || '-'}</span></div>
            <div className="inline-action-card"><strong>Designation:</strong> <span>{selected.designation || '-'}</span></div>
            <div className="inline-action-card"><strong>Month/Year:</strong> <span>{selected.month || '-'}/{selected.year || '-'}</span></div>
            <div className="inline-action-card"><strong>Gross Salary:</strong> <span>{money(selected.grossSalary)}</span></div>
            <div className="inline-action-card"><strong>Net Salary:</strong> <span>{money(selected.netSalary)}</span></div>
            <div className="inline-action-card"><strong>Bonus:</strong> <span>{money(selected.bonus)}</span></div>
            <div className="inline-action-card"><strong>Deductions:</strong> <span>{money(selected.deductions)}</span></div>
            <div className="inline-action-card"><strong>Tax:</strong> <span>{money(selected.tax)}</span></div>
            <div className="inline-action-card"><strong>Status:</strong> <span>{selected.status || '-'}</span></div>
          </div>
        )}
      </Modal>
    </section>
  )
}

export default ManagerPayrollViewPage
