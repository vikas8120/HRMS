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
  managerPunchOutAttendance,
  resetManagerAttendanceToday
} from '../../api/managerAttendanceApi'
import { getManagerTeam } from '../../api/managerTeamApi'

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toISOString().slice(0, 10)
}

const formatTime = (value) => {
  if (!value) return '-'
  const raw = String(value).trim()
  if (!raw || raw === '-' || raw.toLowerCase() === 'null' || raw.toLowerCase() === 'undefined') return '-'
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(raw)) return raw.slice(0, 5)
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toISOString().slice(11, 16)
}

const hasMarkedTime = (value) => {
  if (value === null || value === undefined) return false
  const raw = String(value).trim()
  if (!raw || raw === '-' || raw.toLowerCase() === 'null' || raw.toLowerCase() === 'undefined') return false
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(raw)) return true
  const date = new Date(raw)
  return !Number.isNaN(date.getTime())
}

function ManagerAttendancePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const employeeIdFromQuery = searchParams.get('employeeId') || 'all'
  const [activeTab, setActiveTab] = useState('Daily Attendance')
  const [attendanceView, setAttendanceView] = useState('team')
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
  const [checkInModalOpen, setCheckInModalOpen] = useState(false)
  const [checkInPurpose, setCheckInPurpose] = useState('mark-attendance')
  const [submittingCheckIn, setSubmittingCheckIn] = useState(false)
  const [resettingToday, setResettingToday] = useState(false)
  const [myRegDate, setMyRegDate] = useState(new Date().toISOString().slice(0, 10))
  const [myRegType, setMyRegType] = useState('Missed Check-In')
  const [myRegReason, setMyRegReason] = useState('')

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
      const attendanceData = response?.data?.data || response?.data || {}
      setMyAttendance({
        status: attendanceData?.status || 'absent',
        checkIn: attendanceData?.checkIn ?? null,
        checkOut: attendanceData?.checkOut ?? null,
        workingHours: Number(attendanceData?.workingHours || 0),
        date: attendanceData?.date || new Date().toISOString().slice(0, 10)
      })
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
      setAttendanceView('team')
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

  const purposeLabelMap = {
    'mark-attendance': 'Mark Attendance',
    'work-from-home': 'Work From Home',
    'field-visit': 'Field Visit',
    meeting: 'Client/Team Meeting',
    other: 'Other'
  }

  const handlePunchIn = async () => {
    if (myAttendance?.checkIn) return
    setSubmittingCheckIn(true)
    try {
      const response = await managerPunchInAttendance({
        purpose: checkInPurpose,
        purposeLabel: purposeLabelMap[checkInPurpose] || purposeLabelMap['mark-attendance']
      })
      const attendanceData = response?.data?.data || response?.data || myAttendance
      setMyAttendance({
        status: attendanceData?.status || myAttendance.status || 'absent',
        checkIn: attendanceData?.checkIn ?? myAttendance.checkIn,
        checkOut: attendanceData?.checkOut ?? myAttendance.checkOut,
        workingHours: Number(attendanceData?.workingHours || myAttendance.workingHours || 0),
        date: attendanceData?.date || myAttendance.date || new Date().toISOString().slice(0, 10)
      })
      setToast({ type: 'success', message: response?.message || 'Check-in recorded' })
      setCheckInModalOpen(false)
      setCheckInPurpose('mark-attendance')
      await loadMyAttendance()
      loadData()
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Check-in failed' })
    } finally {
      setSubmittingCheckIn(false)
    }
  }

  const handlePunchOut = async () => {
    try {
      const response = await managerPunchOutAttendance()
      const attendanceData = response?.data?.data || response?.data || myAttendance
      setMyAttendance({
        status: attendanceData?.status || myAttendance.status || 'absent',
        checkIn: attendanceData?.checkIn ?? myAttendance.checkIn,
        checkOut: attendanceData?.checkOut ?? myAttendance.checkOut,
        workingHours: Number(attendanceData?.workingHours || myAttendance.workingHours || 0),
        date: attendanceData?.date || myAttendance.date || new Date().toISOString().slice(0, 10)
      })
      setToast({ type: 'success', message: response?.message || 'Check-out recorded' })
      await loadMyAttendance()
      loadData()
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Check-out failed' })
    }
  }

  const onResetToday = async () => {
    setResettingToday(true)
    try {
      const response = await resetManagerAttendanceToday()
      setToast({ type: 'success', message: response?.message || 'Today attendance reset successfully' })
      await loadMyAttendance()
      loadData()
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to reset today attendance' })
    } finally {
      setResettingToday(false)
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

  const mySummaryCards = useMemo(() => {
    const monthRows = attendanceRows.filter((row) => String(row.date || '').slice(0, 7) === month)
    const present = monthRows.filter((row) => String(row.status || '').toLowerCase() === 'present').length
    const late = monthRows.filter((row) => String(row.status || '').toLowerCase() === 'late').length
    const halfDay = monthRows.filter((row) => ['half-day', 'half day'].includes(String(row.status || '').toLowerCase())).length
    return {
      present,
      late,
      halfDay,
      totalHours: Number(monthRows.reduce((sum, row) => sum + Number(row.workingHours || 0), 0)).toFixed(2)
    }
  }, [attendanceRows, month])

  const myHistoryRows = useMemo(() => {
    if (!myAttendance?.date) return []
    return [{
      date: formatDate(myAttendance.date),
      status: myAttendance.status || 'absent',
      checkIn: formatTime(myAttendance.checkIn),
      checkOut: formatTime(myAttendance.checkOut),
      workingHours: Number(myAttendance.workingHours || 0).toFixed(2)
    }]
  }, [myAttendance])

  const checkedIn = hasMarkedTime(myAttendance?.checkIn)
  const checkedOut = hasMarkedTime(myAttendance?.checkOut)

  const submitRegularization = () => {
    setToast({ type: 'success', message: 'Attendance regularization request submitted' })
    setMyRegReason('')
  }

  return (
    <section className="section-layout">
      <PageHeader
        title={attendanceView === 'my' ? 'Employee Attendance' : 'Attendance'}
        description={attendanceView === 'my' ? 'Track your daily attendance, monthly summary, and submit regularization requests.' : 'Manager attendance oversight for assigned team members.'}
        breadcrumb={attendanceView === 'my' ? ['Employee Portal', 'Attendance'] : ['Manager Portal', 'Attendance']}
      />

      {toast ? <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>{toast.message}</div> : null}

      <div className="panel dashboard-switcher-panel">
        <div className="workspace-nav">
          <button type="button" className={`chip-btn ${attendanceView === 'my' ? 'active' : ''}`} onClick={() => setAttendanceView('my')}>My Attendance</button>
          <button type="button" className={`chip-btn ${attendanceView === 'team' ? 'active' : ''}`} onClick={() => setAttendanceView('team')}>My Team Attendance</button>
        </div>
      </div>

      {attendanceView === 'my' ? (
        <>
          <div className="panel self-attendance-card">
            <div className="self-attendance-glow" />
            <div className="panel-head self-attendance-head">
              <div>
                <h3>Today Attendance Status</h3>
              </div>
              <div className="actions-row self-attendance-actions">
                <Button variant="ghost" onClick={loadMyAttendance}><RefreshCw size={14} /> Refresh</Button>
                <Button variant="ghost" onClick={onResetToday} disabled={resettingToday}>{resettingToday ? 'Resetting...' : 'Reset Today'}</Button>
                <Button className="attendance-action-punch-in" onClick={() => setCheckInModalOpen(true)} disabled={checkedIn}>Check In</Button>
                <Button className="attendance-action-punch-out" onClick={handlePunchOut} disabled={!checkedIn || checkedOut}>Check Out</Button>
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

          <div className="stats-grid premium-stats-grid">
            <StatCard title="Present" value={String(mySummaryCards.present)} trend={`Month ${month}`} />
            <StatCard title="Late" value={String(mySummaryCards.late)} trend="Late check-ins" trendTone="warning" />
            <StatCard title="Half Day" value={String(mySummaryCards.halfDay)} trend="Short hours" trendTone="info" />
            <StatCard title="Hours Total" value={String(mySummaryCards.totalHours)} trend="Worked this month" />
          </div>

          <div className="panel">
            <div className="filters-row">
              <FormMonth label="Month" value={month} onChange={setMonth} />
              <div className="actions-row" style={{ alignSelf: 'end' }}>
                <Button variant="ghost" onClick={loadMyAttendance}><RefreshCw size={14} /> Refresh</Button>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head"><h3>Attendance History</h3></div>
            <DataTable
              columns={[
                { key: 'date', label: 'Date' },
                { key: 'status', label: 'Status' },
                { key: 'checkIn', label: 'Check-In' },
                { key: 'checkOut', label: 'Check-Out' },
                { key: 'workingHours', label: 'Working Hours' }
              ]}
              rows={myHistoryRows}
              showActions={false}
              emptyTitle="No attendance history"
              emptyDescription="Your attendance history will appear here."
            />
          </div>

          <div className="panel">
            <div className="panel-head"><h3>Attendance Regularization Request</h3></div>
            <div className="modal-form">
              <FormDate label="Date" value={myRegDate} onChange={setMyRegDate} />
              <FilterDropdown
                label="Request Type"
                value={myRegType}
                onChange={setMyRegType}
                options={[{ value: 'Missed Check-In', label: 'Missed Check-In' }, { value: 'Missed Check-Out', label: 'Missed Check-Out' }, { value: 'Wrong Shift', label: 'Wrong Shift' }]}
              />
              <label className="form-input-wrap">
                <span>Reason</span>
                <textarea className="form-input" rows={4} value={myRegReason} onChange={(e) => setMyRegReason(e.target.value)} />
              </label>
              <div className="actions-row">
                <Button onClick={submitRegularization}>Submit Request</Button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="panel">
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
        </>
      )}

      <Modal open={detailsOpen} title="Attendance Details" onClose={() => setDetailsOpen(false)}>
        {!selectedRow ? <EmptyState title="No details" description="Select a record to inspect details." /> : (
          <div className="modal-form">
            {Object.entries(selectedRow).map(([key, value]) => (
              <div key={key} className="inline-action-card"><strong>{key}:</strong> <span>{String(value ?? '-')}</span></div>
            ))}
          </div>
        )}
      </Modal>

      <Modal open={checkInModalOpen} title="Select Check-In Purpose" onClose={() => !submittingCheckIn && setCheckInModalOpen(false)}>
        <div className="modal-form">
          <FilterDropdown
            label="Purpose"
            value={checkInPurpose}
            onChange={setCheckInPurpose}
            options={[
              { value: 'mark-attendance', label: 'Mark Attendance' },
              { value: 'work-from-home', label: 'Work From Home' },
              { value: 'field-visit', label: 'Field Visit' },
              { value: 'meeting', label: 'Client/Team Meeting' },
              { value: 'other', label: 'Other' }
            ]}
          />
          <div className="actions-row">
            <Button variant="ghost" onClick={() => setCheckInModalOpen(false)} disabled={submittingCheckIn}>Cancel</Button>
            <Button onClick={handlePunchIn} disabled={submittingCheckIn}>{submittingCheckIn ? 'Checking In...' : 'Confirm Check-In'}</Button>
          </div>
        </div>
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
