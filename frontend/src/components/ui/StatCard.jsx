function StatCard({ title, value, trend, icon: Icon, trendTone = 'info', onClick }) {
  const isClickable = typeof onClick === 'function'

  const handleKeyDown = (event) => {
    if (!isClickable) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick()
    }
  }

  return (
    <article
      className={`stat-card premium-stat-card ${isClickable ? 'clickable' : ''}`}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? onClick : undefined}
      onKeyDown={handleKeyDown}
      style={isClickable ? { cursor: 'pointer' } : undefined}
    >
      <div>
        <p className="stat-title">{title}</p>
        <h3 className="stat-value">{value}</h3>
        <p className={`stat-trend trend-${trendTone}`}>{trend}</p>
      </div>
      <div className="stat-icon">{Icon ? <Icon size={20} /> : null}</div>
    </article>
  )
}

export default StatCard
