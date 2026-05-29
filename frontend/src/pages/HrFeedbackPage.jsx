import ManagerFeedbackPage from './manager/feedback/ManagerFeedbackPage'

function HrFeedbackPage() {
  return (
    <ManagerFeedbackPage
      portalLabel="HR Portal"
      title="Feedback Module"
      description="Capture and review feedback with category, type, and status filters."
      primaryActionLabel="Submit Feedback"
      listTitle="HR Feedback Records"
    />
  )
}

export default HrFeedbackPage
