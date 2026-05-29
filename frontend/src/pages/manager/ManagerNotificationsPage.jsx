import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import SearchBar from '../../components/ui/SearchBar'
import Modal from '../../components/ui/Modal'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import {
  createManagerNotification,
  deleteManagerNotification,
  getManagerNotifications,
  markAllManagerNotificationsRead,
  markManagerNotificationRead
} from '../../api/managerNotificationsApi'
import { approveManagerLeave, rejectManagerLeave } from '../../api/managerLeaveApi'
import { getManagerTeam } from '../../api/managerTeamApi'

const tabs = [
  { label: 'All Notifications', value: 'all' },
  { label: 'Leave Notifications', value: 'leave' },
  { label: 'Attendance Notifications', value: 'attendance' },
  { label: 'HR/Admin Messages', value: 'hr-admin' }
]

const formatDateTime = (value) => {
  const d = new Date(value || '')
  if (Number.isNaN(d.getTime())) return '-'
  return `${d.toISOString().slice(0, 10)} ${d.toISOString().slice(11, 16)}`
}

function ManagerNotificationsPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [team, setTeam] = useState([])
  const [createForm, setCreateForm] = useState({
    employeeId: 'all',
    category: 'attendance',
    title: '',
    message: ''
  })

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(null), 2400)
    return () => clearTimeout(timer)
  }, [toast])

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const payload = await getManagerNotifications({ category: activeTab })
      setRows(payload?.data || [])
    } catch (err) {
      setRows([])
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to load notifications' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [activeTab])

  useEffect(() => {
    const loadTeam = async () => {
      try {
        const payload = await getManagerTeam()
        setTeam(payload?.data || [])
      } catch (_err) {
        setTeam([])
      }
    }
    loadTeam()
  }, [])

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter((row) => `${row.title} ${row.message} ${row.category} ${row.type}`.toLowerCase().includes(needle))
  }, [rows, search])

  const unreadCount = useMemo(() => rows.filter((x) => !x.isRead).length, [rows])

  const openDetails = (row) => {
    setSelected(row)
    setDetailsOpen(true)
  }

  const onMarkRead = async (row) => {
    if (row.isRead) return
    try {
      await markManagerNotificationRead(row.id)
      await loadNotifications()
    } catch (_err) {}
  }

  const onMarkAllRead = async () => {
    setSubmitting(true)
    try {
      await markAllManagerNotificationsRead()
      setToast({ type: 'success', message: 'All notifications marked as read' })
      await loadNotifications()
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Unable to mark all as read' })
    } finally {
      setSubmitting(false)
    }
  }

  const onDelete = async (row) => {
    setSubmitting(true)
    try {
      await deleteManagerNotification(row.id)
      setToast({ type: 'success', message: 'Notification deleted' })
      await loadNotifications()
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Unable to delete notification' })
    } finally {
      setSubmitting(false)
    }
  }

  const onOpen = async (row) => {
    await onMarkRead(row)
    if (row.actionPath) navigate(row.actionPath)
  }

  const onApproveLeave = async (row) => {
    const leaveId = row?.metadata?.leaveId
    if (!leaveId) return setToast({ type: 'error', message: 'Leave reference not available' })
    setSubmitting(true)
    try {
      await approveManagerLeave(leaveId)
      setToast({ type: 'success', message: 'Leave approved' })
      await markManagerNotificationRead(row.id)
      await loadNotifications()
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to approve leave' })
    } finally {
      setSubmitting(false)
    }
  }

  const onRejectLeave = async (row) => {
    const leaveId = row?.metadata?.leaveId
    if (!leaveId) return setToast({ type: 'error', message: 'Leave reference not available' })
    const rejectionReason = window.prompt('Enter rejection reason')
    if (!rejectionReason || !rejectionReason.trim()) return
    setSubmitting(true)
    try {
      await rejectManagerLeave(leaveId, rejectionReason.trim())
      setToast({ type: 'success', message: 'Leave rejected' })
      await markManagerNotificationRead(row.id)
      await loadNotifications()
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to reject leave' })
    } finally {
      setSubmitting(false)
    }
  }

  const onCreateNotification = async () => {
    if (!createForm.title.trim() || !createForm.message.trim()) {
      setToast({ type: 'error', message: 'Title and message are required' })
      return
    }
    setSubmitting(true)
    try {
      await createManagerNotification({
        employeeId: createForm.employeeId === 'all' ? '' : createForm.employeeId,
        category: createForm.category,
        type: createForm.category,
        title: createForm.title.trim(),
        message: createForm.message.trim(),
        isRead: false,
        actionType: 'open_notification'
      })
      setCreateOpen(false)
      setCreateForm({ employeeId: 'all', category: 'attendance', title: '', message: '' })
      setToast({ type: 'success', message: 'Notification created successfully' })
      await loadNotifications()
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to create notification' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="section-layout">
      <PageHeader
        title="Notifications"
        description="Track leave, tasks, attendance, and HR/Admin messages."
        breadcrumb={['Manager Portal', 'Notifications']}
      />

      {toast ? <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>{toast.message}</div> : null}

      <div className="panel">
        <div className="workspace-nav">
          {tabs.map((tab) => (
            <button key={tab.value} type="button" className={`chip-btn ${activeTab === tab.value ? 'active' : ''}`} onClick={() => setActiveTab(tab.value)}>{tab.label}</button>
          ))}
        </div>

        <div className="filters-row admin-filters-grid" style={{ marginTop: 10 }}>
          <div className="search-wrap">
            <label>Search</label>
            <SearchBar value={search} onChange={setSearch} placeholder="Search notifications" />
          </div>
        </div>

        <div className="actions-row" style={{ marginTop: 10 }}>
          <Button variant="ghost" onClick={loadNotifications}><RefreshCw size={14} /> Refresh</Button>
          <Button onClick={() => setCreateOpen(true)} disabled={submitting}>Create Notification</Button>
          <Button onClick={onMarkAllRead} disabled={submitting}>Mark All as Read ({unreadCount})</Button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Notification Feed</h3></div>
        {loading ? <LoadingSkeleton rows={8} /> : filtered.length === 0 ? (
          <EmptyState title="No notifications" description="New notification updates will appear here." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Message</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    <td>{row.title}</td>
                    <td>{row.message}</td>
                    <td>{row.category}</td>
                    <td><span className={`badge ${row.isRead ? 'badge-approved' : 'badge-pending'}`}>{row.isRead ? 'Read' : 'Unread'}</span></td>
                    <td>{formatDateTime(row.createdAt)}</td>
                    <td>
                      <div className="table-actions">
                        <button className="text-btn" onClick={() => openDetails(row)}>View Details</button>
                        {!row.isRead ? <button className="text-btn" onClick={() => onMarkRead(row)}>Mark as Read</button> : null}
                        <button className="text-btn danger" onClick={() => onDelete(row)}>Dismiss</button>
                        {row.actionType === 'open_request' ? <button className="text-btn" onClick={() => onOpen(row)}>Open Request</button> : null}
                        {row.actionType === 'approve_leave' ? <button className="text-btn" onClick={() => onApproveLeave(row)}>Approve Leave</button> : null}
                        {row.actionType === 'approve_leave' ? <button className="text-btn danger" onClick={() => onRejectLeave(row)}>Reject Leave</button> : null}
                        {row.actionType === 'open_attendance' ? <button className="text-btn" onClick={() => onOpen(row)}>Open Attendance</button> : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={detailsOpen} title="Notification Details" onClose={() => setDetailsOpen(false)}>
        {!selected ? <EmptyState title="No notification selected" description="Select a notification to view details." /> : (
          <div className="modal-form">
            <div className="inline-action-card"><strong>Title:</strong> <span>{selected.title}</span></div>
            <div className="inline-action-card"><strong>Message:</strong> <span>{selected.message}</span></div>
            <div className="inline-action-card"><strong>Category:</strong> <span>{selected.category}</span></div>
            <div className="inline-action-card"><strong>Type:</strong> <span>{selected.type}</span></div>
            <div className="inline-action-card"><strong>Status:</strong> <span>{selected.isRead ? 'Read' : 'Unread'}</span></div>
            <div className="inline-action-card"><strong>Created:</strong> <span>{formatDateTime(selected.createdAt)}</span></div>
            <div className="inline-action-card"><strong>Action Path:</strong> <span>{selected.actionPath || '-'}</span></div>
            <div className="actions-row">
              {!selected.isRead ? <Button variant="ghost" onClick={() => onMarkRead(selected)}>Mark as Read</Button> : null}
              <Button variant="ghost" onClick={() => onDelete(selected)}>Dismiss</Button>
              <Button onClick={() => onOpen(selected)}>Open</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={createOpen} title="Create Notification for Employee" onClose={() => { if (!submitting) setCreateOpen(false) }}>
        <div className="modal-form">
          <label className="form-input-wrap">
            <span>Employee</span>
            <select className="form-input" value={createForm.employeeId} onChange={(e) => setCreateForm((prev) => ({ ...prev, employeeId: e.target.value }))}>
              <option value="all">All Employees</option>
              {team.map((item) => (
                <option key={item.employeeId} value={item.employeeId}>{item.name}</option>
              ))}
            </select>
          </label>
          <label className="form-input-wrap">
            <span>Category</span>
            <select className="form-input" value={createForm.category} onChange={(e) => setCreateForm((prev) => ({ ...prev, category: e.target.value }))}>
              <option value="attendance">Attendance</option>
              <option value="leave">Leave</option>
              <option value="hr-admin">HR/Admin</option>
            </select>
          </label>
          <label className="form-input-wrap">
            <span>Title</span>
            <input className="form-input" value={createForm.title} onChange={(e) => setCreateForm((prev) => ({ ...prev, title: e.target.value }))} />
          </label>
          <label className="form-input-wrap">
            <span>Message</span>
            <textarea className="form-input" rows={4} value={createForm.message} onChange={(e) => setCreateForm((prev) => ({ ...prev, message: e.target.value }))} />
          </label>
          <div className="actions-row">
            <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={onCreateNotification} disabled={submitting}>{submitting ? 'Creating...' : 'Create Notification'}</Button>
          </div>
        </div>
      </Modal>
    </section>
  )
}

export default ManagerNotificationsPage
