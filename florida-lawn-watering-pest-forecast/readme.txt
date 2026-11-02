=== Florida Lawn Watering & Pest Forecast ===
Contributors: wavespestcontrol
Tags: lawn, irrigation, watering, pest control, florida
Requires at least: 6.3
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Free Florida lawn watering calculator and pest pressure forecast widgets, as blocks and shortcodes. No API key needed.

== Description ==

Add two free, live widgets for Florida lawns and homes to any page.

**Florida Lawn Watering Calculator.** This week's watering plan for a Florida city: the rain of the last 7 days, this week's forecast, the lawn's weekly need, and a plain answer: water this week, skip this week, or (where no watering order is tracked) the lawn's need only. It never names watering days. It links the county's water management district rules instead, because local watering rules always come first.

**Florida Pest Pressure Forecast.** This month's modeled pest pressure for a Florida city: German cockroaches, palmetto bugs, ants, mosquitoes, fleas and ticks, wasps, rats and mice, and subterranean termites. Each pest gets a level and a comparison with its seasonal baseline. It is a seasonal, weather-based model, not a measurement.

Both widgets cover 26 Florida cities, from Tallahassee and Jacksonville to Tampa, Sarasota, Naples and Miami.

Add them with a block ("Florida Lawn Watering Calculator", "Florida Pest Pressure Forecast") or a shortcode:

`[florida_watering_plan location="bradenton-fl" grass="bahia"]`

`[florida_pest_forecast location="tampa-fl" limit="6"]`

The widgets load their data in the visitor's browser, so your pages stay fully cacheable. There is no API key, no account and nothing to set up.

**Credit link.** The widgets show no link to Waves Pest Control unless you turn on the credit link under Settings > Lawn & Pest Forecast.

Made by Waves Pest Control, a licensed pest control and lawn care company in Southwest Florida. The watering math is open source: [waves-lawn-tools on GitHub](https://github.com/wavespestcontrolfl/waves-lawn-tools).

== External services ==

This plugin shows data from the Waves Pest Control public API, a free service run by Waves Pest Control, LLC at portal.wavespestcontrol.com. The widgets cannot work without it.

* What is sent, and when: each time a visitor's browser shows a page with one of the widgets, the browser asks the API for that widget's data. The request carries the city you chose, and the grass type or the number of pests if you set them. Like any web request, it reaches the server with the visitor's IP address, the address of the page and the browser type. It carries no cookies and no data from your site's users or database.
* Lawn watering plan: https://portal.wavespestcontrol.com/api/public/watering-plan
* Pest pressure forecast: https://portal.wavespestcontrol.com/api/public/pest-forecast
* Terms of service: https://www.wavespestcontrol.com/terms-of-service/
* Privacy policy: https://www.wavespestcontrol.com/privacy-policy/

== Installation ==

1. Install and activate the plugin.
2. Add the "Florida Lawn Watering Calculator" or "Florida Pest Pressure Forecast" block to a page, or paste a shortcode.
3. Pick a city in the block settings, or set `location` in the shortcode. Settings > Lawn & Pest Forecast lists every city slug.

== Frequently Asked Questions ==

= Does it work outside Florida? =

No. Both widgets cover 26 Florida cities. The settings page lists them.

= Which shortcode options are there? =

`florida_watering_plan`: `location` (a city slug) and `grass` (`st_augustine`, `zoysia`, `bahia` or `bermuda`; without it the plan assumes St. Augustine).

`florida_pest_forecast`: `location` (a city slug) and `limit` (how many pests to show, 1 to 8; default 6).

= Does the watering plan say which day to water? =

No. Watering days depend on your address and your local rules, so the widget links your water management district's rules instead.

= Is there a link to Waves Pest Control? =

Only if you turn it on. The credit link is off by default.

= Does it set cookies or collect personal data? =

The plugin sets no cookies and stores no visitor data. The widgets' requests to the API carry no cookies. See "External services" above for what each request contains.

= Can I change how the widgets look? =

Yes, with your theme's CSS. The widgets' styles are scoped under `.wwp-root` (watering) and `.wpcpf-root` (forecast).

== Changelog ==

= 1.0.0 =
* First release: the Florida Lawn Watering Calculator and the Florida Pest Pressure Forecast, as blocks and shortcodes.
