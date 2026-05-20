import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, Printer, RefreshCw } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import SearchBar from '../../components/ui/SearchBar'
import FilterDropdown from '../../components/ui/FilterDropdown'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import DataTable from '../../components/ui/DataTable'
import { getManagerTeam } from '../../api/managerTeamApi'
import {
  exportManagerReportExcel,
  exportManagerReportPdf,
  getManagerAttendanceReport,
  getManagerCustomReport,
  getManagerLeaveReport,
  getManagerPerformanceReport,
  getManagerTaskReport
} from '../../api/managerReportsApi'

const reportTypes = [
  { value: 'attendance', label: 'Attendance Report' },
  { value: 'leaves', label: 'Leave Report' },
  { value: 'tasks', label: 'Task Report' },
  { value: 'performance', label: 'Performance Report' },
  { value: 'custom', label: 'Custom Report' }
]

const statusOptionsByType = {
  attendance: [{ value: 'all', label: 'All Status' }, { value: 'present', label: 'Present' }, { value: 'absent', label: 'Absent' }, { value: 'late', label: 'Late' }],
  leaves: [{ value: 'all', label: 'All Status' }, { value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }],
  tasks: [{ value: 'all', label: 'All Status' }, { value: 'pending', label: 'Pending' }, { value: 'in-progress', label: 'In Progress' }, { value: 'completed', label: 'Completed' }, { value: 'overdue', label: 'Overdue' }],
  performance: [{ value: 'all', label: 'All Status' }, { value: 'draft', label: 'Draft' }, { value: 'submitted', label: 'Submitted' }],
  custom: [{ value: 'all', label: 'All Status' }]
}

function ManagerReportsPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [availableFields, setAvailableFields] = useState([])
  const [selectedFields, setSelectedFields] = useState([])

  const [team, setTeam] = useState([])
  const [reportType, setReportType] = useState('attendance')
  const [customReportSource, setCustomReportSource] = useState('attendance')
  const [employeeId, setEmployeeId] = useState('all')
  const [departmentId, setDepartmentId] = useState('all')
  const [status, setStatus] = useState('all')
  const [dateFilterMode, setDateFilterMode] = useState('month')
  const [month, setMonth] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [search, setSearch] = useState('')
  const [fieldsOpen, setFieldsOpen] = useState(false)

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
  }, [reportType, customReportSource])

  const loadReport = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const filters = {
        employeeId,
        departmentId,
        status,
        month: dateFilterMode === 'month' ? month : '',
        from: dateFilterMode === 'range' ? from : '',
        to: dateFilterMode === 'range' ? to : ''
      }
      let data = []
      let fields = []

      if (reportType === 'attendance') data = (await getManagerAttendanceReport(filters))?.data || []
      if (reportType === 'leaves') data = (await getManagerLeaveReport(filters))?.data || []
      if (reportType === 'tasks') data = (await getManagerTaskReport(filters))?.data || []
      if (reportType === 'performance') data = (await getManagerPerformanceReport(filters))?.data || []
      if (reportType === 'custom') {
        const payload = await getManagerCustomReport({ reportType: customReportSource, fields: selectedFields, ...filters })
        data = payload?.data || []
        fields = payload?.availableFields || []
      }

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
  }, [customReportSource, dateFilterMode, departmentId, employeeId, month, reportType, selectedFields, status, to, from])

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

  const activeStatusReportType = reportType === 'custom' ? customReportSource : reportType
  const statusOptions = statusOptionsByType[activeStatusReportType] || statusOptionsByType.custom

  const filteredTeam = useMemo(
    () => (departmentId === 'all' ? team : team.filter((x) => String(x.departmentId || '') === String(departmentId))),
    [team, departmentId]
  )

  const employeeOptions = [{ value: 'all', label: 'All Employees' }, ...filteredTeam.map((x) => ({ value: String(x.employeeId), label: x.name }))]
  const departmentOptions = [{ value: 'all', label: 'All Departments' }, ...Array.from(new Set(team.map((x) => String(x.departmentId || '')).filter(Boolean))).map((x) => ({ value: x, label: x }))]

  useEffect(() => {
    if (statusOptions.some((option) => option.value === status)) return
    setStatus('all')
  }, [status, statusOptions])

  useEffect(() => {
    if (employeeId === 'all') return
    const selectedEmployee = team.find((x) => String(x.employeeId) === String(employeeId))
    if (!selectedEmployee) return
    const employeeDepartment = String(selectedEmployee.departmentId || '')
    if (employeeDepartment && departmentId !== employeeDepartment) setDepartmentId(employeeDepartment)
  }, [employeeId, team, departmentId])

  useEffect(() => {
    if (employeeId === 'all' || departmentId === 'all') return
    const existsInDepartment = team.some((x) => String(x.employeeId) === String(employeeId) && String(x.departmentId || '') === String(departmentId))
    if (!existsInDepartment) setEmployeeId('all')
  }, [departmentId, employeeId, team])

  const onReset = () => {
    setEmployeeId('all')
    setDepartmentId('all')
    setStatus('all')
    setDateFilterMode('month')
    setMonth('')
    setFrom('')
    setTo('')
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

  const effectiveReportTypeForExport = reportType === 'custom' ? customReportSource : reportType

  const onDownloadPdf = async () => {
    try {
      if (!rows.length) {
        setToast({ type: 'error', message: 'Generate report first before export' })
        return
      }
      const blob = await exportManagerReportPdf({
        reportType: effectiveReportTypeForExport,
        employeeId,
        departmentId,
        status,
        month: dateFilterMode === 'month' ? month : '',
        from: dateFilterMode === 'range' ? from : '',
        to: dateFilterMode === 'range' ? to : '',
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
        departmentId,
        status,
        month: dateFilterMode === 'month' ? month : '',
        from: dateFilterMode === 'range' ? from : '',
        to: dateFilterMode === 'range' ? to : '',
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
    <section className="section-layout">
      <PageHeader
        title="Reports"
        description="Generate manager-level operational reports using real team data."
        breadcrumb={['Manager Portal', 'Reports']}
      />

      {toast ? <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>{toast.message}</div> : null}

      <div className="panel filters-panel">
        <div className="filters-row admin-filters-grid">
          <FilterDropdown label="Report type" value={reportType} onChange={setReportType} options={reportTypes} />
          {reportType === 'custom' ? (
            <FilterDropdown
              label="Custom Source"
              value={customReportSource}
              onChange={setCustomReportSource}
              options={[
                { value: 'attendance', label: 'Attendance Report' },
                { value: 'leaves', label: 'Leave Report' },
                { value: 'tasks', label: 'Task Report' },
                { value: 'performance', label: 'Performance Report' }
              ]}
            />
          ) : null}
          <FilterDropdown label="Employee" value={employeeId} onChange={setEmployeeId} options={employeeOptions} />
          <FilterDropdown label="Department" value={departmentId} onChange={setDepartmentId} options={departmentOptions} />
          <FilterDropdown label="Status" value={status} onChange={setStatus} options={statusOptions} />
          <FilterDropdown
            label="Date Filter"
            value={dateFilterMode}
            onChange={(value) => {
              setDateFilterMode(value)
              setMonth('')
              setFrom('')
              setTo('')
            }}
            options={[
              { value: 'month', label: 'Monthly' },
              { value: 'range', label: 'Date Range' }
            ]}
          />
          {dateFilterMode === 'month' ? (
            <MonthInput value={month} onChange={setMonth} />
          ) : (
            <>
              <DateInput label="From" value={from} onChange={setFrom} />
              <DateInput label="To" value={to} onChange={setTo} />
            </>
          )}
          <div className="search-wrap"><label>Search</label><SearchBar value={search} onChange={setSearch} placeholder="Search report rows" /></div>
        </div>

        <div className="actions-row" style={{ marginTop: 10 }}>
          <Button onClick={loadReport}>Generate Report</Button>
          <Button variant="ghost" onClick={onDownloadPdf}><Download size={14} /> Download PDF</Button>
          <Button variant="ghost" onClick={onDownloadExcel}><Download size={14} /> Download Excel</Button>
          <Button variant="ghost" onClick={() => window.print()}><Printer size={14} /> Print</Button>
          <Button variant="ghost" onClick={onReset}>Reset</Button>
          <Button variant="ghost" onClick={() => setFieldsOpen(true)}>Select Fields</Button>
          <Button variant="ghost" onClick={loadReport}><RefreshCw size={14} /> Refresh</Button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>{reportTypes.find((x) => x.value === reportType)?.label || 'Report'}</h3></div>
        {loading ? <LoadingSkeleton rows={7} /> : error ? <EmptyState title="Unable to generate report" description={error} /> : filteredRows.length === 0 ? (
          <EmptyState title="No report data" description="Generate report after selecting filters." />
        ) : (
          <DataTable
            columns={displayColumns}
            rows={filteredRows.map((row, idx) => ({ id: row.id || `${idx}`, ...row }))}
            showActions={false}
            emptyTitle="No rows"
            emptyDescription="No report rows found."
          />
        )}
      </div>

      <Modal open={fieldsOpen} title="Select Fields" onClose={() => setFieldsOpen(false)}>
        <div className="modal-form">
          {(availableFields || []).map((field) => {
            const checked = selectedFields.includes(field)
            return (
              <label key={field} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedFields((prev) => [...new Set([...prev, field])])
                    else setSelectedFields((prev) => prev.filter((x) => x !== field))
                  }}
                />
                <span>{field}</span>
              </label>
            )
          })}
          <div className="actions-row">
            <Button variant="ghost" onClick={() => setSelectedFields(availableFields)}>Select All</Button>
            <Button onClick={() => setFieldsOpen(false)}>Done</Button>
          </div>
        </div>
      </Modal>
    </section>
  )
}

function DateInput({ label, value, onChange, disabled = false }) {
  return (
    <label className="form-input-wrap">
      <span>{label}</span>
      <input className="form-input" type="date" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
    </label>
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
