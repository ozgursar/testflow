;(function () {
  'use strict'

  const STORAGE_KEY = 'testflow_options'
  const WARN_SECONDS = 50 * 60
  const CHIME_SECONDS = 55 * 60

  // ── State ────────────────────────────────────────────────────

  const state = {
    participants: [],
    nextId: 1,
    participantPool: [],
    ticketPool: [],
    elapsedAtStart: 0,
    startTimestamp: null,
    timerRunning: false,
    timerInterval: null,
    wasRunningBeforeEdit: false,
    chimePlayed: false
  }

  // ── Message templates ────────────────────────────────────────

  // ── Template engine ──────────────────────────────────────────

  function applyTemplate( tmpl, vars ) {
    return tmpl.replace( /\{(\w+)\}/g, ( _, key ) => key in vars ? vars[ key ] : '' )
  }

  function getSectionItems( section ) {
    const data = window.testflowScrub && window.testflowScrub.messages[ section ]
    if ( ! data ) return []
    return Array.isArray( data ) ? data : ( data.items || [] )
  }

  function getMsgByKey( section, key ) {
    const found = getSectionItems( section ).find( item => item.key === key )
    return found ? found.text : ''
  }

  function getMsgByPlaceholder( section, placeholder ) {
    const found = getSectionItems( section ).find( item => item.text && -1 !== item.text.indexOf( '{' + placeholder + '}' ) )
    return found ? found.text : ''
  }

  function formatParticipants( names ) {
    if ( 0 === names.length ) return '[participants]'
    if ( 1 === names.length ) return names[ 0 ]
    const last = names[ names.length - 1 ]
    return names.slice( 0, -1 ).join( ', ' ) + ' and ' + last
  }

  // ── Timer ────────────────────────────────────────────────────

  function pad(n) {
    return String(n).padStart(2, '0')
  }

  function getElapsed() {
    if (state.timerRunning && null !== state.startTimestamp) {
      return state.elapsedAtStart + Math.floor((Date.now() - state.startTimestamp) / 1000)
    }
    return state.elapsedAtStart
  }

  function playChime() {
    if (!(window.AudioContext || window.webkitAudioContext)) {
      return
    }

    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const now = ctx.currentTime
    const notes = [523.25, 659.25, 783.99]

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type = 'sine'
      osc.frequency.value = freq

      const start = now + i * 0.18
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.25, start + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 1.8)

      osc.start(start)
      osc.stop(start + 1.8)
    })
  }

  function updateTimerDisplay() {
    const elapsed = getElapsed()
    const el = qs('#tf-timer')
    el.textContent = `${pad(Math.floor(elapsed / 60))}:${pad(elapsed % 60)}`
    el.classList.toggle('is-warning', elapsed >= WARN_SECONDS)
  }

  function tickTimer() {
    updateTimerDisplay()

    if (!state.chimePlayed && getElapsed() >= CHIME_SECONDS) {
      state.chimePlayed = true
      playChime()
    }

    saveSessionState()
  }

  function toggleTimer() {
    if (state.timerRunning) {
      state.elapsedAtStart = getElapsed()
      state.startTimestamp = null
      clearInterval(state.timerInterval)
      state.timerRunning = false
      qs('#tf-timer-btn').textContent = '▶ Resume'
    } else {
      state.startTimestamp = Date.now()
      state.timerInterval = setInterval(tickTimer, 1000)
      state.timerRunning = true
      qs('#tf-timer-btn').textContent = '⏸ Pause'
    }
    saveSessionState()
  }

  function resetTimer() {
    clearInterval(state.timerInterval)
    state.timerRunning = false
    state.timerInterval = null
    state.startTimestamp = null
    state.elapsedAtStart = 0
    state.chimePlayed = false
    qs('#tf-timer').textContent = '00:00'
    qs('#tf-timer').classList.remove('is-warning')
    qs('#tf-timer-btn').textContent = '▶ Start'
    saveSessionState()
  }

  // ── localStorage persistence ─────────────────────────────────

  function saveSessionState() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        elapsedAtStart: state.elapsedAtStart,
        startTimestamp: state.startTimestamp,
        timerRunning: state.timerRunning,
        chimePlayed: state.chimePlayed,
        participants: state.participants,
        nextId: state.nextId,
        participantPool: state.participantPool,
        ticketPool: state.ticketPool
      })
    )
  }

  function loadSessionState() {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return
    }

    try {
      const data = JSON.parse(raw)

      state.chimePlayed = data.chimePlayed || false
      state.participants = (data.participants || []).map(p => ({
        id: p.id,
        username: p.username,
        tickets: p.tickets || (p.ticket ? [p.ticket] : [])
      }))
      state.nextId = data.nextId || 1
      state.participantPool = data.participantPool || []
      state.ticketPool = data.ticketPool || []

      if (data.timerRunning && data.startTimestamp) {
        state.elapsedAtStart = data.elapsedAtStart || 0
        state.startTimestamp = data.startTimestamp
        state.timerRunning = true
        state.timerInterval = setInterval(tickTimer, 1000)
        qs('#tf-timer-btn').textContent = '⏸ Pause'
      } else {
        state.elapsedAtStart = data.elapsedAtStart || 0
      }

      qs('#tf-participant-pool').value = state.participantPool.join('\n')
      qs('#tf-ticket-pool').value = state.ticketPool.join('\n')

      updateTimerDisplay()
      renderParticipantSelects()
      renderTicketSelects()
      renderTable()
      refreshThanks()
    } catch (e) {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  function resetSession() {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Reset the session? This will clear all participants and reset the timer.')) {
      return
    }

    clearInterval(state.timerInterval)
    state.timerRunning = false
    state.timerInterval = null
    state.startTimestamp = null
    state.elapsedAtStart = 0
    state.chimePlayed = false
    state.participants = []
    state.nextId = 1
    state.participantPool = []
    state.ticketPool = []

    qs('#tf-timer').textContent = '00:00'
    qs('#tf-timer').classList.remove('is-warning')
    qs('#tf-timer-btn').textContent = '▶ Start'
    qs('#tf-participant-pool').value = ''
    qs('#tf-ticket-pool').value = ''

    localStorage.removeItem(STORAGE_KEY)

    renderParticipantSelects()
    renderTicketSelects()
    renderTable()
    refreshThanks()
  }

  // ── Edit elapsed time ────────────────────────────────────────

  function parseTimeInput(str) {
    str = str.trim()
    if (/^\d{1,2}:\d{2}$/.test(str)) {
      const parts = str.split(':')
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10)
    }
    if (/^\d+$/.test(str)) {
      return parseInt(str, 10) * 60
    }
    return null
  }

  function exitEditTimer(applyChanges) {
    const el = qs('#tf-timer')
    const btn = qs('#tf-edit-limit-btn')

    if (applyChanges) {
      const seconds = parseTimeInput(el.textContent)
      if (null !== seconds && seconds >= 0) {
        state.elapsedAtStart = seconds
      }
    }

    if (state.wasRunningBeforeEdit) {
      state.startTimestamp = Date.now()
      state.timerInterval = setInterval(tickTimer, 1000)
      state.timerRunning = true
      qs('#tf-timer-btn').textContent = '⏸ Pause'
    }

    state.wasRunningBeforeEdit = false
    qs('#tf-timer-btn').disabled = false
    updateTimerDisplay()
    saveSessionState()
    el.contentEditable = 'false'
    btn.textContent = 'Edit'
  }

  function toggleEditTimer() {
    const el = qs('#tf-timer')
    const btn = qs('#tf-edit-limit-btn')

    if ('true' === el.contentEditable) {
      exitEditTimer(true)
      return
    }

    state.wasRunningBeforeEdit = state.timerRunning

    if (state.timerRunning) {
      state.elapsedAtStart = getElapsed()
      state.startTimestamp = null
      clearInterval(state.timerInterval)
      state.timerRunning = false
    }

    qs('#tf-timer-btn').disabled = true

    el.contentEditable = 'true'
    el.focus()

    const range = document.createRange()
    range.selectNodeContents(el)
    const sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)

    btn.textContent = 'Save'
  }


  // ── Pools ────────────────────────────────────────────────────

  function parsePool(text) {
    return text
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)
  }

  function ticketLabel(url) {
    try {
      const parts = new URL(url).pathname.split('/').filter(Boolean)
      return '#' + parts[parts.length - 1]
    } catch (e) {
      return url.length > 40 ? url.slice(0, 40) + '…' : url
    }
  }

  function renderParticipantSelects() {
    const options = state.participantPool.map(name => `<option value="${name}">@${name}</option>`).join('')

    ;['#tf-participant-select'].forEach(sel => {
      const el = qs(sel)
      if (!el) {
        return
      }
      const placeholder = el.querySelector('option[value=""]')
      const label = placeholder ? placeholder.textContent : '—'
      el.innerHTML = `<option value="">${label}</option>${options}`
    })

  }

  function getAvailableTickets() {
    const usedTickets = new Set(state.participants.flatMap(p => p.tickets))
    return state.ticketPool.filter(url => !usedTickets.has(url))
  }

  function renderTicketSelects() {
    const availableOptions = getAvailableTickets()
      .map(url => `<option value="${url}">${ticketLabel(url)}</option>`)
      .join('')

    qsa('.tf-inline-ticket-select').forEach(el => {
      const current = el.value
      el.innerHTML = `<option value="">Select a Ticket </option>${availableOptions}`
      if (current) {
        el.value = current
      }
    })

  }


  // ── Clipboard ────────────────────────────────────────────────

  function updateClipboardBar(text) {
    const el = qs('#tf-clipboard-text')
    if (el) {
      el.textContent = text
      el.classList.remove('tf-clipboard-text--empty')
    }
  }

  function copyText(text, btn) {
    const onSuccess = () => {
      toast('Copied to clipboard')
      updateClipboardBar(text)
      if (btn) {
        flashCopied(btn)
      }
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(onSuccess)
      return
    }

    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.cssText = 'position:fixed;opacity:0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    onSuccess()
  }

  function flashCopied(btn) {
    const original = btn.textContent
    btn.textContent = '✓ Copied!'
    btn.classList.add('is-copied')
    setTimeout(() => {
      btn.textContent = original
      btn.classList.remove('is-copied')
    }, 1500)
  }

  function toast(msg) {
    const el = qs('#tf-toast')
    el.textContent = msg
    el.classList.add('is-visible')
    clearTimeout(el._tfTimer)
    el._tfTimer = setTimeout(() => el.classList.remove('is-visible'), 2200)
  }

  // ── Participants ─────────────────────────────────────────────

  function addParticipant(username) {
    if (!username) {
      toast('Select a participant')
      return
    }

    if (state.participants.find(p => p.username === username)) {
      toast(`@${username} is already in the list`)
      return
    }

    state.participants.push({ id: state.nextId++, username, tickets: [] })
    renderTable()
    refreshThanks()
    saveSessionState()
  }

  function assignTicket(id, url) {
    if (!url) {
      toast('Select a ticket')
      return
    }

    const p = state.participants.find(p => p.id === id)
    if (!p) {
      return
    }

    p.tickets.push(url)

    const tmplKey = 1 === p.tickets.length ? 'first_assign' : 'followup'
    const msg = applyTemplate( getMsgByKey( 'assignment', tmplKey ), { username: p.username, url } )
    copyText(msg)
    renderTable()
    saveSessionState()
  }

  function removeTicketFromParticipant(id, url) {
    const p = state.participants.find(p => p.id === id)
    if (!p) {
      return
    }
    p.tickets = p.tickets.filter(t => t !== url)
    renderTable()
    saveSessionState()
  }

  // ── Render table ─────────────────────────────────────────────

  function renderTable() {
    const tbody = qs('#tf-participants-list')
    tbody.innerHTML = ''

    if (0 === state.participants.length) {
      const tr = document.createElement('tr')
      tr.className = 'tf-empty-row'
      tr.innerHTML = '<td colspan="3">No participants yet. Add someone above to get started.</td>'
      tbody.appendChild(tr)
      return
    }

    state.participants.forEach(p => tbody.appendChild(buildRow(p)))
    renderTicketSelects()
  }

  function buildRow(p) {
    const tr = document.createElement('tr')

    const tdUser = cel('td')
    tdUser.textContent = `@${p.username}`
    tr.appendChild(tdUser)

    const tdTickets = cel('td')
    if (p.tickets.length > 0) {
      p.tickets.forEach((url, i) => {
        if (i > 0) {
          tdTickets.appendChild(document.createTextNode(', '))
        }

        const item = cel('span')
        item.className = 'tf-ticket-item'

        const a = cel('a')
        a.className = 'tf-ticket-link'
        a.href = url
        a.target = '_blank'
        a.rel = 'noopener noreferrer'
        a.textContent = ticketLabel(url)
        item.appendChild(a)

        const removeBtn = cel('button')
        removeBtn.className = 'tf-ticket-remove-btn'
        removeBtn.title = 'Remove this ticket'
        removeBtn.textContent = '×'
        removeBtn.addEventListener('click', () => removeTicketFromParticipant(p.id, url))
        item.appendChild(removeBtn)

        tdTickets.appendChild(item)
      })
    } else {
      tdTickets.textContent = '—'
      tdTickets.style.color = '#646970'
    }
    tr.appendChild(tdTickets)

    const tdActions = cel('td')
    tdActions.appendChild(buildActions(p))
    tr.appendChild(tdActions)

    return tr
  }

  function buildActions(p) {
    const wrap = cel('div')
    wrap.className = 'tf-row-actions'

    const available = getAvailableTickets()
    const select = cel('select')
    select.className = 'tf-inline-ticket-select'
    const emptyOpt = cel('option')
    emptyOpt.value = ''
    emptyOpt.textContent = '— ticket / issue —'
    select.appendChild(emptyOpt)

    available.forEach(url => {
      const opt = cel('option')
      opt.value = url
      opt.textContent = ticketLabel(url)
      select.appendChild(opt)
    })

    const btn = cel('button')
    btn.className = 'button button-small button-primary'
    btn.textContent = 'Assign'
    btn.disabled = 0 === available.length
    btn.addEventListener('click', () => assignTicket(p.id, select.value))

    wrap.append(select, btn)

    return wrap
  }

  // ── Thanks message ───────────────────────────────────────────

  function refreshThanks() {
    const names = state.participants.map(p => `@${p.username}`)
    const thanksTmpl = getMsgByPlaceholder( 'closing', 'participants' )
    const text = applyTemplate( thanksTmpl, { participants: formatParticipants( names ) } )
    const el = qs('#tf-thanks-preview')
    el.textContent = text
    el.dataset.msg = text
    el.classList.toggle('tf-preview--muted', 0 === names.length)
  }

  // ── DOM helpers ──────────────────────────────────────────────

  function qs(sel) {
    return document.querySelector(sel)
  }
  function qsa(sel) {
    return document.querySelectorAll(sel)
  }
  function cel(tag) {
    return document.createElement(tag)
  }

  // ── Init ─────────────────────────────────────────────────────

  function init() {
    loadSessionState()

    qs('#tf-timer-btn').addEventListener('click', toggleTimer)

    qs('#tf-timer-reset').addEventListener('click', () => {
      // eslint-disable-next-line no-alert
      if (window.confirm('Reset the session timer?')) {
        resetTimer()
      }
    })

    qs('#tf-edit-limit-btn').addEventListener('click', toggleEditTimer)

    qs('#tf-timer').addEventListener('keydown', e => {
      if ('Enter' === e.key) {
        e.preventDefault()
        exitEditTimer(true)
      }
      if ('Escape' === e.key) {
        exitEditTimer(false)
      }
    })

    qs('#tf-timer').addEventListener('keypress', e => {
      if (!/^[\d:]$/.test(e.key)) {
        e.preventDefault()
      }
    })



    const syncParticipants = value => {
      const newPool = parsePool(value)

      newPool.forEach(username => {
        if (!state.participants.find(p => p.username === username)) {
          state.participants.push({ id: state.nextId++, username, tickets: [] })
        }
      })

      state.participants = state.participants.filter(p => newPool.includes(p.username))

      state.participantPool = newPool
      renderParticipantSelects()
      renderTable()
      refreshThanks()
      saveSessionState()
    }

    const participantPoolEl = qs('#tf-participant-pool')
    participantPoolEl.addEventListener('blur', function () {
      syncParticipants(this.value)
    })
    participantPoolEl.addEventListener('keyup', e => {
      if ('Enter' === e.key) {
        syncParticipants(participantPoolEl.value)
      }
    })

    qs('#tf-ticket-pool').addEventListener('input', function () {
      state.ticketPool = parsePool(this.value)
      renderTicketSelects()
      saveSessionState()
    })

    document.addEventListener('click', e => {
      if (e.target.matches('.tf-copy-btn[data-msg]')) {
        copyText(e.target.dataset.msg, e.target)
      }
    })


    const announcementInput = qs('#tf-announcement')
    if (announcementInput) {
      announcementInput.addEventListener('input', function () {
        const tmpl    = getMsgByPlaceholder('opening', 'announcement')
        const preview = qs('#tf-announcement-preview')
        if (this.value.trim()) {
          preview.textContent = applyTemplate(tmpl, { announcement: this.value.trim() })
          preview.classList.remove('tf-preview--muted')
        } else {
          preview.textContent = 'Enter announcement text to preview'
          preview.classList.add('tf-preview--muted')
        }
      })

      qs('#tf-copy-announcement').addEventListener('click', function () {
        const val = announcementInput.value.trim()
        if (!val) { toast('Enter announcement text first'); return }
        const tmpl = getMsgByPlaceholder('opening', 'announcement')
        copyText(applyTemplate(tmpl, { announcement: val }), this)
      })
    }

    qs('#tf-copy-thanks').addEventListener('click', function () {
      if (0 === state.participants.length) {
        toast('Add participants first')
        return
      }
      copyText(qs('#tf-thanks-preview').dataset.msg, this)
    })

    qs('#tf-clipboard-copy-btn').addEventListener('click', () => {
      const el = qs('#tf-clipboard-text')
      if (el && ! el.classList.contains('tf-clipboard-text--empty')) {
        copyText(el.textContent)
      }
    })

    qs('#tf-reset-session-btn').addEventListener('click', resetSession)

    renderTable()
    refreshThanks()
  }

  document.addEventListener('DOMContentLoaded', init)
})()
