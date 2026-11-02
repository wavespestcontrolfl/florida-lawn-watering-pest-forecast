<?php
/**
 * Plugin Name:       Florida Lawn Watering & Pest Forecast
 * Plugin URI:        https://www.wavespestcontrol.com/tools/lawn-watering-calculator/
 * Description:       Free Florida lawn watering calculator and pest pressure forecast widgets, as blocks and shortcodes. Data comes from the free Waves Pest Control public API.
 * Version:           1.0.0
 * Requires at least: 6.3
 * Requires PHP:      7.4
 * Author:            Waves Pest Control
 * Author URI:        https://www.wavespestcontrol.com/
 * License:           GPLv2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       florida-lawn-watering-pest-forecast
 *
 * @package FloridaLawnWateringPestForecast
 */

defined( 'ABSPATH' ) || exit;

define( 'FLWPF_VERSION', '1.0.0' );
define( 'FLWPF_DIR', plugin_dir_path( __FILE__ ) );
define( 'FLWPF_URL', plugin_dir_url( __FILE__ ) );
define( 'FLWPF_OPTION_CREDIT', 'flwpf_show_credit' );
define( 'FLWPF_DEFAULT_LOCATION', 'bradenton-fl' );

/**
 * Supported Florida cities, slug => label (includes/locations.php, built from the API's city list).
 *
 * @return array<string, string>
 */
function flwpf_locations() {
	static $locations = null;
	if ( null === $locations ) {
		$locations = require FLWPF_DIR . 'includes/locations.php';
	}
	return $locations;
}

/**
 * Grass types the watering plan accepts. An empty value lets the API assume St. Augustine.
 *
 * @return array<string, string>
 */
function flwpf_grass_types() {
	return array(
		''             => __( 'Not set (assumes St. Augustine)', 'florida-lawn-watering-pest-forecast' ),
		'st_augustine' => __( 'St. Augustine', 'florida-lawn-watering-pest-forecast' ),
		'zoysia'       => __( 'Zoysia', 'florida-lawn-watering-pest-forecast' ),
		'bahia'        => __( 'Bahia', 'florida-lawn-watering-pest-forecast' ),
		'bermuda'      => __( 'Bermuda', 'florida-lawn-watering-pest-forecast' ),
	);
}

/**
 * Whether the site owner turned on the "Powered by Waves Pest Control" credit. Off by default.
 *
 * @return bool
 */
function flwpf_credit_on() {
	return '1' === get_option( FLWPF_OPTION_CREDIT, '0' );
}

/**
 * A known city slug, or the default city.
 *
 * @param mixed $location Requested slug.
 * @return string
 */
function flwpf_clean_location( $location ) {
	$location = sanitize_key( (string) $location );
	return array_key_exists( $location, flwpf_locations() ) ? $location : FLWPF_DEFAULT_LOCATION;
}

/**
 * The HTML mount a widget script fills in. With the credit on, a plain link to the tool page sits inside
 * the mount so it is there before the script runs; the script keeps it as the widget's credit link.
 *
 * @param string               $class    Mount class the widget script looks for.
 * @param string               $handle   Script handle to enqueue.
 * @param array<string,string> $data     data-* attributes (empty values are left out).
 * @param string               $landing  Tool page for the credit link.
 * @param string               $label    Credit link text.
 * @param string               $campaign utm_campaign of the credit link.
 * @return string
 */
function flwpf_mount( $class, $handle, array $data, $landing, $label, $campaign ) {
	wp_enqueue_script( $handle );
	$credit         = flwpf_credit_on();
	$data['credit'] = $credit ? 'on' : 'off';

	$attributes = '';
	foreach ( $data as $key => $value ) {
		if ( '' === (string) $value ) {
			continue;
		}
		$attributes .= sprintf( ' data-%s="%s"', esc_attr( $key ), esc_attr( $value ) );
	}

	$inner = '';
	if ( $credit ) {
		$url   = add_query_arg(
			array(
				'utm_source'   => 'wordpress-plugin',
				'utm_medium'   => 'widget',
				'utm_campaign' => $campaign,
			),
			$landing
		);
		$inner = sprintf( '<a href="%s">%s</a>', esc_url( $url ), esc_html( $label ) );
	}

	return sprintf( '<div class="%s"%s>%s</div>', esc_attr( $class ), $attributes, $inner );
}

/**
 * Watering plan widget.
 *
 * @param array<string,mixed> $atts location (city slug), grass.
 * @return string
 */
function flwpf_render_watering_plan( $atts ) {
	$atts  = shortcode_atts(
		array(
			'location' => FLWPF_DEFAULT_LOCATION,
			'grass'    => '',
		),
		(array) $atts,
		'florida_watering_plan'
	);
	$grass = sanitize_key( (string) $atts['grass'] );
	if ( ! array_key_exists( $grass, flwpf_grass_types() ) ) {
		$grass = '';
	}
	return flwpf_mount(
		'waves-watering-plan',
		'flwpf-watering-plan',
		array(
			'location' => flwpf_clean_location( $atts['location'] ),
			'grass'    => $grass,
		),
		'https://www.wavespestcontrol.com/tools/lawn-watering-calculator/',
		__( 'Lawn Watering Calculator by Waves Pest Control', 'florida-lawn-watering-pest-forecast' ),
		'watering-plan'
	);
}

/**
 * Pest pressure forecast widget.
 *
 * @param array<string,mixed> $atts location (city slug), limit (1-8 pests).
 * @return string
 */
function flwpf_render_pest_forecast( $atts ) {
	$atts  = shortcode_atts(
		array(
			'location' => FLWPF_DEFAULT_LOCATION,
			'limit'    => 6,
		),
		(array) $atts,
		'florida_pest_forecast'
	);
	$limit = max( 1, min( 8, absint( $atts['limit'] ) ) );
	return flwpf_mount(
		'waves-pest-forecast',
		'flwpf-pest-forecast',
		array(
			'location' => flwpf_clean_location( $atts['location'] ),
			'limit'    => (string) $limit,
		),
		'https://www.wavespestcontrol.com/tools/pest-pressure-forecast/',
		__( 'Florida Pest Pressure Forecast by Waves Pest Control', 'florida-lawn-watering-pest-forecast' ),
		'pest-forecast'
	);
}

/**
 * Watering plan block: the widget inside the block's wrapper (alignment and class support).
 *
 * @param array<string,mixed> $attributes Block attributes.
 * @return string
 */
function flwpf_render_watering_block( $attributes ) {
	return sprintf( '<div %s>%s</div>', get_block_wrapper_attributes(), flwpf_render_watering_plan( $attributes ) );
}

/**
 * Pest forecast block: the widget inside the block's wrapper.
 *
 * @param array<string,mixed> $attributes Block attributes.
 * @return string
 */
function flwpf_render_forecast_block( $attributes ) {
	return sprintf( '<div %s>%s</div>', get_block_wrapper_attributes(), flwpf_render_pest_forecast( $attributes ) );
}

/**
 * Registers the widget scripts, the shortcodes and the blocks.
 */
function flwpf_init() {
	$args = array(
		'in_footer' => true,
		'strategy'  => 'defer',
	);
	wp_register_script( 'flwpf-watering-plan', FLWPF_URL . 'assets/js/watering-plan.v1.js', array(), FLWPF_VERSION, $args );
	wp_register_script( 'flwpf-pest-forecast', FLWPF_URL . 'assets/js/pest-forecast.v1.js', array(), FLWPF_VERSION, $args );

	// City and grass choices for the block editor. The block scripts list this handle as a dependency.
	$cities = array();
	foreach ( flwpf_locations() as $slug => $label ) {
		$cities[] = array(
			'value' => $slug,
			'label' => $label,
		);
	}
	$grass = array();
	foreach ( flwpf_grass_types() as $value => $label ) {
		$grass[] = array(
			'value' => $value,
			'label' => $label,
		);
	}
	wp_register_script( 'flwpf-editor-data', false, array(), FLWPF_VERSION, true );
	wp_add_inline_script(
		'flwpf-editor-data',
		'window.flwpfEditor = ' . wp_json_encode(
			array(
				'cities' => $cities,
				'grass'  => $grass,
			)
		) . ';'
	);

	add_shortcode( 'florida_watering_plan', 'flwpf_render_watering_plan' );
	add_shortcode( 'florida_pest_forecast', 'flwpf_render_pest_forecast' );

	register_block_type( FLWPF_DIR . 'blocks/watering-plan', array( 'render_callback' => 'flwpf_render_watering_block' ) );
	register_block_type( FLWPF_DIR . 'blocks/pest-forecast', array( 'render_callback' => 'flwpf_render_forecast_block' ) );
}
add_action( 'init', 'flwpf_init' );

/**
 * The credit setting: a checkbox stored as '1' or '0'.
 */
function flwpf_register_settings() {
	register_setting(
		'flwpf',
		FLWPF_OPTION_CREDIT,
		array(
			'type'              => 'string',
			'default'           => '0',
			'sanitize_callback' => 'flwpf_sanitize_flag',
		)
	);
	add_settings_section( 'flwpf_main', '', '__return_false', 'flwpf' );
	add_settings_field(
		FLWPF_OPTION_CREDIT,
		__( 'Credit link', 'florida-lawn-watering-pest-forecast' ),
		'flwpf_render_credit_field',
		'flwpf',
		'flwpf_main'
	);
}
add_action( 'admin_init', 'flwpf_register_settings' );

/**
 * Checkbox value to '1' or '0'.
 *
 * @param mixed $value Submitted value.
 * @return string
 */
function flwpf_sanitize_flag( $value ) {
	return '1' === (string) $value ? '1' : '0';
}

/**
 * The credit checkbox.
 */
function flwpf_render_credit_field() {
	printf(
		'<label><input type="checkbox" name="%1$s" value="1" %2$s> %3$s</label><p class="description">%4$s</p>',
		esc_attr( FLWPF_OPTION_CREDIT ),
		checked( flwpf_credit_on(), true, false ),
		esc_html__( 'Show a "Powered by Waves Pest Control" link under each widget.', 'florida-lawn-watering-pest-forecast' ),
		esc_html__( 'Off by default. Turn it on if you want to credit the source of the data.', 'florida-lawn-watering-pest-forecast' )
	);
}

/**
 * Settings > Lawn & Pest Forecast.
 */
function flwpf_admin_menu() {
	add_options_page(
		__( 'Florida Lawn Watering & Pest Forecast', 'florida-lawn-watering-pest-forecast' ),
		__( 'Lawn & Pest Forecast', 'florida-lawn-watering-pest-forecast' ),
		'manage_options',
		'flwpf',
		'flwpf_render_settings_page'
	);
}
add_action( 'admin_menu', 'flwpf_admin_menu' );

/**
 * The settings page: the credit setting, how to add the widgets and the city slugs.
 */
function flwpf_render_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	?>
	<div class="wrap">
		<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
		<form action="options.php" method="post">
			<?php
			settings_fields( 'flwpf' );
			do_settings_sections( 'flwpf' );
			submit_button();
			?>
		</form>
		<h2><?php esc_html_e( 'Add a widget', 'florida-lawn-watering-pest-forecast' ); ?></h2>
		<p><?php esc_html_e( 'In the block editor, add the "Florida Lawn Watering Calculator" or "Florida Pest Pressure Forecast" block and pick a city in the block settings. Or use a shortcode:', 'florida-lawn-watering-pest-forecast' ); ?></p>
		<p><code>[florida_watering_plan location="bradenton-fl" grass="bahia"]</code></p>
		<p><code>[florida_pest_forecast location="bradenton-fl" limit="6"]</code></p>
		<p><?php esc_html_e( 'grass: st_augustine, zoysia, bahia or bermuda. limit: how many pests to show, 1 to 8.', 'florida-lawn-watering-pest-forecast' ); ?></p>
		<h2><?php esc_html_e( 'City slugs', 'florida-lawn-watering-pest-forecast' ); ?></h2>
		<table class="widefat striped" style="max-width:32em">
			<tbody>
			<?php foreach ( flwpf_locations() as $slug => $label ) : ?>
				<tr><td><code><?php echo esc_html( $slug ); ?></code></td><td><?php echo esc_html( $label ); ?></td></tr>
			<?php endforeach; ?>
			</tbody>
		</table>
	</div>
	<?php
}

/**
 * A Settings link on the Plugins screen.
 *
 * @param string[] $links Plugin action links.
 * @return string[]
 */
function flwpf_action_links( $links ) {
	$settings = sprintf(
		'<a href="%s">%s</a>',
		esc_url( admin_url( 'options-general.php?page=flwpf' ) ),
		esc_html__( 'Settings', 'florida-lawn-watering-pest-forecast' )
	);
	array_unshift( $links, $settings );
	return $links;
}
add_filter( 'plugin_action_links_' . plugin_basename( __FILE__ ), 'flwpf_action_links' );
