import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  CalendarCheck2,
  CalendarClock,
  Clock3,
  IndianRupee,
  Receipt,
  RefreshCw
} from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import StatCard from '../../components/ui/StatCard'
import { getEmployeeDashboard } from '../../api/employeeDashboardApi'

const formatMaybeTime = (value) => {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const formatCurrency = (value) => {
  const n = Number(value)
  if (!Number.isFinite(n)) return value || '-'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n)
}

function EmployeeDashboardPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)

  const loadDashboard = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await getEmployeeDashboard()
      setData(response?.data || null)
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load employee dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const attendance = data?.todayAttendanceStatus
  const monthly = data?.thisMonthAttendanceSummary
  const leaveBalance = data?.leaveBalance
  const stats = [
    {
      title: 'Today Status',
      value: String(attendance?.status || 'absent').toUpperCase(),
      trend: `Check-In ${formatMaybeTime(attendance?.checkIn)}`,
      icon: CalendarCheck2,
      trendTone: attendance?.status === 'present' ? 'success' : 'warning'
    },
    {
      title: 'Working Hours',
      value: String(attendance?.workingHours ?? 0),
      trend: `Check-Out ${formatMaybeTime(attendance?.checkOut)}`,
      icon: Clock3,
      trendTone: 'info'
    },
    {
      title: 'Pending Leaves',
      value: String(data?.pendingLeaveRequests ?? 0),
      trend: `Monthly absent ${monthly?.absent ?? 0}`,
      icon: CalendarClock,
      trendTone: 'warning'
    },
    {
      title: 'Latest Payslip',
      value: data?.latestPayslip ? `${data.latestPayslip.month}/${data.latestPayslip.year}` : 'N/A',
      trend: data?.latestPayslip ? formatCurrency(data.latestPayslip.netSalary) : 'No payslip yet',
      icon: Receipt,
      trendTone: 'info'
    }
  ]

  return (
    <section className="section-layout dashboard-premium">
      <PageHeader
        title="Employee Dashboard"
        description="Your attendance, leave balance, payroll snapshot, and company updates."
        breadcrumb={['Employee Portal', 'Dashboard']}
      />

      {error ? <div className="panel error-banner">{error}</div> : null}

      <div className="panel dashboard-header-actions">
        <div className="header-tagline">
          <h3>Employee Overview</h3>
          <p>Track daily attendance, leave, payroll, and company announcements in one place.</p>
        </div>
        <div className="actions-row">
          <Button onClick={() => navigate('/employee/attendance')}>Check Attendance</Button>
          <Button onClick={() => navigate('/employee/leaves')}>Apply Leave</Button>
          <Button onClick={() => navigate('/employee/payroll')}>View Payslip</Button>
          <Button variant="ghost" onClick={loadDashboard}><RefreshCw size={14} /> Refresh</Button>
        </div>
      </div>

      {loading ? <LoadingSkeleton rows={6} /> : <div className="stats-grid premium-stats-grid">{stats.map((item) => <StatCard key={item.title} {...item} />)}</div>}

      {loading ? null : (
        <div className="dashboard-main-grid">
          <article className="panel">
            <div className="panel-head"><h3>Today Attendance</h3></div>
            <div className="modal-form">
              <div className="inline-action-card"><strong>Status:</strong> <span>{attendance?.status || 'absent'}</span></div>
              <div className="inline-action-card"><strong>Check-In:</strong> <span>{formatMaybeTime(attendance?.checkIn)}</span></div>
              <div className="inline-action-card"><strong>Check-Out:</strong> <span>{formatMaybeTime(attendance?.checkOut)}</span></div>
              <div className="inline-action-card"><strong>Working Hours:</strong> <span>{attendance?.workingHours ?? 0}</span></div>
            </div>
          </article>

          <article className="panel">
            <div className="panel-head">
              <h3>This Month Attendance</h3>
              <span className="badge badge-info">Monthly</span>
            </div>
            <div className="modal-form">
              <div className="inline-action-card"><strong>Present:</strong> <span>{monthly?.present ?? 0}</span></div>
              <div className="inline-action-card"><strong>Absent:</strong> <span>{monthly?.absent ?? 0}</span></div>
              <div className="inline-action-card"><strong>Late:</strong> <span>{monthly?.late ?? 0}</span></div>
              <div className="inline-action-card"><strong>Half Day:</strong> <span>{monthly?.halfDay ?? 0}</span></div>
            </div>
          </article>

          <article className="panel">
            <div className="panel-head"><h3>Leave Balance</h3></div>
            <div className="modal-form">
              <div className="inline-action-card"><strong>Casual:</strong> <span>{leaveBalance?.casual ?? 0}</span></div>
              <div className="inline-action-card"><strong>Sick:</strong> <span>{leaveBalance?.sick ?? 0}</span></div>
              <div className="inline-action-card"><strong>Earned:</strong> <span>{leaveBalance?.earned ?? 0}</span></div>
              <div className="inline-action-card"><strong>Pending Requests:</strong> <span>{data?.pendingLeaveRequests ?? 0}</span></div>
            </div>
          </article>

          <article className="panel">
            <div className="panel-head"><h3>Latest Payslip</h3></div>
            {data?.latestPayslip ? (
              <div className="modal-form">
                <div className="inline-action-card"><strong>Month:</strong> <span>{data.latestPayslip.month}/{data.latestPayslip.year}</span></div>
                <div className="inline-action-card"><strong>Net Salary:</strong> <span>{formatCurrency(data.latestPayslip.netSalary)}</span></div>
                <div className="inline-action-card"><strong>Status:</strong> <span>{data.latestPayslip.status}</span></div>
                <div className="actions-row">
                  <Button variant="ghost" onClick={() => navigate('/employee/payroll')}><IndianRupee size={14} /> Open Payroll</Button>
                </div>
              </div>
            ) : <EmptyState title="No payslip yet" description="Latest generated payslip will appear here." />}
          </article>

          <article className="panel">
            <div className="panel-head"><h3>Upcoming Holidays</h3></div>
            {data?.upcomingHolidays?.length ? (
              <ul className="list">
                {data.upcomingHolidays.map((holiday) => (
                  <li key={`${holiday.name}-${holiday.date}`}>{holiday.date} - {holiday.name}</li>
                ))}
              </ul>
            ) : <EmptyState title="No upcoming holidays" description="Company holiday list is empty." />}
          </article>

          <article className="panel">
            <div className="panel-head">
              <h3>Notifications / Announcements</h3>
              <Button variant="ghost" onClick={() => navigate('/employee/notifications')}><Bell size={14} /> Open Notifications</Button>
            </div>
            {data?.notifications?.length ? (
              <ul className="list">
                {data.notifications.map((item) => (
                  <li key={item.id}>{item.title}: {item.message}</li>
                ))}
              </ul>
            ) : <EmptyState title="No notifications" description="Announcements from backend will appear here." />}
          </article>
        </div>
      )}
    </section>
  )
}

export default EmployeeDashboardPage
