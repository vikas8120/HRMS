import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Download, RefreshCw } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import SearchBar from '../../components/ui/SearchBar'
import FilterDropdown from '../../components/ui/FilterDropdown'
import Button from '../../components/ui/Button'
import DataTable from '../../components/ui/DataTable'
import StatCard from '../../components/ui/StatCard'
import Modal from '../../components/ui/Modal'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import {
  getManagerAttendance,
  getManagerAttendanceAlerts,
  getManagerAttendanceReports,
  getManagerMyAttendanceToday,
  getManagerAttendanceToday,
  getManagerEmployeeAttendance,
  managerPunchInAttendance,
  managerPunchOutAttendance
} from '../../api/managerAttendanceApi'
import { getManagerTeam } from '../../api/managerTeamApi'

const tabs = ['Daily Attendance', 'Monthly Attendance', 'Employee Attendance Details', 'Attendance Alerts', 'Attendance Reports']

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toISOString().slice(0, 10)
}

const formatTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toISOString().slice(11, 16)
}

function ManagerAttendancePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const employeeIdFromQuery = searchParams.get('employeeId') || 'all'
  const [activeTab, setActiveTab] = useState('Daily Attendance')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [employeeId, setEmployeeId] = useState(employeeIdFromQuery)
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')

  const [teamEmployees, setTeamEmployees] = useState([])
  const [attendanceRows, setAttendanceRows] = useState([])
  const [cards, setCards] = useState({ presentToday: 0, absentToday: 0, lateToday: 0, halfDayToday: 0 })
  const [employeeDetailsRows, setEmployeeDetailsRows] = useState([])
  const [alertRows, setAlertRows] = useState([])
  const [reportRows, setReportRows] = useState([])

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState(null)
  const [myAttendance, setMyAttendance] = useState({ status: 'absent', checkIn: null, checkOut: null, workingHours: 0, date: new Date().toISOString().slice(0, 10) })

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(null), 2400)
    return () => clearTimeout(t)
  }, [toast])

  const loadTeamEmployees = async () => {
    try {
      const response = await getManagerTeam()
      setTeamEmployees(response?.data || [])
    } catch (_err) {
      setTeamEmployees([])
    }
  }

  const loadMyAttendance = async () => {
    try {
      const response = await getManagerMyAttendanceToday()
      setMyAttendance(response?.data || { status: 'absent', checkIn: null, checkOut: null, workingHours: 0, date: new Date().toISOString().slice(0, 10) })
    } catch (_err) {
      setMyAttendance({ status: 'absent', checkIn: null, checkOut: null, workingHours: 0, date: new Date().toISOString().slice(0, 10) })
    }
  }

  const loadData = async () => {
    setLoading(true)
    setError('')

    try {
      if (activeTab === 'Daily Attendance') {
        const [todayData, data] = await Promise.all([
          getManagerAttendanceToday({ employeeId, status }),
          getManagerAttendance({ date, employeeId, status })
        ])
        setCards(todayData?.cards || { presentToday: 0, absentToday: 0, lateToday: 0, halfDayToday: 0 })
        setAttendanceRows(data?.data || [])
      }

      if (activeTab === 'Monthly Attendance') {
        const data = await getManagerAttendance({ month, employeeId, status })
        setAttendanceRows(data?.data || [])
      }

      if (activeTab === 'Employee Attendance Details') {
        if (!employeeId || employeeId === 'all') {
          setEmployeeDetailsRows([])
        } else {
          const data = await getManagerEmployeeAttendance(employeeId, { month, status })
          setEmployeeDetailsRows(data?.data || [])
        }
      }

      if (activeTab === 'Attendance Alerts') {
        const data = await getManagerAttendanceAlerts({ month })
        setAlertRows(data?.data || [])
      }

      if (activeTab === 'Attendance Reports') {
        const data = await getManagerAttendanceReports({ month })
        setReportRows(data?.data?.employee || [])
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load attendance data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTeamEmployees()
    loadMyAttendance()
  }, [])

  useEffect(() => {
    if (employeeIdFromQuery && employeeIdFromQuery !== 'all') {
      setEmployeeId(employeeIdFromQuery)
      setActiveTab('Employee Attendance Details')
    }
  }, [employeeIdFromQuery])

  useEffect(() => {
    loadData()
  }, [activeTab, employeeId, status, date, month])

  const filteredAttendanceRows = useMemo(() => {
    const source = activeTab === 'Employee Attendance Details' ? employeeDetailsRows : attendanceRows
    const needle = search.trim().toLowerCase()
    if (!needle) return source
    return source.filter((row) => (
      String(row.employeeName || '').toLowerCase().includes(needle)
      || String(row.status || '').toLowerCase().includes(needle)
    ))
  }, [activeTab, attendanceRows, employeeDetailsRows, search])

  const filteredAlertRows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return alertRows
    return alertRows.filter((row) => (
      String(row.employeeName || '').toLowerCase().includes(needle)
      || String(row.type || '').toLowerCase().includes(needle)
    ))
  }, [alertRows, search])

  const filteredReportRows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return reportRows
    return reportRows.filter((row) => (
      String(row.employeeName || '').toLowerCase().includes(needle)
      || String(row.designation || '').toLowerCase().includes(needle)
    ))
  }, [reportRows, search])

  const onReset = () => {
    setDate(new Date().toISOString().slice(0, 10))
    setMonth(new Date().toISOString().slice(0, 7))
    setEmployeeId('all')
    setStatus('all')
    setSearch('')
  }

  const openDetails = (row) => {
    setSelectedRow(row)
    setDetailsOpen(true)
  }

  const exportExcel = (rows, fileName) => {
    const headers = Object.keys(rows[0] || {})
    const lines = rows.map((row) => headers.map((key) => row[key]))
    const csv = [headers, ...lines].map((line) => line.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${fileName}-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const exportPdf = (rows, fileName) => {
    const content = [
      fileName,
      `Generated: ${new Date().toISOString()}`,
      '',
      ...rows.map((row, idx) => `${idx + 1}. ${JSON.stringify(row)}`)
    ].join('\n')

    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${fileName}-${new Date().toISOString().slice(0, 10)}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handlePunchIn = async () => {
    try {
      const response = await managerPunchInAttendance()
      setMyAttendance(response?.data || myAttendance)
      setToast({ type: 'success', message: response?.message || 'Punch-in recorded' })
      await loadMyAttendance()
      loadData()
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Punch-in failed' })
    }
  }

  const handlePunchOut = async () => {
    try {
      const response = await managerPunchOutAttendance()
      setMyAttendance(response?.data || myAttendance)
      setToast({ type: 'success', message: response?.message || 'Punch-out recorded' })
      await loadMyAttendance()
      loadData()
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Punch-out failed' })
    }
  }

  const employeeOptions = [{ value: 'all', label: 'All Employees' }, ...teamEmployees.map((item) => ({ value: String(item.employeeId), label: item.name }))]
  const statusOptions = [{ value: 'all', label: 'All Status' }, { value: 'present', label: 'Present' }, { value: 'absent', label: 'Absent' }, { value: 'late', label: 'Late' }, { value: 'half-day', label: 'Half Day' }]

  const displayRows = filteredAttendanceRows.map((row) => ({
    ...row,
    date: formatDate(row.date),
    checkIn: formatTime(row.checkIn),
    checkOut: formatTime(row.checkOut),
    workingHours: row.workingHours ?? 0
  }))

  return (
    <section className="section-layout">
      <PageHeader
        title="Attendance"
        description="Manager attendance oversight for assigned team members."
        breadcrumb={['Manager Portal', 'Attendance']}
      />

      {toast ? <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>{toast.message}</div> : null}

      <div className="panel self-attendance-card">
        <div className="self-attendance-glow" />
        <div className="panel-head self-attendance-head">
          <div>
            <h3>My Attendance Today</h3>
            <p className="self-attendance-subtitle">Mark your own attendance before managing team logs.</p>
          </div>
          <div className="actions-row self-attendance-actions">
            <Button className="attendance-action-punch-in" onClick={handlePunchIn} disabled={Boolean(myAttendance?.checkIn)}>Punch In</Button>
            <Button className="attendance-action-punch-out" onClick={handlePunchOut} disabled={!myAttendance?.checkIn || Boolean(myAttendance?.checkOut)}>Punch Out</Button>
          </div>
        </div>
        <div className="self-attendance-grid">
          <div className="self-attendance-item"><span>Date</span><strong>{formatDate(myAttendance?.date)}</strong></div>
          <div className="self-attendance-item"><span>Status</span><strong>{myAttendance?.status || 'absent'}</strong></div>
          <div className="self-attendance-item"><span>Check-In</span><strong>{formatTime(myAttendance?.checkIn)}</strong></div>
          <div className="self-attendance-item"><span>Check-Out</span><strong>{formatTime(myAttendance?.checkOut)}</strong></div>
          <div className="self-attendance-item"><span>Working Hours</span><strong>{Number(myAttendance?.workingHours || 0).toFixed(2)}</strong></div>
        </div>
      </div>

      <div className="panel">
        <div className="workspace-nav">
          {tabs.map((tab) => (
            <button key={tab} type="button" className={`chip-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</button>
          ))}
        </div>

        <div className="filters-row admin-filters-grid" style={{ marginTop: 10 }}>
          <div className="search-wrap">
            <label>Search</label>
            <SearchBar value={search} onChange={setSearch} placeholder="Search employee or status" />
          </div>
          <FormDate label="Date" value={date} onChange={setDate} />
          <FormMonth label="Month" value={month} onChange={setMonth} />
          <FilterDropdown label="Employee" value={employeeId} onChange={setEmployeeId} options={employeeOptions} />
          <FilterDropdown label="Status" value={status} onChange={setStatus} options={statusOptions} />
        </div>

        <div className="actions-row" style={{ marginTop: 10 }}>
          <Button variant="ghost" onClick={loadData}>Filter</Button>
          <Button variant="ghost" onClick={onReset}>Reset Filter</Button>
          <Button variant="ghost" onClick={loadData}><RefreshCw size={14} /> Refresh</Button>
          <Button variant="ghost" onClick={() => setToast({ type: 'success', message: 'Report generated' })}>Generate Report</Button>
          <Button variant="ghost" onClick={() => exportPdf(activeTab === 'Attendance Alerts' ? filteredAlertRows : activeTab === 'Attendance Reports' ? filteredReportRows : displayRows, 'attendance-report')}><Download size={14} /> Download PDF</Button>
          <Button variant="ghost" onClick={() => exportExcel(activeTab === 'Attendance Alerts' ? filteredAlertRows : activeTab === 'Attendance Reports' ? filteredReportRows : displayRows, 'attendance-report')}><Download size={14} /> Download Excel</Button>
        </div>
      </div>

      {activeTab === 'Daily Attendance' ? (
        <div className="stats-grid premium-stats-grid">
          <StatCard title="Present today" value={String(cards.presentToday || 0)} trend="On-time team" />
          <StatCard title="Absent today" value={String(cards.absentToday || 0)} trend="Needs follow-up" trendTone="warning" />
          <StatCard title="Late today" value={String(cards.lateToday || 0)} trend="Late check-in" trendTone="warning" />
          <StatCard title="Half day" value={String(cards.halfDayToday || 0)} trend="Partial shifts" trendTone="info" />
        </div>
      ) : null}

      <div className="panel">
        <div className="panel-head"><h3>{activeTab}</h3></div>
        {loading ? <LoadingSkeleton rows={7} /> : error ? <EmptyState title="Unable to load attendance" description={error} /> : (
          <>
            {activeTab === 'Attendance Alerts' ? (
              <DataTable
                columns={[
                  { key: 'employeeName', label: 'Employee' },
                  { key: 'type', label: 'Alert Type' },
                  { key: 'count', label: 'Count' },
                  { key: 'severity', label: 'Severity' }
                ]}
                rows={filteredAlertRows}
                onView={(row) => openDetails(row)}
                onEdit={(row) => { navigate(`/manager/communication?employeeId=${row.employeeId}`); setToast({ type: 'success', message: 'Notify Employee opened' }) }}
                onDelete={() => setToast({ type: 'success', message: 'Marked reviewed' })}
                showViewAction
                showEditAction
                showDeleteAction
                emptyTitle="No alerts"
                emptyDescription="No attendance alerts for selected month."
              />
            ) : activeTab === 'Attendance Reports' ? (
              <DataTable
                columns={[
                  { key: 'employeeName', label: 'Employee' },
                  { key: 'designation', label: 'Designation' },
                  { key: 'present', label: 'Present' },
                  { key: 'absent', label: 'Absent' },
                  { key: 'late', label: 'Late' },
                  { key: 'halfDay', label: 'Half Day' }
                ]}
                rows={filteredReportRows}
                showActions={false}
                emptyTitle="No reports"
                emptyDescription="No attendance report data for selected month."
              />
            ) : (
              <DataTable
                columns={[
                  { key: 'employeeName', label: 'Employee' },
                  { key: 'date', label: 'Date' },
                  { key: 'checkIn', label: 'Check-in time' },
                  { key: 'checkOut', label: 'Check-out time' },
                  { key: 'workingHours', label: 'Working hours' },
                  { key: 'status', label: 'Attendance status' }
                ]}
                rows={displayRows}
                onView={(row) => openDetails(row)}
                onEdit={(row) => { navigate(`/manager/communication?employeeId=${row.employeeId}`); setToast({ type: 'success', message: 'Notify Employee opened' }) }}
                onDelete={() => setToast({ type: 'success', message: 'Marked reviewed' })}
                showViewAction
                showEditAction
                showDeleteAction
                emptyTitle="No attendance records"
                emptyDescription="No attendance data for selected filters."
              />
            )}
          </>
        )}
      </div>

      <Modal open={detailsOpen} title="Attendance Details" onClose={() => setDetailsOpen(false)}>
        {!selectedRow ? <EmptyState title="No details" description="Select a record to inspect details." /> : (
          <div className="modal-form">
            {Object.entries(selectedRow).map(([key, value]) => (
              <div key={key} className="inline-action-card"><strong>{key}:</strong> <span>{String(value ?? '-')}</span></div>
            ))}
          </div>
        )}
      </Modal>
    </section>
  )
}

function FormDate({ label, value, onChange }) {
  return (
    <label className="form-input-wrap">
      <span>{label}</span>
      <input className="form-input" type="date" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

function FormMonth({ label, value, onChange }) {
  return (
    <label className="form-input-wrap">
      <span>{label}</span>
      <input className="form-input" type="month" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

export default ManagerAttendancePage
