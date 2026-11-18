// Arte Bianca di Neive - versione Opus (17/11/2026), comportamenti comuni a tutte le pagine.
// Lo scorrimento resta quello del browser: niente rotella rubata, niente sezioni bloccate.
// I testi si leggono sempre subito; si muovono solo foto, video e linee.

(function () {
  var fermo = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conIO = 'IntersectionObserver' in window;
  function tutti(sel, dove) { return Array.prototype.slice.call((dove || document).querySelectorAll(sel)); }

  // ---------------------------------------------------------------- testata: trasparente sull'apertura, piena scendendo
  var testa = document.querySelector('.testa');
  function aggiornaTesta() { if (testa) testa.classList.toggle('solida', window.scrollY > 24); }

  // ---------------------------------------------------------------- menu a tutto schermo (telefono e tablet)
  var menu = document.querySelector('.menu-pieno');
  var apri = document.querySelector('.apri-menu');
  if (menu && apri) {
    var chiudiM = menu.querySelector('.chiudi');
    function mostra(si) {
      menu.classList.toggle('aperto', si);
      apri.setAttribute('aria-expanded', si ? 'true' : 'false');
      document.documentElement.style.overflow = si ? 'hidden' : '';
      if (si) setTimeout(function () { chiudiM.focus(); }, 50); else apri.focus();
    }
    apri.addEventListener('click', function () { mostra(true); });
    chiudiM.addEventListener('click', function () { mostra(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('aperto')) mostra(false); });
    tutti('a', menu).forEach(function (a) { a.addEventListener('click', function () { if (a.hash && a.pathname === location.pathname) mostra(false); }); });
  }

  // ---------------------------------------------------------------- video muti in ciclo, caricati solo quando si avvicinano
  // Sui telefoni (lato corto sotto i 600 px) parte la versione leggera, se c'e'.
  var telefono = Math.min(screen.width, screen.height) < 600;
  function preparaVideo(v) {
    if (!v.getAttribute('poster') && v.getAttribute('data-poster')) v.poster = v.getAttribute('data-poster');
    if (fermo) return;
    if (!v.getAttribute('src')) v.src = (telefono && v.getAttribute('data-src-telefono')) || v.getAttribute('data-src');
    var p = v.play(); if (p && p.catch) p.catch(function () {});
  }
  var video = tutti('video[data-src]');
  if (!conIO) video.forEach(preparaVideo);
  else {
    var osservaV = new IntersectionObserver(function (voci) {
      voci.forEach(function (voce) {
        if (voce.isIntersecting) preparaVideo(voce.target);
        else if (voce.target.getAttribute('src')) voce.target.pause();
      });
    }, { rootMargin: '400px 0px' });
    video.forEach(function (v) { osservaV.observe(v); });
  }

  // ---------------------------------------------------------------- YouTube: parte al suo posto, uno alla volta
  // Aperto come file dal computer YouTube non si lascia incorporare: allora si apre su YouTube in una scheda nuova.
  var inCorso = null;
  function chiudiYT(box) { box.innerHTML = box._copertina; box.classList.remove('in-onda'); box.setAttribute('role', 'button'); box.setAttribute('tabindex', '0'); }
  function apriYT(box) {
    var id = box.getAttribute('data-id');
    if (location.protocol === 'file:') { window.open('https://www.youtube.com/watch?v=' + id, '_blank', 'noopener'); return; }
    if (box.classList.contains('in-onda')) return;
    if (inCorso && inCorso !== box) chiudiYT(inCorso);
    box.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&playsinline=1" title="' + (box.getAttribute('aria-label') || 'Video') + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>';
    box.classList.add('in-onda'); box.removeAttribute('role'); box.removeAttribute('tabindex');
    inCorso = box;
  }
  tutti('[data-id]').forEach(function (box) {
    box._copertina = box.innerHTML;
    box.addEventListener('click', function () { apriYT(box); });
    box.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); apriYT(box); } });
  });

  // ---------------------------------------------------------------- comparsa: solo quello che sta sotto il primo schermo
  if (conIO && !fermo) {
    var arriva = new IntersectionObserver(function (voci) {
      var n = 0;
      voci.forEach(function (v) {
        if (!v.isIntersecting) return;
        v.target.style.setProperty('--ritardo', Math.min(n++ * 0.08, 0.4) + 's');
        v.target.classList.add('visto');
        arriva.unobserve(v.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.01 });
    tutti('[data-r]').forEach(function (el) {
      if (el.getBoundingClientRect().top < innerHeight * 0.92) return;
      el.classList.add(el.getAttribute('data-r') === 'foto' ? 'rivela-foto' : 'rivela');
      arriva.observe(el);
    });
  }

  // ---------------------------------------------------------------- linee che si disegnano (bivi), una volta sola
  tutti('.bivio').forEach(function (b) {
    tutti('.disegna', b).forEach(function (p) { try { p.style.setProperty('--l', Math.ceil(p.getTotalLength()) + 1); } catch (e) {} });
  });
  if (conIO) {
    var osservaB = new IntersectionObserver(function (voci) {
      voci.forEach(function (v) { if (v.isIntersecting) { v.target.classList.add('visto'); osservaB.unobserve(v.target); } });
    }, { threshold: 0.35 });
    tutti('.bivio').forEach(function (b) { osservaB.observe(b); });
  } else tutti('.bivio').forEach(function (b) { b.classList.add('visto'); });

  // ---------------------------------------------------------------- parallasse leggera e apertura che si allarga
  var paral = tutti('.cornice[data-parallasse], .fascia');
  var visibili = new Set();
  if (conIO) {
    var osservaP = new IntersectionObserver(function (voci) {
      voci.forEach(function (v) { if (v.isIntersecting) visibili.add(v.target); else visibili.delete(v.target); });
      richiedi();
    }, { rootMargin: '100px 0px' });
    paral.forEach(function (el) { osservaP.observe(el); });
  }
  var eroeMedia = document.querySelector('.eroe-media');
  var margineEroe = 0, partenzaEroe = 0;
  function misuraEroe() {
    if (!eroeMedia) return;
    var c = document.querySelector('.eroe .cont');
    margineEroe = c ? Math.max(0, (document.documentElement.clientWidth - c.getBoundingClientRect().width) / 2) : 24;
    partenzaEroe = eroeMedia.getBoundingClientRect().top + window.scrollY;
  }
  var inAttesa = false;
  function richiedi() { if (!inAttesa) { inAttesa = true; requestAnimationFrame(disegna); } }
  function disegna() {
    inAttesa = false;
    aggiornaTesta();
    if (fermo) return;
    var vh = window.innerHeight;
    visibili.forEach(function (el) {
      var r = el.getBoundingClientRect();
      var p = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
      p = Math.max(-1, Math.min(1, p));
      var quanto = el.classList.contains('fascia') ? 0.075 : 0.055;
      el.style.setProperty('--py', (-p * r.height * quanto).toFixed(1) + 'px');
    });
    if (eroeMedia) {
      var t = Math.max(0, Math.min(1, window.scrollY / Math.max(1, Math.min(partenzaEroe, vh * 0.75))));
      var e = 1 - Math.pow(1 - t, 2);
      eroeMedia.style.setProperty('--lato', (margineEroe * (1 - e)).toFixed(1) + 'px');
      eroeMedia.style.setProperty('--raggio', (22 * (1 - e)).toFixed(1) + 'px');
    }
  }
  misuraEroe();
  window.addEventListener('scroll', richiedi, { passive: true });
  window.addEventListener('resize', function () { misuraEroe(); richiedi(); });
  richiedi();

  // ---------------------------------------------------------------- gallerie a scorrimento: frecce e contatore (col dito o col touchpad scorrono anche da sole)
  tutti('.galleria').forEach(function (g) {
    var bin = g.querySelector('.binario');
    var voci = tutti('.voce', bin);
    var prec = g.querySelector('.prec'), succ = g.querySelector('.succ'), conta = g.querySelector('.conta');
    function attuale() {
      var sx = bin.getBoundingClientRect().left + parseFloat(getComputedStyle(bin).paddingLeft);
      var migliore = 0, dist = 1e9;
      voci.forEach(function (v, i) { var d = Math.abs(v.getBoundingClientRect().left - sx); if (d < dist) { dist = d; migliore = i; } });
      return migliore;
    }
    function aggiorna() {
      var i = attuale();
      var fine = bin.scrollLeft + bin.clientWidth >= bin.scrollWidth - 4;
      if (conta) conta.textContent = (fine ? voci.length : i + 1) + ' / ' + voci.length;
      if (prec) prec.disabled = bin.scrollLeft <= 4;
      if (succ) succ.disabled = fine;
    }
    function vai(d) {
      var i = Math.max(0, Math.min(voci.length - 1, attuale() + d));
      var sx = bin.getBoundingClientRect().left + parseFloat(getComputedStyle(bin).paddingLeft);
      bin.scrollBy({ left: voci[i].getBoundingClientRect().left - sx, behavior: fermo ? 'auto' : 'smooth' });
    }
    if (prec) prec.addEventListener('click', function () { vai(-1); });
    if (succ) succ.addEventListener('click', function () { vai(1); });
    bin.addEventListener('scroll', function () { requestAnimationFrame(aggiorna); }, { passive: true });
    bin.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); vai(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); vai(-1); } });
    window.addEventListener('resize', aggiorna);
    aggiorna();
  });

  // ---------------------------------------------------------------- elenco con foto (concorsi, sbocchi)
  tutti('.elenco-foto').forEach(function (el) {
    var tasti = tutti('li button', el), foto = tutti('.vetrina img', el);
    function scegli(i) {
      tasti.forEach(function (t, k) { t.classList.toggle('scelto', k === i); t.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
      foto.forEach(function (f, k) { f.classList.toggle('su', k === i); });
    }
    tasti.forEach(function (t, i) {
      t.addEventListener('mouseenter', function () { scegli(i); });
      t.addEventListener('focus', function () { scegli(i); });
      t.addEventListener('click', function () { scegli(i); });
    });
    scegli(0);
  });

  // ---------------------------------------------------------------- foto che si alternano dentro le schede degli eventi
  tutti('.galleria-auto').forEach(function (g) {
    var foto = tutti('img', g);
    var punti = g.parentElement.querySelector('.punti');
    var i = 0, timer = null, inVista = false;
    if (punti) foto.forEach(function (f, k) {
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Foto ' + (k + 1) + ' di ' + foto.length);
      b.addEventListener('click', function () { mostraF(k); riparti(); }); punti.appendChild(b);
    });
    function mostraF(k) {
      i = k;
      foto.forEach(function (f, j) { f.classList.toggle('su', j === k); });
      if (punti) tutti('button', punti).forEach(function (b, j) { b.classList.toggle('su', j === k); });
      var dopo = foto[(k + 1) % foto.length]; if (dopo && dopo.loading === 'lazy') dopo.loading = 'eager';
    }
    function riparti() { clearInterval(timer); if (inVista && !fermo && foto.length > 1) timer = setInterval(function () { mostraF((i + 1) % foto.length); }, 3600); }
    mostraF(0);
    if (conIO) new IntersectionObserver(function (v) { inVista = v[0].isIntersecting; riparti(); }, { threshold: 0.3 }).observe(g);
  });

  // ---------------------------------------------------------------- sbocchi: foto che si alternano da sole, col nome sotto
  tutti('.sfilata').forEach(function (s) {
    var foto = tutti('.sfilata-foto img', s), nome = s.querySelector('.sfilata-nome'), barra = s.querySelector('.sfilata-barra i');
    var i = 0, timer = null, durata = 3800;
    function mostraS(k) {
      i = k;
      foto.forEach(function (f, j) { f.classList.toggle('su', j === k); });
      var dopo = foto[(k + 1) % foto.length]; if (dopo && dopo.loading === 'lazy') dopo.loading = 'eager';
      nome.style.opacity = 0;
      setTimeout(function () { nome.textContent = foto[k].getAttribute('data-nome'); nome.style.opacity = 1; }, 300);
      if (barra) { barra.classList.remove('va'); void barra.offsetWidth; barra.style.setProperty('--durata', durata + 'ms'); barra.classList.add('va'); }
    }
    function riparti(si) { clearInterval(timer); if (si && !fermo) timer = setInterval(function () { mostraS((i + 1) % foto.length); }, durata); }
    foto[0].classList.add('su'); nome.textContent = foto[0].getAttribute('data-nome');
    if (conIO) new IntersectionObserver(function (v) { if (v[0].isIntersecting) { mostraS(i); riparti(true); } else riparti(false); }, { threshold: 0.35 }).observe(s);
  });

  // ---------------------------------------------------------------- schede che si impilano: ognuna un filo piu' in basso
  tutti('.pila .scheda').forEach(function (s, k) { s.style.setProperty('--k', k); });

  // ---------------------------------------------------------------- piano di studi: 5 anni / 4+2
  var scambio = document.querySelector('.scambio');
  if (scambio) {
    var tastiS = tutti('button', scambio), palco = document.querySelector('.piani'), piani = tutti('.piano', palco);
    var scelto = 0, attesa = null;
    piani.forEach(function (p) { tutti('tbody tr', p).forEach(function (r, i) { r.style.setProperty('--i', i + 1); }); });
    function chiudiS() { clearTimeout(attesa); palco.classList.remove('in-cambio'); palco.style.height = ''; piani.forEach(function (p, i) { p.classList.remove('esce', 'entra'); p.hidden = i !== scelto; }); }
    function mostraS(n) {
      if (n === scelto) return;
      chiudiS();
      var prima = piani[scelto], dopo = piani[n], da = palco.offsetHeight;
      scelto = n;
      scambio.setAttribute('data-scelto', n);
      tastiS.forEach(function (t, i) { t.setAttribute('aria-pressed', i === n ? 'true' : 'false'); });
      if (fermo) { chiudiS(); return; }
      prima.hidden = true; dopo.hidden = false;
      var a = palco.offsetHeight;
      prima.hidden = false; prima.classList.add('esce'); dopo.classList.add('entra');
      palco.style.height = da + 'px'; palco.classList.add('in-cambio');
      void palco.offsetHeight;
      palco.style.height = a + 'px';
      attesa = setTimeout(chiudiS, 800);
    }
    tastiS.forEach(function (t, i) { t.addEventListener('click', function () { mostraS(i); }); });
  }

  // ---------------------------------------------------------------- mappa larga sul telefono: si parte con Neive al centro
  tutti('.mappa-scorre').forEach(function (s) {
    if (s.scrollWidth > s.clientWidth + 4) s.scrollLeft = s.scrollWidth * 0.46 - s.clientWidth / 2;
  });

  // ---------------------------------------------------------------- trasporti: passando su una linea, si accende sulla mappa
  var mappe = tutti('.mappa');
  var lineeT = tutti('.linea[data-linea]');
  var fissa = null;
  function accendi(nome) {
    mappe.forEach(function (m) {
      m.classList.toggle('scelta', !!nome);
      tutti('.tratta', m).forEach(function (t) { t.classList.toggle('accesa', !!nome && t.getAttribute('data-linea') === nome); });
    });
    lineeT.forEach(function (l) { l.classList.toggle('accesa', !!nome && l.getAttribute('data-linea') === nome); });
  }
  tutti('.mappa .tratta').forEach(function (pth) {
    var nome = pth.getAttribute('data-linea');
    pth.addEventListener('mouseenter', function () { if (!fissa) accendi(nome); });
    pth.addEventListener('mouseleave', function () { if (!fissa) accendi(null); });
    pth.addEventListener('click', function () { fissa = fissa === nome ? null : nome; accendi(fissa); });
  });
  lineeT.forEach(function (l) {
    var nome = l.getAttribute('data-linea');
    l.addEventListener('mouseenter', function () { if (!fissa) accendi(nome); });
    l.addEventListener('mouseleave', function () { if (!fissa) accendi(null); });
    l.addEventListener('focus', function () { accendi(nome); });
    l.addEventListener('blur', function () { if (!fissa) accendi(null); });
    l.addEventListener('click', function () { fissa = fissa === nome ? null : nome; accendi(fissa); });
  });
})();

// Contatore delle visite (15/10/2026), identico al sito online: invisibile, conta solo su artebiancaneive.org.
// In questa versione locale non parte mai. Per non contare un proprio browser: ?noconta=1 (?noconta=0 annulla).
(function () {
  if (!/^(www\.)?artebiancaneive\.org$/.test(location.hostname)) return;
  var DOVE = 'https://zwuutlrafdmfqexbnohc.supabase.co/functions/v1/sito-conta';
  var ls = null, ss = null;
  try { ls = window.localStorage; ss = window.sessionStorage; } catch (e) {}
  try {
    if (/[?&]noconta=1/.test(location.search)) ls.setItem('abn_noconta', '1');
    if (/[?&]noconta=0/.test(location.search)) ls.removeItem('abn_noconta');
    if (ls && ls.getItem('abn_noconta')) return;
  } catch (e) {}
  if (navigator.webdriver) return;
  function caso() { return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2); }
  var chi = null, nuovo = false, giro = null;
  try { chi = ls.getItem('abn_v'); if (!chi) { chi = caso(); ls.setItem('abn_v', chi); nuovo = true; } } catch (e) {}
  try { giro = ss.getItem('abn_s'); if (!giro) { giro = caso(); ss.setItem('abn_s', giro); } } catch (e) {}
  var vista = caso();
  function manda(o) {
    o.vista = vista; o.visitatore = chi; o.sessione = giro; o.tocco = navigator.maxTouchPoints || 0;
    var testo = JSON.stringify(o);
    try { if (navigator.sendBeacon && navigator.sendBeacon(DOVE, new Blob([testo], { type: 'text/plain' }))) return; } catch (e) {}
    try { fetch(DOVE, { method: 'POST', body: testo, keepalive: true, mode: 'no-cors' }); } catch (e) {}
  }
  var q = new URLSearchParams(location.search);
  manda({ tipo: 'vista', pagina: location.pathname, provenienza: document.referrer || '', nuovo: nuovo,
          utm_source: q.get('utm_source'), utm_medium: q.get('utm_medium'), utm_campaign: q.get('utm_campaign'),
          schermo: screen.width + 'x' + screen.height, lingua: navigator.language || '' });
  setInterval(function () { if (document.visibilityState === 'visible') manda({ tipo: 'battito' }); }, 30000);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') manda({ tipo: 'battito' }); });
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target : null;
    if (!t) return;
    var video = t.closest('[data-id]');
    if (video && !video.classList.contains('in-onda')) { manda({ tipo: 'evento', pagina: location.pathname, evento: 'video: ' + (video.getAttribute('aria-label') || video.getAttribute('data-id')) }); return; }
    var a = t.closest('a[href]');
    if (!a) return;
    var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
    var nome;
    if (/forms\.gle|docs\.google\.com\/forms/.test(u.href)) nome = 'prenota';
    else if (u.protocol === 'mailto:') nome = 'mail';
    else if (u.protocol === 'tel:') nome = 'telefono';
    else if (u.hostname && u.hostname !== location.hostname) nome = 'link: ' + u.hostname.replace(/^www\./, '');
    if (nome) manda({ tipo: 'evento', pagina: location.pathname, evento: nome });
  }, true);
})();
