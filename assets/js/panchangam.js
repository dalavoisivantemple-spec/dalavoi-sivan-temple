/* Tamil panchangam engine for Dalavoipattinam (no network, no data files).
   Astronomical (Drik) calculation: Sun and Moon positions, Lahiri ayanamsa.
   Accuracy: tithi and nakshatra end times within a few minutes.
   NOTE: temple almanacs that follow the Vakya method can differ by a day on some
   tithis and festivals. The temple's own almanac is the authority. */
(function () {
  'use strict';
  var root = typeof window !== 'undefined' ? window : globalThis;

  var LAT = 10.73, LON = 77.45;          // Dalavoipattinam (approx.)
  var IST = 5.5 / 24;                    // days
  var RAD = Math.PI / 180;
  function norm(x) { x = x % 360; return x < 0 ? x + 360 : x; }
  function sin(d) { return Math.sin(d * RAD); }
  function cos(d) { return Math.cos(d * RAD); }

  /* ---------- Julian day helpers ---------- */
  function jdFromUTCms(ms) { return ms / 86400000 + 2440587.5; }
  function istMidnightJD(y, m, d) { return Date.UTC(y, m - 1, d) / 86400000 + 2440587.5 - IST; }
  function jdToDate(jd) { return new Date((jd - 2440587.5) * 86400000); }

  /* ---------- Sun (Meeus ch. 25, low precision) ---------- */
  function sunLon(jd) {
    var T = (jd - 2451545) / 36525;
    var L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    var M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
    var C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * sin(M) +
            (0.019993 - 0.000101 * T) * sin(2 * M) + 0.000289 * sin(3 * M);
    var tl = L0 + C;
    var om = 125.04 - 1934.136 * T;
    return norm(tl - 0.00569 - 0.00478 * sin(om));
  }

  /* ---------- Moon (Meeus ch. 47, main longitude terms) ---------- */
  var MT = [
    [0,0,1,0,6288774],[2,0,-1,0,1274027],[2,0,0,0,658314],[0,0,2,0,213618],[0,1,0,0,-185116],
    [0,0,0,2,-114332],[2,0,-2,0,58793],[2,-1,-1,0,57066],[2,0,1,0,53322],[2,-1,0,0,45758],
    [0,1,-1,0,-40923],[1,0,0,0,-34720],[0,1,1,0,-30383],[2,0,0,-2,15327],[0,0,1,2,-12528],
    [0,0,1,-2,10980],[4,0,-1,0,10675],[0,0,3,0,10034],[4,0,-2,0,8548],[2,1,-1,0,-7888],
    [2,1,0,0,-6766],[1,0,-1,0,-5163],[1,1,0,0,4987],[2,-1,1,0,4036],[2,0,2,0,3994],
    [4,0,0,0,3861],[2,0,-3,0,3665],[0,1,-2,0,-2689],[2,0,-1,2,-2602],[2,-1,-2,0,2390],
    [1,0,1,0,-2348],[2,-2,0,0,2236],[0,1,2,0,-2120],[0,2,0,0,-2069],[2,-2,-1,0,2048],
    [2,0,1,-2,-1773],[2,0,0,2,-1595],[4,-1,-1,0,1215],[0,0,2,2,-1110],[3,0,-1,0,-892],
    [2,1,1,0,-810],[4,-1,-2,0,759],[0,2,-1,0,-713],[2,2,-1,0,-700],[2,1,-2,0,691],
    [2,-1,0,-2,596],[4,0,1,0,549],[0,0,4,0,537],[4,-1,0,0,520],[1,0,-2,0,-487],
    [2,1,0,-2,-399],[0,0,2,-2,-381],[1,1,1,0,351],[3,0,-2,0,-340],[4,0,-3,0,330],
    [2,-1,2,0,327],[0,2,1,0,-323],[1,1,-1,0,299],[2,0,3,0,294]
  ];
  function moonLon(jd) {
    var T = (jd - 2451545) / 36525;
    var Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T;
    var D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T;
    var M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T;
    var Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T;
    var F = 93.272095 + 483202.0175233 * T - 0.0036539 * T * T;
    var E = 1 - 0.002516 * T - 0.0000074 * T * T;
    var A1 = 119.75 + 131.849 * T, A2 = 53.09 + 479264.29 * T;
    var s = 0, i, t, arg, f;
    for (i = 0; i < MT.length; i++) {
      t = MT[i];
      arg = t[0] * D + t[1] * M + t[2] * Mp + t[3] * F;
      f = Math.abs(t[1]) === 1 ? E : Math.abs(t[1]) === 2 ? E * E : 1;
      s += t[4] * f * sin(arg);
    }
    s += 3958 * sin(A1) + 1962 * sin(Lp - F) + 318 * sin(A2);
    var om = 125.04 - 1934.136 * T;
    return norm(Lp + s / 1e6 - 0.00478 * sin(om));   // apparent (nutation in longitude)
  }

  function ayanamsa(jd) { var T = (jd - 2451545) / 36525; return 23.85306 + 1.396971 * T; }
  function sunSid(jd) { return norm(sunLon(jd) - ayanamsa(jd)); }
  function moonSid(jd) { return norm(moonLon(jd) - ayanamsa(jd)); }
  function elong(jd) { return norm(moonLon(jd) - sunLon(jd)); }

  /* ---------- Sunrise / sunset (local, refraction -0.833 deg) ---------- */
  function sunEvent(y, m, d, rising) {
    var jd0 = istMidnightJD(y, m, d);
    var guess = jd0 + (rising ? 0.25 : 0.75);
    for (var k = 0; k < 4; k++) {
      var T = (guess - 2451545) / 36525;
      var lam = sunLon(guess);
      var eps = 23.4393 - 0.013 * T;
      var dec = Math.asin(sin(eps) * sin(lam)) / RAD;
      var ra = Math.atan2(cos(eps) * sin(lam), cos(lam)) / RAD;
      var L0 = norm(280.46646 + 36000.76983 * T);
      var eot = L0 - ra; eot = ((eot + 180) % 360 + 360) % 360 - 180;   // degrees
      var cosH = (sin(-0.833) - sin(LAT) * sin(dec)) / (cos(LAT) * cos(dec));
      var H = Math.acos(Math.max(-1, Math.min(1, cosH))) / RAD;
      var base = Math.floor(jd0 + IST + 0.5 - 0.5) + 0.5;      // UTC midnight JD of the civil date
      var noonUTC = base + (12 - LON / 15 - eot / 15) / 24;
      guess = noonUTC + (rising ? -1 : 1) * (H / 15) / 24;
    }
    return guess;
  }
  function sunrise(y, m, d) { return sunEvent(y, m, d, true); }
  function sunset(y, m, d) { return sunEvent(y, m, d, false); }

  /* ---------- Root finding: when does f(jd) cross target going forward ---------- */
  function crossing(f, target, jdFrom, spanDays, wrap) {
    // f increases (mod 360). find first jd in [jdFrom, jdFrom+span] where f reaches target.
    var a = jdFrom, b = jdFrom + spanDays, i, mid;
    function diff(jd) { var v = f(jd) - target; v = ((v + 180) % 360 + 360) % 360 - 180; return v; }
    for (i = 0; i < 50; i++) { mid = (a + b) / 2; if (diff(mid) >= 0) b = mid; else a = mid; }
    return (a + b) / 2;
  }

  /* ---------- Names ---------- */
  var N = {
    monthTa: ['சித்திரை','வைகாசி','ஆனி','ஆடி','ஆவணி','புரட்டாசி','ஐப்பசி','கார்த்திகை','மார்கழி','தை','மாசி','பங்குனி'],
    monthEn: ['Chithirai','Vaikasi','Aani','Aadi','Aavani','Purattasi','Aippasi','Karthigai','Margazhi','Thai','Maasi','Panguni'],
    dayTa: ['ஞாயிறு','திங்கள்','செவ்வாய்','புதன்','வியாழன்','வெள்ளி','சனி'],
    dayEn: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    tithiTa: ['பிரதமை','துவிதியை','திருதியை','சதுர்த்தி','பஞ்சமி','சஷ்டி','சப்தமி','அஷ்டமி','நவமி','தசமி','ஏகாதசி','துவாதசி','திரயோதசி','சதுர்த்தசி'],
    tithiEn: ['Prathamai','Dvitiyai','Tritiyai','Chaturthi','Panchami','Sashti','Saptami','Ashtami','Navami','Dasami','Ekadasi','Dvadasi','Thrayodasi','Chaturdasi'],
    nakTa: ['அசுவினி','பரணி','கார்த்திகை','ரோகிணி','மிருகசீரிடம்','திருவாதிரை','புனர்பூசம்','பூசம்','ஆயில்யம்','மகம்','பூரம்','உத்திரம்','அஸ்தம்','சித்திரை','சுவாதி','விசாகம்','அனுஷம்','கேட்டை','மூலம்','பூராடம்','உத்திராடம்','திருவோணம்','அவிட்டம்','சதயம்','பூரட்டாதி','உத்திரட்டாதி','ரேவதி'],
    nakEn: ['Aswini','Bharani','Karthigai','Rohini','Mrigasheersham','Thiruvathirai','Punarpoosam','Poosam','Ayilyam','Magam','Pooram','Uthiram','Hastham','Chithirai','Swathi','Visakam','Anusham','Kettai','Moolam','Pooradam','Uthiradam','Thiruvonam','Avittam','Sathayam','Poorattathi','Uthirattathi','Revathi'],
    yearTa: ['பிரபவ','விபவ','சுக்ல','பிரமோதூத','பிரஜோத்பத்தி','ஆங்கீரச','ஸ்ரீமுக','பவ','யுவ','தாது','ஈஸ்வர','வெகுதான்ய','பிரமாதி','விக்ரம','விஷு','சித்திரபானு','சுபானு','தாரண','பார்த்திப','விய','சர்வசித்து','சர்வதாரி','விரோதி','விகிருதி','கர','நந்தன','விஜய','ஜய','மன்மத','துன்முகி','ஹேவிளம்பி','விளம்பி','விகாரி','சார்வரி','பிலவ','சுபகிருது','சோபகிருது','குரோதி','விசுவாவசு','பராபவ','பிலவங்க','கீலக','சௌமிய','சாதாரண','விரோதிகிருது','பரிதாபி','பிரமாதீச','ஆனந்த','ராட்சச','நள','பிங்கள','காளயுக்தி','சித்தார்த்தி','ரௌத்திரி','துன்மதி','துந்துபி','ருத்ரோத்காரி','ரக்தாட்சி','குரோதன','அட்சய'],
    yearEn: ['Prabhava','Vibhava','Shukla','Pramodoota','Prajotpatti','Angirasa','Srimukha','Bhava','Yuva','Dhatu','Eswara','Vegudhanya','Pramathi','Vikrama','Vishu','Chitrabhanu','Subhanu','Tharana','Parthiva','Viya','Sarvajit','Sarvadhari','Virodhi','Vikruthi','Kara','Nandana','Vijaya','Jaya','Manmatha','Durmukhi','Hevilambi','Vilambi','Vikari','Sarvari','Plava','Subhakritu','Sobhakritu','Krodhi','Visvavasu','Parabhava','Plavanga','Keelaka','Saumya','Sadharana','Virodhikritu','Paridhabi','Pramadicha','Ananda','Rakshasa','Nala','Pingala','Kalayukthi','Siddharthi','Raudri','Durmathi','Dundubhi','Rudhrodgari','Raktakshi','Krodhana','Akshaya']
  };

  /* ---------- Tamil date for a civil date ---------- */
  var signCache = {};
  function signAtSunset(y, m, d) {
    var key = y * 10000 + m * 100 + d;
    if (signCache[key] === undefined) signCache[key] = Math.floor(sunSid(sunset(y, m, d)) / 30);
    return signCache[key];
  }
  function addDays(y, m, d, n) { var t = new Date(Date.UTC(y, m - 1, d + n)); return [t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()]; }

  function tamilDate(y, m, d) {
    var s = signAtSunset(y, m, d), n = 1, c = [y, m, d], p;
    for (;;) {
      p = addDays(c[0], c[1], c[2], -1);
      if (signAtSunset(p[0], p[1], p[2]) === s) { n++; c = p; if (n > 33) break; } else break;
    }
    // Tamil year starts on Chithirai 1 (mid-April): year start = Gregorian year of the latest Chithirai 1.
    var startY = m > 4 ? y : m < 4 ? y - 1 : (s === 0 ? y : y - 1);
    var idx = ((startY - 1987) % 60 + 60) % 60;
    return { month: s, day: n, yearIdx: idx, yearStart: startY };
  }

  /* ---------- Full panchangam for a civil date ---------- */
  function dayInfo(y, m, d) {
    var srJD = sunrise(y, m, d), ssJD = sunset(y, m, d);
    var dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    var td = tamilDate(y, m, d);

    function tithiAt(jd) { return Math.floor(elong(jd) / 12); }           // 0..29
    function nakAt(jd) { return Math.floor(moonSid(jd) / (360 / 27)); }    // 0..26
    var t0 = tithiAt(srJD), n0 = nakAt(srJD);
    var tEnd = crossing(elong, ((t0 + 1) % 30) * 12, srJD, 1.3);
    var nEnd = crossing(moonSid, ((n0 + 1) % 27) * (360 / 27), srJD, 1.3);
    var t1 = (t0 + 1) % 30, n1 = (n0 + 1) % 27;

    // 8-part division of the day for Rahu Kalam, Yamagandam, Gulikai
    var part = (ssJD - srJD) / 8;
    var RAHU = [8, 2, 7, 5, 6, 4, 3], YAMA = [5, 4, 3, 2, 1, 7, 6], GULI = [7, 6, 5, 4, 3, 2, 1];
    function slot(k) { return [srJD + (k - 1) * part, srJD + k * part]; }

    var noon = (srJD + ssJD) / 2;
    return {
      y: y, m: m, d: d, dow: dow, tamil: td,
      sunrise: srJD, sunset: ssJD,
      tithi: t0, tithiEnd: tEnd, tithiNext: t1,
      nak: n0, nakEnd: nEnd, nakNext: n1,
      tithiNoon: tithiAt(noon), tithiSunset: tithiAt(ssJD + 0.04), tithiMidnight: tithiAt(istMidnightJD(y, m, d) + 1 - 1 / 1440),
      nakSunset: nakAt(ssJD),
      rahu: slot(RAHU[dow]), yama: slot(YAMA[dow]), guli: slot(GULI[dow])
    };
  }

  /* ---------- Observances (calculated; confirm with the temple almanac) ---------- */
  // Events are found for a whole Gregorian year at once so that a tithi or star that
  // spans two sunrises (or is skipped at sunrise) is still marked on exactly one day.
  var yearCache = {};
  function key(y, m, d) { return y + '-' + m + '-' + d; }

  function yearEvents(year) {
    if (yearCache[year]) return yearCache[year];
    var days = [], idxOf = {}, c, k, i;
    var start = new Date(Date.UTC(year - 1, 11, 28)), end = new Date(Date.UTC(year + 1, 0, 3));
    for (c = start; c <= end; c = new Date(c.getTime() + 86400000)) {
      i = dayInfo(c.getUTCFullYear(), c.getUTCMonth() + 1, c.getUTCDate());
      i.nakNoon = Math.floor(moonSid((i.sunrise + i.sunset) / 2) / (360 / 27));
      i.nakEve = Math.floor(moonSid(i.sunset + 1 / 24) / (360 / 27));
      idxOf[key(i.y, i.m, i.d)] = days.length; days.push(i);
    }
    var ev = {};
    function put(i, ta, en, kind, cat) { var kk = key(i.y, i.m, i.d); (ev[kk] = ev[kk] || []).push({ ta: ta, en: en, kind: kind, cat: cat || (kind === 'major' ? 'festival' : kind === 'guru' ? 'guru' : '') }); }
    function inYear(i) { return i.y === year; }

    // Generic "first day" picker: pred(i) true on a run of days -> mark the first day of the run.
    // fallback(i) is used when the thing never holds at the main test point.
    function pickRuns(main, fallback, label) {
      for (k = 1; k < days.length - 1; k++) {
        var cur = days[k], prev = days[k - 1], next = days[k + 1];
        if (main(cur) && !main(prev)) { if (inYear(cur)) label(cur); }
        else if (fallback && !main(cur) && !main(prev) && !main(next) && fallback(cur)) { if (inYear(cur)) label(cur); }
      }
    }
    function tithiRule(T, ta, en, kind, cat) {
      pickRuns(function (x) { return x.tithi === T; }, function (x) { return x.tithiSunset === T; },
        function (x) { put(x, ta, en, kind, cat); });
    }
    function eveRule(T, ta, en, cat) {   // evening observances: tithi present at pradosha time
      pickRuns(function (x) { return x.tithiSunset === T; }, null, function (x) { put(x, ta, en, 'tithi', cat); });
    }
    function everyDay(fn) { for (k = 1; k < days.length - 1; k++) if (inYear(days[k])) fn(days[k], days[k - 1]); }

    // --- recurring ---
    everyDay(function (x) { if (x.dow === 4) put(x, 'வியாழக்கிழமை – குரு வழிபாடு', 'Thursday – Guru worship', 'guru'); });
    tithiRule(29, 'அமாவாசை', 'Amavasai (new moon)', 'tithi', 'amavasai');
    tithiRule(14, 'பௌர்ணமி', 'Pournami (full moon)', 'tithi', 'pournami');
    tithiRule(10, 'வளர்பிறை ஏகாதசி', 'Ekadasi (waxing moon)', 'tithi', 'ekadasi_w');
    tithiRule(25, 'தேய்பிறை ஏகாதசி', 'Ekadasi (waning moon)', 'tithi', 'ekadasi_k');
    tithiRule(5, 'சஷ்டி (முருகன்)', 'Sashti (Murugan)', 'tithi', 'sashti');
    tithiRule(20, 'சஷ்டி (முருகன்)', 'Sashti (Murugan)', 'tithi', 'sashti');
    eveRule(12, 'பிரதோஷம்', 'Pradosham', 'pradosham');
    eveRule(27, 'பிரதோஷம்', 'Pradosham', 'pradosham');
    eveRule(18, 'சங்கடஹர சதுர்த்தி', 'Sankatahara Chaturthi', 'sankatahara');
    pickRuns(function (x) { return x.nakNoon === 2; }, null, function (x) { put(x, 'கார்த்திகை (முருகன் வழிபாடு)', 'Karthigai star (Murugan worship)', 'tithi', 'karthigai'); });
    everyDay(function (x) { if (x.tamil.day === 1) put(x, N.monthTa[x.tamil.month] + ' மாதப் பிறப்பு', N.monthEn[x.tamil.month] + ' month begins', 'month', 'month1'); });
    everyDay(function (x) { if (x.dow === 5 && x.tamil.day <= 7) put(x, N.monthTa[x.tamil.month] + ' மாத முதல் வெள்ளிக்கிழமை', '1st Friday of ' + N.monthEn[x.tamil.month], 'tithi', 'friday1'); });

    // --- fixed by Tamil date ---
    function tamilRule(mo, dy, ta, en) {
      everyDay(function (x) { if (x.tamil.month === mo && x.tamil.day === dy) put(x, ta, en, 'major'); });
    }
    tamilRule(0, 1, 'தமிழ்ப் புத்தாண்டு', 'Tamil New Year');
    tamilRule(9, 1, 'தைப் பொங்கல்', 'Thai Pongal');
    tamilRule(9, 2, 'மாட்டுப் பொங்கல்', 'Mattu Pongal');
    tamilRule(3, 18, 'ஆடிப் பெருக்கு', 'Aadi Perukku');

    // --- by tithi / star within a Tamil month ---
    // test(x) selects candidate days; of candidates close together, mark the one nearest Pournami.
    function festival(test, ta, en, windowDays, nearFull) {
      var cands = [];
      for (k = 1; k < days.length - 1; k++) if (test(days[k])) cands.push(k);
      var g = [], gi, best;
      for (gi = 0; gi < cands.length; gi++) {
        if (g.length && cands[gi] - g[g.length - 1] > windowDays) { flush(); }
        g.push(cands[gi]);
      }
      flush();
      function flush() {
        if (!g.length) return;
        best = g[0];
        if (nearFull) {
          var bd = 99, j;
          for (j = 0; j < g.length; j++) {
            var t = days[g[j]].tithiNoon, dd = Math.abs(t - 14);
            if (t >= 15) dd = 99;                       // waning half: not preferred
            if (dd < bd) { bd = dd; best = g[j]; }
          }
        }
        if (inYear(days[best])) put(days[best], ta, en, 'major');
        g = [];
      }
    }
    festival(function (x) { return x.tamil.month === 4 && x.tithiNoon === 3; }, 'விநாயகர் சதுர்த்தி', 'Vinayagar Chathurthi', 20, false);
    festival(function (x) { return x.tamil.month === 10 && x.tithiMidnight === 28; }, 'மகா சிவராத்திரி', 'Maha Sivarathri', 20, false);
    festival(function (x) { return x.tamil.month === 6 && x.tithi === 28; }, 'தீபாவளி (நரக சதுர்த்தசி)', 'Deepavali (Naraka Chaturdasi)', 60, false);
    festival(function (x) { return x.tamil.month === 5 && (x.tithi === 0 || x.tithiSunset === 0); }, 'நவராத்திரி தொடக்கம்', 'Navaratri begins', 60, false);
    festival(function (x) { return x.tamil.month === 7 && x.nakEve === 2 && x.tithiSunset >= 11 && x.tithiSunset <= 15; }, 'திருக்கார்த்திகை தீபம்', 'Karthigai Deepam', 40, false);
    festival(function (x) { return x.tamil.month === 9 && x.nakNoon === 7 && x.tithiNoon >= 11 && x.tithiNoon <= 14; }, 'தைப்பூசம்', 'Thai Poosam', 20, true);
    festival(function (x) { return x.tamil.month === 1 && x.nakNoon === 15; }, 'வைகாசி விசாகம்', 'Vaikasi Visakam', 20, true);
    festival(function (x) { return x.tamil.month === 11 && x.nakNoon === 11; }, 'பங்குனி உத்திரம்', 'Panguni Uthiram', 20, true);
    festival(function (x) { return x.tamil.month === 8 && x.nakNoon === 5 && x.tithiNoon >= 11 && x.tithiNoon <= 15 && x.tamil.day > 5; }, 'ஆருத்ரா தரிசனம்', 'Arudra Darisanam', 40, true);

    yearCache[year] = ev;
    return ev;
  }
  function eventsFor(y, m, d) { return yearEvents(y)[key(y, m, d)] || []; }

  /* ---------- Formatting helpers (24h to 12h IST) ---------- */
  function istParts(jd) {
    var t = new Date((jd - 2440587.5) * 86400000 + IST * 86400000);
    return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), h: t.getUTCHours(), mi: t.getUTCMinutes() };
  }
  function fmtTime(jd) {
    var p = istParts(jd), h12 = p.h % 12 === 0 ? 12 : p.h % 12;
    return h12 + ':' + (p.mi < 10 ? '0' : '') + p.mi + ' ' + (p.h < 12 ? 'am' : 'pm');
  }
  function tithiName(idx, lang) {
    var pair = idx % 15;
    if (pair === 14) return idx === 14 ? (lang === 'ta' ? 'பௌர்ணமி' : 'Pournami') : (lang === 'ta' ? 'அமாவாசை' : 'Amavasai');
    return (lang === 'ta' ? N.tithiTa : N.tithiEn)[pair];
  }
  function paksha(idx, lang) {
    return idx < 15 ? (lang === 'ta' ? 'வளர்பிறை' : 'Waxing (Shukla)') : (lang === 'ta' ? 'தேய்பிறை' : 'Waning (Krishna)');
  }

  var api = {
    N: N, dayInfo: dayInfo, eventsFor: eventsFor, yearEvents: yearEvents, tamilDate: tamilDate,
    sunLon: sunLon, moonLon: moonLon, ayanamsa: ayanamsa, sunSid: sunSid, moonSid: moonSid,
    sunrise: sunrise, sunset: sunset, fmtTime: fmtTime, istParts: istParts,
    tithiName: tithiName, paksha: paksha, jdFromUTCms: jdFromUTCms, istMidnightJD: istMidnightJD
  };
  root.Panchangam = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
