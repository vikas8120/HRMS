import { Suspense, lazy } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import EmptyState from '../../components/ui/EmptyState'

const AdminManagementModulePage = lazy(() => import('../admin/AdminManagementModulePage'))
const CompanyManagementModulePage = lazy(() => import('../company/CompanyManagementModulePage'))
const SubscriptionBillingModulePage = lazy(() => import('../subscription/SubscriptionBillingModulePage'))
const RevenueAnalyticsModulePage = lazy(() => import('../revenue/RevenueAnalyticsModulePage'))
const GlobalUsersModulePage = lazy(() => import('../global-users/GlobalUsersModulePage'))
const SupportCenterModulePage = lazy(() => import('../support/SupportCenterModulePage'))
const AuditSecurityModulePage = lazy(() => import('../audit-security/AuditSecurityModulePage'))
const IntegrationsModulePage = lazy(() => import('../integrations/IntegrationsModulePage'))
const AICenterModulePage = lazy(() => import('../ai-center/AICenterModulePage'))
const BackupRestoreModulePage = lazy(() => import('../backup/BackupRestoreModulePage'))
const ReportsModulePage = lazy(() => import('../reports/ReportsModulePage'))
const SystemSettingsModulePage = lazy(() => import('../settings/SystemSettingsModulePage'))
const FeatureManagementModulePage = lazy(() => import('../settings/FeatureManagementModulePage'))

function SectionPage({ module, page }) {
  const moduleFallback = <div className="panel">Loading {module}...</div>

  if (module === 'Admin Management') return <Suspense fallback={moduleFallback}><AdminManagementModulePage page={page} /></Suspense>
  if (module === 'Company Management') return <Suspense fallback={moduleFallback}><CompanyManagementModulePage page={page} /></Suspense>
  if (module === 'Subscription & Billing') return <Suspense fallback={moduleFallback}><SubscriptionBillingModulePage page={page} /></Suspense>
  if (module === 'Revenue & Analytics') return <Suspense fallback={moduleFallback}><RevenueAnalyticsModulePage page={page} /></Suspense>
  if (module === 'Global Users') return <Suspense fallback={moduleFallback}><GlobalUsersModulePage page={page} /></Suspense>
  if (module === 'Support Center') return <Suspense fallback={moduleFallback}><SupportCenterModulePage page={page} /></Suspense>
  if (module === 'Audit & Security') return <Suspense fallback={moduleFallback}><AuditSecurityModulePage page={page} /></Suspense>
  if (module === 'Integrations') return <Suspense fallback={moduleFallback}><IntegrationsModulePage page={page} /></Suspense>
  if (module === 'AI Center') return <Suspense fallback={moduleFallback}><AICenterModulePage page={page} /></Suspense>
  if (module === 'Backup & Restore') return <Suspense fallback={moduleFallback}><BackupRestoreModulePage page={page} /></Suspense>
  if (module === 'Reports') return <Suspense fallback={moduleFallback}><ReportsModulePage page={page} /></Suspense>
  if (module === 'System Settings') return <Suspense fallback={moduleFallback}><SystemSettingsModulePage page={page} /></Suspense>
  if (module === 'Feature Management') return <Suspense fallback={moduleFallback}><FeatureManagementModulePage page={page} /></Suspense>

  return (
    <section className="section-layout">
      <PageHeader title={module} description={`${module} workspace`} breadcrumb={['Super Admin', module, page || 'Workspace']} />
      <div className="panel">
        <EmptyState
          title={`${module} page mapping is not configured`}
          description="This route currently has no dedicated module page. Add a specific module component and bind it in SectionPage."
        />
      </div>
    </section>
  )
}

export default SectionPage
