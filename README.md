# Florida Lawn Watering & Pest Forecast (WordPress plugin)

A free WordPress plugin from [Waves Pest Control](https://www.wavespestcontrol.com/) with two live
widgets for Florida lawns and homes, each as a block and a shortcode:

- **Florida Lawn Watering Calculator**: this week's watering plan for a Florida city (last week's
  rain, the forecast, the lawn's need, and water / skip / need only), with a link to the county's
  water management district rules.
- **Florida Pest Pressure Forecast**: this month's modeled pest pressure for a Florida city.

The data comes from the free Waves public API (no key). See
[waves-lawn-tools](https://github.com/wavespestcontrolfl/waves-lawn-tools) for the API docs and the
open-source watering math.

## Layout

- `florida-lawn-watering-pest-forecast/`: the plugin, exactly as it ships to WordPress.org.
  - `florida-lawn-watering-pest-forecast.php`: shortcodes, block registration, the settings page.
  - `blocks/*/`: `block.json` plus a plain editor script (no build step).
  - `assets/js/*.v1.js`: the widget scripts, copied from `wavespestcontrol.com/embed/` by the build.
  - `includes/locations.php`: the 26 supported cities, built from the API's city list.
- `build.mjs`: copies the widget scripts, rebuilds the city list, checks the version and writes
  `dist/florida-lawn-watering-pest-forecast-<version>.zip`.

## Rules this plugin keeps

- **The credit link is off by default** (WordPress.org guideline 10). Every mount carries
  `data-credit="off"` unless the site owner turns the credit on under Settings > Lawn & Pest
  Forecast. The build refuses widget scripts that do not support `data-credit="off"`.
- **No remote code.** The widget scripts ship inside the plugin; only JSON comes from the API,
  which the readme's "External services" section documents.
- Shortcode and block input is checked: an unknown city falls back to Bradenton, an unknown grass
  type is dropped, and the pest count stays between 1 and 8.

## Build and test

```sh
node build.mjs                                   # widget scripts from the live site
node build.mjs --embed-base ../path/public/embed # or from a local wavespestcontrol-astro checkout
```

Test the zip in [WordPress Playground](https://playground.wordpress.net/): Plugins > Add New >
Upload Plugin, then add the shortcodes or blocks to a page. Run
[Plugin Check](https://wordpress.org/plugins/plugin-check/) (Tools > Plugin Check, all categories)
before every release; version 1.0.0 passed with no errors or warnings.

## Release

1. Set the same version in the plugin header (`Version:`), `FLWPF_VERSION` and the readme's
   `Stable tag:`. The build stops on a mismatch.
2. `node build.mjs`, then test the zip as above.
3. Commit it to the WordPress.org SVN `trunk` and tag it.

## License

GPLv2 or later. See [LICENSE](LICENSE).
