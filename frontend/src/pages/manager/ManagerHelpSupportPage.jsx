import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import SearchBar from '../../components/ui/SearchBar'
import FilterDropdown from '../../components/ui/FilterDropdown'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import { RefreshCw } from 'lucide-react'
import {
  closeManagerSupportTicket,
  createManagerSupportTicket,
  getManagerSupportFaqs,
  getManagerSupportTicketById,
  getManagerSupportTickets,
  replyManagerSupportTicket
} from '../../api/managerSupportApi'

const tabs = ['Create Support Ticket', 'My Tickets', 'Ticket Details', 'FAQ / Help Center']

function ManagerHelpSupportPage() {
  const [activeTab, setActiveTab] = useState('Create Support Ticket')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [tickets, setTickets] = useState([])
  const [faqs, setFaqs] = useState([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [toast, setToast] = useState(null)
  const [selectedTicket, setSelectedTicket] = useState(null)

  const [ticketForm, setTicketForm] = useState({
    subject: '',
    description: '',
    priority: 'medium',
    file: null
  })
  const [replyForm, setReplyForm] = useState({ message: '', file: null })

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(t)
  }, [toast])

  const loadTickets = async () => {
    const payload = await getManagerSupportTickets({ status, search })
    setTickets(payload?.data || [])
  }

  const loadFaqs = async () => {
    const payload = await getManagerSupportFaqs()
    setFaqs(payload?.data || [])
  }

  const loadAll = async () => {
    setLoading(true)
    const tasks = activeTab === 'FAQ / Help Center' ? [loadFaqs()] : [loadTickets(), loadFaqs()]
    const results = await Promise.allSettled(tasks)
    const failed = results.find((x) => x.status === 'rejected')
    if (failed) {
      setToast({ type: 'error', message: failed.reason?.response?.data?.message || 'Failed to load support data' })
    }
    setLoading(false)
  }

  useEffect(() => { loadAll() }, [status, activeTab])

  const filteredFaqs = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return faqs
    return faqs.filter((x) => `${x.question} ${x.answer} ${x.category}`.toLowerCase().includes(needle))
  }, [faqs, search])

  const openTicketDetails = async (ticketId) => {
    try {
      const payload = await getManagerSupportTicketById(ticketId)
      setSelectedTicket(payload?.data || null)
      setActiveTab('Ticket Details')
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to load ticket details' })
    }
  }

  const submitTicket = async () => {
    if (!ticketForm.subject.trim() || !ticketForm.description.trim()) {
      return setToast({ type: 'error', message: 'Subject and description are required' })
    }
    const formData = new FormData()
    formData.append('subject', ticketForm.subject)
    formData.append('description', ticketForm.description)
    formData.append('priority', ticketForm.priority)
    if (ticketForm.file) formData.append('file', ticketForm.file)

    setSubmitting(true)
    try {
      await createManagerSupportTicket(formData)
      setTicketForm({ subject: '', description: '', priority: 'medium', file: null })
      setToast({ type: 'success', message: 'Support ticket submitted' })
      setActiveTab('My Tickets')
      await loadTickets()
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to submit ticket' })
    } finally {
      setSubmitting(false)
    }
  }

  const submitReply = async () => {
    if (!selectedTicket?.id || !replyForm.message.trim()) {
      return setToast({ type: 'error', message: 'Reply message is required' })
    }
    const formData = new FormData()
    formData.append('message', replyForm.message)
    if (replyForm.file) formData.append('file', replyForm.file)

    setSubmitting(true)
    try {
      await replyManagerSupportTicket(selectedTicket.id, formData)
      setReplyForm({ message: '', file: null })
      const payload = await getManagerSupportTicketById(selectedTicket.id)
      setSelectedTicket(payload?.data || selectedTicket)
      setToast({ type: 'success', message: 'Reply submitted' })
      await loadTickets()
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to submit reply' })
    } finally {
      setSubmitting(false)
    }
  }

  const closeTicket = async () => {
    if (!selectedTicket?.id) return
    if (!window.confirm(`Close ticket ${selectedTicket.ticketNo || ''}?`)) return
    setSubmitting(true)
    try {
      await closeManagerSupportTicket(selectedTicket.id)
      const payload = await getManagerSupportTicketById(selectedTicket.id)
      setSelectedTicket(payload?.data || selectedTicket)
      setToast({ type: 'success', message: 'Ticket closed successfully' })
      await loadTickets()
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to close ticket' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="section-layout module-help-support">
      <PageHeader
        title="Help & Support"
        description="Create and track support tickets, reply to threads, and browse FAQ help center."
        breadcrumb={['Manager Portal', 'Help & Support']}
      />
      {toast ? <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>{toast.message}</div> : null}

      <div className="panel">
        <div className="workspace-nav">
          {tabs.map((tab) => (
            <button key={tab} className={`chip-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</button>
          ))}
        </div>
        <div className="filters-row admin-filters-grid" style={{ marginTop: 10 }}>
          <div className="search-wrap"><label>Search</label><SearchBar value={search} onChange={setSearch} placeholder={activeTab === 'FAQ / Help Center' ? 'Search FAQ' : 'Search tickets'} /></div>
          {activeTab !== 'FAQ / Help Center' ? (
            <FilterDropdown
              label="Status"
              value={status}
              onChange={setStatus}
              options={[{ value: 'all', label: 'All Status' }, { value: 'open', label: 'Open' }, { value: 'in-progress', label: 'In Progress' }, { value: 'closed', label: 'Closed' }]}
            />
          ) : null}
        </div>
        <div className="actions-row" style={{ marginTop: 10 }}>
          <Button variant="ghost" onClick={loadAll}>Apply Filters</Button>
          <Button variant="ghost" onClick={loadAll}><RefreshCw size={14} /> Refresh</Button>
          {activeTab !== 'Create Support Ticket' ? <Button onClick={() => setActiveTab('Create Support Ticket')}>Create Ticket</Button> : null}
        </div>
      </div>

      {activeTab === 'Create Support Ticket' ? (
        <div className="panel">
          <div className="panel-head"><h3>Create Support Ticket</h3></div>
          <div className="modal-form">
            <label className="form-input-wrap"><span>Subject</span><input className="form-input" value={ticketForm.subject} onChange={(e) => setTicketForm((p) => ({ ...p, subject: e.target.value }))} /></label>
            <label className="form-input-wrap"><span>Description</span><textarea className="form-input" rows={4} value={ticketForm.description} onChange={(e) => setTicketForm((p) => ({ ...p, description: e.target.value }))} /></label>
            <FilterDropdown
              label="Priority"
              value={ticketForm.priority}
              onChange={(value) => setTicketForm((p) => ({ ...p, priority: value }))}
              options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' }]}
            />
            <label className="form-input-wrap"><span>Attach Screenshot</span><input className="form-input" type="file" onChange={(e) => setTicketForm((p) => ({ ...p, file: e.target.files?.[0] || null }))} /></label>
            <div className="actions-row">
              <Button onClick={submitTicket} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Ticket'}</Button>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === 'My Tickets' ? (
        <div className="panel">
          <div className="panel-head"><h3>My Tickets</h3></div>
          {loading ? <LoadingSkeleton rows={8} /> : tickets.length === 0 ? <EmptyState title="No support tickets" description="Your support tickets will appear here." /> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Ticket No</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((row) => (
                    <tr key={row.id}>
                      <td>{row.ticketNo || '-'}</td>
                      <td>{row.subject || '-'}</td>
                      <td><span className={`badge badge-${row.status}`}>{row.status || '-'}</span></td>
                      <td>{row.priority || '-'}</td>
                      <td>{row.createdAt ? String(row.createdAt).slice(0, 10) : '-'}</td>
                      <td>
                        <div className="table-actions">
                          <button className="text-btn" onClick={() => openTicketDetails(row.id)}>View</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {activeTab === 'Ticket Details' ? (
        <div className="panel">
          <div className="panel-head"><h3>Ticket Details</h3></div>
          {!selectedTicket ? <EmptyState title="No ticket selected" description="Open a ticket from My Tickets to view thread details." /> : (
            <div className="modal-form">
              <div className="inline-action-card"><strong>Ticket:</strong> <span>{selectedTicket.ticketNo}</span></div>
              <div className="inline-action-card"><strong>Subject:</strong> <span>{selectedTicket.subject}</span></div>
              <div className="inline-action-card"><strong>Status:</strong> <span>{selectedTicket.status}</span></div>
              <div className="inline-action-card"><strong>Description:</strong> <span>{selectedTicket.description}</span></div>
              {selectedTicket.screenshotUrl ? <div className="inline-action-card"><strong>Attachment:</strong> <a href={selectedTicket.screenshotUrl} target="_blank" rel="noreferrer">View Attachment</a></div> : null}
              <div className="panel" style={{ padding: 10 }}>
                <div className="panel-head"><h3>Replies</h3></div>
                {(selectedTicket.messages || []).length === 0 ? <EmptyState title="No replies yet" description="Replies will appear here." /> : (selectedTicket.messages || []).map((msg) => (
                  <div key={msg.id} className="inline-action-card">
                    <div><strong>{msg.senderName || msg.senderType}:</strong> {msg.message}</div>
                    {msg.attachmentUrl ? <div><a href={msg.attachmentUrl} target="_blank" rel="noreferrer">Attachment</a></div> : null}
                  </div>
                ))}
              </div>
              <label className="form-input-wrap"><span>Reply</span><textarea className="form-input" rows={3} value={replyForm.message} onChange={(e) => setReplyForm((p) => ({ ...p, message: e.target.value }))} /></label>
              <label className="form-input-wrap"><span>Attach Screenshot</span><input className="form-input" type="file" onChange={(e) => setReplyForm((p) => ({ ...p, file: e.target.files?.[0] || null }))} /></label>
              <div className="actions-row">
                <Button onClick={submitReply} disabled={submitting}>{submitting ? 'Sending...' : 'Reply'}</Button>
                <Button variant="danger" onClick={closeTicket} disabled={submitting || String(selectedTicket.status || '').toLowerCase() === 'closed'}>Close Ticket</Button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {activeTab === 'FAQ / Help Center' ? (
        <div className="panel">
          <div className="panel-head"><h3>FAQ / Help Center</h3></div>
          {loading ? <LoadingSkeleton rows={8} /> : filteredFaqs.length === 0 ? <EmptyState title="No FAQ found" description="Try a different search keyword." /> : (
            <div className="modal-form">
              {filteredFaqs.map((faq) => (
                <div key={faq.id} className="inline-action-card">
                  <strong>{faq.question}</strong>
                  <span>{faq.answer}</span>
                </div>
              ))}
            </div>
          )}
          <div className="actions-row" style={{ marginTop: 10 }}>
            <Button variant="ghost" onClick={() => setActiveTab('Create Support Ticket')}>Submit Ticket</Button>
          </div>
        </div>
      ) : null}

    </section>
  )
}

export default ManagerHelpSupportPage
