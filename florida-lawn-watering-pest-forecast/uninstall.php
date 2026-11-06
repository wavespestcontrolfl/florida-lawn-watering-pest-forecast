<?php
/**
 * Removes the plugin's two settings when the plugin is deleted.
 *
 * @package FloridaLawnWateringPestForecast
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

delete_option( 'flwpf_show_credit' );
delete_option( 'flwpf_show_rules_link' );
