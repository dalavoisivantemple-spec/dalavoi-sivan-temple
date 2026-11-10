/* Google Analytics 4 – visitor counts and a few button clicks. No personal data is sent. */
(function () {
  'use strict';
  var ID = 'G-VQST0TLQEY';
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', ID, { anonymize_ip: true });
  var s = document.createElement('script');
  s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
  document.head.appendChild(s);

  function send(name, params) { try { gtag('event', name, params || {}); } catch (e) {} }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a,button');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (a.hasAttribute('data-set-lang')) send('language_change', { language: a.getAttribute('data-set-lang') });
    else if (href.indexOf('tel:') === 0) send('call_click', { number: href.slice(4) });
    else if (a.id === 'share-wa') send('whatsapp_share');
    else if (href === '#thirupani' && a.classList.contains('btn-gold')) send('contribute_click');
    else if (href.indexOf('maps.app.goo.gl') > -1) send('map_click');
    else if (a.closest && a.closest('#cal') && a.tagName === 'BUTTON') send('calendar_use');
  });
  /* Video plays: video_start, video_progress (25/50/75%) and video_complete, once per video per visit. */
  var seen = {};
  function vinfo(v) {
    var src = v.currentSrc || (v.querySelector('source') || {}).src || '';
    var name = src.split('/').pop().replace(/\.mp4.*$/, '') || 'video';
    var st = seen[name] = seen[name] || { start: false, done: false, pct: {} };
    return { name: name, st: st };
  }
  document.addEventListener('play', function (e) {
    var v = e.target; if (!v || v.tagName !== 'VIDEO') return;
    var i = vinfo(v); if (i.st.start) return; i.st.start = true;
    send('video_start', { video_title: i.name });
  }, true);
  document.addEventListener('timeupdate', function (e) {
    var v = e.target; if (!v || v.tagName !== 'VIDEO' || !v.duration) return;
    var i = vinfo(v), p = v.currentTime / v.duration * 100;
    [25, 50, 75].forEach(function (m) {
      if (p >= m && !i.st.pct[m]) { i.st.pct[m] = true; send('video_progress', { video_title: i.name, video_percent: m }); }
    });
  }, true);
  document.addEventListener('ended', function (e) {
    var v = e.target; if (!v || v.tagName !== 'VIDEO') return;
    var i = vinfo(v); if (i.st.done) return; i.st.done = true;
    send('video_complete', { video_title: i.name, video_percent: 100 });
  }, true);
})();
