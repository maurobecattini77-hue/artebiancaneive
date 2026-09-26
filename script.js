// Sito Arte Bianca di Neive - comportamenti comuni a tutte le pagine.

// I video partono da soli, muti e in ciclo. Si caricano solo quando stanno per entrare
// nello schermo e si fermano quando escono, cosi' la pagina resta leggera anche col telefono.
(function () {
  var video = document.querySelectorAll('video[data-src]');
  function avvia(v) {
    if (!v.getAttribute('src')) v.src = v.getAttribute('data-src');
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
