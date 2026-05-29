import Button from '../../../components/ui/Button'
import FilterDropdown from '../../../components/ui/FilterDropdown'
import Modal from '../../../components/ui/Modal'

const categoryOptions = [
  { value: 'Harassment', label: 'Harassment' },
  { value: 'Misconduct', label: 'Misconduct' },
  { value: 'Attendance', label: 'Attendance' },
  { value: 'Policy Violation', label: 'Policy Violation' },
  { value: 'Other', label: 'Other' }
]

const severityOptions = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' }
]

const confidentialOptions = [
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' }
]

function ComplaintFormModal({ open, onClose, form, setForm, submitting = false, editing = false, onSubmit }) {
  return (
    <Modal open={open} title={editing ? 'Edit Complaint' : 'Raise Complaint'} onClose={onClose}>
      <div className="modal-form">
        <label className="form-input-wrap"><span>Complaint No.</span><input className="form-input" value={form.complaintNo} disabled /></label>
        <label className="form-input-wrap"><span>Complaint Date</span><input className="form-input" type="date" value={form.complaintDate} disabled /></label>
        <label className="form-input-wrap"><span>Employee Name</span><input className="form-input" value={form.employeeName} disabled /></label>
        <label className="form-input-wrap"><span>Department</span><input className="form-input" value={form.department} disabled /></label>
        <label className="form-input-wrap">
          <span>Against Employee</span>
          <input className="form-input" value={form.againstEmployee} onChange={(event) => setForm((prev) => ({ ...prev, againstEmployee: event.target.value }))} disabled={submitting} />
        </label>
        <FilterDropdown label="Complaint Category" value={form.complaintCategory} onChange={(value) => setForm((prev) => ({ ...prev, complaintCategory: value }))} options={categoryOptions} disabled={submitting} />
        <label className="form-input-wrap">
          <span>Complaint Details</span>
          <textarea className="form-input" rows={4} value={form.complaintDetails} onChange={(event) => setForm((prev) => ({ ...prev, complaintDetails: event.target.value }))} disabled={submitting} />
        </label>
        <label className="form-input-wrap">
          <span>Witness (Optional)</span>
          <input className="form-input" value={form.witnessOptional} onChange={(event) => setForm((prev) => ({ ...prev, witnessOptional: event.target.value }))} disabled={submitting} />
        </label>
        <label className="form-input-wrap">
          <span>Evidence Upload (Optional)</span>
          <input
            className="form-input"
            type="file"
            accept=".png,.jpg,.jpeg,.pdf,.doc,.docx"
            onChange={(event) => {
              const file = event.target.files?.[0]
              setForm((prev) => ({ ...prev, evidenceFileName: file?.name || '' }))
            }}
            disabled={submitting}
          />
          {form.evidenceFileName ? <small>{form.evidenceFileName}</small> : null}
        </label>
        <FilterDropdown label="Severity Level" value={form.severityLevel} onChange={(value) => setForm((prev) => ({ ...prev, severityLevel: value }))} options={severityOptions} disabled={submitting} />
        <FilterDropdown label="Confidential" value={form.confidential} onChange={(value) => setForm((prev) => ({ ...prev, confidential: value }))} options={confidentialOptions} disabled={submitting} />
        <label className="form-input-wrap"><span>Status</span><input className="form-input" value={form.status} disabled /></label>
        <label className="form-input-wrap"><span>Action Taken</span><textarea className="form-input" rows={3} value={form.actionTaken} disabled readOnly /></label>
        <label className="form-input-wrap"><span>Closure Date</span><input className="form-input" type="date" value={form.closureDate} disabled readOnly /></label>
        <div className="actions-row">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={onSubmit} disabled={submitting}>{submitting ? 'Saving...' : (editing ? 'Update Complaint' : 'Submit Complaint')}</Button>
        </div>
      </div>
    </Modal>
  )
}

export default ComplaintFormModal
