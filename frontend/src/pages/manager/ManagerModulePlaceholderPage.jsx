import { useMemo } from 'react'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/ui/PageHeader'
import { useAuth } from '../../hooks/useAuth'

function ManagerModulePlaceholderPage({ title }) {
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
        title={title}
        description="Manager workspace module scaffolded and ready for feature implementation."
        breadcrumb={['Manager Portal', title]}
      />

      <div className="panel">
        <div className="panel-head"><h3>Logged-In Manager Context</h3></div>
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
          title={`${title} module is ready`}
          description="This route is protected for manager role and connected to your existing authentication context."
        />
      </div>
    </section>
  )
}

export default ManagerModulePlaceholderPage
