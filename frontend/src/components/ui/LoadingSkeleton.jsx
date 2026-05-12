function LoadingSkeleton({ rows = 6 }) {
  return (
    <div className="skeleton-wrap">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="skeleton-line" />
      ))}
    </div>
  )
}

export default LoadingSkeleton
