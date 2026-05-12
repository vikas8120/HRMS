function StatCard({ title, value, trend, icon: Icon, trendTone = 'info' }) {
  return (
    <article className="stat-card premium-stat-card">
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
