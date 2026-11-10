/* Tamil calendar (panchangam) – daily card + monthly grid. Uses Panchangam (calculated, Dalavoipattinam). */
(function () {
  'use strict';
  var P = window.Panchangam, host = document.getElementById('cal');
  if (!P || !host) return;
  var N = P.N;
  var DOW_TA = ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி'];
  var DOW_FULL_TA = ['ஞாயிற்றுக்கிழமை', 'திங்கட்கிழமை', 'செவ்வாய்க்கிழமை', 'புதன்கிழமை', 'வியாழக்கிழமை', 'வெள்ளிக்கிழமை', 'சனிக்கிழமை'];
  var DOW_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MON_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var MON_TA = ['ஜனவரி', 'பிப்ரவரி', 'மார்ச்', 'ஏப்ரல்', 'மே', 'ஜூன்', 'ஜூலை', 'ஆகஸ்ட்', 'செப்டம்பர்', 'அக்டோபர்', 'நவம்பர்', 'டிசம்பர்'];

  function el(t, c, x) { var n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; }
  function bi(parent, ta, en, tag, cls) {
    var a = el(tag || 'span', 'ta' + (cls ? ' ' + cls : ''), ta); a.setAttribute('lang', 'ta');
    var b = el(tag || 'span', 'en' + (cls ? ' ' + cls : ''), en); b.setAttribute('lang', 'en');
    parent.appendChild(a); parent.appendChild(b); return parent;
  }
  function range(r) { return P.fmtTime(r[0]) + ' – ' + P.fmtTime(r[1]); }

  var nowIST = P.istParts(Date.now() / 86400000 + 2440587.5);
  var today = { y: nowIST.y, m: nowIST.m, d: nowIST.d };
  var view = { y: today.y, m: today.m };
  var sel = { y: today.y, m: today.m, d: today.d };

  var daily = el('div', 'cal-day'), nav = el('div', 'cal-nav'), grid = el('div', 'cal-grid'), legend = el('p', 'cal-note');
  host.appendChild(daily);
  var month = el('div', 'cal-month'); host.appendChild(month);
  month.appendChild(nav); month.appendChild(grid); month.appendChild(legend);

  function tamilMonthSpan(y, m) {
    var a = P.dayInfo(y, m, 1).tamil, last = new Date(Date.UTC(y, m, 0)).getUTCDate(), b = P.dayInfo(y, m, last).tamil;
    return a.month === b.month ? [a.month] : [a.month, b.month];
  }

  function drawDaily() {
    daily.textContent = '';
    var i = P.dayInfo(sel.y, sel.m, sel.d), ev = P.eventsFor(sel.y, sel.m, sel.d);
    var isToday = sel.y === today.y && sel.m === today.m && sel.d === today.d;
    var head = el('div', 'cd-head');
    var tag = el('p', 'cd-tag'); bi(tag, isToday ? 'இன்று' : 'தேர்ந்தெடுத்த நாள்', isToday ? 'Today' : 'Selected day'); head.appendChild(tag);
    var big = el('p', 'cd-big');
    bi(big, i.tamil.day + ' ' + N.monthTa[i.tamil.month], N.monthEn[i.tamil.month] + ' ' + i.tamil.day);
    head.appendChild(big);
    var sub = el('p', 'cd-sub');
    bi(sub, DOW_FULL_TA[i.dow] + ', ' + sel.d + ' ' + MON_TA[sel.m - 1] + ' ' + sel.y + ' · ' + N.yearTa[i.tamil.yearIdx] + ' ஆண்டு',
      DOW_EN[i.dow] + ', ' + sel.d + ' ' + MON_EN[sel.m - 1] + ' ' + sel.y + ' · ' + N.yearEn[i.tamil.yearIdx] + ' year');
    head.appendChild(sub);
    daily.appendChild(head);

    if (ev.length) {
      var ul = el('ul', 'cd-ev');
      ev.forEach(function (e) { var li = el('li', e.kind === 'major' ? 'major' : ''); bi(li, e.ta, e.en); ul.appendChild(li); });
      daily.appendChild(ul);
    }

    var dl = el('dl', 'cd-list');
    function row(ta, en, vta, ven) {
      var dt = el('dt'); bi(dt, ta, en); var dd = el('dd'); bi(dd, vta, ven); dl.appendChild(dt); dl.appendChild(dd);
    }
    var tn = i.tithiEnd ? ' (' + P.fmtTime(i.tithiEnd) + ' வரை)' : '', tne = i.tithiEnd ? ' (until ' + P.fmtTime(i.tithiEnd) + ')' : '';
    row('திதி', 'Tithi', P.paksha(i.tithi, 'ta') + ' ' + P.tithiName(i.tithi, 'ta') + tn, P.paksha(i.tithi, 'en') + ' ' + P.tithiName(i.tithi, 'en') + tne);
    row('நட்சத்திரம்', 'Nakshatra', N.nakTa[i.nak] + ' (' + P.fmtTime(i.nakEnd) + ' வரை)', N.nakEn[i.nak] + ' (until ' + P.fmtTime(i.nakEnd) + ')');
    row('சூரிய உதயம் / அஸ்தமனம்', 'Sunrise / Sunset', P.fmtTime(i.sunrise) + ' / ' + P.fmtTime(i.sunset), P.fmtTime(i.sunrise) + ' / ' + P.fmtTime(i.sunset));
    row('ராகு காலம்', 'Rahu Kalam', range(i.rahu), range(i.rahu));
    row('எமகண்டம்', 'Yamagandam', range(i.yama), range(i.yama));
    row('குளிகை', 'Gulikai', range(i.guli), range(i.guli));
    daily.appendChild(dl);

    var day = el('div', 'cd-nav');
    [[-1, 'முந்தைய நாள்', 'Previous day'], [1, 'அடுத்த நாள்', 'Next day']].forEach(function (b) {
      var btn = el('button', 'btn btn-sm btn-line-ink'); btn.type = 'button'; bi(btn, b[1], b[2]);
      btn.addEventListener('click', function () { var t = new Date(Date.UTC(sel.y, sel.m - 1, sel.d + b[0])); setSel(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate(), true); });
      day.appendChild(btn);
    });
    if (!isToday) { var tb = el('button', 'btn btn-sm btn-ink'); tb.type = 'button'; bi(tb, 'இன்று', 'Today'); tb.addEventListener('click', function () { setSel(today.y, today.m, today.d, true); }); day.appendChild(tb); }
    daily.appendChild(day);
  }

  function setSel(y, m, d, follow) {
    sel = { y: y, m: m, d: d };
    if (follow) view = { y: y, m: m };
    drawDaily(); drawMonth();
  }

  function drawMonth() {
    nav.textContent = ''; grid.textContent = ''; legend.textContent = '';
    var prev = el('button', 'cal-arrow'); prev.type = 'button'; prev.textContent = '‹'; prev.setAttribute('aria-label', 'Previous month');
    var next = el('button', 'cal-arrow'); next.type = 'button'; next.textContent = '›'; next.setAttribute('aria-label', 'Next month');
    prev.addEventListener('click', function () { var t = new Date(Date.UTC(view.y, view.m - 2, 1)); view = { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1 }; drawMonth(); });
    next.addEventListener('click', function () { var t = new Date(Date.UTC(view.y, view.m, 1)); view = { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1 }; drawMonth(); });
    var title = el('div', 'cal-title'), h = el('h3');
    bi(h, MON_TA[view.m - 1] + ' ' + view.y, MON_EN[view.m - 1] + ' ' + view.y); title.appendChild(h);
    var sp = tamilMonthSpan(view.y, view.m), s = el('p', 'cal-tm');
    bi(s, sp.map(function (k) { return N.monthTa[k]; }).join(' – '), sp.map(function (k) { return N.monthEn[k]; }).join(' – '));
    title.appendChild(s);
    nav.appendChild(prev); nav.appendChild(title); nav.appendChild(next);

    for (var w = 0; w < 7; w++) { var c = el('div', 'cal-dow' + (w === 4 ? ' thu' : '')); bi(c, DOW_TA[w], DOW_EN[w]); grid.appendChild(c); }
    var first = new Date(Date.UTC(view.y, view.m - 1, 1)).getUTCDay(), last = new Date(Date.UTC(view.y, view.m, 0)).getUTCDate();
    for (var b = 0; b < first; b++) grid.appendChild(el('div', 'cal-cell empty'));
    for (var d = 1; d <= last; d++) {
      (function (d) {
        var i = P.dayInfo(view.y, view.m, d), ev = P.eventsFor(view.y, view.m, d);
        var major = ev.filter(function (e) { return e.kind === 'major'; }), dow = i.dow;
        var cls = 'cal-cell' + (dow === 4 ? ' thu' : '') + (major.length ? ' fest' : '') +
          (view.y === today.y && view.m === today.m && d === today.d ? ' today' : '') +
          (view.y === sel.y && view.m === sel.m && d === sel.d ? ' sel' : '');
        var cell = el('button', cls); cell.type = 'button';
        cell.appendChild(el('span', 'g', d));
        var t = el('span', 'tm');
        var showMonth = d === 1 || i.tamil.day === 1;
        bi(t, showMonth ? N.monthTa[i.tamil.month] + ' ' + i.tamil.day : String(i.tamil.day), showMonth ? N.monthEn[i.tamil.month].slice(0, 3) + ' ' + i.tamil.day : String(i.tamil.day));
        cell.appendChild(t);
        var tag = ev.filter(function (e) { return e.kind === 'major'; })[0] || ev.filter(function (e) { return e.kind !== 'guru' && e.kind !== 'month'; })[0];
        if (tag) { var f = el('span', 'f'); bi(f, tag.ta, tag.en); cell.appendChild(f); }
        cell.addEventListener('click', function () { setSel(view.y, view.m, d, false); });
        grid.appendChild(cell);
      })(d);
    }
    bi(legend, 'நாள்காட்டி கணிதக் கணக்கீட்டால் (திருக்கணிதம்) பெறப்பட்டது; தலத்தின் இருப்பிடத்திற்கு ஏற்றது. கோயில் பஞ்சாங்கத்துடன் ஓரிரு நாள் / சில நிமிட வேறுபாடு இருக்கலாம் — பண்டிகை நாட்களுக்கு கோயில் பஞ்சாங்கமே இறுதி.',
      'Calculated astronomically (Drik) for Dalavoipattinam. It can differ from the temple almanac by a day or a few minutes. For festival dates, the temple’s almanac is final.');
  }

  /* ---------- Add events to my calendar (.ics download: works on Android, iPhone and laptops) ---------- */
  var CATS = [
    ['guru', 'வியாழக்கிழமை – குரு வழிபாடு', 'Thursday – Guru worship', false],
    ['ekadasi_w', 'வளர்பிறை ஏகாதசி', 'Ekadasi (waxing moon)', false],
    ['ekadasi_k', 'தேய்பிறை ஏகாதசி', 'Ekadasi (waning moon)', false],
    ['pradosham', 'பிரதோஷம்', 'Pradosham', false],
    ['amavasai', 'அமாவாசை', 'Amavasai (new moon)', false],
    ['pournami', 'பௌர்ணமி', 'Pournami (full moon)', false],
    ['sankatahara', 'சங்கடஹர சதுர்த்தி', 'Sankatahara Chaturthi', false],
    ['sashti', 'சஷ்டி (முருகன்)', 'Sashti (Murugan)', false],
    ['month1', 'தமிழ் மாதப் பிறப்பு (மாதத்தின் முதல் நாள்)', '1st day of each Tamil month', false],
    ['festival', 'இந்து பண்டிகைகள்', 'Hindu festivals', true]
  ];
  function icsEsc(t) { return String(t).replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); }
  function fold(line) {
    var out = [], cur = '', bytes = 0, limit = 74, i, ch, b;
    for (i = 0; i < line.length; i++) {
      ch = String.fromCodePoint(line.codePointAt(i)); if (ch.length > 1) i++;
      b = unescape(encodeURIComponent(ch)).length;
      if (bytes + b > limit) { out.push(cur); cur = ' '; bytes = 1; limit = 74; }
      cur += ch; bytes += b;
    }
    out.push(cur); return out.join('\r\n');
  }
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(y, m, d) { return '' + y + p2(m) + p2(d); }
  function buildICS(year, picked) {
    var ev = P.yearEvents(year), keys = Object.keys(ev), L = [], n = 0, stamp;
    var now = new Date(); stamp = now.getUTCFullYear() + p2(now.getUTCMonth() + 1) + p2(now.getUTCDate()) + 'T' + p2(now.getUTCHours()) + p2(now.getUTCMinutes()) + p2(now.getUTCSeconds()) + 'Z';
    L.push('BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Dalavoipattinam Sivan Guru Temple//Tamil Calendar//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'X-WR-CALNAME:' + icsEsc('தளவாய்பட்டிணம் சிவன் குரு கோயில் · Dalavoipattinam temple'), 'X-WR-TIMEZONE:Asia/Kolkata');
    keys.sort(function (a, b) { var A = a.split('-').map(Number), B = b.split('-').map(Number); return (A[0] - B[0]) || (A[1] - B[1]) || (A[2] - B[2]); });
    keys.forEach(function (k) {
      var parts = k.split('-').map(Number), y = parts[0], m = parts[1], d = parts[2], info = P.dayInfo(y, m, d), tm = info.tamil;
      ev[k].forEach(function (e, idx) {
        if (!e.cat || picked.indexOf(e.cat) < 0) return;
        var nx = new Date(Date.UTC(y, m - 1, d + 1));
        var desc = tm.day + ' ' + N.monthTa[tm.month] + ' ' + e.ta + '\n' + N.monthEn[tm.month] + ' ' + tm.day + ' – ' + e.en +
          '\nதளவாய்பட்டிணம் சிவன் குரு கோயில் · Dalavoipattinam Sivan Guru Temple\ndalavoisivangurutemple.org\nகணக்கிடப்பட்ட தேதி; கோயில் பஞ்சாங்கமே இறுதி. Calculated date; the temple almanac prevails.';
        L.push('BEGIN:VEVENT', 'UID:' + e.cat + '-' + ymd(y, m, d) + '-' + idx + '@dalavoisivangurutemple.org', 'DTSTAMP:' + stamp,
          'DTSTART;VALUE=DATE:' + ymd(y, m, d), 'DTEND;VALUE=DATE:' + ymd(nx.getUTCFullYear(), nx.getUTCMonth() + 1, nx.getUTCDate()),
          'SUMMARY:' + icsEsc(e.ta + ' · ' + e.en), 'DESCRIPTION:' + icsEsc(desc), 'TRANSP:TRANSPARENT', 'END:VEVENT');
        n++;
      });
    });
    L.push('END:VCALENDAR');
    return { text: L.map(fold).join('\r\n') + '\r\n', count: n };
  }

  var addWrap = el('div', 'cal-add'), addBtn = el('button', 'btn btn-gold'); addBtn.type = 'button';
  bi(addBtn, 'நாள்காட்டியில் சேர்க்க', 'Add events to my calendar');
  addWrap.appendChild(addBtn);
  var addHint = el('p', 'cal-note'); bi(addHint, 'ஆண்டு முழுவதற்குமான நாட்களைத் தேர்ந்தெடுத்து, உங்கள் கைபேசி அல்லது கணினி நாள்காட்டியில் சேர்க்கலாம்.', 'Pick the days you want for the whole year and add them to your phone or computer calendar.');
  addWrap.appendChild(addHint);
  host.appendChild(addWrap);

  var dlg = document.createElement('dialog'); dlg.className = 'cal-dlg'; dlg.setAttribute('aria-labelledby', 'cal-dlg-title');
  var form = el('form'); form.method = 'dialog';
  var h = el('h3'); h.id = 'cal-dlg-title'; bi(h, 'நாள்காட்டியில் சேர்க்க', 'Add events to my calendar'); form.appendChild(h);
  var yr = el('fieldset', 'cal-yr'), yl = el('legend'); bi(yl, 'ஆண்டு', 'Year'); yr.appendChild(yl);
  [today.y, today.y + 1].forEach(function (y, i) {
    var lb = el('label'), r = document.createElement('input'); r.type = 'radio'; r.name = 'cal-year'; r.value = y; r.checked = i === 0;
    lb.appendChild(r); lb.appendChild(el('span', '', ' ' + y)); yr.appendChild(lb);
  });
  form.appendChild(yr);
  var fs = el('fieldset', 'cal-cats'), lg = el('legend'); bi(lg, 'எவற்றைச் சேர்க்க வேண்டும்?', 'What do you want to add?'); fs.appendChild(lg);
  var boxes = [];
  CATS.forEach(function (c) {
    var lb = el('label', 'cal-cat'), cb = document.createElement('input'); cb.type = 'checkbox'; cb.value = c[0]; cb.checked = c[3]; boxes.push(cb);
    lb.appendChild(cb); var t = el('span'); bi(t, c[1], c[2]); lb.appendChild(t); fs.appendChild(lb);
  });
  form.appendChild(fs);
  var all = el('button', 'cal-link'); all.type = 'button'; bi(all, 'அனைத்தையும் தேர்ந்தெடு / நீக்கு', 'Select all / none');
  all.addEventListener('click', function () { var any = boxes.some(function (b) { return !b.checked; }); boxes.forEach(function (b) { b.checked = any; }); sync(); });
  form.appendChild(all);
  var msg = el('p', 'cal-note');
  bi(msg, 'ஐபோன்: கோப்பைத் திறந்து "அனைத்தையும் சேர்" தட்டவும். ஆண்ட்ராய்டு: கோப்பைத் திறந்து Google Calendar-ஐத் தேர்ந்தெடுக்கவும். கணினி: கோப்பைத் திறக்கவும் அல்லது Google Calendar-ல் Import செய்யவும்.',
    'iPhone: open the file and tap Add All. Android: open the file and choose Google Calendar. Laptop: open the file, or import it in Google Calendar.');
  form.appendChild(msg);
  var row = el('div', 'cd-nav');
  var cancel = el('button', 'btn btn-sm btn-line-ink'); cancel.type = 'button'; bi(cancel, 'மூடு', 'Close'); cancel.addEventListener('click', function () { dlg.close(); });
  var go = el('button', 'btn btn-sm btn-gold'); go.type = 'submit'; bi(go, 'சேர்', 'Add');
  row.appendChild(go); row.appendChild(cancel); form.appendChild(row); dlg.appendChild(form); document.body.appendChild(dlg);
  function sync() { go.disabled = !boxes.some(function (b) { return b.checked; }); }
  boxes.forEach(function (b) { b.addEventListener('change', sync); }); sync();
  addBtn.addEventListener('click', function () { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var year = +form.querySelector('input[name=cal-year]:checked').value, picked = boxes.filter(function (b) { return b.checked; }).map(function (b) { return b.value; });
    if (!picked.length) return;
    var res = buildICS(year, picked), blob = new Blob([res.text], { type: 'text/calendar;charset=utf-8' }), url = URL.createObjectURL(blob);
    var a = document.createElement('a'); a.href = url; a.download = 'dalavoi-temple-calendar-' + year + '.ics'; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 4000);
    try { if (window.gtag) window.gtag('event', 'calendar_add', { year: year, categories: picked.length, events: res.count }); } catch (x) {}
    dlg.close();
  });

  drawDaily(); drawMonth();
})();
