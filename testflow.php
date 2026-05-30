<?php
/**
 * Plugin Name:       TestFlow
 * Plugin URI:        https://make.wordpress.org/test/
 * Description:       Session facilitator for WordPress Test Team members.
 * Version:           0.2.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            WordPress Test Team
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       testflow
 *
 * @package TestFlow
 */

defined( 'ABSPATH' ) || exit;

define( 'TESTFLOW_DIR', plugin_dir_path( __FILE__ ) );
define( 'TESTFLOW_URL', plugin_dir_url( __FILE__ ) );

require_once TESTFLOW_DIR . 'includes/class-testflow-admin.php';

add_action( 'plugins_loaded', array( 'TestFlow_Admin', 'init' ) );
