import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  CalendarCheck2,
  CalendarClock,
  Clock3,
  RefreshCw
} from 'lucide-react'
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

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
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

  useEffect(() => {
    const handleAttendanceUpdated = () => {
      loadDashboard()
    }

    const handleWindowFocus = () => {
      loadDashboard()
    }

    window.addEventListener('employee-attendance-updated', handleAttendanceUpdated)
    window.addEventListener('focus', handleWindowFocus)
    return () => {
      window.removeEventListener('employee-attendance-updated', handleAttendanceUpdated)
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [])

  const attendance = data?.todayAttendanceStatus
  const monthly = data?.thisMonthAttendanceSummary
  const leaveBalance = data?.leaveBalance
  const stats = [
    {
      title: 'Attendance',
      value: String(attendance?.status || 'absent').toUpperCase(),
      trend: `Checked in at ${formatMaybeTime(attendance?.checkIn)}`,
      icon: CalendarCheck2,
      trendTone: attendance?.status === 'present' ? 'success' : 'warning',
      onClick: () => navigate('/employee/attendance')
    },
    {
      title: 'Working Hours',
      value: `${Number(attendance?.workingHours ?? 0).toFixed(1)}h`,
      trend: `Today's progress`,
      icon: Clock3,
      trendTone: 'info',
      onClick: () => navigate('/employee/attendance')
    },
    {
      title: 'Leave Balance',
      value: String((Number(leaveBalance?.casual || 0) + Number(leaveBalance?.sick || 0) + Number(leaveBalance?.earned || 0)).toFixed(1)),
      trend: 'Total leave days',
      icon: CalendarDays,
      trendTone: 'info',
      onClick: () => navigate('/employee/leaves')
    },
    {
      title: 'Pending Requests',
      value: String(data?.pendingLeaveRequests ?? 0),
      trend: 'Awaiting approval',
      icon: CalendarClock,
      trendTone: 'warning',
      onClick: () => navigate('/employee/leaves')
    }
  ]

  const calendarRows = [
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    ['29', '30', '1', '2', '3', '4', '5'],
    ['6', '7', '8', '9', '10', '11', '12'],
    ['13', '14', '15', '16', '17', '18', '19'],
    ['20', '21', '22', '23', '24', '25', '26'],
    ['27', '28', '29', '30', '31', '1', '2']
  ]
  const notifications = Array.isArray(data?.notifications) ? data.notifications : []

  return (
    <section className="section-layout dashboard-premium employee-orbit employee-orbit-v2">
      <div className="panel orbit-hello">
        <div>
          <h2>{getGreeting()}, John!</h2>
          <p>Here's what's happening with your work today.</p>
        </div>
        <div className="actions-row">
          <Button variant="ghost" onClick={loadDashboard}><RefreshCw size={14} /> Refresh</Button>
        </div>
      </div>

      {error ? <div className="panel error-banner">{error}</div> : null}

      {loading ? <LoadingSkeleton rows={6} /> : <div className="stats-grid premium-stats-grid">{stats.map((item) => <StatCard key={item.title} {...item} />)}</div>}

      {loading ? null : (
        <div className="dashboard-main-grid orbit-grid-top">
          <article className="panel">
            <div className="panel-head">
              <h3>This Month Attendance</h3>
              <span className="badge badge-info">May 2024</span>
            </div>
            <div className="orbit-calendar">
              {calendarRows.map((row, ridx) => row.map((cell, cidx) => (
                <span
                  key={`${ridx}-${cidx}-${cell}`}
                  className={`orbit-cell ${ridx === 0 ? 'head' : ''} ${cell === '25' ? 'absent' : ''}`}
                >
                  {cell}
                </span>
              )))}
            </div>
            <div className="orbit-legend">
              <span><i className="dot present" /> Present</span>
              <span><i className="dot absent" /> Absent</span>
              <span><i className="dot off" /> Weekly Off</span>
            </div>
          </article>

          <article className="panel">
            <div className="panel-head"><h3>Leave Balance</h3></div>
            <div className="orbit-leave">
              <div className="orbit-donut"><strong>{(Number(leaveBalance?.casual || 0) + Number(leaveBalance?.sick || 0) + Number(leaveBalance?.earned || 0)).toFixed(1)}</strong><small>Total Days</small></div>
              <ul className="list">
                <li><span>Casual Leave</span><strong>{leaveBalance?.casual ?? 0} Days</strong></li>
                <li><span>Sick Leave</span><strong>{leaveBalance?.sick ?? 0} Days</strong></li>
                <li><span>Earned Leave</span><strong>{leaveBalance?.earned ?? 0} Days</strong></li>
              </ul>
            </div>
          </article>
        </div>
      )}

      {loading ? null : (
        <div className="dashboard-main-grid orbit-grid-bottom">
          <article className="panel">
            <div className="panel-head">
              <h3>Recent Announcements</h3>
              <Button variant="ghost" onClick={() => navigate('/employee/announcements')}>View All</Button>
            </div>
            {notifications.length ? (
              <ul className="list">
                {notifications.slice(0, 2).map((item) => (
                  <li key={item.id}><strong>{item.title}</strong><br />{item.message}</li>
                ))}
              </ul>
            ) : <EmptyState title="No announcements" description="Updates from HR/Admin appear here." />}
          </article>

          <article className="panel">
            <div className="panel-head"><h3>Upcoming Holidays</h3></div>
            {data?.upcomingHolidays?.length ? (
              <ul className="list">
                {data.upcomingHolidays.slice(0, 3).map((holiday) => (
                  <li key={`${holiday.name}-${holiday.date}`}><strong>{holiday.name}</strong><br />{holiday.date}</li>
                ))}
              </ul>
            ) : <EmptyState title="No holidays" description="Upcoming holidays appear here." />}
          </article>

        </div>
      )}
    </section>
  )
}

export default EmployeeDashboardPage


