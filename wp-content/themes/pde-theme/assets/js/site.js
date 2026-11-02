(() => {
	'use strict';
	const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

	// Caroselli: frecce, contatore pagina, sincronizzazione con lo scroll touch.
	$$('[data-carousel]').forEach((carousel) => {
		const track = carousel.querySelector('.pde-carousel__track');
		if (!track) return;
		const current = carousel.querySelector('[data-current]');
		const total = carousel.querySelector('[data-total]');
		const buttons = $$('[data-dir]', carousel);
		const pages = () => Math.max(1, Math.ceil((track.scrollWidth - 4) / track.clientWidth));
		const update = () => {
			const n = pages();
			const p = Math.min(n, Math.round(track.scrollLeft / track.clientWidth) + 1);
			if (current) current.textContent = p;
			if (total) total.textContent = n;
			buttons.forEach((b) => {
				const dir = Number(b.dataset.dir);
				b.disabled = dir < 0 ? track.scrollLeft <= 2 : track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
			});
		};
		buttons.forEach((b) => b.addEventListener('click', () => {
			track.scrollBy({ left: Number(b.dataset.dir) * track.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
		}));
		let t;
		track.addEventListener('scroll', () => { clearTimeout(t); t = setTimeout(update, 80); }, { passive: true });
		addEventListener('resize', update);
		update();
	});

	// Menu mobile.
	$$('.pde-header__toggle').forEach((toggle) => {
		const panel = document.getElementById(toggle.getAttribute('aria-controls'));
		if (!panel) return;
		const set = (open) => {
			toggle.setAttribute('aria-expanded', String(open));
			panel.classList.toggle('is-open', open);
			document.documentElement.classList.toggle('pde-nav-open', open);
		};
		toggle.addEventListener('click', () => set(toggle.getAttribute('aria-expanded') !== 'true'));
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { set(false); toggle.focus(); }
		});
		matchMedia('(min-width: 1024px)').addEventListener('change', (m) => { if (m.matches) set(false); });
	});

	// Ricerca a scomparsa.
	$$('.pde-header__search').forEach((btn) => {
		const box = document.getElementById(btn.getAttribute('aria-controls'));
		if (!box) return;
		btn.addEventListener('click', () => {
			const open = box.hasAttribute('hidden');
			box.toggleAttribute('hidden', !open);
			btn.setAttribute('aria-expanded', String(open));
			if (open) box.querySelector('input')?.focus();
		});
		box.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') { box.setAttribute('hidden', ''); btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
		});
	});

	// Copia link (condivisione).
	$$('[data-copy-link]').forEach((btn) => btn.addEventListener('click', async () => {
		const label = btn.textContent;
		try { await navigator.clipboard.writeText(btn.dataset.copyLink || location.href); btn.textContent = 'Link copiato'; }
		catch { btn.textContent = 'Copia non riuscita'; }
		setTimeout(() => { btn.textContent = label; }, 2000);
	}));

	// Validazione accessibile dei form.
	$$('form[data-validate]').forEach((form) => form.addEventListener('submit', (e) => {
		$$('.pde-field__error', form).forEach((el) => el.remove());
		$$('[aria-invalid]', form).forEach((el) => el.removeAttribute('aria-invalid'));
		const invalid = $$('input, select, textarea', form).filter((el) => !el.checkValidity());
		if (!invalid.length) return;
		e.preventDefault();
		invalid.forEach((el) => {
			el.setAttribute('aria-invalid', 'true');
			const msg = document.createElement('span');
			msg.className = 'pde-field__error';
			msg.id = `${el.id || el.name}-err`;
			msg.textContent = el.type === 'checkbox' ? 'Questo consenso è obbligatorio.' : el.type === 'email' && el.value ? 'Inserisci un indirizzo email valido.' : 'Campo obbligatorio.';
			el.setAttribute('aria-describedby', msg.id);
			(el.closest('.pde-field, .pde-nl__privacy, .pde-nl__row') || el.parentNode).appendChild(msg);
		});
		invalid[0].focus();
	}));

	// Porta il focus sulle notifiche dei form dopo il redirect.
	document.querySelector('.pde-notice')?.focus();
})();
