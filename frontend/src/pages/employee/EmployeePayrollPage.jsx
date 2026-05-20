import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import StatCard from '../../components/ui/StatCard'
import {
  downloadEmployeePayslipPdf,
  getEmployeeLatestPayslip,
  getEmployeePayrollById,
  getEmployeePayrollHistory
} from '../../api/employeePayrollApi'

const money = (value) => Number(value || 0).toFixed(2)

function EmployeePayrollPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [latest, setLatest] = useState(null)
  const [history, setHistory] = useState([])

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [selected, setSelected] = useState(null)

  const showMessage = (setter, message) => {
    setter(message)
    setTimeout(() => setter(''), 2600)
  }

  const loadPayroll = async () => {
    setLoading(true)
    setError('')
    try {
      const [historyRes, latestRes] = await Promise.all([
        getEmployeePayrollHistory(),
        getEmployeeLatestPayslip()
      ])
      setHistory(historyRes?.data || [])
      setLatest(latestRes?.data || null)
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load payroll')
      setHistory([])
      setLatest(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPayroll()
  }, [])

  const stats = useMemo(() => {
    const breakdown = latest?.salaryBreakdown || {}
    return [
      { title: 'Basic Salary', value: money(breakdown.basicSalary), trend: 'Latest payslip' },
      { title: 'Allowances', value: money(breakdown.allowances), trend: 'Latest payslip', trendTone: 'info' },
      { title: 'Deductions', value: money(breakdown.deductions), trend: 'Latest payslip', trendTone: 'warning' },
      { title: 'Net Salary', value: money(breakdown.netSalary), trend: String(latest?.paymentStatus || '-'), trendTone: 'success' }
    ]
  }, [latest])

  const rows = history.map((item) => ({
    id: item.id,
    month: `${item.month}/${item.year}`,
    basicSalary: money(item.salaryBreakdown?.basicSalary),
    allowances: money(item.salaryBreakdown?.allowances),
    deductions: money(item.salaryBreakdown?.deductions),
    netSalary: money(item.salaryBreakdown?.netSalary),
    paymentStatus: item.paymentStatus || '-',
    raw: item
  }))

  const viewDetails = async (row) => {
    setDetailsOpen(true)
    setDetailsLoading(true)
    setSelected(null)
    try {
      const response = await getEmployeePayrollById(row.id)
      setSelected(response?.data || null)
    } catch (err) {
      showMessage(setError, err?.response?.data?.message || 'Failed to load payslip details')
      setSelected(null)
    } finally {
      setDetailsLoading(false)
    }
  }

  const downloadPayslip = async (row) => {
    try {
      await downloadEmployeePayslipPdf(row.id)
    } catch (err) {
      showMessage(setError, err?.response?.data?.message || 'Failed to download payslip')
    }
  }

  return (
    <section className="section-layout">
      <PageHeader
        title="Employee Payroll"
        description="View your salary history, latest payslip, and download monthly payslips."
        breadcrumb={['Employee Portal', 'Payroll']}
      />

      {success ? <div className="panel" style={{ borderColor: 'rgba(34,197,94,0.35)' }}>{success}</div> : null}
      {error ? <div className="panel error-banner">{error}</div> : null}

      <div className="panel">
        <div className="actions-row">
          <Button variant="ghost" onClick={loadPayroll}>Refresh</Button>
          {latest ? <Button onClick={() => downloadPayslip(latest)}>Download Latest Payslip PDF</Button> : null}
        </div>
      </div>

      {loading ? <LoadingSkeleton rows={4} /> : latest ? (
        <>
          <div className="stats-grid premium-stats-grid">
            {stats.map((item) => <StatCard key={item.title} {...item} />)}
          </div>
          <div className="panel">
            <div className="panel-head"><h3>Latest Payslip</h3></div>
            <div className="dashboard-mini-grid">
              <div className="inline-action-card"><strong>Month/Year:</strong> <span>{latest.month}/{latest.year}</span></div>
              <div className="inline-action-card"><strong>Payment Status:</strong> <span>{latest.paymentStatus || '-'}</span></div>
              {latest.attendanceSummary ? <div className="inline-action-card"><strong>Attendance:</strong> <span>{latest.attendanceSummary.attendanceDays}/{latest.attendanceSummary.workingDays}</span></div> : null}
              {latest.attendanceSummary ? <div className="inline-action-card"><strong>Attendance Deduction:</strong> <span>{money(latest.attendanceSummary.attendanceDeduction)}</span></div> : null}
            </div>
          </div>
        </>
      ) : (
        <EmptyState title="No latest payslip" description="No payroll record found for your account yet." />
      )}

      <div className="panel">
        <div className="panel-head"><h3>Salary History</h3></div>
        {loading ? <LoadingSkeleton rows={6} /> : rows.length === 0 ? <EmptyState title="No salary history" description="Your payroll history will appear here once records are generated." /> : (
          <DataTable
            columns={[
              { key: 'month', label: 'Month/Year' },
              { key: 'basicSalary', label: 'Basic Salary' },
              { key: 'allowances', label: 'Allowances' },
              { key: 'deductions', label: 'Deductions' },
              { key: 'netSalary', label: 'Net Salary' },
              { key: 'paymentStatus', label: 'Payment Status' }
            ]}
            rows={rows}
            showViewAction
            showEditAction
            showDeleteAction={false}
            editLabel="Download"
            onView={(row) => viewDetails(row.raw)}
            onEdit={(row) => downloadPayslip(row.raw)}
          />
        )}
      </div>

      <Modal open={detailsOpen} title="Payslip Details" onClose={() => setDetailsOpen(false)}>
        {detailsLoading ? <LoadingSkeleton rows={5} /> : !selected ? <EmptyState title="No details" description="Unable to load selected payslip details." /> : (
          <div className="modal-form">
            <div className="inline-action-card"><strong>Month/Year:</strong> <span>{selected.month}/{selected.year}</span></div>
            <div className="inline-action-card"><strong>Basic Salary:</strong> <span>{money(selected.salaryBreakdown?.basicSalary)}</span></div>
            <div className="inline-action-card"><strong>Allowances:</strong> <span>{money(selected.salaryBreakdown?.allowances)}</span></div>
            <div className="inline-action-card"><strong>Deductions:</strong> <span>{money(selected.salaryBreakdown?.deductions)}</span></div>
            <div className="inline-action-card"><strong>Net Salary:</strong> <span>{money(selected.salaryBreakdown?.netSalary)}</span></div>
            <div className="inline-action-card"><strong>Payment Status:</strong> <span>{selected.paymentStatus || '-'}</span></div>
            {selected.attendanceSummary ? <div className="inline-action-card"><strong>Working Days:</strong> <span>{selected.attendanceSummary.workingDays}</span></div> : null}
            {selected.attendanceSummary ? <div className="inline-action-card"><strong>Attendance Days:</strong> <span>{selected.attendanceSummary.attendanceDays}</span></div> : null}
            {selected.attendanceSummary ? <div className="inline-action-card"><strong>Attendance Deduction:</strong> <span>{money(selected.attendanceSummary.attendanceDeduction)}</span></div> : null}
          </div>
        )}
      </Modal>
    </section>
  )
}

export default EmployeePayrollPage
