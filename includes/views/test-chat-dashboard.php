<?php
/**
 * Test Chat dashboard view.
 *
 * @package TestFlow
 */

defined( 'ABSPATH' ) || exit;

$sections = array(
	'opening'       => __( '1. Opening', 'testflow' ),
	'attendance'    => __( '2. Attendance Check', 'testflow' ),
	'agenda'        => __( '3. Share Agenda', 'testflow' ),
	'meeting_notes' => __( '4. Meeting Notes', 'testflow' ),
	'discussions'   => __( '5. Test Team Discussions', 'testflow' ),
	'open_floor'    => __( '6. Open Floor', 'testflow' ),
	'announcements' => __( '7. Announcements', 'testflow' ),
	'closing'       => __( '8. Closing', 'testflow' ),
);

$template_vars = array( 'agenda_url', 'facilitator', 'note_taker' );
?>

<div class="wrap tf-wrap">

	<div class="tf-header">
		<h1><?php esc_html_e( 'Test Chat', 'testflow' ); ?></h1>
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
				<?php $items = TestFlow_Messages::get_test_chat_section( $section_key ); ?>
				<?php if ( ! empty( $items ) ) : ?>

				<div class="tf-panel-section">
					<div class="tf-section-label">
						<?php echo esc_html( $section_label ); ?>
						<?php $duration = TestFlow_Messages::get_test_chat_duration( $section_key ); ?>
						<?php if ( $duration ) : ?>
						<span class="tf-duration-tag">
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
							<?php echo esc_html( $duration ); ?>
						</span>
						<?php endif; ?>
					</div>

					<?php $in_list = false; ?>
					<?php foreach ( $items as $item ) : ?>
						<?php
						$text      = isset( $item['text'] ) ? $item['text'] : '';
						$label     = isset( $item['label'] ) ? $item['label'] : '';
						$is_note   = ! empty( $item['note'] );
						$is_bullet = ! empty( $item['bullet'] );
						$has_var   = (bool) preg_match( '/\{(agenda_url|facilitator|note_taker)\}/', $text );

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

						<?php elseif ( $has_var ) : ?>

						<div class="tf-msg-row">
							<div class="tf-msg-content">
								<div class="tf-msg-label"><?php echo esc_html( $label ); ?></div>
								<div class="tf-msg-text tf-template-preview" data-template="<?php echo esc_attr( $text ); ?>">
									<?php echo esc_html( $text ); ?>
								</div>
							</div>
							<button class="tf-copy-btn tf-template-copy" data-template="<?php echo esc_attr( $text ); ?>">
								<?php esc_html_e( 'Copy', 'testflow' ); ?>
							</button>
						</div>

						<?php else : ?>

						<div class="tf-msg-row">
							<div class="tf-msg-content">
								<div class="tf-msg-label"><?php echo esc_html( $label ); ?></div>
								<div class="tf-msg-text">
									<?php
									$display = esc_html( $text );
									$display = preg_replace( '/(`[^`]+`)/', '<code class="tf-inline-code">$1</code>', $display );
									$display = preg_replace( '/(&lt;\/?[a-z][a-z0-9-]*&gt;)/i', '<code class="tf-inline-code">$1</code>', $display );
									echo wp_kses( $display, array( 'code' => array( 'class' => array() ) ) );
									?>
								</div>
							</div>
							<button class="tf-copy-btn" data-msg="<?php echo esc_attr( $text ); ?>">
								<?php esc_html_e( 'Copy', 'testflow' ); ?>
							</button>
						</div>

						<?php endif; ?>
					<?php endforeach; ?>
					<?php
					if ( $in_list ) :
						?>
						</ul><?php endif; ?>

				</div>

				<?php endif; ?>
			<?php endforeach; ?>

		</aside>

		<div class="tf-right-col">

			<div class="tf-tracker">
				<div class="tf-section-label"><?php esc_html_e( 'Session Variables', 'testflow' ); ?></div>

				<div class="tf-var-field">
					<label class="tf-pool-label" for="tf-agenda-url">
						<?php esc_html_e( 'Agenda URL', 'testflow' ); ?>
					</label>
					<input
						type="url"
						id="tf-agenda-url"
						class="tf-text-input"
						placeholder="https://make.wordpress.org/test/..."
					>
				</div>

				<div class="tf-var-field">
					<label class="tf-pool-label" for="tf-facilitator">
						<?php esc_html_e( 'Facilitator', 'testflow' ); ?>
					</label>
					<input
						type="text"
						id="tf-facilitator"
						class="tf-text-input"
						placeholder="<?php esc_attr_e( '@username', 'testflow' ); ?>"
					>
				</div>

				<div class="tf-var-field">
					<label class="tf-pool-label" for="tf-note-taker">
						<?php esc_html_e( 'Note-taker', 'testflow' ); ?>
						<span class="tf-optional">(<?php esc_html_e( 'if different from facilitator', 'testflow' ); ?>)</span>
					</label>
					<input
						type="text"
						id="tf-note-taker"
						class="tf-text-input"
						placeholder="<?php esc_attr_e( '@username', 'testflow' ); ?>"
					>
				</div>
			</div>

			<div class="tf-section-label tf-clipboard-label"><?php esc_html_e( 'Your Clipboard', 'testflow' ); ?></div>
			<div id="tf-clipboard-bar" class="tf-clipboard-bar">
				<span id="tf-clipboard-text" class="tf-clipboard-text tf-clipboard-text--empty"><?php esc_html_e( 'Nothing copied yet', 'testflow' ); ?></span>
				<button id="tf-clipboard-copy-btn" class="tf-clipboard-copy-btn" title="<?php esc_attr_e( 'Copy again', 'testflow' ); ?>">
					<span class="dashicons dashicons-clipboard" aria-hidden="true"></span>
				</button>
			</div>

			<div class="tf-resources">
				<div class="tf-section-label"><?php esc_html_e( 'Resources & Links', 'testflow' ); ?></div>
				<ul class="tf-resource-links">
					<li><a href="https://make.wordpress.org/test/handbook/team-reps/test-chat-moderator-guide/" target="_blank" rel="noopener noreferrer"><?php esc_html_e( 'Handbook: Test Chat Moderator Guide', 'testflow' ); ?></a></li>	
					<li><a href="https://make.wordpress.org/test/tag/test-chat-agenda/" target="_blank" rel="noopener noreferrer"><?php esc_html_e( 'Example Test Chat Agendas', 'testflow' ); ?></a></li>
					<li><a href="https://github.com/WordPress/test-handbook/issues" target="_blank" rel="noopener noreferrer"><?php esc_html_e( 'Test Handbook Issues', 'testflow' ); ?></a></li>
					<li><a href="https://make.wordpress.org/test/" target="_blank" rel="noopener noreferrer"><?php esc_html_e( 'Make WordPress Test Blog', 'testflow' ); ?></a></li>
				</ul>
			</div>

		</div>

	</div>

	<div class="tf-session-footer">
		<button id="tf-reset-session-btn" class="button tf-btn-danger">
			<?php esc_html_e( 'Reset Session', 'testflow' ); ?>
		</button>
	</div>

	<div id="tf-toast" class="tf-toast" aria-live="polite"></div>

</div>
