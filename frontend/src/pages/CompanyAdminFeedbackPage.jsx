import ManagerFeedbackPage from './manager/feedback/ManagerFeedbackPage'

function CompanyAdminFeedbackPage() {
  return (
    <ManagerFeedbackPage
      portalLabel="Company Admin"
      title="Feedback Module"
      description="Capture and review organization-wide feedback with category, type, and status filters."
      primaryActionLabel="Submit Feedback"
      listTitle="Company Feedback Records"
    />
  )
}

export default CompanyAdminFeedbackPage
