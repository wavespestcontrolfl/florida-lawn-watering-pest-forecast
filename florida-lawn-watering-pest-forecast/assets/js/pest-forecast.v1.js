/*!
 * Waves Pest Control — Florida Pest Pressure Forecast embed (v1)
 * Free embeddable widget. Drop this on any site:
 *
 *   <div class="waves-pest-forecast" data-location="bradenton-fl">
 *     <a href="https://www.wavespestcontrol.com/tools/pest-pressure-forecast/">
 *       Florida Pest Pressure Forecast by Waves Pest Control</a>
 *   </div>
 *   <script async src="https://www.wavespestcontrol.com/embed/pest-forecast.v1.js"></script>
 *
 * Optional: data-credit="off" leaves out the Waves credit line and link, for
 * directories whose rules make credits opt-in (the WordPress.org plugin turns
 * the credit on only when the site owner chooses it).
 *
 * The widget renders into the host page's light DOM (not an iframe / shadow
 * root) so the attribution link is a real, crawlable backlink to Waves. CSS is
 * scoped under .wpcpf-root to avoid bleeding into — or inheriting from — the
 * host page. Self-contained: no dependencies, safe to load more than once.
 */
(function () {
  'use strict';
  if (window.__wavesPestForecastV1) return;
  window.__wavesPestForecastV1 = true;

  var API = 'https://portal.wavespestcontrol.com/api/public/pest-forecast';
  var LANDING = 'https://www.wavespestcontrol.com/tools/pest-pressure-forecast/';
  var SELECTOR = '[data-waves-pest-forecast], .waves-pest-forecast';

  var LEVEL = {
    high:     { color: '#C8102E', label: 'High' },
    elevated: { color: '#C2410C', label: 'Elevated' },
    moderate: { color: '#B45309', label: 'Moderate' },
    low:      { color: '#15803D', label: 'Low' },
    minimal:  { color: '#6B7280', label: 'Minimal' }
  };

  var CSS = [
    '.wpcpf-root{all:initial;display:block;box-sizing:border-box;max-width:420px;margin:0 auto;',
      'font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;',
      'color:#1B2C5B;line-height:1.4;text-align:left;-webkit-font-smoothing:antialiased}',
    '.wpcpf-root *{box-sizing:border-box;margin:0;padding:0;font-family:inherit}',
    '.wpcpf-card{border:1px solid #dbe6ef;border-radius:14px;overflow:hidden;background:#fff;',
      'box-shadow:0 1px 3px rgba(27,44,91,.08)}',
    '.wpcpf-head{background:#1B2C5B;color:#fff;padding:14px 16px}',
    '.wpcpf-kicker{display:flex;align-items:center;gap:7px;font-size:11px;font-weight:600;',
      'letter-spacing:.08em;text-transform:uppercase;color:#9fd6f4}',
    '.wpcpf-title{margin-top:3px;font-size:17px;font-weight:700;color:#fff}',
    '.wpcpf-meta{margin-top:2px;font-size:12.5px;color:#cdd9ec}',
    '.wpcpf-body{padding:8px 14px 4px}',
    '.wpcpf-row{display:flex;align-items:center;gap:10px;padding:8px 2px;border-top:1px solid #eef3f8}',
    '.wpcpf-row:first-child{border-top:0}',
    '.wpcpf-emoji{font-size:18px;width:22px;text-align:center;flex:0 0 auto}',
    '.wpcpf-name{flex:0 0 38%;font-size:13px;font-weight:600;color:#23324f;overflow:hidden;',
      'text-overflow:ellipsis;white-space:nowrap}',
    '.wpcpf-track{flex:1 1 auto;height:8px;background:#eef1f5;border-radius:99px;overflow:hidden}',
    '.wpcpf-fill{height:100%;border-radius:99px;transition:width .5s ease}',
    '.wpcpf-pill{flex:0 0 auto;min-width:64px;text-align:right;font-size:11px;font-weight:700;',
      'letter-spacing:.02em}',
    '.wpcpf-foot{padding:11px 16px 13px;border-top:1px solid #eef3f8;background:#f7fafc}',
    '.wpcpf-summary{display:block;font-size:12.5px;color:#3c4a63;margin-bottom:8px}',
    '.wpcpf-attr{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:700;',
      'color:#0a6fb0;text-decoration:none}',
    '.wpcpf-attr:hover{text-decoration:underline}',
    '.wpcpf-attr .wpcpf-arrow{font-weight:700}',
    '.wpcpf-disc{display:block;margin-top:7px;font-size:10.5px;color:#475569}',
    '.wpcpf-comparison{font-size:12px;line-height:1.45;color:#475569;margin:0 0 10px}',
    '.wpcpf-skel{padding:20px 16px;font-size:13px;color:#6B7280}',
    '@media (max-width:380px){.wpcpf-name{flex-basis:34%}.wpcpf-pill{min-width:54px}}'
  ].join('');

  function injectStyles() {
    if (document.getElementById('wpcpf-styles')) return;
    var s = document.createElement('style');
    s.id = 'wpcpf-styles';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  // The credit shows unless the mount says data-credit="off".
  function creditOn(mount) { return mount.getAttribute('data-credit') !== 'off'; }

  // Find an existing attribution <a> the host pasted, or build one. Either way
  // the returned anchor lives in the host's light DOM = a real backlink.
  function resolveAnchor(mount, forecast, locationSlug) {
    var existing = mount.querySelector('a[href]');
    var href = (forecast && forecast.attribution && forecast.attribution.url)
      || (LANDING + '?utm_source=embed&utm_medium=widget&utm_campaign=pest-forecast'
          + (locationSlug ? '&utm_content=' + encodeURIComponent(locationSlug) : ''));
    var a = existing || document.createElement('a');
    if (!existing) a.setAttribute('href', href);
    a.className = 'wpcpf-attr';
    a.textContent = '';
    a.appendChild(el('span', null, 'Powered by Waves Pest Control'));
    a.appendChild(el('span', 'wpcpf-arrow', '→'));
    return a;
  }

  function render(mount, forecast, locationSlug) {
    var root = el('div', 'wpcpf-root');
    var card = el('div', 'wpcpf-card');

    var head = el('div', 'wpcpf-head');
    var kicker = el('div', 'wpcpf-kicker');
    kicker.appendChild(el('span', null, '🕵️'));
    kicker.appendChild(el('span', null, 'Florida Pest Pressure Forecast'));
    head.appendChild(kicker);
    head.appendChild(el('div', 'wpcpf-title', forecast.location.label));
    var metaBits = ['Modeled outlook'];
    if (forecast.weather && forecast.weather.summary) metaBits.push(forecast.weather.summary);
    head.appendChild(el('div', 'wpcpf-meta', metaBits.join('  ·  ')));
    card.appendChild(head);

    var body = el('div', 'wpcpf-body');
    var pests = (forecast.pests || []).slice(0, mount.__wpcpfLimit || 6);
    pests.forEach(function (p) {
      var meta = LEVEL[p.level] || LEVEL.minimal;
      var row = el('div', 'wpcpf-row');
      if (p.note) row.setAttribute('title', p.note);
      row.appendChild(el('span', 'wpcpf-emoji', p.emoji || ''));
      row.appendChild(el('span', 'wpcpf-name', p.label));
      var track = el('div', 'wpcpf-track');
      var fill = el('div', 'wpcpf-fill');
      fill.style.width = Math.max(4, Math.round((p.score10 / 10) * 100)) + '%';
      fill.style.background = meta.color;
      track.appendChild(fill);
      row.appendChild(track);
      var pill = el('span', 'wpcpf-pill', (meta.label + ' ' + p.score10 + '/10'));
      pill.style.color = meta.color;
      row.appendChild(pill);
      body.appendChild(row);
      // Legacy trend is a seasonal-baseline delta, never a weekly trend.
      var baselineKey = p.baseline_comparison || { up: 'above', down: 'below', flat: 'near' }[p.trend];
      var baseline = { above: 'Above seasonal baseline', below: 'Below seasonal baseline', near: 'Near seasonal baseline' }[baselineKey];
      var comparison = el('div', 'wpcpf-comparison');
      if (baseline) comparison.appendChild(el('div', null, baseline));
      var prior = p.week_over_week;
      var change = prior && { up: 'higher', down: 'lower', flat: 'similar' }[prior.direction];
      if (change && /^\d{4}-\d{2}-\d{2}$/.test(prior.previous_date || '')) {
        comparison.appendChild(el('div', null, 'Modeled outlook ' + change + (prior.direction === 'flat' ? ' to ' : ' than ') + prior.previous_date));
      }
      if (comparison.childNodes.length) body.appendChild(comparison);
    });
    card.appendChild(body);

    var foot = el('div', 'wpcpf-foot');
    if (forecast.summary) foot.appendChild(el('span', 'wpcpf-summary', forecast.summary));
    if (creditOn(mount)) foot.appendChild(resolveAnchor(mount, forecast, locationSlug));
    if (forecast.disclaimer) foot.appendChild(el('span', 'wpcpf-disc', forecast.disclaimer));
    card.appendChild(foot);

    root.appendChild(card);
    mount.innerHTML = '';
    mount.appendChild(root);
  }

  function renderError(mount, locationSlug) {
    var root = el('div', 'wpcpf-root');
    var card = el('div', 'wpcpf-card');
    var head = el('div', 'wpcpf-head');
    head.appendChild(el('div', 'wpcpf-title', 'Florida Pest Pressure Forecast'));
    if (creditOn(mount)) head.appendChild(el('div', 'wpcpf-meta', 'by Waves Pest Control'));
    card.appendChild(head);
    var foot = el('div', 'wpcpf-foot');
    foot.appendChild(el('span', 'wpcpf-summary', 'Live forecast is temporarily unavailable.'));
    if (creditOn(mount)) foot.appendChild(resolveAnchor(mount, null, locationSlug));
    card.appendChild(foot);
    root.appendChild(card);
    mount.innerHTML = '';
    mount.appendChild(root);
  }

  function initOne(mount) {
    if (mount.getAttribute('data-wpcpf-init') === '1') return;
    mount.setAttribute('data-wpcpf-init', '1');

    var apiBase = mount.getAttribute('data-api') || API;
    var location = mount.getAttribute('data-location') || '';
    var zip = mount.getAttribute('data-zip') || '';
    var limit = parseInt(mount.getAttribute('data-limit'), 10);
    if (limit > 0) mount.__wpcpfLimit = limit;

    var qs = [];
    if (location) qs.push('location=' + encodeURIComponent(location));
    else if (zip) qs.push('zip=' + encodeURIComponent(zip));
    var url = apiBase + (qs.length ? '?' + qs.join('&') : '');

    var skel = el('div', 'wpcpf-root');
    var skCard = el('div', 'wpcpf-card');
    skCard.appendChild(el('div', 'wpcpf-skel', 'Loading Florida pest pressure forecast…'));
    skel.appendChild(skCard);
    // Keep the host's pasted anchor (backlink) visible even while loading.
    if (!mount.querySelector('a[href]')) { /* nothing to preserve */ }
    mount.appendChild(skel);

    fetch(url, { credentials: 'omit' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (data) { render(mount, data, location || (data.location && data.location.slug)); })
      .catch(function () { renderError(mount, location); });
  }

  function initAll(root) {
    injectStyles();
    var nodes = (root || document).querySelectorAll(SELECTOR);
    for (var i = 0; i < nodes.length; i++) initOne(nodes[i]);
  }

  window.WavesPestForecast = { init: initAll, render: initOne };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initAll(); });
  } else {
    initAll();
  }
})();
