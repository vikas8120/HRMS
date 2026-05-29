import ManagerGrievancePage from './manager/grievance/ManagerGrievancePage'

function HrGrievancePage() {
  return (
    <ManagerGrievancePage
      portalLabel="HR Portal"
      title="Grievance Module"
      description="Review and manage grievance records with filters and actions."
      primaryActionLabel="Raise Grievance"
      listTitle="HR Grievance Records"
    />
  )
}

export default HrGrievancePage
