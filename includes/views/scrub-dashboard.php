<?php
/**
 * Patch Testing Scrub dashboard view.
 *
 * @package TestFlow
 */

defined( 'ABSPATH' ) || exit;

$messages = array(
	'here'           => "/here We are starting today's <patch-testing-scrub>",
	'welcome'        => 'Hello everyone 👋',
	'invite'         => "If you're around, we'd love your help with testing and sharing reports.",
	'call'           => "If you're ready to start patch testing, please reply in this thread so I can assign you a ticket. 🧵",
	'close_end'      => "Well, this marks the end of today's </patch-testing-session>",
	'close_reassure' => 'Feel free to ping me if you need to comment on anything, and also if you have not finished with your patch testing, you can continue for as long as you want, and ping me if you have any trouble finishing.',
);

$opening_messages = array(
	array(
		'text'  => $messages['here'],
		'label' => __( 'Announce start', 'testflow' ),
	),
	array(
		'text'  => $messages['welcome'],
		'label' => __( 'Welcome', 'testflow' ),
	),
	array(
		'text'  => $messages['invite'],
		'label' => __( 'Invite participants', 'testflow' ),
	),
	array(
		'text'  => $messages['call'],
		'label' => __( 'Call for testers', 'testflow' ),
	),
);

$closing_messages = array(
	array(
		'text'  => $messages['close_end'],
		'label' => __( 'End session', 'testflow' ),
	),
	array(
		'text'  => $messages['close_reassure'],
		'label' => __( 'Reassure participants', 'testflow' ),
	),
);
?>

<div class="wrap tf-wrap">

	<div class="tf-header">
		<div class="tf-header-title">
			<h1><?php esc_html_e( 'Patch Testing Scrub', 'testflow' ); ?></h1>
			<div class="tf-session-type" role="group" aria-label="<?php esc_attr_e( 'Session type', 'testflow' ); ?>">
				<button class="tf-session-type-btn is-active" data-type="core"><?php esc_html_e( 'Core', 'testflow' ); ?></button>
				<button class="tf-session-type-btn" data-type="gutenberg"><?php esc_html_e( 'Gutenberg', 'testflow' ); ?></button>
			</div>
		</div>
		<div class="tf-timer-controls">
			<button id="tf-timer-reset" class="button"><?php esc_html_e( 'Reset', 'testflow' ); ?></button>
			<button id="tf-edit-limit-btn" class="button"><?php esc_html_e( 'Edit', 'testflow' ); ?></button>
			<button id="tf-timer-btn" class="button button-primary">&#9654; <?php esc_html_e( 'Start', 'testflow' ); ?></button>
			<span id="tf-timer" class="tf-timer">00:00</span>
		</div>
	</div>

	<div class="tf-phases">
		<button class="tf-phase-btn is-active" data-phase="opening"><?php esc_html_e( '1 · Opening', 'testflow' ); ?></button>
		<span class="tf-phase-arrow" aria-hidden="true">→</span>
		<button class="tf-phase-btn" data-phase="assigning"><?php esc_html_e( '2 · Assigning', 'testflow' ); ?></button>
		<span class="tf-phase-arrow" aria-hidden="true">→</span>
		<button class="tf-phase-btn" data-phase="monitoring"><?php esc_html_e( '3 · Monitoring', 'testflow' ); ?></button>
		<span class="tf-phase-arrow" aria-hidden="true">→</span>
		<button class="tf-phase-btn" data-phase="closing"><?php esc_html_e( '4 · Closing', 'testflow' ); ?></button>
	</div>

	<div class="tf-body">

		<aside class="tf-messages-panel">

			<div class="tf-panel-section">
				<div class="tf-section-label"><?php esc_html_e( 'Opening', 'testflow' ); ?></div>

				<?php foreach ( $opening_messages as $item ) : ?>
				<div class="tf-msg-row">
					<div class="tf-msg-content">
						<div class="tf-msg-label"><?php echo esc_html( $item['label'] ); ?></div>
						<div class="tf-msg-text"><?php echo esc_html( $item['text'] ); ?></div>
					</div>
					<button class="tf-copy-btn" data-msg="<?php echo esc_attr( $item['text'] ); ?>"><?php esc_html_e( 'Copy', 'testflow' ); ?></button>
				</div>
				<?php endforeach; ?>

				<div class="tf-msg-row tf-msg-row--stacked">
					<div class="tf-msg-label">
						<?php esc_html_e( 'Announcement', 'testflow' ); ?>
						<span class="tf-optional">(<?php esc_html_e( 'optional', 'testflow' ); ?>)</span>
					</div>
					<input
						type="text"
						id="tf-announcement"
						class="tf-text-input"
						placeholder="<?php esc_attr_e( 'e.g. WordPress 7.0 RC 2 is now available…', 'testflow' ); ?>"
					>
					<div id="tf-announcement-preview" class="tf-preview tf-preview--muted">
						<?php esc_html_e( 'Enter announcement text to preview', 'testflow' ); ?>
					</div>
					<button id="tf-copy-announcement" class="tf-copy-btn tf-copy-btn--full">
						<?php esc_html_e( 'Copy Announcement', 'testflow' ); ?>
					</button>
				</div>
			</div>

			<div class="tf-panel-section">
				<div class="tf-section-label"><?php esc_html_e( 'Assign Ticket', 'testflow' ); ?></div>
				<div class="tf-assign-inputs">
					<select id="tf-assign-username" class="tf-text-input">
						<option value=""><?php esc_html_e( '— participant —', 'testflow' ); ?></option>
					</select>
					<select id="tf-assign-ticket" class="tf-text-input">
						<option value=""><?php esc_html_e( '— ticket / issue —', 'testflow' ); ?></option>
					</select>
				</div>
				<div id="tf-assign-preview" class="tf-preview tf-preview--muted">
					<?php esc_html_e( 'Select participant and ticket above', 'testflow' ); ?>
				</div>
				<div class="tf-assign-btns">
					<div class="tf-assign-btns-row">
						<button id="tf-copy-first-assign" class="tf-copy-btn"><?php esc_html_e( 'First Assignment', 'testflow' ); ?></button>
						<button id="tf-copy-followup" class="tf-copy-btn"><?php esc_html_e( 'Follow-up', 'testflow' ); ?></button>
					</div>
					<button id="tf-copy-ack" class="tf-copy-btn tf-copy-btn--full">
						<?php esc_html_e( 'Acknowledge Report', 'testflow' ); ?>
					</button>
				</div>
			</div>

			<div class="tf-panel-section">
				<div class="tf-section-label"><?php esc_html_e( 'Closing', 'testflow' ); ?></div>

				<?php foreach ( $closing_messages as $item ) : ?>
				<div class="tf-msg-row">
					<div class="tf-msg-content">
						<div class="tf-msg-label"><?php echo esc_html( $item['label'] ); ?></div>
						<div class="tf-msg-text"><?php echo esc_html( $item['text'] ); ?></div>
					</div>
					<button class="tf-copy-btn" data-msg="<?php echo esc_attr( $item['text'] ); ?>"><?php esc_html_e( 'Copy', 'testflow' ); ?></button>
				</div>
				<?php endforeach; ?>

				<div class="tf-msg-row tf-msg-row--stacked">
					<div class="tf-msg-label"><?php esc_html_e( 'Thank all participants', 'testflow' ); ?></div>
					<div id="tf-thanks-preview" class="tf-preview tf-preview--muted">
						<?php esc_html_e( 'Add participants to generate this message', 'testflow' ); ?>
					</div>
					<button id="tf-copy-thanks" class="tf-copy-btn tf-copy-btn--full">
						<?php esc_html_e( 'Copy Thanks', 'testflow' ); ?>
					</button>
				</div>
			</div>

		</aside>

		<main class="tf-tracker">

			<div class="tf-pool-setup">
				<div class="tf-pool-col">
					<label class="tf-pool-label" for="tf-participant-pool">
						<?php esc_html_e( 'Participants (one per line)', 'testflow' ); ?>
					</label>
					<textarea
						id="tf-participant-pool"
						class="tf-pool-textarea"
						rows="8"
						wrap="off"
						placeholder="<?php esc_attr_e( "username1\nusername2\nusername3", 'testflow' ); ?>"
					></textarea>
				</div>
				<div class="tf-pool-col">
					<label class="tf-pool-label" for="tf-ticket-pool">
						<?php esc_html_e( 'Tickets / Issues (one URL per line)', 'testflow' ); ?>
					</label>
					<textarea
						id="tf-ticket-pool"
						class="tf-pool-textarea"
						rows="8"
						wrap="off"
						placeholder="<?php esc_attr_e( "https://core.trac.wordpress.org/ticket/65403\nhttps://github.com/WordPress/gutenberg/issues/12345", 'testflow' ); ?>"
					></textarea>
				</div>
			</div>

			<div class="tf-tracker-header">
				<h2><?php esc_html_e( 'Participant Tracker', 'testflow' ); ?></h2>
				<div class="tf-add-participant">
					<select id="tf-participant-select" class="tf-text-input">
						<option value=""><?php esc_html_e( '— select participant —', 'testflow' ); ?></option>
					</select>
					<button id="tf-add-participant-btn" class="button button-primary">
						<?php esc_html_e( '+ Add Participant', 'testflow' ); ?>
					</button>
				</div>
			</div>

			<table class="widefat tf-table">
				<thead>
					<tr>
						<th><?php esc_html_e( 'Participant', 'testflow' ); ?></th>
						<th><?php esc_html_e( 'Ticket', 'testflow' ); ?></th>
						<th><?php esc_html_e( 'Status', 'testflow' ); ?></th>
						<th><?php esc_html_e( 'Actions', 'testflow' ); ?></th>
					</tr>
				</thead>
				<tbody id="tf-participants-list">
					<tr class="tf-empty-row">
						<td colspan="4">
							<?php esc_html_e( 'No participants yet. Add someone above to get started.', 'testflow' ); ?>
						</td>
					</tr>
				</tbody>
			</table>
		</main>

	</div>

	<div class="tf-session-footer">
		<button id="tf-reset-session-btn" class="button tf-btn-danger">
			<?php esc_html_e( 'Reset Session', 'testflow' ); ?>
		</button>
	</div>

	<div id="tf-toast" class="tf-toast" aria-live="polite"></div>

</div>
