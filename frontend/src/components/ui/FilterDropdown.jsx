function FilterDropdown({ label, value, onChange, options, disabled = false }) {
  return (
    <label className="form-input-wrap">
      <span>{label}</span>
      <select className="form-input" value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export default FilterDropdown

