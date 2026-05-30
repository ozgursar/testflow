<?php
/**
 * Messages class.
 *
 * @package TestFlow
 */

defined( 'ABSPATH' ) || exit;

/**
 * Handles loading and saving message templates.
 */
class TestFlow_Messages {

	const OPTION_KEY = 'testflow_messages';

	/**
	 * Returns all messages, checking wp_options first then falling back to the JSON file.
	 *
	 * @return array
	 */
	public static function get_all() {
		$saved = get_option( self::OPTION_KEY );
		if ( ! empty( $saved ) && is_array( $saved ) ) {
			return $saved;
		}
		return self::get_defaults();
	}

	/**
	 * Returns the default messages from the JSON config file.
	 *
	 * @return array
	 */
	public static function get_defaults() {
		$file = TESTFLOW_DIR . 'includes/config/messages.json';
		if ( ! file_exists( $file ) ) {
			return array();
		}
		$json = file_get_contents( $file ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		$data = json_decode( $json, true );
		return is_array( $data ) ? $data : array();
	}

	/**
	 * Returns the items array for a specific section.
	 *
	 * @param string $section Section key.
	 * @return array
	 */
	public static function get_section( $section ) {
		$all  = self::get_all();
		$data = isset( $all[ $section ] ) ? $all[ $section ] : array();
		return isset( $data['items'] ) ? $data['items'] : $data;
	}

	/**
	 * Returns the duration string for a specific section, or empty string if none.
	 *
	 * @param string $section Section key.
	 * @return string
	 */
	public static function get_duration( $section ) {
		$all  = self::get_all();
		$data = isset( $all[ $section ] ) ? $all[ $section ] : array();
		return isset( $data['duration'] ) ? $data['duration'] : '';
	}
}
