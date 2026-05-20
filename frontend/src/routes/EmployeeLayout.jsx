import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import EmployeeSidebar from '../components/layout/EmployeeSidebar'

function EmployeeLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className={`app-shell manager-shell ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
      <EmployeeSidebar onToggle={() => setSidebarOpen((prev) => !prev)} />
      <div className="content-shell">
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default EmployeeLayout
