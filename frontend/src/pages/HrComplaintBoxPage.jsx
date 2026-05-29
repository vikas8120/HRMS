import ManagerComplaintBoxPage from './manager/complaint-box/ManagerComplaintBoxPage'

function HrComplaintBoxPage() {
  return (
    <ManagerComplaintBoxPage
      portalLabel="HR Portal"
      title="Complaint Box Module"
      description="Track and manage workplace complaints with category/severity filters."
      primaryActionLabel="Raise Complaint"
      listTitle="HR Complaint Records"
    />
  )
}

export default HrComplaintBoxPage
