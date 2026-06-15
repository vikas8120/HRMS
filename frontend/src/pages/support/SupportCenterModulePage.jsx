import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { FolderOpen, CheckCircle2, AlertTriangle } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import DataTable from '../../components/ui/DataTable'
import SearchBar from '../../components/ui/SearchBar'
import FilterDropdown from '../../components/ui/FilterDropdown'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import FormInput from '../../components/ui/FormInput'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import { fetchCompanies } from '../../api/companyManagementApi'
import { navItems } from '../../data/dashboardData'
import {
  createSupportTicket,
  listSupportAgents,
  listSupportTickets,
  listTicketCategories,
  updateSupportTicket,
  updateTicketPriority,
  updateTicketSla
} from '../../api/supportCenterApi'
function SupportCenterModulePage({ page }) {
  const { pathname } = useLocation()
  const [tickets, setTickets] = useState([])
  const [companies, setCompanies] = useState([])
  const [categories, setCategories] = useState([])
  const [agents, setAgents] = useState([])
  const [selectedTicketId, setSelectedTicketId] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ type: '', message: '' })
  const [ticketModal, setTicketModal] = useState(false)
  const [viewOnlyMode, setViewOnlyMode] = useState(false)
  const [ticketForm, setTicketForm] = useState({ subject: '', description: '', status: 'open', priority: 'medium', category: '', assignedAgent: '', companyId: 'all', createdByCompany: '' })

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
      const companyRes = await fetchCompanies({ page: 1, limit: 500, search: '', status: 'all', plan: 'all' })
      setCompanies(companyRes?.items || [])
    } catch (error) {
      toastError(error?.response?.data?.message || 'Failed loading support center data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadBase(); /* eslint-disable-next-line */ }, [pagination.page, search, statusFilter])

  const cols = [{ key: 'ticketNo', label: 'Ticket' }, { key: 'subject', label: 'Subject' }, { key: 'category', label: 'Category' }, { key: 'assignedAgent', label: 'Agent' }, { key: 'priority', label: 'Priority' }, { key: 'status', label: 'Status' }, { key: 'sla', label: 'SLA' }]
  const rows = useMemo(() => tickets.map((t) => ({ id: t._id, ticketNo: t.ticketNo, subject: t.subject, category: t.category?.name || '-', assignedAgent: t.assignedAgent?.name || '-', priority: t.priority, status: t.status, sla: t.slaDueAt ? new Date(t.slaDueAt).toLocaleString() : '-' })), [tickets])

  const filteredRows = useMemo(() => {
    if (statusFilter === 'open') return rows.filter((r) => r.status === 'open')
    if (statusFilter === 'closed') return rows.filter((r) => r.status === 'closed')
    if (statusFilter === 'escalated') return rows.filter((r) => r.status === 'escalated')
    return rows
  }, [rows, statusFilter])

  const supportCards = useMemo(() => {
    const openCount = rows.filter((row) => row.status === 'open').length
    const closedCount = rows.filter((row) => row.status === 'closed').length
    const escalatedCount = rows.filter((row) => row.status === 'escalated').length
    return [
      { title: 'Open Tickets', value: String(openCount), trend: 'Needs attention', icon: FolderOpen, onClick: () => setStatusFilter('open') },
      { title: 'Closed Tickets', value: String(closedCount), trend: 'Resolved tickets', icon: CheckCircle2, onClick: () => setStatusFilter('closed') },
      { title: 'Escalated Tickets', value: String(escalatedCount), trend: 'High priority queue', icon: AlertTriangle, onClick: () => setStatusFilter('escalated') }
    ]
  }, [rows])
  const supportModule = navItems.find((item) => item.label === 'Support Center')
  const supportTabs = useMemo(() => ([
    {
      label: 'Ticket Queue',
      path: supportModule?.children.find((child) => child.label === 'Ticket Queue')?.path || '',
      active: true
    }
  ]), [supportModule])

  const saveTicket = async () => {
    if (!ticketForm.subject) return toastError('Ticket subject is required')
    const payload = {
      subject: ticketForm.subject,
      description: ticketForm.description,
      status: ticketForm.status,
      priority: ticketForm.priority,
      category: ticketForm.category,
      assignedAgent: ticketForm.assignedAgent,
      ...(ticketForm.companyId && ticketForm.companyId !== 'all' ? { companyId: ticketForm.companyId } : {})
    }
    try {
      if (selectedTicketId) {
        await updateSupportTicket(selectedTicketId, payload)
        toastOk('Ticket updated')
      } else {
        await createSupportTicket(payload)
        toastOk('Ticket created')
      }
      setTicketModal(false)
      setSelectedTicketId('')
      setTicketForm({ subject: '', description: '', status: 'open', priority: 'medium', category: '', assignedAgent: '', companyId: 'all', createdByCompany: '' })
      loadBase()
    } catch (error) {
      toastError(error?.response?.data?.message || 'Failed to save ticket')
    }
  }

  const openEdit = (row) => {
    const t = tickets.find((x) => x._id === row.id)
    setSelectedTicketId(row.id)
    setViewOnlyMode(false)
    setTicketForm({
      subject: t.subject,
      description: t.description || '',
      status: t.status,
      priority: t.priority,
      category: t.category?._id || '',
      assignedAgent: t.assignedAgent?._id || '',
      companyId: t.company?._id || t.companyId || 'all',
      createdByCompany: t.company?.companyName || t.companyName || companies.find((c) => (c._id || c.id) === (t.company?._id || t.companyId))?.companyName || ''
    })
    setTicketModal(true)
  }

  const openView = (row) => {
    const t = tickets.find((x) => x._id === row.id)
    setSelectedTicketId(row.id)
    setViewOnlyMode(true)
    setTicketForm({
      subject: t.subject,
      description: t.description || '',
      status: t.status,
      priority: t.priority,
      category: t.category?._id || '',
      assignedAgent: t.assignedAgent?._id || '',
      companyId: t.company?._id || t.companyId || 'all',
      createdByCompany: t.company?.companyName || t.companyName || companies.find((c) => (c._id || c.id) === (t.company?._id || t.companyId))?.companyName || ''
    })
    setTicketModal(true)
  }

  const renderTicketTable = () => (
    <>
      <div className="panel filters-panel"><div className="filters-row"><div className="search-wrap"><label>Search</label><SearchBar value={search} onChange={setSearch} placeholder="Search tickets" /></div><FilterDropdown label="Status" value={statusFilter} onChange={setStatusFilter} options={[{ value: 'all', label: 'All' }, { value: 'open', label: 'Open' }, { value: 'closed', label: 'Closed' }, { value: 'escalated', label: 'Escalated' }]} /></div></div>
      <div className="panel"><div className="panel-head"><h3>Support Tickets</h3><Button onClick={() => { setSelectedTicketId(''); setViewOnlyMode(false); setTicketForm({ subject: '', description: '', status: 'open', priority: 'medium', category: '', assignedAgent: '', companyId: 'all', createdByCompany: '' }); setTicketModal(true) }}>Create Ticket</Button></div>{loading ? <LoadingSkeleton rows={6} /> : <DataTable columns={cols} rows={filteredRows} onView={openView} onEdit={openEdit} showDeleteAction={false} />}{!loading && filteredRows.length === 0 ? <EmptyState title="No tickets found" /> : null}<div className="pagination-row"><Button variant="ghost" disabled={pagination.page <= 1} onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}>Prev</Button><span>Page {pagination.page} of {pagination.totalPages || 1}</span><Button variant="ghost" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}>Next</Button></div></div>
    </>
  )

  const renderUnifiedPage = () => (
    <>
      <div className="panel">
        <div className="panel-head"><h3>All Support Center Controls In One Page</h3></div>
        <p>Run ticket triage and resolution workflows from a single workspace.</p>
      </div>
      <div className="stats-grid premium-stats-grid">
        {supportCards.map((item) => <StatCard key={item.title} {...item} />)}
      </div>
      <div id="support-ticket-section">{renderTicketTable()}</div>
    </>
  )

  return (
    <section className="section-layout support-center-page">
      <PageHeader
        title="Support Center"
        description="Single-page workspace for ticket lifecycle, assignment, priority/SLA, chat, and resolution."
        breadcrumb={['Super Admin', 'Support Center', 'Workspace']}
        primaryActionLabel="Refresh"
        onPrimaryAction={loadBase}
      />
      {toast.message ? <div className={`toast toast-${toast.type}`}>{toast.message}</div> : null}

      <div className="workspace-nav support-workspace-nav" aria-label="Support center navigation">
        {supportTabs.map((tab) => (
          <NavLink
            key={tab.label}
            to={tab.path || pathname}
            className={({ isActive }) => `workspace-nav-chip ${isActive || tab.active ? 'active' : ''}`}
          >
            {tab.label.toUpperCase()}
          </NavLink>
        ))}
      </div>

      {renderUnifiedPage()}

      <Modal
        open={ticketModal}
        title={viewOnlyMode ? 'View Ticket' : selectedTicketId ? 'Edit Ticket' : 'Create Ticket'}
        onClose={() => setTicketModal(false)}
        modalClassName="support-ticket-modal"
        bodyClassName="support-ticket-modal-body"
      >
        {viewOnlyMode ? (
          <div className="ticket-view-grid">
            <div className="ticket-view-field"><span>Subject</span><p>{ticketForm.subject || '-'}</p></div>
            <div className="ticket-view-field"><span>Description</span><p>{ticketForm.description || '-'}</p></div>
            <div className="ticket-view-field"><span>Company</span><p>{ticketForm.companyId === 'all' ? 'All Companies' : (companies.find((c) => (c._id || c.id) === ticketForm.companyId)?.companyName || 'Selected Company')}</p></div>
            <div className="ticket-view-field"><span>Ticket Created By</span><p>{ticketForm.createdByCompany || (ticketForm.companyId === 'all' ? 'All Companies' : (companies.find((c) => (c._id || c.id) === ticketForm.companyId)?.companyName || '-'))}</p></div>
            <div className="ticket-view-field"><span>Category</span><p>{categories.find((c) => c._id === ticketForm.category)?.name || 'None'}</p></div>
            <div className="ticket-view-field"><span>Assigned Agent</span><p>{agents.find((a) => a._id === ticketForm.assignedAgent)?.name || 'Unassigned'}</p></div>
            <div className="ticket-view-field"><span>Priority</span><p>{ticketForm.priority || '-'}</p></div>
            <div className="ticket-view-field"><span>Status</span><p>{ticketForm.status || '-'}</p></div>
          </div>
        ) : (
          <div className="form-grid"><FormInput label="Subject" value={ticketForm.subject} onChange={(e) => setTicketForm((p) => ({ ...p, subject: e.target.value }))} /><FormInput label="Description" value={ticketForm.description} onChange={(e) => setTicketForm((p) => ({ ...p, description: e.target.value }))} /><FilterDropdown label="Company" value={ticketForm.companyId} onChange={(v) => setTicketForm((p) => ({ ...p, companyId: v }))} options={[{ value: 'all', label: 'All Companies' }, ...companies.map((company) => ({ value: company._id || company.id, label: company.companyName }))]} /><FilterDropdown label="Category" value={ticketForm.category} onChange={(v) => setTicketForm((p) => ({ ...p, category: v }))} options={[{ value: '', label: 'None' }, ...categories.map((c) => ({ value: c._id, label: c.name }))]} /><FilterDropdown label="Assigned Agent" value={ticketForm.assignedAgent} onChange={(v) => setTicketForm((p) => ({ ...p, assignedAgent: v }))} options={[{ value: '', label: 'Unassigned' }, ...agents.map((a) => ({ value: a._id, label: a.name }))]} /><FilterDropdown label="Priority" value={ticketForm.priority} onChange={(v) => setTicketForm((p) => ({ ...p, priority: v }))} options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' }]} /><FilterDropdown label="Status" value={ticketForm.status} onChange={(v) => setTicketForm((p) => ({ ...p, status: v }))} options={[{ value: 'open', label: 'Open' }, { value: 'closed', label: 'Closed' }, { value: 'escalated', label: 'Escalated' }]} /></div>
        )}
        <div className="actions-row"><Button variant="ghost" onClick={() => setTicketModal(false)}>{viewOnlyMode ? 'Close' : 'Cancel'}</Button>{!viewOnlyMode ? <Button onClick={saveTicket}>Save Ticket</Button> : null}</div>
      </Modal>
    </section>
  )
}

export default SupportCenterModulePage




