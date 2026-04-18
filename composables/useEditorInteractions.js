import { reactive } from 'vue'

/**
 * Encapsulates link popup state and click/touch handlers for the NoteEditor.
 *
 * @param {Object} opts
 * @param {import('vue').Ref} opts.displayLines
 * @param {import('vue').ComputedRef<boolean>} opts.autoCopyResult
 * @param {() => boolean} opts.getShowInline
 * @param {() => string} opts.getMarkdownMode
 * @param {() => boolean} opts.getEditable
 * @param {() => object|null} opts.getLocalePreferences
 */
export function useEditorInteractions({
  displayLines,
  autoCopyResult,
  getShowInline,
  getMarkdownMode,
  getEditable,
  getLocalePreferences,
}) {
  // --- Link popup state ---
  const linkPopup = reactive({ show: false, url: '', text: '', x: 0, y: 0, isExternal: false })

  const closeLinkPopup = () => {
    linkPopup.show = false
  }

  const isExternalUrl = (url) => {
    try {
      const u = new URL(url, window.location.origin)
      return u.origin !== window.location.origin
    } catch {
      return true
    }
  }

  const showLinkPopup = (url, text, x, y) => {
    linkPopup.url = url
    linkPopup.text = text
    linkPopup.x = x
    linkPopup.y = y
    linkPopup.isExternal = isExternalUrl(url)
    linkPopup.show = true
  }

  const openLink = () => {
    closeLinkPopup()
    window.open(linkPopup.url, '_blank', 'noopener,noreferrer')
  }

  const copyLinkUrl = async () => {
    closeLinkPopup()
    try {
      await navigator.clipboard.writeText(linkPopup.url)
    } catch {
      /* ignore */
    }
  }

  const copyLinkName = async () => {
    closeLinkPopup()
    try {
      await navigator.clipboard.writeText(linkPopup.text)
    } catch {
      /* ignore */
    }
  }

  // --- Touch tracking for scroll vs tap detection ---
  let resultTouchStartX = 0
  let resultTouchStartY = 0
  const TOUCH_MOVE_THRESHOLD = 10 // px – ignore taps that drifted (i.e. scrolling)

  // --- Long-press state ---
  let longPressTimer = null
  let longPressTriggered = false

  const findLinkEl = (el) =>
    el?.closest?.('.numori-md-link') || (el?.classList?.contains('numori-md-link') ? el : null)

  const findRawLinkAt = (lineText, charOffset) => {
    const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g
    let m
    while ((m = linkRe.exec(lineText)) !== null) {
      if (charOffset >= m.index && charOffset < m.index + m[0].length) {
        return { text: m[1], url: m[2] }
      }
    }
    return null
  }

  const triggerLinkPopup = (linkEl, view, x, y) => {
    const url = linkEl.getAttribute('data-href')
    const text = linkEl.textContent
    if (!url) return
    const rect = view.dom.getBoundingClientRect()
    showLinkPopup(url, text, x - rect.left, y - rect.top)
  }

  const triggerRawLinkPopup = (view, x, y) => {
    const pos = view.posAtCoords({ x, y })
    if (pos == null) return false
    const line = view.state.doc.lineAt(pos)
    const charOffset = pos - line.from
    const link = findRawLinkAt(line.text, charOffset)
    if (!link) return false
    const rect = view.dom.getBoundingClientRect()
    showLinkPopup(link.url, link.text, x - rect.left, y - rect.top)
    return true
  }

  // --- Result click/touch handlers ---
  const handleResultClick = (event, view) => {
    if (!getShowInline() || !autoCopyResult.value) return false
    const el = event.target
    if (!el || !el.classList.contains('numori-inline-result')) return false

    const pos = view.posAtCoords({ x: event.clientX, y: event.clientY })
    if (pos == null) return false
    const line = view.state.doc.lineAt(pos)
    const lineIndex = line.number - 1
    const lineData = displayLines.value[lineIndex]
    if (!lineData?.result) return false

    copyResult(lineData.result, lineIndex)
    showCopiedToast(view, event.clientX, event.clientY, lineIndex)
    return false
  }

  const handleResultTouchStart = (event) => {
    const touch = event.touches?.[0]
    if (!touch) return false
    resultTouchStartX = touch.clientX
    resultTouchStartY = touch.clientY
    return false
  }

  const handleResultTouch = (event, view) => {
    if (!getShowInline() || !autoCopyResult.value) return false
    const touch = event.changedTouches?.[0]
    if (!touch) return false

    // If the finger moved more than the threshold, the user was scrolling – skip copy
    const dx = touch.clientX - resultTouchStartX
    const dy = touch.clientY - resultTouchStartY
    if (Math.abs(dx) > TOUCH_MOVE_THRESHOLD || Math.abs(dy) > TOUCH_MOVE_THRESHOLD) return false

    const el = document.elementFromPoint(touch.clientX, touch.clientY)
    if (!el || !el.classList.contains('numori-inline-result')) return false

    const pos = view.posAtCoords({ x: touch.clientX, y: touch.clientY })
    if (pos == null) return false
    const line = view.state.doc.lineAt(pos)
    const lineIndex = line.number - 1
    const lineData = displayLines.value[lineIndex]
    if (!lineData?.result) return false

    event.preventDefault()
    copyResult(lineData.result, lineIndex)
    showCopiedToast(view, touch.clientX, touch.clientY, lineIndex)

    // The tap focused CodeMirror which would open the virtual keyboard.
    // Blur immediately so the keyboard doesn't appear for a copy action.
    view.contentDOM.blur()

    return false
  }

  // --- Markdown click handler ---
  const handleMdClick = (event, view) => {
    const editable = getEditable()

    // Alt+click on raw checklist text
    if (event.altKey && editable) {
      const pos = view.posAtCoords({ x: event.clientX, y: event.clientY })
      if (pos != null) {
        const line = view.state.doc.lineAt(pos)
        const checkMatch = line.text.match(/^(\s*)- \[([ x])\]\s/)
        if (checkMatch) {
          event.preventDefault()
          const bracketOffset = checkMatch[1].length + 3
          const from = line.from + bracketOffset
          const to = from + 1
          const newChar = checkMatch[2] === 'x' ? ' ' : 'x'
          view.dispatch({ changes: { from, to, insert: newChar } })
          return true
        }
      }
    }

    // Alt+click on link
    if (event.altKey) {
      const el = event.target
      const linkEl = findLinkEl(el)
      if (linkEl) {
        event.preventDefault()
        triggerLinkPopup(linkEl, view, event.clientX, event.clientY)
        return true
      }
      event.preventDefault()
      if (triggerRawLinkPopup(view, event.clientX, event.clientY)) return true
    }

    if (getMarkdownMode() === 'off') return false
    const el = event.target

    // Checkbox click
    const isCheckIcon =
      el?.classList?.contains('numori-md-check-icon') ||
      el?.classList?.contains('numori-md-check-icon-nested')
    const isViewOnly = !editable
    if (isCheckIcon || isViewOnly) {
      const lineNum = isCheckIcon
        ? parseInt(el.dataset?.line, 10)
        : (() => {
            const pos = view.posAtCoords({ x: event.clientX, y: event.clientY })
            if (pos == null) return null
            return view.state.doc.lineAt(pos).number
          })()
      if (!lineNum || lineNum < 1) return false
      const doc = view.state.doc
      if (lineNum > doc.lines) return false
      const line = doc.line(lineNum)
      const lineText = line.text
      const checkMatch = lineText.match(/^(\s*)- \[([ x])\]\s/)
      if (checkMatch) {
        event.preventDefault()
        const bracketOffset = checkMatch[1].length + 3
        const from = line.from + bracketOffset
        const to = from + 1
        const newChar = checkMatch[2] === 'x' ? ' ' : 'x'
        view.dispatch({ changes: { from, to, insert: newChar } })
        return true
      }
    }

    if (linkPopup.show) closeLinkPopup()
    return false
  }

  // --- Touch handlers ---
  const handleMdTouchStart = (event, view) => {
    if (getMarkdownMode() === 'off') return false
    const touch = event.touches?.[0]
    if (!touch) return false

    const el = document.elementFromPoint(touch.clientX, touch.clientY)
    const linkEl = findLinkEl(el)
    if (!linkEl) return false

    event.preventDefault()
    longPressTriggered = false
    const startX = touch.clientX
    const startY = touch.clientY

    longPressTimer = setTimeout(() => {
      longPressTriggered = true
      triggerLinkPopup(linkEl, view, startX, startY)
    }, 500)

    return true
  }

  const handleMdTouchMove = (event) => {
    if (!longPressTimer) return false
    const touch = event.touches?.[0]
    if (touch) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }
    return false
  }

  const handleMdTouchEnd = (event, view) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }
    if (longPressTriggered) {
      longPressTriggered = false
      event.preventDefault()
      return true
    }

    if (getMarkdownMode() === 'off') return false
    const touch = event.changedTouches?.[0]
    if (!touch) return false
    const el = document.elementFromPoint(touch.clientX, touch.clientY)

    if (
      el?.classList?.contains('numori-md-check-icon') ||
      el?.classList?.contains('numori-md-check-icon-nested')
    ) {
      if (!getEditable()) return false
      const lineNum = parseInt(el.dataset?.line, 10)
      if (!lineNum || lineNum < 1) return false
      const doc = view.state.doc
      if (lineNum > doc.lines) return false
      const line = doc.line(lineNum)
      const lineText = line.text
      const checkMatch = lineText.match(/^(\s*)- \[([ x])\]\s/)
      if (checkMatch) {
        event.preventDefault()
        const bracketOffset = checkMatch[1].length + 3
        const from = line.from + bracketOffset
        const to = from + 1
        const newChar = checkMatch[2] === 'x' ? ' ' : 'x'
        view.dispatch({ changes: { from, to, insert: newChar } })
        return true
      }
    }

    return false
  }

  const handleContextMenu = (event, view) => {
    if (event.altKey) {
      const el = event.target
      const linkEl = findLinkEl(el)
      if (linkEl) {
        event.preventDefault()
        triggerLinkPopup(linkEl, view, event.clientX, event.clientY)
        return true
      }
      if (triggerRawLinkPopup(view, event.clientX, event.clientY)) {
        event.preventDefault()
        return true
      }
    }
    if (getMarkdownMode() === 'off') return false
    const el = event.target
    const linkEl = findLinkEl(el)
    if (linkEl) {
      event.preventDefault()
      return true
    }
    if (event.altKey) {
      const pos = view.posAtCoords({ x: event.clientX, y: event.clientY })
      if (pos != null) {
        const line = view.state.doc.lineAt(pos)
        const checkMatch = line.text.match(/^(\s*)- \[([ x])\]\s/)
        if (checkMatch) {
          event.preventDefault()
          const bracketOffset = checkMatch[1].length + 3
          const from = line.from + bracketOffset
          const to = from + 1
          const newChar = checkMatch[2] === 'x' ? ' ' : 'x'
          view.dispatch({ changes: { from, to, insert: newChar } })
          return true
        }
      }
    }
    return false
  }

  // --- Copied toast ---
  const showCopiedToast = (view, posx, posy, _lineIndex) => {
    const editorDom = view.dom
    if (!editorDom) return
    const animStyle = getLocalePreferences()?.copyAnimationStyle || 'float-up'
    const toast = document.createElement('div')
    toast.className = `numori-inline-copied-toast numori-toast-${animStyle}`
    toast.textContent = 'Copied'
    const rect = editorDom.getBoundingClientRect()
    let relX = posx - rect.left
    // Place above the tap by default; fall back to below if near the top
    let relY = posy - rect.top - 24
    const MIN_TOP = 4 // never closer than 4px from the editor's top edge
    if (relY < MIN_TOP) {
      relY = posy - rect.top + 8
    }
    // Keep the toast from overflowing the right edge
    const TOAST_WIDTH = 52 // approximate width of "Copied" label
    const maxX = rect.width - TOAST_WIDTH - 4
    if (relX > maxX) relX = maxX
    toast.style.left = `${relX}px`
    toast.style.top = `${relY}px`
    editorDom.style.position = 'relative'
    editorDom.appendChild(toast)
    setTimeout(() => toast.remove(), 850)
  }

  const copyResult = async (result, _index) => {
    if (!autoCopyResult.value) return
    try {
      await navigator.clipboard.writeText(result)
    } catch {
      try {
        const textarea = document.createElement('textarea')
        textarea.value = result
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      } catch (fallbackErr) {
        console.error('Failed to copy:', fallbackErr)
      }
    }
  }

  const cleanupTimers = () => {
    if (longPressTimer) clearTimeout(longPressTimer)
  }

  return {
    linkPopup,
    closeLinkPopup,
    openLink,
    copyLinkUrl,
    copyLinkName,
    handleResultClick,
    handleResultTouchStart,
    handleResultTouch,
    handleMdClick,
    handleMdTouchStart,
    handleMdTouchMove,
    handleMdTouchEnd,
    handleContextMenu,
    cleanupTimers,
  }
}
