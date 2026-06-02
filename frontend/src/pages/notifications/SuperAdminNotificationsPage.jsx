import { useEffect, useMemo, useState } from 'react'
import { Bell, RefreshCw } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import SearchBar from '../../components/ui/SearchBar'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import Modal from '../../components/ui/Modal'

const STORAGE_KEY = 'super_admin_notifications_v1'

const tabs = [
  { label: 'All Notifications', value: 'all' },
  { label: 'System Alerts', value: 'system' },
  { label: 'Security Alerts', value: 'security' },
  { label: 'Billing Alerts', value: 'billing' },
  { label: 'Support Alerts', value: 'support' }
]

const seedRows = [
  {
    id: 'sa-notif-001',
    title: 'Lead Auto-Reassigned',
    message: 'Parvindar Bhati was auto-reassigned to Priya S. after SLA breach.',
    category: 'support',
    type: 'support',
    isRead: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'sa-notif-002',
    title: 'Subscription Renewal Pending',
    message: 'Two client workspaces need billing follow-up today.',
    category: 'billing',
    type: 'billing',
    isRead: false,
    createdAt: new Date(Date.now() - 32 * 60000).toISOString()
  },
  {
    id: 'sa-notif-003',
    title: 'Admin Login Verified',
    message: 'A new platform admin login was verified from a trusted device.',
    category: 'security',
    type: 'security',
    isRead: true,
    createdAt: new Date(Date.now() - 90 * 60000).toISOString()
  },
  {
    id: 'sa-notif-004',
    title: 'Daily Backup Completed',
    message: 'Nightly backup finished successfully across all active tenants.',
    category: 'system',
    type: 'system',
    isRead: true,
    createdAt: new Date(Date.now() - 3 * 3600000).toISOString()
  }
]

const formatDateTime = (value) => {
  const d = new Date(value || '')
  if (Number.isNaN(d.getTime())) return '-'
  return `${d.toISOString().slice(0, 10)} ${d.toISOString().slice(11, 16)}`
}

function SuperAdminNotificationsPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY)
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
    if (!loading) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows))
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

  return (
    <section className="section-layout module-notifications">
      <PageHeader
        title="Notifications"
        description="Review platform alerts, security events, billing reminders, and support updates."
        breadcrumb={['Super Admin', 'Notifications']}
      />

      {toast ? <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>{toast.message}</div> : null}

      <div className="panel">
        <div className="workspace-nav">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={`chip-btn ${activeTab === tab.value ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label}
            </button>
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
          <Button onClick={onMarkAllRead}>Mark All as Read ({unreadCount})</Button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Notification Feed</h3>
        </div>
        {loading ? <LoadingSkeleton rows={6} /> : visibleRows.length === 0 ? (
          <EmptyState title="No notifications" description="New platform alerts will appear here." />
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
                        <button className="text-btn" onClick={() => { setSelected(row); setDetailsOpen(true) }}>View Details</button>
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
    </section>
  )
}

export default SuperAdminNotificationsPage
