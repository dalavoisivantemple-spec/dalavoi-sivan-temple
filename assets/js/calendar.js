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
        var tag = ev.filter(function (e) { return e.kind === 'major'; })[0] || ev.filter(function (e) { return e.kind !== 'guru'; })[0];
        if (tag) { var f = el('span', 'f'); bi(f, tag.ta, tag.en); cell.appendChild(f); }
        cell.addEventListener('click', function () { setSel(view.y, view.m, d, false); });
        grid.appendChild(cell);
      })(d);
    }
    bi(legend, 'நாள்காட்டி கணிதக் கணக்கீட்டால் (திருக்கணிதம்) பெறப்பட்டது; தலத்தின் இருப்பிடத்திற்கு ஏற்றது. கோயில் பஞ்சாங்கத்துடன் ஓரிரு நாள் / சில நிமிட வேறுபாடு இருக்கலாம் — பண்டிகை நாட்களுக்கு கோயில் பஞ்சாங்கமே இறுதி.',
      'Calculated astronomically (Drik) for Dalavoipattinam. It can differ from the temple almanac by a day or a few minutes. For festival dates, the temple’s almanac is final.');
  }

  drawDaily(); drawMonth();
})();
