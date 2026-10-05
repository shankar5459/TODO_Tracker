import type { SyncStatus } from '../firebase/sync'

const LABELS: Record<SyncStatus, string> = {
  online: 'Online',
  offline: 'Offline',
  syncing: 'Syncing',
  synced: 'Synced',
  error: 'Error',
}

type Props = {
  status: SyncStatus
  error: string | null
}

export function SyncStatusChip({ status, error }: Props) {
  return (
    <span
      className={`sync-chip sync-${status}`}
      title={error || LABELS[status]}
    >
      {LABELS[status]}
    </span>
  )
}
