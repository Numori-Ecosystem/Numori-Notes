/**
 * Group modal state and handlers for the index page.
 */
export function useGroupManagement({
  notes,
  groups,
  addGroup,
  updateGroup,
  deleteGroupFromDb,
  toggleGroupCollapsed,
  reorderGroups,
  moveNotesToGroup,
  removeNotesFromGroup,
  deleteNote,
  softDeleteNote,
  binEnabled,
  syncNow,
}) {
  const showGroupModal = ref(false)
  const editingGroupId = ref(null)
  const editingGroupName = ref('')
  const editingGroupInternalName = ref('')

  const showDeleteGroupModal = ref(false)
  const pendingDeleteGroupId = ref(null)

  const showAddToGroupModal = ref(false)
  const addToGroupNoteId = ref(null)
  const bulkGroupNoteIds = ref(null)

  const pendingDeleteGroup = computed(() => {
    return groups.value.find((g) => g.id === pendingDeleteGroupId.value) || null
  })

  const pendingDeleteGroupNoteCount = computed(() => {
    if (!pendingDeleteGroupId.value) return 0
    return notes.value.filter((n) => n.groupId === pendingDeleteGroupId.value).length
  })

  const otherGroupsForDelete = computed(() => {
    return groups.value.filter((g) => g.id !== pendingDeleteGroupId.value)
  })

  const handleAddToGroup = (noteId) => {
    addToGroupNoteId.value = noteId
    showAddToGroupModal.value = true
  }

  const handleBulkGroup = (noteIds) => {
    bulkGroupNoteIds.value = noteIds
    addToGroupNoteId.value = null
    showAddToGroupModal.value = true
  }

  const handleAddToGroupSelect = (groupId) => {
    if (bulkGroupNoteIds.value) {
      moveNotesToGroup(bulkGroupNoteIds.value, groupId)
      bulkGroupNoteIds.value.forEach((id) => syncNow(id))
      bulkGroupNoteIds.value = null
    } else if (addToGroupNoteId.value) {
      moveNotesToGroup([addToGroupNoteId.value], groupId)
      syncNow(addToGroupNoteId.value)
    }
    showAddToGroupModal.value = false
    addToGroupNoteId.value = null
  }

  const handleAddToGroupCreateNew = () => {
    showAddToGroupModal.value = false
    editingGroupId.value = null
    editingGroupName.value = ''
    editingGroupInternalName.value = ''
    showGroupModal.value = true
  }

  const handleGroupModalSave = ({ id, name, internalName }) => {
    if (id) {
      updateGroup(id, { name, internalName })
    } else {
      const group = addGroup(name)
      updateGroup(group.id, { internalName })
      if (bulkGroupNoteIds.value) {
        moveNotesToGroup(bulkGroupNoteIds.value, group.id)
        bulkGroupNoteIds.value.forEach((nid) => syncNow(nid))
        bulkGroupNoteIds.value = null
      } else if (addToGroupNoteId.value) {
        moveNotesToGroup([addToGroupNoteId.value], group.id)
        syncNow(addToGroupNoteId.value)
        addToGroupNoteId.value = null
      }
    }
  }

  const handleEditGroup = (groupId) => {
    const group = groups.value.find((g) => g.id === groupId)
    if (!group) return
    editingGroupId.value = groupId
    editingGroupName.value = group.name
    editingGroupInternalName.value = group.internalName
    showGroupModal.value = true
  }

  const handleDeleteGroup = (groupId) => {
    pendingDeleteGroupId.value = groupId
    showDeleteGroupModal.value = true
  }

  const handleDeleteGroupConfirm = (action, moveToGroupId) => {
    const groupId = pendingDeleteGroupId.value
    if (!groupId) return

    if (action === 'keep') {
      removeNotesFromGroup(groupId)
    } else if (action === 'move' && moveToGroupId) {
      const noteIds = notes.value.filter((n) => n.groupId === groupId).map((n) => n.id)
      moveNotesToGroup(noteIds, moveToGroupId)
    } else if (action === 'delete-all') {
      const noteIds = notes.value.filter((n) => n.groupId === groupId).map((n) => n.id)
      const useSoftDelete = binEnabled && binEnabled.value
      for (const id of noteIds) {
        if (useSoftDelete) softDeleteNote(id)
        else deleteNote(id)
      }
    }

    deleteGroupFromDb(groupId)
    showDeleteGroupModal.value = false
    pendingDeleteGroupId.value = null
    syncNow()
  }

  const handleToggleGroupCollapse = (groupId) => {
    toggleGroupCollapsed(groupId)
  }

  const handleMoveNoteToGroup = ({ noteId, groupId }) => {
    moveNotesToGroup([noteId], groupId)
    syncNow(noteId)
  }

  const handleReorderGroups = (orderedIds) => {
    reorderGroups(orderedIds)
    syncNow()
  }

  return {
    showGroupModal,
    editingGroupId,
    editingGroupName,
    editingGroupInternalName,
    showDeleteGroupModal,
    pendingDeleteGroup,
    pendingDeleteGroupNoteCount,
    otherGroupsForDelete,
    showAddToGroupModal,
    addToGroupNoteId,
    bulkGroupNoteIds,
    handleAddToGroup,
    handleBulkGroup,
    handleAddToGroupSelect,
    handleAddToGroupCreateNew,
    handleGroupModalSave,
    handleEditGroup,
    handleDeleteGroup,
    handleDeleteGroupConfirm,
    handleToggleGroupCollapse,
    handleMoveNoteToGroup,
    handleReorderGroups,
  }
}
