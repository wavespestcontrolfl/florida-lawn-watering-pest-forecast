// Builds the WordPress.org upload: copies the two widget scripts into the plugin, rebuilds the
// city list from the public API, checks the version, and zips the plugin folder.
//
//   node build.mjs                          widget scripts from https://www.wavespestcontrol.com/embed/
//   node build.mjs --embed-base <dir|url>   widget scripts from another place (a local checkout)
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

const flag = process.argv.indexOf('--embed-base');
const embedBase = flag > -1 ? process.argv[flag + 1] : 'https://www.wavespestcontrol.com/embed/';

function fail(message) {
  console.error(`build: ${message}`);
  process.exit(1);
}

async function readSource(base, name) {
  if (/^https:\/\//.test(base)) {
    // A query string skips the CDN's cached copy (the embed scripts are cached for an hour).
    const url = new URL(name, base.endsWith('/') ? base : `${base}/`);
    url.searchParams.set('build', String(Date.now()));
    const res = await fetch(url);
    if (!res.ok) fail(`${name}: HTTP ${res.status}`);
    return res.text();
  }
  return readFileSync(join(base, name), 'utf8');
}

// 1. One version everywhere.
const main = readFileSync(join(PLUGIN, `${SLUG}.php`), 'utf8');
const version = (main.match(/^\s*\*\s*Version:\s*([0-9.]+)\s*$/m) || [])[1];
const constant = (main.match(/define\(\s*'FLWPF_VERSION',\s*'([0-9.]+)'\s*\)/) || [])[1];
const stable = (readFileSync(join(PLUGIN, 'readme.txt'), 'utf8').match(/^Stable tag:\s*([0-9.]+)\s*$/m) || [])[1];
if (!version || version !== constant || version !== stable) {
  fail(`version mismatch: header ${version}, FLWPF_VERSION ${constant}, readme Stable tag ${stable}`);
}

// 2. The widget scripts, which must support data-credit="off" (WordPress.org guideline 10: credits opt-in).
mkdirSync(join(PLUGIN, 'assets', 'js'), { recursive: true });
for (const name of WIDGETS) {
  const code = await readSource(embedBase, name);
  if (!code.includes("getAttribute('data-credit') !== 'off'")) {
    fail(`${name} from ${embedBase} does not support data-credit="off"; the credit would show by default`);
  }
  writeFileSync(join(PLUGIN, 'assets', 'js', name), code);
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
console.log(`wrote ${zipPath} (version ${version}, ${locations.length} cities, widgets from ${embedBase})`);
