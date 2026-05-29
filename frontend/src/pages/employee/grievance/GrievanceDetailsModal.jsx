import Modal from '../../../components/ui/Modal'
import LoadingSkeleton from '../../../components/ui/LoadingSkeleton'
import EmptyState from '../../../components/ui/EmptyState'

function GrievanceDetailsModal({ open, onClose, grievance, loading = false }) {
  return (
    <Modal open={open} title="Grievance Details" onClose={onClose}>
      {loading ? <LoadingSkeleton rows={5} /> : !grievance ? <EmptyState title="No details found" description="Unable to load grievance details." /> : (
        <div className="modal-form">
          <div className="inline-action-card"><strong>Grievance No.:</strong> <span>{grievance.grievanceNo || '-'}</span></div>
          <div className="inline-action-card"><strong>Employee ID:</strong> <span>{grievance.employeeId || '-'}</span></div>
          <div className="inline-action-card"><strong>Employee Name:</strong> <span>{grievance.employeeName || '-'}</span></div>
          <div className="inline-action-card"><strong>Department:</strong> <span>{grievance.department || '-'}</span></div>
          <div className="inline-action-card"><strong>Date Raised:</strong> <span>{grievance.dateRaised || '-'}</span></div>
          <div className="inline-action-card"><strong>Grievance Type:</strong> <span>{grievance.grievanceType || '-'}</span></div>
          <div className="inline-action-card"><strong>Priority:</strong> <span>{grievance.priority || '-'}</span></div>
          <div className="inline-action-card"><strong>Status:</strong> <span>{grievance.status || '-'}</span></div>
          <div className="inline-action-card"><strong>Description:</strong> <span>{grievance.description || '-'}</span></div>
          <div className="inline-action-card"><strong>Resolution Remarks:</strong> <span>{grievance.resolutionRemarks || '-'}</span></div>
          <div className="inline-action-card"><strong>Resolution Date:</strong> <span>{grievance.resolutionDate || '-'}</span></div>
        </div>
      )}
    </Modal>
  )
}

export default GrievanceDetailsModal
