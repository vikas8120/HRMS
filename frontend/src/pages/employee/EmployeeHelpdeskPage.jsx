import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import FilterDropdown from '../../components/ui/FilterDropdown'
import DataTable from '../../components/ui/DataTable'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import Modal from '../../components/ui/Modal'
import {
  addEmployeeTicketMessage,
  closeEmployeeTicket,
  createEmployeeTicket,
  getEmployeeTicketById,
  getEmployeeTicketCategories,
  getEmployeeTickets,
  reopenEmployeeTicket
} from '../../api/employeeTicketApi'

const statusOptions = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'pending', label: 'Pending' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' }
]

const resolveFileHref = (fileUrl) => {
  const url = String(fileUrl || '').trim()
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  const apiRoot = import.meta.env.VITE_API_URL || 'http://localhost:5001'
  const origin = apiRoot.replace(/\/$/, '')
  return `${origin}${url}`
}

function EmployeeHelpdeskPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [status, setStatus] = useState('all')
  const [category, setCategory] = useState('all')

  const [tickets, setTickets] = useState([])
  const [categories, setCategories] = useState([])

  const [createOpen, setCreateOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [selected, setSelected] = useState(null)

  const [ticketForm, setTicketForm] = useState({ subject: '', description: '', category: '', priority: 'medium', file: null })
  const [replyForm, setReplyForm] = useState({ message: '', file: null })
  const [submitting, setSubmitting] = useState(false)

  const showMessage = (setter, message) => {
    setter(message)
    setTimeout(() => setter(''), 2600)
  }

  const loadMeta = async () => {
    try {
      const response = await getEmployeeTicketCategories()
      setCategories(response?.data || [])
      if (!ticketForm.category && response?.data?.[0]?.id) {
        setTicketForm((p) => ({ ...p, category: response.data[0].id }))
      }
    } catch (_err) {
      setCategories([])
    }
  }

  const loadTickets = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await getEmployeeTickets({ view: status, category })
      setTickets(response?.data || [])
    } catch (err) {
      setTickets([])
      setError(err?.response?.data?.message || err?.message || 'Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMeta()
  }, [])

  useEffect(() => {
    loadTickets()
  }, [status, category])

  const categoryOptions = useMemo(() => [
    { value: 'all', label: 'All Categories' },
    ...categories.map((x) => ({ value: x.id, label: x.name }))
  ], [categories])

  const rows = tickets.map((x) => ({
    ...x,
    createdAt: x.createdAt ? String(x.createdAt).slice(0, 10) : '-'
  }))

  const openDetails = async (row) => {
    setDetailsOpen(true)
    setDetailsLoading(true)
    setSelected(null)
    try {
      const response = await getEmployeeTicketById(row.id)
      setSelected(response?.data || null)
    } catch (err) {
      showMessage(setError, err?.response?.data?.message || 'Failed to load ticket details')
    } finally {
      setDetailsLoading(false)
    }
  }

  const submitTicket = async () => {
    if (!ticketForm.subject.trim() || !ticketForm.description.trim() || !ticketForm.category) {
      showMessage(setError, 'subject, description and category are required')
      return
    }

    const formData = new FormData()
    formData.append('subject', ticketForm.subject)
    formData.append('description', ticketForm.description)
    formData.append('category', ticketForm.category)
    formData.append('priority', ticketForm.priority)
    if (ticketForm.file) formData.append('file', ticketForm.file)

    setSubmitting(true)
    try {
      const response = await createEmployeeTicket(formData)
      showMessage(setSuccess, response?.message || '')
      setCreateOpen(false)
      setTicketForm({ subject: '', description: '', category: categories[0]?.id || '', priority: 'medium', file: null })
      await loadTickets()
    } catch (err) {
      showMessage(setError, err?.response?.data?.message || 'Failed to create ticket')
    } finally {
      setSubmitting(false)
    }
  }

  const submitReply = async () => {
    if (!selected?.id || !replyForm.message.trim()) {
      showMessage(setError, 'message is required')
      return
    }

    const formData = new FormData()
    formData.append('message', replyForm.message)
    if (replyForm.file) formData.append('file', replyForm.file)

    setSubmitting(true)
    try {
      const response = await addEmployeeTicketMessage(selected.id, formData)
      showMessage(setSuccess, response?.message || '')
      setReplyForm({ message: '', file: null })
      const detail = await getEmployeeTicketById(selected.id)
      setSelected(detail?.data || null)
      await loadTickets()
    } catch (err) {
      showMessage(setError, err?.response?.data?.message || 'Failed to add reply')
    } finally {
      setSubmitting(false)
    }
  }

  const closeTicket = async () => {
    if (!selected?.id) return
    setSubmitting(true)
    try {
      const response = await closeEmployeeTicket(selected.id)
      showMessage(setSuccess, response?.message || '')
      const detail = await getEmployeeTicketById(selected.id)
      setSelected(detail?.data || null)
      await loadTickets()
    } catch (err) {
      showMessage(setError, err?.response?.data?.message || 'Failed to close ticket')
    } finally {
      setSubmitting(false)
    }
  }

  const reopenTicket = async () => {
    if (!selected?.id) return
    setSubmitting(true)
    try {
      const response = await reopenEmployeeTicket(selected.id)
      showMessage(setSuccess, response?.message || '')
      const detail = await getEmployeeTicketById(selected.id)
      setSelected(detail?.data || null)
      await loadTickets()
    } catch (err) {
      showMessage(setError, err?.response?.data?.message || 'Failed to reopen ticket')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="section-layout">
      <PageHeader
        title="Employee Helpdesk"
        description="Create, track, and resolve your own support requests."
        breadcrumb={['Employee Portal', 'Helpdesk']}
        primaryActionLabel="New Ticket"
        onPrimaryAction={() => setCreateOpen(true)}
      />

      {success ? <div className="panel" style={{ borderColor: 'rgba(34,197,94,0.35)' }}>{success}</div> : null}
      {error ? <div className="panel error-banner">{error}</div> : null}

      <div className="panel">
        <div className="filters-row">
          <FilterDropdown label="Status" value={status} onChange={setStatus} options={statusOptions} />
          <FilterDropdown label="Category" value={category} onChange={setCategory} options={categoryOptions} />
          <div className="actions-row" style={{ alignSelf: 'end' }}>
            <Button variant="ghost" onClick={loadTickets}>Refresh</Button>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>My Tickets</h3></div>
        {loading ? <LoadingSkeleton rows={6} /> : rows.length === 0 ? <EmptyState title="No tickets found" description="No tickets for selected filters." /> : (
          <DataTable
            columns={[
              { key: 'ticketNo', label: 'Ticket No' },
              { key: 'subject', label: 'Subject' },
              { key: 'status', label: 'Status' },
              { key: 'priority', label: 'Priority' },
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

      <Modal open={createOpen} title="Create Ticket" onClose={() => setCreateOpen(false)}>
        <div className="modal-form">
          <label className="form-input-wrap"><span>Subject</span><input className="form-input" value={ticketForm.subject} onChange={(e) => setTicketForm((p) => ({ ...p, subject: e.target.value }))} /></label>
          <label className="form-input-wrap"><span>Description</span><textarea className="form-input" rows={4} value={ticketForm.description} onChange={(e) => setTicketForm((p) => ({ ...p, description: e.target.value }))} /></label>
          <FilterDropdown label="Category" value={ticketForm.category} onChange={(value) => setTicketForm((p) => ({ ...p, category: value }))} options={categoryOptions.filter((x) => x.value !== 'all')} />
          <FilterDropdown label="Priority" value={ticketForm.priority} onChange={(value) => setTicketForm((p) => ({ ...p, priority: value }))} options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' }]} />
          <label className="form-input-wrap"><span>Attachment (optional)</span><input className="form-input" type="file" onChange={(e) => setTicketForm((p) => ({ ...p, file: e.target.files?.[0] || null }))} /></label>
          <div className="actions-row">
            <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={submitTicket} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Ticket'}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={detailsOpen} title="Ticket Details" onClose={() => setDetailsOpen(false)}>
        {detailsLoading ? <LoadingSkeleton rows={6} /> : !selected ? <EmptyState title="No ticket details" description="Unable to load selected ticket." /> : (
          <div className="modal-form">
            <div className="inline-action-card"><strong>Ticket No:</strong> <span>{selected.ticketNo || '-'}</span></div>
            <div className="inline-action-card"><strong>Subject:</strong> <span>{selected.subject || '-'}</span></div>
            <div className="inline-action-card"><strong>Description:</strong> <span>{selected.description || '-'}</span></div>
            <div className="inline-action-card"><strong>Status:</strong> <span>{selected.status || '-'}</span></div>
            <div className="inline-action-card"><strong>Priority:</strong> <span>{selected.priority || '-'}</span></div>
            {selected.attachmentUrl ? <div className="inline-action-card"><strong>Attachment:</strong> <a href={resolveFileHref(selected.attachmentUrl)} target="_blank" rel="noreferrer">Open</a></div> : null}

            <div className="panel" style={{ padding: 10 }}>
              <div className="panel-head"><h3>Messages</h3></div>
              {(selected.messages || []).length === 0 ? <EmptyState title="No messages" description="No conversation yet." /> : (
                (selected.messages || []).map((msg) => (
                  <div key={msg.id} className="inline-action-card">
                    <div><strong>{msg.senderName || msg.senderType}:</strong> {msg.message}</div>
                    {msg.attachmentUrl ? <div><a href={resolveFileHref(msg.attachmentUrl)} target="_blank" rel="noreferrer">Attachment</a></div> : null}
                  </div>
                ))
              )}
            </div>

            <label className="form-input-wrap"><span>Reply/Update</span><textarea className="form-input" rows={3} value={replyForm.message} onChange={(e) => setReplyForm((p) => ({ ...p, message: e.target.value }))} /></label>
            <label className="form-input-wrap"><span>Attachment (optional)</span><input className="form-input" type="file" onChange={(e) => setReplyForm((p) => ({ ...p, file: e.target.files?.[0] || null }))} /></label>

            <div className="actions-row">
              <Button onClick={submitReply} disabled={submitting || String(selected.status).toLowerCase() === 'closed'}>Send Reply</Button>
              <Button variant="ghost" onClick={closeTicket} disabled={submitting || String(selected.status).toLowerCase() === 'closed'}>Close Ticket</Button>
              <Button variant="ghost" onClick={reopenTicket} disabled={submitting || String(selected.status).toLowerCase() !== 'closed'}>Reopen Ticket</Button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  )
}

export default EmployeeHelpdeskPage
