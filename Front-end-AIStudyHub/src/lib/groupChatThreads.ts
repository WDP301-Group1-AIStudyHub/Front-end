export function getDateLabel(date: Date): string {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday.getTime() - 86_400_000)
  const startOfWeek = new Date(startOfToday.getTime() - 6 * 86_400_000)
  if (date >= startOfToday) return 'Today'
  if (date >= startOfYesterday) return 'Yesterday'
  if (date >= startOfWeek) return 'This Week'
  return 'Older'
}

export interface ThreadDateGroup<T> {
  label: string
  threads: T[]
}

// Groups threads under Today / Yesterday / This Week / Older headers,
// preserving the input order (callers pass lastMessageAt-desc lists).
export function groupThreadsByDate<T extends { lastMessageAt: string }>(
  threads: T[],
): ThreadDateGroup<T>[] {
  const groups: ThreadDateGroup<T>[] = []
  for (const thread of threads) {
    const label = getDateLabel(new Date(thread.lastMessageAt))
    const last = groups[groups.length - 1]
    if (last && last.label === label) {
      last.threads.push(thread)
    } else {
      groups.push({ label, threads: [thread] })
    }
  }
  return groups
}
