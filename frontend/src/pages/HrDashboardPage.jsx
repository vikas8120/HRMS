import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CalendarCheck2, CalendarClock, ClipboardList, Clock3, RefreshCw } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import PageHeader from '../components/ui/PageHeader'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'
import EmptyState from '../components/ui/EmptyState'
import StatCard from '../components/ui/StatCard'
import Button from '../components/ui/Button'
import { getHrDashboard } from '../api/hrPortalApi'

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function HrDashboardPage() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isMyDashboard = pathname === '/hr/my-dashboard'
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getHrDashboard()
      setData(res?.data || res || null)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load HR dashboard')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const stats = useMemo(() => ([
    { label: 'Total Employees', value: data?.totalEmployees ?? 0 },
    { label: 'Present Today', value: data?.presentToday ?? 0 },
    { label: 'Absent Today', value: data?.absentToday ?? 0 },
    { label: 'Pending Leaves', value: data?.pendingLeaves ?? 0 },
    { label: 'Total Departments', value: data?.totalDepartments ?? 0 }
  ]), [data])

  const leaveBalance = data?.leaveBalance || { casual: 8, sick: 6, earned: 10 }
  const totalLeaveDays = Number(leaveBalance?.casual || 0) + Number(leaveBalance?.sick || 0) + Number(leaveBalance?.earned || 0)
  const primaryAttendance = data?.todayAttendancePreview?.[0] || {}
  const myStats = [
    {
      title: 'Attendance',
      value: String(primaryAttendance?.status || 'present').toUpperCase(),
      trend: `Checked in at ${primaryAttendance?.checkIn || '11:21 pm'}`,
      icon: CalendarCheck2,
      trendTone: primaryAttendance?.status === 'present' ? 'success' : 'warning'
    },
    {
      title: 'Working Hours',
      value: `${Number(primaryAttendance?.workingHours ?? 0).toFixed(1)}h`,
      trend: "Today's progress",
      icon: Clock3,
      trendTone: 'info'
    },
    {
      title: 'Leave Balance',
      value: totalLeaveDays.toFixed(1),
      trend: 'Total leave days',
      icon: CalendarClock,
      trendTone: 'info'
    },
    {
      title: 'Pending Requests',
      value: String(data?.pendingLeaves ?? 0),
      trend: 'Awaiting approval',
      icon: ClipboardList,
      trendTone: 'warning'
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
  const myAnnouncements = Array.isArray(data?.recentActivities) && data.recentActivities.length
    ? data.recentActivities.slice(0, 2).map((item) => ({
        id: item.id,
        title: item.action || 'Announcement',
        message: item.message || '-'
      }))
    : [{ id: 'ann-01', title: 'Townhall Friday', message: 'Monthly townhall at 5 PM.' }]
  const myHolidays = Array.isArray(data?.upcomingHolidays) && data.upcomingHolidays.length
    ? data.upcomingHolidays
    : [
        { name: 'Independence Day', date: `${new Date().getFullYear()}-08-15` },
        { name: 'Gandhi Jayanti', date: `${new Date().getFullYear()}-10-02` }
      ]
  const attendanceTrendData = Array.isArray(data?.attendanceTrend) && data.attendanceTrend.length
    ? data.attendanceTrend
    : [
        { day: 'Mon', present: 82, absent: 8 },
        { day: 'Tue', present: 86, absent: 7 },
        { day: 'Wed', present: 88, absent: 6 },
        { day: 'Thu', present: 84, absent: 9 },
        { day: 'Fri', present: 90, absent: 5 },
        { day: 'Sat', present: 75, absent: 4 }
      ]
  const leaveMixData = [
    { name: 'Casual', value: Number(leaveBalance?.casual || 0), color: '#6366f1' },
    { name: 'Sick', value: Number(leaveBalance?.sick || 0), color: '#38bdf8' },
    { name: 'Earned', value: Number(leaveBalance?.earned || 0), color: '#34d399' }
  ]
  const departmentStrengthData = Array.isArray(data?.departmentStrength) && data.departmentStrength.length
    ? data.departmentStrength
    : [
        { department: 'Engineering', count: 34 },
        { department: 'Sales', count: 22 },
        { department: 'HR', count: 8 },
        { department: 'Finance', count: 12 },
        { department: 'Support', count: 18 }
      ]
  const payrollTrendData = Array.isArray(data?.payrollTrend) && data.payrollTrend.length
    ? data.payrollTrend
    : [
        { month: 'Jan', payroll: 4.2 },
        { month: 'Feb', payroll: 4.4 },
        { month: 'Mar', payroll: 4.6 },
        { month: 'Apr', payroll: 4.5 },
        { month: 'May', payroll: 4.8 },
        { month: 'Jun', payroll: 5.0 }
      ]

  return (
    <section className={`section-layout dashboard-premium ${isMyDashboard ? 'manager-my-dashboard employee-orbit-v2' : 'hr-employee-dashboard-compact'}`}>
      <div className="panel dashboard-switcher-panel">
        <div className="workspace-nav">
          <button
            type="button"
            className={`chip-btn ${isMyDashboard ? 'active' : ''}`}
            onClick={() => navigate('/hr/my-dashboard')}
          >
            My Dashboard
          </button>
          <button
            type="button"
            className={`chip-btn ${!isMyDashboard ? 'active' : ''}`}
            onClick={() => navigate('/hr/dashboard')}
          >
            Team Dashboard
          </button>
        </div>
      </div>

      <PageHeader
        title={isMyDashboard ? 'My Dashboard' : 'Team Dashboard'}
        description="Live HR KPI workspace with attendance, leaves, payroll, and activity tracking."
        breadcrumb={['HR Portal', isMyDashboard ? 'My Dashboard' : 'Team Dashboard']}
        primaryActionLabel="Refresh"
        onPrimaryAction={load}
      />

      {loading ? <LoadingSkeleton rows={6} /> : null}
      {!loading && error ? <div className="panel"><EmptyState title="Unable to load dashboard" description={error} /></div> : null}

      {!loading && !error && isMyDashboard ? (
        <>
          <div className="panel orbit-hello">
            <div>
              <h2>{getGreeting()}, John!</h2>
              <p>Here's what's happening with your work today.</p>
            </div>
            <div className="actions-row">
              <Button variant="ghost" onClick={load}><RefreshCw size={14} /> Refresh</Button>
            </div>
          </div>

          <div className="stats-grid premium-stats-grid">
            {myStats.map((item) => <StatCard key={item.title} {...item} />)}
          </div>

          <div className="dashboard-main-grid orbit-grid-top">
            <article className="panel">
              <div className="panel-head">
                <h3>This Month Attendance</h3>
                <span className="badge badge-info">May 2024</span>
              </div>
              <div className="orbit-calendar">
                {calendarRows.map((row, ridx) => row.map((cell, cidx) => (
                  <span key={`${ridx}-${cidx}-${cell}`} className={`orbit-cell ${ridx === 0 ? 'head' : ''} ${cell === '25' ? 'absent' : ''}`}>{cell}</span>
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
                <div className="orbit-donut"><strong>{totalLeaveDays.toFixed(1)}</strong><small>Total Days</small></div>
                <ul className="list">
                  <li><span>Casual Leave</span><strong>{leaveBalance?.casual ?? 0} Days</strong></li>
                  <li><span>Sick Leave</span><strong>{leaveBalance?.sick ?? 0} Days</strong></li>
                  <li><span>Earned Leave</span><strong>{leaveBalance?.earned ?? 0} Days</strong></li>
                </ul>
              </div>
            </article>
          </div>

          <div className="dashboard-main-grid orbit-grid-bottom">
            <article className="panel">
              <div className="panel-head">
                <h3>Recent Announcements</h3>
                <Button variant="ghost">View All</Button>
              </div>
              <ul className="list">
                {myAnnouncements.map((item) => (
                  <li key={item.id}><strong>{item.title}</strong><br />{item.message}</li>
                ))}
              </ul>
            </article>

            <article className="panel">
              <div className="panel-head"><h3>Upcoming Holidays</h3></div>
              <ul className="list">
                {myHolidays.slice(0, 3).map((holiday) => (
                  <li key={`${holiday.name}-${holiday.date}`}><strong>{holiday.name}</strong><br />{holiday.date}</li>
                ))}
              </ul>
            </article>
          </div>
        </>
      ) : null}

      {!loading && !error ? (
        !isMyDashboard ? (
        <>
          <div className="stats-grid">
            {stats.map((item) => (
              <article key={item.label} className="stat-card">
                <p className="stat-title">{item.label}</p>
                <h2 className="stat-value">{item.value}</h2>
              </article>
            ))}
          </div>

          <div className="dashboard-main-grid">
            <article className="panel">
              <div className="panel-head"><h3>Attendance Trend</h3></div>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={attendanceTrendData}>
                    <defs>
                      <linearGradient id="hrPresentFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.04} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(148,163,184,0.24)" strokeDasharray="4 4" />
                    <XAxis dataKey="day" tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12 }} />
                    <Area type="monotone" dataKey="present" stroke="#0ea5e9" fill="url(#hrPresentFill)" strokeWidth={3} />
                    <Area type="monotone" dataKey="absent" stroke="#f97316" fillOpacity={0} strokeDasharray="6 4" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="panel">
              <div className="panel-head"><h3>Leave Mix</h3></div>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={leaveMixData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={90} paddingAngle={3}>
                      {leaveMixData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </article>
          </div>

          <div className="dashboard-main-grid">
            <article className="panel">
              <div className="panel-head"><h3>Department Strength</h3></div>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentStrengthData}>
                    <CartesianGrid stroke="rgba(148,163,184,0.24)" strokeDasharray="4 4" />
                    <XAxis dataKey="department" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12 }} />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="panel">
              <div className="panel-head"><h3>Payroll Trend (Lakh)</h3></div>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={payrollTrendData}>
                    <defs>
                      <linearGradient id="hrPayrollFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(148,163,184,0.24)" strokeDasharray="4 4" />
                    <XAxis dataKey="month" tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12 }} />
                    <Area type="monotone" dataKey="payroll" stroke="#8b5cf6" fill="url(#hrPayrollFill)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </article>
          </div>

          <div className="panel">
            <div className="panel-head"><h3>Alerts</h3></div>
            {!data?.alerts?.length ? <EmptyState title="No alerts" description="All critical HR checks look good." /> : (
              <div className="insights-list">
                {data.alerts.map((alert) => (
                  <div key={alert.id} className={`insight-tile ${alert.severity || 'info'}`}>
                    <strong>{alert.title}</strong>
                    <p>{alert.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panel-head"><h3>Recent Activities</h3></div>
            {!data?.recentActivities?.length ? <EmptyState title="No activity logs" /> : (
              <div className="timeline">
                {data.recentActivities.slice(0, 8).map((item) => (
                  <div key={item.id} className="timeline-item">
                    <span className="timeline-dot" />
                    <div>
                      <strong>{item.action}</strong>
                      <p>{item.message || '-'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
        ) : null
      ) : null}
    </section>
  )
}

export default HrDashboardPage
