/**
 * In-memory SSE broadcast for sync notifications.
 * Maps userId -> Map of sessionId -> response stream.
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
 * Notify all connected clients for a user except the sender.
 */
export function notifySync(userId, excludeSessionId = null) {
  const sessions = listeners.get(userId)
  if (!sessions) return

  const data = `data: ${JSON.stringify({ type: 'sync', timestamp: new Date().toISOString() })}\n\n`
  for (const [sessionId, stream] of sessions) {
    if (sessionId !== excludeSessionId) {
      try {
        stream.write(data)
      } catch {
        /* client disconnected */
      }
    }
  }
}

/**
 * Notify all OTHER connected clients that all data has been wiped.
 * Receiving clients should clear local notes without syncing back.
 */
export function notifyDataWipe(userId, excludeSessionId = null) {
  const sessions = listeners.get(userId)
  if (!sessions) return

  const data = `data: ${JSON.stringify({ type: 'data-wipe', timestamp: new Date().toISOString() })}\n\n`
  for (const [sessionId, stream] of sessions) {
    if (sessionId !== excludeSessionId) {
      try {
        stream.write(data)
      } catch {
        /* client disconnected */
      }
    }
  }
}

/**
 * Notify specific sessions that they have been revoked.
 * Receiving clients should clear local data and log out.
 * If revokedSessionIds is null, notifies ALL sessions except the excluded one.
 */
export function notifySessionRevoked(userId, excludeSessionId = null, _revokedSessionIds = null) {
  const sessions = listeners.get(userId)
  if (!sessions) return

  const data = `data: ${JSON.stringify({ type: 'session-revoked', timestamp: new Date().toISOString() })}\n\n`
  for (const [sessionId, stream] of sessions) {
    if (sessionId === excludeSessionId) continue
    // If specific IDs given, we can't match SSE sessionIds to DB session IDs directly,
    // so when revoking "all others" we just notify everyone except the current session.
    try {
      stream.write(data)
    } catch {
      /* client disconnected */
    }
  }
}
