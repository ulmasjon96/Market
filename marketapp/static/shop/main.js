// =========================================================
// main.js — do'kon sahifalari uchun
// =========================================================
document.documentElement.classList.add('js');

(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // 1250000 -> "1 250 000"
  const fmt = (n) => Math.round(Number(n)).toLocaleString('ru-RU');

  // ---------- Toast xabar ----------
  function toast(text, type = 'success') {
    let box = $('#toasts');
    if (!box) {
      box = document.createElement('div');
      box.id = 'toasts';
      document.body.appendChild(box);
    }
    const t = document.createElement('div');
    t.className = `toast toast--${type}`;
    t.textContent = text;
    box.appendChild(t);
    setTimeout(() => t.classList.add('hide'), 2500);
    setTimeout(() => t.remove(), 3000);
  }

  // ---------- AJAX forma yuborish ----------
  async function send(form) {
    const res = await fetch(form.action, {
      method: 'POST',
      body: new FormData(form),          // csrf token ham shu ichida
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });
    const data = await res.json().catch(() => ({ ok: false }));
    if (!res.ok || !data.ok) throw new Error(data.error || 'Xatolik yuz berdi');
    return data;
  }

  function updateCart(data) {
    const count = $('#cart-count');
    if (count) count.textContent = data.count;
    const total = $('#cart-total');
    if (total) total.textContent = fmt(data.total);
  }

  // ---------- Mobil menyu ----------
  const burger = $('#burger');
  const nav = $('#nav');
  if (burger && nav) {
    const setMenuOpen = (isOpen) => {
      nav.classList.toggle('open', isOpen);
      burger.setAttribute('aria-expanded', String(isOpen));
      burger.setAttribute('aria-label', isOpen ? 'Menyuni yopish' : 'Menyuni ochish');
    };

    burger.addEventListener('click', () => setMenuOpen(burger.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) setMenuOpen(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && nav.classList.contains('open')) {
        setMenuOpen(false);
        burger.focus();
      }
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 960) setMenuOpen(false);
    });
  }

  // ---------- Mobil katalog filtrlari ----------
  const filterDisclosure = $('.catalog__filter-disclosure');
  if (filterDisclosure) {
    const compactFilters = window.matchMedia('(max-width: 760px)');
    if (compactFilters.matches) filterDisclosure.open = false;
    compactFilters.addEventListener('change', (event) => {
      if (!event.matches) filterDisclosure.open = true;
    });
  }

  // ---------- Live search suggestions ----------
  const searchForm = $('.search[data-suggestions-url]');
  if (searchForm) {
    const searchInput = $('input[name="q"]', searchForm);
    const suggestions = $('#search-suggestions', searchForm);
    let debounceTimer;
    let controller;
    let activeSuggestion = -1;

    const closeSuggestions = () => {
      suggestions.hidden = true;
      suggestions.replaceChildren();
      searchInput.setAttribute('aria-expanded', 'false');
      searchInput.removeAttribute('aria-activedescendant');
      activeSuggestion = -1;
    };

    const chooseSuggestion = (index) => {
      const links = $$('a[role="option"]', suggestions);
      if (!links.length) return;
      activeSuggestion = (index + links.length) % links.length;
      links.forEach((link, position) => {
        link.setAttribute('aria-selected', String(position === activeSuggestion));
        link.classList.toggle('is-active', position === activeSuggestion);
      });
      searchInput.setAttribute('aria-activedescendant', links[activeSuggestion].id);
    };

    const showSuggestions = (results) => {
      suggestions.replaceChildren();
      activeSuggestion = -1;
      if (!results.length) {
        const empty = document.createElement('p');
        empty.className = 'search-suggestions__empty';
        empty.textContent = 'Mos mahsulot topilmadi';
        suggestions.appendChild(empty);
      } else {
        results.forEach((item, index) => {
          const link = document.createElement('a');
          link.className = 'search-suggestions__item';
          link.href = item.url;
          link.id = `search-suggestion-${index}`;
          link.setAttribute('role', 'option');
          link.setAttribute('aria-selected', 'false');

          if (item.image) {
            const image = document.createElement('img');
            image.src = item.image;
            image.alt = '';
            image.loading = 'lazy';
            link.appendChild(image);
          }
          const copy = document.createElement('span');
          copy.className = 'search-suggestions__copy';
          const name = document.createElement('strong');
          name.textContent = item.name;
          const category = document.createElement('small');
          category.textContent = item.category;
          copy.append(name, category);
          const price = document.createElement('b');
          price.textContent = `${fmt(item.price)} so'm`;
          link.append(copy, price);
          suggestions.appendChild(link);
        });
      }
      suggestions.hidden = false;
      searchInput.setAttribute('aria-expanded', 'true');
    };

    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      if (controller) controller.abort();
      const query = searchInput.value.trim();
      if (query.length < 2) return closeSuggestions();
      debounceTimer = setTimeout(async () => {
        controller = new AbortController();
        try {
          const url = new URL(searchForm.dataset.suggestionsUrl, location.origin);
          url.searchParams.set('q', query);
          const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
          if (!response.ok) return closeSuggestions();
          const data = await response.json();
          if (searchInput.value.trim() === query) showSuggestions(data.results || []);
        } catch (error) {
          if (error.name !== 'AbortError') closeSuggestions();
        }
      }, 180);
    });

    searchInput.addEventListener('keydown', (event) => {
      if (suggestions.hidden) return;
      const total = $$('a[role="option"]', suggestions).length;
      if (event.key === 'ArrowDown' && total) {
        event.preventDefault();
        chooseSuggestion(activeSuggestion + 1);
      } else if (event.key === 'ArrowUp' && total) {
        event.preventDefault();
        chooseSuggestion(activeSuggestion < 0 ? total - 1 : activeSuggestion - 1);
      } else if (event.key === 'Enter' && activeSuggestion >= 0) {
        event.preventDefault();
        $$('a[role="option"]', suggestions)[activeSuggestion].click();
      } else if (event.key === 'Escape') {
        closeSuggestions();
      }
    });
    document.addEventListener('click', (event) => {
      if (!searchForm.contains(event.target)) closeSuggestions();
    });
    searchInput.addEventListener('focus', () => {
      if (searchInput.value.trim().length >= 2 && suggestions.childElementCount) {
        suggestions.hidden = false;
        searchInput.setAttribute('aria-expanded', 'true');
      }
    });
  }

  // ---------- Savatga qo'shish ----------
  $$('.add-to-cart').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = $('button', form);
      btn.disabled = true;
      try {
        const data = await send(form);
        updateCart(data);
        toast("Savatga qo'shildi ✓");
      } catch (err) {
        toast(err.message, 'error');
      } finally {
        btn.disabled = false;
      }
    });
  });

  // ---------- Savatda miqdorni o'zgartirish ----------
  $$('.qty-form').forEach((form) => {
    const input = $('.qty-input', form);
    const row = form.closest('tr');
    let timer;

    const submit = async () => {
      let qty = parseInt(input.value, 10) || 1;
      const max = parseInt(input.max, 10) || qty;
      qty = Math.min(Math.max(qty, 1), max);
      input.value = qty;
      try {
        const data = await send(form);
        updateCart(data);
        const cell = $('.item-total', row);
        if (cell && row.dataset.price) cell.textContent = fmt(row.dataset.price * qty);
      } catch (err) {
        toast(err.message, 'error');
      }
    };

    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(submit, 400);
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      submit();
    });
  });

  // ---------- Savatdan o'chirish ----------
  $$('.remove-form').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const data = await send(form);
        updateCart(data);
        form.closest('tr').remove();
        if (data.count === 0) location.reload();
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  });

  // ---------- Rasm galereyasi ----------
  const mainImg = $('#main-img');
  $$('.gallery__thumb').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      if (mainImg) mainImg.src = thumb.dataset.full;
      $$('.gallery__thumb').forEach((t) => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });

  // ---------- Django xabarlarini 4 soniyadan keyin yashirish ----------
  $$('.messages .alert').forEach((a) => {
    setTimeout(() => {
      a.style.opacity = '0';
      setTimeout(() => a.remove(), 400);
    }, 4000);
  });

  // ---------- Telefon maydoni: +998 bilan boshlansin ----------
  $$('input[name="phone"]').forEach((inp) => {
    inp.addEventListener('focus', () => {
      if (!inp.value) inp.value = '+998';
    });
    inp.addEventListener('input', () => {
      inp.value = '+' + inp.value.replace(/\D/g, '').slice(0, 12);
    });
  });
})();
