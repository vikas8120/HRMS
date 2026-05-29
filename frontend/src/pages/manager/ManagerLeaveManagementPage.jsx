import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, RefreshCw } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import FilterDropdown from '../../components/ui/FilterDropdown'
import SearchBar from '../../components/ui/SearchBar'
import Button from '../../components/ui/Button'
import StatCard from '../../components/ui/StatCard'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import {
  applyManagerLeave,
  approveManagerLeave,
  getManagerLeaveById,
  getManagerLeaves,
  getMyManagerLeaves,
  rejectManagerLeave
} from '../../api/managerLeaveApi'
import { getManagerTeam } from '../../api/managerTeamApi'

const tabToStatus = {
  'Pending Requests': 'pending',
  'Approved Leaves': 'approved',
  'Rejected Leaves': 'rejected',
  'Leave History': 'all',
  'Leave Calendar': 'all',
  'My Leave Requests': 'all'
}

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toISOString().slice(0, 10)
}

function ManagerLeaveManagementPage() {
  const [searchParams] = useSearchParams()
  const employeeIdFromQuery = searchParams.get('employeeId') || 'all'
  const [activeTab, setActiveTab] = useState('Pending Requests')
  const [leaveView, setLeaveView] = useState('employee')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])

  const [search, setSearch] = useState('')
  const [leaveType, setLeaveType] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [employeeId, setEmployeeId] = useState(employeeIdFromQuery)
  const [team, setTeam] = useState([])

  const [toast, setToast] = useState(null)
  const [selectedLeaveId, setSelectedLeaveId] = useState('')
  const [selectedLeave, setSelectedLeave] = useState(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)

  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [applyOpen, setApplyOpen] = useState(false)
  const [applyForm, setApplyForm] = useState({ leaveType: 'casual', startDate: '', endDate: '', reason: '' })

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(timer)
  }, [toast])

  const loadLeaves = async () => {
    setLoading(true)
    setError('')
    try {
      if (activeTab === 'My Leave Requests') {
        const data = await getMyManagerLeaves({ leaveType, status: statusFilter })
        setRows(data?.data || [])
        return
      }
      const tabStatus = tabToStatus[activeTab] || 'all'
      const effectiveStatus = statusFilter === 'all' ? tabStatus : statusFilter
      const data = await getManagerLeaves({ status: effectiveStatus, leaveType, employeeId })
      setRows(data?.data || [])
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load leave requests')
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const loadTeam = async () => {
      try {
        const response = await getManagerTeam()
        setTeam(response?.data || [])
      } catch (_err) {
        setTeam([])
      }
    }
    loadTeam()
  }, [])

  useEffect(() => {
    if (employeeIdFromQuery && employeeIdFromQuery !== 'all') {
      setEmployeeId(employeeIdFromQuery)
      setActiveTab('Leave History')
      setLeaveView('employee')
    }
  }, [employeeIdFromQuery])

  useEffect(() => {
    if (activeTab === 'My Leave Requests') {
      setLeaveView('my')
      return
    }
    setLeaveView('employee')
  }, [activeTab])

  const switchToMyLeave = () => {
    setLeaveView('my')
    setActiveTab('My Leave Requests')
  }

  const switchToEmployeeLeave = () => {
    setLeaveView('employee')
    if (activeTab === 'My Leave Requests') {
      setActiveTab('Pending Requests')
    }
  }

  useEffect(() => {
    loadLeaves()
  }, [activeTab, leaveType, statusFilter, employeeId])

  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter((row) => (
      String(row.employeeName || '').toLowerCase().includes(needle)
      || String(row.reason || '').toLowerCase().includes(needle)
      || String(row.leaveType || '').toLowerCase().includes(needle)
    ))
  }, [rows, search])

  const leaveTypes = useMemo(() => {
    const unique = [...new Set(rows.map((row) => String(row.leaveType || '').trim()).filter(Boolean))]
    return [{ value: 'all', label: 'All Leave Types' }, ...unique.map((item) => ({ value: item, label: item }))]
  }, [rows])

  const employeeOptions = useMemo(() => ([
    { value: 'all', label: 'All Employees' },
    ...team.map((item) => ({ value: String(item.employeeId), label: item.name }))
  ]), [team])

  const openDetails = async (leaveId) => {
    setSelectedLeaveId(leaveId)
    setDetailsOpen(true)
    setDetailsLoading(true)
    setSelectedLeave(null)
    try {
      const payload = await getManagerLeaveById(leaveId)
      setSelectedLeave(payload?.data || null)
    } catch (_err) {
      setSelectedLeave(null)
    } finally {
      setDetailsLoading(false)
    }
  }

  const confirmApprove = (leaveId) => {
    setSelectedLeaveId(leaveId)
    setApproveOpen(true)
  }

  const confirmReject = (leaveId) => {
    setSelectedLeaveId(leaveId)
    setRejectionReason('')
    setRejectOpen(true)
  }

  const onApprove = async () => {
    if (!selectedLeaveId) return
    setSubmitting(true)
    try {
      await approveManagerLeave(selectedLeaveId)
      setToast({ type: 'success', message: 'Leave approved successfully' })
      setApproveOpen(false)
      await loadLeaves()
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to approve leave' })
    } finally {
      setSubmitting(false)
    }
  }

  const onReject = async () => {
    if (!selectedLeaveId) return
    if (!rejectionReason.trim()) {
      setToast({ type: 'error', message: 'Rejection reason is required' })
      return
    }

    setSubmitting(true)
    try {
      await rejectManagerLeave(selectedLeaveId, rejectionReason.trim())
      setToast({ type: 'success', message: 'Leave rejected successfully' })
      setRejectOpen(false)
      await loadLeaves()
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to reject leave' })
    } finally {
      setSubmitting(false)
    }
  }

  const onApplyLeave = async () => {
    if (!applyForm.startDate || !applyForm.endDate) {
      setToast({ type: 'error', message: 'Start date and end date are required' })
      return
    }
    if (new Date(applyForm.endDate) < new Date(applyForm.startDate)) {
      setToast({ type: 'error', message: 'End date cannot be before start date' })
      return
    }
    setSubmitting(true)
    try {
      await applyManagerLeave(applyForm)
      setApplyOpen(false)
      setApplyForm({ leaveType: 'casual', startDate: '', endDate: '', reason: '' })
      setToast({ type: 'success', message: 'Leave request submitted' })
      setActiveTab('My Leave Requests')
      await loadLeaves()
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to apply leave' })
    } finally {
      setSubmitting(false)
    }
  }

  const exportExcel = () => {
    const headers = ['Employee Name', 'Leave Type', 'Start Date', 'End Date', 'Total Days', 'Reason', 'Status', 'Applied Date']
    const lines = filteredRows.map((row) => [
      row.employeeName || '-',
      row.leaveType || '-',
      formatDate(row.startDate),
      formatDate(row.endDate),
      row.totalDays || 0,
      row.reason || '-',
      row.status || '-',
      formatDate(row.appliedDate)
    ])

    const csv = [headers, ...lines].map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `manager-leaves-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const exportPdf = () => {
    const lines = filteredRows.map((row, index) => (
      `${index + 1}. ${row.employeeName} | ${row.leaveType} | ${formatDate(row.startDate)} to ${formatDate(row.endDate)} | ${row.status}`
    ))

    const content = [
      'Manager Leave Report',
      `Generated: ${new Date().toISOString()}`,
      '',
      ...lines
    ].join('\n')

    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `manager-leaves-${new Date().toISOString().slice(0, 10)}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const calendarRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => String(a.startDate || '').localeCompare(String(b.startDate || '')))
  }, [filteredRows])

  const myLeaveStats = useMemo(() => {
    const summary = rows.reduce((acc, item) => {
      const type = String(item.leaveType || '').toLowerCase()
      const days = Number(item.totalDays || 0)
      if (type === 'casual') acc.casual += days
      if (type === 'sick') acc.sick += days
      if (type === 'earned') acc.earned += days
      return acc
    }, { casual: 0, sick: 0, earned: 0 })

    return [
      { title: 'Casual Balance', value: String(summary.casual), trend: 'Policy 0' },
      { title: 'Sick Balance', value: String(summary.sick), trend: 'Policy 0' },
      { title: 'Earned Balance', value: String(summary.earned), trend: 'Policy 0' }
    ]
  }, [rows])

  const myLeaveRows = useMemo(() => filteredRows.map((item) => ({
    id: item.id,
    leaveType: item.leaveType || '-',
    startDate: formatDate(item.startDate),
    endDate: formatDate(item.endDate),
    totalDays: item.totalDays || 0,
    reason: item.reason || '-',
    status: item.status || '-',
    createdAt: formatDate(item.appliedDate),
    raw: item
  })), [filteredRows])

  return (
    <section className="section-layout manager-leave-management-page">
      <PageHeader
        title={leaveView === 'my' ? 'Employee Leaves' : 'Leave Management'}
        description={leaveView === 'my' ? 'Apply and track your leave requests with balance and policy visibility.' : 'Review and action leave requests from employees assigned to you.'}
        breadcrumb={leaveView === 'my' ? ['Employee Portal', 'Leaves'] : ['Manager Portal', 'Leave Management']}
        primaryActionLabel="Apply Leave"
        onPrimaryAction={() => setApplyOpen(true)}
      />

      {toast ? <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>{toast.message}</div> : null}

      <div className="panel dashboard-switcher-panel">
        <div className="workspace-nav">
          <button
            type="button"
            className={`chip-btn ${leaveView === 'my' ? 'active' : ''}`}
            onClick={switchToMyLeave}
          >
            My Leave
          </button>
          <button
            type="button"
            className={`chip-btn ${leaveView === 'employee' ? 'active' : ''}`}
            onClick={switchToEmployeeLeave}
          >
            Employee Leave
          </button>
        </div>
      </div>

      {leaveView === 'my' ? (
        <>
          {loading ? <LoadingSkeleton rows={3} /> : (
            <div className="stats-grid premium-stats-grid">
              {myLeaveStats.map((item) => <StatCard key={item.title} {...item} />)}
            </div>
          )}

          <div className="panel">
            <div className="filters-row">
              <FilterDropdown
                label="Status"
                value={statusFilter}
                onChange={setStatusFilter}
                options={[{ value: 'all', label: 'All Status' }, { value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }]}
              />
              <FilterDropdown
                label="Leave Type"
                value={leaveType}
                onChange={setLeaveType}
                options={[{ value: 'all', label: 'All Leave Types' }, { value: 'casual', label: 'Casual' }, { value: 'sick', label: 'Sick' }, { value: 'earned', label: 'Earned' }, { value: 'work-from-home', label: 'Work From Home' }]}
              />
              <div className="actions-row" style={{ alignSelf: 'end' }}>
                <Button variant="ghost" onClick={loadLeaves}><RefreshCw size={14} /> Refresh</Button>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head"><h3>My Leave Requests</h3></div>
            {loading ? <LoadingSkeleton rows={6} /> : myLeaveRows.length === 0 ? <EmptyState title="No leave requests" description="Your leave requests will appear here." /> : (
              <DataTable
                columns={[
                  { key: 'leaveType', label: 'Leave Type' },
                  { key: 'startDate', label: 'Start Date' },
                  { key: 'endDate', label: 'End Date' },
                  { key: 'totalDays', label: 'Total Days' },
                  { key: 'reason', label: 'Reason', sortable: false },
                  { key: 'status', label: 'Status' },
                  { key: 'createdAt', label: 'Applied Date' }
                ]}
                rows={myLeaveRows}
                showViewAction
                onView={(row) => openDetails(row.raw.id)}
              />
            )}
          </div>
        </>
      ) : (
        <>
          <div className="panel">
            <div className="filters-row admin-filters-grid" style={{ marginTop: 10 }}>
              <div className="search-wrap">
                <label>Search</label>
                <SearchBar value={search} onChange={setSearch} placeholder="Search by employee, type, reason" />
              </div>
              <FilterDropdown label="Leave Type" value={leaveType} onChange={setLeaveType} options={leaveTypes} />
              {activeTab !== 'My Leave Requests' ? <FilterDropdown label="Employee" value={employeeId} onChange={setEmployeeId} options={employeeOptions} /> : null}
              <FilterDropdown
                label="Status"
                value={statusFilter}
                onChange={setStatusFilter}
                options={[{ value: 'all', label: 'Tab Status' }, { value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }]}
              />
            </div>

            <div className="actions-row" style={{ marginTop: 10 }}>
              <Button variant="ghost" onClick={loadLeaves}>Filter</Button>
              <Button variant="ghost" onClick={loadLeaves}><RefreshCw size={14} /> Refresh</Button>
              <Button variant="ghost" onClick={exportPdf}><Download size={14} /> Export PDF</Button>
              <Button variant="ghost" onClick={exportExcel}><Download size={14} /> Export Excel</Button>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head"><h3>{activeTab}</h3></div>
            {loading ? <LoadingSkeleton rows={7} /> : error ? <EmptyState title="Unable to load leaves" description={error} /> : activeTab === 'Leave Calendar' ? (
              calendarRows.length === 0 ? <EmptyState title="No calendar leaves" description="Leave entries will appear here." /> : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Date Range</th>
                        <th>Employee</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Total Days</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calendarRows.map((row) => (
                        <tr key={row.id}>
                          <td>{formatDate(row.startDate)} to {formatDate(row.endDate)}</td>
                          <td>{row.employeeName || '-'}</td>
                          <td>{row.leaveType || '-'}</td>
                          <td><span className={`badge badge-${row.status}`}>{row.status}</span></td>
                          <td>{row.totalDays || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : filteredRows.length === 0 ? (
              <EmptyState title="No leave records" description="Leave requests matching current filters will appear here." />
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Employee name</th>
                      <th>Leave type</th>
                      <th>Start date</th>
                      <th>End date</th>
                      <th>Total days</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Applied date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => {
                      const canAct = String(row.status || '').toLowerCase() === 'pending'
                      return (
                        <tr key={row.id}>
                          <td>{row.employeeName || '-'}</td>
                          <td>{row.leaveType || '-'}</td>
                          <td>{formatDate(row.startDate)}</td>
                          <td>{formatDate(row.endDate)}</td>
                          <td>{row.totalDays || 0}</td>
                          <td>{row.reason || '-'}</td>
                          <td><span className={`badge badge-${row.status}`}>{row.status || '-'}</span></td>
                          <td>{formatDate(row.appliedDate)}</td>
                          <td>
                            <div className="table-actions">
                              <button className="text-btn" onClick={() => openDetails(row.id)}>View Details</button>
                              {canAct ? <button className="text-btn" onClick={() => confirmApprove(row.id)}>Approve</button> : null}
                              {canAct ? <button className="text-btn danger" onClick={() => confirmReject(row.id)}>Reject</button> : null}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <Modal open={detailsOpen} title="Leave Details" onClose={() => setDetailsOpen(false)}>
        {detailsLoading ? <LoadingSkeleton rows={4} /> : !selectedLeave ? <EmptyState title="Details unavailable" description="Unable to fetch leave details." /> : (
          <div className="modal-form">
            <div className="inline-action-card"><strong>Employee:</strong> <span>{selectedLeave.employeeName || '-'}</span></div>
            <div className="inline-action-card"><strong>Type:</strong> <span>{selectedLeave.leaveType || '-'}</span></div>
            <div className="inline-action-card"><strong>Start Date:</strong> <span>{formatDate(selectedLeave.startDate)}</span></div>
            <div className="inline-action-card"><strong>End Date:</strong> <span>{formatDate(selectedLeave.endDate)}</span></div>
            <div className="inline-action-card"><strong>Total Days:</strong> <span>{selectedLeave.totalDays || 0}</span></div>
            <div className="inline-action-card"><strong>Reason:</strong> <span>{selectedLeave.reason || '-'}</span></div>
            <div className="inline-action-card"><strong>Status:</strong> <span>{selectedLeave.status || '-'}</span></div>
            <div className="inline-action-card"><strong>Applied Date:</strong> <span>{formatDate(selectedLeave.appliedDate)}</span></div>
            {selectedLeave.rejectionReason ? <div className="inline-action-card"><strong>Rejection Reason:</strong> <span>{selectedLeave.rejectionReason}</span></div> : null}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={approveOpen}
        title="Approve Leave"
        message="Approve this leave request?"
        onCancel={() => setApproveOpen(false)}
        onConfirm={onApprove}
      />

      <Modal open={rejectOpen} title="Reject Leave" onClose={() => setRejectOpen(false)}>
        <div className="modal-form">
          <label className="form-input-wrap">
            <span>Rejection Reason</span>
            <textarea className="form-input" rows={4} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
          </label>
          <div className="actions-row">
            <Button variant="ghost" onClick={() => setRejectOpen(false)} disabled={submitting}>Cancel</Button>
            <Button variant="danger" onClick={onReject} disabled={submitting}>{submitting ? 'Rejecting...' : 'Reject'}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={applyOpen} title="Apply Leave" onClose={() => setApplyOpen(false)}>
        <div className="modal-form">
          <FilterDropdown
            label="Leave Type"
            value={applyForm.leaveType}
            onChange={(value) => setApplyForm((prev) => ({ ...prev, leaveType: value }))}
            options={[{ value: 'casual', label: 'Casual' }, { value: 'sick', label: 'Sick' }, { value: 'earned', label: 'Earned' }, { value: 'work-from-home', label: 'Work From Home' }]}
          />
          <label className="form-input-wrap">
            <span>Start Date</span>
            <input className="form-input" type="date" value={applyForm.startDate} onChange={(e) => setApplyForm((prev) => ({ ...prev, startDate: e.target.value }))} />
          </label>
          <label className="form-input-wrap">
            <span>End Date</span>
            <input className="form-input" type="date" value={applyForm.endDate} onChange={(e) => setApplyForm((prev) => ({ ...prev, endDate: e.target.value }))} />
          </label>
          <label className="form-input-wrap">
            <span>Reason</span>
            <textarea className="form-input" rows={4} value={applyForm.reason} onChange={(e) => setApplyForm((prev) => ({ ...prev, reason: e.target.value }))} />
          </label>
          <div className="actions-row">
            <Button variant="ghost" onClick={() => setApplyOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={onApplyLeave} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Leave'}</Button>
          </div>
        </div>
      </Modal>
    </section>
  )
}

export default ManagerLeaveManagementPage
