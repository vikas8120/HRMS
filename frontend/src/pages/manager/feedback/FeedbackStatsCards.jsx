import LoadingSkeleton from '../../../components/ui/LoadingSkeleton'
import StatCard from '../../../components/ui/StatCard'

function FeedbackStatsCards({ rows = [], loading = false }) {
  if (loading) return <LoadingSkeleton rows={2} />

  const total = rows.length
  const pending = rows.filter((item) => item.status === 'Pending').length
  const reviewed = rows.filter((item) => item.status === 'Reviewed').length
  const implemented = rows.filter((item) => item.status === 'Implemented').length

  const cards = [
    { title: 'Total Feedback', value: String(total), trend: 'All entries', trendTone: 'info' },
    { title: 'Pending', value: String(pending), trend: 'Awaiting review', trendTone: 'warning' },
    { title: 'Reviewed', value: String(reviewed), trend: 'Reviewed by team', trendTone: 'info' },
    { title: 'Implemented', value: String(implemented), trend: 'Implemented items', trendTone: 'success' }
  ]

  return (
    <div className="stats-grid premium-stats-grid">
      {cards.map((card) => <StatCard key={card.title} {...card} />)}
    </div>
  )
}

export default FeedbackStatsCards
