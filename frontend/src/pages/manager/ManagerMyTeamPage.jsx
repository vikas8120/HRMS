import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/ui/PageHeader'
import SearchBar from '../../components/ui/SearchBar'
import FilterDropdown from '../../components/ui/FilterDropdown'
import Button from '../../components/ui/Button'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import { getManagerTeam } from '../../api/managerTeamApi'

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toISOString().slice(0, 10)
}

const statusClass = (value) => `badge badge-${String(value || 'inactive').toLowerCase()}`

function EmployeeAvatar({ item }) {
  if (item.profileImage) {
    return <img src={item.profileImage} alt={item.name} className="team-avatar-img" />
  }

  const initials = String(item.name || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U'

  return <div className="team-avatar-fallback">{initials}</div>
}

function ManagerMyTeamPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [filters, setFilters] = useState({ departments: [], designations: [] })

  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('all')
  const [designation, setDesignation] = useState('all')
  const [status, setStatus] = useState('all')
  const [attendanceStatus, setAttendanceStatus] = useState('all')

  const loadTeam = async (next = {}) => {
    setLoading(true)
    setError('')
    try {
      const response = await getManagerTeam({
        search: next.search ?? search,
        department: next.department ?? department,
        designation: next.designation ?? designation,
        status: next.status ?? status,
        attendanceStatus: next.attendanceStatus ?? attendanceStatus
      })
      setRows(response?.data || [])
      setFilters(response?.filters || { departments: [], designations: [] })
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load team members')
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTeam()
  }, [])

  const departmentOptions = useMemo(() => ([
    { value: 'all', label: 'All Departments' },
    ...(filters.departments || []).map((item) => ({ value: String(item.id), label: item.name || '-' }))
  ]), [filters.departments])

  const designationOptions = useMemo(() => ([
    { value: 'all', label: 'All Designations' },
    ...(filters.designations || []).map((item) => ({ value: item, label: item }))
  ]), [filters.designations])

  return (
    <section className="section-layout">
      <PageHeader
        title="My Team"
        description="View and manage employees assigned to you, with attendance and execution context."
        breadcrumb={['Manager Portal', 'My Team']}
      />

      <div className="panel filters-panel">
        <div className="filters-row admin-filters-grid">
          <div className="search-wrap">
            <label>Search</label>
            <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, or phone" />
          </div>

          <FilterDropdown label="Department" value={department} onChange={setDepartment} options={departmentOptions} />
          <FilterDropdown label="Designation" value={designation} onChange={setDesignation} options={designationOptions} />
          <FilterDropdown
            label="Status"
            value={status}
            onChange={setStatus}
            options={[{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
          />
          <FilterDropdown
            label="Attendance"
            value={attendanceStatus}
            onChange={setAttendanceStatus}
            options={[{ value: 'all', label: 'All' }, { value: 'present', label: 'Present' }, { value: 'absent', label: 'Absent' }]}
          />
        </div>

        <div className="actions-row" style={{ marginTop: 10 }}>
          <Button variant="ghost" onClick={() => loadTeam()}>Apply Filters</Button>
          <Button variant="ghost" onClick={() => {
            setSearch('')
            setDepartment('all')
            setDesignation('all')
            setStatus('all')
            setAttendanceStatus('all')
            loadTeam({ search: '', department: 'all', designation: 'all', status: 'all', attendanceStatus: 'all' })
          }}>
            Reset
          </Button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Assigned Employees</h3></div>
        {loading ? <LoadingSkeleton rows={6} /> : error ? <EmptyState title="Unable to load team" description={error} /> : rows.length === 0 ? (
          <EmptyState title="No team members found" description="No employees matched the selected filters." />
        ) : (
          <div className="table-wrap">
            <div className="table-meta"><p>{rows.length} records</p></div>
            <table>
              <thead>
                <tr>
                  <th>Profile</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Status</th>
                  <th>Joining Date</th>
                  <th>Today Attendance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.id}>
                    <td><EmployeeAvatar item={item} /></td>
                    <td>{item.name}</td>
                    <td>{item.email}</td>
                    <td>{item.phone}</td>
                    <td>{item.department}</td>
                    <td>{item.designation}</td>
                    <td><span className={statusClass(item.status)}>{item.status}</span></td>
                    <td>{formatDate(item.joiningDate)}</td>
                    <td><span className={statusClass(item.todayAttendanceStatus)}>{item.todayAttendanceStatus}</span></td>
                    <td>
                      <div className="table-actions">
                        <button className="text-btn" onClick={() => navigate(`/manager/team/${item.employeeId}`)}>View Profile</button>
                        <button className="text-btn" onClick={() => navigate(`/manager/attendance?employeeId=${item.employeeId}`)}>View Attendance</button>
                        <button className="text-btn" onClick={() => navigate(`/manager/leaves?employeeId=${item.employeeId}`)}>View Leave History</button>
                        <button className="text-btn" onClick={() => navigate(`/manager/tasks?employeeId=${item.employeeId}`)}>View Tasks</button>
                        <button className="text-btn" onClick={() => navigate(`/manager/performance?employeeId=${item.employeeId}`)}>Review Performance</button>
                        <button className="text-btn" onClick={() => navigate(`/manager/communication?employeeId=${item.employeeId}`)}>Message Employee</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

export default ManagerMyTeamPage
