import LoadingSkeleton from '../../../components/ui/LoadingSkeleton'
import StatCard from '../../../components/ui/StatCard'

function ComplaintStatsCards({ rows = [], loading = false }) {
  if (loading) return <LoadingSkeleton rows={2} />

  const total = rows.length
  const open = rows.filter((item) => item.status === 'Open').length
  const underReview = rows.filter((item) => item.status === 'Under Review').length
  const closed = rows.filter((item) => item.status === 'Closed').length

  const cards = [
    { title: 'Total Complaints', value: String(total), trend: 'All complaints', trendTone: 'info' },
    { title: 'Open', value: String(open), trend: 'Needs review', trendTone: 'danger' },
    { title: 'Under Review', value: String(underReview), trend: 'In process', trendTone: 'warning' },
    { title: 'Closed', value: String(closed), trend: 'Completed', trendTone: 'success' }
  ]

  return (
    <div className="stats-grid premium-stats-grid">
      {cards.map((card) => <StatCard key={card.title} {...card} />)}
    </div>
  )
}

export default ComplaintStatsCards
