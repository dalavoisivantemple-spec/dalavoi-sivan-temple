/* Dalavoi Sivan Temple — site behaviour.
   No framework, no network calls. Both languages are in the HTML; this file only
   switches which one is visible and fills in the dynamic parts (hours status,
   16-week lamp tracker, updates, donation details). */
(function () {
  'use strict';

  var CFG = window.TEMPLE_CONFIG || {};
  var NEWS = window.TEMPLE_NEWS || [];
  var root = document.documentElement;
  var LANG_KEY = 'dalavoi_lang';
  var LAMP_KEY = 'dalavoi_lamps';
  var memory = {};

  /* ---- storage that never throws (private mode, blocked storage) ---- */
  function getItem(k) { try { return localStorage.getItem(k); } catch (e) { return memory[k] || null; } }
  function setItem(k, v) { try { localStorage.setItem(k, v); } catch (e) { memory[k] = v; } }

  /* ---- small DOM helpers ---- */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function bi(parent, en, ta, tag) {
    var t = tag || 'span';
    var a = el(t, 'ta', ta); a.setAttribute('lang', 'ta');
    var b = el(t, 'en', en); b.setAttribute('lang', 'en');
    parent.appendChild(a); parent.appendChild(b);
    return parent;
  }
  function currentLang() { return root.getAttribute('data-lang') === 'en' ? 'en' : 'ta'; }

  /* ---- language ---- */
  var langButtons = document.querySelectorAll('[data-set-lang]');
  function setLang(l) {
    if (l !== 'en') l = 'ta';
    root.setAttribute('data-lang', l);
    root.setAttribute('lang', l);
    for (var i = 0; i < langButtons.length; i++) {
      langButtons[i].setAttribute('aria-pressed', langButtons[i].getAttribute('data-set-lang') === l ? 'true' : 'false');
    }
    setItem(LANG_KEY, l);
    refreshLampLabels();
  }
  for (var i = 0; i < langButtons.length; i++) {
    langButtons[i].addEventListener('click', function (e) { setLang(e.currentTarget.getAttribute('data-set-lang')); });
  }

  /* ---- trust name + registration (from data/config.js) ---- */
  (function () {
    var t = CFG.trust || {};
    var en = document.querySelectorAll('.trust-name-en');
    var ta = document.querySelectorAll('.trust-name-ta');
    var i;
    if (t.name_en) for (i = 0; i < en.length; i++) en[i].textContent = t.name_en;
    if (t.name_ta) { for (i = 0; i < ta.length; i++) ta[i].textContent = t.name_ta; }
    else if (t.name_en) { for (i = 0; i < ta.length; i++) ta[i].textContent = t.name_en; }
    var reg = document.getElementById('reg-line');
    if (reg && t.registration) {
      bi(reg, ' Registration no. ' + t.registration, ' பதிவு எண்: ' + t.registration);
    }
    var y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
  })();

  /* ---- opening hours: read the table in the page, show a live status ---- */
  var DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var DAYS_TA = ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி'];
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function tEn(min) {
    var h = Math.floor(min / 60), m = min % 60;
    if (h === 12 && m === 0) return '12:00 noon';
    return ((h % 12) || 12) + ':' + pad(m) + (h < 12 ? ' am' : ' pm');
  }
  function tTa(min) {
    var h = Math.floor(min / 60), m = min % 60;
    var w = h < 12 ? 'காலை' : (h === 12 ? 'மதியம்' : (h < 16 ? 'பிற்பகல்' : 'மாலை'));
    return w + ' ' + ((h % 12) || 12) + ':' + pad(m);
  }
  function loadSchedule() {
    var sched = [[], [], [], [], [], [], []];
    var rows = document.querySelectorAll('.hours tr[data-days]');
    for (var r = 0; r < rows.length; r++) {
      var days = rows[r].getAttribute('data-days').split(',');
      var wins = rows[r].getAttribute('data-open').split(',').map(function (w) {
        var p = w.split('-'), a = p[0].split(':'), b = p[1].split(':');
        return [parseInt(a[0], 10) * 60 + parseInt(a[1], 10), parseInt(b[0], 10) * 60 + parseInt(b[1], 10)];
      });
      for (var d = 0; d < days.length; d++) sched[parseInt(days[d], 10)] = wins;
    }
    return sched;
  }
  function istNow() {
    var parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false
    }).formatToParts(new Date());
    var o = {};
    parts.forEach(function (p) { o[p.type] = p.value; });
    var map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { day: map[o.weekday], min: (parseInt(o.hour, 10) % 24) * 60 + parseInt(o.minute, 10) };
  }
  function renderStatus() {
    var box = document.getElementById('today-status');
    if (!box) return;
    try {
      var sched = loadSchedule(), now = istNow(), wins = sched[now.day] || [];
      var en = '', ta = '', state = 'closed', i;
      for (i = 0; i < wins.length; i++) {
        if (now.min >= wins[i][0] && now.min < wins[i][1]) {
          state = 'open';
          en = 'Open now, until ' + tEn(wins[i][1]) + '.';
          ta = 'இப்போது திறந்திருக்கிறது, ' + tTa(wins[i][1]) + ' வரை.';
          break;
        }
      }
      if (state !== 'open') {
        var later = null;
        for (i = 0; i < wins.length; i++) { if (wins[i][0] > now.min) { later = wins[i]; break; } }
        if (later) {
          en = 'Closed now. Opens today at ' + tEn(later[0]) + '.';
          ta = 'இப்போது மூடப்பட்டுள்ளது. இன்று ' + tTa(later[0]) + ' மணிக்குத் திறக்கும்.';
        } else {
          for (var d = 1; d <= 7; d++) {
            var nd = (now.day + d) % 7;
            if (sched[nd] && sched[nd].length) {
              var when = d === 1;
              en = 'Closed for today. Opens ' + (when ? 'tomorrow' : 'on ' + DAYS_EN[nd]) + ' at ' + tEn(sched[nd][0][0]) + '.';
              ta = 'இன்றைக்கு மூடப்பட்டுள்ளது. ' + (when ? 'நாளை' : DAYS_TA[nd]) + ' ' + tTa(sched[nd][0][0]) + ' மணிக்குத் திறக்கும்.';
              break;
            }
          }
        }
      }
      if (now.day === 4) {
        en = 'Thursday, the day of Guru worship. ' + en;
        ta = 'இன்று வியாழக்கிழமை, குரு வழிபாட்டு நாள். ' + ta;
      }
      box.textContent = '';
      bi(box, en, ta);
      box.setAttribute('data-state', state);
    } catch (e) { box.textContent = ''; }
  }

  /* ---- 16-week lamp tracker ---- */
  var lampList = document.getElementById('lamps');
  var lampCount = document.getElementById('lamp-count');
  var lamps = [];
  function loadLamps() {
    try {
      var a = JSON.parse(getItem(LAMP_KEY) || '[]');
      if (Array.isArray(a) && a.length === 16) return a.map(Boolean);
    } catch (e) { /* ignore */ }
    var blank = []; for (var i = 0; i < 16; i++) blank.push(false);
    return blank;
  }
  function lampsLit() { return lamps.filter(Boolean).length; }
  function refreshLampLabels() {
    if (!lampList) return;
    var l = currentLang(), btns = lampList.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      var on = lamps[i];
      btns[i].setAttribute('aria-pressed', on ? 'true' : 'false');
      btns[i].setAttribute('aria-label', l === 'en'
        ? 'Thursday ' + (i + 1) + ', ' + (on ? 'lamp lit' : 'lamp not lit')
        : 'வியாழன் ' + (i + 1) + ', ' + (on ? 'தீபம் ஏற்றப்பட்டது' : 'தீபம் ஏற்றப்படவில்லை'));
    }
    if (lampCount) {
      var n = lampsLit();
      lampCount.textContent = '';
      if (n === 16) bi(lampCount, 'All 16 Thursdays complete. Om Namah Shivaya.', 'அனைத்து 16 வியாழக்கிழமைகளும் நிறைவு. ஓம் நமசிவாய.');
      else bi(lampCount, n + ' of 16 lamps lit', '16 விளக்குகளில் ' + n + ' ஏற்றப்பட்டன');
    }
  }
  function buildLamps() {
    if (!lampList) return;
    lamps = loadLamps();
    for (var i = 0; i < 16; i++) {
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'lamp'; b.setAttribute('data-i', i);
      b.innerHTML = '<svg viewBox="0 0 64 80" aria-hidden="true" focusable="false"><use href="#diya"></use></svg><span></span>';
      b.lastChild.textContent = String(i + 1);
      li.appendChild(b); lampList.appendChild(li);
    }
    lampList.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('button.lamp') : null;
      if (!b) return;
      var idx = parseInt(b.getAttribute('data-i'), 10);
      lamps[idx] = !lamps[idx];
      setItem(LAMP_KEY, JSON.stringify(lamps));
      refreshLampLabels();
    });
    var reset = document.getElementById('lamp-reset');
    if (reset) reset.addEventListener('click', function () {
      if (lampsLit() > 0) {
        var msg = currentLang() === 'en' ? 'Clear all 16 lamps and start over?' : '16 விளக்குகளையும் அழித்து மீண்டும் தொடங்கவா?';
        if (!window.confirm(msg)) return;
      }
      lamps = loadLamps().map(function () { return false; });
      setItem(LAMP_KEY, JSON.stringify(lamps));
      refreshLampLabels();
    });
    refreshLampLabels();
  }

  /* ---- updates (data/news.js) ---- */
  function fmtDate(iso, locale) {
    var d = new Date(iso + 'T00:00:00');
    if (isNaN(d.getTime())) return iso;
    try { return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return iso; }
  }
  function renderNews() {
    var box = document.getElementById('news');
    if (!box) return;
    var items = (NEWS || []).slice().sort(function (a, b) { return (a.date < b.date) ? 1 : -1; }).slice(0, 8);
    if (!items.length) {
      var p = el('p', 'empty');
      bi(p, 'Daily updates from the temple will appear here. Check back on Thursday.',
         'கோயிலின் தினசரி செய்திகள் இங்கே வெளியிடப்படும். வியாழக்கிழமை மீண்டும் வாருங்கள்.', 'span');
      box.appendChild(p);
      return;
    }
    items.forEach(function (n) {
      var a = el('article', 'news-item');
      var t = el('time'); t.setAttribute('datetime', n.date);
      bi(t, fmtDate(n.date, 'en-IN'), fmtDate(n.date, 'ta-IN'));
      a.appendChild(t);
      var h = el('h3'); bi(h, n.title_en || n.title_ta || '', n.title_ta || n.title_en || ''); a.appendChild(h);
      var p = el('p'); bi(p, n.body_en || n.body_ta || '', n.body_ta || n.body_en || ''); a.appendChild(p);
      if (n.image) {
        var img = el('img'); img.src = n.image; img.loading = 'lazy';
        img.alt = n.image_alt_en || n.image_alt_ta || ''; a.appendChild(img);
      }
      box.appendChild(a);
    });
  }

  /* ---- donation details + progress (data/config.js). Nothing shows unless filled in. ---- */
  function copyText(text, btn) {
    function done() {
      var old = btn.textContent;
      btn.textContent = currentLang() === 'en' ? 'Copied' : 'நகலெடுக்கப்பட்டது';
      setTimeout(function () { btn.textContent = old; }, 1800);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () {});
    }
  }
  function renderDonation() {
    var d = CFG.donation || {};
    var box = document.getElementById('donate-box');
    if (!box || !(d.upi_id || d.account_number)) return;
    box.textContent = '';
    var h = el('h3'); bi(h, 'How to contribute', 'பங்களிக்க'); box.appendChild(h);
    if (d.note_en || d.note_ta) {
      var np = el('p'); bi(np, d.note_en || d.note_ta, d.note_ta || d.note_en); box.appendChild(np);
    }
    if (d.upi_id) {
      var l = el('p'); bi(l, 'UPI ID', 'UPI முகவரி'); l.style.marginBottom = '0'; box.appendChild(l);
      var u = el('p', 'upi', d.upi_id); box.appendChild(u);
      var cb = el('button', 'btn btn-copy btn-sm'); cb.type = 'button';
      cb.textContent = currentLang() === 'en' ? 'Copy UPI ID' : 'UPI முகவரியை நகலெடு';
      cb.addEventListener('click', function () { copyText(d.upi_id, cb); });
      u.appendChild(document.createTextNode(' ')); u.appendChild(cb);
      if (d.upi_qr) {
        var q = el('img', 'qr'); q.src = d.upi_qr; q.alt = 'UPI QR code'; q.width = 200; q.height = 200; box.appendChild(q);
      }
    }
    if (d.account_number) {
      var dl = el('dl', 'bank');
      var rows = [
        ['Account name', 'கணக்கு பெயர்', d.account_name],
        ['Account number', 'கணக்கு எண்', d.account_number],
        ['IFSC', 'IFSC', d.ifsc],
        ['Bank and branch', 'வங்கி, கிளை', d.bank]
      ];
      rows.forEach(function (r) {
        if (!r[2]) return;
        var dt = el('dt'); bi(dt, r[0], r[1]); dl.appendChild(dt);
        dl.appendChild(el('dd', null, r[2]));
      });
      box.appendChild(dl);
    }
    var call = el('p'); call.style.marginTop = '1rem';
    bi(call, 'Questions? Call the temple: ', 'சந்தேகங்களுக்கு கோயிலை அழைக்கவும்: ');
    var tel = el('a', 'tel', '+91 89038 89272'); tel.href = 'tel:+918903889272';
    call.appendChild(tel); box.appendChild(call);
  }
  function renderProgress() {
    var p = CFG.progress || {}, box = document.getElementById('progress');
    if (!box || !(p.target_amount > 0)) return;
    var raised = Math.max(0, p.raised_amount || 0), pct = Math.min(100, Math.round(raised / p.target_amount * 100));
    var fmt = function (n) { return '₹' + Number(n).toLocaleString('en-IN'); };
    var line = el('p');
    bi(line, 'Raised ' + fmt(raised) + ' of ' + fmt(p.target_amount) + ' (' + pct + '%)',
       fmt(p.target_amount) + ' இலக்கில் ' + fmt(raised) + ' திரட்டப்பட்டுள்ளது (' + pct + '%)');
    box.appendChild(line);
    var track = el('div', 'track'); track.setAttribute('role', 'progressbar');
    track.setAttribute('aria-valuemin', '0'); track.setAttribute('aria-valuemax', '100'); track.setAttribute('aria-valuenow', String(pct));
    var fill = el('div', 'fill'); fill.style.width = pct + '%'; track.appendChild(fill); box.appendChild(track);
    if (p.updated) {
      var up = el('p'); up.style.cssText = 'font-weight:400;font-size:.9rem;margin-top:.5rem';
      bi(up, 'Updated ' + p.updated, 'புதுப்பிக்கப்பட்டது: ' + p.updated); box.appendChild(up);
    }
    box.hidden = false;
  }

  /* ---- share on WhatsApp ---- */
  (function () {
    var a = document.getElementById('share-wa');
    if (!a) return;
    var url = /^https?:/.test(location.href) ? location.href.split('#')[0] : (CFG.siteUrl || '');
    var text = 'தளவாய் திருநீலகண்டேஸ்வரர் திருக்கோயில் | Dalavoi Thiruneelakandeshwarar Temple\n' + url;
    a.href = 'https://wa.me/?text=' + encodeURIComponent(text);
  })();

  /* ---- gallery lightbox ---- */
  (function () {
    var dlg = document.getElementById('lightbox');
    var big = document.getElementById('lightbox-img');
    var btns = document.querySelectorAll('.gallery button[data-full]');
    if (!dlg || !big) return;
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function (e) {
        var b = e.currentTarget, th = b.querySelector('img');
        if (typeof dlg.showModal !== 'function') { window.open(b.getAttribute('data-full'), '_blank'); return; }
        big.src = b.getAttribute('data-full'); big.alt = th ? th.alt : '';
        dlg.showModal();
      });
    }
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  })();

  /* ---- start ---- */
  /* A shared link can choose the language: https://dalavoisivangurutemple.org/?lang=en */
  var asked = /[?&]lang=(en|ta)\b/.exec(location.search);
  var saved = asked ? asked[1] : getItem(LANG_KEY);
  buildLamps();
  setLang(saved === 'en' ? 'en' : 'ta');
  renderStatus();
  renderNews();
  renderDonation();
  renderProgress();
  setInterval(renderStatus, 60000);
})();
