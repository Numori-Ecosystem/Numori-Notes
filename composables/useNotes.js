import { liveQuery } from 'dexie'
import db from '~/db.js'

export const useNotes = () => {
  const notes = ref([])
  const currentNoteId = ref(null)
  const deletedIds = ref([])

  // ── Reactive liveQuery: auto-updates `notes` when DB changes ──────────
  let subscription = null

  const startLiveQuery = () => {
    if (!import.meta.client) return
    const observable = liveQuery(() =>
      db.notes.orderBy('sortOrder').toArray()
    )
    subscription = observable.subscribe({
      next: (rows) => {
        // Merge instead of replace: only update notes whose data actually
        // changed so that Vue reactive references (and downstream watchers
        // like the editor's props.content) stay stable when nothing changed.
        const incoming = new Map(rows.map(r => [r.id, r]))
        // Remove notes that no longer exist in DB
        for (let i = notes.value.length - 1; i >= 0; i--) {
          if (!incoming.has(notes.value[i].id)) notes.value.splice(i, 1)
        }
        // Update existing / add new
        for (const row of rows) {
          const existing = notes.value.find(n => n.id === row.id)
          if (existing) {
            // Only assign fields that actually differ
            for (const key of Object.keys(row)) {
              const oldVal = existing[key]
              const newVal = row[key]
              if (oldVal !== newVal && JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
                existing[key] = newVal
              }
            }
          } else {
            notes.value.push(row)
          }
        }
        // Ensure sort order matches DB
        notes.value.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      },
      error: (err) => console.error('liveQuery error:', err),
    })
  }

  const stopLiveQuery = () => {
    if (subscription) {
      subscription.unsubscribe()
      subscription = null
    }
  }

  // ── Load initial state from Dexie ─────────────────────────────────────
  const loadNotes = async () => {
    if (!import.meta.client) return

    // Load notes
    notes.value = await db.notes.orderBy('sortOrder').toArray()

    // Load deleted IDs
    const row = await db.appState.get('deleted_note_ids')
    if (row?.value) {
      try { deletedIds.value = JSON.parse(row.value) } catch { deletedIds.value = [] }
    }

    // Create a default note only if none exist, user has never synced,
    // AND the welcome note hasn't been created before.
    const syncRow = await db.appState.get('last_synced_at')
    const hasSynced = !!syncRow?.value
    const welcomeRow = await db.appState.get('welcome_note_created')
    const welcomeAlreadyCreated = !!welcomeRow?.value
    if (notes.value.length === 0 && !hasSynced && !welcomeAlreadyCreated) {
      const defaultNote = createNote('Welcome', 'Notes with calculator features')
      await db.notes.put(defaultNote)
      notes.value = [defaultNote]
      await db.appState.put({ key: 'welcome_note_created', value: '1' })
    }

    // Start live reactivity after initial load
    startLiveQuery()
  }

  // ── Persist helpers ───────────────────────────────────────────────────
  // IndexedDB uses structured clone — Vue Proxy objects can't be cloned,
  // so we must unwrap to plain objects before every write.
  const toRaw = (obj) => JSON.parse(JSON.stringify(obj))

  const saveNotes = async () => {
    if (!import.meta.client) return
    await db.notes.bulkPut(toRaw(notes.value))
  }

  const saveDeletedIds = async () => {
    if (!import.meta.client) return
    await db.appState.put({ key: 'deleted_note_ids', value: JSON.stringify(deletedIds.value) })
  }

  const clearDeletedIds = async () => {
    deletedIds.value = []
    if (import.meta.client) {
      await db.appState.delete('deleted_note_ids')
    }
  }

  // ── Computed ──────────────────────────────────────────────────────────
  const allTags = computed(() => {
    const tagSet = new Set()
    notes.value.forEach(n => {
      if (n.tags) n.tags.forEach(t => tagSet.add(t))
    })
    return [...tagSet].sort()
  })

  // ── CRUD ──────────────────────────────────────────────────────────────
  const createNote = (title = 'Untitled Note', description = '') => {
    const defaultContent = title === 'Welcome' ? `# Welcome to Numori!

Write naturally. Results appear on the right.

## Quick Math
2 + 3
(10 + 5) * 2
17 mod 5
5 plus 3
10 without 3

## Variables
price = $100
tax = 8.5% of price
total = price + tax

## Percentages
200 + 15%
200 - 15%
50 as a % of 200
20% of what is 60

## Currencies
$1000 in EUR
€80 + $450 in GBP
budget = $85k
budget in EUR

## Unit Conversions
100 km in miles
72 fahrenheit in celsius
1 cup in ml
5 lb in kg
1 GB in MB

## Dates & Time
today
tomorrow
today + 2 weeks
next month
time in Tokyo
fromunix(1446587186)

## Sum & Average
Rent: -€800
Food: -€200
Fun: -€100
Monthly costs: sum

## Math Functions
sqrt(144)
pi * 5^2
log(1000)
sin(45°)
fact(5)

## Dev Tools
0xFF + 1
255 in hex
10 in bin
12 & 10
1 << 4
12 pt in px

## Scales
revenue = €3M
costs = €1.5M
profit = revenue - costs

## Labels & Prev
Cost: $20 + $56
Discounted: prev - 10%

// Lines starting with // are comments
// Lines starting with # are headers
// Explore Templates for more ideas!` : ''

    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      title,
      description,
      tags: [],
      sortOrder: 0,
      content: defaultContent,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  const addNote = () => {
    const now = new Date().toISOString()
    notes.value.forEach(n => {
      n.sortOrder = (n.sortOrder ?? 0) + 1
      n.updatedAt = now
    })
    const newNote = createNote()
    newNote.sortOrder = 0
    notes.value.unshift(newNote)
    currentNoteId.value = newNote.id
    saveNotes()
    return newNote
  }

  const deleteNote = (id) => {
    const index = notes.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notes.value.splice(index, 1)

      if (!deletedIds.value.includes(id)) {
        deletedIds.value.push(id)
        saveDeletedIds()
      }

      if (currentNoteId.value === id) {
        const next = notes.value.find(n => n.id !== id && !n.archived)
        currentNoteId.value = next ? next.id : (notes.value.length > 0 ? notes.value[0].id : null)
      }

      // Remove from DB
      db.notes.delete(id)
      saveNotes()
    }
  }

  const updateNoteContent = (id, content) => {
    const note = notes.value.find(n => n.id === id)
    if (note) {
      note.content = content
      note.updatedAt = new Date().toISOString()
      saveNotes()
    }
  }

  const updateNoteMeta = (id, { title, description, tags }) => {
    const note = notes.value.find(n => n.id === id)
    if (note) {
      if (title !== undefined) note.title = title
      if (description !== undefined) note.description = description
      if (tags !== undefined) note.tags = tags
      note.updatedAt = new Date().toISOString()
      saveNotes()
    }
  }

  const archiveNote = (id) => {
    const note = notes.value.find(n => n.id === id)
    if (note) {
      note.archived = true
      note.updatedAt = new Date().toISOString()
      // If archiving the current note, select the next non-archived note
      if (currentNoteId.value === id) {
        const next = notes.value.find(n => n.id !== id && !n.archived)
        currentNoteId.value = next ? next.id : null
      }
      saveNotes()
    }
  }

  const unarchiveNote = (id) => {
    const note = notes.value.find(n => n.id === id)
    if (note) {
      note.archived = false
      note.updatedAt = new Date().toISOString()
      saveNotes()
    }
  }

  const bulkArchive = (ids) => {
    const now = new Date().toISOString()
    for (const id of ids) {
      const note = notes.value.find(n => n.id === id)
      if (note) { note.archived = true; note.updatedAt = now }
    }
    // If current note was archived, select next non-archived
    if (ids.includes(currentNoteId.value)) {
      const next = notes.value.find(n => !ids.includes(n.id) && !n.archived)
      currentNoteId.value = next ? next.id : null
    }
    saveNotes()
  }

  const bulkUnarchive = (ids) => {
    const now = new Date().toISOString()
    for (const id of ids) {
      const note = notes.value.find(n => n.id === id)
      if (note) { note.archived = false; note.updatedAt = now }
    }
    saveNotes()
  }

  const reorderNotes = (orderedIds) => {
    orderedIds.forEach((id, index) => {
      const note = notes.value.find(n => n.id === id)
      if (note) {
        note.sortOrder = index
        note.updatedAt = new Date().toISOString()
      }
    })
    notes.value.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    saveNotes()
  }

  const currentNote = computed(() => {
    return notes.value.find(n => n.id === currentNoteId.value) || null
  })

  onMounted(() => { loadNotes() })
  onBeforeUnmount(() => { stopLiveQuery() })

  return {
    notes,
    currentNoteId,
    currentNote,
    allTags,
    deletedIds,
    addNote,
    deleteNote,
    updateNoteContent,
    updateNoteMeta,
    loadNotes,
    saveNotes,
    clearDeletedIds,
    reorderNotes,
    archiveNote,
    unarchiveNote,
    bulkArchive,
    bulkUnarchive
  }
}
