import EmptyState from '../../../components/ui/EmptyState'
import LoadingSkeleton from '../../../components/ui/LoadingSkeleton'
import Modal from '../../../components/ui/Modal'

function ComplaintDetailsModal({ open, onClose, complaint, loading = false }) {
  return (
    <Modal open={open} title="Complaint Details" onClose={onClose}>
      {loading ? <LoadingSkeleton rows={5} /> : !complaint ? <EmptyState title="No details found" description="Unable to load complaint details." /> : (
        <div className="modal-form">
          <div className="inline-action-card"><strong>Complaint No.:</strong> <span>{complaint.complaintNo || '-'}</span></div>
          <div className="inline-action-card"><strong>Complaint Date:</strong> <span>{complaint.complaintDate || '-'}</span></div>
          <div className="inline-action-card"><strong>Employee Name:</strong> <span>{complaint.employeeName || '-'}</span></div>
          <div className="inline-action-card"><strong>Against Employee:</strong> <span>{complaint.againstEmployee || '-'}</span></div>
          <div className="inline-action-card"><strong>Department:</strong> <span>{complaint.department || '-'}</span></div>
          <div className="inline-action-card"><strong>Category:</strong> <span>{complaint.complaintCategory || '-'}</span></div>
          <div className="inline-action-card"><strong>Severity:</strong> <span>{complaint.severityLevel || '-'}</span></div>
          <div className="inline-action-card"><strong>Status:</strong> <span>{complaint.status || '-'}</span></div>
          <div className="inline-action-card"><strong>Confidential:</strong> <span>{complaint.confidential || 'No'}</span></div>
          <div className="inline-action-card"><strong>Witness:</strong> <span>{complaint.witnessOptional || '-'}</span></div>
          <div className="inline-action-card"><strong>Evidence File:</strong> <span>{complaint.evidenceFileName || '-'}</span></div>
          <div className="inline-action-card"><strong>Complaint Details:</strong> <span>{complaint.complaintDetails || '-'}</span></div>
          <div className="inline-action-card"><strong>Action Taken:</strong> <span>{complaint.actionTaken || '-'}</span></div>
          <div className="inline-action-card"><strong>Closure Date:</strong> <span>{complaint.closureDate || '-'}</span></div>
        </div>
      )}
    </Modal>
  )
}

export default ComplaintDetailsModal
