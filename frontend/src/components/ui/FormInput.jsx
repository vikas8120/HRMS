function FormInput({ label, error = '', ...props }) {
  return (
    <label className="form-input-wrap">
      <span>{label}</span>
      <input className={`form-input ${error ? 'form-input-error' : ''}`} {...props} />
      {error ? <small className="field-error">{error}</small> : null}
    </label>
  )
}

export default FormInput
