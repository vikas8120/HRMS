import { Search, X } from 'lucide-react'

function SearchBar({ value = '', onChange = () => {}, placeholder = 'Search...', ariaLabel = 'Search' }) {
  const hasValue = value?.trim().length > 0

  return (
    <div className="search-input-wrap">
      <Search size={16} className="search-input-icon" />
      <input
        className="form-input search-input-field"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
      {hasValue ? (
        <button
          type="button"
          className="search-clear-btn"
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      ) : null}
    </div>
  )
}

export default SearchBar
