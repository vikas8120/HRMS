function EmptyState({ title = 'No data available', description = 'Try adjusting filters or add a new record.' }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}

export default EmptyState
