<?php
/**
 * Removes the plugin's one setting when the plugin is deleted.
 *
 * @package FloridaLawnWateringPestForecast
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

delete_option( 'flwpf_show_credit' );
