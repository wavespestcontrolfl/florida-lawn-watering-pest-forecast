/**
 * Block editor UI for the Florida Lawn Watering Calculator block. Plain script, no build step.
 * The page renders the live widget on the server side (render_callback); the editor shows a
 * placeholder card with the chosen city, since the widget script only runs on the published page.
 */
( function ( wp ) {
	const { registerBlockType } = wp.blocks;
	const { createElement: el, Fragment } = wp.element;
	const { InspectorControls, useBlockProps } = wp.blockEditor;
	const { PanelBody, SelectControl } = wp.components;
	const { __ } = wp.i18n;
	const data = window.flwpfEditor || { cities: [], grass: [] };
	const textDomain = 'florida-lawn-watering-pest-forecast';

	registerBlockType( 'flwpf/watering-plan', {
		edit( { attributes, setAttributes } ) {
			const city = data.cities.find( ( c ) => c.value === attributes.location );
			const grass = data.grass.find( ( g ) => g.value === attributes.grass );
			return el(
				Fragment,
				null,
				el(
					InspectorControls,
					null,
					el(
						PanelBody,
						{ title: __( 'Settings', textDomain ) },
						el( SelectControl, {
							label: __( 'City', textDomain ),
							value: attributes.location,
							options: data.cities,
							onChange: ( value ) => setAttributes( { location: value } ),
						} ),
						el( SelectControl, {
							label: __( 'Grass', textDomain ),
							value: attributes.grass,
							options: data.grass,
							onChange: ( value ) => setAttributes( { grass: value } ),
						} )
					)
				),
				el(
					'div',
					useBlockProps( { style: { border: '1px solid #c3c4c7', borderRadius: '8px', padding: '16px' } } ),
					el( 'strong', null, __( 'Florida Lawn Watering Calculator', textDomain ) ),
					el( 'div', null, ( city ? city.label : attributes.location ) + ( grass && grass.value ? ' · ' + grass.label : '' ) ),
					el( 'p', { style: { margin: '8px 0 0', opacity: 0.75 } }, __( "This week's watering plan shows on the published page.", textDomain ) )
				)
			);
		},
		save() {
			return null;
		},
	} );
} )( window.wp );
