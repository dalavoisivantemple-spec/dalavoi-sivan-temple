/* Feedback form: sends to a Google Sheet through an Apps Script web app. No personal data goes to Google Analytics. */
(function () {
  'use strict';
  var form = document.getElementById('fb-form');
  if (!form) return;
  var ok = document.getElementById('fb-ok'), err = document.getElementById('fb-err');
  var btn = form.querySelector('button[type="submit"]');
  var born = Date.now();
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    ok.hidden = true; err.hidden = true;
    var msg = form.elements.message;
    if (!msg.value.trim()) { msg.focus(); err.hidden = false; return; }
    if (form.elements.website.value) { ok.hidden = false; return; }   /* bot filled the hidden field */
    if (Date.now() - born < 3000) { err.hidden = false; return; }     /* too fast to be a person */
    var f = form.elements, body = new URLSearchParams();
    var rating = form.querySelector('input[name="rating"]:checked');
    body.set('type', form.querySelector('input[name="type"]:checked').value);
    body.set('rating', rating ? rating.value : '');
    body.set('name', f.name.value); body.set('village', f.village.value);
    body.set('message', msg.value); body.set('contact', f.contact.value);
    body.set('website', ''); body.set('lang', document.documentElement.getAttribute('data-lang') || '');
    body.set('page', location.pathname);
    btn.disabled = true;
    fetch(form.getAttribute('data-endpoint'), { method: 'POST', mode: 'no-cors', body: body })
      .then(function () {
        form.reset(); ok.hidden = false; born = Date.now();
        try { window.gtag && window.gtag('event', 'feedback_submit', { feedback_type: body.get('type') }); } catch (x) {}
      })
      .catch(function () { err.hidden = false; })
      .then(function () { btn.disabled = false; });
  });
})();
