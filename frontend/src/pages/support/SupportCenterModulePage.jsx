import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import DataTable from '../../components/ui/DataTable'
import SearchBar from '../../components/ui/SearchBar'
import FilterDropdown from '../../components/ui/FilterDropdown'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import FormInput from '../../components/ui/FormInput'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import {
  addInternalNote,
  addTicketMessage,
  assignSupportTicket,
  createSupportAgent,
  createSupportTicket,
  createTicketCategory,
  listSupportAgents,
  listSupportTickets,
  listTicketCategories,
  listTicketMessages,
  resolveSupportTicket,
  updateSupportTicket,
  updateTicketPriority,
  updateTicketSla
} from '../../api/supportCenterApi'

const sectionByPage = {
  'Ticket Dashboard': 'support-ticket-section',
  'Open Tickets': 'support-ticket-section',
  'Closed Tickets': 'support-ticket-section',
  'Escalated Tickets': 'support-ticket-section',
  'Resolution Tracking': 'support-ticket-section',
  'Ticket Categories': 'support-category-section',
  'Assign Support Agent': 'support-assignment-section',
  'Priority Management': 'support-assignment-section',
  'SLA Tracking': 'support-assignment-section',
  'Ticket Chat': 'support-chat-section',
  'File Attachments': 'support-chat-section',
  'Internal Notes': 'support-chat-section'
}

function SupportCenterModulePage({ page }) {
  const [tickets, setTickets] = useState([])
  const [categories, setCategories] = useState([])
  const [agents, setAgents] = useState([])
  const [messages, setMessages] = useState([])
  const [selectedTicketId, setSelectedTicketId] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ type: '', message: '' })
  const [ticketModal, setTicketModal] = useState(false)
  const [ticketForm, setTicketForm] = useState({ subject: '', description: '', status: 'open', priority: 'medium', category: '', assignedAgent: '' })
  const [messageText, setMessageText] = useState('')
  const [noteText, setNoteText] = useState('')

  const toastError = (message) => setToast({ type: 'error', message })
  const toastOk = (message) => setToast({ type: 'success', message })

  const loadBase = async () => {
    setLoading(true)
    try {
      const [tRes, cRes, aRes] = await Promise.all([
        listSupportTickets({ page: pagination.page, limit: pagination.limit, search, status: statusFilter }),
        listTicketCategories(),
        listSupportAgents()
      ])
      setTickets(tRes.items)
      setPagination(tRes.pagination)
      setCategories(cRes.items)
      setAgents(aRes.items)
    } catch (error) {
      toastError(error?.response?.data?.message || 'Failed loading support center data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadBase(); /* eslint-disable-next-line */ }, [pagination.page, search, statusFilter])
  useEffect(() => { if (selectedTicketId) listTicketMessages(selectedTicketId).then((r) => setMessages(r.items || [])).catch(() => setMessages([])) }, [selectedTicketId])

  useEffect(() => {
    if (!page || !sectionByPage[page]) return
    const timer = setTimeout(() => {
      const element = document.getElementById(sectionByPage[page])
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
    return () => clearTimeout(timer)
  }, [page])

  const cols = [{ key: 'ticketNo', label: 'Ticket' }, { key: 'subject', label: 'Subject' }, { key: 'category', label: 'Category' }, { key: 'assignedAgent', label: 'Agent' }, { key: 'priority', label: 'Priority' }, { key: 'status', label: 'Status' }, { key: 'sla', label: 'SLA' }]
  const rows = useMemo(() => tickets.map((t) => ({ id: t._id, ticketNo: t.ticketNo, subject: t.subject, category: t.category?.name || '-', assignedAgent: t.assignedAgent?.name || '-', priority: t.priority, status: t.status, sla: t.slaDueAt ? new Date(t.slaDueAt).toLocaleString() : '-' })), [tickets])

  const filteredRows = useMemo(() => {
    if (page === 'Open Tickets') return rows.filter((r) => r.status === 'open')
    if (page === 'Closed Tickets') return rows.filter((r) => r.status === 'closed')
    if (page === 'Escalated Tickets') return rows.filter((r) => r.status === 'escalated')
    return rows
  }, [rows, page])

  const saveTicket = async () => {
    if (!ticketForm.subject) return toastError('Ticket subject is required')
    try {
      if (selectedTicketId) {
        await updateSupportTicket(selectedTicketId, ticketForm)
        toastOk('Ticket updated')
      } else {
        await createSupportTicket(ticketForm)
        toastOk('Ticket created')
      }
      setTicketModal(false)
      setSelectedTicketId('')
      setTicketForm({ subject: '', description: '', status: 'open', priority: 'medium', category: '', assignedAgent: '' })
      loadBase()
    } catch (error) {
      toastError(error?.response?.data?.message || 'Failed to save ticket')
    }
  }

  const openEdit = (row) => {
    const t = tickets.find((x) => x._id === row.id)
    setSelectedTicketId(row.id)
    setTicketForm({ subject: t.subject, description: t.description || '', status: t.status, priority: t.priority, category: t.category?._id || '', assignedAgent: t.assignedAgent?._id || '' })
    setTicketModal(true)
  }

  const renderTicketTable = () => (
    <>
      <div className="panel filters-panel"><div className="filters-row"><div className="search-wrap"><label>Search</label><SearchBar value={search} onChange={setSearch} placeholder="Search tickets" /></div><FilterDropdown label="Status" value={statusFilter} onChange={setStatusFilter} options={[{ value: 'all', label: 'All' }, { value: 'open', label: 'Open' }, { value: 'closed', label: 'Closed' }, { value: 'escalated', label: 'Escalated' }]} /></div></div>
      <div className="panel"><div className="panel-head"><h3>{page}</h3><Button onClick={() => { setSelectedTicketId(''); setTicketModal(true) }}>Create Ticket</Button></div>{loading ? <LoadingSkeleton rows={6} /> : <DataTable columns={cols} rows={filteredRows} onView={(row) => setSelectedTicketId(row.id)} onEdit={openEdit} showDeleteAction={false} />}{!loading && filteredRows.length === 0 ? <EmptyState title="No tickets found" /> : null}<div className="pagination-row"><Button variant="ghost" disabled={pagination.page <= 1} onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}>Prev</Button><span>Page {pagination.page} of {pagination.totalPages || 1}</span><Button variant="ghost" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}>Next</Button></div></div>
    </>
  )

  const renderAssignPrioritySla = () => (
    <div className="panel"><h3>{page}</h3><DataTable columns={cols} rows={rows} onView={(row) => setSelectedTicketId(row.id)} showEditAction={false} showDeleteAction={false} /><div className="actions-row">{rows.slice(0, 6).map((r) => <div key={r.id} className="inline-action-card"><span>{r.ticketNo}</span><div className="actions-row"><Button variant="ghost" onClick={async () => { try { const agent = agents[0]?._id || null; const res = await assignSupportTicket(r.id, agent); toastOk(res?.message || 'Assigned'); loadBase() } catch (error) { toastError(error?.response?.data?.message || 'Failed to assign ticket') } }}>Assign</Button><Button variant="ghost" onClick={async () => { try { const res = await updateTicketPriority(r.id, 'critical'); toastOk(res?.message || 'Priority updated'); loadBase() } catch (error) { toastError(error?.response?.data?.message || 'Failed to update priority') } }}>Set Critical</Button><Button variant="ghost" onClick={async () => { try { const due = new Date(Date.now() + 24*60*60*1000).toISOString(); const res = await updateTicketSla(r.id, due); toastOk(res?.message || 'SLA updated'); loadBase() } catch (error) { toastError(error?.response?.data?.message || 'Failed to update SLA') } }}>Set SLA +24h</Button></div></div>)}</div></div>
  )

  const renderChat = () => {
    const current = tickets.find((x) => x._id === selectedTicketId)
    return (
      <div className="panel">
        <h3>Ticket Chat</h3>
        <FilterDropdown label="Select Ticket" value={selectedTicketId} onChange={setSelectedTicketId} options={[{ value: '', label: 'Select ticket' }, ...tickets.map((t) => ({ value: t._id, label: `${t.ticketNo} - ${t.subject}` }))]} />
        {!selectedTicketId ? <EmptyState title="Select a ticket to open chat" /> : (
          <>
            <div className="chat-box">{messages.map((m) => <div key={m._id} className={`chat-item ${m.senderType}`}><strong>{m.senderName || m.senderType}:</strong> {m.message}</div>)}</div>
            <div className="actions-row"><FormInput label="Message" value={messageText} onChange={(e) => setMessageText(e.target.value)} /><Button onClick={async () => { if (!messageText) return; try { await addTicketMessage(selectedTicketId, { senderType: 'admin', senderName: 'Super Admin', message: messageText }); setMessageText(''); const r = await listTicketMessages(selectedTicketId); setMessages(r.items || []); toastOk('Message sent') } catch (error) { toastError(error?.response?.data?.message || 'Failed to send message') } }}>Send</Button></div>
            <div className="actions-row"><FormInput label="Internal Note" value={noteText} onChange={(e) => setNoteText(e.target.value)} /><Button variant="ghost" onClick={async () => { if (!noteText) return; try { await addInternalNote(selectedTicketId, noteText, 'Super Admin'); setNoteText(''); toastOk('Note added'); loadBase() } catch (error) { toastError(error?.response?.data?.message || 'Failed to add note') } }}>Add Note</Button></div>
            <Button variant="primary" onClick={async () => { try { const res = await resolveSupportTicket(selectedTicketId, 'Resolved from support center'); toastOk(res?.message || 'Ticket resolved'); loadBase() } catch (error) { toastError(error?.response?.data?.message || 'Failed to resolve ticket') } }}>Resolve Ticket</Button>
            <p>{current?.resolution ? `Resolution: ${current.resolution}` : ''}</p>
          </>
        )}
      </div>
    )
  }

  const renderCategoryAgent = (kind) => (
    <div className="panel"><h3>{kind === 'cat' ? 'Ticket Categories' : 'Support Agents'}</h3><div className="actions-row"><Button onClick={async () => { try { if (kind === 'cat') { const res = await createTicketCategory({ name: `Category ${Date.now()}` }); toastOk(res?.message || 'Category created') } else { const res = await createSupportAgent({ name: `Agent ${Date.now()}`, email: `agent_${Date.now()}@hrms.com` }); toastOk(res?.message || 'Agent created') } loadBase() } catch (error) { toastError(error?.response?.data?.message || 'Failed to create record') } }}>Add {kind === 'cat' ? 'Category' : 'Agent'}</Button></div><DataTable columns={kind === 'cat' ? [{ key: 'name', label: 'Name' }, { key: 'description', label: 'Description' }, { key: 'slaHours', label: 'SLA Hours' }] : [{ key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'level', label: 'Level' }, { key: 'active', label: 'Status' }]} rows={(kind === 'cat' ? categories : agents).map((x) => ({ id: x._id, name: x.name, description: x.description || '-', slaHours: x.slaHours || '-', email: x.email || '-', level: x.level || '-', active: x.active ? 'active' : 'inactive' }))} showActions={false} /></div>
  )

  const renderByPage = () => {
    switch (page) {
      case 'Ticket Dashboard':
      case 'Open Tickets':
      case 'Closed Tickets':
      case 'Escalated Tickets':
      case 'Resolution Tracking':
        return renderTicketTable()
      case 'Ticket Categories':
        return renderCategoryAgent('cat')
      case 'Assign Support Agent':
      case 'Priority Management':
      case 'SLA Tracking':
        return renderAssignPrioritySla()
      case 'Ticket Chat':
      case 'File Attachments':
      case 'Internal Notes':
        return renderChat()
      default:
        return <EmptyState title="Unknown Support Center sub-module" />
    }
  }

  const renderUnifiedPage = () => (
    <>
      <div className="panel">
        <div className="panel-head"><h3>All Support Center Controls In One Page</h3></div>
        <p>Run ticket triage, assignment, SLA workflows, category controls, and conversation handling from a single workspace.</p>
      </div>
      <div id="support-ticket-section">{renderTicketTable()}</div>
      <div id="support-category-section">{renderCategoryAgent('cat')}</div>
      <div id="support-assignment-section">{renderAssignPrioritySla()}</div>
      <div id="support-chat-section">{renderChat()}</div>
    </>
  )

  const showAllSections = true

  return (
    <section className="section-layout">
      <PageHeader
        title="Support Center"
        description="Single-page workspace for ticket lifecycle, assignment, priority/SLA, chat, and resolution."
        breadcrumb={['Super Admin', 'Support Center', showAllSections ? 'Workspace' : page]}
        primaryActionLabel="Refresh"
        onPrimaryAction={loadBase}
      />
      {toast.message ? <div className={`toast toast-${toast.type}`}>{toast.message}</div> : null}
      {showAllSections ? renderUnifiedPage() : renderByPage()}

      <Modal open={ticketModal} title={selectedTicketId ? 'Edit Ticket' : 'Create Ticket'} onClose={() => setTicketModal(false)}>
        <div className="form-grid"><FormInput label="Subject" value={ticketForm.subject} onChange={(e) => setTicketForm((p) => ({ ...p, subject: e.target.value }))} /><FormInput label="Description" value={ticketForm.description} onChange={(e) => setTicketForm((p) => ({ ...p, description: e.target.value }))} /><FilterDropdown label="Category" value={ticketForm.category} onChange={(v) => setTicketForm((p) => ({ ...p, category: v }))} options={[{ value: '', label: 'None' }, ...categories.map((c) => ({ value: c._id, label: c.name }))]} /><FilterDropdown label="Assigned Agent" value={ticketForm.assignedAgent} onChange={(v) => setTicketForm((p) => ({ ...p, assignedAgent: v }))} options={[{ value: '', label: 'Unassigned' }, ...agents.map((a) => ({ value: a._id, label: a.name }))]} /><FilterDropdown label="Priority" value={ticketForm.priority} onChange={(v) => setTicketForm((p) => ({ ...p, priority: v }))} options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' }]} /><FilterDropdown label="Status" value={ticketForm.status} onChange={(v) => setTicketForm((p) => ({ ...p, status: v }))} options={[{ value: 'open', label: 'Open' }, { value: 'closed', label: 'Closed' }, { value: 'escalated', label: 'Escalated' }]} /></div>
        <div className="actions-row"><Button variant="ghost" onClick={() => setTicketModal(false)}>Cancel</Button><Button onClick={saveTicket}>Save Ticket</Button></div>
      </Modal>
    </section>
  )
}

export default SupportCenterModulePage
