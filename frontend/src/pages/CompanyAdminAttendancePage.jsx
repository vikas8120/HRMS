import { useEffect, useMemo, useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import FilterDropdown from '../components/ui/FilterDropdown'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import FormInput from '../components/ui/FormInput'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'
import EmptyState from '../components/ui/EmptyState'
import StatCard from '../components/ui/StatCard'
import {
  getAttendance,
  getTodayAttendance,
  getMonthlyAttendance,
  markManualAttendance,
  updateAttendance,
  exportAttendance,
  getDepartments,
  getEmployees
} from '../api/adminAttendanceApi'

const initialForm = {
  employeeId: '',
  date: '',
  checkIn: '',
  checkOut: '',
  status: 'present'
}

const statusOptions = [
  { value: 'all', label: 'All' },
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'half-day', label: 'Half-day' },
  { value: 'late', label: 'Late' },
  { value: 'leave', label: 'Leave' }
]

function CompanyAdminAttendancePage() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')

  const [dateFilter, setDateFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [employeeFilter, setEmployeeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState(String(new Date().getMonth() + 1).padStart(2, '0'))
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()))

  const [departments, setDepartments] = useState([])
  const [employees, setEmployees] = useState([])

  const [summaryToday, setSummaryToday] = useState([])
  const [todaySummaryCounts, setTodaySummaryCounts] = useState(null)
  const [summaryMonthly, setSummaryMonthly] = useState(null)

  const [manualOpen, setManualOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [formErrors, setFormErrors] = useState({})

  const [toast, setToast] = useState(null)

  const deptMap = useMemo(() => Object.fromEntries(departments.map((d) => [String(d.id || d._id), d.name || 'Department'])), [departments])

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(null), 2800)
    return () => clearTimeout(t)
  }, [toast])

  const loadMeta = async () => {
    try {
      const [deptRes, empRes] = await Promise.all([
        getDepartments({ status: 'all' }),
        getEmployees({ limit: 500, status: 'all' })
      ])
      setDepartments(deptRes?.data || [])
      setEmployees(empRes?.data || [])
    } catch (_err) {
      setDepartments([])
      setEmployees([])
    }
  }

  const loadSummary = async () => {
    try {
      const [todayRes, monthlyRes] = await Promise.all([
        getTodayAttendance({ departmentId: departmentFilter, employeeId: employeeFilter, status: statusFilter }),
        getMonthlyAttendance({ month: monthFilter, year: yearFilter, departmentId: departmentFilter, employeeId: employeeFilter })
      ])
      setSummaryToday(todayRes?.data || [])
      setTodaySummaryCounts(todayRes?.summary || null)
      setSummaryMonthly(monthlyRes?.data?.summary || null)
    } catch (err) {
      setSummaryToday([])
      setTodaySummaryCounts(null)
      setSummaryMonthly(null)
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to load attendance summary' })
    }
  }

  const loadAttendance = async ({ keepLoading = false } = {}) => {
    if (!keepLoading) setLoading(true)
    setError('')

    try {
      const res = await getAttendance({
        date: dateFilter || undefined,
        departmentId: departmentFilter,
        employeeId: employeeFilter,
        status: statusFilter
      })
      setRows(res?.data || [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load attendance')
      setRows([])
    } finally {
      if (!keepLoading) setLoading(false)
    }
  }

  useEffect(() => {
    loadMeta()
    loadAttendance()
    loadSummary()
  }, [])

  const applyFilters = async () => {
    await loadAttendance()
    await loadSummary()
  }

  const displayedRows = useMemo(() => {
    const base = rows.map((row) => ({
      ...row,
      dateOnly: row.date ? String(row.date).slice(0, 10) : '-',
      employeeNameSafe: row.employeeName || '-',
      departmentName: deptMap[String(row.departmentId || '')] || '-'
    }))

    return base
  }, [rows, deptMap])

  const cards = useMemo(() => {
    const monthly = summaryMonthly || { total: 0, present: 0, absent: 0, halfDay: 0, late: 0, leave: 0 }
    const today = todaySummaryCounts || { total: summaryToday.length, present: 0, absent: 0, halfDay: 0, late: 0, leave: 0 }

    return [
      { title: 'Today Marked', value: String(today.total || 0), trend: `${today.present || 0} present today` },
      { title: 'Monthly Total', value: String(monthly.total || 0), trend: `${monthFilter}/${yearFilter} records` },
      { title: 'Present Count', value: String(monthly.present || 0), trend: `${today.present || 0} today` },
      { title: 'Absent Count', value: String(monthly.absent || 0), trend: `${today.absent || 0} today` },
      { title: 'Late Count', value: String(monthly.late || 0), trend: `${today.late || 0} today` },
      { title: 'Half-day Count', value: String(monthly.halfDay || 0), trend: `${today.halfDay || 0} today` }
    ]
  }, [summaryToday, summaryMonthly, monthFilter, yearFilter, todaySummaryCounts])

  const validateForm = () => {
    const next = {}
    if (!form.employeeId) next.employeeId = 'Employee is required'
    if (!form.date) next.date = 'Date is required'
    if (!form.status) next.status = 'Status is required'
    setFormErrors(next)
    return Object.keys(next).length === 0
  }

  const openManual = () => {
    setSelected(null)
    setForm(initialForm)
    setFormErrors({})
    setManualOpen(true)
  }

  const openEdit = (row) => {
    setSelected(row)
    setForm({
      employeeId: row.employeeId || '',
      date: row.date ? String(row.date).slice(0, 10) : '',
      checkIn: row.checkIn || '',
      checkOut: row.checkOut || '',
      status: row.status || 'present'
    })
    setFormErrors({})
    setEditOpen(true)
  }

  const submitManual = async (event) => {
    event.preventDefault()
    if (!validateForm()) return

    setSubmitting(true)
    try {
      const res = await markManualAttendance({
        employeeId: form.employeeId,
        date: form.date,
        checkIn: form.checkIn || null,
        checkOut: form.checkOut || null,
        status: form.status
      })
      const created = res?.data
      setRows((prev) => [created, ...prev])
      setManualOpen(false)
      setToast({ type: 'success', message: res?.message || 'Attendance marked successfully' })
      await loadSummary()
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to mark attendance' })
    } finally {
      setSubmitting(false)
    }
  }

  const submitEdit = async (event) => {
    event.preventDefault()
    if (!selected?.id) return

    setSubmitting(true)
    try {
      const res = await updateAttendance(selected.id, {
        date: form.date,
        checkIn: form.checkIn || null,
        checkOut: form.checkOut || null,
        status: form.status
      })

      const updated = res?.data
      setRows((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      setEditOpen(false)
      setSelected(null)
      setToast({ type: 'success', message: res?.message || 'Attendance updated successfully' })
      await loadSummary()
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to update attendance' })
    } finally {
      setSubmitting(false)
    }
  }

  const onExport = async () => {
    try {
      const blob = await exportAttendance({
        date: dateFilter || undefined,
        departmentId: departmentFilter,
        employeeId: employeeFilter,
        status: statusFilter
      })

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `attendance-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setToast({ type: 'success', message: 'Attendance export downloaded' })
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Export failed' })
    }
  }

  return (
    <section className="section-layout">
      <PageHeader
        title="Attendance"
        description="Track daily and monthly attendance with manual marking and updates."
        breadcrumb={['Company Admin', 'Attendance']}
        primaryActionLabel="Mark Attendance"
        onPrimaryAction={openManual}
      />

      {toast ? <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>{toast.message}</div> : null}

      <div className="stats-grid">
        {cards.map((card) => <StatCard key={card.title} title={card.title} value={card.value} trend={card.trend} />)}
      </div>

      <div className="panel filters-panel">
        <div className="filters-row admin-filters-grid">
          <FormInput label="Date" type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />

          <FilterDropdown
            label="Department"
            value={departmentFilter}
            onChange={setDepartmentFilter}
            options={[{ value: 'all', label: 'All Departments' }, ...departments.map((d) => ({ value: String(d.id || d._id), label: d.name || 'Department' }))]}
          />

          <FilterDropdown
            label="Employee"
            value={employeeFilter}
            onChange={setEmployeeFilter}
            options={[{ value: 'all', label: 'All Employees' }, ...employees.map((e) => ({ value: String(e.employeeId || e.id || e._id), label: `${e.name} (${e.employeeId || e.id || e._id})` }))]}
          />

          <FilterDropdown
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
          />
        </div>

        <div className="filters-row" style={{ marginTop: 8 }}>
          <FilterDropdown label="Month" value={monthFilter} onChange={setMonthFilter} options={Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1).padStart(2, '0'), label: String(i + 1).padStart(2, '0') }))} />
          <FormInput label="Year" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} placeholder="YYYY" />
        </div>

        <div className="actions-row" style={{ marginTop: 10 }}>
          <Button variant="ghost" onClick={applyFilters}>Apply Filters</Button>
          <Button variant="ghost" onClick={() => { loadAttendance(); loadSummary() }}><RefreshCw size={14} /> Refresh</Button>
          <Button variant="ghost" onClick={onExport}><Download size={14} /> Export</Button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Attendance Records</h3></div>
        {loading ? <LoadingSkeleton rows={8} /> : error ? (
          <EmptyState title="Unable to load attendance" description={error} />
        ) : displayedRows.length === 0 ? (
          <EmptyState title="No attendance records" description="Mark attendance manually or adjust filters." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Working Hours</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.employeeNameSafe}</td>
                    <td>{row.departmentName}</td>
                    <td>{row.dateOnly}</td>
                    <td>{row.checkIn || '-'}</td>
                    <td>{row.checkOut || '-'}</td>
                    <td>{row.workingHours ?? 0}</td>
                    <td><span className={`badge badge-${row.status}`}>{row.status}</span></td>
                    <td>
                      <div className="table-actions">
                        <button className="text-btn" onClick={() => openEdit(row)}>Edit</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={manualOpen} title="Manual Attendance" onClose={() => { if (!submitting) setManualOpen(false) }}>
        <form className="modal-form" onSubmit={submitManual}>
          <FilterDropdown
            label="Employee"
            value={form.employeeId}
            onChange={(value) => setForm((prev) => ({ ...prev, employeeId: value }))}
            options={[{ value: '', label: 'Select employee' }, ...employees.map((e) => ({ value: String(e.employeeId || e.id || e._id), label: `${e.name} (${e.employeeId || e.id || e._id})` }))]}
          />
          {formErrors.employeeId ? <p className="error">{formErrors.employeeId}</p> : null}

          <FormInput label="Date" type="date" value={form.date} onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))} />
          {formErrors.date ? <p className="error">{formErrors.date}</p> : null}

          <FormInput label="Check In" type="datetime-local" value={form.checkIn} onChange={(e) => setForm((prev) => ({ ...prev, checkIn: e.target.value }))} />
          <FormInput label="Check Out" type="datetime-local" value={form.checkOut} onChange={(e) => setForm((prev) => ({ ...prev, checkOut: e.target.value }))} />

          <FilterDropdown label="Status" value={form.status} onChange={(value) => setForm((prev) => ({ ...prev, status: value }))} options={statusOptions.filter((s) => s.value !== 'all')} />

          <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Mark Attendance'}</Button>
        </form>
      </Modal>

      <Modal open={editOpen} title={`Edit Attendance - ${selected?.employeeNameSafe || ''}`} onClose={() => { if (!submitting) setEditOpen(false) }}>
        <form className="modal-form" onSubmit={submitEdit}>
          <FormInput label="Date" type="date" value={form.date} onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))} />
          <FormInput label="Check In" type="datetime-local" value={form.checkIn} onChange={(e) => setForm((prev) => ({ ...prev, checkIn: e.target.value }))} />
          <FormInput label="Check Out" type="datetime-local" value={form.checkOut} onChange={(e) => setForm((prev) => ({ ...prev, checkOut: e.target.value }))} />

          <FilterDropdown label="Status" value={form.status} onChange={(value) => setForm((prev) => ({ ...prev, status: value }))} options={statusOptions.filter((s) => s.value !== 'all')} />

          <Button type="submit" disabled={submitting}>{submitting ? 'Updating...' : 'Update Attendance'}</Button>
        </form>
      </Modal>
    </section>
  )
}

export default CompanyAdminAttendancePage
