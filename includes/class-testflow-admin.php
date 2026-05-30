<?php
/**
 * Admin class.
 *
 * @package TestFlow
 */

defined( 'ABSPATH' ) || exit;

/**
 * Handles admin menu registration, asset enqueuing, and page rendering.
 */
class TestFlow_Admin {

	const SLUG_BASE      = 'testflow';
	const SLUG_SCRUB     = 'testflow-scrub';
	const SLUG_TEST_CHAT = 'testflow-test-chat';

	/**
	 * Registers all hooks.
	 */
	public static function init() {
		$instance = new self();
		add_action( 'admin_menu', array( $instance, 'register_menu' ) );
		add_action( 'admin_enqueue_scripts', array( $instance, 'enqueue_assets' ) );
	}

	/**
	 * Registers the admin menu and submenu pages.
	 */
	public function register_menu() {
		add_menu_page(
			__( 'TestFlow', 'testflow' ),
			__( 'TestFlow', 'testflow' ),
			'edit_posts',
			self::SLUG_BASE,
			array( $this, 'render_overview' ),
			'dashicons-editor-paste-text',
			81
		);

		// Same slug as parent anchors the parent link to the overview page.
		add_submenu_page(
			self::SLUG_BASE,
			__( 'Overview', 'testflow' ),
			__( 'Overview', 'testflow' ),
			'edit_posts',
			self::SLUG_BASE,
			array( $this, 'render_overview' )
		);

		add_submenu_page(
			self::SLUG_BASE,
			__( 'Patch Testing Scrub', 'testflow' ),
			__( 'Patch Testing Scrub', 'testflow' ),
			'edit_posts',
			self::SLUG_SCRUB,
			array( $this, 'render_scrub' )
		);

		add_submenu_page(
			self::SLUG_BASE,
			__( 'Test Chat', 'testflow' ),
			__( 'Test Chat', 'testflow' ),
			'edit_posts',
			self::SLUG_TEST_CHAT,
			array( $this, 'render_test_chat' )
		);
	}

	/**
	 * Enqueues plugin assets on TestFlow admin pages.
	 *
	 * @param string $hook Current admin page hook suffix.
	 */
	public function enqueue_assets( $hook ) {
		$overview_hook  = 'toplevel_page_' . self::SLUG_BASE;
		$scrub_hook     = 'testflow_page_' . self::SLUG_SCRUB;
		$test_chat_hook = 'testflow_page_' . self::SLUG_TEST_CHAT;

		if ( ! in_array( $hook, array( $overview_hook, $scrub_hook, $test_chat_hook ), true ) ) {
			return;
		}

		wp_enqueue_style(
			'testflow-admin',
			TESTFLOW_URL . 'assets/css/admin.css',
			array(),
			(string) filemtime( TESTFLOW_DIR . 'assets/css/admin.css' )
		);

		if ( $scrub_hook === $hook ) {
			wp_enqueue_script(
				'testflow-scrub',
				TESTFLOW_URL . 'assets/js/scrub-session.js',
				array(),
				(string) filemtime( TESTFLOW_DIR . 'assets/js/scrub-session.js' ),
				true
			);

			wp_localize_script(
				'testflow-scrub',
				'testflowScrub',
				array(
					'messages' => TestFlow_Messages::get_all(),
				)
			);
		}

		if ( $test_chat_hook === $hook ) {
			wp_enqueue_script(
				'testflow-test-chat',
				TESTFLOW_URL . 'assets/js/test-chat-session.js',
				array(),
				(string) filemtime( TESTFLOW_DIR . 'assets/js/test-chat-session.js' ),
				true
			);

			wp_localize_script(
				'testflow-test-chat',
				'testflowTestChat',
				array(
					'messages' => TestFlow_Messages::get_test_chat_all(),
				)
			);
		}
	}

	/**
	 * Renders the overview page.
	 */
	public function render_overview() {
		require TESTFLOW_DIR . 'includes/views/overview.php';
	}

	/**
	 * Renders the Patch Testing Scrub dashboard.
	 */
	public function render_scrub() {
		require TESTFLOW_DIR . 'includes/views/scrub-dashboard.php';
	}

	/**
	 * Renders the Test Chat dashboard.
	 */
	public function render_test_chat() {
		require TESTFLOW_DIR . 'includes/views/test-chat-dashboard.php';
	}
}
