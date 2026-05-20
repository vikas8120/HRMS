import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import { hrModuleConfig, hrNavItems } from '../data/hrPortalData'

function HrWorkspaceModulePage() {
  const { pathname } = useLocation()
  const activeNav = useMemo(() => hrNavItems.find((item) => item.path === pathname), [pathname])
  const moduleKey = activeNav?.key || 'dashboard'
  const config = hrModuleConfig[moduleKey] || hrModuleConfig.dashboard

  return (
    <section className="section-layout">
      <PageHeader
        title={config.title}
        description={config.description}
        breadcrumb={['HR Portal', config.title]}
      />

      <div className="panel">
        <div className="panel-head"><h3>{config.title} Sub Modules</h3></div>
        <div className="tabs-row">
          {config.submodules.map((item) => <span key={item} className="chip-btn">{item}</span>)}
        </div>
      </div>

      <div className="panel">
        <EmptyState
          title={`${config.title} workspace is ready`}
          description="This HR module is now routed and authenticated. We can now implement full API/data workflow sub-module by sub-module."
        />
      </div>
    </section>
  )
}

export default HrWorkspaceModulePage

