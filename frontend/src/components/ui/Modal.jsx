import Button from './Button'

function Modal({ open, title, children, onClose }) {
  if (!open) return null

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-head">
          <h3>{title}</h3>
          <Button variant="ghost" className="modal-close-btn" onClick={onClose}>Close</Button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

export default Modal
