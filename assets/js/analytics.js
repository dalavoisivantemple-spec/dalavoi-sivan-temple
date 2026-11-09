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
})();
