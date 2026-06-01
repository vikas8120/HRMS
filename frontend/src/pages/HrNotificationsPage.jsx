import { useEffect, useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import SearchBar from '../components/ui/SearchBar'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'

const STORAGE_KEY = 'hr_notifications_v1'

const tabs = [
  { label: 'All Notifications', value: 'all' },
  { label: 'Leave Notifications', value: 'leave' },
  { label: 'Attendance Notifications', value: 'attendance' },
  { label: 'HR/Admin Messages', value: 'hr-admin' }
]

const seedRows = [
  {
    id: 'hr-notif-001',
    title: 'Leave request pending',
    message: 'Riya Patel applied for Casual Leave (2 days).',
    category: 'leave',
    type: 'leave',
    isRead: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'hr-notif-002',
    title: 'Attendance regularization',
    message: 'Arjun Mehta requested regularization for missing check-out.',
    category: 'attendance',
    type: 'attendance',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000).toISOString()
  }
]

const formatDateTime = (value) => {
  const d = new Date(value || '')
  if (Number.isNaN(d.getTime())) return '-'
  return `${d.toISOString().slice(0, 10)} ${d.toISOString().slice(11, 16)}`
}

function HrNotificationsPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [createForm, setCreateForm] = useState({
    audience: 'all-employees',
    category: 'attendance',
    title: '',
    message: ''
  })

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setRows(Array.isArray(parsed) ? parsed : seedRows)
      } catch (_err) {
        setRows(seedRows)
      }
    } else {
      setRows(seedRows)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!loading) localStorage.setItem(STORAGE_KEY, JSON.stringify(rows))
  }, [rows, loading])

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(null), 2400)
    return () => clearTimeout(timer)
  }, [toast])

  const visibleRows = useMemo(() => {
    const byTab = activeTab === 'all' ? rows : rows.filter((row) => row.category === activeTab)
    const needle = search.trim().toLowerCase()
    if (!needle) return byTab
    return byTab.filter((row) => `${row.title} ${row.message} ${row.category} ${row.type}`.toLowerCase().includes(needle))
  }, [rows, activeTab, search])

  const unreadCount = useMemo(() => rows.filter((row) => !row.isRead).length, [rows])

  const onRefresh = () => setRows((prev) => [...prev])

  const onMarkRead = (id) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, isRead: true } : row)))
  }

  const onMarkAllRead = () => {
    setRows((prev) => prev.map((row) => ({ ...row, isRead: true })))
    setToast({ type: 'success', message: 'All notifications marked as read' })
  }

  const onDelete = (id) => {
    setRows((prev) => prev.filter((row) => row.id !== id))
    setToast({ type: 'success', message: 'Notification dismissed' })
    if (selected?.id === id) setDetailsOpen(false)
  }

  const onCreate = () => {
    if (!createForm.title.trim() || !createForm.message.trim()) {
      setToast({ type: 'error', message: 'Title and message are required' })
      return
    }
    setSubmitting(true)
    const entry = {
      id: `hr-notif-${Date.now()}`,
      title: createForm.title.trim(),
      message: createForm.message.trim(),
      category: createForm.category,
      type: createForm.category,
      isRead: false,
      audience: createForm.audience,
      createdAt: new Date().toISOString()
    }
    setRows((prev) => [entry, ...prev])
    setCreateForm({ audience: 'all-employees', category: 'attendance', title: '', message: '' })
    setCreateOpen(false)
    setSubmitting(false)
    setToast({ type: 'success', message: 'Notification created successfully' })
  }

  return (
    <section className="section-layout">
      <PageHeader
        title="Notifications"
        description="Track leave, attendance, and HR/Admin message updates."
        breadcrumb={['HR Portal', 'Notifications']}
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
          <Button variant="ghost" onClick={onRefresh}><RefreshCw size={14} /> Refresh</Button>
          <Button onClick={() => setCreateOpen(true)}>Create Notification</Button>
          <Button onClick={onMarkAllRead}>Mark All as Read ({unreadCount})</Button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Notification Feed</h3></div>
        {loading ? <LoadingSkeleton rows={6} /> : visibleRows.length === 0 ? (
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
                {visibleRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.title}</td>
                    <td>{row.message}</td>
                    <td>{row.category}</td>
                    <td><span className={`badge ${row.isRead ? 'badge-approved' : 'badge-pending'}`}>{row.isRead ? 'Read' : 'Unread'}</span></td>
                    <td>{formatDateTime(row.createdAt)}</td>
                    <td>
                      <div className="table-actions">
                        <button className="text-btn" onClick={() => { setSelected(row); setDetailsOpen(true) }}>View</button>
                        {!row.isRead ? <button className="text-btn" onClick={() => onMarkRead(row.id)}>Mark as Read</button> : null}
                        <button className="text-btn danger" onClick={() => onDelete(row.id)}>Dismiss</button>
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
            <div className="inline-action-card"><strong>Status:</strong> <span>{selected.isRead ? 'Read' : 'Unread'}</span></div>
            <div className="inline-action-card"><strong>Created:</strong> <span>{formatDateTime(selected.createdAt)}</span></div>
            <div className="actions-row">
              {!selected.isRead ? <Button variant="ghost" onClick={() => onMarkRead(selected.id)}>Mark as Read</Button> : null}
              <Button variant="ghost" onClick={() => onDelete(selected.id)}>Dismiss</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={createOpen} title="Create HR Notification" onClose={() => { if (!submitting) setCreateOpen(false) }}>
        <div className="modal-form">
          <label className="form-input-wrap">
            <span>Audience</span>
            <select className="form-input" value={createForm.audience} onChange={(e) => setCreateForm((prev) => ({ ...prev, audience: e.target.value }))}>
              <option value="all-employees">All Employees</option>
              <option value="all-managers">All Managers</option>
              <option value="specific-team">Specific Team</option>
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
            <Button onClick={onCreate} disabled={submitting}>{submitting ? 'Creating...' : 'Create Notification'}</Button>
          </div>
        </div>
      </Modal>
    </section>
  )
}

export default HrNotificationsPage
