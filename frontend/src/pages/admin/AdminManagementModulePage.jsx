import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import PageHeader from '../../components/ui/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import FormInput from '../../components/ui/FormInput'
import FilterDropdown from '../../components/ui/FilterDropdown'
import SearchBar from '../../components/ui/SearchBar'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import {
  assignCompanies,
  assignRoleToAdmin,
  createAdmin,
  createRole,
  deleteAdmin,
  fetchAccessLogs,
  fetchActivityLogs,
  fetchAdmins,
  fetchRoles,
  fetchTenantCompanies,
  getAdminById,
  resetAdminPassword,
  updateAdmin,
  updateAdminStatus,
  updateRolePermissions
} from '../../api/adminManagementApi'

const defaultPermissions = [
  { module: 'Admin Management', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { module: 'Company Management', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { module: 'Support Center', view: true, create: false, edit: false, delete: false, approve: false, export: false }
]

const sectionByPage = {
  'Admin Management': 'admin-list-section',
  'Admin List': 'admin-list-section',
  'Add Admin': 'admin-list-section',
  'Edit Admin': 'admin-list-section',
  'Assign Companies': 'assign-companies-section',
  'Reset Password': 'reset-password-section',
  'Admin Access Logs': 'admin-access-logs-section',
  'Admin Activity Tracking': 'admin-activity-logs-section',
  'Account Lock/Unlock': 'account-lock-section',
  'Role Assignment': 'role-assignment-section',
  'Permission Control': 'permission-control-section'
}

const adminModuleRoot = '/super-admin/admin-management'
const adminWorkspaceItems = [
  { label: 'Admin Management', path: `${adminModuleRoot}/admin-management` },
  { label: 'Reset Password', path: `${adminModuleRoot}/reset-password` },
  { label: 'Account Lock/Unlock', path: `${adminModuleRoot}/account-lock-unlock` },
  { label: 'Admin Activity Tracking', path: `${adminModuleRoot}/admin-activity-tracking` }
]
function AdminManagementModulePage({ page }) {
  const { pathname } = useLocation()
  const [admins, setAdmins] = useState([])
  const [companies, setCompanies] = useState([])
  const [roles, setRoles] = useState([])
  const [accessLogs, setAccessLogs] = useState([])
  const [activityLogs, setActivityLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ type: '', message: '' })

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [companyFilter, setCompanyFilter] = useState('all')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })

  const [selectedAdminId, setSelectedAdminId] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [adminToDelete, setAdminToDelete] = useState(null)

  const [addEditForm, setAddEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    companyId: '',
    status: 'active'
  })

  const [assignCompaniesForm, setAssignCompaniesForm] = useState({ adminId: '', companyIds: [] })
  const [resetPasswordForm, setResetPasswordForm] = useState({ adminId: '', password: '', confirmPassword: '' })
  const [roleAssignmentForm, setRoleAssignmentForm] = useState({ adminId: '', role: '' })
  const [permissionRoleId, setPermissionRoleId] = useState('')
  const [permissionRows, setPermissionRows] = useState(defaultPermissions)
  const [newRoleName, setNewRoleName] = useState('')

  const setSuccess = (message) => setToast({ type: 'success', message })
  const setError = (message) => setToast({ type: 'error', message })
  const setInfo = (message) => setToast({ type: 'success', message })

  const loadBaseData = async () => {
    setLoading(true)
    try {
      const [adminsRes, companiesRes, rolesRes] = await Promise.all([
        fetchAdmins({ page: pagination.page, limit: pagination.limit, search, status: statusFilter, company: companyFilter }),
        fetchTenantCompanies(),
        fetchRoles()
      ])
      setAdmins(adminsRes?.items || [])
      setPagination(adminsRes?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 })
      setCompanies(companiesRes.companies || [])
      setRoles(rolesRes?.items || [])
    } catch (error) {
      setError(error?.response?.data?.message || 'Failed to load admin management data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBaseData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, search, statusFilter, companyFilter])

  useEffect(() => {
    fetchAccessLogs().then((res) => setAccessLogs(res.items)).catch(() => setAccessLogs([]))
    fetchActivityLogs().then((res) => setActivityLogs(res.items)).catch(() => setActivityLogs([]))
  }, [])

  useEffect(() => {
    if (page === 'Account Lock/Unlock') {
      setSearch('')
      setStatusFilter('all')
      setCompanyFilter('all')
      setPagination((prev) => ({ ...prev, page: 1 }))
    }
  }, [page])

  useEffect(() => {
    if (!page || !sectionByPage[page]) return
    const id = sectionByPage[page]
    const timer = setTimeout(() => {
      const element = document.getElementById(id)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 50)
    return () => clearTimeout(timer)
  }, [page])

  useEffect(() => {
    if (page === 'Add Admin') {
      openAdd()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const adminColumns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'assignedCompany', label: 'Assigned Company' },
    { key: 'role', label: 'Role' },
    { key: 'status', label: 'Status' },
    { key: 'lastLogin', label: 'Last Login' }
  ]

  const adminRows = useMemo(
    () =>
      admins.map((admin) => ({
        id: admin.id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        assignedCompany: admin.companyName || '-',
        role: admin.role,
        status: admin.status,
        lastLogin: admin.lastLogin ? new Date(admin.lastLogin).toLocaleString() : '-'
      })),
    [admins]
  )

  const validateAddEdit = (isEdit) => {
    if (!addEditForm.name || !addEditForm.email || !addEditForm.phone || !addEditForm.companyId) {
      setError('Please fill all required fields')
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(addEditForm.email)) {
      setError('Invalid email format')
      return false
    }

    if (!isEdit) {
      if (!addEditForm.password) {
        setError('Password is required')
        return false
      }
      if (addEditForm.password !== addEditForm.confirmPassword) {
        setError('Passwords do not match')
        return false
      }
    }

    return true
  }

  const openAdd = () => {
    setSelectedAdminId('')
    setAddEditForm({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      companyId: '',
      status: 'active'
    })
    setModalOpen(true)
  }

  const openEdit = async (row) => {
    try {
      const res = await getAdminById(row.id)
      const item = res.item
      setSelectedAdminId(item.id)
      setAddEditForm({
        name: item.name,
        email: item.email,
        phone: item.phone,
        password: '',
        confirmPassword: '',
        companyId: item.companyId || '',
        status: item.status
      })
      setModalOpen(true)
    } catch (error) {
      setError(error?.response?.data?.message || 'Failed to load admin details')
    }
  }

  const saveAddEdit = async () => {
    const isEdit = Boolean(selectedAdminId)
    if (!validateAddEdit(isEdit)) return

    try {
      if (isEdit) {
        await updateAdmin(selectedAdminId, {
          name: addEditForm.name,
          phone: addEditForm.phone,
          companyId: addEditForm.companyId,
          status: addEditForm.status
        })
        setSuccess('Admin updated successfully')
      } else {
        await createAdmin({
          name: addEditForm.name,
          email: addEditForm.email,
          phone: addEditForm.phone,
          password: addEditForm.password,
          companyId: addEditForm.companyId,
          status: addEditForm.status
        })
        setSuccess('Admin created successfully')
      }
      setModalOpen(false)
      setSelectedAdminId('')
      loadBaseData()
    } catch (error) {
      setError(error?.response?.data?.message || 'Failed to save admin')
    }
  }

  const handleDelete = async () => {
    if (!adminToDelete) return
    try {
      await deleteAdmin(adminToDelete.id)
      setSuccess('Admin deleted successfully')
      setConfirmDeleteOpen(false)
      setAdminToDelete(null)
      loadBaseData()
    } catch (error) {
      setError(error?.response?.data?.message || 'Failed to delete admin')
    }
  }

  const renderAdminList = () => (
    <>
      <div className="panel filters-panel">
        <div className="filters-row admin-filters-grid">
          <div className="search-wrap">
            <label>Search</label>
            <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, company" />
          </div>
          <FilterDropdown
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'suspended', label: 'Suspended' }, { value: 'locked', label: 'Locked' }]}
          />
          <FilterDropdown
            label="Company"
            value={companyFilter}
            onChange={setCompanyFilter}
            options={[{ value: 'all', label: 'All' }, ...companies.map((c) => ({ value: c._id, label: c.companyName }))]}
          />
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Company Admins</h3>
        </div>
        {loading ? (
          <LoadingSkeleton rows={8} />
        ) : (
          <>
            <DataTable
              columns={adminColumns}
              rows={adminRows}
              showViewAction={false}
              onEdit={openEdit}
              onDelete={(row) => {
                setAdminToDelete(row)
                setConfirmDeleteOpen(true)
              }}
            />
            <div className="pagination-row">
              <Button variant="ghost" disabled={pagination.page <= 1} onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}>Prev</Button>
              <span>Page {pagination.page} of {pagination.totalPages || 1}</span>
              <Button variant="ghost" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}>Next</Button>
            </div>
          </>
        )}
      </div>
    </>
  )

  const renderAddEdit = (title) => (
    <div className="panel">
      <div className="panel-head"><h3>{title}</h3>{title === 'Add Admin' ? <Button onClick={openAdd}>Add Admin</Button> : null}</div>
      <p>Use the button above to open the {title.toLowerCase()} form.</p>
      {title === 'Add Admin' ? (
        <div className="panel">
          <div className="panel filters-panel">
            <div className="filters-row admin-filters-grid">
              <div className="search-wrap">
                <label>Search</label>
                <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, company" />
              </div>
              <FilterDropdown label="Status" value={statusFilter} onChange={setStatusFilter} options={[{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'suspended', label: 'Suspended' }, { value: 'locked', label: 'Locked' }]} />
              <FilterDropdown label="Company" value={companyFilter} onChange={setCompanyFilter} options={[{ value: 'all', label: 'All' }, ...companies.map((c) => ({ value: c._id, label: c.companyName }))]} />
            </div>
          </div>
          <div className="panel">
            <div className="panel-head"><h3>Company Admins</h3></div>
            {loading ? (
              <LoadingSkeleton rows={8} />
            ) : (
              <>
                <DataTable columns={adminColumns} rows={adminRows} showViewAction={false} showEditAction={false} showDeleteAction={false} />
                <div className="pagination-row">
                  <Button variant="ghost" disabled={pagination.page <= 1} onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}>Prev</Button>
                  <span>Page {pagination.page} of {pagination.totalPages || 1}</span>
                  <Button variant="ghost" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}>Next</Button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : renderAdminList()}
    </div>
  )

  const renderAssignCompanies = () => (
    <div className="panel">
      <h3>Assign Companies</h3>
      <div className="form-grid">
        <FilterDropdown label="Select Admin" value={assignCompaniesForm.adminId} onChange={(value) => setAssignCompaniesForm((p) => ({ ...p, adminId: value }))} options={[{ value: '', label: 'Select admin' }, ...admins.map((a) => ({ value: a.id, label: `${a.name} (${a.email})` }))]} />
        <div className="multi-select-wrap">
          <label>Companies</label>
          <div className="checkbox-grid">
            {companies.map((company) => (
              <label key={company._id} className="checkbox-item">
                <input type="checkbox" checked={assignCompaniesForm.companyIds.includes(company._id)} onChange={(e) => setAssignCompaniesForm((prev) => ({ ...prev, companyIds: e.target.checked ? [...prev.companyIds, company._id] : prev.companyIds.filter((id) => id !== company._id) }))} />
                <span>{company.companyName}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      <Button onClick={async () => {
        if (!assignCompaniesForm.adminId) return setError('Select admin first')
        try {
          await assignCompanies(assignCompaniesForm.adminId, assignCompaniesForm.companyIds)
          setSuccess('Companies assigned successfully')
          loadBaseData()
        } catch (error) {
          setError(error?.response?.data?.message || 'Failed to assign companies')
        }
      }}>Save Assigned Companies</Button>
      <div className="spacer" />
      <DataTable columns={adminColumns} rows={adminRows} showViewAction={false} onEdit={openEdit} showDeleteAction={false} />
    </div>
  )

  const renderResetPassword = () => (
    <div className="panel">
      <h3>Reset Password</h3>
      {admins.length === 0 ? <EmptyState title="No admins available" description="Create an admin first, then reset password." /> : null}
      <div className="form-grid">
        <FilterDropdown label="Select Admin" value={resetPasswordForm.adminId} onChange={(value) => setResetPasswordForm((p) => ({ ...p, adminId: value }))} options={[{ value: '', label: 'Select admin' }, ...admins.map((a) => ({ value: a.id, label: `${a.name} (${a.email})` }))]} />
        <FormInput label="New Password" type="password" value={resetPasswordForm.password} onChange={(e) => setResetPasswordForm((p) => ({ ...p, password: e.target.value }))} />
        <FormInput label="Confirm Password" type="password" value={resetPasswordForm.confirmPassword} onChange={(e) => setResetPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))} />
      </div>
      <p style={{ marginTop: 8, marginBottom: 8 }}>
        <strong>Selected Admin:</strong> {admins.find((a) => a.id === resetPasswordForm.adminId)?.name || 'None'}
      </p>
      <Button disabled={!resetPasswordForm.adminId || !resetPasswordForm.password || !resetPasswordForm.confirmPassword || resetPasswordForm.password.length < 6 || resetPasswordForm.password !== resetPasswordForm.confirmPassword} onClick={async () => {
        if (!resetPasswordForm.adminId) return setError('Select admin')
        if (!resetPasswordForm.password) return setError('Password required')
        if (resetPasswordForm.password.length < 6) return setError('Password must be at least 6 characters')
        if (resetPasswordForm.password !== resetPasswordForm.confirmPassword) return setError('Passwords do not match')
        try {
          await resetAdminPassword(resetPasswordForm.adminId, resetPasswordForm.password)
          setSuccess('Password reset successfully')
          setResetPasswordForm({ adminId: '', password: '', confirmPassword: '' })
        } catch (error) {
          setError(error?.response?.data?.message || 'Failed to reset password')
        }
      }}>Update Password</Button>
    </div>
  )

  const accessLogColumns = [
    { key: 'admin', label: 'Admin' },
    { key: 'email', label: 'Email' },
    { key: 'ipAddress', label: 'IP Address' },
    { key: 'device', label: 'Device' },
    { key: 'action', label: 'Action' },
    { key: 'dateTime', label: 'Date/Time' }
  ]

  const activityLogColumns = [
    { key: 'admin', label: 'Admin' },
    { key: 'module', label: 'Module' },
    { key: 'action', label: 'Action' },
    { key: 'description', label: 'Description' },
    { key: 'dateTime', label: 'Date/Time' }
  ]

  const renderLogs = (type) => {
    const rows = (type === 'access' ? accessLogs : activityLogs).map((entry) => ({
      id: entry._id,
      admin: entry.admin?.name || '-',
      email: entry.email || entry.admin?.email || '-',
      ipAddress: entry.ipAddress || '-',
      device: entry.device || '-',
      action: entry.action,
      module: entry.module,
      description: entry.description,
      dateTime: new Date(entry.dateTime).toLocaleString()
    }))

    return (
      <div className="panel">
        <DataTable columns={type === 'access' ? accessLogColumns : activityLogColumns} rows={rows} showViewAction={false} showEditAction={false} showDeleteAction={false} />
      </div>
    )
  }

  const renderLockUnlock = () => (
    <div className="panel admin-lock-panel">
      <h3>Account Lock/Unlock</h3>
      <DataTable
        columns={adminColumns}
        rows={adminRows}
        showActions={false}
        showViewAction={false}
        showEditAction={false}
        showDeleteAction={false}
      />
      {admins.length === 0 ? <EmptyState title="No admins found" description="Create admins first to manage account status." /> : null}
      <div className="admin-lock-actions">
        {admins.map((admin) => (
          <div className="inline-action-card admin-lock-action-card" key={admin.id}>
            <span className="admin-lock-identity">{admin.name} ({admin.email})</span>
            <div className="actions-row admin-lock-action-buttons">
              <Button variant="ghost" onClick={() => updateAdminStatus(admin.id, 'locked').then(() => { setSuccess(`${admin.name} locked`); loadBaseData() }).catch((error) => setError(error?.response?.data?.message || 'Failed to lock admin'))}>Lock</Button>
              <Button variant="ghost" onClick={() => updateAdminStatus(admin.id, 'active').then(() => { setSuccess(`${admin.name} unlocked`); loadBaseData() }).catch((error) => setError(error?.response?.data?.message || 'Failed to unlock admin'))}>Unlock</Button>
              <Button variant="danger" onClick={() => updateAdminStatus(admin.id, 'suspended').then(() => { setSuccess(`${admin.name} suspended`); loadBaseData() }).catch((error) => setError(error?.response?.data?.message || 'Failed to suspend admin'))}>Suspend</Button>
              <Button onClick={() => updateAdminStatus(admin.id, 'active').then(() => { setInfo(`${admin.name} activated`); loadBaseData() }).catch((error) => setError(error?.response?.data?.message || 'Failed to activate admin'))}>Activate</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderRoleAssignment = () => (
    <div className="panel">
      <h3>Role Assignment</h3>
      {admins.length === 0 ? <EmptyState title="No admins available" description="Create an admin first, then assign a role." /> : null}
      <div className="form-grid">
        <FilterDropdown label="Select Admin" value={roleAssignmentForm.adminId} onChange={(value) => setRoleAssignmentForm((p) => ({ ...p, adminId: value }))} options={[{ value: '', label: 'Select admin' }, ...admins.map((a) => ({ value: a.id, label: `${a.name} (${a.email})` }))]} />
        <FilterDropdown label="Select Role" value={roleAssignmentForm.role} onChange={(value) => setRoleAssignmentForm((p) => ({ ...p, role: value }))} options={[{ value: '', label: 'Select role' }, ...[...new Set(['COMPANY_ADMIN', 'HR_ADMIN', ...roles.map((r) => r.name)])].map((r) => ({ value: r, label: r }))]} />
      </div>
      <p style={{ marginTop: 8, marginBottom: 8 }}>
        <strong>Selected Admin:</strong> {admins.find((a) => a.id === roleAssignmentForm.adminId)?.name || 'None'}
      </p>
      <Button disabled={!roleAssignmentForm.adminId || !roleAssignmentForm.role} onClick={async () => {
        if (!roleAssignmentForm.adminId || !roleAssignmentForm.role) return setError('Select admin and role')
        try {
          await assignRoleToAdmin(roleAssignmentForm.adminId, roleAssignmentForm.role)
          setSuccess('Role assigned successfully')
          loadBaseData()
        } catch (error) {
          setError(error?.response?.data?.message || 'Failed to assign role')
        }
      }}>Save Role</Button>
    </div>
  )

  const renderPermissionControl = () => (
    <div className="panel">
      <h3>Permission Control</h3>
      <div className="form-grid">
        <FilterDropdown
          label="Role"
          value={permissionRoleId}
          onChange={(value) => {
            setPermissionRoleId(value)
            const selected = roles.find((r) => r._id === value)
            setPermissionRows(selected?.permissions?.length ? selected.permissions : defaultPermissions)
          }}
          options={[{ value: '', label: 'Select role' }, ...roles.map((r) => ({ value: r._id, label: r.name }))]}
        />
        <FormInput
          label="Create Role"
          placeholder="Role name"
          value={newRoleName}
          onChange={(e) => setNewRoleName(e.target.value)}
        />
      </div>
      <div className="actions-row" style={{ marginBottom: 12 }}>
        <Button
          variant="ghost"
          onClick={async () => {
            const roleName = String(newRoleName || '').trim()
            if (!roleName) return setError('Enter role name first')
            try {
              await createRole({ name: roleName, permissions: defaultPermissions })
              setSuccess('Role created')
              setNewRoleName('')
              const refreshed = await fetchRoles()
              const nextRoles = refreshed?.items || []
              setRoles(nextRoles)
              const created = nextRoles.find((r) => r.name === roleName)
              if (created?._id) {
                setPermissionRoleId(created._id)
                setPermissionRows(created.permissions?.length ? created.permissions : defaultPermissions)
              }
            } catch (error) {
              setError(error?.response?.data?.message || 'Failed to create role')
            }
          }}
        >
          Create Role
        </Button>
      </div>

      {permissionRows.length === 0 ? <EmptyState title="No permissions configured" /> : (
        <div className="permission-grid">
          {permissionRows.map((perm, index) => (
            <div className="permission-card" key={`${perm.module}-${index}`}>
              <h4>{perm.module}</h4>
              {['view', 'create', 'edit', 'delete', 'approve', 'export'].map((action) => (
                <label key={action} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={Boolean(perm[action])}
                    onChange={(e) => setPermissionRows((prev) => prev.map((row, rowIndex) => rowIndex === index ? { ...row, [action]: e.target.checked } : row))}
                  />
                  <span>{action}</span>
                </label>
              ))}
            </div>
          ))}
        </div>
      )}

      <Button onClick={async () => {
        if (!permissionRoleId) return setError('Select role first')
        try {
          await updateRolePermissions(permissionRoleId, permissionRows)
          setSuccess('Permissions updated successfully')
        } catch (error) {
          setError(error?.response?.data?.message || 'Failed to update permissions')
        }
      }}>Save Permissions</Button>
    </div>
  )

  const renderAdminManagementPage = () => <div id="admin-list-section">{renderAdminList()}</div>

  const renderByPage = () => {
    switch (page) {
      case 'Admin Management':
        return renderAdminManagementPage()
      case 'Admin List':
        return renderAdminManagementPage()
      case 'Add Admin':
        return renderAddEdit('Add Admin')
      case 'Edit Admin':
        return renderAddEdit('Edit Admin')
      case 'Assign Companies':
        return renderAssignCompanies()
      case 'Reset Password':
        return renderResetPassword()
      case 'Admin Access Logs':
        return renderLogs('access')
      case 'Admin Activity Tracking':
        return renderLogs('activity')
      case 'Account Lock/Unlock':
        return renderLockUnlock()
      case 'Role Assignment':
        return renderRoleAssignment()
      case 'Permission Control':
        return renderPermissionControl()
      default:
        return renderAdminManagementPage()
    }
  }

  return (
    <section className="section-layout admin-management-page">
      <PageHeader
        title="Admin Management"
        description="Single-page control center for admins, security, logs, role assignment, and permissions."
        breadcrumb={['Super Admin', 'Admin Management', page || 'Admin Management']}
        primaryActionLabel="Add Admin"
        onPrimaryAction={openAdd}
      />
      <div className="workspace-subnav admin-workspace-subnav" aria-label="Admin module navigation">
        {adminWorkspaceItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `workspace-nav-chip ${isActive || pathname.startsWith(`${item.path}/`) ? 'active' : ''}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>

      {toast.message ? <div className={`toast toast-${toast.type}`}>{toast.message}</div> : null}

      {renderByPage()}

      <Modal
        open={modalOpen}
        title={selectedAdminId ? 'Edit Admin' : 'Add Admin'}
        onClose={() => setModalOpen(false)}
        modalClassName="admin-form-shell"
        bodyClassName="admin-form-body"
      >
        <div className="admin-form-modal">
        <div className="form-grid">
          <FormInput label="Name" value={addEditForm.name} onChange={(e) => setAddEditForm((prev) => ({ ...prev, name: e.target.value }))} />
          <FormInput label="Email" value={addEditForm.email} onChange={(e) => setAddEditForm((prev) => ({ ...prev, email: e.target.value }))} disabled={Boolean(selectedAdminId)} />
          <FormInput label="Phone" value={addEditForm.phone} onChange={(e) => setAddEditForm((prev) => ({ ...prev, phone: e.target.value }))} />
          {!selectedAdminId ? <FormInput label="Password" type="password" value={addEditForm.password} onChange={(e) => setAddEditForm((prev) => ({ ...prev, password: e.target.value }))} /> : null}
          {!selectedAdminId ? <FormInput label="Confirm Password" type="password" value={addEditForm.confirmPassword} onChange={(e) => setAddEditForm((prev) => ({ ...prev, confirmPassword: e.target.value }))} /> : null}
          <FormInput label="Role" value="admin" disabled />
          <FilterDropdown label="Status" value={addEditForm.status} onChange={(value) => setAddEditForm((prev) => ({ ...prev, status: value }))} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'suspended', label: 'Suspended' }, { value: 'locked', label: 'Locked' }]} />
          <FilterDropdown
            label="Company"
            value={addEditForm.companyId}
            onChange={(value) => setAddEditForm((prev) => ({ ...prev, companyId: value }))}
            options={[{ value: '', label: 'Select Company' }, ...companies.map((company) => ({ value: company._id, label: company.companyName }))]}
          />
        </div>
        <div className="actions-row">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={saveAddEdit}>Save</Button>
        </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete Admin"
        message={`Are you sure you want to delete ${adminToDelete?.name || 'this admin'}?`}
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </section>
  )
}

export default AdminManagementModulePage

