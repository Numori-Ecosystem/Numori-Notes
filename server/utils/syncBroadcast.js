/**
 * In-memory SSE broadcast for sync notifications.
 * Maps userId -> Map of sessionId -> stream.
 */
const listeners = new Map()

export function addListener(userId, sessionId, stream) {
  if (!listeners.has(userId)) {
    listeners.set(userId, new Map())
  }
  listeners.get(userId).set(sessionId, stream)
}

export function removeListener(userId, sessionId) {
  const sessions = listeners.get(userId)
  if (sessions) {
    sessions.delete(sessionId)
    if (sessions.size === 0) listeners.delete(userId)
  }
}

/**
 * Notify all connected clients for a user except the one that triggered the sync.
 */
export function notifySync(userId, excludeSessionId = null) {
  const sessions = listeners.get(userId)
  if (!sessions) return

  const data = `data: ${JSON.stringify({ type: 'sync', timestamp: new Date().toISOString() })}\n\n`
  for (const [sessionId, stream] of sessions) {
    if (sessionId !== excludeSessionId) {
      try { stream.write(data) } catch { /* client disconnected */ }
    }
  }
}
