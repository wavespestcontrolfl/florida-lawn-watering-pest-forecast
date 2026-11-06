/*!
 * Florida Lawn Watering & Pest Forecast (WordPress plugin): Lawn Watering Calculator widget.
 *
 * Fills each mount the plugin's shortcode or block prints:
 *
 *   <div class="waves-watering-plan" data-location="bradenton-fl" data-credit="off" data-rules-link="off"></div>
 *
 * The data comes from the Waves Pest Control public API (see "External services" in the readme).
 * Links are opt-in (WordPress.org guideline 10): the widget adds no link to the page unless the
 * mount says data-credit="on" or data-rules-link="on", and the plugin prints "on" only after the
 * site owner turns that link on under Settings > Lawn & Pest Forecast. Link addresses are fixed
 * here: the credit goes to the Waves tool page, and the rules link only to an official government
 * page. CSS is scoped under .wwp-root. No dependencies; safe to load more than once.
 */
(function () {
  'use strict';
  if (window.__wavesWateringPlanV1) return;
  window.__wavesWateringPlanV1 = true;

  var API = 'https://portal.wavespestcontrol.com/api/public/watering-plan';
  var LANDING = 'https://www.wavespestcontrol.com/tools/lawn-watering-calculator/';
  // The rules link may point only at an official page: a .gov or state.fl.us site, or one of the
  // water management districts that use a .com address.
  var OFFICIAL_HOST = /(^|\.)(gov|state\.fl\.us|nwfwater\.com|sjrwmd\.com|mysuwanneeriver\.com)$/i;
  var SELECTOR = '[data-waves-watering-plan], .waves-watering-plan';
  var GRASS = { st_augustine: 1, zoysia: 1, bahia: 1, bermuda: 1, unknown: 1 };

  // The calculator never states watering days. If a payload string ever names
  // one, the widget drops that string instead of printing it.
  var DAY_RE = /\b(mon|tues?|wednes|thurs?|fri|satur|sun)day\b/i;

  var CSS = [
    '.wwp-root{all:initial;display:block;box-sizing:border-box;max-width:420px;margin:0 auto;',
      'font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;',
      'color:#1B2C5B;line-height:1.4;text-align:left;-webkit-font-smoothing:antialiased}',
    '.wwp-root *{box-sizing:border-box;margin:0;padding:0;font-family:inherit}',
    '.wwp-card{border:1px solid #dbe6ef;border-radius:14px;overflow:hidden;background:#fff;',
      'box-shadow:0 1px 3px rgba(27,44,91,.08)}',
    '.wwp-head{background:#1B2C5B;color:#fff;padding:14px 16px}',
    '.wwp-kicker{display:flex;align-items:center;gap:7px;font-size:11px;font-weight:600;',
      'letter-spacing:.08em;text-transform:uppercase;color:#9fd6f4}',
    '.wwp-title{margin-top:3px;font-size:17px;font-weight:700;color:#fff}',
    '.wwp-meta{margin-top:2px;font-size:12.5px;color:#cdd9ec}',
    '.wwp-body{padding:12px 16px 6px}',
    '.wwp-action{font-size:14px;line-height:1.5;color:#23324f;margin-bottom:8px}',
    '.wwp-row{display:flex;justify-content:space-between;align-items:baseline;gap:12px;',
      'padding:8px 0;border-top:1px solid #eef3f8}',
    '.wwp-label{font-size:13px;font-weight:600;color:#3c4a63}',
    '.wwp-value{font-size:14px;font-weight:700;color:#1B2C5B;text-align:right}',
    '.wwp-foot{padding:11px 16px 13px;border-top:1px solid #eef3f8;background:#f7fafc}',
    '.wwp-rules{display:block;font-size:12.5px;font-weight:700;color:#0a6fb0;text-decoration:underline;margin-bottom:8px}',
    '.wwp-rules-text{display:block;font-size:12.5px;font-weight:600;color:#3c4a63;margin-bottom:8px}',
    '.wwp-summary{display:block;font-size:12.5px;color:#3c4a63;margin-bottom:8px}',
    '.wwp-attr{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:700;',
      'color:#0a6fb0;text-decoration:none}',
    '.wwp-attr:hover{text-decoration:underline}',
    '.wwp-attr .wwp-arrow{font-weight:700}',
    '.wwp-disc{display:block;margin-top:7px;font-size:10.5px;color:#475569}',
    '.wwp-skel{padding:20px 16px;font-size:13px;color:#6B7280}'
  ].join('');

  function injectStyles() {
    if (document.getElementById('wwp-styles')) return;
    var s = document.createElement('style');
    s.id = 'wwp-styles';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function clean(s) { return (typeof s === 'string' && s && !DAY_RE.test(s)) ? s : ''; }
  function isNum(n) { return typeof n === 'number' && isFinite(n); }
  function inches(n) { return (Math.round(n * 100) / 100).toString() + ' in'; }
  function officialUrl(u) {
    if (typeof u !== 'string' || !/^https:\/\//i.test(u)) return '';
    var host = '';
    try { host = new URL(u).hostname; } catch (e) { return ''; }
    return OFFICIAL_HOST.test(host) ? u : '';
  }

  // Links are opt-in. The plugin prints data-credit="on" or data-rules-link="on" only when the
  // site owner turned that link on; a missing or any other value means no link.
  function creditOn(mount) { return mount.getAttribute('data-credit') === 'on'; }
  function rulesLinkOn(mount) { return mount.getAttribute('data-rules-link') === 'on'; }

  // The credit link. With the credit on, the plugin prints the link inside the mount; the widget
  // keeps that link and gives it the widget's style. It builds the same link only if none is there.
  function resolveAnchor(mount, locationSlug) {
    var existing = mount.querySelector('a[href]');
    var href = LANDING + '?utm_source=wordpress-plugin&utm_medium=widget&utm_campaign=watering-plan'
      + (locationSlug ? '&utm_content=' + encodeURIComponent(locationSlug) : '');
    var a = existing || document.createElement('a');
    if (!existing) a.setAttribute('href', href);
    a.className = 'wwp-attr';
    a.textContent = '';
    a.appendChild(el('span', null, 'Powered by Waves Pest Control'));
    a.appendChild(el('span', 'wwp-arrow', '→'));
    return a;
  }

  // "Check your county's watering rules": a link to the official rules page only when the site
  // owner turned the rules link on and the address is an official one; plain text otherwise.
  function rulesLine(mount, url) {
    var href = rulesLinkOn(mount) ? officialUrl(url) : '';
    if (!href) return el('span', 'wwp-rules-text', 'Check your county’s watering rules before you water.');
    var a = el('a', 'wwp-rules', 'Check your county’s watering rules');
    a.setAttribute('href', href);
    a.setAttribute('rel', 'noopener');
    return a;
  }

  function planValue(plan) {
    if (!plan) return '';
    if (plan.action === 'run' && isNum(plan.events) && isNum(plan.depthInches)) {
      var v = plan.events + (plan.events === 1 ? ' time' : ' times') + ' × ' + inches(plan.depthInches);
      if (isNum(plan.minutesPerEvent) && plan.minutesPerEvent > 0) v += ' (' + Math.round(plan.minutesPerEvent) + ' min per zone)';
      return v;
    }
    if (plan.action === 'hold') return 'No watering needed';
    if (plan.action === 'need_only') return 'Lawn need only';
    return '';
  }

  function row(body, label, value) {
    if (!value) return;
    var r = el('div', 'wwp-row');
    r.appendChild(el('span', 'wwp-label', label));
    r.appendChild(el('span', 'wwp-value', value));
    body.appendChild(r);
  }

  function render(mount, d, locationSlug) {
    var root = el('div', 'wwp-root');
    var card = el('div', 'wwp-card');

    var head = el('div', 'wwp-head');
    var kicker = el('div', 'wwp-kicker');
    kicker.appendChild(el('span', null, '💧'));
    kicker.appendChild(el('span', null, 'Lawn Watering Calculator'));
    head.appendChild(kicker);
    head.appendChild(el('div', 'wwp-title', (d.location && d.location.label) || 'Your lawn'));
    var headline = clean(d.text && d.text.headline);
    if (headline) head.appendChild(el('div', 'wwp-meta', headline));
    card.appendChild(head);

    var body = el('div', 'wwp-body');
    var action = clean(d.text && d.text.action);
    if (action) body.appendChild(el('p', 'wwp-action', action));
    if (d.rain && isNum(d.rain.last7Inches)) row(body, 'Rain, last 7 days', inches(d.rain.last7Inches));
    if (d.need && isNum(d.need.targetInches)) row(body, 'Lawn needs this week', inches(d.need.targetInches));
    row(body, 'Plan', planValue(d.plan));
    card.appendChild(body);

    var foot = el('div', 'wwp-foot');
    foot.appendChild(rulesLine(mount, d.rulesUrl));
    if (creditOn(mount)) foot.appendChild(resolveAnchor(mount, locationSlug));
    var disc = clean(d.disclaimer);
    if (disc) foot.appendChild(el('span', 'wwp-disc', disc));
    card.appendChild(foot);

    root.appendChild(card);
    mount.innerHTML = '';
    mount.appendChild(root);
  }

  // On any failure the card shows no numbers and no error jargon: the title, the rules reminder
  // (as plain text, because the rules page is not known) and the credit link if it is on.
  function renderError(mount, locationSlug) {
    var root = el('div', 'wwp-root');
    var card = el('div', 'wwp-card');
    var head = el('div', 'wwp-head');
    head.appendChild(el('div', 'wwp-title', 'Lawn Watering Calculator'));
    if (creditOn(mount)) head.appendChild(el('div', 'wwp-meta', 'by Waves Pest Control'));
    card.appendChild(head);
    var foot = el('div', 'wwp-foot');
    foot.appendChild(rulesLine(mount, ''));
    if (creditOn(mount)) foot.appendChild(resolveAnchor(mount, locationSlug));
    card.appendChild(foot);
    root.appendChild(card);
    mount.innerHTML = '';
    mount.appendChild(root);
  }

  // Each render of a mount gets a request id. A host page may re-render the same mount
  // (the tool page's city picker does) before the earlier request answers; only the
  // newest request may paint the mount, whatever order the responses arrive in.
  var requestSeq = 0;

  function initOne(mount) {
    if (mount.getAttribute('data-wwp-init') === '1') return;
    mount.setAttribute('data-wwp-init', '1');
    var requestId = String(++requestSeq);
    mount.setAttribute('data-wwp-req', requestId);
    function current() { return mount.getAttribute('data-wwp-req') === requestId; }

    var location = mount.getAttribute('data-location') || '';
    var grass = mount.getAttribute('data-grass') || '';

    var qs = [];
    if (location) qs.push('location=' + encodeURIComponent(location));
    if (GRASS[grass]) qs.push('grass=' + grass);
    var url = API + (qs.length ? '?' + qs.join('&') : '');

    var skel = el('div', 'wwp-root');
    var skCard = el('div', 'wwp-card');
    skCard.appendChild(el('div', 'wwp-skel', 'Loading the lawn watering plan…'));
    skel.appendChild(skCard);
    mount.appendChild(skel);

    fetch(url, { credentials: 'omit' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (data) {
        if (!current()) return;
        if (!data || !data.plan) throw new Error('empty');
        render(mount, data, location || (data.location && data.location.slug));
      })
      .catch(function () { if (current()) renderError(mount, location); });
  }

  function initAll(root) {
    injectStyles();
    var nodes = (root || document).querySelectorAll(SELECTOR);
    for (var i = 0; i < nodes.length; i++) initOne(nodes[i]);
  }

  window.WavesWateringPlan = { init: initAll, render: initOne };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initAll(); });
  } else {
    initAll();
  }
})();
