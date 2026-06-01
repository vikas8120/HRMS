import Button from '../../../components/ui/Button'
import FilterDropdown from '../../../components/ui/FilterDropdown'
import Modal from '../../../components/ui/Modal'

const categoryOptions = [
  { value: 'Work Culture', label: 'Work Culture' },
  { value: 'Management', label: 'Management' },
  { value: 'Training', label: 'Training' },
  { value: 'Facilities', label: 'Facilities' },
  { value: 'Other', label: 'Other' }
]

const typeOptions = [
  { value: 'Suggestion', label: 'Suggestion' },
  { value: 'Appreciation', label: 'Appreciation' },
  { value: 'Improvement', label: 'Improvement' }
]

function FeedbackFormModal({ open, onClose, form, setForm, submitting = false, editing = false, onSubmit }) {
  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit()
  }

  return (
    <Modal open={open} title={editing ? 'Edit Feedback' : 'Submit Feedback'} onClose={onClose}>
      <form className="modal-form company-form-modal" onSubmit={handleSubmit}>
        <div className="company-form-section">
          <div className="company-form-section-head">
            <h4>Feedback Info</h4>
            <p>Reference details of submitter and date.</p>
          </div>
          <div className="form-grid company-form-grid">
            <label className="form-input-wrap"><span>Feedback No.</span><input className="form-input" value={form.feedbackNo} disabled /></label>
            <label className="form-input-wrap"><span>Employee Name</span><input className="form-input" value={form.employeeName} disabled /></label>
            <label className="form-input-wrap"><span>Department</span><input className="form-input" value={form.department} disabled /></label>
            <label className="form-input-wrap"><span>Date Submitted</span><input className="form-input" value={form.dateSubmitted} disabled /></label>
          </div>
        </div>

        <div className="company-form-section">
          <div className="company-form-section-head">
            <h4>Feedback Content</h4>
            <p>Category, type and detailed feedback message.</p>
          </div>
          <div className="form-grid company-form-grid">
            <FilterDropdown label="Feedback Category" value={form.feedbackCategory} onChange={(value) => setForm((prev) => ({ ...prev, feedbackCategory: value }))} options={categoryOptions} disabled={submitting} />
            <FilterDropdown label="Feedback Type" value={form.feedbackType} onChange={(value) => setForm((prev) => ({ ...prev, feedbackType: value }))} options={typeOptions} disabled={submitting} />
            <label className="form-input-wrap" style={{ gridColumn: '1 / -1' }}>
              <span>Feedback Details</span>
              <textarea className="form-input" rows={4} value={form.feedbackDetails} onChange={(event) => setForm((prev) => ({ ...prev, feedbackDetails: event.target.value }))} disabled={submitting} maxLength={1000} placeholder="Describe your feedback..." />
            </label>
          </div>
        </div>

        {editing ? (
          <div className="company-form-section">
            <div className="company-form-section-head">
              <h4>Resolution</h4>
              <p>Review current status and action summary.</p>
            </div>
            <div className="form-grid company-form-grid">
              <label className="form-input-wrap"><span>Status</span><input className="form-input" value={form.status} disabled /></label>
              <label className="form-input-wrap" style={{ gridColumn: '1 / -1' }}><span>Action Taken</span><textarea className="form-input" rows={3} value={form.actionTaken} disabled readOnly /></label>
            </div>
          </div>
        ) : null}
        <div className="modal-actions">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : (editing ? 'Update Feedback' : 'Submit Feedback')}</Button>
        </div>
      </form>
    </Modal>
  )
}

export default FeedbackFormModal
