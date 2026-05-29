import EmptyState from '../../../components/ui/EmptyState'
import LoadingSkeleton from '../../../components/ui/LoadingSkeleton'
import Modal from '../../../components/ui/Modal'

function FeedbackDetailsModal({ open, onClose, feedback, loading = false }) {
  return (
    <Modal open={open} title="Feedback Details" onClose={onClose}>
      {loading ? <LoadingSkeleton rows={4} /> : !feedback ? <EmptyState title="No details" description="Unable to load selected feedback." /> : (
        <div className="modal-form">
          <div className="inline-action-card"><strong>Feedback No.:</strong> <span>{feedback.feedbackNo || '-'}</span></div>
          <div className="inline-action-card"><strong>Employee Name:</strong> <span>{feedback.employeeName || '-'}</span></div>
          <div className="inline-action-card"><strong>Department:</strong> <span>{feedback.department || '-'}</span></div>
          <div className="inline-action-card"><strong>Date Submitted:</strong> <span>{feedback.dateSubmitted || '-'}</span></div>
          <div className="inline-action-card"><strong>Category:</strong> <span>{feedback.feedbackCategory || '-'}</span></div>
          <div className="inline-action-card"><strong>Type:</strong> <span>{feedback.feedbackType || '-'}</span></div>
          <div className="inline-action-card"><strong>Status:</strong> <span>{feedback.status || '-'}</span></div>
          <div className="inline-action-card"><strong>Feedback Details:</strong> <span>{feedback.feedbackDetails || '-'}</span></div>
          <div className="inline-action-card"><strong>Action Taken:</strong> <span>{feedback.actionTaken || '-'}</span></div>
        </div>
      )}
    </Modal>
  )
}

export default FeedbackDetailsModal
