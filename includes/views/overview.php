<?php
/**
 * Overview page view.
 *
 * @package TestFlow
 */

defined( 'ABSPATH' ) || exit;

$testflow_sessions = array(
	array(
		'title'       => __( 'Patch Testing Scrub', 'testflow' ),
		'description' => __( 'A 1-hour weekly session where a moderator assigns tickets to contributors for patch testing. Covers opening, ticket assignment, monitoring reports, and closing.', 'testflow' ),
		'url'         => admin_url( 'admin.php?page=testflow-scrub' ),
		'label'       => __( 'Start Scrub Session', 'testflow' ),
	),
	array(
		'title'       => __( 'Test Chat', 'testflow' ),
		'description' => __( 'A 1-hour weekly team chat covering agenda discussions, WordPress ecosystem announcements, test team updates, and open floor.', 'testflow' ),
		'url'         => admin_url( 'admin.php?page=testflow-test-chat' ),
		'label'       => __( 'Start Test Chat', 'testflow' ),
	),
);
?>

<div class="wrap tf-wrap">

	<h1><?php esc_html_e( 'TestFlow', 'testflow' ); ?></h1>
	<p class="tf-overview-intro">
		<?php esc_html_e( 'Session tools for WordPress Test Team moderators. Choose a session type to get started.', 'testflow' ); ?>
	</p>

	<div class="tf-session-cards">
		<?php foreach ( $testflow_sessions as $testflow_session ) : ?>
		<div class="tf-session-card">
			<h2><?php echo esc_html( $testflow_session['title'] ); ?></h2>
			<p><?php echo esc_html( $testflow_session['description'] ); ?></p>
			<a href="<?php echo esc_url( $testflow_session['url'] ); ?>" class="button button-primary">
				<?php echo esc_html( $testflow_session['label'] ); ?>
			</a>
		</div>
		<?php endforeach; ?>
	</div>

</div>
