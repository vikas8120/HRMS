import ManagerLeaveManagementPage from './manager/ManagerLeaveManagementPage'

function HrLeavePage() {
  return (
    <ManagerLeaveManagementPage
      portalLabel="HR Portal"
      myTabLabel="My Leave"
      teamTabLabel="Employee Leave"
      myViewTitle="HR Leaves"
      teamViewTitle="Leave Management"
      myViewDescription="Apply and track your leave requests with balance and policy visibility."
      teamViewDescription="Review and action leave requests submitted by employees."
      entityLabel="Employee"
    />
  )
}

export default HrLeavePage
