import { useMemo } from 'react'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import { useAuth } from '../hooks/useAuth'

function CompanyAdminModulePage({ moduleName }) {
  const { user } = useAuth()

  const profileRows = useMemo(() => ([
    { label: 'Name', value: user?.name || '-' },
    { label: 'Email', value: user?.email || '-' },
    { label: 'Role', value: user?.role || '-' },
    { label: 'Company ID', value: user?.companyId || '-' },
    { label: 'Status', value: user?.status || '-' }
  ]), [user])

  return (
    <section className="section-layout">
      <PageHeader
        title={moduleName}
        description="Authenticated workspace for role-specific modules."
        breadcrumb={['Company Portal', moduleName]}
      />

      <div className="panel">
        <div className="panel-head"><h3>Profile Context</h3></div>
        <div className="modal-form">
          {profileRows.map((row) => (
            <div key={row.label}>
              <strong>{row.label}:</strong> {row.value}
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <EmptyState
          title={`${moduleName} is authenticated and connected`}
          description="This module uses your real logged-in identity. Add role-specific APIs when you define HR/Manager/Employee workflows."
        />
      </div>
    </section>
  )
}

export default CompanyAdminModulePage
