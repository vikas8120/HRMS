import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import SearchBar from '../../components/ui/SearchBar'
import FilterDropdown from '../../components/ui/FilterDropdown'
import StatCard from '../../components/ui/StatCard'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import DataTable from '../../components/ui/DataTable'
import { getManagerTeam } from '../../api/managerTeamApi'
import {
  exportManagerReportExcel,
  exportManagerReportPdf,
  getManagerAttendanceReport,
  getManagerLeaveReport,
  getManagerPerformanceReport,
  getManagerTaskReport
} from '../../api/managerReportsApi'

const reportTypes = [
  { value: 'attendance', label: 'Attendance Report' },
  { value: 'leaves', label: 'Leave Report' },
  { value: 'tasks', label: 'Task Report' },
  { value: 'performance', label: 'Performance Report' }
]

const statusOptionsByType = {
  attendance: [{ value: 'all', label: 'All Status' }, { value: 'present', label: 'Present' }, { value: 'absent', label: 'Absent' }, { value: 'late', label: 'Late' }],
  leaves: [{ value: 'all', label: 'All Status' }, { value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }],
  tasks: [{ value: 'all', label: 'All Status' }, { value: 'pending', label: 'Pending' }, { value: 'in-progress', label: 'In Progress' }, { value: 'completed', label: 'Completed' }, { value: 'overdue', label: 'Overdue' }],
  performance: [{ value: 'all', label: 'All Status' }, { value: 'draft', label: 'Draft' }, { value: 'submitted', label: 'Submitted' }],
}

function ManagerReportsPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [availableFields, setAvailableFields] = useState([])
  const [selectedFields, setSelectedFields] = useState([])

  const [team, setTeam] = useState([])
  const [reportType, setReportType] = useState('attendance')
  const [employeeId, setEmployeeId] = useState('all')
  const [status, setStatus] = useState('all')
  const [month, setMonth] = useState('')
  const [search, setSearch] = useState('')

  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(null), 2400)
    return () => clearTimeout(timer)
  }, [toast])

  const loadTeam = async () => {
    try {
      const res = await getManagerTeam()
      setTeam(res?.data || [])
    } catch (_err) {
      setTeam([])
    }
  }

  useEffect(() => {
    loadTeam()
  }, [])

  useEffect(() => {
    setSelectedFields([])
    setAvailableFields([])
    setRows([])
  }, [reportType])

  const loadReport = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const filters = {
        employeeId,
        status,
        month
      }
      let data = []
      const fields = []

      if (reportType === 'attendance') data = (await getManagerAttendanceReport(filters))?.data || []
      if (reportType === 'leaves') data = (await getManagerLeaveReport(filters))?.data || []
      if (reportType === 'tasks') data = (await getManagerTaskReport(filters))?.data || []
      if (reportType === 'performance') data = (await getManagerPerformanceReport(filters))?.data || []

      setRows(data)
      const discovered = fields.length ? fields : Object.keys(data[0] || {})
      setAvailableFields(discovered)
      if (!selectedFields.length) setSelectedFields(discovered)
    } catch (err) {
      setRows([])
      setError(err?.response?.data?.message || err?.message || 'Failed to load report')
    } finally {
      setLoading(false)
    }
  }, [employeeId, month, reportType, selectedFields, status])

  useEffect(() => {
    loadReport()
  }, [])

  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(needle))
  }, [rows, search])

  const displayColumns = useMemo(() => {
    const keys = selectedFields.length ? selectedFields : availableFields
    return keys.map((key) => ({ key, label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()) }))
  }, [selectedFields, availableFields])

  const activeStatusReportType = reportType
  const statusOptions = statusOptionsByType[activeStatusReportType] || [{ value: 'all', label: 'All Status' }]

  const chartConfig = useMemo(() => {
    const statusKeyByType = {
      attendance: 'status',
      leaves: 'status',
      tasks: 'status',
      performance: 'status'
    }
    const dateKeyByType = {
      attendance: 'date',
      leaves: 'startDate',
      tasks: 'dueDate',
      performance: 'reviewDate'
    }
    const departmentKeyByType = {
      attendance: 'departmentId',
      leaves: 'departmentId',
      tasks: 'departmentId',
      performance: 'departmentId'
    }
    const statusKey = statusKeyByType[activeStatusReportType] || 'status'
    const dateKey = dateKeyByType[activeStatusReportType] || 'date'
    const departmentKey = departmentKeyByType[activeStatusReportType] || 'departmentId'

    const statusMap = new Map()
    const departmentMap = new Map()
    const trendMap = new Map()

    filteredRows.forEach((row) => {
      const statusVal = String(row[statusKey] || 'unknown').toLowerCase()
      statusMap.set(statusVal, (statusMap.get(statusVal) || 0) + 1)

      const departmentVal = String(row[departmentKey] || 'N/A')
      departmentMap.set(departmentVal, (departmentMap.get(departmentVal) || 0) + 1)

      const dateVal = String(row[dateKey] || '').slice(0, 10)
      if (dateVal) trendMap.set(dateVal, (trendMap.get(dateVal) || 0) + 1)
    })

    const statusColors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#14b8a6', '#a855f7']
    const statusPie = Array.from(statusMap.entries()).map(([name, value], idx) => ({
      name,
      value,
      color: statusColors[idx % statusColors.length]
    }))
    const departmentBars = Array.from(departmentMap.entries()).map(([name, value]) => ({ name, value })).slice(0, 8)
    const trendLine = Array.from(trendMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-10)
      .map(([date, count]) => ({ date, count }))

    return {
      statusPie: statusPie.length ? statusPie : [{ name: 'no-data', value: 1, color: '#cbd5e1' }],
      departmentBars: departmentBars.length ? departmentBars : [{ name: 'N/A', value: 0 }],
      trendLine: trendLine.length ? trendLine : [{ date: 'N/A', count: 0 }]
    }
  }, [filteredRows, activeStatusReportType])

  const reportInsights = useMemo(() => {
    const total = filteredRows.length
    const topStatus = chartConfig.statusPie
      .filter((item) => item.name !== 'no-data')
      .sort((a, b) => b.value - a.value)[0]
    const topDepartment = chartConfig.departmentBars
      .filter((item) => item.name !== 'N/A')
      .sort((a, b) => b.value - a.value)[0]
    return {
      total,
      topStatus: topStatus ? `${topStatus.name} (${topStatus.value})` : 'N/A',
      topDepartment: topDepartment ? `${topDepartment.name} (${topDepartment.value})` : 'N/A'
    }
  }, [filteredRows, chartConfig])

  const isLowData = filteredRows.length <= 2

  const employeeOptions = [{ value: 'all', label: 'All Team Members' }, ...team.map((x) => ({ value: String(x.employeeId), label: x.name }))]

  useEffect(() => {
    if (statusOptions.some((option) => option.value === status)) return
    setStatus('all')
  }, [status, statusOptions])

  const onReset = () => {
    setEmployeeId('all')
    setStatus('all')
    setMonth('')
    setSearch('')
    setSelectedFields([])
  }

  const downloadBlob = (blob, filename) => {
    if (!(blob instanceof Blob) || blob.size === 0) {
      throw new Error('No file data returned')
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getBlobErrorMessage = async (blob, fallback) => {
    try {
      const text = await blob.text()
      const parsed = JSON.parse(text)
      return parsed?.message || fallback
    } catch {
      return fallback
    }
  }

  const effectiveReportTypeForExport = reportType

  const onDownloadPdf = async () => {
    try {
      if (!rows.length) {
        setToast({ type: 'error', message: 'Generate report first before export' })
        return
      }
      const blob = await exportManagerReportPdf({
        reportType: effectiveReportTypeForExport,
        employeeId,
        status,
        month,
        fields: selectedFields.join(',')
      })
      if (blob.type?.includes('application/json')) {
        const message = await getBlobErrorMessage(blob, 'PDF export failed')
        setToast({ type: 'error', message })
        return
      }
      downloadBlob(blob, `manager-${effectiveReportTypeForExport}-report.pdf`)
    } catch (err) {
      setToast({ type: 'error', message: err?.message || 'PDF export failed' })
    }
  }

  const onDownloadExcel = async () => {
    try {
      if (!rows.length) {
        setToast({ type: 'error', message: 'Generate report first before export' })
        return
      }
      const blob = await exportManagerReportExcel({
        reportType: effectiveReportTypeForExport,
        employeeId,
        status,
        month,
        fields: selectedFields.join(',')
      })
      if (blob.type?.includes('application/json')) {
        const message = await getBlobErrorMessage(blob, 'Excel export failed')
        setToast({ type: 'error', message })
        return
      }
      downloadBlob(blob, `manager-${effectiveReportTypeForExport}-report.csv`)
    } catch (err) {
      setToast({ type: 'error', message: err?.message || 'Excel export failed' })
    }
  }

  return (
    <section className="section-layout manager-reports-page">
      <PageHeader
        title="Reports"
        description="Generate manager-level operational reports using real team data."
        breadcrumb={['Manager Portal', 'Reports']}
      />

      {toast ? <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>{toast.message}</div> : null}

      <div className="panel filters-panel">
        <div className="filters-row admin-filters-grid">
          <FilterDropdown label="Report type" value={reportType} onChange={setReportType} options={reportTypes} />
          <FilterDropdown label="Team Member" value={employeeId} onChange={setEmployeeId} options={employeeOptions} />
          <FilterDropdown label="Status" value={status} onChange={setStatus} options={statusOptions} />
          <MonthInput value={month} onChange={setMonth} />
          <div className="search-wrap"><label>Search</label><SearchBar value={search} onChange={setSearch} placeholder="Search report rows" /></div>
        </div>

        <div className="actions-row" style={{ marginTop: 10 }}>
          <Button onClick={loadReport}>Generate Report</Button>
          <Button variant="ghost" onClick={onDownloadPdf}><Download size={14} /> Download PDF</Button>
          <Button variant="ghost" onClick={onDownloadExcel}><Download size={14} /> Download Excel</Button>
          <Button variant="ghost" onClick={onReset}>Reset</Button>
          <Button variant="ghost" onClick={loadReport}><RefreshCw size={14} /> Refresh</Button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>{reportTypes.find((x) => x.value === reportType)?.label || 'Report'}</h3></div>
        {loading ? <LoadingSkeleton rows={7} /> : error ? <EmptyState title="Unable to generate report" description={error} /> : filteredRows.length === 0 ? (
          <EmptyState title="No report data" description="Generate report after selecting filters." />
        ) : (
          <>
            <div className="stats-grid premium-stats-grid" style={{ marginBottom: 12 }}>
              <StatCard title="Total Records" value={String(reportInsights.total)} trend="Rows in current report" />
              <StatCard title="Top Status" value={reportInsights.topStatus} trend="Most frequent status" trendTone="info" />
              <StatCard title="Top Department" value={reportInsights.topDepartment} trend="Highest row count" trendTone="info" />
            </div>

            <div className="dashboard-main-grid" style={{ marginBottom: 12 }}>
              <article className="panel dashboard-float-card">
                <div className="panel-head"><h3>Status Distribution</h3></div>
                <div style={{ height: isLowData ? 170 : 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartConfig.statusPie} dataKey="value" nameKey="name" innerRadius={46} outerRadius={82} paddingAngle={3}>
                        {chartConfig.statusPie.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'var(--panel-tint)', border: '1px solid var(--line)', borderRadius: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="report-status-legend">
                  {chartConfig.statusPie.filter((item) => item.name !== 'no-data').map((entry) => (
                    <span key={entry.name}><i style={{ background: entry.color }} /> {entry.name}: {entry.value}</span>
                  ))}
                </div>
              </article>

            </div>

            <article className="panel dashboard-float-card" style={{ marginBottom: 12 }}>
              <div className="panel-head"><h3>Report Trend</h3></div>
              <div style={{ height: isLowData ? 170 : 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartConfig.trendLine}>
                    <CartesianGrid stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
                    <XAxis dataKey="date" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'var(--panel-tint)', border: '1px solid var(--line)', borderRadius: 10 }} />
                    <Line type="monotone" dataKey="count" stroke="#22d3ee" strokeWidth={3} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </article>

            <DataTable
              columns={displayColumns}
              rows={filteredRows.map((row, idx) => ({ id: row.id || `${idx}`, ...row }))}
              showActions={false}
              emptyTitle="No rows"
              emptyDescription="No report rows found."
            />
          </>
        )}
      </div>

    </section>
  )
}

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function MonthInput({ value, onChange, disabled = false }) {
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 6 }, (_, idx) => String(currentYear - 2 + idx))
  const monthPart = value ? value.split('-')[1] : ''
  const yearPart = value ? value.split('-')[0] : ''

  const updateMonth = (nextMonth) => {
    if (!nextMonth || !yearPart) {
      onChange('')
      return
    }
    onChange(`${yearPart}-${nextMonth}`)
  }

  const updateYear = (nextYear) => {
    if (!monthPart || !nextYear) {
      onChange('')
      return
    }
    onChange(`${nextYear}-${monthPart}`)
  }

  return (
    <label className="form-input-wrap">
      <span>Month</span>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 10 }}>
        <select className="form-input" value={monthPart} onChange={(e) => updateMonth(e.target.value)} disabled={disabled}>
          <option value="">Select month</option>
          {monthNames.map((name, index) => (
            <option key={name} value={String(index + 1).padStart(2, '0')}>{name}</option>
          ))}
        </select>
        <select className="form-input" value={yearPart} onChange={(e) => updateYear(e.target.value)} disabled={disabled}>
          <option value="">Year</option>
          {yearOptions.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>
    </label>
  )
}

export default ManagerReportsPage
