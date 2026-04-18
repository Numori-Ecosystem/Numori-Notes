import { liveQuery } from 'dexie'
import db from '~/db.js'
import { uniqueInternalName } from '~/utils/normaliseName.js'

export const useGroups = () => {
  const groups = ref([])
  const deletedGroupIds = ref([])
  let subscription = null

  const startLiveQuery = () => {
    if (!import.meta.client) return
    const observable = liveQuery(() =>
      db.groups.orderBy('sortOrder').toArray()
    )
    subscription = observable.subscribe({
      next: (rows) => {
        const incoming = new Map(rows.map(r => [r.id, r]))
        for (let i = groups.value.length - 1; i >= 0; i--) {
          if (!incoming.has(groups.value[i].id)) groups.value.splice(i, 1)
        }
        for (const row of rows) {
          const existing = groups.value.find(g => g.id === row.id)
          if (existing) {
            for (const key of Object.keys(row)) {
              if (JSON.stringify(existing[key]) !== JSON.stringify(row[key])) {
                existing[key] = row[key]
              }
            }
          } else {
            groups.value.push(row)
          }
        }
        groups.value.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      },
      error: (err) => console.error('groups liveQuery error:', err),
    })
  }

  const stopLiveQuery = () => {
    if (subscription) { subscription.unsubscribe(); subscription = null }
  }

  const toRaw = (obj) => JSON.parse(JSON.stringify(obj))

  const loadGroups = async () => {
    if (!import.meta.client) return
    groups.value = await db.groups.orderBy('sortOrder').toArray()
    const row = await db.appState.get('deleted_group_ids')
    if (row?.value) {
      try { deletedGroupIds.value = JSON.parse(row.value) } catch { deletedGroupIds.value = [] }
    }
    startLiveQuery()
  }

  const saveGroups = async () => {
    if (!import.meta.client) return
    await db.groups.bulkPut(toRaw(groups.value))
  }

  const createGroup = (name = 'New Group') => {
    const now = new Date().toISOString()
    const existingNames = groups.value.map(g => g.internalName).filter(Boolean)
    return {
      id: `g-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name,
      internalName: uniqueInternalName(name, existingNames, 'new_group'),
      sortOrder: 0,
      collapsed: false,
      createdAt: now,
      updatedAt: now,
    }
  }

  const addGroup = (name = 'New Group') => {
    const now = new Date().toISOString()
    groups.value.forEach(g => {
      g.sortOrder = (g.sortOrder ?? 0) + 1
      g.updatedAt = now
    })
    const group = createGroup(name)
    group.sortOrder = 0
    groups.value.unshift(group)
    saveGroups()
    return group
  }

  const updateGroup = (id, { name, internalName }) => {
    const group = groups.value.find(g => g.id === id)
    if (!group) return
    if (name !== undefined) group.name = name
    if (internalName !== undefined) {
      group.internalName = uniqueInternalName(internalName, [], 'new_group', id, groups.value)
    }
    group.updatedAt = new Date().toISOString()
    saveGroups()
  }

  const deleteGroup = async (id) => {
    const idx = groups.value.findIndex(g => g.id === id)
    if (idx !== -1) groups.value.splice(idx, 1)
    if (!deletedGroupIds.value.includes(id)) {
      deletedGroupIds.value.push(id)
    }
    await db.groups.delete(id)
    await db.appState.put({ key: 'deleted_group_ids', value: JSON.stringify(deletedGroupIds.value) })
    saveGroups()
  }

  const clearDeletedGroupIds = async () => {
    deletedGroupIds.value = []
    if (import.meta.client) {
      await db.appState.delete('deleted_group_ids')
    }
  }

  const toggleGroupCollapsed = (id) => {
    const group = groups.value.find(g => g.id === id)
    if (group) {
      group.collapsed = !group.collapsed
      saveGroups()
    }
  }

  const reorderGroups = (orderedIds) => {
    orderedIds.forEach((id, index) => {
      const group = groups.value.find(g => g.id === id)
      if (group) {
        group.sortOrder = index
        group.updatedAt = new Date().toISOString()
      }
    })
    groups.value.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    saveGroups()
  }

  onMounted(() => { loadGroups() })
  onBeforeUnmount(() => { stopLiveQuery() })

  return {
    groups,
    deletedGroupIds,
    addGroup,
    updateGroup,
    deleteGroup,
    toggleGroupCollapsed,
    reorderGroups,
    loadGroups,
    saveGroups,
    clearDeletedGroupIds,
  }
}
