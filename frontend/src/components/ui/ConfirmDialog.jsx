import Modal from './Modal'
import Button from './Button'

function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <div className="confirm-dialog">
        <p>{message}</p>
        <div className="actions-row">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm}>Confirm</Button>
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
