;( function () {
	'use strict'

	const STORAGE_KEY   = 'testflow_test_chat'
	const WARN_SECONDS  = 50 * 60
	const CHIME_SECONDS = 55 * 60

	// ── State ────────────────────────────────────────────────────

	const state = {
		agendaUrl:            '',
		facilitator:          '',
		noteTaker:            '',
		elapsedAtStart:       0,
		startTimestamp:       null,
		timerRunning:         false,
		timerInterval:        null,
		wasRunningBeforeEdit: false,
		chimePlayed:          false,
	}

	// ── Template engine ──────────────────────────────────────────

	function applyTemplate( tmpl, vars ) {
		return tmpl.replace( /\{(\w+)\}/g, ( _, key ) => key in vars ? vars[ key ] : `{${ key }}` )
	}

	function getVars() {
		return {
			agenda_url:  state.agendaUrl   || '{agenda_url}',
			facilitator: state.facilitator  || '{facilitator}',
			note_taker:  state.noteTaker    || state.facilitator || '{note_taker}',
		}
	}

	function refreshTemplatePreviews() {
		const vars = getVars()
		qsa( '.tf-template-preview' ).forEach( el => {
			el.textContent = applyTemplate( el.dataset.template, vars )
		} )
	}

	// ── Timer ────────────────────────────────────────────────────

	function pad( n ) {
		return String( n ).padStart( 2, '0' )
	}

	function getElapsed() {
		if ( state.timerRunning && null !== state.startTimestamp ) {
			return state.elapsedAtStart + Math.floor( ( Date.now() - state.startTimestamp ) / 1000 )
		}
		return state.elapsedAtStart
	}

	function playChime() {
		if ( ! ( window.AudioContext || window.webkitAudioContext ) ) return
		const ctx   = new ( window.AudioContext || window.webkitAudioContext )()
		const now   = ctx.currentTime
		const notes = [ 523.25, 659.25, 783.99 ]
		notes.forEach( ( freq, i ) => {
			const osc  = ctx.createOscillator()
			const gain = ctx.createGain()
			osc.connect( gain )
			gain.connect( ctx.destination )
			osc.type            = 'sine'
			osc.frequency.value = freq
			const start = now + i * 0.18
			gain.gain.setValueAtTime( 0, start )
			gain.gain.linearRampToValueAtTime( 0.25, start + 0.01 )
			gain.gain.exponentialRampToValueAtTime( 0.001, start + 1.8 )
			osc.start( start )
			osc.stop( start + 1.8 )
		} )
	}

	function updateTimerDisplay() {
		const elapsed  = getElapsed()
		const el       = qs( '#tf-timer' )
		el.textContent = `${ pad( Math.floor( elapsed / 60 ) ) }:${ pad( elapsed % 60 ) }`
		el.classList.toggle( 'is-warning', elapsed >= WARN_SECONDS )
	}

	function tickTimer() {
		updateTimerDisplay()
		if ( ! state.chimePlayed && getElapsed() >= CHIME_SECONDS ) {
			state.chimePlayed = true
			playChime()
		}
		saveState()
	}

	function toggleTimer() {
		if ( state.timerRunning ) {
			state.elapsedAtStart = getElapsed()
			state.startTimestamp = null
			clearInterval( state.timerInterval )
			state.timerRunning = false
			qs( '#tf-timer-btn' ).textContent = '▶ Resume'
		} else {
			state.startTimestamp = Date.now()
			state.timerInterval  = setInterval( tickTimer, 1000 )
			state.timerRunning   = true
			qs( '#tf-timer-btn' ).textContent = '⏸ Pause'
		}
		saveState()
	}

	function resetTimer() {
		clearInterval( state.timerInterval )
		state.timerRunning   = false
		state.timerInterval  = null
		state.startTimestamp = null
		state.elapsedAtStart = 0
		state.chimePlayed    = false
		qs( '#tf-timer' ).textContent = '00:00'
		qs( '#tf-timer' ).classList.remove( 'is-warning' )
		qs( '#tf-timer-btn' ).textContent = '▶ Start'
		saveState()
	}

	// ── Edit elapsed time ────────────────────────────────────────

	function parseTimeInput( str ) {
		str = str.trim()
		if ( /^\d{1,2}:\d{2}$/.test( str ) ) {
			const parts = str.split( ':' )
			return parseInt( parts[ 0 ], 10 ) * 60 + parseInt( parts[ 1 ], 10 )
		}
		if ( /^\d+$/.test( str ) ) return parseInt( str, 10 ) * 60
		return null
	}

	function exitEditTimer( applyChanges ) {
		const el  = qs( '#tf-timer' )
		const btn = qs( '#tf-edit-limit-btn' )
		if ( applyChanges ) {
			const seconds = parseTimeInput( el.textContent )
			if ( null !== seconds && seconds >= 0 ) state.elapsedAtStart = seconds
		}
		if ( state.wasRunningBeforeEdit ) {
			state.startTimestamp = Date.now()
			state.timerInterval  = setInterval( tickTimer, 1000 )
			state.timerRunning   = true
			qs( '#tf-timer-btn' ).textContent = '⏸ Pause'
		}
		state.wasRunningBeforeEdit     = false
		qs( '#tf-timer-btn' ).disabled = false
		updateTimerDisplay()
		saveState()
		el.contentEditable = 'false'
		btn.textContent    = 'Edit'
	}

	function toggleEditTimer() {
		const el  = qs( '#tf-timer' )
		const btn = qs( '#tf-edit-limit-btn' )
		if ( 'true' === el.contentEditable ) { exitEditTimer( true ); return }
		state.wasRunningBeforeEdit = state.timerRunning
		if ( state.timerRunning ) {
			state.elapsedAtStart = getElapsed()
			state.startTimestamp = null
			clearInterval( state.timerInterval )
			state.timerRunning = false
		}
		qs( '#tf-timer-btn' ).disabled = true
		el.contentEditable = 'true'
		el.focus()
		const range = document.createRange()
		range.selectNodeContents( el )
		const sel = window.getSelection()
		sel.removeAllRanges()
		sel.addRange( range )
		btn.textContent = 'Save'
	}

	// ── Persistence ──────────────────────────────────────────────

	function saveState() {
		localStorage.setItem( STORAGE_KEY, JSON.stringify( {
			agendaUrl:      state.agendaUrl,
			facilitator:    state.facilitator,
			noteTaker:      state.noteTaker,
			elapsedAtStart: state.elapsedAtStart,
			startTimestamp: state.startTimestamp,
			timerRunning:   state.timerRunning,
			chimePlayed:    state.chimePlayed,
		} ) )
	}

	function loadState() {
		const raw = localStorage.getItem( STORAGE_KEY )
		if ( ! raw ) return
		try {
			const data = JSON.parse( raw )
			state.agendaUrl   = data.agendaUrl   || ''
			state.facilitator = data.facilitator  || ''
			state.noteTaker   = data.noteTaker    || ''
			state.chimePlayed = data.chimePlayed  || false
			if ( data.timerRunning && data.startTimestamp ) {
				state.elapsedAtStart = data.elapsedAtStart || 0
				state.startTimestamp = data.startTimestamp
				state.timerRunning   = true
				state.timerInterval  = setInterval( tickTimer, 1000 )
				qs( '#tf-timer-btn' ).textContent = '⏸ Pause'
			} else {
				state.elapsedAtStart = data.elapsedAtStart || 0
			}
			if ( state.agendaUrl )   qs( '#tf-agenda-url' ).value   = state.agendaUrl
			if ( state.facilitator ) qs( '#tf-facilitator' ).value   = state.facilitator
			if ( state.noteTaker )   qs( '#tf-note-taker' ).value    = state.noteTaker
			updateTimerDisplay()
			refreshTemplatePreviews()
		} catch ( e ) {
			localStorage.removeItem( STORAGE_KEY )
		}
	}

	function resetSession() {
		// eslint-disable-next-line no-alert
		if ( ! window.confirm( 'Reset the session? This will clear all variables and reset the timer.' ) ) return
		clearInterval( state.timerInterval )
		Object.assign( state, {
			agendaUrl: '', facilitator: '', noteTaker: '',
			elapsedAtStart: 0, startTimestamp: null,
			timerRunning: false, timerInterval: null, chimePlayed: false,
		} )
		qs( '#tf-timer' ).textContent = '00:00'
		qs( '#tf-timer' ).classList.remove( 'is-warning' )
		qs( '#tf-timer-btn' ).textContent = '▶ Start'
		qs( '#tf-agenda-url' ).value   = ''
		qs( '#tf-facilitator' ).value  = ''
		qs( '#tf-note-taker' ).value   = ''
		localStorage.removeItem( STORAGE_KEY )
		refreshTemplatePreviews()
	}

	// ── Clipboard ────────────────────────────────────────────────

	function updateClipboardBar( text ) {
		const el = qs( '#tf-clipboard-text' )
		if ( el ) {
			el.textContent = text
			el.classList.remove( 'tf-clipboard-text--empty' )
		}
	}

	function copyText( text, btn ) {
		const onSuccess = () => {
			toast( 'Copied to clipboard' )
			updateClipboardBar( text )
			if ( btn ) flashCopied( btn )
		}
		if ( navigator.clipboard ) { navigator.clipboard.writeText( text ).then( onSuccess ); return }
		const ta = document.createElement( 'textarea' )
		ta.value = text; ta.style.cssText = 'position:fixed;opacity:0'
		document.body.appendChild( ta ); ta.select()
		document.execCommand( 'copy' ); document.body.removeChild( ta )
		onSuccess()
	}

	function flashCopied( btn ) {
		const original = btn.textContent
		btn.textContent = '✓ Copied!'; btn.classList.add( 'is-copied' )
		setTimeout( () => { btn.textContent = original; btn.classList.remove( 'is-copied' ) }, 1500 )
	}

	function toast( msg ) {
		const el = qs( '#tf-toast' )
		el.textContent = msg; el.classList.add( 'is-visible' )
		clearTimeout( el._tfTimer )
		el._tfTimer = setTimeout( () => el.classList.remove( 'is-visible' ), 2200 )
	}

	// ── DOM helpers ──────────────────────────────────────────────

	function qs( sel )  { return document.querySelector( sel ) }
	function qsa( sel ) { return document.querySelectorAll( sel ) }

	// ── Init ─────────────────────────────────────────────────────

	function init() {
		loadState()

		qs( '#tf-timer-btn' ).addEventListener( 'click', toggleTimer )

		qs( '#tf-timer-reset' ).addEventListener( 'click', () => {
			// eslint-disable-next-line no-alert
			if ( window.confirm( 'Reset the session timer?' ) ) resetTimer()
		} )

		qs( '#tf-edit-limit-btn' ).addEventListener( 'click', toggleEditTimer )

		qs( '#tf-timer' ).addEventListener( 'keydown', e => {
			if ( 'Enter' === e.key ) { e.preventDefault(); exitEditTimer( true ) }
			if ( 'Escape' === e.key ) exitEditTimer( false )
		} )

		qs( '#tf-timer' ).addEventListener( 'keypress', e => {
			if ( ! /^[\d:]$/.test( e.key ) ) e.preventDefault()
		} )

		const varInputs = [
			{ id: '#tf-agenda-url',  key: 'agendaUrl' },
			{ id: '#tf-facilitator', key: 'facilitator' },
			{ id: '#tf-note-taker',  key: 'noteTaker' },
		]

		varInputs.forEach( ( { id, key } ) => {
			qs( id ).addEventListener( 'input', function () {
				state[ key ] = this.value.trim()
				refreshTemplatePreviews()
				saveState()
			} )
		} )

		document.addEventListener( 'click', e => {
			if ( e.target.matches( '.tf-copy-btn[data-msg]' ) ) {
				copyText( e.target.dataset.msg, e.target )
			}
			if ( e.target.matches( '.tf-template-copy' ) ) {
				copyText( applyTemplate( e.target.dataset.template, getVars() ), e.target )
			}
		} )

		qs( '#tf-clipboard-copy-btn' ).addEventListener( 'click', () => {
			const el = qs( '#tf-clipboard-text' )
			if ( el && ! el.classList.contains( 'tf-clipboard-text--empty' ) ) {
				copyText( el.textContent )
			}
		} )

		qs( '#tf-reset-session-btn' ).addEventListener( 'click', resetSession )
	}

	document.addEventListener( 'DOMContentLoaded', init )
}() )
