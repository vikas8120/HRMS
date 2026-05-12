import Badge from './Badge'

function StatusBadge({ status }) {
  return <Badge tone={String(status).toLowerCase()}>{status}</Badge>
}

export default StatusBadge
