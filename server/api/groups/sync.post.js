import { requireAuth } from '../../utils/auth.js'
import { query } from '../../utils/db.js'

/**
 * POST /api/groups/sync — Bulk sync endpoint for note groups.
 *
 * Client sends:
 *   { groups: [...], deletedClientIds: [...] }
 *
 * Server responds:
 *   { pushed: [...], pulled: [...], deletedClientIds: [...], syncedAt: ISO_DATE }
 */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const body = await readBody(event)
  const { groups: clientGroups = [], deletedClientIds = [] } = body || {}

  const deletedSet = new Set(deletedClientIds)

  // 1. Delete groups
  if (deletedClientIds.length > 0) {
    await query(
      'DELETE FROM groups WHERE user_id = $1 AND client_id = ANY($2)',
      [auth.userId, deletedClientIds]
    )
  }

  // 2. Upsert each client group
  const pushed = []

  for (const group of clientGroups) {
    if (!group.clientId || deletedSet.has(group.clientId)) continue

    const result = await query(`
      INSERT INTO groups (user_id, client_id, name, internal_name, sort_order, collapsed, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (user_id, client_id) WHERE client_id IS NOT NULL
      DO UPDATE SET
        name = CASE WHEN EXCLUDED.updated_at >= groups.updated_at THEN EXCLUDED.name ELSE groups.name END,
        internal_name = CASE WHEN EXCLUDED.updated_at >= groups.updated_at THEN EXCLUDED.internal_name ELSE groups.internal_name END,
        sort_order = CASE WHEN EXCLUDED.updated_at >= groups.updated_at THEN EXCLUDED.sort_order ELSE groups.sort_order END,
        collapsed = CASE WHEN EXCLUDED.updated_at >= groups.updated_at THEN EXCLUDED.collapsed ELSE groups.collapsed END,
        updated_at = GREATEST(EXCLUDED.updated_at, groups.updated_at)
      RETURNING id, client_id, name, internal_name, sort_order, collapsed, created_at, updated_at
    `, [
      auth.userId,
      group.clientId,
      group.name || 'New Group',
      group.internalName || '',
      group.sortOrder ?? 0,
      group.collapsed ?? false,
      group.createdAt || new Date().toISOString(),
      group.updatedAt || new Date().toISOString()
    ])

    if (result.rows.length > 0) {
      const row = result.rows[0]
      pushed.push({
        id: row.id,
        clientId: row.client_id,
        name: row.name,
        internalName: row.internal_name,
        sortOrder: row.sort_order,
        collapsed: row.collapsed,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })
    }
  }

  // 3. Pull all groups from server
  const pullResult = await query(`
    SELECT id, client_id, name, internal_name, sort_order, collapsed, created_at, updated_at
    FROM groups WHERE user_id = $1
    ORDER BY sort_order ASC
  `, [auth.userId])

  const pulled = pullResult.rows.map(row => ({
    id: row.id,
    clientId: row.client_id,
    name: row.name,
    internalName: row.internal_name,
    sortOrder: row.sort_order,
    collapsed: row.collapsed,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }))

  return {
    pushed,
    pulled,
    deletedClientIds: [],
    syncedAt: new Date().toISOString()
  }
})
