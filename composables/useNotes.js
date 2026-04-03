export const useNotes = () => {
  const notes = ref([])
  const currentNoteId = ref(null)
  const deletedIds = ref([]) // Track deleted note IDs for sync

  // Load notes from localStorage
  const loadNotes = () => {
    if (import.meta.client) {
      const stored = localStorage.getItem('notes')
      if (stored) {
        try {
          notes.value = JSON.parse(stored)
        } catch (e) {
          console.error('Failed to load notes:', e)
          notes.value = []
        }
      }

      // Load deleted IDs
      const storedDeleted = localStorage.getItem('deleted_note_ids')
      if (storedDeleted) {
        try { deletedIds.value = JSON.parse(storedDeleted) } catch { deletedIds.value = [] }
      }

      // Create a default note only if none exist AND user has never synced
      // (prevents Welcome note from being recreated after sync)
      const hasSynced = !!localStorage.getItem('last_synced_at')
      if (notes.value.length === 0 && !hasSynced) {
        const defaultNote = createNote('Welcome', 'Notes with calculator features')
        notes.value.push(defaultNote)
        saveNotes()
      }
    }
  }

  // Save notes to localStorage
  const saveNotes = () => {
    if (import.meta.client) {
      localStorage.setItem('notes', JSON.stringify(notes.value))
    }
  }

  const saveDeletedIds = () => {
    if (import.meta.client) {
      localStorage.setItem('deleted_note_ids', JSON.stringify(deletedIds.value))
    }
  }

  /** Clear the deleted IDs list (called after successful sync) */
  const clearDeletedIds = () => {
    deletedIds.value = []
    if (import.meta.client) {
      localStorage.removeItem('deleted_note_ids')
    }
  }

  // Get all unique tags across notes
  const allTags = computed(() => {
    const tagSet = new Set()
    notes.value.forEach(n => {
      if (n.tags) n.tags.forEach(t => tagSet.add(t))
    })
    return [...tagSet].sort()
  })

  // Create a new note
  const createNote = (title = 'Untitled Note', description = '') => {
    const defaultContent = title === 'Welcome' ? `# Welcome to CalcNotes!

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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  // Add a new note (always at the top)
  const addNote = () => {
    // Shift all existing notes down and bump updatedAt so sync picks up the new order
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

  // Delete a note
  const deleteNote = (id) => {
    const index = notes.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notes.value.splice(index, 1)

      // Track deletion for sync
      if (!deletedIds.value.includes(id)) {
        deletedIds.value.push(id)
        saveDeletedIds()
      }

      if (currentNoteId.value === id) {
        currentNoteId.value = notes.value.length > 0 ? notes.value[0].id : null
      }

      saveNotes()
    }
  }

  // Update note content
  const updateNoteContent = (id, content) => {
    const note = notes.value.find(n => n.id === id)
    if (note) {
      note.content = content
      note.updatedAt = new Date().toISOString()
      saveNotes()
    }
  }

  // Update note metadata
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

  // Reorder notes — accepts the new ordered array of IDs
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

  // Get current note
  const currentNote = computed(() => {
    return notes.value.find(n => n.id === currentNoteId.value) || null
  })

  // Initialize on mount
  onMounted(() => {
    loadNotes()
  })

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
    reorderNotes
  }
}
