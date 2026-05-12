import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import DataTable from '../../components/ui/DataTable'
import SearchBar from '../../components/ui/SearchBar'
import FilterDropdown from '../../components/ui/FilterDropdown'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import FormInput from '../../components/ui/FormInput'
import EmptyState from '../../components/ui/EmptyState'
import {
  bulkExportUsers,
  bulkImportUsers,
  createGlobalUser,
  forceLogoutUser,
  getActiveSessions,
  getDeviceTracking,
  getFailedAttempts,
  getLoginHistory,
  listGlobalUsers,
  updateGlobalUser,
  updateGlobalUserStatus
} from '../../api/globalUsersApi'

const sectionByPage = {
  'User Directory': 'global-users-directory-section',
  'User Search': 'global-users-directory-section',
  'Bulk Import': 'global-users-directory-section',
  'Bulk Export': 'global-users-directory-section',
  'User Status': 'global-users-status-section',
  'Block User': 'global-users-status-section',
  'Unlock User': 'global-users-status-section',
  'Force Logout': 'global-users-status-section',
  'User Login History': 'global-users-login-history-section',
  'Active Sessions': 'global-users-sessions-section',
  'Failed Login Attempts': 'global-users-failed-attempts-section',
  'User Device Tracking': 'global-users-device-section'
}

function GlobalUsersModulePage({ page }) {
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ type: '', message: '' })
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState('')
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'EMPLOYEE', status: 'active' })

  const [sessions, setSessions] = useState([])
  const [attempts, setAttempts] = useState([])
  const [devices, setDevices] = useState([])

  const toastError = (message) => setToast({ type: 'error', message })
  const toastOk = (message) => setToast({ type: 'success', message })

  const loadUsers = async () => {
    setLoading(true)
    try {
      const res = await listGlobalUsers({ page: pagination.page, limit: pagination.limit, search, status: statusFilter })
      setUsers(res.items)
      setPagination(res.pagination)
    } catch (error) {
      toastError(error?.response?.data?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsers(); /* eslint-disable-next-line */ }, [pagination.page, search, statusFilter])

  useEffect(() => {
    getLoginHistory().then((r) => setAttempts(r.items || [])).catch(() => setAttempts([]))
    getActiveSessions().then((r) => setSessions(r.items || [])).catch(() => setSessions([]))
    getDeviceTracking().then((r) => setDevices(r.items || [])).catch(() => setDevices([]))
  }, [])

  useEffect(() => {
    if (!page || !sectionByPage[page]) return
    const timer = setTimeout(() => {
      const element = document.getElementById(sectionByPage[page])
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
    return () => clearTimeout(timer)
  }, [page])

  const userCols = [{ key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' }, { key: 'company', label: 'Company' }, { key: 'role', label: 'Role' }, { key: 'status', label: 'Status' }, { key: 'lastLogin', label: 'Last Login' }]
  const userRows = useMemo(() => users.map((u) => ({ id: u._id, name: u.name, email: u.email, phone: u.phone || '-', company: u.company?.companyName || '-', role: u.role, status: u.status, lastLogin: u.lastLogin ? new Date(u.lastLogin).toLocaleString() : '-' })), [users])

  const loginCols = [{ key: 'user', label: 'User' }, { key: 'email', label: 'Email' }, { key: 'ipAddress', label: 'IP' }, { key: 'device', label: 'Device' }, { key: 'success', label: 'Status' }, { key: 'dateTime', label: 'Date/Time' }]
  const loginRows = attempts.map((a) => ({ id: a._id, user: a.user?.name || '-', email: a.email || a.user?.email || '-', ipAddress: a.ipAddress || '-', device: a.device || '-', success: a.success ? 'active' : 'failed', dateTime: new Date(a.dateTime).toLocaleString() }))

  const sessionCols = [{ key: 'user', label: 'User' }, { key: 'email', label: 'Email' }, { key: 'ipAddress', label: 'IP' }, { key: 'device', label: 'Device' }, { key: 'active', label: 'Status' }, { key: 'loggedInAt', label: 'Login At' }]
  const sessionRows = sessions.map((s) => ({ id: s._id, user: s.user?.name || '-', email: s.user?.email || '-', ipAddress: s.ipAddress || '-', device: s.device || '-', active: s.active ? 'active' : 'inactive', loggedInAt: new Date(s.loggedInAt).toLocaleString() }))

  const deviceCols = [{ key: 'user', label: 'User' }, { key: 'deviceType', label: 'Device' }, { key: 'os', label: 'OS' }, { key: 'browser', label: 'Browser' }, { key: 'ipAddress', label: 'IP' }, { key: 'dateTime', label: 'Date/Time' }]
  const deviceRows = devices.map((d) => ({ id: d._id, user: d.user?.name || '-', deviceType: d.deviceType || '-', os: d.os || '-', browser: d.browser || '-', ipAddress: d.ipAddress || '-', dateTime: new Date(d.dateTime).toLocaleString() }))

  const saveUser = async () => {
    if (!form.name || !form.email) return toastError('Name and email are required')
    try {
      if (editId) await updateGlobalUser(editId, form)
      else await createGlobalUser(form)
      toastOk(editId ? 'User updated' : 'User created')
      setModalOpen(false)
      setEditId('')
      setForm({ name: '', email: '', phone: '', role: 'EMPLOYEE', status: 'active' })
      loadUsers()
    } catch (error) {
      toastError(error?.response?.data?.message || 'Failed to save user')
    }
  }

  const renderDirectory = () => (
    <>
      <div className="panel filters-panel"><div className="filters-row"><div className="search-wrap"><label>Search</label><SearchBar value={search} onChange={setSearch} placeholder="Search by name/email" /></div><FilterDropdown label="Status" value={statusFilter} onChange={setStatusFilter} options={[{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'blocked', label: 'Blocked' }, { value: 'inactive', label: 'Inactive' }]} /></div></div>
      <div className="panel"><div className="panel-head"><h3>Users</h3><div className="actions-row"><Button onClick={() => setModalOpen(true)}>Add User</Button><Button variant="ghost" onClick={async () => { const data = await bulkExportUsers(); toastOk(`Exported ${data.items.length} users`) }}>Bulk Export</Button><Button variant="ghost" onClick={async () => { const sample = [{ name: 'Bulk User 1', email: `bulk1_${Date.now()}@hrms.com`, status: 'active' }, { name: 'Bulk User 2', email: `bulk2_${Date.now()}@hrms.com`, status: 'inactive' }]; const res = await bulkImportUsers(sample); toastOk(`Imported ${res.count} users`); loadUsers() }}>Bulk Import</Button></div></div><DataTable columns={userCols} rows={userRows} onView={() => {}} onEdit={(row) => { const u = users.find((x) => x._id === row.id); setEditId(row.id); setForm({ name: u.name, email: u.email, phone: u.phone || '', role: u.role || 'EMPLOYEE', status: u.status || 'active' }); setModalOpen(true) }} onDelete={async (row) => { await updateGlobalUserStatus(row.id, 'blocked'); toastOk('User blocked'); loadUsers() }} /><div className="pagination-row"><Button variant="ghost" disabled={pagination.page <= 1} onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}>Prev</Button><span>Page {pagination.page} of {pagination.totalPages || 1}</span><Button variant="ghost" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}>Next</Button></div></div>
    </>
  )

  const renderStatusActions = () => (
    <div className="panel"><h3>User Status Actions</h3><DataTable columns={userCols} rows={userRows} onView={() => {}} onEdit={() => {}} onDelete={() => {}} /><div className="actions-row">{userRows.slice(0,5).map((u) => <div key={u.id} className="inline-action-card"><span>{u.name}</span><div className="actions-row"><Button variant="danger" onClick={async () => { await updateGlobalUserStatus(u.id, 'blocked'); toastOk('Blocked'); loadUsers() }}>Block</Button><Button onClick={async () => { await updateGlobalUserStatus(u.id, 'active'); toastOk('Unlocked'); loadUsers() }}>Unlock</Button><Button variant="ghost" onClick={async () => { await forceLogoutUser(u.id); toastOk('Forced logout') }}>Force Logout</Button></div></div>)}</div></div>
  )

  const renderLoginHistory = () => (
    <div className="panel"><h3>User Login History</h3><DataTable columns={loginCols} rows={loginRows} onView={() => {}} onEdit={() => {}} onDelete={() => {}} /></div>
  )

  const renderActiveSessions = () => (
    <div className="panel"><h3>Active Sessions</h3><DataTable columns={sessionCols} rows={sessionRows} onView={() => {}} onEdit={() => {}} onDelete={() => {}} /></div>
  )

  const renderFailedAttempts = () => (
    <div className="panel"><h3>Failed Login Attempts</h3><DataTable columns={loginCols} rows={loginRows.filter((x) => x.success === 'failed')} onView={() => {}} onEdit={() => {}} onDelete={() => {}} /></div>
  )

  const renderDeviceTracking = () => (
    <div className="panel"><h3>User Device Tracking</h3><DataTable columns={deviceCols} rows={deviceRows} onView={() => {}} onEdit={() => {}} onDelete={() => {}} /></div>
  )

  const renderByPage = () => {
    switch (page) {
      case 'User Directory':
      case 'User Search':
      case 'Bulk Import':
      case 'Bulk Export':
        return renderDirectory()
      case 'User Status':
      case 'Block User':
      case 'Unlock User':
      case 'Force Logout':
        return renderStatusActions()
      case 'User Login History':
        return renderLoginHistory()
      case 'Active Sessions':
        return renderActiveSessions()
      case 'Failed Login Attempts':
        return renderFailedAttempts()
      case 'User Device Tracking':
        return renderDeviceTracking()
      default:
        return <EmptyState title="Unknown Global Users sub-module" />
    }
  }

  const renderUnifiedPage = () => (
    <>
      <div className="panel">
        <div className="panel-head"><h3>All Global Users Controls In One Page</h3></div>
        <p>Handle user directory, status actions, session/security visibility, device tracking, and bulk operations in one workspace.</p>
      </div>
      <div id="global-users-directory-section">{renderDirectory()}</div>
      <div id="global-users-status-section">{renderStatusActions()}</div>
      <div id="global-users-login-history-section">{renderLoginHistory()}</div>
      <div id="global-users-sessions-section">{renderActiveSessions()}</div>
      <div id="global-users-failed-attempts-section">{renderFailedAttempts()}</div>
      <div id="global-users-device-section">{renderDeviceTracking()}</div>
    </>
  )

  const showAllSections = true

  return (
    <section className="section-layout">
      <PageHeader
        title="Global Users"
        description="Single-page workspace for user lifecycle, sessions, device logs, and security operations."
        breadcrumb={['Super Admin', 'Global Users', showAllSections ? 'Workspace' : page]}
        primaryActionLabel="Refresh"
        onPrimaryAction={loadUsers}
      />
      {toast.message ? <div className={`toast toast-${toast.type}`}>{toast.message}</div> : null}
      {showAllSections ? renderUnifiedPage() : renderByPage()}
      <Modal open={modalOpen} title={editId ? 'Edit User' : 'Add User'} onClose={() => setModalOpen(false)}>
        <div className="form-grid"><FormInput label="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /><FormInput label="Email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} /><FormInput label="Phone" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} /><FormInput label="Role" value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} /><FilterDropdown label="Status" value={form.status} onChange={(v) => setForm((p) => ({ ...p, status: v }))} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'blocked', label: 'Blocked' }]} /></div>
        <div className="actions-row"><Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={saveUser}>Save</Button></div>
      </Modal>
    </section>
  )
}

export default GlobalUsersModulePage
