( function () {
	'use strict';

	// ── State ────────────────────────────────────────────────────

	const state = {
		participants: [],
		nextId: 1,
		phase: 'opening',
		timerSeconds: 0,
		timerRunning: false,
		timerInterval: null,
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

	function tickTimer() {
		state.timerSeconds++;
		const el = qs( '#tf-timer' );
		el.textContent = `${ pad( Math.floor( state.timerSeconds / 60 ) ) }:${ pad( state.timerSeconds % 60 ) }`;
		el.classList.toggle( 'is-warning', state.timerSeconds >= 50 * 60 );
	}

	function toggleTimer() {
		if ( state.timerRunning ) {
			clearInterval( state.timerInterval );
			state.timerRunning = false;
			qs( '#tf-timer-btn' ).textContent = '▶ Resume';
		} else {
			state.timerInterval = setInterval( tickTimer, 1000 );
			state.timerRunning  = true;
			qs( '#tf-timer-btn' ).textContent = '⏸ Pause';
		}
	}

	function resetTimer() {
		clearInterval( state.timerInterval );
		state.timerRunning  = false;
		state.timerSeconds  = 0;
		const el = qs( '#tf-timer' );
		el.textContent = '00:00';
		el.classList.remove( 'is-warning' );
		qs( '#tf-timer-btn' ).textContent = '▶ Start';
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
	}

	function markReported( id ) {
		const p = state.participants.find( ( p ) => p.id === id );

		if ( ! p ) {
			return;
		}

		p.status = STATUS.REPORTED;
		copyText( T.ack( p.username ) );
		renderTable();
	}

	function markDone( id ) {
		const p = state.participants.find( ( p ) => p.id === id );

		if ( ! p ) {
			return;
		}

		p.status = STATUS.DONE;
		renderTable();
	}

	function removeParticipant( id, username ) {
		// eslint-disable-next-line no-alert
		if ( ! window.confirm( `Remove @${ username } from the list?` ) ) {
			return;
		}

		state.participants = state.participants.filter( ( p ) => p.id !== id );
		renderTable();
		refreshThanks();
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
			const input = cel( 'input' );
			input.type        = 'text';
			input.className   = 'tf-ticket-input';
			input.placeholder = '#ticket';

			const btn     = cel( 'button' );
			btn.className = 'button button-small button-primary';
			btn.textContent = STATUS.REPORTED === p.status ? 'Assign Next' : 'Assign';

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
		qs( '#tf-timer-btn' ).addEventListener( 'click', toggleTimer );

		qs( '#tf-timer-reset' ).addEventListener( 'click', () => {
			// eslint-disable-next-line no-alert
			if ( window.confirm( 'Reset the session timer?' ) ) {
				resetTimer();
			}
		} );

		qs( '.tf-phases' ).addEventListener( 'click', ( e ) => {
			if ( e.target.classList.contains( 'tf-phase-btn' ) ) {
				setPhase( e.target.dataset.phase );
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

		renderTable();
		refreshThanks();
		refreshAssignPreview();
	}

	document.addEventListener( 'DOMContentLoaded', init );
}() );
