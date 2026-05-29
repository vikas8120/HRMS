import StatCard from '../../../components/ui/StatCard'
import LoadingSkeleton from '../../../components/ui/LoadingSkeleton'

function GrievanceStatsCards({ rows = [], loading = false }) {
  if (loading) return <LoadingSkeleton rows={2} />

  const total = rows.length
  const open = rows.filter((item) => item.status === 'Open').length
  const inProgress = rows.filter((item) => item.status === 'In Progress').length
  const resolved = rows.filter((item) => item.status === 'Resolved').length
  const closed = rows.filter((item) => item.status === 'Closed').length

  const cards = [
    { title: 'Total Grievances', value: String(total), trend: 'All records', trendTone: 'info' },
    { title: 'Open', value: String(open), trend: 'Needs action', trendTone: 'danger' },
    { title: 'In Progress', value: String(inProgress), trend: 'Being reviewed', trendTone: 'warning' },
    { title: 'Resolved', value: String(resolved), trend: 'Completed', trendTone: 'success' },
    { title: 'Closed', value: String(closed), trend: 'Closed records', trendTone: 'neutral' }
  ]

  return (
    <div className="stats-grid premium-stats-grid">
      {cards.map((card) => <StatCard key={card.title} {...card} />)}
    </div>
  )
}

export default GrievanceStatsCards
