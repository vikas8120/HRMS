import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import DataTable from '../../components/ui/DataTable'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import FilterDropdown from '../../components/ui/FilterDropdown'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import {
  deleteEmployeeNotification,
  getEmployeeNotifications,
  markAllEmployeeNotificationsRead,
  markEmployeeNotificationRead
} from '../../api/employeeNotificationApi'

const filterOptions = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'leave', label: 'Leave' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'task', label: 'Task' }
]

const formatDate = (value) => {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toISOString().slice(0, 10)
}

function EmployeeNotificationsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [filter, setFilter] = useState('all')
  const [items, setItems] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selected, setSelected] = useState(null)

  const showMessage = (setter, message) => {
    setter(message)
    setTimeout(() => setter(''), 2400)
  }

  const loadNotifications = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await getEmployeeNotifications({ filter })
      setItems(response?.data?.items || [])
      setUnreadCount(Number(response?.data?.unreadCount || 0))
    } catch (err) {
      setItems([])
      setUnreadCount(0)
      setError(err?.response?.data?.message || err?.message || 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [filter])

  const rows = useMemo(() => items.map((item) => ({
    ...item,
    readLabel: item.isRead ? 'Read' : 'Unread',
    createdAtLabel: formatDate(item.createdAt)
  })), [items])

  const openDetails = (row) => {
    setSelected(row)
    setDetailsOpen(true)
  }

  const onMarkRead = async (row) => {
    if (row.isRead) return
    setSubmitting(true)
    try {
      const response = await markEmployeeNotificationRead(row.id)
      showMessage(setSuccess, response?.message || '')
      await loadNotifications()
      if (selected?.id === row.id) {
        setSelected(response?.data || null)
      }
    } catch (err) {
      showMessage(setError, err?.response?.data?.message || 'Failed to mark notification as read')
    } finally {
      setSubmitting(false)
    }
  }

  const onMarkAllRead = async () => {
    setSubmitting(true)
    try {
      const response = await markAllEmployeeNotificationsRead()
      showMessage(setSuccess, response?.message || '')
      await loadNotifications()
    } catch (err) {
      showMessage(setError, err?.response?.data?.message || 'Failed to mark all as read')
    } finally {
      setSubmitting(false)
    }
  }

  const onDelete = async (row) => {
    setSubmitting(true)
    try {
      const response = await deleteEmployeeNotification(row.id)
      showMessage(setSuccess, response?.message || '')
      if (selected?.id === row.id) setDetailsOpen(false)
      await loadNotifications()
    } catch (err) {
      showMessage(setError, err?.response?.data?.message || 'Failed to delete notification')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="section-layout">
      <PageHeader
        title="Employee Notifications"
        description="View and manage your notification feed."
        breadcrumb={['Employee Portal', 'Notifications']}
      />

      {success ? <div className="panel" style={{ borderColor: 'rgba(34,197,94,0.35)' }}>{success}</div> : null}
      {error ? <div className="panel error-banner">{error}</div> : null}

      <div className="panel">
        <div className="filters-row">
          <FilterDropdown label="Filter" value={filter} onChange={setFilter} options={filterOptions} />
          <div className="inline-action-card"><strong>Unread Count:</strong> <span>{unreadCount}</span></div>
          <div className="actions-row" style={{ alignSelf: 'end' }}>
            <Button variant="ghost" onClick={loadNotifications} disabled={submitting}>Refresh</Button>
            <Button onClick={onMarkAllRead} disabled={submitting || unreadCount === 0}>Mark All Read</Button>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Notification Feed</h3></div>
        {loading ? <LoadingSkeleton rows={6} /> : rows.length === 0 ? <EmptyState title="No notifications" description="No notifications found for selected filter." /> : (
          <DataTable
            columns={[
              { key: 'title', label: 'Title' },
              { key: 'category', label: 'Category' },
              { key: 'type', label: 'Type' },
              { key: 'readLabel', label: 'Read Status' },
              { key: 'createdAtLabel', label: 'Created On' }
            ]}
            rows={rows}
            showViewAction
            showEditAction
            showDeleteAction
            editLabel="Mark Read"
            onView={openDetails}
            onEdit={onMarkRead}
            onDelete={onDelete}
          />
        )}
      </div>

      <Modal open={detailsOpen} title="Notification Details" onClose={() => setDetailsOpen(false)}>
        {!selected ? <EmptyState title="No details" description="Unable to load selected notification." /> : (
          <div className="modal-form">
            <div className="inline-action-card"><strong>Title:</strong> <span>{selected.title || '-'}</span></div>
            <div className="inline-action-card"><strong>Message:</strong> <span>{selected.message || '-'}</span></div>
            <div className="inline-action-card"><strong>Category:</strong> <span>{selected.category || '-'}</span></div>
            <div className="inline-action-card"><strong>Type:</strong> <span>{selected.type || '-'}</span></div>
            <div className="inline-action-card"><strong>Read:</strong> <span>{selected.isRead ? 'Read' : 'Unread'}</span></div>
            <div className="inline-action-card"><strong>Created:</strong> <span>{formatDate(selected.createdAt)}</span></div>
            <div className="actions-row">
              {!selected.isRead ? <Button onClick={() => onMarkRead(selected)} disabled={submitting}>Mark as Read</Button> : null}
              <Button variant="ghost" onClick={() => onDelete(selected)} disabled={submitting}>Delete</Button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  )
}

export default EmployeeNotificationsPage
