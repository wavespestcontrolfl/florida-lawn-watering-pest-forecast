// Builds the WordPress.org upload: checks the version and the widget scripts' link rules, rebuilds
// the city list from the public API, and zips the plugin folder.
//
//   node build.mjs
//
// Writes dist/florida-lawn-watering-pest-forecast-<version>.zip. Node 18 or newer, and `zip`.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SLUG = 'florida-lawn-watering-pest-forecast';
const PLUGIN = join(ROOT, SLUG);
const LOCATIONS_API = 'https://portal.wavespestcontrol.com/api/public/pest-forecast/locations';
const WIDGETS = ['watering-plan.v1.js', 'pest-forecast.v1.js'];

// The only https addresses the widget scripts may hold: the two API endpoints and the two credit
// pages. The rules link takes its address from the API, but the script accepts only official
// government hosts for it.
const ALLOWED_URLS = new Set([
  'https://portal.wavespestcontrol.com/api/public/watering-plan',
  'https://portal.wavespestcontrol.com/api/public/pest-forecast',
  'https://www.wavespestcontrol.com/tools/lawn-watering-calculator/',
  'https://www.wavespestcontrol.com/tools/pest-pressure-forecast/',
]);

function fail(message) {
  console.error(`build: ${message}`);
  process.exit(1);
}

// 1. One version everywhere.
const main = readFileSync(join(PLUGIN, `${SLUG}.php`), 'utf8');
const version = (main.match(/^\s*\*\s*Version:\s*([0-9.]+)\s*$/m) || [])[1];
const constant = (main.match(/define\(\s*'FLWPF_VERSION',\s*'([0-9.]+)'\s*\)/) || [])[1];
const stable = (readFileSync(join(PLUGIN, 'readme.txt'), 'utf8').match(/^Stable tag:\s*([0-9.]+)\s*$/m) || [])[1];
if (!version || version !== constant || version !== stable) {
  fail(`version mismatch: header ${version}, FLWPF_VERSION ${constant}, readme Stable tag ${stable}`);
}

// 2. The widget scripts (WordPress.org guideline 10): every link is opt-in, and link and API
// addresses are fixed in the script.
for (const name of WIDGETS) {
  const code = readFileSync(join(PLUGIN, 'assets', 'js', name), 'utf8');
  for (const url of code.match(/https:\/\/[^\s'"`)<>\\]+/g) || []) {
    if (!ALLOWED_URLS.has(url)) fail(`${name}: unexpected address ${url}`);
  }
  if (!code.includes("getAttribute('data-credit') === 'on'")) fail(`${name}: the credit link must be opt-in`);
  if (name === 'watering-plan.v1.js' && !code.includes("getAttribute('data-rules-link') === 'on'")) {
    fail(`${name}: the rules link must be opt-in`);
  }
  if (code.includes('data-api')) fail(`${name}: the API address must stay fixed`);
}

// 3. The city list.
const res = await fetch(LOCATIONS_API);
if (!res.ok) fail(`locations: HTTP ${res.status}`);
const { locations } = await res.json();
if (!Array.isArray(locations) || locations.length === 0) fail('locations: empty list');
const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const rows = locations.map((l) => {
  if (!/^[a-z0-9-]+$/.test(l.slug)) fail(`locations: unexpected slug ${l.slug}`);
  return `\t'${l.slug}' => '${esc(l.label)}',`;
});
writeFileSync(join(PLUGIN, 'includes', 'locations.php'), `<?php
/**
 * Supported Florida cities, slug => label. Built by build.mjs from
 * ${LOCATIONS_API}.
 *
 * @package FloridaLawnWateringPestForecast
 */

defined( 'ABSPATH' ) || exit;

return array(
${rows.join('\n')}
);
`);

// 4. The zip, with the plugin folder at its root.
const dist = join(ROOT, 'dist');
mkdirSync(dist, { recursive: true });
const zipPath = join(dist, `${SLUG}-${version}.zip`);
rmSync(zipPath, { force: true });
execFileSync('zip', ['-r', '-X', '-q', zipPath, SLUG, '-x', '*.DS_Store'], { cwd: ROOT });
console.log(`wrote ${zipPath} (version ${version}, ${locations.length} cities)`);
