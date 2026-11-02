/* PDE – gestione consenso, Consent Mode v2, caricamento GA4 e tracciamento eventi. */
(function () {
	'use strict';
	var cfg = window.pdeConsentConfig || {};
	var KEY = 'pde_consent';
	var banner = document.getElementById('pde-consent');
	var prefs = banner && banner.querySelector('.pde-consent__prefs');

	function read() {
		var m = document.cookie.match(/(?:^|; )pde_consent=([^;]+)/);
		if (!m) return null;
		try { var v = JSON.parse(decodeURIComponent(m[1])); return v.v === cfg.version ? v : null; } catch (e) { return null; }
	}
	function write(c) {
		c.v = cfg.version; c.t = Date.now();
		document.cookie = KEY + '=' + encodeURIComponent(JSON.stringify(c)) + ';path=/;max-age=' + 60 * 60 * 24 * 180 + ';SameSite=Lax' + (location.protocol === 'https:' ? ';Secure' : '');
		apply(c);
	}
	var gaLoaded = false;
	function apply(c) {
		gtag('consent', 'update', {
			analytics_storage: c.analytics ? 'granted' : 'denied',
			ad_storage: c.marketing ? 'granted' : 'denied',
			ad_user_data: c.marketing ? 'granted' : 'denied',
			ad_personalization: c.marketing ? 'granted' : 'denied'
		});
		if (c.analytics && !gaLoaded && (cfg.ga4 || cfg.gtm)) {
			gaLoaded = true;
			var s = document.createElement('script');
			s.async = true;
			if (cfg.gtm) {
				dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
				s.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(cfg.gtm);
			} else {
				s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(cfg.ga4);
				gtag('js', new Date());
				gtag('config', cfg.ga4, { anonymize_ip: true });
			}
			document.head.appendChild(s);
		}
		document.querySelectorAll('[data-consent-embed]').forEach(function (el) {
			if (c[el.getAttribute('data-consent-embed')]) activateEmbed(el);
		});
		document.documentElement.classList.toggle('has-consent-marketing', !!c.marketing);
	}
	function activateEmbed(el) {
		if (el.dataset.loaded) return;
		el.dataset.loaded = '1';
		var f = document.createElement('iframe');
		f.src = el.getAttribute('data-src');
		f.title = el.getAttribute('data-title') || '';
		f.loading = 'lazy';
		f.allow = 'accelerometer; encrypted-media; picture-in-picture; fullscreen';
		f.allowFullscreen = true;
		el.innerHTML = '';
		el.appendChild(f);
	}
	var lastFocus = null;
	function open() {
		if (!banner) return;
		lastFocus = document.activeElement;
		var c = read() || {};
		if (prefs) { prefs.analytics.checked = !!c.analytics; prefs.marketing.checked = !!c.marketing; }
		banner.hidden = false;
		var first = banner.querySelector('[data-consent="accept"]');
		if (first) first.focus();
	}
	function close() {
		banner.hidden = true;
		if (lastFocus && lastFocus.focus) lastFocus.focus();
	}
	if (banner) {
		banner.addEventListener('click', function (e) {
			var b = e.target.closest('[data-consent]');
			if (!b) return;
			var a = b.getAttribute('data-consent');
			if (a === 'accept') { write({ analytics: true, marketing: true }); close(); }
			if (a === 'reject') { write({ analytics: false, marketing: false }); close(); }
			if (a === 'customize') {
				prefs.hidden = !prefs.hidden;
				b.setAttribute('aria-expanded', String(!prefs.hidden));
				banner.querySelector('[data-consent="save"]').hidden = prefs.hidden;
			}
			if (a === 'save') { write({ analytics: prefs.analytics.checked, marketing: prefs.marketing.checked }); close(); }
		});
		banner.addEventListener('keydown', function (e) { if (e.key === 'Escape' && read()) close(); });
	}
	document.addEventListener('click', function (e) {
		var o = e.target.closest('[data-consent-open]');
		if (o) { e.preventDefault(); open(); return; }
		var acc = e.target.closest('[data-consent-accept]');
		if (acc) {
			var c = read() || { analytics: false, marketing: false };
			c[acc.getAttribute('data-consent-accept')] = true;
			write(c);
			return;
		}
		var t = e.target.closest('a, [data-pde-event]');
		if (!t) return;
		var ev = t.getAttribute('data-pde-event');
		var href = t.getAttribute('href') || '';
		if (!ev && /\/scarica\/\d+|\.pdf($|\?)/i.test(href)) ev = 'file_download';
		if (!ev && t.hostname && t.hostname !== location.hostname) ev = 'click_outbound';
		if (ev) gtag('event', ev, { link_url: t.href || '', link_text: (t.textContent || '').trim().slice(0, 100) });
	});
	document.addEventListener('submit', function (e) {
		var f = e.target;
		var action = f.querySelector('[name="action"]');
		if (!action) return;
		var map = { pde_contact: 'generate_lead', pde_newsletter: 'sign_up' };
		if (map[action.value]) gtag('event', map[action.value], { form_variant: (f.querySelector('[name="variant"],[name="list"]') || {}).value || '' });
	});
	var current = read();
	if (current) apply(current); else open();
})();
