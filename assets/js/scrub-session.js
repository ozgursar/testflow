( function () {
	'use strict';

	const STORAGE_KEY   = 'testflow_options';
	const WARN_SECONDS  = 55 * 60;
	const CHIME_SECONDS = 60 * 60;

	// ── State ────────────────────────────────────────────────────

	const state = {
		participants:        [],
		nextId:              1,
		phase:               'opening',
		elapsedAtStart:      0,     // seconds elapsed when timer was last started/resumed
		startTimestamp:      null,  // Date.now() when timer was last started
		timerRunning:        false,
		timerInterval:       null,
		wasRunningBeforeEdit: false,
		chimePlayed:          false,
	};

	const STATUS = {
		JOINED:   'joined',
		TESTING:  'testing',
		REPORTED: 'reported',
		DONE:     'done',
	};

	// ── Message templates ────────────────────────────────────────

	const T = {
		firstAssign:  ( u, t ) => `Thank you @${ u }, for joining us today. You can start working on #${ t }`,
		followUp:     ( u, t ) => `@${ u } Thank you for adding a report. You could give this a try #${ t }`,
		ack:          ( u )    => `Great work @${ u }, thanks for the report!`,
		announcement: ( text ) => `Before we start, ${ text }. Feel free to try it out and share your feedback.`,
		thanks: ( names ) => {
			if ( 0 === names.length ) {
				return 'Thanks [participants] for coming today. 🎉';
			}
			if ( 1 === names.length ) {
				return `Thanks ${ names[ 0 ] } for coming today. 🎉`;
			}
			const last = names[ names.length - 1 ];
			return `Thanks ${ names.slice( 0, -1 ).join( ', ' ) } and ${ last } for coming today. 🎉`;
		},
	};

	// ── Timer ────────────────────────────────────────────────────

	function pad( n ) {
		return String( n ).padStart( 2, '0' );
	}

	function getElapsed() {
		if ( state.timerRunning && null !== state.startTimestamp ) {
			return state.elapsedAtStart + Math.floor( ( Date.now() - state.startTimestamp ) / 1000 );
		}
		return state.elapsedAtStart;
	}

	function getWarningThreshold() {
		return Math.max( Math.floor( LIMIT_SECONDS * 0.5 ), LIMIT_SECONDS - 600 );
	}

	function playChime() {
		if ( ! ( window.AudioContext || window.webkitAudioContext ) ) {
			return;
		}

		const ctx   = new ( window.AudioContext || window.webkitAudioContext )();
		const now   = ctx.currentTime;
		const notes = [ 523.25, 659.25, 783.99 ];

		notes.forEach( ( freq, i ) => {
			const osc  = ctx.createOscillator();
			const gain = ctx.createGain();

			osc.connect( gain );
			gain.connect( ctx.destination );

			osc.type            = 'sine';
			osc.frequency.value = freq;

			const start = now + i * 0.18;
			gain.gain.setValueAtTime( 0, start );
			gain.gain.linearRampToValueAtTime( 0.25, start + 0.01 );
			gain.gain.exponentialRampToValueAtTime( 0.001, start + 1.8 );

			osc.start( start );
			osc.stop( start + 1.8 );
		} );
	}

	function updateTimerDisplay() {
		const elapsed  = getElapsed();
		const el       = qs( '#tf-timer' );
		el.textContent = `${ pad( Math.floor( elapsed / 60 ) ) }:${ pad( elapsed % 60 ) }`;
		el.classList.toggle( 'is-warning', elapsed >= WARN_SECONDS );
	}

	function tickTimer() {
		updateTimerDisplay();

		if ( ! state.chimePlayed && getElapsed() >= CHIME_SECONDS ) {
			state.chimePlayed = true;
			playChime();
		}

		saveSessionState();
	}

	function toggleTimer() {
		if ( state.timerRunning ) {
			state.elapsedAtStart = getElapsed();
			state.startTimestamp = null;
			clearInterval( state.timerInterval );
			state.timerRunning = false;
			qs( '#tf-timer-btn' ).textContent = '▶ Resume';
		} else {
			state.startTimestamp = Date.now();
			state.timerInterval  = setInterval( tickTimer, 1000 );
			state.timerRunning   = true;
			qs( '#tf-timer-btn' ).textContent = '⏸ Pause';
		}
		saveSessionState();
	}

	function resetTimer() {
		clearInterval( state.timerInterval );
		state.timerRunning   = false;
		state.timerInterval  = null;
		state.startTimestamp = null;
		state.elapsedAtStart = 0;
		state.chimePlayed    = false;
		qs( '#tf-timer' ).textContent = '00:00';
		qs( '#tf-timer' ).classList.remove( 'is-warning' );
		qs( '#tf-timer-btn' ).textContent = '▶ Start';
		saveSessionState();
	}

	// ── localStorage persistence ─────────────────────────────────

	function saveSessionState() {
		localStorage.setItem( STORAGE_KEY, JSON.stringify( {
			elapsedAtStart: state.elapsedAtStart,
			startTimestamp: state.startTimestamp,
			timerRunning:   state.timerRunning,
			chimePlayed:    state.chimePlayed,
			phase:          state.phase,
			participants:   state.participants,
			nextId:         state.nextId,
		} ) );
	}

	function loadSessionState() {
		const raw = localStorage.getItem( STORAGE_KEY );
		if ( ! raw ) {
			return;
		}

		try {
			const data = JSON.parse( raw );

			state.phase        = data.phase || 'opening';
			state.chimePlayed  = data.chimePlayed || false;
			state.participants = data.participants || [];
			state.nextId       = data.nextId || 1;

			if ( data.timerRunning && data.startTimestamp ) {
				state.elapsedAtStart = data.elapsedAtStart || 0;
				state.startTimestamp = data.startTimestamp;
				state.timerRunning   = true;
				state.timerInterval  = setInterval( tickTimer, 1000 );
				qs( '#tf-timer-btn' ).textContent = '⏸ Pause';
			} else {
				state.elapsedAtStart = data.elapsedAtStart || 0;
			}

			updateTimerDisplay();
			setPhase( state.phase );
			renderTable();
			refreshThanks();
		} catch ( e ) {
			localStorage.removeItem( STORAGE_KEY );
		}
	}

	function resetSession() {
		// eslint-disable-next-line no-alert
		if ( ! window.confirm( 'Reset the session? This will clear all participants and reset the timer.' ) ) {
			return;
		}

		clearInterval( state.timerInterval );
		state.timerRunning    = false;
		state.timerInterval   = null;
		state.startTimestamp  = null;
		state.elapsedAtStart  = 0;
		state.chimePlayed     = false;
		state.participants    = [];
		state.nextId          = 1;

		qs( '#tf-timer' ).textContent = '00:00';
		qs( '#tf-timer' ).classList.remove( 'is-warning' );
		qs( '#tf-timer-btn' ).textContent = '▶ Start';

		localStorage.removeItem( STORAGE_KEY );

		setPhase( 'opening' );
		renderTable();
		refreshThanks();
	}

	// ── Edit elapsed time ────────────────────────────────────────

	function parseTimeInput( str ) {
		str = str.trim();
		if ( /^\d{1,2}:\d{2}$/.test( str ) ) {
			const parts = str.split( ':' );
			return parseInt( parts[ 0 ], 10 ) * 60 + parseInt( parts[ 1 ], 10 );
		}
		if ( /^\d+$/.test( str ) ) {
			return parseInt( str, 10 ) * 60;
		}
		return null;
	}

	function exitEditTimer( applyChanges ) {
		const el  = qs( '#tf-timer' );
		const btn = qs( '#tf-edit-limit-btn' );

		if ( applyChanges ) {
			const seconds = parseTimeInput( el.textContent );
			if ( null !== seconds && seconds >= 0 ) {
				state.elapsedAtStart = seconds;
			}
		}

		if ( state.wasRunningBeforeEdit ) {
			state.startTimestamp = Date.now();
			state.timerInterval  = setInterval( tickTimer, 1000 );
			state.timerRunning   = true;
			qs( '#tf-timer-btn' ).textContent = '⏸ Pause';
		}

		state.wasRunningBeforeEdit          = false;
		qs( '#tf-timer-btn' ).disabled      = false;
		updateTimerDisplay();
		saveSessionState();
		el.contentEditable = 'false';
		btn.textContent    = 'Edit';
	}

	function toggleEditTimer() {
		const el  = qs( '#tf-timer' );
		const btn = qs( '#tf-edit-limit-btn' );

		if ( 'true' === el.contentEditable ) {
			exitEditTimer( true );
			return;
		}

		state.wasRunningBeforeEdit = state.timerRunning;

		if ( state.timerRunning ) {
			state.elapsedAtStart = getElapsed();
			state.startTimestamp = null;
			clearInterval( state.timerInterval );
			state.timerRunning = false;
		}

		qs( '#tf-timer-btn' ).disabled = true;

		el.contentEditable = 'true';
		el.focus();

		const range = document.createRange();
		range.selectNodeContents( el );
		const sel = window.getSelection();
		sel.removeAllRanges();
		sel.addRange( range );

		btn.textContent = 'Save';
	}

	// ── Phase ────────────────────────────────────────────────────

	function setPhase( phase ) {
		state.phase = phase;
		qsa( '.tf-phase-btn' ).forEach( ( btn ) => {
			btn.classList.toggle( 'is-active', btn.dataset.phase === phase );
		} );
	}

	// ── Clipboard ────────────────────────────────────────────────

	function copyText( text, btn ) {
		const onSuccess = () => {
			toast( 'Copied to clipboard' );
			if ( btn ) {
				flashCopied( btn );
			}
		};

		if ( navigator.clipboard ) {
			navigator.clipboard.writeText( text ).then( onSuccess );
			return;
		}

		const ta = document.createElement( 'textarea' );
		ta.value = text;
		ta.style.cssText = 'position:fixed;opacity:0';
		document.body.appendChild( ta );
		ta.select();
		document.execCommand( 'copy' );
		document.body.removeChild( ta );
		onSuccess();
	}

	function flashCopied( btn ) {
		const original = btn.textContent;
		btn.textContent = '✓ Copied!';
		btn.classList.add( 'is-copied' );
		setTimeout( () => {
			btn.textContent = original;
			btn.classList.remove( 'is-copied' );
		}, 1500 );
	}

	function toast( msg ) {
		const el = qs( '#tf-toast' );
		el.textContent = msg;
		el.classList.add( 'is-visible' );
		clearTimeout( el._tfTimer );
		el._tfTimer = setTimeout( () => el.classList.remove( 'is-visible' ), 2200 );
	}

	// ── Participants ─────────────────────────────────────────────

	function addParticipant( raw ) {
		const username = raw.trim().replace( /^@/, '' );

		if ( ! username ) {
			toast( 'Enter a username' );
			return;
		}

		if ( state.participants.find( ( p ) => p.username === username ) ) {
			toast( `@${ username } is already in the list` );
			return;
		}

		state.participants.push( { id: state.nextId++, username, ticket: null, status: STATUS.JOINED } );
		renderTable();
		refreshThanks();
		saveSessionState();
	}

	function assignTicket( id, raw, isFollowUp ) {
		const ticket = raw.trim().replace( /^#/, '' );

		if ( ! ticket ) {
			toast( 'Enter a ticket number' );
			return;
		}

		const p = state.participants.find( ( p ) => p.id === id );
		if ( ! p ) {
			return;
		}

		p.ticket = ticket;
		p.status = STATUS.TESTING;

		const msg = isFollowUp ? T.followUp( p.username, ticket ) : T.firstAssign( p.username, ticket );
		copyText( msg );
		renderTable();
		saveSessionState();
	}

	function markReported( id ) {
		const p = state.participants.find( ( p ) => p.id === id );
		if ( ! p ) {
			return;
		}
		p.status = STATUS.REPORTED;
		copyText( T.ack( p.username ) );
		renderTable();
		saveSessionState();
	}

	function markDone( id ) {
		const p = state.participants.find( ( p ) => p.id === id );
		if ( ! p ) {
			return;
		}
		p.status = STATUS.DONE;
		renderTable();
		saveSessionState();
	}

	function removeParticipant( id, username ) {
		// eslint-disable-next-line no-alert
		if ( ! window.confirm( `Remove @${ username } from the list?` ) ) {
			return;
		}
		state.participants = state.participants.filter( ( p ) => p.id !== id );
		renderTable();
		refreshThanks();
		saveSessionState();
	}

	// ── Render table ─────────────────────────────────────────────

	const BADGE = {
		[ STATUS.JOINED ]:   { cls: 'tf-badge--joined',   label: 'Joined' },
		[ STATUS.TESTING ]:  { cls: 'tf-badge--testing',  label: 'Testing' },
		[ STATUS.REPORTED ]: { cls: 'tf-badge--reported', label: 'Reported' },
		[ STATUS.DONE ]:     { cls: 'tf-badge--done',     label: 'Done' },
	};

	function renderTable() {
		const tbody = qs( '#tf-participants-list' );
		tbody.innerHTML = '';

		if ( 0 === state.participants.length ) {
			const tr = document.createElement( 'tr' );
			tr.className = 'tf-empty-row';
			tr.innerHTML = '<td colspan="4">No participants yet. Add someone above to get started.</td>';
			tbody.appendChild( tr );
			return;
		}

		state.participants.forEach( ( p ) => tbody.appendChild( buildRow( p ) ) );
	}

	function buildRow( p ) {
		const tr = document.createElement( 'tr' );

		const tdUser = cel( 'td' );
		tdUser.style.fontWeight = '600';
		tdUser.textContent = `@${ p.username }`;
		tr.appendChild( tdUser );

		const tdTicket = cel( 'td' );
		if ( p.ticket ) {
			const a = cel( 'a' );
			a.className   = 'tf-ticket-link';
			a.href        = `https://core.trac.wordpress.org/ticket/${ p.ticket }`;
			a.target      = '_blank';
			a.rel         = 'noopener noreferrer';
			a.textContent = `#${ p.ticket }`;
			tdTicket.appendChild( a );
		} else {
			tdTicket.textContent = '—';
			tdTicket.style.color = '#646970';
		}
		tr.appendChild( tdTicket );

		const tdStatus = cel( 'td' );
		const badge    = cel( 'span' );
		const b        = BADGE[ p.status ];
		badge.className   = `tf-badge ${ b.cls }`;
		badge.textContent = b.label;
		tdStatus.appendChild( badge );
		tr.appendChild( tdStatus );

		const tdActions = cel( 'td' );
		tdActions.appendChild( buildActions( p ) );
		tr.appendChild( tdActions );

		return tr;
	}

	function buildActions( p ) {
		const wrap = cel( 'div' );
		wrap.className = 'tf-row-actions';

		if ( STATUS.JOINED === p.status || STATUS.REPORTED === p.status ) {
			const input       = cel( 'input' );
			input.type        = 'text';
			input.className   = 'tf-ticket-input';
			input.placeholder = '#ticket';

			const btn         = cel( 'button' );
			btn.className     = 'button button-small button-primary';
			btn.textContent   = STATUS.REPORTED === p.status ? 'Assign Next' : 'Assign';

			const doAssign = () => assignTicket( p.id, input.value, STATUS.REPORTED === p.status );
			btn.addEventListener( 'click', doAssign );
			input.addEventListener( 'keydown', ( e ) => { if ( 'Enter' === e.key ) { doAssign(); } } );

			wrap.append( input, btn );
		}

		if ( STATUS.TESTING === p.status ) {
			const btn       = cel( 'button' );
			btn.className   = 'button button-small';
			btn.textContent = '✓ Mark Reported';
			btn.addEventListener( 'click', () => markReported( p.id ) );
			wrap.appendChild( btn );
		}

		if ( STATUS.DONE !== p.status ) {
			const doneBtn       = cel( 'button' );
			doneBtn.className   = 'button button-small tf-btn-done';
			doneBtn.textContent = 'Done';
			doneBtn.addEventListener( 'click', () => markDone( p.id ) );
			wrap.appendChild( doneBtn );
		}

		const removeBtn       = cel( 'button' );
		removeBtn.className   = 'button button-small tf-btn-remove';
		removeBtn.title       = 'Remove participant';
		removeBtn.textContent = '✕';
		removeBtn.addEventListener( 'click', () => removeParticipant( p.id, p.username ) );
		wrap.appendChild( removeBtn );

		return wrap;
	}

	// ── Thanks message ───────────────────────────────────────────

	function refreshThanks() {
		const names = state.participants.map( ( p ) => `@${ p.username }` );
		const text  = T.thanks( names );
		const el    = qs( '#tf-thanks-preview' );
		el.textContent = text;
		el.dataset.msg = text;
		el.classList.toggle( 'tf-preview--muted', 0 === names.length );
	}

	// ── Assignment preview ───────────────────────────────────────

	function refreshAssignPreview() {
		const u       = qs( '#tf-assign-username' ).value.trim().replace( /^@/, '' );
		const t       = qs( '#tf-assign-ticket' ).value.trim().replace( /^#/, '' );
		const preview = qs( '#tf-assign-preview' );

		if ( u && t ) {
			preview.textContent = T.firstAssign( u, t );
			preview.classList.remove( 'tf-preview--muted' );
		} else {
			preview.textContent = 'Enter username and ticket number above';
			preview.classList.add( 'tf-preview--muted' );
		}
	}

	// ── DOM helpers ──────────────────────────────────────────────

	function qs( sel )  { return document.querySelector( sel ); }
	function qsa( sel ) { return document.querySelectorAll( sel ); }
	function cel( tag ) { return document.createElement( tag ); }

	// ── Init ─────────────────────────────────────────────────────

	function init() {
		loadSessionState();

		qs( '#tf-timer-btn' ).addEventListener( 'click', toggleTimer );

		qs( '#tf-timer-reset' ).addEventListener( 'click', () => {
			// eslint-disable-next-line no-alert
			if ( window.confirm( 'Reset the session timer?' ) ) {
				resetTimer();
			}
		} );

		qs( '#tf-edit-limit-btn' ).addEventListener( 'click', toggleEditTimer );

		qs( '#tf-timer' ).addEventListener( 'keydown', ( e ) => {
			if ( 'Enter' === e.key ) {
				e.preventDefault();
				exitEditTimer( true );
			}
			if ( 'Escape' === e.key ) {
				exitEditTimer( false );
			}
		} );

		qs( '#tf-timer' ).addEventListener( 'keypress', ( e ) => {
			if ( ! /^[\d:]$/.test( e.key ) ) {
				e.preventDefault();
			}
		} );

		qs( '.tf-phases' ).addEventListener( 'click', ( e ) => {
			if ( e.target.classList.contains( 'tf-phase-btn' ) ) {
				setPhase( e.target.dataset.phase );
				saveSessionState();
			}
		} );

		document.addEventListener( 'click', ( e ) => {
			if ( e.target.matches( '.tf-copy-btn[data-msg]' ) ) {
				copyText( e.target.dataset.msg, e.target );
			}
		} );

		qs( '#tf-announcement' ).addEventListener( 'input', function () {
			const preview = qs( '#tf-announcement-preview' );
			if ( this.value.trim() ) {
				preview.textContent = T.announcement( this.value.trim() );
				preview.classList.remove( 'tf-preview--muted' );
			} else {
				preview.textContent = 'Enter announcement text to preview';
				preview.classList.add( 'tf-preview--muted' );
			}
		} );

		qs( '#tf-copy-announcement' ).addEventListener( 'click', function () {
			const val = qs( '#tf-announcement' ).value.trim();
			if ( ! val ) {
				toast( 'Enter announcement text first' );
				return;
			}
			copyText( T.announcement( val ), this );
		} );

		[ '#tf-assign-username', '#tf-assign-ticket' ].forEach( ( sel ) => {
			qs( sel ).addEventListener( 'input', refreshAssignPreview );
		} );

		qs( '#tf-copy-first-assign' ).addEventListener( 'click', function () {
			const u = qs( '#tf-assign-username' ).value.trim().replace( /^@/, '' );
			const t = qs( '#tf-assign-ticket' ).value.trim().replace( /^#/, '' );
			if ( ! u || ! t ) {
				toast( 'Enter both username and ticket number' );
				return;
			}
			copyText( T.firstAssign( u, t ), this );
		} );

		qs( '#tf-copy-followup' ).addEventListener( 'click', function () {
			const u = qs( '#tf-assign-username' ).value.trim().replace( /^@/, '' );
			const t = qs( '#tf-assign-ticket' ).value.trim().replace( /^#/, '' );
			if ( ! u || ! t ) {
				toast( 'Enter both username and ticket number' );
				return;
			}
			copyText( T.followUp( u, t ), this );
		} );

		qs( '#tf-copy-ack' ).addEventListener( 'click', function () {
			const u = qs( '#tf-assign-username' ).value.trim().replace( /^@/, '' );
			if ( ! u ) {
				toast( 'Enter a username' );
				return;
			}
			copyText( T.ack( u ), this );
		} );

		const newUsernameInput = qs( '#tf-new-username' );
		const doAdd = () => {
			addParticipant( newUsernameInput.value );
			newUsernameInput.value = '';
			newUsernameInput.focus();
		};
		qs( '#tf-add-participant-btn' ).addEventListener( 'click', doAdd );
		newUsernameInput.addEventListener( 'keydown', ( e ) => { if ( 'Enter' === e.key ) { doAdd(); } } );

		qs( '#tf-copy-thanks' ).addEventListener( 'click', function () {
			if ( 0 === state.participants.length ) {
				toast( 'Add participants first' );
				return;
			}
			copyText( qs( '#tf-thanks-preview' ).dataset.msg, this );
		} );

		qs( '#tf-reset-session-btn' ).addEventListener( 'click', resetSession );

		renderTable();
		refreshThanks();
		refreshAssignPreview();
	}

	document.addEventListener( 'DOMContentLoaded', init );
}() );
