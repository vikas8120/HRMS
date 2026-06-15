import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import DataTable from '../../components/ui/DataTable'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import FilterDropdown from '../../components/ui/FilterDropdown'
import Button from '../../components/ui/Button'
import {
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
    try {
      const response = await getEmployeeAnnouncementById(row.id)
      const details = response?.data || null
      if (!details) throw new Error('No details available')

      const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Announcement - ${details.title || 'Notice'}</title>
  <style>
    body { margin: 0; padding: 28px; background: #f3f6fc; font-family: Arial, sans-serif; color: #1d2a44; }
    .sheet { width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff; border: 1px solid #d5def0; box-shadow: 0 10px 24px rgba(17,34,68,.12); padding: 18mm 16mm; box-sizing: border-box; }
    h1 { margin: 0 0 8px; font-size: 24px; color: #173b7a; }
    .meta { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 8px 14px; margin: 14px 0 18px; font-size: 13px; }
    .meta div { border: 1px solid #e1e8f5; border-radius: 8px; padding: 8px 10px; background: #f8fbff; }
    .label { color: #5f7397; font-weight: 700; display: block; margin-bottom: 4px; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; }
    .content { border: 1px solid #dbe4f3; border-radius: 10px; padding: 14px; line-height: 1.6; white-space: pre-wrap; }
    .foot { margin-top: 18px; color: #60749a; font-size: 12px; }
    .toolbar { width: 210mm; margin: 0 auto 12px; display: flex; justify-content: flex-end; gap: 8px; }
    button { border: 1px solid #c7d6f4; background: #fff; color: #214d95; padding: 8px 12px; border-radius: 8px; cursor: pointer; font-weight: 600; }
    @media print {
      body { background: #fff; padding: 0; }
      .toolbar { display: none; }
      .sheet { width: auto; min-height: auto; margin: 0; border: 0; box-shadow: none; padding: 12mm; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button type="button" id="print-announcement-btn">Print / Save PDF</button>
  </div>
  <section class="sheet">
    <h1>${details.title || '-'}</h1>
    <div class="meta">
      <div><span class="label">Scope</span>${details.departmentId ? 'Department' : 'Company'}</div>
      <div><span class="label">Type</span>${details.filterType || '-'}</div>
      <div><span class="label">Priority</span>${details.priority || '-'}</div>
      <div><span class="label">Created On</span>${formatDate(details.createdAt)}</div>
    </div>
    <div class="content">${details.message || '-'}</div>
    <div class="foot">Generated from Employee Portal Announcements</div>
  </section>
</body>
<script>
  document.getElementById('print-announcement-btn')?.addEventListener('click', () => window.print())
</script>
</html>`

      const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
      const previewUrl = URL.createObjectURL(blob)
      const win = window.open(previewUrl, '_blank', 'noopener,noreferrer')
      if (!win) {
        URL.revokeObjectURL(previewUrl)
        showMessage(setError, 'Popup blocked. Please allow popups to view announcement PDF.')
        return
      }
      setTimeout(() => URL.revokeObjectURL(previewUrl), 10000)

      if (!row.read) {
        await markEmployeeAnnouncementRead(row.id)
        await loadAnnouncements()
      }
    } catch (err) {
      showMessage(setError, err?.response?.data?.message || err?.message || 'Failed to load announcement details')
    }
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
            showEditAction={false}
            showDeleteAction={false}
            onView={openDetails}
          />
        )}
      </div>
    </section>
  )
}

export default EmployeeAnnouncementsPage
