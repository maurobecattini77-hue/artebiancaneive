// Sito Arte Bianca di Neive - comportamenti comuni a tutte le pagine.

// I video partono da soli, muti e in ciclo. Si caricano solo quando stanno per entrare
// nello schermo (anche la copertina, data-poster) e si fermano quando escono, cosi' la pagina resta leggera anche col telefono.
// Se un video ha anche la versione leggera (data-src-telefono), sui telefoni parte quella:
// si guarda il lato corto dello schermo, cosi' vale anche col telefono girato in orizzontale.
(function () {
  var video = document.querySelectorAll('video[data-src]');
  var telefono = Math.min(screen.width, screen.height) < 600;
  function avvia(v) {
    if (!v.getAttribute('poster') && v.getAttribute('data-poster')) v.poster = v.getAttribute('data-poster');
    if (!v.getAttribute('src')) v.src = (telefono && v.getAttribute('data-src-telefono')) || v.getAttribute('data-src');
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  }
  if (!('IntersectionObserver' in window)) { video.forEach(avvia); return; }
  var osserva = new IntersectionObserver(function (voci) {
    voci.forEach(function (voce) {
      if (voce.isIntersecting) avvia(voce.target);
      else if (voce.target.getAttribute('src')) voce.target.pause();
    });
  }, { rootMargin: '300px 0px' });
  video.forEach(function (v) { osserva.observe(v); });
})();

// I video di YouTube (la presentazione nella Home e le testimonianze degli ex allievi) partono
// al loro posto, dentro la pagina: dal lettore si ingrandiscono a tutto schermo o si aprono su
// YouTube. Uno alla volta: se ne parte un altro, quello di prima torna alla sua copertina.
// Aperto come file dal computer YouTube non lascia incorporare i video, quindi li apre su
// YouTube in una scheda nuova; sul sito online si vedono nella pagina.
(function () {
  var inCorso = null;
  function chiudi(box) {
    box.innerHTML = box.copertina;
    box.classList.remove('in-onda');
    box.setAttribute('role', 'button');
    box.setAttribute('tabindex', '0');
  }
  function apri(box) {
    var id = box.getAttribute('data-id');
    if (location.protocol === 'file:') { window.open('https://www.youtube.com/watch?v=' + id, '_blank', 'noopener'); return; }
    if (box.classList.contains('in-onda')) return;
    if (inCorso && inCorso !== box) chiudi(inCorso);
    box.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&playsinline=1" title="' + (box.getAttribute('aria-label') || 'Video') + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>';
    box.classList.add('in-onda');
    box.removeAttribute('role');
    box.removeAttribute('tabindex');
    inCorso = box;
  }
  document.querySelectorAll('[data-id]').forEach(function (box) {
    box.copertina = box.innerHTML;
    box.addEventListener('click', function () { apri(box); });
    box.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); apri(box); } });
  });
})();

// Comparsa morbida: titoli, righe, testi e foto che stanno sotto il primo schermo salgono di poco
// e si accendono quando entrano nello schermo; se ne arrivano diversi insieme, uno dopo l'altro.
// Quello che si vede appena aperta la pagina resta fermo. Chi ha chiesto di ridurre le animazioni vede tutto fermo.
(function () {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var SCELTI = '.t-sez,.t-sotto,.t-evento,.riga,.testo,p.w,p.m,.p42-valori,.pannello,.p42-alt,.tabella-scorre,.video-yt,' +
               '.riquadro,img.m,.macchia,.borghi,.fascia-media,.divisore,.scheda-video,.contatti h2,.contatti .righe,.torna';
  var arriva = new IntersectionObserver(function (voci) {
    var n = 0;
    voci.forEach(function (v) {
      if (!v.isIntersecting) return;
      v.target.style.setProperty('--ritardo', Math.min(n++ * 0.09, 0.45) + 's');
      v.target.classList.add('visto');
      arriva.unobserve(v.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll(SCELTI).forEach(function (el) {
    if (el.parentElement.closest(SCELTI)) return;              // si muove gia' il blocco che lo contiene
    if (el.getBoundingClientRect().top < innerHeight) return;   // gia' in vista all'apertura
    el.classList.add('rivela');
    if (el.classList.contains('fascia-media')) el.classList.add('piena');   // foto a tutta larghezza: solo dissolvenza
    arriva.observe(el);
  });
})();
