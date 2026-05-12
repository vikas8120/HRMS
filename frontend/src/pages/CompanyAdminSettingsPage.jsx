import { useEffect, useMemo, useState } from 'react'
import { RefreshCw, Trash2 } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import FormInput from '../components/ui/FormInput'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'
import EmptyState from '../components/ui/EmptyState'
import StatCard from '../components/ui/StatCard'
import FilterDropdown from '../components/ui/FilterDropdown'
import {
  addHoliday,
  deleteHoliday,
  getAdminSettings,
  updateAttendanceRules,
  updateCompanyProfile,
  updateLeavePolicy,
  updateOfficeTiming,
  updatePayrollSettings,
  updateWorkingDays
} from '../api/adminSettingsApi'

const daysOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const defaultState = {
  companyProfile: { name: '', email: '', phone: '', address: '', website: '' },
  officeTiming: { startTime: '09:00', endTime: '18:00', timezone: 'Asia/Kolkata' },
  workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  attendanceRules: { workHoursPerDay: 8, graceMinutes: 15, halfDayHours: 4 },
  leavePolicy: { casual: 12, sick: 12, earned: 15 },
  payrollSettings: { payDay: 30, pfEnabled: false, esiEnabled: false },
  holidays: []
}

function CompanyAdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState({})
  const [toast, setToast] = useState(null)
  const [data, setData] = useState(defaultState)
  const [holidayForm, setHolidayForm] = useState({ name: '', date: '', type: '', description: '' })
  const [validation, setValidation] = useState({})

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(null), 2800)
    return () => clearTimeout(timer)
  }, [toast])

  const setSectionSaving = (key, value) => setSaving((prev) => ({ ...prev, [key]: value }))

  const loadSettings = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getAdminSettings()
      const apiData = res?.data || {}
      setData({
        companyProfile: { ...defaultState.companyProfile, ...(apiData.companyProfile || {}) },
        officeTiming: { ...defaultState.officeTiming, ...(apiData.officeTiming || {}) },
        workingDays: Array.isArray(apiData.workingDays) ? apiData.workingDays : defaultState.workingDays,
        attendanceRules: { ...defaultState.attendanceRules, ...(apiData.attendanceRules || {}) },
        leavePolicy: { ...defaultState.leavePolicy, ...(apiData.leavePolicy || {}) },
        payrollSettings: { ...defaultState.payrollSettings, ...(apiData.payrollSettings || {}) },
        holidays: Array.isArray(apiData.holidays) ? apiData.holidays : []
      })
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const stats = useMemo(() => ([
    { title: 'Working Days', value: String(data.workingDays.length || 0), trend: 'Configured weekly schedule' },
    { title: 'Total Holidays', value: String(data.holidays.length || 0), trend: 'Holiday calendar entries' },
    { title: 'Daily Work Hours', value: String(data.attendanceRules.workHoursPerDay || 0), trend: 'Attendance rule baseline' },
    { title: 'Payroll Day', value: String(data.payrollSettings.payDay || 0), trend: 'Monthly payroll cycle' }
  ]), [data])

  const validateCompanyProfile = () => {
    const next = {}
    if (!String(data.companyProfile.name || '').trim()) next.companyName = 'Company name is required'
    if (!String(data.companyProfile.email || '').trim()) next.companyEmail = 'Company email is required'
    setValidation((prev) => ({ ...prev, ...next }))
    return Object.keys(next).length === 0
  }

  const saveCompanyProfile = async () => {
    if (!validateCompanyProfile()) return
    setSectionSaving('companyProfile', true)
    try {
      await updateCompanyProfile(data.companyProfile)
      setToast({ type: 'success', message: 'Company profile saved' })
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to save company profile' })
    } finally {
      setSectionSaving('companyProfile', false)
    }
  }

  const saveOfficeTiming = async () => {
    setSectionSaving('officeTiming', true)
    try {
      await updateOfficeTiming(data.officeTiming)
      setToast({ type: 'success', message: 'Office timing saved' })
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to save office timing' })
    } finally {
      setSectionSaving('officeTiming', false)
    }
  }

  const saveWorkingDays = async () => {
    if (!data.workingDays.length) {
      setToast({ type: 'error', message: 'Select at least one working day' })
      return
    }
    setSectionSaving('workingDays', true)
    try {
      await updateWorkingDays(data.workingDays)
      setToast({ type: 'success', message: 'Working days saved' })
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to save working days' })
    } finally {
      setSectionSaving('workingDays', false)
    }
  }

  const saveAttendanceRules = async () => {
    setSectionSaving('attendanceRules', true)
    try {
      await updateAttendanceRules({
        workHoursPerDay: Number(data.attendanceRules.workHoursPerDay || 0),
        graceMinutes: Number(data.attendanceRules.graceMinutes || 0),
        halfDayHours: Number(data.attendanceRules.halfDayHours || 0)
      })
      setToast({ type: 'success', message: 'Attendance rules saved' })
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to save attendance rules' })
    } finally {
      setSectionSaving('attendanceRules', false)
    }
  }

  const saveLeavePolicy = async () => {
    setSectionSaving('leavePolicy', true)
    try {
      await updateLeavePolicy({
        casual: Number(data.leavePolicy.casual || 0),
        sick: Number(data.leavePolicy.sick || 0),
        earned: Number(data.leavePolicy.earned || 0)
      })
      setToast({ type: 'success', message: 'Leave policy saved' })
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to save leave policy' })
    } finally {
      setSectionSaving('leavePolicy', false)
    }
  }

  const savePayrollSettings = async () => {
    setSectionSaving('payrollSettings', true)
    try {
      await updatePayrollSettings({
        payDay: Number(data.payrollSettings.payDay || 0),
        pfEnabled: Boolean(data.payrollSettings.pfEnabled),
        esiEnabled: Boolean(data.payrollSettings.esiEnabled)
      })
      setToast({ type: 'success', message: 'Payroll settings saved' })
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to save payroll settings' })
    } finally {
      setSectionSaving('payrollSettings', false)
    }
  }

  const onAddHoliday = async (event) => {
    event.preventDefault()
    if (!holidayForm.name.trim() || !holidayForm.date) {
      setToast({ type: 'error', message: 'Holiday name and date are required' })
      return
    }
    setSectionSaving('holidayAdd', true)
    try {
      const res = await addHoliday(holidayForm)
      setData((prev) => ({ ...prev, holidays: [res?.data, ...(prev.holidays || [])] }))
      setHolidayForm({ name: '', date: '', type: '', description: '' })
      setToast({ type: 'success', message: 'Holiday added' })
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to add holiday' })
    } finally {
      setSectionSaving('holidayAdd', false)
    }
  }

  const onDeleteHoliday = async (holiday) => {
    const id = holiday?.id
    if (!id) return
    setSectionSaving(`holidayDelete-${id}`, true)
    try {
      await deleteHoliday(id)
      setData((prev) => ({ ...prev, holidays: (prev.holidays || []).filter((item) => item.id !== id) }))
      setToast({ type: 'success', message: 'Holiday removed' })
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to remove holiday' })
    } finally {
      setSectionSaving(`holidayDelete-${id}`, false)
    }
  }

  if (loading) {
    return (
      <section className="section-layout">
        <PageHeader title="Settings" description="Configure company settings and policies." breadcrumb={['Company Admin', 'Settings']} />
        <LoadingSkeleton rows={10} />
      </section>
    )
  }

  if (error) {
    return (
      <section className="section-layout">
        <PageHeader title="Settings" description="Configure company settings and policies." breadcrumb={['Company Admin', 'Settings']} />
        <div className="panel">
          <EmptyState title="Unable to load settings" description={error} />
          <div className="actions-row" style={{ marginTop: 12 }}>
            <Button onClick={loadSettings}><RefreshCw size={14} /> Retry</Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="section-layout">
      <PageHeader
        title="Settings"
        description="Manage company profile, attendance, leave, payroll, and holiday calendar."
        breadcrumb={['Company Admin', 'Settings']}
        primaryActionLabel=""
      />

      {toast ? <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>{toast.message}</div> : null}

      <div className="stats-grid">
        {stats.map((item) => <StatCard key={item.title} {...item} />)}
      </div>

      <article className="panel">
        <div className="panel-head"><h3>Company Profile</h3></div>
        <div className="filters-row admin-filters-grid">
          <FormInput
            label="Company Name"
            value={data.companyProfile.name || ''}
            onChange={(e) => setData((p) => ({ ...p, companyProfile: { ...p.companyProfile, name: e.target.value } }))}
            error={validation.companyName || ''}
          />
          <FormInput
            label="Company Email"
            value={data.companyProfile.email || ''}
            onChange={(e) => setData((p) => ({ ...p, companyProfile: { ...p.companyProfile, email: e.target.value } }))}
            error={validation.companyEmail || ''}
          />
          <FormInput
            label="Phone"
            value={data.companyProfile.phone || ''}
            onChange={(e) => setData((p) => ({ ...p, companyProfile: { ...p.companyProfile, phone: e.target.value } }))}
          />
          <FormInput
            label="Website"
            value={data.companyProfile.website || ''}
            onChange={(e) => setData((p) => ({ ...p, companyProfile: { ...p.companyProfile, website: e.target.value } }))}
          />
        </div>
        <div style={{ marginTop: 10 }}>
          <FormInput
            label="Address"
            value={data.companyProfile.address || ''}
            onChange={(e) => setData((p) => ({ ...p, companyProfile: { ...p.companyProfile, address: e.target.value } }))}
          />
        </div>
        <div className="actions-row" style={{ marginTop: 10 }}>
          <Button onClick={saveCompanyProfile} disabled={saving.companyProfile}>{saving.companyProfile ? 'Saving...' : 'Save Company Profile'}</Button>
        </div>
      </article>

      <article className="panel">
        <div className="panel-head"><h3>Office Timing</h3></div>
        <div className="filters-row admin-filters-grid">
          <FormInput label="Start Time" type="time" value={data.officeTiming.startTime || ''} onChange={(e) => setData((p) => ({ ...p, officeTiming: { ...p.officeTiming, startTime: e.target.value } }))} />
          <FormInput label="End Time" type="time" value={data.officeTiming.endTime || ''} onChange={(e) => setData((p) => ({ ...p, officeTiming: { ...p.officeTiming, endTime: e.target.value } }))} />
          <FormInput label="Timezone" value={data.officeTiming.timezone || ''} onChange={(e) => setData((p) => ({ ...p, officeTiming: { ...p.officeTiming, timezone: e.target.value } }))} />
        </div>
        <div className="actions-row" style={{ marginTop: 10 }}>
          <Button onClick={saveOfficeTiming} disabled={saving.officeTiming}>{saving.officeTiming ? 'Saving...' : 'Save Office Timing'}</Button>
        </div>
      </article>

      <article className="panel">
        <div className="panel-head"><h3>Working Days</h3></div>
        <div className="filters-row admin-filters-grid">
          {daysOptions.map((day) => {
            const active = data.workingDays.includes(day)
            return (
              <Button
                key={day}
                variant={active ? 'primary' : 'ghost'}
                onClick={() => {
                  setData((prev) => ({
                    ...prev,
                    workingDays: active ? prev.workingDays.filter((item) => item !== day) : [...prev.workingDays, day]
                  }))
                }}
              >
                {day}
              </Button>
            )
          })}
        </div>
        <div className="actions-row" style={{ marginTop: 10 }}>
          <Button onClick={saveWorkingDays} disabled={saving.workingDays}>{saving.workingDays ? 'Saving...' : 'Save Working Days'}</Button>
        </div>
      </article>

      <div className="dashboard-main-grid">
        <article className="panel">
          <div className="panel-head"><h3>Attendance Rules</h3></div>
          <div className="filters-row admin-filters-grid">
            <FormInput label="Work Hours/Day" type="number" value={data.attendanceRules.workHoursPerDay ?? ''} onChange={(e) => setData((p) => ({ ...p, attendanceRules: { ...p.attendanceRules, workHoursPerDay: e.target.value } }))} />
            <FormInput label="Grace Minutes" type="number" value={data.attendanceRules.graceMinutes ?? ''} onChange={(e) => setData((p) => ({ ...p, attendanceRules: { ...p.attendanceRules, graceMinutes: e.target.value } }))} />
            <FormInput label="Half-Day Hours" type="number" value={data.attendanceRules.halfDayHours ?? ''} onChange={(e) => setData((p) => ({ ...p, attendanceRules: { ...p.attendanceRules, halfDayHours: e.target.value } }))} />
          </div>
          <div className="actions-row" style={{ marginTop: 10 }}>
            <Button onClick={saveAttendanceRules} disabled={saving.attendanceRules}>{saving.attendanceRules ? 'Saving...' : 'Save Attendance Rules'}</Button>
          </div>
        </article>

        <article className="panel">
          <div className="panel-head"><h3>Leave Policy</h3></div>
          <div className="filters-row admin-filters-grid">
            <FormInput label="Casual Leaves" type="number" value={data.leavePolicy.casual ?? ''} onChange={(e) => setData((p) => ({ ...p, leavePolicy: { ...p.leavePolicy, casual: e.target.value } }))} />
            <FormInput label="Sick Leaves" type="number" value={data.leavePolicy.sick ?? ''} onChange={(e) => setData((p) => ({ ...p, leavePolicy: { ...p.leavePolicy, sick: e.target.value } }))} />
            <FormInput label="Earned Leaves" type="number" value={data.leavePolicy.earned ?? ''} onChange={(e) => setData((p) => ({ ...p, leavePolicy: { ...p.leavePolicy, earned: e.target.value } }))} />
          </div>
          <div className="actions-row" style={{ marginTop: 10 }}>
            <Button onClick={saveLeavePolicy} disabled={saving.leavePolicy}>{saving.leavePolicy ? 'Saving...' : 'Save Leave Policy'}</Button>
          </div>
        </article>
      </div>

      <article className="panel">
        <div className="panel-head"><h3>Payroll Settings</h3></div>
        <div className="filters-row admin-filters-grid">
          <FormInput label="Pay Day" type="number" value={data.payrollSettings.payDay ?? ''} onChange={(e) => setData((p) => ({ ...p, payrollSettings: { ...p.payrollSettings, payDay: e.target.value } }))} />
          <FilterDropdown
            label="PF Enabled"
            value={String(Boolean(data.payrollSettings.pfEnabled))}
            onChange={(value) => setData((p) => ({ ...p, payrollSettings: { ...p.payrollSettings, pfEnabled: value === 'true' } }))}
            options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]}
          />
          <FilterDropdown
            label="ESI Enabled"
            value={String(Boolean(data.payrollSettings.esiEnabled))}
            onChange={(value) => setData((p) => ({ ...p, payrollSettings: { ...p.payrollSettings, esiEnabled: value === 'true' } }))}
            options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]}
          />
        </div>
        <div className="actions-row" style={{ marginTop: 10 }}>
          <Button onClick={savePayrollSettings} disabled={saving.payrollSettings}>{saving.payrollSettings ? 'Saving...' : 'Save Payroll Settings'}</Button>
        </div>
      </article>

      <article className="panel">
        <div className="panel-head"><h3>Holiday Calendar</h3></div>
        <form className="filters-row admin-filters-grid" onSubmit={onAddHoliday}>
          <FormInput label="Holiday Name" value={holidayForm.name} onChange={(e) => setHolidayForm((p) => ({ ...p, name: e.target.value }))} />
          <FormInput label="Date" type="date" value={holidayForm.date} onChange={(e) => setHolidayForm((p) => ({ ...p, date: e.target.value }))} />
          <FormInput label="Type" value={holidayForm.type} onChange={(e) => setHolidayForm((p) => ({ ...p, type: e.target.value }))} />
          <FormInput label="Description" value={holidayForm.description} onChange={(e) => setHolidayForm((p) => ({ ...p, description: e.target.value }))} />
          <div className="actions-row" style={{ alignItems: 'end' }}>
            <Button type="submit" disabled={saving.holidayAdd}>{saving.holidayAdd ? 'Adding...' : 'Add Holiday'}</Button>
          </div>
        </form>

        <div className="panel" style={{ marginTop: 12 }}>
          {data.holidays.length === 0 ? <EmptyState title="No holidays configured" description="Add holidays to build your company calendar." /> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.holidays.map((holiday) => (
                    <tr key={holiday.id}>
                      <td>{holiday.name || '-'}</td>
                      <td>{String(holiday.date || '').slice(0, 10)}</td>
                      <td>{holiday.type || '-'}</td>
                      <td>{holiday.description || '-'}</td>
                      <td>
                        <button className="text-btn danger" onClick={() => onDeleteHoliday(holiday)} disabled={saving[`holidayDelete-${holiday.id}`]}>
                          <Trash2 size={13} /> {saving[`holidayDelete-${holiday.id}`] ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </article>
    </section>
  )
}

export default CompanyAdminSettingsPage
