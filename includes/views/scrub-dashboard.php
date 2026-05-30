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
		<h1><?php esc_html_e( 'Patch Testing Scrub', 'testflow' ); ?></h1>
		<div class="tf-timer-controls">
			<button id="tf-timer-reset" class="button"><?php esc_html_e( 'Reset', 'testflow' ); ?></button>
			<button id="tf-edit-limit-btn" class="button"><?php esc_html_e( 'Edit', 'testflow' ); ?></button>
			<button id="tf-timer-btn" class="button button-primary">&#9654; <?php esc_html_e( 'Start', 'testflow' ); ?></button>
			<span id="tf-timer" class="tf-timer">00:00</span>
		</div>
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

				<div class="tf-msg-row">
					<div class="tf-msg-content">
						<div class="tf-msg-label"><?php esc_html_e( 'Thank all participants', 'testflow' ); ?></div>
						<div id="tf-thanks-preview" class="tf-msg-text tf-preview--muted">
							<?php esc_html_e( 'Add participants to generate this message', 'testflow' ); ?>
						</div>
					</div>
					<button id="tf-copy-thanks" class="tf-copy-btn">
						<?php esc_html_e( 'Copy', 'testflow' ); ?>
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

			<table class="widefat tf-table">
				<thead>
					<tr>
						<th><?php esc_html_e( 'Participant', 'testflow' ); ?></th>
						<th><?php esc_html_e( 'Assigned Tickets', 'testflow' ); ?></th>
						<th></th>
					</tr>
				</thead>
				<tbody id="tf-participants-list">
					<tr class="tf-empty-row">
						<td colspan="3">
							<?php esc_html_e( 'No participants yet. Add someone above to get started.', 'testflow' ); ?>
						</td>
					</tr>
				</tbody>
			</table>
		</main>

	</div>

	<div class="tf-section-label tf-clipboard-label"><?php esc_html_e( 'Your Clipboard', 'testflow' ); ?></div>
	<div id="tf-clipboard-bar" class="tf-clipboard-bar">
		<span id="tf-clipboard-text" class="tf-clipboard-text tf-clipboard-text--empty"><?php esc_html_e( 'Nothing copied yet', 'testflow' ); ?></span>
		<button id="tf-clipboard-copy-btn" class="tf-clipboard-copy-btn" title="<?php esc_attr_e( 'Copy again', 'testflow' ); ?>">
			<span class="dashicons dashicons-clipboard" aria-hidden="true"></span>
		</button>
	</div>

	<div class="tf-session-footer">
		<button id="tf-reset-session-btn" class="button tf-btn-danger">
			<?php esc_html_e( 'Reset Session', 'testflow' ); ?>
		</button>
	</div>

	<div id="tf-toast" class="tf-toast" aria-live="polite"></div>

</div>
