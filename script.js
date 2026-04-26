/* ============================================
   ALIAN AUTOMOBILHANDEL — Scripts
   ============================================ */

/* ============================================
   CMS DATA LOADER
   Lädt Inhalte aus data/ JSON-Dateien und
   injiziert sie in die entsprechenden Elemente.
   ============================================ */

async function loadCMSData() {
  try {
    const [settingsRes, fahrzeugeRes] = await Promise.all([
      fetch('/data/einstellungen.json'),
      fetch('/data/fahrzeuge.json'),
    ]);

    if (settingsRes.ok) {
      const s = await settingsRes.json();
      applySettings(s);
    }

    if (fahrzeugeRes.ok) {
      const f = await fahrzeugeRes.json();
      renderFahrzeuge(f.fahrzeuge || []);
    }
  } catch (e) {
    console.warn('CMS-Daten konnten nicht geladen werden:', e);
  }
}

function applySettings(s) {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el && val !== undefined) el.textContent = val;
  };
  const setHTML = (id, val) => {
    const el = document.getElementById(id);
    if (el && val !== undefined) el.innerHTML = val;
  };

  // Hero
  set('cms-hero-label', s.hero?.label);
  setHTML('cms-hero-title', `${s.hero?.title_1 || ''}<br>${s.hero?.title_2 || ''}`);
  set('cms-hero-subtitle', s.hero?.subtitle);

  // Über uns
  setHTML('cms-ueber-heading', `${s.ueber_uns?.heading_1 || ''}<br>${s.ueber_uns?.heading_2 || ''}`);
  set('cms-ueber-text1', s.ueber_uns?.text_1);
  set('cms-ueber-text2', s.ueber_uns?.text_2);

  // Bilder
  if (s.bilder) {
    Object.entries(s.bilder).forEach(([key, val]) => {
      if (val) {
        document.querySelectorAll(`[data-cms-img="${key}"]`).forEach(img => {
          img.src = val;
        });
      }
    });
  }

  // Kontaktdaten — alle Vorkommen im Dokument aktualisieren
  const k = s.kontakt;
  if (!k) return;

  document.querySelectorAll('a[href^="tel:"]').forEach(a => {
    const raw = k.phone_main.replace(/\s|\//g, '');
    if (a.href.includes('98519') || a.href.includes('851966')) {
      a.href = `tel:+49${raw.replace(/^0/, '')}`;
    }
    const rawMobile = k.phone_mobile.replace(/\s|\//g, '');
    if (a.href.includes('17162') || a.href.includes('171626')) {
      a.href = `tel:+49${rawMobile.replace(/^0/, '')}`;
    }
  });

  document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
    a.href = `mailto:${k.email}`;
    if (a.textContent && a.textContent.includes('@')) a.textContent = k.email;
  });

  // Öffnungszeiten
  const hoursStr = `Mo–Fr ${k.hours_weekday_open}–${k.hours_weekday_close} · Sa ${k.hours_saturday_open}–${k.hours_saturday_close}`;

  document.querySelectorAll('.hours-table').forEach(el => {
    el.innerHTML =
      `<span>Mo–Fr</span><span>${k.hours_weekday_open}–${k.hours_weekday_close}</span>` +
      `<span>Sa</span><span>${k.hours_saturday_open}–${k.hours_saturday_close}</span>`;
  });
}

function renderFahrzeuge(liste) {
  const track = document.getElementById('carTrack');
  if (!track) return;

  track.innerHTML = liste.map(car => {
    const badge = car.badge
      ? `<span class="car-badge${car.badge_new ? ' car-badge-new' : ''}">${car.badge}</span>`
      : '';
    const km = car.km.toLocaleString('de-DE');
    const price = car.price.toLocaleString('de-DE');

    return `
      <div class="car-card" data-brand="${car.brand}">
        <div class="car-card-img">
          <img src="${car.image}" alt="${car.alt}" loading="lazy">
          ${badge}
        </div>
        <div class="car-card-body">
          <h3>${car.title}</h3>
          <p class="car-details">${car.year} · ${km} km · ${car.ps} PS · ${car.fuel}</p>
          <div class="car-price">${price} €</div>
        </div>
      </div>`;
  }).join('');

  // Filter-Counts aktualisieren
  const brands = ['BMW', 'Mercedes', 'VW', 'Audi', 'Toyota', 'Opel', 'Andere'];
  const countAll = document.getElementById('count-all');
  if (countAll) countAll.textContent = liste.length;

  brands.forEach(brand => {
    const el = document.getElementById(`count-${brand}`);
    if (el) el.textContent = liste.filter(c => c.brand === brand).length;
  });

  // Subtitle aktualisieren
  const subtitle = document.getElementById('cms-fahrzeuge-subtitle');
  if (subtitle) {
    subtitle.textContent = `${liste.length} geprüfte Fahrzeuge — von Kleinwagen bis SUV. Alle Marken, faire Preise.`;
  }

  // Carousel neu initialisieren nach dem Rendern
  buildDots();
  updateDots();

  // Filter-Buttons neu verdrahten
  initFilter();
}

// Filter-Init als Funktion (wird nach Render erneut aufgerufen)
function initFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const allCards = document.querySelectorAll('.car-card');

  filterBtns.forEach(btn => {
    btn.replaceWith(btn.cloneNode(true)); // Event-Listener Reset
  });

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      document.querySelectorAll('.car-card').forEach(card => {
        card.classList.toggle('hidden', filter !== 'all' && card.dataset.brand !== filter);
      });
      if (carViewport) carViewport.scrollTo({ left: 0, behavior: 'smooth' });
      setTimeout(() => { buildDots(); updateDots(); }, 100);
    });
  });
}

loadCMSData();

/* --- Navigation Scroll --- */
const nav = document.getElementById('nav');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    nav.classList.toggle('scrolled', scrollY > 60);
    lastScroll = scrollY;
}, { passive: true });

/* --- Mobile Menu --- */
const navToggle = document.getElementById('navToggle');
const mobileMenu = document.getElementById('mobileMenu');
const mobileLinks = document.querySelectorAll('.mobile-menu-link');

navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    mobileMenu.classList.toggle('active');
    document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
    // Force scrolled state when menu is open
    if (mobileMenu.classList.contains('active')) {
        nav.classList.add('scrolled');
    } else if (window.scrollY <= 60) {
        nav.classList.remove('scrolled');
    }
});

mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
        if (window.scrollY <= 60) nav.classList.remove('scrolled');
    });
});

/* --- Smooth scroll for anchor links --- */
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
            e.preventDefault();
            const offset = 80;
            const top = target.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    });
});


/* ============================================
   Car Carousel
   ============================================ */
const carViewport = document.querySelector('.car-viewport');
const carTrack = document.getElementById('carTrack');
const carPrev = document.querySelector('.car-prev');
const carNext = document.querySelector('.car-next');
const carDotsWrap = document.getElementById('carDots');

function getVisibleCards() {
    if (!carTrack) return [];
    return Array.from(carTrack.querySelectorAll('.car-card:not(.hidden)'));
}

function getCardsPerView() {
    const vw = window.innerWidth;
    if (vw <= 480) return 1;
    if (vw <= 768) return 2;
    if (vw <= 1200) return 3;
    return 4;
}

function getActiveCardIndex() {
    const cards = getVisibleCards();
    if (!cards.length || !carViewport) return 0;
    const vpLeft = carViewport.scrollLeft;
    let closest = 0;
    let minDist = Infinity;
    cards.forEach((card, i) => {
        const dist = Math.abs(card.offsetLeft - vpLeft - 40);
        if (dist < minDist) {
            minDist = dist;
            closest = i;
        }
    });
    return closest;
}

function scrollToCard(idx) {
    const cards = getVisibleCards();
    if (!cards[idx] || !carViewport) return;
    const targetScroll = cards[idx].offsetLeft - parseInt(getComputedStyle(carTrack).paddingLeft) || 0;
    const trackPad = carTrack.getBoundingClientRect().left - carViewport.getBoundingClientRect().left + carViewport.scrollLeft;
    carViewport.scrollTo({
        left: cards[idx].offsetLeft - (carViewport.offsetWidth - cards[idx].offsetWidth) / 2 + cards[idx].offsetWidth / 2 - carViewport.offsetWidth / 2,
        behavior: 'smooth'
    });
}

function scrollToCardSimple(idx) {
    const cards = getVisibleCards();
    if (!cards[idx] || !carViewport) return;
    const card = cards[idx];
    // Scroll so the card is near the left edge with some padding
    const padLeft = parseFloat(getComputedStyle(carTrack).paddingLeft) || 40;
    carViewport.scrollTo({
        left: card.offsetLeft - padLeft,
        behavior: 'smooth'
    });
}

// Build dots
function buildDots() {
    if (!carDotsWrap) return;
    const cards = getVisibleCards();
    const perView = getCardsPerView();
    const pages = Math.ceil(cards.length / perView);
    carDotsWrap.innerHTML = '';
    for (let i = 0; i < pages; i++) {
        const dot = document.createElement('button');
        dot.className = 'car-dot' + (i === 0 ? ' active' : '');
        dot.dataset.page = i;
        dot.addEventListener('click', () => {
            scrollToCardSimple(i * perView);
        });
        carDotsWrap.appendChild(dot);
    }
}

function updateDots() {
    if (!carDotsWrap) return;
    const idx = getActiveCardIndex();
    const perView = getCardsPerView();
    const page = Math.floor(idx / perView);
    const dots = carDotsWrap.querySelectorAll('.car-dot');
    dots.forEach((d, i) => d.classList.toggle('active', i === page));
}

if (carViewport && carTrack) {
    buildDots();

    carViewport.addEventListener('scroll', () => {
        requestAnimationFrame(updateDots);
    }, { passive: true });

    window.addEventListener('resize', () => {
        buildDots();
        updateDots();
    });
}

if (carPrev && carNext) {
    carNext.addEventListener('click', () => {
        const idx = getActiveCardIndex();
        const perView = getCardsPerView();
        const cards = getVisibleCards();
        const nextIdx = Math.min(idx + perView, cards.length - 1);
        scrollToCardSimple(nextIdx);
    });

    carPrev.addEventListener('click', () => {
        const idx = getActiveCardIndex();
        const perView = getCardsPerView();
        const prevIdx = Math.max(idx - perView, 0);
        scrollToCardSimple(prevIdx);
    });
}


// Filter wird nach dem Laden der Fahrzeuge per initFilter() initialisiert


/* ============================================
   Scroll Reveal (IntersectionObserver)
   ============================================ */
const revealElements = document.querySelectorAll('.reveal, .reveal-fog');

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        } else if (!entry.target.classList.contains('no-retrigger')) {
            entry.target.classList.remove('visible');
        }
    });
}, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
});

revealElements.forEach(el => revealObserver.observe(el));


/* ============================================
   Animated Counters
   ============================================ */
const statNumbers = document.querySelectorAll('.stat-number');

const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseInt(el.dataset.target);
            animateCounter(el, target);
            counterObserver.unobserve(el);
        }
    });
}, { threshold: 0.5 });

statNumbers.forEach(el => counterObserver.observe(el));

function animateCounter(el, target) {
    const duration = 1500;
    const start = performance.now();

    function step(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(eased * target);
        el.textContent = current;
        if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
}


/* ============================================
   Reviews Auto-Scroll (duplicate cards for infinite loop)
   ============================================ */
const reviewsTrack = document.getElementById('reviewsTrack');
if (reviewsTrack) {
    const cards = reviewsTrack.innerHTML;
    reviewsTrack.innerHTML = cards + cards;
}


/* ============================================
   Multi-step Onboarding Form
   ============================================ */
const obForm = document.getElementById('contactForm');
const obSuccess = document.getElementById('formSuccess');

if (obForm) {
    const obSteps = obForm.querySelectorAll('.form-step');
    const obIndicators = document.querySelectorAll('.form-step-indicator');
    const obLines = document.querySelectorAll('.form-step-line');
    let obCurrent = 0;

    const obState = { services: [], contactPref: '' };

    function obGoTo(index) {
        if (index < 0 || index > 2) return;
        const wrapper = document.querySelector('.form-wrapper');
        const oldH = wrapper.offsetHeight;

        obSteps.forEach(s => s.classList.remove('active'));
        obSteps[index].classList.add('active');

        obIndicators.forEach((ind, i) => {
            ind.classList.remove('active', 'completed');
            if (i < index) ind.classList.add('completed');
            if (i === index) ind.classList.add('active');
        });

        obLines.forEach((line, i) => {
            line.classList.toggle('active', i < index);
        });

        obCurrent = index;

        // Animate height
        wrapper.style.height = oldH + 'px';
        wrapper.style.overflow = 'hidden';
        wrapper.style.height = 'auto';
        const newH = wrapper.offsetHeight;
        wrapper.style.height = oldH + 'px';
        wrapper.offsetHeight;
        wrapper.style.transition = 'height 0.45s cubic-bezier(0.16, 1, 0.3, 1)';
        wrapper.style.height = newH + 'px';

        function cleanup() {
            wrapper.style.height = '';
            wrapper.style.overflow = '';
            wrapper.style.transition = '';
        }
        wrapper.addEventListener('transitionend', function onEnd(e) {
            if (e.propertyName !== 'height') return;
            wrapper.removeEventListener('transitionend', onEnd);
            cleanup();
        });
        setTimeout(cleanup, 500);
    }

    // Step indicators click
    obIndicators.forEach(ind => {
        ind.addEventListener('click', () => {
            const step = parseInt(ind.dataset.step);
            if (step < obCurrent) obGoTo(step);
        });
    });

    // Next buttons
    obForm.querySelectorAll('[data-next]').forEach(btn => {
        btn.addEventListener('click', () => {
            const next = parseInt(btn.dataset.next);
            if (obCurrent === 0 && obState.services.length === 0) { shakeEl(btn); return; }
            if (obCurrent === 1 && !obState.contactPref) { shakeEl(btn); return; }
            obGoTo(next);
        });
    });

    // Back buttons
    obForm.querySelectorAll('[data-prev]').forEach(btn => {
        btn.addEventListener('click', () => obGoTo(parseInt(btn.dataset.prev)));
    });

    // Service selection (multi)
    document.querySelectorAll('.service-select-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('selected');
            const svc = btn.dataset.service;
            if (obState.services.includes(svc)) {
                obState.services = obState.services.filter(s => s !== svc);
            } else {
                obState.services.push(svc);
            }
        });
    });

    // Contact pref (single)
    document.querySelectorAll('.contact-pref-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.contact-pref-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            obState.contactPref = btn.dataset.pref;
        });
    });

    // Submit
    obForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const honeypot = obForm.querySelector('[name="website_url"]').value;
        if (honeypot) return;

        const name = document.getElementById('obName').value.trim();
        const email = document.getElementById('obEmail').value.trim();
        if (!name || !email) { shakeEl(obForm.querySelector('[type="submit"]')); return; }

        const submitBtn = obForm.querySelector('[type="submit"]');
        submitBtn.textContent = 'Wird gesendet...';
        submitBtn.disabled = true;

        // Show success (no backend yet)
        setTimeout(() => {
            obForm.style.display = 'none';
            document.querySelector('.form-progress').style.display = 'none';
            obSuccess.classList.add('active');
        }, 800);
    });

    function shakeEl(el) {
        el.style.animation = 'none';
        el.offsetHeight;
        el.style.animation = 'shake 0.4s ease';
        setTimeout(() => { el.style.animation = ''; }, 400);
    }

    const shakeStyle = document.createElement('style');
    shakeStyle.textContent = `@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}`;
    document.head.appendChild(shakeStyle);
}
