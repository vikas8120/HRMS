import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import FilterDropdown from '../../../components/ui/FilterDropdown'

const grievanceTypeOptions = [
  { value: 'Salary', label: 'Salary' },
  { value: 'Manager', label: 'Manager' },
  { value: 'Leave', label: 'Leave' },
  { value: 'Behavior', label: 'Behavior' },
  { value: 'Workload', label: 'Workload' },
  { value: 'Other', label: 'Other' }
]

const priorityOptions = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' }
]

function GrievanceFormModal({
  open,
  onClose,
  onSubmit,
  submitting = false,
  form,
  setForm,
  editing = false
}) {
  const title = editing ? 'Edit Grievance' : 'Raise New Grievance'

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <div className="modal-form company-form-modal">
        <div className="company-form-section">
          <div className="company-form-section-head">
            <h4>Grievance Info</h4>
            <p>Basic grievance and employee reference details.</p>
          </div>
          <div className="form-grid company-form-grid">
            <label className="form-input-wrap"><span>Grievance No.</span><input className="form-input" value={form.grievanceNo} disabled /></label>
            <label className="form-input-wrap"><span>Employee ID</span><input className="form-input" value={form.employeeId} disabled /></label>
            <label className="form-input-wrap"><span>Employee Name</span><input className="form-input" value={form.employeeName} disabled /></label>
            <label className="form-input-wrap"><span>Department</span><input className="form-input" value={form.department} disabled /></label>
            <label className="form-input-wrap"><span>Date Raised</span><input className="form-input" type="date" value={form.dateRaised} disabled /></label>
          </div>
        </div>

        <div className="company-form-section">
          <div className="company-form-section-head">
            <h4>Issue Details</h4>
            <p>Capture grievance type, priority and description.</p>
          </div>
          <div className="form-grid company-form-grid">
            <FilterDropdown
              label="Grievance Type"
              value={form.grievanceType}
              onChange={(value) => setForm((prev) => ({ ...prev, grievanceType: value }))}
              options={grievanceTypeOptions}
              disabled={submitting}
            />
            <FilterDropdown
              label="Priority"
              value={form.priority}
              onChange={(value) => setForm((prev) => ({ ...prev, priority: value }))}
              options={priorityOptions}
              disabled={submitting}
            />
            <label className="form-input-wrap" style={{ gridColumn: '1 / -1' }}>
              <span>Description</span>
              <textarea
                className="form-input"
                rows={4}
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                disabled={submitting}
              />
            </label>
          </div>
        </div>

        <div className="company-form-section">
          <div className="company-form-section-head">
            <h4>Resolution</h4>
            <p>Track status and closure remarks.</p>
          </div>
          <div className="form-grid company-form-grid">
            <label className="form-input-wrap"><span>Status</span><input className="form-input" value={form.status} disabled /></label>
            <label className="form-input-wrap"><span>Resolution Date</span><input className="form-input" type="date" value={form.resolutionDate} disabled readOnly /></label>
            <label className="form-input-wrap" style={{ gridColumn: '1 / -1' }}><span>Resolution Remarks</span><textarea className="form-input" rows={3} value={form.resolutionRemarks} disabled readOnly /></label>
          </div>
        </div>

        <div className="actions-row">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={onSubmit} disabled={submitting}>{submitting ? 'Saving...' : (editing ? 'Update Grievance' : 'Submit Grievance')}</Button>
        </div>
      </div>
    </Modal>
  )
}

export default GrievanceFormModal
