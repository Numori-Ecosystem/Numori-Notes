import { verifyJwt } from '../../utils/auth.js'
import { addListener, removeListener } from '../../utils/syncBroadcast.js'

/**
 * GET /api/sync/events?token=JWT&sessionId=ID — SSE endpoint.
 */
export default defineEventHandler(async (event) => {
  const { token, sessionId } = getQuery(event)

  if (!token || !sessionId) {
    throw createError({ statusCode: 400, statusMessage: 'Token and sessionId required' })
  }

  const secret = process.env.JWT_SECRET
  let payload
  try {
    payload = await verifyJwt(token, secret)
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Invalid token' })
  }

  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })

  const stream = event.node.res
  addListener(payload.userId, sessionId, stream)

  stream.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)

  const keepAlive = setInterval(() => {
    try {
      stream.write(': ping\n\n')
    } catch {
      clearInterval(keepAlive)
    }
  }, 30000)

  event.node.req.on('close', () => {
    clearInterval(keepAlive)
    removeListener(payload.userId, sessionId)
  })

  event._handled = true
})
