import ManagerComplaintBoxPage from './manager/complaint-box/ManagerComplaintBoxPage'

function CompanyAdminComplaintBoxPage() {
  return (
    <ManagerComplaintBoxPage
      portalLabel="Company Admin"
      title="Complaint Box Module"
      description="Track and manage workplace complaints with category/severity filters."
      primaryActionLabel="Raise Complaint"
      listTitle="Company Complaint Records"
      scope="admin"
    />
  )
}

export default CompanyAdminComplaintBoxPage
