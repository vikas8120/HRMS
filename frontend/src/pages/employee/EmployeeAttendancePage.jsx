import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import Button from '../../components/ui/Button'
import DataTable from '../../components/ui/DataTable'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import { CalendarCheck2, CalendarClock, Clock3, FileText, RefreshCw } from 'lucide-react'
import {
  employeeCheckIn,
  employeeCheckOut,
  getEmployeeAttendanceHistory,
  getEmployeeAttendanceMonthly,
  getEmployeeAttendanceToday,
  requestEmployeeAttendanceRegularization
} from '../../api/employeeAttendanceApi'

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toISOString().slice(0, 10)
}

const formatTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toISOString().slice(11, 16)
}

function EmployeeAttendancePage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [historyView, setHistoryView] = useState('list')

  const [today, setToday] = useState(null)
  const [monthly, setMonthly] = useState(null)
  const [history, setHistory] = useState([])
  const [calendar, setCalendar] = useState({})

  const [regularizationDate, setRegularizationDate] = useState(new Date().toISOString().slice(0, 10))
  const [regularizationType, setRegularizationType] = useState('missed-check-in')
  const [regularizationReason, setRegularizationReason] = useState('')
  const [submittingRegularization, setSubmittingRegularization] = useState(false)

  const showMessage = (setter, message) => {
    setter(message)
    setTimeout(() => setter(''), 2600)
  }

  const loadAttendance = async () => {
    setLoading(true)
    setError('')
    try {
      const [todayRes, monthlyRes, historyRes] = await Promise.all([
        getEmployeeAttendanceToday(),
        getEmployeeAttendanceMonthly({ month }),
        getEmployeeAttendanceHistory({ month, view: historyView })
      ])

      setToday(todayRes?.data || null)
      setMonthly(monthlyRes?.data || null)
      setHistory(historyRes?.data?.list || [])
      setCalendar(historyRes?.data?.calendar || {})
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load attendance')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAttendance()
  }, [month, historyView])

  const onCheckIn = async () => {
    try {
      const response = await employeeCheckIn()
      showMessage(setSuccess, response?.message || 'Check-in successful')
      await loadAttendance()
    } catch (err) {
      showMessage(setError, err?.response?.data?.message || 'Check-in failed')
    }
  }

  const onCheckOut = async () => {
    try {
      const response = await employeeCheckOut()
      showMessage(setSuccess, response?.message || 'Check-out successful')
      await loadAttendance()
    } catch (err) {
      showMessage(setError, err?.response?.data?.message || 'Check-out failed')
    }
  }

  const onSubmitRegularization = async () => {
    if (!regularizationReason.trim()) {
      showMessage(setError, 'Regularization reason is required')
      return
    }

    setSubmittingRegularization(true)
    try {
      const response = await requestEmployeeAttendanceRegularization({
        date: regularizationDate,
        requestType: regularizationType,
        reason: regularizationReason
      })
      showMessage(setSuccess, response?.message || 'Regularization request submitted')
      setRegularizationReason('')
      await loadAttendance()
    } catch (err) {
      showMessage(setError, err?.response?.data?.message || 'Regularization request failed')
    } finally {
      setSubmittingRegularization(false)
    }
  }

  const cards = useMemo(() => ([
    { title: 'Present', value: String(monthly?.present ?? 0), trend: `Month ${monthly?.month || month}`, icon: CalendarCheck2, trendTone: 'success' },
    { title: 'Late', value: String(monthly?.late ?? 0), trend: 'Late check-ins', icon: Clock3, trendTone: 'warning' },
    { title: 'Half Day', value: String(monthly?.halfDay ?? 0), trend: 'Short hours', icon: CalendarClock, trendTone: 'warning' },
    { title: 'Hours Total', value: String(monthly?.workingHoursTotal ?? 0), trend: 'Worked this month', icon: FileText, trendTone: 'info' }
  ]), [monthly, month])

  const historyRows = history.map((item) => ({
    id: item.id || `${item.date}-${item.checkIn || ''}`,
    date: item.date || '-',
    status: item.status || '-',
    checkIn: formatTime(item.checkIn),
    checkOut: formatTime(item.checkOut),
    workingHours: Number(item.workingHours || 0).toFixed(2)
  }))

  const calendarRows = Object.entries(calendar)
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([date, item]) => ({
      id: date,
      date,
      status: item?.status || '-',
      checkIn: formatTime(item?.checkIn),
      checkOut: formatTime(item?.checkOut),
      workingHours: Number(item?.workingHours || 0).toFixed(2)
    }))

  return (
    <section className="section-layout">
      <PageHeader
        title="Employee Attendance"
        description="Track your daily attendance, monthly summary, and submit regularization requests."
        breadcrumb={['Employee Portal', 'Attendance']}
      />

      {success ? <div className="panel" style={{ borderColor: 'rgba(34,197,94,0.35)' }}>{success}</div> : null}
      {error ? <div className="panel error-banner">{error}</div> : null}

      <div className="panel">
        <div className="panel-head">
          <h3>Today Attendance Status</h3>
          <div className="actions-row">
            <Button variant="ghost" onClick={loadAttendance}><RefreshCw size={14} /> Refresh</Button>
            <Button onClick={onCheckIn} disabled={Boolean(today?.checkIn)}>Check-In</Button>
            <Button onClick={onCheckOut} disabled={!today?.checkIn || Boolean(today?.checkOut)}>Check-Out</Button>
          </div>
        </div>
        {loading ? <LoadingSkeleton rows={2} /> : (
          <div className="dashboard-mini-grid">
            <div className="inline-action-card"><strong>Date:</strong> <span>{today?.date || formatDate(new Date())}</span></div>
            <div className="inline-action-card"><strong>Status:</strong> <span>{today?.status || 'absent'}</span></div>
            <div className="inline-action-card"><strong>Check-In:</strong> <span>{formatTime(today?.checkIn)}</span></div>
            <div className="inline-action-card"><strong>Check-Out:</strong> <span>{formatTime(today?.checkOut)}</span></div>
            <div className="inline-action-card"><strong>Working Hours:</strong> <span>{Number(today?.workingHours || 0).toFixed(2)}</span></div>
          </div>
        )}
      </div>

      {loading ? <LoadingSkeleton rows={4} /> : (
        <div className="stats-grid premium-stats-grid">
          {cards.map((item) => <StatCard key={item.title} {...item} />)}
        </div>
      )}

      <div className="panel">
        <div className="filters-row">
          <label className="form-input-wrap">
            <span>Month</span>
            <input className="form-input" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </label>
          <label className="form-input-wrap">
            <span>View</span>
            <select className="form-input" value={historyView} onChange={(e) => setHistoryView(e.target.value)}>
              <option value="list">List</option>
              <option value="calendar">Calendar</option>
            </select>
          </label>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Attendance History</h3></div>
        {loading ? <LoadingSkeleton rows={5} /> : historyView === 'list' ? (
          historyRows.length === 0 ? <EmptyState title="No attendance history" description="No attendance records found for selected month." /> : (
            <DataTable
              columns={[
                { key: 'date', label: 'Date' },
                { key: 'status', label: 'Status' },
                { key: 'checkIn', label: 'Check-In' },
                { key: 'checkOut', label: 'Check-Out' },
                { key: 'workingHours', label: 'Working Hours' }
              ]}
              rows={historyRows}
              showActions={false}
            />
          )
        ) : (
          calendarRows.length === 0 ? <EmptyState title="No calendar data" description="No attendance records to display in calendar view." /> : (
            <DataTable
              columns={[
                { key: 'date', label: 'Date' },
                { key: 'status', label: 'Status' },
                { key: 'checkIn', label: 'Check-In' },
                { key: 'checkOut', label: 'Check-Out' },
                { key: 'workingHours', label: 'Working Hours' }
              ]}
              rows={calendarRows}
              showActions={false}
            />
          )
        )}
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Attendance Regularization Request</h3></div>
        <div className="modal-form">
          <label className="form-input-wrap">
            <span>Date</span>
            <input className="form-input" type="date" value={regularizationDate} onChange={(e) => setRegularizationDate(e.target.value)} />
          </label>
          <label className="form-input-wrap">
            <span>Request Type</span>
            <select className="form-input" value={regularizationType} onChange={(e) => setRegularizationType(e.target.value)}>
              <option value="missed-check-in">Missed Check-In</option>
              <option value="missed-check-out">Missed Check-Out</option>
              <option value="both">Both</option>
            </select>
          </label>
          <label className="form-input-wrap">
            <span>Reason</span>
            <textarea className="form-input" rows={3} value={regularizationReason} onChange={(e) => setRegularizationReason(e.target.value)} />
          </label>
          <div className="actions-row">
            <Button onClick={onSubmitRegularization} disabled={submittingRegularization}>
              {submittingRegularization ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default EmployeeAttendancePage
