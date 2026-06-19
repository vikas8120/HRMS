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
  createAdmin,
  deleteAdmin,
  fetchActivityLogs,
  fetchAdmins,
  fetchTenantCompanies,
  getAdminById,
  resetAdminPassword,
  updateAdmin,
  updateAdminStatus
} from '../../api/adminManagementApi'

const sectionByPage = {
  'Admin Management': 'admin-list-section',
  'Admin List': 'admin-list-section',
  'Add Admin': 'admin-list-section',
  'Edit Admin': 'admin-list-section',
  'Reset Password': 'reset-password-section',
  'Admin Activity Tracking': 'admin-activity-logs-section',
  'Account Lock/Unlock': 'account-lock-section'
}

const adminModuleRoot = '/super-admin/admin-management'
const adminWorkspaceGroups = [
  {
    title: 'Administration',
    path: `${adminModuleRoot}/admin-management`,
    items: [
      { label: 'Admin Management', path: `${adminModuleRoot}/admin-management` },
      { label: 'Reset Password', path: `${adminModuleRoot}/reset-password` },
      { label: 'Admin Activity Tracking', path: `${adminModuleRoot}/admin-activity-tracking` }
    ]
  }
]

const defaultAdminForm = {
  name: '',
  email: '',
  phone: '',
  secondaryPhone: '',
  address: '',
  aadhaarNumber: '',
  panNumber: '',
  employeeCode: '',
  designation: '',
  department: '',
  gender: '',
  dateOfBirth: '',
  joiningDate: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  notes: '',
  password: '',
  confirmPassword: '',
  companyId: '',
  status: 'active'
}
function AdminManagementModulePage({ page }) {
  const { pathname } = useLocation()
  const [admins, setAdmins] = useState([])
  const [companies, setCompanies] = useState([])
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
  const [formErrors, setFormErrors] = useState({})
  const [formSubmitError, setFormSubmitError] = useState('')

  const [addEditForm, setAddEditForm] = useState(defaultAdminForm)

  const [resetPasswordForm, setResetPasswordForm] = useState({ adminId: '', password: '', confirmPassword: '' })
  const setSuccess = (message) => setToast({ type: 'success', message })
  const setError = (message) => setToast({ type: 'error', message })
  const setInfo = (message) => setToast({ type: 'success', message })
  const activeWorkspaceGroup = useMemo(() => {
    const normalizedPage = String(page || '').toLowerCase()
    return adminWorkspaceGroups.find((group) =>
      group.items.some((item) => item.label.toLowerCase() === normalizedPage)
    ) || adminWorkspaceGroups[0]
  }, [page])

  const loadBaseData = async () => {
    setLoading(true)
    try {
      const [adminsRes, companiesRes] = await Promise.all([
        fetchAdmins({ page: pagination.page, limit: pagination.limit, search, status: statusFilter, company: companyFilter }),
        fetchTenantCompanies()
      ])
      setAdmins(adminsRes?.items || [])
      setPagination(adminsRes?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 })
      const nextCompanies = Array.isArray(companiesRes?.companies)
        ? companiesRes.companies
        : Array.isArray(companiesRes?.items)
          ? companiesRes.items
          : Array.isArray(companiesRes)
            ? companiesRes
            : []
      setCompanies(nextCompanies)
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
    fetchActivityLogs().then((res) => setActivityLogs(res.items)).catch(() => setActivityLogs([]))
  }, [])

  useEffect(() => {
    if (page !== 'Reset Password' && page !== 'Account Lock/Unlock') return
    setSearch('')
    setStatusFilter('all')
    setCompanyFilter('all')
    setPagination((prev) => ({ ...prev, page: 1 }))
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

  useEffect(() => {
    if (modalOpen && companies.length === 0) {
      fetchTenantCompanies()
        .then((res) => {
          const nextCompanies = Array.isArray(res?.companies)
            ? res.companies
            : Array.isArray(res?.items)
              ? res.items
              : Array.isArray(res)
                ? res
                : []
          setCompanies(nextCompanies)
        })
        .catch(() => {})
    }
  }, [modalOpen, companies.length])

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

  const normalizeAdminForm = (item = {}) => ({
    ...defaultAdminForm,
    name: item.name || '',
    email: item.email || '',
    phone: item.phone || '',
    secondaryPhone: item.secondaryPhone || '',
    address: item.address || '',
    aadhaarNumber: item.aadhaarNumber || '',
    panNumber: item.panNumber || '',
    employeeCode: item.employeeCode || '',
    designation: item.designation || '',
    department: item.department || '',
    gender: item.gender || '',
    dateOfBirth: item.dateOfBirth || '',
    joiningDate: item.joiningDate || '',
    emergencyContactName: item.emergencyContactName || '',
    emergencyContactPhone: item.emergencyContactPhone || '',
    notes: item.notes || '',
    companyId: item.companyId || '',
    status: item.status || 'active'
  })

  const validateAddEdit = (isEdit) => {
    const nextErrors = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(addEditForm.email)) {
      nextErrors.email = 'Invalid email format'
    }

    if (!addEditForm.name?.trim()) nextErrors.name = 'Admin name is required'
    if (!addEditForm.phone?.trim()) nextErrors.phone = 'Phone number is required'
    if (!addEditForm.address?.trim()) nextErrors.address = 'Address is required'
    if (!addEditForm.aadhaarNumber?.trim()) nextErrors.aadhaarNumber = 'Aadhaar number is required'
    if (!addEditForm.panNumber?.trim()) nextErrors.panNumber = 'PAN number is required'
    if (!addEditForm.companyId?.trim()) nextErrors.companyId = 'Company is required'

    const aadhaarDigits = String(addEditForm.aadhaarNumber || '').replace(/\D/g, '')
    if (aadhaarDigits && aadhaarDigits.length !== 12) nextErrors.aadhaarNumber = 'Aadhaar number must be 12 digits'

    const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]$/
    if (addEditForm.panNumber && !panPattern.test(String(addEditForm.panNumber).toUpperCase())) {
      nextErrors.panNumber = 'PAN format should be ABCDE1234F'
    }

    if (!isEdit) {
      if (!addEditForm.password) {
        nextErrors.password = 'Password is required'
      }
      if (addEditForm.password !== addEditForm.confirmPassword) {
        nextErrors.confirmPassword = 'Passwords do not match'
      }
    }

    setFormErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setFormSubmitError('Please fix the highlighted fields')
      return false
    }

    return true
  }

  const openAdd = () => {
    setSelectedAdminId('')
    setAddEditForm(defaultAdminForm)
    setFormErrors({})
    setFormSubmitError('')
    setModalOpen(true)
  }

  const openEdit = async (row) => {
    try {
      const res = await getAdminById(row.id)
      const item = res.item
      setSelectedAdminId(item.id)
      setAddEditForm({
        ...normalizeAdminForm(item),
        password: '',
        confirmPassword: ''
      })
      setFormErrors({})
      setFormSubmitError('')
      setModalOpen(true)
    } catch (error) {
      setError(error?.response?.data?.message || 'Failed to load admin details')
    }
  }

  const saveAddEdit = async () => {
    const isEdit = Boolean(selectedAdminId)
    if (!validateAddEdit(isEdit)) return

    try {
      setFormSubmitError('')
      if (isEdit) {
          await updateAdmin(selectedAdminId, {
            name: addEditForm.name,
            phone: addEditForm.phone,
            secondaryPhone: addEditForm.secondaryPhone,
            address: addEditForm.address,
          aadhaarNumber: addEditForm.aadhaarNumber,
          panNumber: addEditForm.panNumber,
          employeeCode: addEditForm.employeeCode,
          designation: addEditForm.designation,
          department: addEditForm.department,
          gender: addEditForm.gender,
          dateOfBirth: addEditForm.dateOfBirth,
            joiningDate: addEditForm.joiningDate,
            emergencyContactName: addEditForm.emergencyContactName,
            emergencyContactPhone: addEditForm.emergencyContactPhone,
            notes: addEditForm.notes,
            companyId: addEditForm.companyId,
            status: addEditForm.status
          })
        setSuccess('Admin updated successfully')
      } else {
        await createAdmin({
          name: addEditForm.name,
          email: addEditForm.email,
          phone: addEditForm.phone,
          secondaryPhone: addEditForm.secondaryPhone,
          address: addEditForm.address,
          aadhaarNumber: addEditForm.aadhaarNumber,
          panNumber: addEditForm.panNumber,
          employeeCode: addEditForm.employeeCode,
          designation: addEditForm.designation,
          department: addEditForm.department,
          gender: addEditForm.gender,
          dateOfBirth: addEditForm.dateOfBirth,
          joiningDate: addEditForm.joiningDate,
          emergencyContactName: addEditForm.emergencyContactName,
          emergencyContactPhone: addEditForm.emergencyContactPhone,
          notes: addEditForm.notes,
          password: addEditForm.password,
          companyId: addEditForm.companyId,
          status: addEditForm.status
        })
        setSuccess('Admin created successfully')
      }
      setModalOpen(false)
      setSelectedAdminId('')
      setFormErrors({})
      loadBaseData()
    } catch (error) {
      setFormSubmitError(error?.response?.data?.message || 'Failed to save admin')
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

  const activityLogColumns = [
    { key: 'admin', label: 'Admin' },
    { key: 'module', label: 'Module' },
    { key: 'action', label: 'Action' },
    { key: 'description', label: 'Description' },
    { key: 'dateTime', label: 'Date/Time' }
  ]

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
      case 'Reset Password':
        return renderResetPassword()
      case 'Admin Activity Tracking':
        return (
          <div className="panel">
            <DataTable
              columns={activityLogColumns}
              rows={activityLogs.map((entry) => ({
                id: entry._id,
                admin: entry.admin?.name || '-',
                module: entry.module || '-',
                action: entry.action,
                description: entry.description,
                dateTime: new Date(entry.dateTime).toLocaleString()
              }))}
              showViewAction={false}
              showEditAction={false}
              showDeleteAction={false}
            />
          </div>
        )
      case 'Account Lock/Unlock':
        return renderLockUnlock()
      default:
        return renderAdminManagementPage()
  }
  }

  const pageBreadcrumb = page && page !== 'Admin Management' ? page : null

  return (
    <section className="section-layout admin-management-page">
      <PageHeader
        title="Admin Management"
        description="Single-page control center for admins, security, logs, and account status."
        breadcrumb={['Super Admin', 'Admin Management', pageBreadcrumb].filter(Boolean)}
        primaryActionLabel="Add Admin"
        onPrimaryAction={openAdd}
      />
      <div className="workspace-nav admin-workspace-nav" aria-label="Admin category navigation">
        {adminWorkspaceGroups.map((group) => (
          <NavLink
            key={group.title}
            to={group.path}
            className={({ isActive }) => `workspace-nav-chip ${isActive || activeWorkspaceGroup.title === group.title ? 'active' : ''}`}
            data-group={group.title.toLowerCase()}
          >
            {group.title.toUpperCase()}
          </NavLink>
        ))}
      </div>

      <div className="workspace-subnav admin-workspace-subnav" aria-label="Admin module navigation">
        {activeWorkspaceGroup.items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `workspace-nav-chip ${isActive ? 'active' : ''}`
            }
            data-group={activeWorkspaceGroup.title.toLowerCase()}
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
          {formSubmitError ? (
            <div className="form-inline-alert form-inline-alert-error" role="alert">
              {formSubmitError}
            </div>
          ) : null}
          <div className="company-form-section">
            <div className="company-form-section-head">
              <h4>Identity</h4>
              <p>Basic admin identity and login information.</p>
            </div>
            <div className="form-grid company-form-grid">
              <FormInput label="Admin Name *" value={addEditForm.name} error={formErrors.name} onChange={(e) => setAddEditForm((prev) => ({ ...prev, name: e.target.value }))} />
              <FormInput label="Email *" value={addEditForm.email} error={formErrors.email} onChange={(e) => setAddEditForm((prev) => ({ ...prev, email: e.target.value }))} disabled={Boolean(selectedAdminId)} />
              <FormInput label="Phone Number *" value={addEditForm.phone} error={formErrors.phone} onChange={(e) => setAddEditForm((prev) => ({ ...prev, phone: e.target.value }))} />
              <FormInput label="Phone No 2" value={addEditForm.secondaryPhone} onChange={(e) => setAddEditForm((prev) => ({ ...prev, secondaryPhone: e.target.value }))} placeholder="Optional" />
            </div>
          </div>

          <div className="company-form-section">
            <div className="company-form-section-head">
              <h4>Company & Role</h4>
              <p>Connect the admin to one company and keep role fixed as admin.</p>
            </div>
            <div className="form-grid company-form-grid">
              <FormInput label="Role" value="admin" disabled />
              <label className="form-input-wrap">
                <span>Company *</span>
                <select
                  className={`form-input ${formErrors.companyId ? 'form-input-error' : ''}`}
                  value={addEditForm.companyId}
                  onChange={(event) => setAddEditForm((prev) => ({ ...prev, companyId: event.target.value }))}
                >
                  <option value="">Select Company</option>
                  {companies.map((company) => (
                    <option key={company._id} value={company._id}>
                      {company.companyName}
                    </option>
                  ))}
                </select>
                {formErrors.companyId ? <small className="field-error">{formErrors.companyId}</small> : null}
              </label>
              <FormInput label="Designation" value={addEditForm.designation} onChange={(e) => setAddEditForm((prev) => ({ ...prev, designation: e.target.value }))} placeholder="Admin, Finance Lead, etc." />
              <FormInput label="Department" value={addEditForm.department} onChange={(e) => setAddEditForm((prev) => ({ ...prev, department: e.target.value }))} placeholder="Operations, Finance, HR" />
              <FormInput label="Employee Code" value={addEditForm.employeeCode} onChange={(e) => setAddEditForm((prev) => ({ ...prev, employeeCode: e.target.value }))} placeholder="Optional" />
              <FilterDropdown
                label="Gender"
                value={addEditForm.gender}
                onChange={(value) => setAddEditForm((prev) => ({ ...prev, gender: value }))}
                options={[
                  { value: '', label: 'Select Gender' },
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' }
                ]}
              />
              <FilterDropdown label="Status" value={addEditForm.status} onChange={(value) => setAddEditForm((prev) => ({ ...prev, status: value }))} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'suspended', label: 'Suspended' }, { value: 'locked', label: 'Locked' }]} />
            </div>
          </div>

          <div className="company-form-section">
            <div className="company-form-section-head">
              <h4>Documents</h4>
              <p>Identity numbers used for record keeping and verification.</p>
            </div>
            <div className="form-grid company-form-grid">
              <FormInput label="Aadhaar Number *" value={addEditForm.aadhaarNumber} error={formErrors.aadhaarNumber} onChange={(e) => setAddEditForm((prev) => ({ ...prev, aadhaarNumber: e.target.value }))} placeholder="12 digits" />
              <FormInput label="PAN Number *" value={addEditForm.panNumber} error={formErrors.panNumber} onChange={(e) => setAddEditForm((prev) => ({ ...prev, panNumber: e.target.value.toUpperCase() }))} placeholder="ABCDE1234F" />
              <FormInput label="Date of Birth" type="date" value={addEditForm.dateOfBirth} onChange={(e) => setAddEditForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))} />
              <FormInput label="Joining Date" type="date" value={addEditForm.joiningDate} onChange={(e) => setAddEditForm((prev) => ({ ...prev, joiningDate: e.target.value }))} />
            </div>
          </div>

          <div className="company-form-section">
            <div className="company-form-section-head">
              <h4>Address & Emergency Contact</h4>
              <p>Extra contact details for real-world HR records.</p>
            </div>
            <div className="form-grid company-form-grid">
              <label className="form-input-wrap company-form-field company-form-textarea-field" style={{ gridColumn: '1 / -1' }}>
                <span>Address *</span>
                <textarea
                  className={`form-input ${formErrors.address ? 'form-input-error' : ''}`}
                  rows="3"
                  value={addEditForm.address}
                  onChange={(e) => setAddEditForm((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="House no, street, city, state, pincode"
                />
                {formErrors.address ? <small className="field-error">{formErrors.address}</small> : null}
              </label>
              <FormInput label="Emergency Contact Name" value={addEditForm.emergencyContactName} onChange={(e) => setAddEditForm((prev) => ({ ...prev, emergencyContactName: e.target.value }))} placeholder="Optional" />
              <FormInput label="Emergency Contact Phone" value={addEditForm.emergencyContactPhone} onChange={(e) => setAddEditForm((prev) => ({ ...prev, emergencyContactPhone: e.target.value }))} placeholder="Optional" />
              <label className="form-input-wrap company-form-field company-form-textarea-field" style={{ gridColumn: '1 / -1' }}>
                <span>Notes</span>
                <textarea
                  className="form-input"
                  rows="3"
                  value={addEditForm.notes}
                  onChange={(e) => setAddEditForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Internal notes for the super admin team"
                />
              </label>
            </div>
          </div>

          {!selectedAdminId ? (
            <div className="company-form-section">
              <div className="company-form-section-head">
                <h4>Security</h4>
                <p>Set the initial password for this admin account.</p>
              </div>
              <div className="form-grid company-form-grid">
                <FormInput label="Password *" type="password" value={addEditForm.password} error={formErrors.password} onChange={(e) => setAddEditForm((prev) => ({ ...prev, password: e.target.value }))} />
                <FormInput label="Confirm Password *" type="password" value={addEditForm.confirmPassword} error={formErrors.confirmPassword} onChange={(e) => setAddEditForm((prev) => ({ ...prev, confirmPassword: e.target.value }))} />
              </div>
            </div>
          ) : null}

          <div className="company-form-meta-note">
            <span>* Required fields</span>
            <span>Saved in MongoDB with admin profile fields, companies, and activity logs.</span>
          </div>
          <div className="modal-actions company-form-actions">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="button" onClick={saveAddEdit}>Save Admin</Button>
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

