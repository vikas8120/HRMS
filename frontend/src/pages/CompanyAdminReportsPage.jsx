import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Download, RefreshCw } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import FilterDropdown from '../components/ui/FilterDropdown'
import FormInput from '../components/ui/FormInput'
import Button from '../components/ui/Button'
import StatCard from '../components/ui/StatCard'
import EmptyState from '../components/ui/EmptyState'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'
import DataTable from '../components/ui/DataTable'
import {
  getAttendanceReport,
  getDepartments,
  getDepartmentsReport,
  getEmployees,
  getEmployeesReport,
  getLeavesReport,
  getPayrollReport,
  getSummaryReport
} from '../api/adminReportsApi'

const reportOptions = [
  { value: 'summary', label: 'Summary' },
  { value: 'employees', label: 'Employees' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'leaves', label: 'Leaves' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'departments', label: 'Departments' }
]

const downloadJson = (filename, payload) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function CompanyAdminReportsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [departmentId, setDepartmentId] = useState('all')
  const [employeeId, setEmployeeId] = useState('all')
  const [status, setStatus] = useState('all')
  const [activeReport, setActiveReport] = useState('employees')

  const [departments, setDepartments] = useState([])
  const [employees, setEmployees] = useState([])

  const [summary, setSummary] = useState(null)
  const [employeesReport, setEmployeesReport] = useState([])
  const [attendanceReport, setAttendanceReport] = useState([])
  const [leavesReport, setLeavesReport] = useState([])
  const [payrollReport, setPayrollReport] = useState([])
  const [departmentsReport, setDepartmentsReport] = useState([])

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(timer)
  }, [toast])

  const query = useMemo(() => ({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    departmentId: departmentId !== 'all' ? departmentId : undefined,
    employeeId: employeeId !== 'all' ? employeeId : undefined,
    status: status !== 'all' ? status : undefined
  }), [dateFrom, dateTo, departmentId, employeeId, status])

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
      setToast({ type: 'error', message: _err?.response?.data?.message || 'Failed to load report metadata' })
    }
  }

  const loadReports = async ({ silent = false } = {}) => {
    if (dateFrom && dateTo && dateTo < dateFrom) {
      setError('Date To cannot be before Date From')
      return
    }
    if (!silent) setLoading(true)
    setError('')
    try {
      const [summaryRes, employeesRes, attendanceRes, leavesRes, payrollRes, departmentsRes] = await Promise.all([
        getSummaryReport(query),
        getEmployeesReport(query),
        getAttendanceReport(query),
        getLeavesReport(query),
        getPayrollReport(query),
        getDepartmentsReport(query)
      ])

      setSummary(summaryRes?.data || null)
      setEmployeesReport(employeesRes?.data?.records || [])
      setAttendanceReport(attendanceRes?.data?.records || [])
      setLeavesReport(leavesRes?.data?.records || [])
      setPayrollReport(payrollRes?.data?.records || [])
      setDepartmentsReport(departmentsRes?.data?.records || [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load reports')
      setSummary(null)
      setEmployeesReport([])
      setAttendanceReport([])
      setLeavesReport([])
      setPayrollReport([])
      setDepartmentsReport([])
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    loadMeta()
    loadReports()
  }, [])

  const cards = useMemo(() => ([
    { title: 'Employees', value: String(summary?.employees || 0), trend: 'Company headcount' },
    { title: 'Departments', value: String(summary?.departments || 0), trend: 'Active departments' },
    { title: 'Attendance', value: String(summary?.attendance?.total || 0), trend: `${summary?.attendance?.present || 0} present` },
    { title: 'Leaves', value: String(summary?.leaves?.total || 0), trend: `${summary?.leaves?.pending || 0} pending` },
    { title: 'Payroll Records', value: String(summary?.payroll?.total || 0), trend: `${summary?.payroll?.paid || 0} paid` },
    { title: 'Net Payout', value: Number(summary?.payroll?.netPayout || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }), trend: 'Filtered range' }
  ]), [summary])

  const attendanceChartData = useMemo(() => {
    const buckets = {}
    attendanceReport.forEach((row) => {
      const key = String(row.date || '').slice(0, 10)
      if (!key) return
      if (!buckets[key]) buckets[key] = { date: key, present: 0, absent: 0, late: 0 }
      if (row.status === 'present') buckets[key].present += 1
      if (row.status === 'absent') buckets[key].absent += 1
      if (row.status === 'late') buckets[key].late += 1
    })
    return Object.values(buckets).sort((a, b) => (a.date < b.date ? -1 : 1)).slice(-12)
  }, [attendanceReport])

  const payrollChartData = useMemo(() => {
    const buckets = {}
    payrollReport.forEach((row) => {
      const key = `${row.month}/${row.year}`
      if (!buckets[key]) buckets[key] = { period: key, netSalary: 0 }
      buckets[key].netSalary += Number(row.netSalary || 0)
    })
    return Object.values(buckets).slice(-12)
  }, [payrollReport])

  const leaveChartData = useMemo(() => ([
    { status: 'pending', count: leavesReport.filter((row) => row.status === 'pending').length },
    { status: 'approved', count: leavesReport.filter((row) => row.status === 'approved').length },
    { status: 'rejected', count: leavesReport.filter((row) => row.status === 'rejected').length }
  ]), [leavesReport])

  const activeTable = useMemo(() => {
    if (activeReport === 'attendance') {
      return {
        rows: attendanceReport.map((row) => ({ ...row, date: String(row.date || '').slice(0, 10) })),
        columns: [
          { key: 'employeeId', label: 'Employee ID' },
          { key: 'date', label: 'Date' },
          { key: 'status', label: 'Status' },
          { key: 'workingHours', label: 'Working Hours' }
        ]
      }
    }
    if (activeReport === 'summary') {
      return {
        rows: [
          { id: 'employees', metric: 'Employees', value: summary?.employees || 0 },
          { id: 'managers', metric: 'Managers', value: summary?.managers || 0 },
          { id: 'hrUsers', metric: 'HR Users', value: summary?.hrUsers || 0 },
          { id: 'departments', metric: 'Departments', value: summary?.departments || 0 },
          { id: 'attTotal', metric: 'Attendance Total', value: summary?.attendance?.total || 0 },
          { id: 'leaveTotal', metric: 'Leave Total', value: summary?.leaves?.total || 0 },
          { id: 'payrollTotal', metric: 'Payroll Total', value: summary?.payroll?.total || 0 },
          { id: 'netPayout', metric: 'Net Payout', value: summary?.payroll?.netPayout || 0 }
        ],
        columns: [
          { key: 'metric', label: 'Metric' },
          { key: 'value', label: 'Value' }
        ]
      }
    }

    if (activeReport === 'leaves') {
      return {
        rows: leavesReport.map((row) => ({
          ...row,
          startDate: String(row.startDate || '').slice(0, 10),
          endDate: String(row.endDate || '').slice(0, 10)
        })),
        columns: [
          { key: 'employeeId', label: 'Employee ID' },
          { key: 'leaveType', label: 'Type' },
          { key: 'startDate', label: 'Start Date' },
          { key: 'endDate', label: 'End Date' },
          { key: 'status', label: 'Status' }
        ]
      }
    }

    if (activeReport === 'payroll') {
      return {
        rows: payrollReport.map((row) => ({ ...row, period: `${row.month}/${row.year}` })),
        columns: [
          { key: 'employeeId', label: 'Employee ID' },
          { key: 'period', label: 'Month/Year' },
          { key: 'netSalary', label: 'Net Salary' },
          { key: 'status', label: 'Status' }
        ]
      }
    }

    if (activeReport === 'departments') {
      return {
        rows: departmentsReport,
        columns: [
          { key: 'name', label: 'Department' },
          { key: 'status', label: 'Status' },
          { key: 'employeeCount', label: 'Employees' }
        ]
      }
    }

    return {
      rows: employeesReport.map((row) => ({ ...row, joiningDate: String(row.joiningDate || '').slice(0, 10) })),
      columns: [
        { key: 'employeeId', label: 'Employee ID' },
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'status', label: 'Status' },
        { key: 'joiningDate', label: 'Joining Date' }
      ]
    }
  }, [activeReport, attendanceReport, departmentsReport, employeesReport, leavesReport, payrollReport])

  const exportCurrent = () => {
    const payloadByReport = {
      summary: summary || {},
      employees: employeesReport,
      attendance: attendanceReport,
      leaves: leavesReport,
      payroll: payrollReport,
      departments: departmentsReport
    }
    const payload = payloadByReport[activeReport]
    downloadJson(`admin-report-${activeReport}-${new Date().toISOString().slice(0, 10)}.json`, payload || [])
    setToast({ type: 'success', message: `${reportOptions.find((opt) => opt.value === activeReport)?.label || activeReport} report exported` })
  }

  const exportSummary = () => {
    downloadJson(`admin-report-summary-${new Date().toISOString().slice(0, 10)}.json`, summary || {})
    setToast({ type: 'success', message: 'Summary report exported' })
  }

  return (
    <section className="section-layout">
      <PageHeader
        title="Reports"
        description="Company-wide analytics and export-ready operational reports."
        breadcrumb={['Company Admin', 'Reports']}
        primaryActionLabel=""
      />

      {toast ? <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>{toast.message}</div> : null}

      <div className="panel filters-panel">
        <div className="filters-row admin-filters-grid">
          <FormInput label="Date From" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <FormInput label="Date To" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          <FilterDropdown
            label="Department"
            value={departmentId}
            onChange={setDepartmentId}
            options={[{ value: 'all', label: 'All Departments' }, ...departments.map((d) => ({ value: String(d.id || d._id), label: d.name || 'Department' }))]}
          />
          <FilterDropdown
            label="Employee"
            value={employeeId}
            onChange={setEmployeeId}
            options={[{ value: 'all', label: 'All Employees' }, ...employees.map((e) => ({ value: String(e.employeeId || e.id || e._id), label: `${e.name} (${e.employeeId || e.id || e._id})` }))]}
          />
          <FilterDropdown
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'present', label: 'Present' },
              { value: 'absent', label: 'Absent' },
              { value: 'late', label: 'Late' },
              { value: 'half-day', label: 'Half-day' },
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'generated', label: 'Generated' },
              { value: 'paid', label: 'Paid' }
            ]}
          />
          <FilterDropdown label="Report Type" value={activeReport} onChange={setActiveReport} options={reportOptions} />
        </div>
        <div className="actions-row" style={{ marginTop: 10 }}>
          <Button variant="ghost" onClick={() => loadReports()}><RefreshCw size={14} /> Refresh</Button>
          <Button variant="ghost" onClick={exportSummary}><Download size={14} /> Export Summary</Button>
          <Button onClick={exportCurrent}><Download size={14} /> Export Current Report</Button>
        </div>
      </div>

      <div className="stats-grid">
        {cards.map((card) => <StatCard key={card.title} title={card.title} value={card.value} trend={card.trend} />)}
      </div>

      {loading ? <LoadingSkeleton rows={8} /> : error ? (
        <div className="panel"><EmptyState title="Unable to load reports" description={error} /></div>
      ) : (
        <>
          <div className="dashboard-main-grid">
            <article className="panel">
              <div className="panel-head"><h3>Attendance Trend</h3></div>
              {attendanceChartData.length === 0 ? <EmptyState title="No attendance chart data" /> : (
                <div style={{ height: 270 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={attendanceChartData}>
                      <CartesianGrid stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
                      <XAxis dataKey="date" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: 'var(--panel-tint)', border: '1px solid var(--line)', borderRadius: 10 }} />
                      <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} />
                      <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} />
                      <Line type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </article>

            <article className="panel">
              <div className="panel-head"><h3>Payroll Trend</h3></div>
              {payrollChartData.length === 0 ? <EmptyState title="No payroll chart data" /> : (
                <div style={{ height: 270 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={payrollChartData}>
                      <CartesianGrid stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
                      <XAxis dataKey="period" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: 'var(--panel-tint)', border: '1px solid var(--line)', borderRadius: 10 }} />
                      <Bar dataKey="netSalary" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </article>
          </div>

          <article className="panel">
            <div className="panel-head"><h3>Leave Status Overview</h3></div>
            {leaveChartData.every((row) => row.count === 0) ? <EmptyState title="No leave chart data" /> : (
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leaveChartData}>
                    <CartesianGrid stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
                    <XAxis dataKey="status" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'var(--panel-tint)', border: '1px solid var(--line)', borderRadius: 10 }} />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </article>

          <article className="panel">
            <div className="panel-head">
              <h3>{reportOptions.find((item) => item.value === activeReport)?.label} Report Table</h3>
            </div>
            <DataTable
              columns={activeTable.columns}
              rows={activeTable.rows}
              showActions={false}
              emptyTitle="No report data found"
              emptyDescription="Try changing filters or date range."
            />
          </article>
        </>
      )}
    </section>
  )
}

export default CompanyAdminReportsPage
