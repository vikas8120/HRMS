import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import DataTable from '../../components/ui/DataTable'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import FilterDropdown from '../../components/ui/FilterDropdown'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import {
  downloadAnnouncementAttachment,
  getEmployeeAnnouncementById,
  getEmployeeAnnouncements,
  markEmployeeAnnouncementRead
} from '../../api/employeeAnnouncementApi'

const filterOptions = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'company', label: 'Company' },
  { value: 'department', label: 'Department' },
  { value: 'policy', label: 'Policy' },
  { value: 'holiday', label: 'Holiday' }
]

const formatDate = (value) => {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toISOString().slice(0, 10)
}

function EmployeeAnnouncementsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [view, setView] = useState('all')
  const [items, setItems] = useState([])

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [selected, setSelected] = useState(null)

  const [submitting, setSubmitting] = useState(false)

  const showMessage = (setter, message) => {
    setter(message)
    setTimeout(() => setter(''), 2500)
  }

  const loadAnnouncements = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await getEmployeeAnnouncements({ view })
      setItems(response?.data || [])
    } catch (err) {
      setItems([])
      setError(err?.response?.data?.message || err?.message || 'Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnnouncements()
  }, [view])

  const rows = useMemo(() => items.map((item) => ({
    ...item,
    scope: item.departmentId ? 'department' : 'company',
    read: item.read ? 'Read' : 'Unread',
    createdAt: formatDate(item.createdAt)
  })), [items])

  const openDetails = async (row) => {
    setDetailsOpen(true)
    setDetailsLoading(true)
    setSelected(null)
    try {
      const response = await getEmployeeAnnouncementById(row.id)
      setSelected(response?.data || null)
    } catch (err) {
      showMessage(setError, err?.response?.data?.message || 'Failed to load announcement details')
    } finally {
      setDetailsLoading(false)
    }
  }

  const onMarkRead = async (row) => {
    if (row.read) return
    setSubmitting(true)
    try {
      const response = await markEmployeeAnnouncementRead(row.id)
      showMessage(setSuccess, response?.message || '')
      await loadAnnouncements()
      if (selected?.id === row.id) {
        const detail = await getEmployeeAnnouncementById(row.id)
        setSelected(detail?.data || null)
      }
    } catch (err) {
      showMessage(setError, err?.response?.data?.message || 'Failed to mark announcement as read')
    } finally {
      setSubmitting(false)
    }
  }

  const onDownloadAttachment = (row) => {
    const ok = downloadAnnouncementAttachment(row)
    if (!ok) showMessage(setError, 'No attachment available')
  }

  return (
    <section className="section-layout">
      <PageHeader
        title="Employee Announcements"
        description="Read company and department announcements relevant to your account."
        breadcrumb={['Employee Portal', 'Announcements']}
      />

      {success ? <div className="panel" style={{ borderColor: 'rgba(34,197,94,0.35)' }}>{success}</div> : null}
      {error ? <div className="panel error-banner">{error}</div> : null}

      <div className="panel">
        <div className="filters-row">
          <FilterDropdown label="Filter" value={view} onChange={setView} options={filterOptions} />
          <div className="actions-row" style={{ alignSelf: 'end' }}>
            <Button variant="ghost" onClick={loadAnnouncements}>Refresh</Button>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Announcements</h3></div>
        {loading ? <LoadingSkeleton rows={6} /> : rows.length === 0 ? <EmptyState title="No announcements" description="No announcements found for selected filter." /> : (
          <DataTable
            columns={[
              { key: 'title', label: 'Title' },
              { key: 'scope', label: 'Scope' },
              { key: 'filterType', label: 'Type' },
              { key: 'priority', label: 'Priority' },
              { key: 'read', label: 'Read Status' },
              { key: 'createdAt', label: 'Created On' }
            ]}
            rows={rows}
            showViewAction
            showDeleteAction={false}
            onView={openDetails}
          />
        )}
      </div>

      <Modal open={detailsOpen} title="Announcement Details" onClose={() => setDetailsOpen(false)}>
        {detailsLoading ? <LoadingSkeleton rows={5} /> : !selected ? <EmptyState title="No details" description="Unable to load selected announcement." /> : (
          <div className="modal-form">
            <div className="inline-action-card"><strong>Title:</strong> <span>{selected.title || '-'}</span></div>
            <div className="inline-action-card"><strong>Message:</strong> <span>{selected.message || '-'}</span></div>
            <div className="inline-action-card"><strong>Scope:</strong> <span>{selected.departmentId ? 'department' : 'company'}</span></div>
            <div className="inline-action-card"><strong>Type:</strong> <span>{selected.filterType || '-'}</span></div>
            <div className="inline-action-card"><strong>Priority:</strong> <span>{selected.priority || '-'}</span></div>
            <div className="inline-action-card"><strong>Read:</strong> <span>{selected.read ? 'Read' : 'Unread'}</span></div>
            <div className="inline-action-card"><strong>Created:</strong> <span>{formatDate(selected.createdAt)}</span></div>
            <div className="actions-row">
              {!selected.read ? <Button onClick={() => onMarkRead(selected)} disabled={submitting}>Mark as Read</Button> : null}
              <Button variant="ghost" onClick={() => onDownloadAttachment(selected)}>Download Attachment</Button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  )
}

export default EmployeeAnnouncementsPage
