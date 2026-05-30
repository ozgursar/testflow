<?php
/**
 * Patch Testing Scrub dashboard view.
 *
 * @package TestFlow
 */

defined( 'ABSPATH' ) || exit;

$sections = array(
	'opening'          => __( '1. Opening', 'testflow' ),
	'assigning_tickets' => __( '2. Assigning Tickets', 'testflow' ),
	'monitoring'       => __( '3. Monitoring the Session', 'testflow' ),
	'closing'          => __( '4. Closing', 'testflow' ),
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

			<?php foreach ( $sections as $section_key => $section_label ) : ?>
				<?php $items = TestFlow_Messages::get_section( $section_key ); ?>
				<?php if ( ! empty( $items ) ) : ?>

				<div class="tf-panel-section">
					<div class="tf-section-label">
						<?php echo esc_html( $section_label ); ?>
						<?php $duration = TestFlow_Messages::get_duration( $section_key ); ?>
						<?php if ( $duration ) : ?>
						<span class="tf-duration-tag"><?php echo esc_html( $duration ); ?></span>
						<?php endif; ?>
					</div>

					<?php $in_list = false; ?>
					<?php foreach ( $items as $item ) : ?>
						<?php
						$text             = isset( $item['text'] ) ? $item['text'] : '';
						$label            = isset( $item['label'] ) ? $item['label'] : '';
						$is_note          = ! empty( $item['note'] );
						$is_bullet        = ! empty( $item['bullet'] );
						$has_announcement = false !== strpos( $text, '{announcement}' );
						$has_participants = false !== strpos( $text, '{participants}' );

						if ( ! $is_bullet && $in_list ) {
							echo '</ul>';
							$in_list = false;
						}
						?>

						<?php if ( $is_note ) : ?>

						<p class="tf-section-note"><?php echo esc_html( $text ); ?></p>

						<?php elseif ( $is_bullet ) : ?>
						<?php if ( ! $in_list ) : ?>
						<ul class="tf-section-bullets">
						<?php $in_list = true; ?>
						<?php endif; ?>
						<li><?php echo esc_html( $text ); ?></li>

						<?php elseif ( $has_announcement ) : ?>

						<div class="tf-msg-row tf-msg-row--input">
							<div class="tf-msg-content">
								<div class="tf-msg-label">
									<?php echo esc_html( $label ); ?>
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
							</div>
							<button id="tf-copy-announcement" class="tf-copy-btn">
								<?php esc_html_e( 'Copy', 'testflow' ); ?>
							</button>
						</div>

						<?php elseif ( $has_participants ) : ?>

						<div class="tf-msg-row">
							<div class="tf-msg-content">
								<div class="tf-msg-label"><?php echo esc_html( $label ); ?></div>
								<div id="tf-thanks-preview" class="tf-msg-text tf-preview--muted">
									<?php esc_html_e( 'Add participants to generate this message', 'testflow' ); ?>
								</div>
							</div>
							<button id="tf-copy-thanks" class="tf-copy-btn">
								<?php esc_html_e( 'Copy', 'testflow' ); ?>
							</button>
						</div>

						<?php else : ?>

						<div class="tf-msg-row">
							<div class="tf-msg-content">
								<div class="tf-msg-label"><?php echo esc_html( $label ); ?></div>
								<div class="tf-msg-text"><?php echo esc_html( $text ); ?></div>
							</div>
							<button class="tf-copy-btn" data-msg="<?php echo esc_attr( $text ); ?>">
								<?php esc_html_e( 'Copy', 'testflow' ); ?>
							</button>
						</div>

						<?php endif; ?>
					<?php endforeach; ?>
					<?php if ( $in_list ) : ?></ul><?php endif; ?>

				</div>

				<?php endif; ?>
			<?php endforeach; ?>

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

			<div class="tf-section-label tf-clipboard-label"><?php esc_html_e( 'Your Clipboard', 'testflow' ); ?></div>
			<div id="tf-clipboard-bar" class="tf-clipboard-bar">
				<span id="tf-clipboard-text" class="tf-clipboard-text tf-clipboard-text--empty"><?php esc_html_e( 'Nothing copied yet', 'testflow' ); ?></span>
				<button id="tf-clipboard-copy-btn" class="tf-clipboard-copy-btn" title="<?php esc_attr_e( 'Copy again', 'testflow' ); ?>">
					<span class="dashicons dashicons-clipboard" aria-hidden="true"></span>
				</button>
			</div>
		</main>

	</div>

	<div class="tf-session-footer">
		<button id="tf-reset-session-btn" class="button tf-btn-danger">
			<?php esc_html_e( 'Reset Session', 'testflow' ); ?>
		</button>
	</div>

	<div id="tf-toast" class="tf-toast" aria-live="polite"></div>

</div>
