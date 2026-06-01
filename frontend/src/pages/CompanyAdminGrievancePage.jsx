import ManagerGrievancePage from './manager/grievance/ManagerGrievancePage'

function CompanyAdminGrievancePage() {
  return (
    <ManagerGrievancePage
      portalLabel="Company Admin"
      title="Grievance Module"
      description="Review and manage grievance records with filters and actions."
      primaryActionLabel="Raise Grievance"
      listTitle="Company Grievance Records"
      scope="admin"
    />
  )
}

export default CompanyAdminGrievancePage
