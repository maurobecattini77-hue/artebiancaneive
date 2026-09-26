// Motore degli slideshow del sito: rifa' nella pagina gli stessi effetti dei video Canva.
// Legge window.SLIDESHOW (slideshow-dati.js) e anima ogni <div class="ss" data-ss="sigla">.
// Effetti misurati sui video originali:
// - dissolvenza: la pagina nuova compare sopra la vecchia in modo lineare;
// - spinta: la pagina nuova entra da destra e spinge fuori la vecchia (curva cubica accelera-frena);
// - scritte: una barra bianca si allunga da sinistra coprendo il riquadro e poi si ritira verso destra
//   scoprendo la scritta (0,36 s, dopo 0,06 s dall'inizio della pagina); all'uscita il contrario,
//   finendo 0,05 s prima della transizione.
(function () {
  var DATI = window.SLIDESHOW || {};
  var ENTRA = 0.06, DURATA_BARRA = 0.36, ANTICIPO_USCITA = 0.05;

  function easeInOutCubic(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function easeInQuad(x) { return x * x; }
  function easeOutCubic(x) { return 1 - Math.pow(1 - x, 3); }
  function px(n) { return n + 'px'; }

  function posiziona(el, p) { // p = [alto, sinistra, larghezza, altezza]
    el.style.position = 'absolute';
    el.style.top = px(p[0]); el.style.left = px(p[1]);
    el.style.width = px(p[2]); el.style.height = px(p[3]);
  }

  function immagine(src, rit) {
    var img = document.createElement('img');
    img.src = src; img.alt = ''; img.decoding = 'async'; img.draggable = false;
    posiziona(img, rit);
    img.style.maxWidth = 'none';
    return img;
  }

  function elemento(e, testi) {
    var d = document.createElement('div');
    if (e.pos) posiziona(d, e.pos);
    if (e.tipo === 'foto') {
      d.style.overflow = 'hidden';
      if (e.rot) d.style.transform = 'rotate(' + e.rot + 'deg)';
      d.appendChild(immagine(e.foto, e.ritaglio));
    } else if (e.tipo === 'velo') {
      d.style.background = e.colore; d.style.opacity = e.opacita;
    } else if (e.tipo === 'testo') {
      d.className = 'ss-testo';
      d.style.fontSize = px(e.dim);
      d.style.color = e.colore;
      if (!e.maiuscolo) d.style.textTransform = 'none';
      // stesse righe dell'originale: il numero di righe viene dall'altezza del riquadro Canva,
      // le parole si distribuiscono come faceva Canva con l'Avenir (circa 0,68 em a lettera)
      var s = document.createElement('span');
      var righe = Math.max(1, Math.round(e.pos[3] / (e.dim * 1.2)));
      if (righe === 1) { s.textContent = e.testo; s.style.whiteSpace = 'nowrap'; }
      else {
        var cap = e.pos[2] / (e.dim * 0.68), out = [], riga = '';
        e.testo.split(/\s+/).forEach(function (w) { var prova = riga ? riga + ' ' + w : w; if (prova.length > cap && riga) { out.push(riga); riga = w; } else riga = prova; });
        if (riga) out.push(riga);
        s.textContent = out.join('\n'); s.style.whiteSpace = 'pre';
      }
      d.appendChild(s);
      var b = document.createElement('i'); b.className = 'ss-barra'; d.appendChild(b);
      testi.push({scritta: s, barra: b});
    } else if (e.tipo === 'gruppo') {
      var dentro = document.createElement('div');
      dentro.style.position = 'absolute'; dentro.style.left = '0'; dentro.style.top = '0';
      if (e.scala) { dentro.style.transform = 'scale(' + e.scala + ')'; dentro.style.transformOrigin = '0 0'; }
      (e.figli || []).forEach(function (f) { dentro.appendChild(elemento(f, testi)); });
      d.appendChild(dentro);
    }
    return d;
  }

  function cornici(c) {
    var fr = document.createDocumentFragment(), b = c.box, a = c.braccio, s = c.spessore, m = s / 2;
    [['top', 'left', b[0], b[1]], ['top', 'right', b[0], b[1] + b[2]], ['bottom', 'left', b[0] + b[3], b[1]], ['bottom', 'right', b[0] + b[3], b[1] + b[2]]].forEach(function (k) {
      var d = document.createElement('div');
      d.style.position = 'absolute'; d.style.width = px(a + m); d.style.height = px(a + m);
      d.style.top = px(k[0] === 'top' ? k[2] - m : k[2] - a);
      d.style.left = px(k[1] === 'left' ? k[3] - m : k[3] - a);
      d.style['border' + (k[0] === 'top' ? 'Top' : 'Bottom')] = s + 'px solid ' + c.colore;
      d.style['border' + (k[1] === 'left' ? 'Left' : 'Right')] = s + 'px solid ' + c.colore;
      fr.appendChild(d);
    });
    return fr;
  }

  function costruisci(box) {
    var ss = DATI[box.getAttribute('data-ss')];
    if (!ss) return null;
    var W = ss.formato[0], H = ss.formato[1];
    var palco = document.createElement('div');
    palco.className = 'ss-palco'; palco.style.width = px(W); palco.style.height = px(H);
    var pagine = [], t = 0;
    ss.pagine.forEach(function (p, i) {
      var pg = document.createElement('div');
      pg.className = 'ss-pagina';
      pg.style.width = px(W); pg.style.height = px(H);
      pg.style.zIndex = i + 1;
      var sf = p.sfondo || {};
      pg.style.background = sf.colore || '#ffffff';
      if (sf.foto) pg.appendChild(immagine(sf.foto, sf.ritaglio));
      var testi = [];
      (p.elementi || []).forEach(function (e) { pg.appendChild(elemento(e, testi)); });
      if (p.cornici) pg.appendChild(cornici(p.cornici));
      palco.appendChild(pg);
      var T = p.transizione ? p.transizione[1] : 0;
      pagine.push({el: pg, inizio: t, durata: p.durata, trans: p.transizione, T: T, testi: testi, animate: !!p.scritteAnimate});
      t += p.durata - (i < ss.pagine.length - 1 ? T : 0);
    });
    box.appendChild(palco);
    return {box: box, palco: palco, W: W, H: H, pagine: pagine, totale: t, tempo: 0, attivo: false, ultimo: 0};
  }

  function adatta(s) {
    var cw = s.box.clientWidth, ch = s.box.clientHeight;
    if (!cw || !ch) return;
    var k = Math.max(cw / s.W, ch / s.H);
    var cs = getComputedStyle(s.box);
    var px_ = parseFloat(cs.getPropertyValue('--ss-x')) || 50, py_ = parseFloat(cs.getPropertyValue('--ss-y')) || 50;
    var x = (cw - s.W * k) * px_ / 100, y = (ch - s.H * k) * py_ / 100;
    s.palco.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + k + ')';
  }

  function scritte(pg, tl) {
    // tl = tempo dall'inizio della pagina
    if (!pg.testi.length) return;
    var visibile = true, sx = 0, dx = 0, mezza = DURATA_BARRA / 2;
    if (pg.animate) {
      var fineUscita = pg.durata - pg.T - ANTICIPO_USCITA, inizioUscita = fineUscita - DURATA_BARRA;
      var q;
      if (tl < ENTRA) { visibile = false; }
      else if (tl < ENTRA + DURATA_BARRA) {
        q = tl - ENTRA;
        if (q < mezza) { visibile = false; sx = 0; dx = easeInQuad(q / mezza); }
        else { visibile = true; sx = easeOutCubic((q - mezza) / mezza); dx = 1; }
      } else if (tl < inizioUscita) { visibile = true; }
      else if (tl < fineUscita) {
        q = tl - inizioUscita;
        if (q < mezza) { visibile = true; sx = 0; dx = easeInQuad(q / mezza); }
        else { visibile = false; sx = easeOutCubic((q - mezza) / mezza); dx = 1; }
      } else { visibile = false; }
    }
    pg.testi.forEach(function (x) {
      x.scritta.style.visibility = visibile ? 'visible' : 'hidden';
      var w = Math.max(0, dx - sx);
      x.barra.style.left = (sx * 100) + '%';
      x.barra.style.width = (w * 100) + '%';
      x.barra.style.display = w > 0.001 ? 'block' : 'none';
    });
  }

  function disegna(s) {
    var t = s.tempo % s.totale, n = s.pagine.length;
    for (var i = 0; i < n; i++) {
      var pg = s.pagine[i], el = pg.el, fine = pg.inizio + pg.durata;
      var dentro = t >= pg.inizio && t < fine;
      if (!dentro) { if (el.style.display !== 'none') el.style.display = 'none'; continue; }
      el.style.display = 'block';
      var op = 1, tx = 0;
      var prec = i > 0 ? s.pagine[i - 1] : null;
      if (prec && prec.trans && t < pg.inizio + prec.T) { // sto entrando
        var p = (t - pg.inizio) / prec.T;
        if (prec.trans[0] === 'dissolvenza') op = p;
        else tx = (1 - easeInOutCubic(p)) * s.W;
      }
      var succ = i < n - 1 ? s.pagine[i + 1] : null;
      if (succ && pg.trans && pg.trans[0] === 'spinta' && t >= succ.inizio) { // sto uscendo spinta
        tx = -easeInOutCubic((t - succ.inizio) / pg.T) * s.W;
      }
      el.style.opacity = op;
      el.style.transform = tx ? 'translateX(' + tx + 'px)' : '';
      scritte(pg, t - pg.inizio);
    }
  }

  function ciclo(s) {
    var mio = s.giro = (s.giro || 0) + 1;   // un solo ciclo alla volta
    function passo(ora) {
      if (!s.attivo || s.giro !== mio) return;
      if (s.ultimo) s.tempo += Math.min(0.1, (ora - s.ultimo) / 1000);
      s.ultimo = ora;
      disegna(s);
      requestAnimationFrame(passo);
    }
    s.ultimo = 0;
    requestAnimationFrame(passo);
  }

  var tutti = [];
  function avvia(box) {
    if (box.__ss) return box.__ss;
    var s = costruisci(box);
    if (!s) return null;
    box.__ss = s; tutti.push(s);
    adatta(s); disegna(s);
    if ('ResizeObserver' in window) new ResizeObserver(function () { adatta(s); }).observe(box);
    else window.addEventListener('resize', function () { adatta(s); });
    return s;
  }

  // per i collaudi: ferma uno slideshow a un istante preciso (secondi)
  window.SS_VAI = function (box, t) { var s = avvia(box); if (!s) return 0; s.attivo = false; s.tempo = t; adatta(s); disegna(s); return s.totale; };

  var boxes = document.querySelectorAll('.ss[data-ss]');
  if (!('IntersectionObserver' in window)) {
    boxes.forEach(function (b) { var s = avvia(b); if (s) { s.attivo = true; ciclo(s); } });
    return;
  }
  // si costruisce quando sta per arrivare (carica le foto), si anima solo quando si vede
  var vicino = new IntersectionObserver(function (voci) {
    voci.forEach(function (v) { if (v.isIntersecting) { avvia(v.target); vicino.unobserve(v.target); } });
  }, {rootMargin: '600px 0px'});
  var visibile = new IntersectionObserver(function (voci) {
    voci.forEach(function (v) {
      var s = avvia(v.target); if (!s) return;
      if (v.isIntersecting && !s.attivo) { s.attivo = true; ciclo(s); }
      else if (!v.isIntersecting) s.attivo = false;
    });
  }, {threshold: 0.01});
  boxes.forEach(function (b) { vicino.observe(b); visibile.observe(b); });
  document.addEventListener('visibilitychange', function () {
    tutti.forEach(function (s) { if (document.hidden) s.attivo = false; });
    if (!document.hidden) boxes.forEach(function (b) { visibile.unobserve(b); visibile.observe(b); });
  });
})();
