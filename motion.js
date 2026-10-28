/* Vergers de la Garenne : menu mobile, ombre d'en-tête, bascule FR/EN, révélations, compteurs, vidéo, prochaine récolte.
   Sans JavaScript, tout reste visible et utilisable (masquages conditionnés par html.js). */
window.vgMotion = true;
(function () {
  var doc = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var burger = document.querySelector('.burger');
  var menu = document.getElementById('menu');
  function closeMenu() {
    if (!burger) { return; }
    burger.setAttribute('aria-expanded', 'false');
    doc.classList.remove('menu-open');
  }
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', open ? 'false' : 'true');
      doc.classList.toggle('menu-open', !open);
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('a')) { closeMenu(); }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeMenu(); } });
  }

  var header = document.querySelector('.site-header');
  function onScroll() { if (header) { header.classList.toggle('is-scrolled', window.scrollY > 24); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  [].forEach.call(document.querySelectorAll('.lang-switch'), function (sw) {
    sw.addEventListener('click', function () {
      var cur = '';
      [].forEach.call(document.querySelectorAll('main section[id]'), function (s) {
        if (s.getBoundingClientRect().top < window.innerHeight / 3) { cur = s.id; }
      });
      if (cur) { sw.href = sw.href.split('#')[0] + '#' + cur; }
    });
  });

  // Vidéo « de la fleur au fruit » : image d'attente chargée à l'approche, lecture quand la vidéo est visible,
  // jamais si l'utilisateur préfère réduire les animations (placé avant le retour anticipé ci-dessous)
  [].forEach.call(document.querySelectorAll('video[data-poster]'), function (vid) {
    var setPoster = function () { if (!vid.getAttribute('poster')) { vid.setAttribute('poster', vid.getAttribute('data-poster')); } };
    if (!('IntersectionObserver' in window)) { setPoster(); return; }
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          setPoster();
          if (!reduce) { var pr = vid.play(); if (pr && pr.catch) { pr.catch(function () {}); } }
        } else if (!reduce) { vid.pause(); }
      });
    }, { rootMargin: '300px 0px' }).observe(vid);
  });

  // Bandeau « Prochaine récolte » : récolte du jour, sinon prochaine récolte (calculé depuis les dates du calendrier)
  var nowBar = document.getElementById('maintenant');
  var nowInner = nowBar && nowBar.querySelector('.now-inner');
  var cal = document.querySelector('.cal');
  if (nowInner && cal) {
    var labelOf = function (el) {
      var n = el && el.querySelector('.cal-label');
      return n && n.firstChild ? n.firstChild.nodeValue.trim() : '';
    };
    var today = new Date();
    var key = (today.getMonth() + 1) * 100 + today.getDate();
    var current = [];
    var next = null;
    var first = null;
    [].forEach.call(cal.querySelectorAll('.cal-fruit'), function (f) {
      var fruitName = labelOf(f.querySelector('summary'));
      var names = [];
      [].forEach.call(f.querySelectorAll('.cal-variety'), function (v) {
        var a = parseInt(v.getAttribute('data-from'), 10);
        var b = parseInt(v.getAttribute('data-to'), 10);
        if (key >= a && key <= b) { names.push(labelOf(v)); }
        if (a > key && (!next || a < next.from)) { next = { from: a, fruit: fruitName }; }
        if (!first || a < first.from) { first = { from: a, fruit: fruitName }; }
      });
      if (names.length) { current.push({ fruit: fruitName, names: names }); }
    });
    if (current.length || first) {
      var label;
      var text;
      if (current.length) {
        label = nowBar.getAttribute('data-label-now');
        text = current.length === 1 ? current[0].fruit + ' (' + current[0].names.join(', ') + ')'
          : current.map(function (c) { return c.fruit; }).join(', ');
      } else {
        var n = next || first;
        var mois = new Date(2026, Math.floor(n.from / 100) - 1, 1).toLocaleDateString(doc.lang || 'fr', { month: 'long' });
        label = nowBar.getAttribute('data-label-next');
        text = n.fruit.toLowerCase() + ', ' + nowBar.getAttribute('data-label-from') + ' ' + mois;
      }
      var dot = document.createElement('span');
      dot.className = 'now-dot';
      dot.setAttribute('aria-hidden', 'true');
      var strong = document.createElement('strong');
      strong.textContent = label;
      var link = document.createElement('a');
      link.href = '#calendrier';
      link.textContent = nowBar.getAttribute('data-label-cta');
      var phrase = document.createElement('span');
      phrase.appendChild(strong);
      phrase.appendChild(document.createTextNode(' : ' + text));
      nowInner.appendChild(dot);
      nowInner.appendChild(phrase);
      nowInner.appendChild(link);
    }
  }

  var els = [].slice.call(document.querySelectorAll('.rv, .rv-media'));
  var nums = [].slice.call(document.querySelectorAll('[data-count]'));
  if (reduce || !('IntersectionObserver' in window)) {
    els.forEach(function (e) { e.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  els.forEach(function (e) { io.observe(e); });

  var io2 = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) { return; }
      io2.unobserve(en.target);
      var el = en.target;
      var to = parseInt(el.getAttribute('data-count'), 10);
      var from = parseInt(el.getAttribute('data-from') || '0', 10);
      var t0 = null;
      function step(t) {
        if (t0 === null) { t0 = t; }
        var p = Math.min((t - t0) / 1400, 1);
        el.textContent = String(Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))));
        if (p < 1) { requestAnimationFrame(step); }
      }
      requestAnimationFrame(step);
    });
  }, { threshold: 0.5 });
  nums.forEach(function (e) { io2.observe(e); });
})();
