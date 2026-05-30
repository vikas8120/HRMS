import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import Button from './Button'

function Modal({ open, title, children, onClose, modalClassName = '', bodyClassName = '' }) {
  useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  useEffect(() => {
    if (!open || typeof window === 'undefined') return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const modalContent = (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={`modal-card ${modalClassName}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Modal'}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <h3>{title}</h3>
          <Button variant="ghost" className="modal-close-btn" onClick={onClose} aria-label="Close modal">&times;</Button>
        </div>
        <div className={`modal-body ${bodyClassName}`.trim()}>{children}</div>
      </div>
    </div>
  )

  if (typeof document === 'undefined' || !document.body) return modalContent
  return createPortal(modalContent, document.body)
}

export { Modal }
export default Modal
