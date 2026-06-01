import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  ClipboardList,
  Clock3,
  TrendingUp,
  UserCheck,
  UserMinus,
  Users,
  RefreshCw,
  CalendarCheck2,
  CalendarClock,
  ArrowRight
} from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import Button from '../../components/ui/Button'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import DataTable from '../../components/ui/DataTable'
import EmptyState from '../../components/ui/EmptyState'
import { getManagerDashboard } from '../../api/managerDashboardApi'

const toDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toISOString().slice(0, 10)
}

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function ManagerDashboardPage() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isMyDashboard = pathname === '/manager/my-dashboard'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dashboard, setDashboard] = useState(null)

  const loadDashboard = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await getManagerDashboard()
      setDashboard(response?.data || null)
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load manager dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const normalizedDashboard = useMemo(() => {
    const raw = dashboard?.data && typeof dashboard.data === 'object' ? dashboard.data : dashboard || {}
    const cards = raw.cards || {}
    const stats = raw.stats || {}

    const normalizedCards = {
      totalTeamMembers: Number(cards.totalTeamMembers ?? stats.teamSize ?? 0),
      presentToday: Number(cards.presentToday ?? 0),
      absentToday: Number(cards.absentToday ?? 0),
      pendingLeaveRequests: Number(cards.pendingLeaveRequests ?? stats.openRequests ?? 0),
      activeTasks: Number(cards.activeTasks ?? 0),
      completedTasks: Number(cards.completedTasks ?? 0),
      overdueTasks: Number(cards.overdueTasks ?? 0),
      averageTeamPerformance: Number(cards.averageTeamPerformance ?? 0)
    }

    const taskStatusChart =
      Array.isArray(raw.taskStatusChart) && raw.taskStatusChart.length
        ? raw.taskStatusChart
        : [
            { status: 'active', count: normalizedCards.activeTasks },
            { status: 'completed', count: normalizedCards.completedTasks },
            { status: 'overdue', count: normalizedCards.overdueTasks }
          ].filter((x) => Number(x.count) > 0)

    const recentActivities = Array.isArray(raw.recentActivities)
      ? raw.recentActivities.map((item, index) => ({
          id: item.id || `activity-${index + 1}`,
          module: item.module || 'manager',
          action: item.action || item.subject || 'Update',
          message: item.message || item.subject || 'Activity update',
          createdAt: item.createdAt || item.time || new Date().toISOString()
        }))
      : []

    return {
      ...raw,
      cards: normalizedCards,
      taskStatusChart,
      pendingLeaveRequestsPreview: Array.isArray(raw.pendingLeaveRequestsPreview) ? raw.pendingLeaveRequestsPreview : [],
      todayAttendancePreview: Array.isArray(raw.todayAttendancePreview) ? raw.todayAttendancePreview : [],
      teamPerformanceSummary: Array.isArray(raw.teamPerformanceSummary) ? raw.teamPerformanceSummary : [],
      recentActivities
    }
  }, [dashboard])

  const cards = useMemo(() => {
    const values = normalizedDashboard?.cards || {}
    return [
      { title: 'Total Team Members', value: String(values.totalTeamMembers ?? 0), trend: 'Assigned to you', icon: Users, trendTone: 'info' },
      { title: 'Present Today', value: String(values.presentToday ?? 0), trend: 'Attendance status', icon: UserCheck, trendTone: 'success' },
      { title: 'Absent Today', value: String(values.absentToday ?? 0), trend: 'Needs follow-up', icon: UserMinus, trendTone: 'warning' },
      { title: 'Average Team Performance', value: String(values.averageTeamPerformance ?? 0), trend: 'Review score', icon: TrendingUp, trendTone: 'info' }
    ]
  }, [normalizedDashboard])

  const leaveRows = (normalizedDashboard?.pendingLeaveRequestsPreview || []).map((item) => ({
    id: item.id,
    employee: item.employeeName || '-',
    type: item.leaveType || '-',
    period: `${toDate(item.startDate)} to ${toDate(item.endDate)}`,
    status: item.status || 'pending'
  }))

  const attendanceRows = (normalizedDashboard?.todayAttendancePreview || []).map((item) => ({
    id: item.id,
    employee: item.employeeName || '-',
    status: item.status || 'absent',
    checkIn: item.checkIn || '-',
    checkOut: item.checkOut || '-'
  }))

  const performanceRows = (normalizedDashboard?.teamPerformanceSummary || []).map((item) => ({
    id: String(item.employeeId || item.employeeName),
    employee: item.employeeName || '-',
    averageScore: String(item.averageScore ?? 0),
    reviews: String(item.reviews ?? 0)
  }))

  const activityRows = (normalizedDashboard?.recentActivities || []).map((item) => ({
    id: item.id,
    module: item.module || '-',
    action: item.action || '-',
    message: item.message || '-',
    createdAt: item.createdAt ? String(item.createdAt).slice(0, 19).replace('T', ' ') : '-'
  }))

  const taskStatusChart = normalizedDashboard?.taskStatusChart || []
  const taskStatusChartDisplay = taskStatusChart.length ? taskStatusChart : [
    { status: 'active', count: 3 },
    { status: 'completed', count: 5 },
    { status: 'overdue', count: 2 }
  ]
  const attendanceMiniChart = [
    { name: 'Present', value: Number(normalizedDashboard?.cards?.presentToday ?? 0) || 6, color: '#22c55e' },
    { name: 'Absent', value: Number(normalizedDashboard?.cards?.absentToday ?? 0) || 2, color: '#f97316' },
    { name: 'Late', value: 1, color: '#eab308' }
  ]
  const performanceTrend = (normalizedDashboard?.teamPerformanceSummary || []).length
    ? normalizedDashboard.teamPerformanceSummary.slice(0, 6).map((item, index) => ({ name: `E${index + 1}`, score: Number(item.averageScore ?? 0) }))
    : [
        { name: 'W1', score: 62 },
        { name: 'W2', score: 71 },
        { name: 'W3', score: 69 },
        { name: 'W4', score: 78 },
        { name: 'W5', score: 74 }
      ]
  const leaveBalance = normalizedDashboard?.leaveBalance || { casual: 8, sick: 6, earned: 10 }
  const totalLeaveDays = Number(leaveBalance?.casual || 0) + Number(leaveBalance?.sick || 0) + Number(leaveBalance?.earned || 0)
  const primaryAttendance = normalizedDashboard?.todayAttendancePreview?.[0] || {}
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
      trend: `Today's progress`,
      icon: Clock3,
      trendTone: 'info'
    },
    {
      title: 'Leave Balance',
      value: String(totalLeaveDays.toFixed(1)),
      trend: 'Total leave days',
      icon: CalendarClock,
      trendTone: 'info'
    },
    {
      title: 'Pending Requests',
      value: String(normalizedDashboard?.cards?.pendingLeaveRequests ?? 0),
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
  const myAnnouncements = Array.isArray(normalizedDashboard?.notifications) && normalizedDashboard.notifications.length
    ? normalizedDashboard.notifications
    : [{ id: 'ann-01', title: 'Townhall Friday', message: 'Monthly townhall at 5 PM.' }]
  const myHolidays = Array.isArray(normalizedDashboard?.upcomingHolidays) && normalizedDashboard.upcomingHolidays.length
    ? normalizedDashboard.upcomingHolidays
    : [
        { name: 'Independence Day', date: `${new Date().getFullYear()}-08-15` },
        { name: 'Gandhi Jayanti', date: `${new Date().getFullYear()}-10-02` }
      ]

  const quickActions = [
    { label: 'View Attendance', onClick: () => navigate('/manager/attendance') },
    { label: 'View Pending Leaves', onClick: () => navigate('/manager/leaves') },
    { label: 'Add Review', onClick: () => navigate('/manager/performance') }
  ]

  const reveal = {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.36, ease: [0.22, 1, 0.36, 1] }
  }

  return (
    <section className={`section-layout dashboard-premium manager-orbit ${isMyDashboard ? 'manager-my-dashboard employee-orbit-v2' : ''}`}>
      <div className="panel dashboard-switcher-panel">
        <div className="workspace-nav">
          <button
            type="button"
            className={`chip-btn ${pathname === '/manager/my-dashboard' ? 'active' : ''}`}
            onClick={() => navigate('/manager/my-dashboard')}
          >
            My Dashboard
          </button>
          <button
            type="button"
            className={`chip-btn ${pathname === '/manager/dashboard' ? 'active' : ''}`}
            onClick={() => navigate('/manager/dashboard')}
          >
            Team Dashboard
          </button>
        </div>
      </div>

      {!isMyDashboard ? (
        <PageHeader
          title="Team Dashboard"
          description="Real-time team analytics, pending actions, and execution status for your assigned employees."
          breadcrumb={['Manager Portal', 'Team Dashboard']}
        />
      ) : null}

      {isMyDashboard ? (
        <>
          <div className="panel orbit-hello">
            <div>
              <h2>{getGreeting()}, John!</h2>
              <p>Here's what's happening with your work today.</p>
            </div>
            <div className="actions-row">
              <Button variant="ghost" onClick={loadDashboard}><RefreshCw size={14} /> Refresh</Button>
            </div>
          </div>

          {loading ? <LoadingSkeleton rows={6} /> : <div className="stats-grid premium-stats-grid">{myStats.map((item) => <StatCard key={item.title} {...item} />)}</div>}

          {loading ? null : (
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
          )}

          {loading ? null : (
            <div className="dashboard-main-grid orbit-grid-bottom">
              <article className="panel">
                <div className="panel-head">
                  <h3>Recent Announcements</h3>
                  <Button variant="ghost" onClick={() => navigate('/manager/notifications')}>View All</Button>
                </div>
                <ul className="list">
                  {myAnnouncements.slice(0, 2).map((item) => (
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
          )}
        </>
      ) : null}

      {!isMyDashboard ? <motion.div className="panel dashboard-header-actions" {...reveal}>
        <div className="header-tagline">
          <h3>Team Command Center</h3>
          <p>All metrics are scoped to employees assigned to you.</p>
        </div>
        <div className="actions-row">
          <Button variant="ghost" onClick={loadDashboard}><RefreshCw size={14} /> Refresh</Button>
        </div>
      </motion.div> : null}

      {!isMyDashboard && error ? (
        <div className="panel dashboard-error-card">
          <div>
            <h4>Unable to load dashboard</h4>
            <p>{error}</p>
          </div>
          <Button variant="ghost" onClick={loadDashboard}>Retry</Button>
        </div>
      ) : null}

      {!isMyDashboard && (loading ? <LoadingSkeleton rows={8} /> : (
        <motion.div className="stats-grid premium-stats-grid" {...reveal} transition={{ ...reveal.transition, delay: 0.05 }}>
          {cards.map((item) => <StatCard key={item.title} {...item} />)}
        </motion.div>
      ))}

      {!isMyDashboard ? <motion.div className="dashboard-main-grid" {...reveal} transition={{ ...reveal.transition, delay: 0.1 }}>
        <article className="panel dashboard-float-card">
          <div className="panel-head"><h3>Task Status Chart</h3></div>
          {loading ? <LoadingSkeleton rows={4} /> : (
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={220} minHeight={220}>
                <BarChart data={taskStatusChartDisplay}>
                  <CartesianGrid stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
                  <XAxis dataKey="status" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--panel-tint)', border: '1px solid var(--line)', borderRadius: 10 }} />
                  <Bar dataKey="count" fill="#6c63ff" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        <article className="panel dashboard-float-card">
          <div className="panel-head"><h3>Quick Actions</h3></div>
          <div className="dashboard-mini-grid">
            {quickActions.map((item) => (
              <Button key={item.label} variant="ghost" onClick={item.onClick}>{item.label} <ArrowRight size={14} /></Button>
            ))}
          </div>
        </article>
      </motion.div> : null}

      {!isMyDashboard ? <motion.div className="dashboard-main-grid" {...reveal} transition={{ ...reveal.transition, delay: 0.14 }}>
        <article className="panel dashboard-float-card">
          <div className="panel-head"><h3>Pending Leave Requests Preview</h3></div>
          {loading ? <LoadingSkeleton rows={4} /> : (
            <DataTable
              columns={[
                { key: 'employee', label: 'Employee' },
                { key: 'type', label: 'Leave Type' },
                { key: 'period', label: 'Period', sortable: false },
                { key: 'status', label: 'Status' }
              ]}
              rows={leaveRows}
              showActions={false}
              emptyTitle="No pending leave requests"
              emptyDescription="Leave approvals pending in your team will appear here."
            />
          )}
        </article>

        <article className="panel dashboard-float-card">
          <div className="panel-head"><h3>Today Attendance Preview</h3></div>
          {loading ? <LoadingSkeleton rows={4} /> : attendanceRows.length === 0 ? (
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={attendanceMiniChart} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={3}>
                    {attendanceMiniChart.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--panel-tint)', border: '1px solid var(--line)', borderRadius: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <DataTable
              columns={[
                { key: 'employee', label: 'Employee' },
                { key: 'status', label: 'Status' },
                { key: 'checkIn', label: 'Check-In' },
                { key: 'checkOut', label: 'Check-Out' }
              ]}
              rows={attendanceRows}
              showActions={false}
              emptyTitle="No attendance data"
              emptyDescription="Team attendance for today appears here."
            />
          )}
        </article>
      </motion.div> : null}

      {!isMyDashboard ? <motion.div className="dashboard-main-grid" {...reveal} transition={{ ...reveal.transition, delay: 0.18 }}>
        <article className="panel dashboard-float-card">
          <div className="panel-head"><h3>Team Performance Summary</h3></div>
          {loading ? <LoadingSkeleton rows={4} /> : performanceRows.length === 0 ? (
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceTrend}>
                  <CartesianGrid stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
                  <XAxis dataKey="name" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--panel-tint)', border: '1px solid var(--line)', borderRadius: 10 }} />
                  <Line type="monotone" dataKey="score" stroke="#22d3ee" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <DataTable
              columns={[
                { key: 'employee', label: 'Employee' },
                { key: 'averageScore', label: 'Avg Score' },
                { key: 'reviews', label: 'Reviews' }
              ]}
              rows={performanceRows}
              showActions={false}
              emptyTitle="No performance records"
              emptyDescription="Team review summaries appear here after reviews are logged."
            />
          )}
        </article>

        <article className="panel recent-activities-card dashboard-float-card">
          <div className="panel-head"><h3>Recent Activities</h3></div>
          {loading ? <LoadingSkeleton rows={4} /> : (
            <DataTable
              columns={[
                { key: 'module', label: 'Module' },
                { key: 'action', label: 'Action' },
                { key: 'message', label: 'Message', sortable: false },
                { key: 'createdAt', label: 'Created At' }
              ]}
              rows={activityRows}
              showActions={false}
              emptyTitle="No recent activities"
              emptyDescription="Recent manager/team actions will appear here."
            />
          )}
        </article>
      </motion.div> : null}
    </section>
  )
}

export default ManagerDashboardPage
