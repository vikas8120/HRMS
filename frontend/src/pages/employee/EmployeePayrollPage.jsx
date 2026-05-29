import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import DataTable from '../../components/ui/DataTable'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import FilterDropdown from '../../components/ui/FilterDropdown'
import {
  downloadEmployeePayslipPdf,
  getEmployeePayrollHistory
} from '../../api/employeePayrollApi'

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

const normalizePeriod = (item) => {
  const monthRaw = String(item?.month ?? '')
  const yearRaw = String(item?.year ?? '')

  if (/^\d{4}-\d{1,2}$/.test(monthRaw)) {
    const [yearPart, monthPart] = monthRaw.split('-')
    const monthNum = Number(monthPart)
    const yearNum = Number(yearPart)
    return {
      monthNum: Number.isFinite(monthNum) ? monthNum : null,
      yearNum: Number.isFinite(yearNum) ? yearNum : null
    }
  }

  const monthNum = Number(monthRaw)
  const yearNum = Number(yearRaw)
  return {
    monthNum: Number.isFinite(monthNum) && monthNum > 0 ? monthNum : null,
    yearNum: Number.isFinite(yearNum) && yearNum > 0 ? yearNum : null
  }
}

function EmployeePayrollPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [history, setHistory] = useState([])
  const [monthFilter, setMonthFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('all')

  const showMessage = (setter, message) => {
    setter(message)
    setTimeout(() => setter(''), 2600)
  }

  const loadPayroll = async () => {
    setLoading(true)
    setError('')
    try {
      const historyRes = await getEmployeePayrollHistory()
      setHistory(historyRes?.data || [])
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load payroll')
      setHistory([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPayroll()
  }, [])

  const rows = history.map((item) => {
    const { monthNum, yearNum } = normalizePeriod(item)
    return ({
    id: item.id,
    month: `${item.month}/${item.year}`,
    monthNum,
    yearNum,
    basicSalary: money(item.salaryBreakdown?.basicSalary),
    allowances: money(item.salaryBreakdown?.allowances),
    deductions: money(item.salaryBreakdown?.deductions),
    netSalary: money(item.salaryBreakdown?.netSalary),
    paymentStatus: item.paymentStatus || '-',
    raw: item
    })
  })

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

  const downloadPayslip = async (row) => {
    try {
      await downloadEmployeePayslipPdf(row.id)
      showMessage(setSuccess, 'Payslip generated/download started')
    } catch (err) {
      showMessage(setError, err?.response?.data?.message || 'Failed to download payslip')
    }
  }

  return (
    <section className="section-layout">
      <PageHeader
        title="Employee Salary Slip"
        description="View your payroll history and generate/download your own payslips."
        breadcrumb={['Employee Portal', 'Salary Slip']}
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
        {loading ? <LoadingSkeleton rows={6} /> : filteredRows.length === 0 ? <EmptyState title="No salary history" description="No salary slips found for selected month/year." /> : (
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
            onEdit={(row) => downloadPayslip(row.raw)}
          />
        )}
      </div>
    </section>
  )
}

export default EmployeePayrollPage
