/**
 * Block editor UI for the Florida Pest Pressure Forecast block. Plain script, no build step.
 * The page renders the live widget on the server side (render_callback); the editor shows a
 * placeholder card with the chosen city, since the widget script only runs on the published page.
 */
( function ( wp ) {
	const { registerBlockType } = wp.blocks;
	const { createElement: el, Fragment } = wp.element;
	const { InspectorControls, useBlockProps } = wp.blockEditor;
	const { PanelBody, SelectControl, RangeControl } = wp.components;
	const { __ } = wp.i18n;
	const data = window.flwpfEditor || { cities: [] };
	const textDomain = 'florida-lawn-watering-pest-forecast';

	registerBlockType( 'flwpf/pest-forecast', {
		edit( { attributes, setAttributes } ) {
			const city = data.cities.find( ( c ) => c.value === attributes.location );
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
						el( RangeControl, {
							label: __( 'Pests to show', textDomain ),
							value: attributes.limit,
							min: 1,
							max: 8,
							onChange: ( value ) => setAttributes( { limit: value } ),
						} )
					)
				),
				el(
					'div',
					useBlockProps( { style: { border: '1px solid #c3c4c7', borderRadius: '8px', padding: '16px' } } ),
					el( 'strong', null, __( 'Florida Pest Pressure Forecast', textDomain ) ),
					el( 'div', null, city ? city.label : attributes.location ),
					el( 'p', { style: { margin: '8px 0 0', opacity: 0.75 } }, __( "This month's forecast shows on the published page.", textDomain ) )
				)
			);
		},
		save() {
			return null;
		},
	} );
} )( window.wp );
