/* Napi portugál: timed sessions, progressive path, hearts, unit tests. No build step, no account. */
(function () {
  "use strict";

  const UNITS = window.COURSE;
  const ALL = UNITS.flatMap((u) => u.items);
  const BY_ID = new Map(ALL.map((i) => [i.id, i]));
  const KEY = "napi-portugal-v2";
  const MAX_LVL = 5;
  const LEARNED = 3; // level at which a word counts as learned
  const TEST_HEARTS = 3;
  const SESSION_HEARTS = 5;
  const CORRECT_PER_HEART = 10;

  /* ---------- text ---------- */
  const T = {
    hu: {
      title: "Napi portugál", tagline: "Brazil portugál, lépésről lépésre.",
      streak: (n) => (n === 1 ? "1 napos sorozat" : n + " napos sorozat"),
      xp: "pont", today: "ma", min: "perc",
      length: "Mennyi ideig tanulsz?", minutes: (n) => n + " perc",
      continue: "Folytatás", start: "Kezdés", practice: "Gyakorlás", test: "Teszt", review: "Gyenge szavak átismétlése",
      reviewSub: "A legtöbbet hibázott szavak, minden leckéből.",
      path: "Tanösvény", locked: "Zárolva", passed: "Teljesítve", words: (a, b) => a + " / " + b + " szó",
      ready: "Készen állsz a tesztre.", testHint: "A teszt átengedi a következő leckére.",
      lang: "Felület", pair: "Szópár", pairHu: "Portugál és magyar", pairEn: "Portugál és angol",
      installTitle: "iPhone kezdőképernyő", install: ["Nyisd meg Safariban.", "Koppints a Megosztás ikonra.", "Válaszd: Hozzáadás a kezdőképernyőhöz.", "Az első megnyitás legyen wifin, utána offline is megy."],
      rules: "Így működik",
      rulesList: ["Az idő lejártáig új és régi szavakat gyakorolsz, egyre nehezebb feladatokkal.", "5 életed van. Minden hiba egyet visz el, minden 10 jó válasz egyet visszaad.", "Ha elfogy az életed, a kör megismétlődik, a hibás szavakkal az elején.", "Minden lecke végén teszt van. Csak a teszt után nyílik a következő lecke."],
      introTitle: "Új szó", listen: "Hallgasd meg", say: "kb.",
      pTapMeaning: "Mit jelent?", pTapPt: "Hogy mondod portugálul?", pListen: "Hallgasd, és válaszd ki.",
      pMatch: "Kösd össze.", pType: "Írd le portugálul.", pTypeListen: "Hallgasd, és írd le.", pBuild: "Állítsd össze a mondatot.",
      typeHint: "Ékezet nélkül is jó.", placeholder: "írd ide", check: "Ellenőrzés", next: "Tovább", gotIt: "Értem",
      good: ["Így van!", "Szép!", "Pontosan!", "Remek!"], bad: "A helyes válasz:", almost: "Majdnem.",
      quit: "Kilépsz? A kör eredménye elvész.", quitYes: "Kilépés",
      doneTitle: "Kör kész!", doneSub: "Szép munka.", failTitle: "Elfogyott az életed", failSub: "Semmi baj, ez a tanulás része. Ismételd meg, a hibás szavakkal kezdünk.",
      testPass: "Teszt sikeres!", testPassSub: "A következő lecke nyitva.", testFail: "A teszt még nem sikerült", testFailSub: "Gyakorolj még egy kört, aztán próbáld újra.",
      accuracy: "Pontosság", time: "Idő", earned: "Pont", missed: "Ezeket gyakorold még", again: "Még egy kör", retry: "Újra", home: "Kezdőlap",
      allDone: "Minden leckét teljesítettél. Gratulálok!", readyNote: "Ez a lecke kész a tesztre.",
      topicWord: "szó", hearts: "élet",
    },
    en: {
      title: "Daily Portuguese", tagline: "Brazilian Portuguese, step by step.",
      streak: (n) => (n === 1 ? "1 day streak" : n + " day streak"),
      xp: "XP", today: "today", min: "min",
      length: "How long do you want to study?", minutes: (n) => n + " min",
      continue: "Continue", start: "Start", practice: "Practice", test: "Test", review: "Review weak words",
      reviewSub: "The words you miss most, from every lesson.",
      path: "Learning path", locked: "Locked", passed: "Passed", words: (a, b) => a + " / " + b + " words",
      ready: "You are ready for the test.", testHint: "Passing the test opens the next lesson.",
      lang: "Interface", pair: "Word pair", pairHu: "Portuguese and Hungarian", pairEn: "Portuguese and English",
      installTitle: "iPhone home screen", install: ["Open this page in Safari.", "Tap the Share button.", "Tap Add to Home Screen.", "Open it once on wifi, after that it works offline."],
      rules: "How it works",
      rulesList: ["Until the time is up you practice new and old words, with harder exercises as you improve.", "You have 5 hearts. Every mistake costs one, every 10 correct answers gives one back.", "If you run out of hearts the round repeats, starting with the words you missed.", "Every lesson ends with a test. The next lesson opens only after you pass it."],
      introTitle: "New word", listen: "Hear it", say: "say",
      pTapMeaning: "What does this mean?", pTapPt: "How do you say it in Portuguese?", pListen: "Listen and choose.",
      pMatch: "Match the pairs.", pType: "Type it in Portuguese.", pTypeListen: "Listen and type what you hear.", pBuild: "Build the sentence.",
      typeHint: "Accents are optional.", placeholder: "type here", check: "Check", next: "Continue", gotIt: "Got it",
      good: ["That's right!", "Nice!", "Exactly!", "Great!"], bad: "The right answer:", almost: "Almost.",
      quit: "Quit? This round's progress is lost.", quitYes: "Quit",
      doneTitle: "Round complete!", doneSub: "Nice work.", failTitle: "Out of hearts", failSub: "No problem, that is part of learning. Repeat the round, we start with the words you missed.",
      testPass: "Test passed!", testPassSub: "The next lesson is open.", testFail: "Not passed yet", testFailSub: "Practice one more round, then try again.",
      accuracy: "Accuracy", time: "Time", earned: "XP", missed: "Keep practicing these", again: "Another round", retry: "Try again", home: "Home",
      allDone: "You finished every lesson. Congratulations!", readyNote: "This lesson is ready for the test.",
      topicWord: "word", hearts: "hearts",
    },
  };

  /* ---------- state ---------- */
  const dayKey = (d = new Date()) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const defaults = () => ({ v: 2, ui: "hu", pair: "hu", minutes: 15, xp: 0, streak: 0, lastDay: null, items: {}, passed: {}, days: {} });
  let S = load();
  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY));
      if (raw && raw.v === 2) return { ...defaults(), ...raw };
    } catch (e) { /* private mode */ }
    return defaults();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } }
  const t = () => T[S.ui];
  const meaning = (i) => (S.pair === "hu" ? i.hu : i.en);
  const st = (id) => S.items[id] || { lvl: 0, seen: false, right: 0, wrong: 0 };
  const day = () => S.days[dayKey()] || { sec: 0, correct: 0 };

  function streakNow() {
    if (!S.lastDay) return 0;
    const y = new Date(); y.setDate(y.getDate() - 1);
    return S.lastDay === dayKey() || S.lastDay === dayKey(y) ? S.streak : 0;
  }
  function touchDay() {
    const k = dayKey();
    if (S.lastDay === k) return;
    const y = new Date(); y.setDate(y.getDate() - 1);
    S.streak = S.lastDay === dayKey(y) ? S.streak + 1 : 1;
    S.lastDay = k;
  }

  /* ---------- course logic ---------- */
  const unitIndex = (id) => UNITS.findIndex((u) => u.id === id);
  const unlocked = (i) => i === 0 || !!S.passed[UNITS[i - 1].id];
  const currentUnit = () => UNITS.find((u, i) => unlocked(i) && !S.passed[u.id]) || null;
  const learnedCount = (u) => u.items.filter((i) => st(i.id).lvl >= LEARNED).length;
  const readyForTest = (u) => learnedCount(u) >= Math.ceil(u.items.length * 0.8);

  /* ---------- helpers ---------- */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const rnd = (n) => Math.floor(Math.random() * n);
  const pick = (a) => a[rnd(a.length)];
  const shuffle = (a) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = rnd(i + 1); [r[i], r[j]] = [r[j], r[i]]; } return r; };
  const norm = (s) => s.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/[?!.,;:'"’„”«»]/g, "").replace(/\s+/g, " ").trim();
  const tokens = (i) => i.pt.split(" ");

  let voices = [];
  function speak(text) {
    try {
      const ss = window.speechSynthesis;
      if (!ss) return;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "pt-BR"; u.rate = 0.9;
      voices = voices.length ? voices : ss.getVoices();
      const v = voices.find((x) => x.lang.toLowerCase().startsWith("pt-br")) || voices.find((x) => x.lang.toLowerCase().startsWith("pt"));
      if (v) u.voice = v;
      ss.cancel(); ss.speak(u);
    } catch (e) { /* no audio */ }
  }
  try { window.speechSynthesis && (window.speechSynthesis.onvoiceschanged = () => { voices = window.speechSynthesis.getVoices(); }); } catch (e) { /* ignore */ }

  /* ---------- exercise factory ---------- */
  function distractors(item, n, pool) {
    const same = shuffle((pool || ALL).filter((i) => i.unit === item.unit && i.id !== item.id));
    const rest = shuffle(ALL.filter((i) => i.unit !== item.unit));
    const out = [];
    const sameCount = Math.min(same.length, Math.ceil(n / 2));
    out.push(...same.slice(0, sameCount));
    for (const i of rest) { if (out.length >= n) break; out.push(i); }
    for (const i of same.slice(sameCount)) { if (out.length >= n) break; out.push(i); }
    return out.slice(0, n);
  }
  const choiceSet = (item, n = 4) => shuffle([item, ...distractors(item, n - 1)]).map((i) => i.id);

  function build(item, kind, pool) {
    const base = { itemId: item.id, kind, done: false };
    if (kind === "intro") return base;
    if (kind === "tapP2M" || kind === "listen") return { ...base, choices: choiceSet(item), picked: null, fresh: false };
    if (kind === "tapM2P") return { ...base, choices: choiceSet(item), picked: null };
    if (kind === "type" || kind === "typeListen") return { ...base, value: "" };
    if (kind === "build") {
      const toks = tokens(item);
      const extra = shuffle(ALL.filter((i) => i.id !== item.id).flatMap((i) => tokens(i)).filter((w) => !toks.includes(w))).slice(0, Math.min(3, Math.max(2, toks.length)));
      return { ...base, bank: shuffle([...toks.map((w, k) => ({ w, k })), ...extra.map((w, k) => ({ w, k: 100 + k }))]), chosen: [] };
    }
    if (kind === "match") {
      const others = shuffle((pool || ALL).filter((i) => i.id !== item.id && st(i.id).seen)).slice(0, 3);
      const set = [item, ...others];
      if (set.length < 3) return build(item, "tapM2P", pool);
      return { ...base, left: shuffle(set.map((i) => i.id)), right: shuffle(set.map((i) => i.id)), sel: null, got: [], slips: 0 };
    }
    return base;
  }

  function freshEx(item) { return { ...build(item, "tapP2M"), fresh: true }; }

  function kindFor(item, hard) {
    const lvl = hard ? Math.max(2, st(item.id).lvl) : st(item.id).lvl;
    const n = tokens(item).length;
    if (lvl <= 0) return pick(["listen", "tapM2P", "listen"]);
    if (lvl === 1) return pick(n >= 3 ? ["build", "match", "tapM2P", "listen"] : ["match", "tapM2P", "listen", "type"]);
    if (lvl === 2) return pick(n >= 2 ? ["type", "build", "typeListen", "match"] : ["type", "typeListen", "match"]);
    return pick(n >= 3 ? ["typeListen", "build", "type"] : ["typeListen", "type"]);
  }

  /* ---------- session ---------- */
  let sess = null; // active session
  let view = "home";
  let timer = null;

  function startSession(mode, unitId) {
    const u = UNITS.find((x) => x.id === unitId) || null;
    sess = {
      mode, unit: u, targetSec: S.minutes * 60, elapsed: 0, asked: 0, right: 0, wrong: 0,
      hearts: mode === "test" ? TEST_HEARTS : SESSION_HEARTS, maxHearts: mode === "test" ? TEST_HEARTS : SESSION_HEARTS, streakToHeart: 0,
      xp: 0, missed: new Set(), retry: [], introQ: [], recent: [], queue: [], ex: null, feedback: null, status: "active", introduced: new Set(),
    };
    if (mode === "test") {
      sess.queue = shuffle(u.items).slice(0, 12);
    } else if (mode === "practice" && u) {
      u.items.forEach((i) => { if (st(i.id).seen) sess.introduced.add(i.id); });
    }
    sess.ex = nextExercise();
    if (!sess.ex) { sess = null; return; }
    view = "session";
    clearInterval(timer);
    timer = setInterval(tick, 1000);
    render();
    autoSpeak();
  }

  function tick() {
    if (!sess || sess.status !== "active" || document.visibilityState !== "visible") return;
    sess.elapsed += 1;
    const d = day(); d.sec += 1; S.days[dayKey()] = d;
    if (sess.elapsed % 10 === 0) save();
    const bar = document.getElementById("timebar");
    if (bar) bar.style.width = Math.min(100, (sess.elapsed / sess.targetSec) * 100) + "%";
    const lab = document.getElementById("timelabel");
    if (lab) lab.textContent = fmt(Math.max(0, sess.targetSec - sess.elapsed));
  }
  const fmt = (s) => Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");

  function poolItems() {
    if (sess.mode === "review") return ALL.filter((i) => st(i.id).seen);
    return sess.unit.items.filter((i) => sess.introduced.has(i.id));
  }

  function weightedPick(items) {
    const last = sess.recent.slice(-2);
    let cand = items.filter((i) => !last.includes(i.id));
    if (!cand.length) cand = items;
    const w = cand.map((i) => { const s = st(i.id); return Math.max(1, 6 - s.lvl) + Math.min(4, s.wrong); });
    let r = Math.random() * w.reduce((a, b) => a + b, 0);
    for (let k = 0; k < cand.length; k++) { r -= w[k]; if (r <= 0) return cand[k]; }
    return cand[cand.length - 1];
  }

  function nextExercise() {
    if (!sess) return null;
    if (sess.mode === "test") {
      const it = sess.queue.shift();
      return it ? build(it, kindFor(it, true), sess.unit.items) : null;
    }
    // missed items come back a few exercises later
    if (sess.retry.length && sess.retry[0].at <= sess.asked) {
      const item = BY_ID.get(sess.retry.shift().id);
      return build(item, "tapM2P");
    }
    if (sess.mode === "review") {
      const p = poolItems().filter((i) => st(i.id).lvl < 5);
      const items = p.length >= 3 ? p : poolItems();
      if (!items.length) return null;
      const it = weightedPick(items);
      return build(it, kindFor(it), items);
    }
    // practice: introduce new words in small batches
    if (sess.introQ.length) return freshEx(BY_ID.get(sess.introQ.shift()));
    const pool = poolItems();
    const learning = pool.filter((i) => st(i.id).lvl < 4);
    const fresh = sess.unit.items.filter((i) => !sess.introduced.has(i.id));
    if (fresh.length && learning.length < 4) {
      const batch = fresh.slice(0, pool.length === 0 ? 3 : 2);
      batch.forEach((i) => sess.introduced.add(i.id));
      sess.introQ = batch.map((i) => i.id);
      return freshEx(BY_ID.get(sess.introQ.shift()));
    }
    // 25% spaced review of earlier units
    const idx = unitIndex(sess.unit.id);
    const older = ALL.filter((i) => unitIndex(i.unit) < idx && st(i.id).seen && st(i.id).lvl < 5);
    let it;
    if (older.length >= 3 && Math.random() < 0.25) it = weightedPick(older);
    else it = weightedPick(pool.length ? pool : sess.unit.items);
    const poolForMatch = pool.length >= 3 ? pool : ALL.filter((i) => st(i.id).seen);
    return build(it, kindFor(it), poolForMatch);
  }

  function grade(ok, ids) {
    if (!sess || sess.ex.done) return;
    const ex = sess.ex;
    ex.done = true;
    ids.forEach((id) => {
      const s = { ...st(id) };
      s.seen = true;
      if (ex.fresh) { s.lvl = ok ? 1 : 0; }
      else if (ok) { s.lvl = Math.min(MAX_LVL, s.lvl + 1); s.right = (s.right || 0) + 1; }
      else { s.lvl = Math.max(0, s.lvl - 1); s.wrong = (s.wrong || 0) + 1; }
      S.items[id] = s;
      sess.recent.push(id);
    });
    sess.asked += 1;
    if (ex.fresh) {
      const it = BY_ID.get(ex.itemId);
      if (!ok) sess.retry.push({ id: ex.itemId, at: sess.asked + 3 });
      sess.feedback = { ok, text: it.pt + ": " + meaning(it) };
    } else if (ok) {
      sess.right += 1;
      const gain = sess.mode === "test" ? 15 : 10;
      sess.xp += gain; S.xp += gain;
      const d = day(); d.correct += 1; S.days[dayKey()] = d;
      if (d.correct >= 5) touchDay();
      sess.streakToHeart += 1;
      if (sess.mode !== "test" && sess.streakToHeart >= CORRECT_PER_HEART) { sess.streakToHeart = 0; if (sess.hearts < sess.maxHearts) sess.hearts += 1; }
      sess.feedback = { ok: true, text: pick(t().good) };
      if (["listen", "tapM2P", "type", "typeListen", "build"].includes(ex.kind)) sess.feedback.text += " " + BY_ID.get(ex.itemId).pt + ": " + meaning(BY_ID.get(ex.itemId));
    } else {
      sess.wrong += 1;
      sess.hearts -= 1;
      ids.forEach((id) => sess.missed.add(id));
      if (sess.mode === "practice" && ex.kind !== "match") sess.retry.push({ id: ids[0], at: sess.asked + 3 });
      sess.feedback = { ok: false, text: t().bad + " " + answerText(ex) };
    }
    save();
    render();
  }

  function answerText(ex) {
    const it = BY_ID.get(ex.itemId);
    if (ex.kind === "tapP2M" || ex.kind === "listen") return meaning(it) + " (" + it.pt + ")";
    if (ex.kind === "match") return "";
    return it.pt;
  }

  function advance() {
    if (!sess) return;
    sess.feedback = null;
    if (sess.hearts <= 0) return finish("fail");
    if (sess.mode === "test") {
      const nx = nextExercise();
      if (!nx) return finish("pass");
      sess.ex = nx;
    } else {
      if (sess.elapsed >= sess.targetSec && !sess.retry.length) return finish("done");
      if (sess.elapsed >= sess.targetSec + 90) return finish("done");
      const nx = nextExercise();
      if (!nx) return finish("done");
      sess.ex = nx;
    }
    render(); autoSpeak();
  }

  function finish(result) {
    clearInterval(timer);
    sess.status = result;
    if (result === "pass") {
      const stars = sess.wrong === 0 ? 3 : sess.wrong === 1 ? 2 : 1;
      S.passed[sess.unit.id] = Math.max(S.passed[sess.unit.id] || 0, stars);
      sess.unit.items.forEach((i) => { const s = st(i.id); if (s.lvl < LEARNED) S.items[i.id] = { ...s, seen: true, lvl: LEARNED }; });
      touchDay();
    } else if (result === "done" && sess.right >= 5) touchDay();
    save();
    view = "result";
    render();
  }

  function quit() {
    clearInterval(timer);
    save();
    sess = null; view = "home"; render();
  }

  function autoSpeak() {
    if (!sess || !sess.ex) return;
    const ex = sess.ex, it = BY_ID.get(ex.itemId);
    if (["tapP2M", "listen", "typeListen"].includes(ex.kind)) setTimeout(() => speak(it.pt), 120);
  }

  /* ---------- rendering ---------- */
  const app = document.getElementById("root");

  function render() {
    document.documentElement.lang = S.ui;
    app.innerHTML = view === "session" ? renderSession() : view === "result" ? renderResult() : renderHome();
    if (view === "session") {
      const inp = app.querySelector(".type-input");
      if (inp && !sess.ex.done) inp.focus({ preventScroll: true });
      const cont = app.querySelector("[data-act=next]");
      if (cont) cont.focus({ preventScroll: true });
    }
    window.scrollTo(0, 0);
  }

  function renderHome() {
    const x = t();
    const cur = currentUnit();
    const d = day();
    const seenAny = ALL.some((i) => st(i.id).seen);
    const weak = ALL.filter((i) => st(i.id).seen && st(i.id).lvl < 4).length;
    const units = UNITS.map((u, i) => {
      const open = unlocked(i), done = S.passed[u.id], isCur = cur && cur.id === u.id;
      const n = learnedCount(u), pct = Math.round((n / u.items.length) * 100);
      const stars = done ? "★".repeat(done) + "☆".repeat(3 - done) : "";
      return `<li class="unit ${open ? "" : "locked"} ${isCur ? "current" : ""} ${done ? "passed" : ""}">
        <div class="unit-head"><span class="unit-icon" aria-hidden="true">${open ? u.icon : "🔒"}</span>
          <div class="unit-title"><strong>${i + 1}. ${esc(S.ui === "hu" ? u.hu : u.en)}</strong>
          <span class="quiet">${open ? x.words(n, u.items.length) : x.locked}${done ? " · " + x.passed : ""}</span></div>
          <span class="stars" aria-hidden="true">${stars}</span></div>
        ${open ? `<div class="meter"><span style="width:${pct}%"></span></div>
        <div class="unit-actions"><button class="btn small" data-act="practice" data-unit="${u.id}">${x.practice}</button>
        ${done ? "" : `<button class="btn small ${readyForTest(u) ? "gold" : ""}" data-act="test" data-unit="${u.id}">${x.test}</button>`}</div>
        ${isCur && readyForTest(u) ? `<p class="note">${x.ready}</p>` : ""}` : ""}
      </li>`;
    }).join("");
    return `<main class="app">
      <header class="top"><div><p class="mark">Brasil</p><h1>${x.title}</h1><p class="tagline">${x.tagline}</p></div>
        <div class="segment" role="group" aria-label="${x.lang}"><button data-act="ui" data-v="hu" aria-pressed="${S.ui === "hu"}">HU</button><button data-act="ui" data-v="en" aria-pressed="${S.ui === "en"}">EN</button></div></header>
      <section class="stats">
        <div><b>🔥 ${streakNow()}</b><span>${x.streak(streakNow()).replace(/^\d+ /, "")}</span></div>
        <div><b>⭐ ${S.xp}</b><span>${x.xp}</span></div>
        <div><b>⏱ ${Math.floor(d.sec / 60)}</b><span>${x.min} ${x.today}</span></div>
      </section>
      <section class="length"><p class="label">${x.length}</p>
        <div class="segment wide" role="group">${[10, 15, 20].map((m) => `<button data-act="minutes" data-v="${m}" aria-pressed="${S.minutes === m}">${x.minutes(m)}</button>`).join("")}</div></section>
      ${cur ? `<button class="primary" data-act="practice" data-unit="${cur.id}">${seenAny ? x.continue : x.start}: ${esc(S.ui === "hu" ? cur.hu : cur.en)}</button>` : `<p class="note">${x.allDone}</p>`}
      ${weak >= 4 ? `<button class="ghost" data-act="review"><strong>${x.review}</strong><span class="quiet">${x.reviewSub}</span></button>` : ""}
      <section><h2>${x.path}</h2><ol class="units">${units}</ol></section>
      <details class="install"><summary>${x.rules}</summary><ul>${x.rulesList.map((r) => `<li>${r}</li>`).join("")}</ul></details>
      <section class="pair-row"><p class="label">${x.pair}</p>
        <button data-act="pair" data-v="hu" aria-pressed="${S.pair === "hu"}">${x.pairHu}</button><button data-act="pair" data-v="en" aria-pressed="${S.pair === "en"}">${x.pairEn}</button></section>
      <details class="install"><summary>${x.installTitle}</summary><ol>${x.install.map((r) => `<li>${r}</li>`).join("")}</ol></details>
    </main>`;
  }

  function renderSession() {
    const x = t(), ex = sess.ex, it = BY_ID.get(ex.itemId);
    const isTest = sess.mode === "test";
    const pct = isTest ? ((12 - sess.queue.length - 1) / Math.min(12, sess.unit.items.length)) * 100 : Math.min(100, (sess.elapsed / sess.targetSec) * 100);
    const hearts = Array.from({ length: sess.maxHearts }, (_, i) => `<span class="${i < sess.hearts ? "on" : ""}">♥</span>`).join("");
    const label = isTest ? x.test : fmt(Math.max(0, sess.targetSec - sess.elapsed));
    const fb = sess.feedback;
    const body = exerciseView(ex, it);
    const footer = fb ? `<footer class="bar ${fb.ok ? "good" : "bad"}"><p class="fb">${esc(fb.text)}</p><button class="primary" data-act="next">${x.next}</button></footer>`
        : ex.kind === "type" || ex.kind === "typeListen" ? `<footer class="bar"><button class="primary" data-act="submit-type" ${ex.value.trim() ? "" : "disabled"}>${x.check}</button></footer>`
          : ex.kind === "build" ? `<footer class="bar"><button class="primary" data-act="submit-build" ${ex.chosen.length ? "" : "disabled"}>${x.check}</button></footer>` : "";
    return `<main class="app session">
      <header class="sbar"><button class="close" data-act="quit" aria-label="${x.quitYes}">✕</button>
        <div class="track"><span id="timebar" style="width:${pct}%"></span></div>
        <span id="timelabel" class="tlabel">${label}</span><span class="hearts" aria-label="${x.hearts}">${hearts}</span></header>
      <section class="stage">${body}</section>${footer}</main>`;
  }

  const speaker = (text, big = true) => `<button class="speaker ${big ? "" : "mini"}" data-act="say" data-t="${esc(text)}" aria-label="${t().listen}"><svg viewBox="0 0 24 24" aria-hidden="true" class="spk"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4z"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M16.5 9.2a3.6 3.6 0 010 5.6M19 6.5a7 7 0 010 11"/></svg>${big ? `<span>${t().listen}</span>` : ""}</button>`;

  function introView(it) {
    const x = t();
    return `<div class="ex"><p class="kicker">${x.introTitle}</p><p class="emoji">${it.emoji}</p><p class="pt">${esc(it.pt)}</p>
      <p class="meaning">${esc(meaning(it))}</p>${it.hint ? `<p class="hint">${x.say} ${esc(it.hint)}</p>` : ""}${speaker(it.pt)}</div>`;
  }

  function choiceBtn(ex, id, label, it) {
    const c = BY_ID.get(id);
    let cls = "";
    if (ex.done) cls = id === ex.itemId ? "good" : id === ex.picked ? "bad" : "";
    return `<button class="choice ${cls}" data-act="pick" data-id="${id}" ${ex.done ? "disabled" : ""}>${ex.fresh ? `<span class="ce">${c.emoji}</span>` : ""}<span>${esc(label(c))}</span></button>`;
  }

  function exerciseView(ex, it) {
    const x = t();
    if (ex.kind === "tapP2M" || ex.kind === "listen") {
      return `<div class="ex">${ex.fresh ? `<p class="kicker">${x.introTitle}</p>` : ""}<h2>${ex.kind === "listen" ? x.pListen : x.pTapMeaning}</h2>
        ${ex.kind === "tapP2M" ? `${ex.fresh ? `<p class="emoji">${it.emoji}</p>` : ""}<p class="pt">${esc(it.pt)}</p>${ex.fresh ? `<p class="meaning">${esc(meaning(it))}</p>` : ""}${it.hint ? `<p class="hint">${x.say} ${esc(it.hint)}</p>` : ""}` : ""}
        ${speaker(it.pt)}<div class="choices">${ex.choices.map((id) => choiceBtn(ex, id, (c) => meaning(c), it)).join("")}</div></div>`;
    }
    if (ex.kind === "tapM2P") {
      return `<div class="ex"><h2>${x.pTapPt}</h2><p class="pt">${esc(meaning(it))}</p>
        <div class="choices">${ex.choices.map((id) => choiceBtn(ex, id, (c) => c.pt, it)).join("")}</div></div>`;
    }
    if (ex.kind === "type" || ex.kind === "typeListen") {
      const listen = ex.kind === "typeListen";
      return `<div class="ex"><h2>${listen ? x.pTypeListen : x.pType}</h2>
        ${listen ? "" : `<p class="pt">${esc(meaning(it))}</p>`}${speaker(it.pt)}
        <p class="hint">${x.typeHint}</p>
        <input class="type-input ${ex.done ? (norm(ex.value) === norm(it.pt) ? "good" : "bad") : ""}" value="${esc(ex.value)}" placeholder="${x.placeholder}" autocapitalize="none" autocorrect="off" spellcheck="false" enterkeyhint="done" ${ex.done ? "disabled" : ""} /></div>`;
    }
    if (ex.kind === "build") {
      const used = new Set(ex.chosen.map((c) => c.k));
      return `<div class="ex"><h2>${x.pBuild}</h2><p class="pt small">${esc(meaning(it))}</p>${speaker(it.pt, false)}
        <div class="answer-line ${ex.done ? (norm(ex.chosen.map((c) => c.w).join(" ")) === norm(it.pt) ? "good" : "bad") : ""}">${ex.chosen.map((c, i) => `<button class="tile" data-act="unbuild" data-i="${i}" ${ex.done ? "disabled" : ""}>${esc(c.w)}</button>`).join("")}</div>
        <div class="bank">${ex.bank.map((b) => `<button class="tile ${used.has(b.k) ? "used" : ""}" data-act="build" data-k="${b.k}" ${used.has(b.k) || ex.done ? "disabled" : ""}>${esc(b.w)}</button>`).join("")}</div></div>`;
    }
    if (ex.kind === "match") {
      const side = (list, left) => list.map((id) => {
        const c = BY_ID.get(id);
        const got = ex.got.includes(id);
        const sel = left && ex.sel === id;
        return `<button class="choice ${got ? "good" : ""} ${sel ? "picked" : ""}" data-act="${left ? "m-left" : "m-right"}" data-id="${id}" ${got || ex.done ? "disabled" : ""}><span>${esc(left ? c.pt : meaning(c))}</span></button>`;
      }).join("");
      return `<div class="ex"><h2>${x.pMatch}</h2><div class="match"><div class="col">${side(ex.left, true)}</div><div class="col">${side(ex.right, false)}</div></div></div>`;
    }
    return "";
  }

  function renderResult() {
    const x = t();
    const total = sess.right + sess.wrong;
    const acc = total ? Math.round((sess.right / total) * 100) : 0;
    const ok = sess.status !== "fail" && !(sess.mode === "test" && sess.status !== "pass");
    const isTest = sess.mode === "test";
    const title = sess.status === "fail" ? (isTest ? x.testFail : x.failTitle) : isTest ? x.testPass : x.doneTitle;
    const sub = sess.status === "fail" ? (isTest ? x.testFailSub : x.failSub) : isTest ? x.testPassSub : x.doneSub;
    const stars = isTest && ok ? "★".repeat(S.passed[sess.unit.id] || 1) : "";
    const missed = [...sess.missed].map((id) => BY_ID.get(id)).filter(Boolean);
    const ready = !isTest && sess.unit && !S.passed[sess.unit.id] && readyForTest(sess.unit);
    return `<main class="app result">
      <p class="emoji big">${ok ? "🎉" : "💪"}</p><h1>${title}</h1>${stars ? `<p class="stars big">${stars}</p>` : ""}<p class="quiet center">${sub}</p>
      <section class="stats"><div><b>${acc}%</b><span>${x.accuracy}</span></div><div><b>${fmt(sess.elapsed)}</b><span>${x.time}</span></div><div><b>+${sess.xp}</b><span>${x.earned}</span></div></section>
      ${ready ? `<p class="note">${x.readyNote}</p>` : ""}
      ${missed.length ? `<section><h2>${x.missed}</h2><ul class="missed">${missed.map((i) => `<li>${i.emoji} <strong>${esc(i.pt)}</strong> <span class="quiet">${esc(meaning(i))}</span> ${speaker(i.pt, false)}</li>`).join("")}</ul></section>` : ""}
      <div class="actions">
        ${sess.status === "fail" ? `<button class="primary" data-act="retry">${x.retry}</button>`
          : isTest ? "" : `<button class="primary" data-act="retry">${x.again}</button>`}
        ${isTest && sess.status === "pass" ? "" : ""}
        <button class="ghost" data-act="home">${x.home}</button></div></main>`;
  }

  /* ---------- events ---------- */
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (!b || b.disabled) return;
    const a = b.dataset.act;
    const ex = sess && sess.ex;
    if (a === "ui") { S.ui = b.dataset.v; save(); render(); }
    else if (a === "pair") { S.pair = b.dataset.v; save(); render(); }
    else if (a === "minutes") { S.minutes = Number(b.dataset.v); save(); render(); }
    else if (a === "practice") startSession("practice", b.dataset.unit);
    else if (a === "test") startSession("test", b.dataset.unit);
    else if (a === "review") startSession("review", null);
    else if (a === "retry") { const m = sess.mode, u = sess.unit ? sess.unit.id : null; startSession(m, u); }
    else if (a === "home") { sess = null; view = "home"; render(); }
    else if (a === "quit") { if (confirm(t().quit)) quit(); }
    else if (a === "say") speak(b.dataset.t);
    else if (a === "next") advance();
    else if (a === "pick") { ex.picked = b.dataset.id; grade(b.dataset.id === ex.itemId, [ex.itemId]); }
    else if (a === "submit-type") grade(norm(ex.value) === norm(BY_ID.get(ex.itemId).pt), [ex.itemId]);
    else if (a === "build") { const k = Number(b.dataset.k); ex.chosen.push(ex.bank.find((x) => x.k === k)); render(); }
    else if (a === "unbuild") { ex.chosen.splice(Number(b.dataset.i), 1); render(); }
    else if (a === "submit-build") grade(norm(ex.chosen.map((c) => c.w).join(" ")) === norm(BY_ID.get(ex.itemId).pt), [ex.itemId]);
    else if (a === "m-left") { ex.sel = b.dataset.id; speak(BY_ID.get(b.dataset.id).pt); render(); }
    else if (a === "m-right") {
      if (!ex.sel) return;
      if (ex.sel === b.dataset.id) {
        ex.got.push(b.dataset.id); ex.sel = null;
        if (ex.got.length === ex.left.length) grade(ex.slips === 0, ex.left.slice());
        else render();
      } else { ex.slips += 1; ex.sel = null; render(); const m = app.querySelector(".match"); if (m) { m.classList.add("flash"); } }
    }
  });

  document.addEventListener("input", (e) => {
    if (!sess || !e.target.classList.contains("type-input")) return;
    sess.ex.value = e.target.value;
    const btn = app.querySelector("[data-act=submit-type]");
    if (btn) btn.disabled = !sess.ex.value.trim();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || !sess || view !== "session") return;
    const nxt = app.querySelector("[data-act=next]");
    const sub = app.querySelector("[data-act=submit-type]:not([disabled])");
    if (nxt) { e.preventDefault(); nxt.click(); } else if (sub) { e.preventDefault(); sub.click(); }
  });

  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") save(); });

  // expose for tests
  window.__pt = { get S() { return S; }, get sess() { return sess; }, UNITS, BY_ID, norm };

  render();
})();
