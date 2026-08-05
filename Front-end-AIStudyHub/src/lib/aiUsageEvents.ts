// The usage counter is rendered by components that never talk to the ask
// pipeline, so the two are connected by a window event rather than shared
// state. Kept out of `hooks/` so the service layer can emit it without pulling
// a React module into a non-React file.

export const AI_USAGE_UPDATED_EVENT = 'ai-usage-updated'

export function notifyAiUsageChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AI_USAGE_UPDATED_EVENT))
  }
}
