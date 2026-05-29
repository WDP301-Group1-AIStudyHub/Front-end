import type { ChatHistoryItem } from '../types/chat'

export const SESSION_GAP_MINUTES = 60

export interface SessionGroup {
  id: string
  name: string
  dateLabel: string
  itemIds: string[]
  createdAt: string
}

function getDateLabel(date: Date): string {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday.getTime() - 86_400_000)
  const startOfWeek = new Date(startOfToday.getTime() - 6 * 86_400_000)
  if (date >= startOfToday) return 'Today'
  if (date >= startOfYesterday) return 'Yesterday'
  if (date >= startOfWeek) return 'This Week'
  return 'Older'
}

function buildGroup(items: ChatHistoryItem[]): SessionGroup {
  const first = items[0]
  return {
    id: first.id,
    name: first.question.slice(0, 60),
    dateLabel: getDateLabel(new Date(first.createdAt)),
    itemIds: items.map((i) => i.id),
    createdAt: first.createdAt,
  }
}

export function groupBySession(
  items: ChatHistoryItem[],
  gapMinutes = SESSION_GAP_MINUTES,
): SessionGroup[] {
  if (items.length === 0) return []
  const sorted = [...items].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )
  const groups: SessionGroup[] = []
  let current: ChatHistoryItem[] = [sorted[0]]
  for (let i = 1; i < sorted.length; i++) {
    const gap =
      new Date(sorted[i].createdAt).getTime() -
      new Date(sorted[i - 1].createdAt).getTime()
    if (gap <= gapMinutes * 60_000) {
      current.push(sorted[i])
    } else {
      groups.push(buildGroup(current))
      current = [sorted[i]]
    }
  }
  groups.push(buildGroup(current))
  return groups.reverse() // newest first
}
