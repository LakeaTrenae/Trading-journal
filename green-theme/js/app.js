let trades = JSON.parse(localStorage.getItem("tj_green") || "[]");
let grade = "";
let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();
let currentDay = null; // YYYY-MM-DD of open day modal

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

document.getElementById("f-date").valueAsDate = new Date();
["f-entry", "f-exit", "f-contracts"].forEach((id) =>
  document.getElementById(id).addEventListener("input", calcPnl),
);

function calcPnl() {
  const e = parseFloat(document.getElementById("f-entry").value) || 0;
  const x = parseFloat(document.getElementById("f-exit").value) || 0;
  const c = parseInt(document.getElementById("f-contracts").value) || 1;
  const el = document.getElementById("f-pnl-calc");
  if (e && x) {
    const p = (x - e) * 100 * c;
    el.value = (p >= 0 ? "+" : "") + "$" + p.toFixed(2);
    el.style.color = p >= 0 ? "var(--win)" : "var(--loss)";
  } else {
    el.value = "";
    el.style.color = "";
  }
}

function goTab(id, btn) {
  document
    .querySelectorAll(".panel")
    .forEach((p) => p.classList.remove("active"));
  document
    .querySelectorAll(".tab")
    .forEach((t) => t.classList.remove("active"));
  document
    .querySelectorAll(".bnav-btn")
    .forEach((t) => t.classList.remove("active"));
  document.getElementById("panel-" + id).classList.add("active");
  // sync both desktop tabs and mobile nav
  document.querySelectorAll(".tab").forEach((t) => {
    if (
      t.getAttribute("onclick") &&
      t.getAttribute("onclick").includes("'" + id + "'")
    )
      t.classList.add("active");
  });
  document.querySelectorAll(".bnav-btn").forEach((t) => {
    if (
      t.getAttribute("onclick") &&
      t.getAttribute("onclick").includes("'" + id + "'")
    )
      t.classList.add("active");
  });
  if (id === "calendar") renderCalendar();
  if (id === "history") renderHistory();
  if (id === "stats") renderStats();
  window.scrollTo(0, 0);
}
function goTabMobile(id, btn) {
  goTab(id, btn);
}

function togglePill(el) {
  el.classList.toggle("on");
}
function toggleRule(el) {
  el.classList.toggle("on");
  el.querySelector(".chk").textContent = el.classList.contains("on") ? "✓" : "";
}
function pickGrade(btn, g) {
  document
    .querySelectorAll(".grade-btn")
    .forEach((b) => (b.className = "grade-btn"));
  btn.classList.add("on-" + g);
  grade = g;
}

function saveTrade() {
  const date = document.getElementById("f-date").value;
  const tick = document.getElementById("f-ticker").value.trim().toUpperCase();
  const dir = document.getElementById("f-direction").value;
  const entry = parseFloat(document.getElementById("f-entry").value);
  const exit = parseFloat(document.getElementById("f-exit").value);
  if (!date || !tick || !dir || !entry || !exit) {
    alert("Fill in: Date, Ticker, Direction, Entry Price, and Exit Price.");
    return;
  }
  const contracts = parseInt(document.getElementById("f-contracts").value) || 1;
  const pnl = (exit - entry) * 100 * contracts;
  const emotions = [...document.querySelectorAll("#emotion-grid .pill.on")].map(
    (b) => b.textContent.trim(),
  );
  const rules = [...document.querySelectorAll(".rule-item.on")].map(
    (r) => r.dataset.rule,
  );
  trades.unshift({
    id: Date.now(),
    date,
    ticker: tick,
    direction: dir,
    strike: document.getElementById("f-strike").value,
    expiry: document.getElementById("f-expiry").value,
    contracts,
    entry,
    exit,
    pnl,
    entryTime: document.getElementById("f-entry-time").value,
    exitTime: document.getElementById("f-exit-time").value,
    setup: [...document.querySelectorAll("#setup-grid .setup-pill.on")].map(
      (b) => b.textContent.trim(),
    ),
    emotions,
    rules,
    grade,
    what: document.getElementById("f-what").value,
    lesson: document.getElementById("f-lesson").value,
    diff: document.getElementById("f-diff").value,
  });
  localStorage.setItem("tj_green", JSON.stringify(trades));
  updateHeader();
  resetForm();
  alert("Trade saved.");
}

function resetForm() {
  [
    "f-ticker",
    "f-strike",
    "f-entry",
    "f-exit",
    "f-pnl-calc",
    "f-what",
    "f-lesson",
    "f-diff",
  ].forEach((id) => (document.getElementById(id).value = ""));
  document.getElementById("f-pnl-calc").style.color = "";
  ["f-direction", "f-expiry", "f-entry-time", "f-exit-time"].forEach(
    (id) => (document.getElementById(id).value = ""),
  );
  document
    .querySelectorAll("#setup-grid .setup-pill.on")
    .forEach((b) => b.classList.remove("on"));
  document.getElementById("f-contracts").value = "1";
  document.getElementById("f-date").valueAsDate = new Date();
  document
    .querySelectorAll(".pill.on")
    .forEach((b) => b.classList.remove("on"));
  document.querySelectorAll(".rule-item.on").forEach((r) => {
    r.classList.remove("on");
    r.querySelector(".chk").textContent = "";
  });
  document
    .querySelectorAll(".grade-btn")
    .forEach((b) => (b.className = "grade-btn"));
  grade = "";
}

// ── BUILD DAY MAP ──
function buildDayMap() {
  const map = {};
  trades.forEach((t) => {
    if (!map[t.date]) map[t.date] = { pnl: 0, count: 0 };
    map[t.date].pnl += t.pnl;
    map[t.date].count++;
  });
  return map;
}

// ── CALENDAR ──
function changeMonth(dir) {
  calMonth += dir;
  if (calMonth > 11) {
    calMonth = 0;
    calYear++;
  }
  if (calMonth < 0) {
    calMonth = 11;
    calYear--;
  }
  renderCalendar();
}

function renderCalendar() {
  document.getElementById("cal-month-label").textContent = MONTHS[calMonth];
  document.getElementById("cal-year-label").textContent = calYear;
  const dayMap = buildDayMap();
  const today = new Date();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  let html = "";
  for (let d = 1; d <= daysInMonth; d++) {
    // on first day, use grid-column-start to offset correctly
    let gridStyle =
      d === 1 && firstDay > 0
        ? ` style="grid-column-start:${firstDay + 1}"`
        : "";
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const isToday =
      today.getFullYear() === calYear &&
      today.getMonth() === calMonth &&
      today.getDate() === d;
    const data = dayMap[dateStr];
    let cls = "cal-day";
    if (isToday) cls += " today";
    let inner = `<div class="cal-day-num">${d}</div>`;
    if (data) {
      const p = data.pnl;
      if (p > 0) cls += " win-day";
      else if (p < 0) cls += " loss-day";
      else cls += " flat-day";
      inner += `<div class="cal-day-pnl">${(p >= 0 ? "+" : "") + "$" + Math.abs(p).toFixed(0)}</div>`;
      inner += `<div class="cal-day-trades">${data.count} trade${data.count !== 1 ? "s" : ""}</div>`;
    }
    // attach click to open day modal
    html += `<div class="${cls}"${gridStyle} onclick="openDayModal('${dateStr}')">${inner}</div>`;
    gridStyle = "";
  }
  document.getElementById("cal-grid").innerHTML = html;
  renderWeekly();
}

// ── WEEKLY SUMMARY ──
function renderWeekly() {
  const dayMap = buildDayMap();
  // get all weeks in current month
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const weeks = [];
  let week = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(calYear, calMonth, d);
    const dow = dateObj.getDay();
    // Monday start for trading weeks
    if (dow === 1 && week.length > 0) {
      weeks.push(week);
      week = [];
    }
    week.push({
      d,
      dateObj,
      dateStr: `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    });
  }
  if (week.length > 0) weeks.push(week);

  if (!weeks.length) {
    document.getElementById("week-cards").innerHTML =
      `<div class="empty" style="padding:30px 0;"><div class="empty-sub">No data for this month</div></div>`;
    return;
  }

  const html = weeks
    .map((wk) => {
      let weekPnl = 0,
        winDays = 0,
        lossDays = 0,
        tradeDays = 0;
      const dots = [];
      // Mon–Fri only
      const tradingDays = wk.filter(
        (day) => day.dateObj.getDay() >= 1 && day.dateObj.getDay() <= 5,
      );
      tradingDays.forEach((day) => {
        const data = dayMap[day.dateStr];
        if (data) {
          tradeDays++;
          weekPnl += data.pnl;
          if (data.pnl > 0) {
            winDays++;
            dots.push("w");
          } else {
            lossDays++;
            dots.push("l");
          }
        } else {
          dots.push("n");
        }
      });
      const weekClass =
        weekPnl > 0 ? "week-win" : weekPnl < 0 ? "week-loss" : "week-flat";
      const pnlClass = weekPnl > 0 ? "w" : weekPnl < 0 ? "l" : "f";
      const firstDay = wk[0];
      const lastDay = wk[wk.length - 1];
      const dateRange = `${MONTHS[calMonth].substring(0, 3)} ${firstDay.d} – ${lastDay.d}`;
      const dotsHtml = dots
        .map((d) => `<div class="week-dot ${d}"></div>`)
        .join("");
      return `<div class="week-card ${weekClass}">
        <div>
          <div class="week-label">Week of</div>
          <div class="week-dates">${dateRange}</div>
          <div class="week-days" style="margin-top:6px;">${dotsHtml}</div>
        </div>
        <div class="week-stats">
          <div class="week-stat"><div class="week-stat-label">Win Days</div><div class="week-stat-val w">${winDays}</div></div>
          <div class="week-stat"><div class="week-stat-label">Loss Days</div><div class="week-stat-val l">${lossDays}</div></div>
          <div class="week-stat"><div class="week-stat-label">Trades</div><div class="week-stat-val">${
            trades.filter((t) => {
              const d = new Date(t.date);
              return (
                d.getFullYear() === calYear &&
                d.getMonth() === calMonth &&
                wk.some((w) => w.dateStr === t.date)
              );
            }).length
          }</div></div>
          <div>
            <div class="week-stat-label" style="text-align:right;">Week P&L</div>
            <div class="week-pnl ${pnlClass}">${tradeDays === 0 ? "—" : (weekPnl >= 0 ? "+" : "") + "$" + Math.abs(weekPnl).toFixed(2)}</div>
          </div>
        </div>
      </div>`;
    })
    .join("");
  document.getElementById("week-cards").innerHTML =
    html ||
    `<div class="empty" style="padding:30px 0;"><div class="empty-sub">Log trades to see weekly breakdown</div></div>`;
}

// ── HISTORY ──
function renderHistory() {
  const list = document.getElementById("trade-list");
  document.getElementById("log-count").textContent =
    trades.length + " trade" + (trades.length !== 1 ? "s" : "") + " logged";
  if (!trades.length) {
    list.innerHTML = `<div class="empty"><div class="empty-icon">📊</div><div class="empty-title">No Trades Yet</div><div class="empty-sub">Head to Log Trade and start building your record</div></div>`;
    return;
  }
  list.innerHTML = trades
    .map((t) => {
      const pc = t.pnl > 0 ? "w" : t.pnl < 0 ? "l" : "b";
      const ps = (t.pnl >= 0 ? "+" : "") + "$" + t.pnl.toFixed(2);
      const cc = t.pnl > 0 ? "is-win" : t.pnl < 0 ? "is-loss" : "";
      const eTags = (t.emotions || [])
        .map((e) => `<span class="ttag ttag-emotion">${e}</span>`)
        .join("");
      const rTags = (t.rules || [])
        .slice(0, 3)
        .map((r) => `<span class="ttag ttag-rule">${r}</span>`)
        .join("");
      const gc = t.grade === "A" ? "A" : t.grade === "B" ? "B" : "";
      const gTag = t.grade
        ? `<span class="ttag ttag-grade ${gc}">Grade ${t.grade}</span>`
        : "";
      return `<div class="trade-card ${cc}">
        <div class="tc-top">
          <div style="display:flex;align-items:center;gap:8px;"><span class="tc-ticker">${t.ticker}</span><span class="tc-dir ${t.direction === "CALL" ? "call" : "put"}">${t.direction}</span></div>
          <div style="display:flex;align-items:center;gap:8px;"><span class="tc-pnl ${pc}">${ps}</span><button class="del-btn edit-btn" onclick="openEditModal(${t.id})" title="Edit trade">✎</button><button class="del-btn" onclick="delTrade(${t.id})" title="Delete trade">✕</button></div>
        </div>
        <div class="tc-meta">
          <div class="tc-meta-item"><div class="tc-meta-lbl">Date</div><div class="tc-meta-val">${t.date}</div></div>
          ${t.entryTime ? `<div class="tc-meta-item"><div class="tc-meta-lbl">In</div><div class="tc-meta-val">${t.entryTime}</div></div>` : ""}
          ${t.exitTime ? `<div class="tc-meta-item"><div class="tc-meta-lbl">Out</div><div class="tc-meta-val">${t.exitTime}</div></div>` : ""}
          ${t.strike ? `<div class="tc-meta-item"><div class="tc-meta-lbl">Strike</div><div class="tc-meta-val">$${t.strike}</div></div>` : ""}
          ${t.expiry ? `<div class="tc-meta-item"><div class="tc-meta-lbl">Expiry</div><div class="tc-meta-val">${t.expiry}</div></div>` : ""}
          <div class="tc-meta-item"><div class="tc-meta-lbl">Qty</div><div class="tc-meta-val">${t.contracts}x</div></div>
          <div class="tc-meta-item"><div class="tc-meta-lbl">Entry</div><div class="tc-meta-val">$${t.entry.toFixed(2)}</div></div>
          <div class="tc-meta-item"><div class="tc-meta-lbl">Exit</div><div class="tc-meta-val">$${t.exit.toFixed(2)}</div></div>
          ${t.setup && (Array.isArray(t.setup) ? t.setup.length : t.setup) ? `<div class="tc-meta-item"><div class="tc-meta-lbl">Setup</div><div class="tc-meta-val">${Array.isArray(t.setup) ? t.setup.join(", ") : t.setup}</div></div>` : ""}
        </div>
        ${gTag || rTags || eTags ? `<div class="tc-tags">${gTag}${rTags}${eTags}</div>` : ""}
        ${t.what || t.lesson || t.diff ? `<div class="tc-notes">${t.what ? `<strong>What happened:</strong> ${t.what}<br>` : ""}${t.lesson ? `<strong>Lesson:</strong> ${t.lesson}<br>` : ""}${t.diff ? `<strong>Next time:</strong> ${t.diff}` : ""}</div>` : ""}
      </div>`;
    })
    .join("");
}

// ── STATS ──
function renderStats() {
  const n = trades.length;
  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl < 0);
  const pnl = trades.reduce((s, t) => s + t.pnl, 0);
  const wr = n ? Math.round((wins.length / n) * 100) : null;
  const avgW = wins.length
    ? (wins.reduce((s, t) => s + t.pnl, 0) / wins.length).toFixed(2)
    : null;
  const avgL = losses.length
    ? Math.abs(losses.reduce((s, t) => s + t.pnl, 0) / losses.length).toFixed(2)
    : null;
  document.getElementById("s-total").textContent = n;
  const we = document.getElementById("s-wr");
  we.textContent = wr !== null ? wr + "%" : "—";
  we.className = "stat-val " + (wr >= 50 ? "win" : wr >= 40 ? "nude" : "loss");
  const pe = document.getElementById("s-pnl");
  pe.textContent = (pnl >= 0 ? "+" : "") + "$" + pnl.toFixed(2);
  pe.className = "stat-val " + (pnl >= 0 ? "win" : "loss");
  document.getElementById("s-wl").textContent =
    wins.length + "W / " + losses.length + "L";
  document.getElementById("s-avg").textContent =
    avgW && avgL ? `+$${avgW} / -$${avgL}` : "—";
  const gc = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  trades.forEach((t) => {
    if (t.grade) gc[t.grade]++;
  });
  const gmax = Math.max(...Object.values(gc), 1);
  const gcols = { A: "win", B: "grn", C: "nude", D: "loss", F: "loss" };
  document.getElementById("bd-grade").innerHTML = Object.entries(gc)
    .map(
      ([g, c]) =>
        `<div class="bar-row"><div class="bar-lbl">Grade ${g}</div><div class="bar-track"><div class="bar-fill ${gcols[g]}" style="width:${(c / gmax) * 100}%"></div></div><div class="bar-n">${c}</div></div>`,
    )
    .join("");
  const sc = {};
  trades.forEach((t) => {
    const setups = Array.isArray(t.setup) ? t.setup : t.setup ? [t.setup] : [];
    setups.forEach((s) => {
      if (s) sc[s] = (sc[s] || 0) + 1;
    });
  });
  const ss = Object.entries(sc).sort((a, b) => b[1] - a[1]);
  const smax = ss.length ? ss[0][1] : 1;
  document.getElementById("bd-setup").innerHTML = ss.length
    ? ss
        .map(
          ([s, c]) =>
            `<div class="bar-row"><div class="bar-lbl">${s.substring(0, 16)}</div><div class="bar-track"><div class="bar-fill grn" style="width:${(c / smax) * 100}%"></div></div><div class="bar-n">${c}</div></div>`,
        )
        .join("")
    : '<div class="no-data">Log trades to see data</div>';
  const ec = {};
  trades.forEach((t) =>
    (t.emotions || []).forEach((e) => {
      ec[e] = (ec[e] || 0) + 1;
    }),
  );
  const es = Object.entries(ec)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const emax = es.length ? es[0][1] : 1;
  document.getElementById("bd-emotion").innerHTML = es.length
    ? es
        .map(
          ([e, c]) =>
            `<div class="bar-row"><div class="bar-lbl">${e.substring(0, 14)}</div><div class="bar-track"><div class="bar-fill nude" style="width:${(c / emax) * 100}%"></div></div><div class="bar-n">${c}</div></div>`,
        )
        .join("")
    : '<div class="no-data">Log trades to see data</div>';
  const rc = {};
  trades.forEach((t) =>
    (t.rules || []).forEach((r) => {
      rc[r] = (rc[r] || 0) + 1;
    }),
  );
  const rs = Object.entries(rc)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const rmax = rs.length ? rs[0][1] : 1;
  document.getElementById("bd-rules").innerHTML = rs.length
    ? rs
        .map(
          ([r, c]) =>
            `<div class="bar-row"><div class="bar-lbl">${r.substring(0, 16)}</div><div class="bar-track"><div class="bar-fill win" style="width:${(c / rmax) * 100}%"></div></div><div class="bar-n">${c}</div></div>`,
        )
        .join("")
    : '<div class="no-data">Log trades to see data</div>';
}

function exportTrades() {
  if (!trades.length) {
    alert("No trades to export yet.");
    return;
  }
  const data = JSON.stringify(trades, null, 2);
  const date = new Date().toISOString().slice(0, 10);
  const filename = "trades-backup-" + date + ".json";
  const blob = new Blob([data], { type: "application/json" });

  // Use Web Share API — on iOS Safari this opens the native share sheet
  // which lets users save to Files, AirDrop, iCloud Drive, etc.
  if (navigator.share && navigator.canShare) {
    const file = new File([blob], filename, { type: "application/json" });
    if (navigator.canShare({ files: [file] })) {
      navigator
        .share({
          files: [file],
          title: "Trade Journal Backup",
          text: "Trade journal backup — " + date,
        })
        .catch((err) => {
          if (err.name !== "AbortError") fallbackDownload(blob, filename);
        });
      return;
    }
  }
  // Desktop / non-Safari fallback
  fallbackDownload(blob, filename);
}

function fallbackDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function importTrades(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (ev) {
    try {
      const imported = JSON.parse(ev.target.result);
      if (!Array.isArray(imported)) throw new Error("Invalid format");
      const action = confirm(
        "Found " +
          imported.length +
          " trades in this file.\n\nClick OK to MERGE with existing trades.\nClick Cancel to REPLACE all trades with imported trades.",
      );
      if (action === true) {
        // merge — avoid duplicates by id
        const existingIds = new Set(trades.map((t) => t.id));
        const newTrades = imported.filter((t) => !existingIds.has(t.id));
        trades = [...trades, ...newTrades].sort((a, b) => b.id - a.id);
        alert(
          "✓ Merged! Added " +
            newTrades.length +
            " new trades. Total: " +
            trades.length,
        );
      } else {
        if (
          !confirm(
            "Are you sure you want to REPLACE all " +
              trades.length +
              " existing trades?",
          )
        )
          return;
        trades = imported.sort((a, b) => b.id - a.id);
        alert("✓ Replaced with " + trades.length + " imported trades.");
      }
      localStorage.setItem("tj_green", JSON.stringify(trades));
      updateHeader();
      renderHistory();
      renderCalendar();
    } catch (err) {
      alert(
        "Error reading file. Make sure it is a valid trades backup .json file.",
      );
    }
    e.target.value = "";
  };
  reader.readAsText(file);
}

function delTrade(id) {
  if (!confirm("Delete this trade?")) return;
  trades = trades.filter((t) => t.id !== id);
  localStorage.setItem("tj_green", JSON.stringify(trades));
  updateHeader();
  renderHistory();
  renderCalendar();
  if (currentDay) openDayModal(currentDay);
}

function clearAll() {
  if (!confirm("Delete ALL trades? Cannot be undone.")) return;
  trades = [];
  localStorage.setItem("tj_green", JSON.stringify(trades));
  updateHeader();
  renderHistory();
}

function updateHeader() {
  const n = trades.length;
  const wins = trades.filter((t) => t.pnl > 0).length;
  const pnl = trades.reduce((s, t) => s + t.pnl, 0);
  document.getElementById("h-total").textContent = n;
  document.getElementById("h-wr").textContent = n
    ? Math.round((wins / n) * 100) + "%"
    : "—";
  document.getElementById("h-wr").className =
    "hstat-value " + (n && wins / n >= 0.5 ? "win" : n ? "loss" : "");
  document.getElementById("h-pnl").textContent =
    (pnl >= 0 ? "+" : "") + "$" + pnl.toFixed(2);
  document.getElementById("h-pnl").className =
    "hstat-value " + (pnl >= 0 ? "win" : "loss");
}

// init
updateHeader();
renderCalendar();

// ══════════════════════════════════════════
// RULES EDITOR
// ══════════════════════════════════════════
const DEFAULT_RULES = [
  "Waited for 15-min ORB",
  "Break & Hold confirmed",
  "Volume confirmed",
  "VWAP aligned",
  "RSI not extreme",
  "Stop-loss set",
  "Profit target set",
  "Max risk respected",
  "No revenge/FOMO trade",
  "Closed in time",
];
let customRules = JSON.parse(localStorage.getItem("tj_rules") || "null") || [
  ...DEFAULT_RULES,
];

function renderRuleGrid() {
  const grid = document.getElementById("rule-grid-dynamic");
  if (!grid) return;
  grid.innerHTML = customRules
    .map(
      (r) => `
      <div class="rule-item" onclick="toggleRule(this)" data-rule="${r.replace(/"/g, "&quot;")}">
        <div class="chk"></div>${r}
      </div>`,
    )
    .join("");
  // also rebuild edit modal rule grid if open
  buildEditRuleGrid();
}

function openRuleEditor() {
  const list = document.getElementById("rule-editor-list");
  list.innerHTML = customRules
    .map(
      (r, i) => `
      <div style="display:flex;align-items:center;gap:8px;" id="re-row-${i}">
        <input type="text" value="${r.replace(/"/g, "&quot;")}" id="re-inp-${i}"
          style="flex:1;background:var(--bg3);border:1.5px solid var(--border);border-radius:6px;color:var(--text);font-family:var(--body);font-size:0.85rem;padding:9px 12px;outline:none;">
        <button onclick="deleteRuleRow(${i})" style="background:none;border:1.5px solid var(--border);border-radius:6px;color:var(--text3);padding:8px 11px;cursor:pointer;font-size:0.8rem;transition:all 0.15s;"
          onmouseover="this.style.color='var(--loss)';this.style.borderColor='var(--loss)';this.style.background='var(--loss-bg)'"
          onmouseout="this.style.color='var(--text3)';this.style.borderColor='var(--border)';this.style.background='none'">✕</button>
      </div>`,
    )
    .join("");
  document.getElementById("new-rule-input").value = "";
  document.getElementById("rule-modal").style.display = "block";
  document.body.style.overflow = "hidden";
}

function deleteRuleRow(i) {
  document.getElementById("re-row-" + i).remove();
  // renumber remaining rows
  const rows = [...document.getElementById("rule-editor-list").children];
  rows.forEach((row, idx) => {
    row.id = "re-row-" + idx;
    row.querySelector("input").id = "re-inp-" + idx;
    row
      .querySelector("button")
      .setAttribute("onclick", "deleteRuleRow(" + idx + ")");
  });
}

function addRule() {
  const inp = document.getElementById("new-rule-input");
  const val = inp.value.trim();
  if (!val) return;
  const list = document.getElementById("rule-editor-list");
  const i = list.children.length;
  const div = document.createElement("div");
  div.style.cssText = "display:flex;align-items:center;gap:8px;";
  div.id = "re-row-" + i;
  div.innerHTML = `<input type="text" value="${val.replace(/"/g, "&quot;")}" id="re-inp-${i}"
      style="flex:1;background:var(--bg3);border:1.5px solid var(--border);border-radius:6px;color:var(--text);font-family:var(--body);font-size:0.85rem;padding:9px 12px;outline:none;">
      <button onclick="deleteRuleRow(${i})" style="background:none;border:1.5px solid var(--border);border-radius:6px;color:var(--text3);padding:8px 11px;cursor:pointer;font-size:0.8rem;transition:all 0.15s;"
        onmouseover="this.style.color='var(--loss)';this.style.borderColor='var(--loss)';this.style.background='var(--loss-bg)'"
        onmouseout="this.style.color='var(--text3)';this.style.borderColor='var(--border)';this.style.background='none'">✕</button>`;
  list.appendChild(div);
  inp.value = "";
  inp.focus();
}

function saveRules() {
  const inputs = [
    ...document.querySelectorAll("#rule-editor-list input[type=text]"),
  ];
  customRules = inputs.map((i) => i.value.trim()).filter(Boolean);
  localStorage.setItem("tj_rules", JSON.stringify(customRules));
  closeRuleEditor();
  renderRuleGrid();
}

function resetDefaultRules() {
  if (!confirm("Reset to default rules? Your custom rules will be lost."))
    return;
  customRules = [...DEFAULT_RULES];
  localStorage.setItem("tj_rules", JSON.stringify(customRules));
  closeRuleEditor();
  renderRuleGrid();
}

function closeRuleEditor() {
  document.getElementById("rule-modal").style.display = "none";
  document.body.style.overflow = "";
}

// render rules on load
renderRuleGrid();

// ══════════════════════════════════════════
// SETUP TYPES EDITOR
// ══════════════════════════════════════════
const DEFAULT_SETUPS = [
  "Opening Range Breakout",
  "VWAP Bounce",
  "VWAP Rejection",
  "Support Bounce",
  "Resistance Rejection",
  "Bull Flag",
  "Bear Flag",
  "Double Bottom",
  "Double Top",
  "Other",
];
let customSetups = JSON.parse(localStorage.getItem("tj_green_setups") || "null") || [
  ...DEFAULT_SETUPS,
];

function renderSetupGrid() {
  const html = customSetups
    .map((s) => `<button class="setup-pill" onclick="togglePill(this)">${s}</button>`)
    .join("");
  const logGrid = document.getElementById("setup-grid");
  const editGrid = document.getElementById("e-setup-grid");
  if (logGrid) logGrid.innerHTML = html;
  if (editGrid) editGrid.innerHTML = html;
}

function openSetupEditor() {
  const list = document.getElementById("setup-editor-list");
  list.innerHTML = customSetups
    .map(
      (s, i) => `
      <div style="display:flex;align-items:center;gap:8px;" id="se-row-${i}">
        <input type="text" value="${s.replace(/"/g, "&quot;")}" id="se-inp-${i}"
          style="flex:1;background:var(--bg3);border:1.5px solid var(--border);border-radius:6px;color:var(--text);font-family:var(--body);font-size:0.85rem;padding:9px 12px;outline:none;">
        <button onclick="deleteSetupRow(${i})" style="background:none;border:1.5px solid var(--border);border-radius:6px;color:var(--text3);padding:8px 11px;cursor:pointer;font-size:0.8rem;transition:all 0.15s;"
          onmouseover="this.style.color='var(--loss)';this.style.borderColor='var(--loss)';this.style.background='var(--loss-bg)'"
          onmouseout="this.style.color='var(--text3)';this.style.borderColor='var(--border)';this.style.background='none'">✕</button>
      </div>`,
    )
    .join("");
  document.getElementById("new-setup-input").value = "";
  document.getElementById("setup-modal").style.display = "block";
  document.body.style.overflow = "hidden";
}

function deleteSetupRow(i) {
  document.getElementById("se-row-" + i).remove();
  const rows = [...document.getElementById("setup-editor-list").children];
  rows.forEach((row, idx) => {
    row.id = "se-row-" + idx;
    row.querySelector("input").id = "se-inp-" + idx;
    row.querySelector("button").setAttribute("onclick", "deleteSetupRow(" + idx + ")");
  });
}

function addSetup() {
  const inp = document.getElementById("new-setup-input");
  const val = inp.value.trim();
  if (!val) return;
  const list = document.getElementById("setup-editor-list");
  const i = list.children.length;
  const div = document.createElement("div");
  div.style.cssText = "display:flex;align-items:center;gap:8px;";
  div.id = "se-row-" + i;
  div.innerHTML = `<input type="text" value="${val.replace(/"/g, "&quot;")}" id="se-inp-${i}"
      style="flex:1;background:var(--bg3);border:1.5px solid var(--border);border-radius:6px;color:var(--text);font-family:var(--body);font-size:0.85rem;padding:9px 12px;outline:none;">
      <button onclick="deleteSetupRow(${i})" style="background:none;border:1.5px solid var(--border);border-radius:6px;color:var(--text3);padding:8px 11px;cursor:pointer;font-size:0.8rem;transition:all 0.15s;"
        onmouseover="this.style.color='var(--loss)';this.style.borderColor='var(--loss)';this.style.background='var(--loss-bg)'"
        onmouseout="this.style.color='var(--text3)';this.style.borderColor='var(--border)';this.style.background='none'">✕</button>`;
  list.appendChild(div);
  inp.value = "";
  inp.focus();
}

function saveSetups() {
  const inputs = [...document.querySelectorAll("#setup-editor-list input[type=text]")];
  customSetups = inputs.map((i) => i.value.trim()).filter(Boolean);
  localStorage.setItem("tj_green_setups", JSON.stringify(customSetups));
  closeSetupEditor();
  renderSetupGrid();
}

function resetDefaultSetups() {
  if (!confirm("Reset to default setup types? Your custom setups will be lost.")) return;
  customSetups = [...DEFAULT_SETUPS];
  localStorage.setItem("tj_green_setups", JSON.stringify(customSetups));
  closeSetupEditor();
  renderSetupGrid();
}

function closeSetupEditor() {
  document.getElementById("setup-modal").style.display = "none";
  document.body.style.overflow = "";
}

document.getElementById("setup-modal").addEventListener("click", function (e) {
  if (e.target === this) closeSetupEditor();
});

// render setups on load
renderSetupGrid();

// ══════════════════════════════════════════
// EDIT TRADE MODAL
// ══════════════════════════════════════════
let editingId = null;
let editGrade = "";

function buildEditRuleGrid() {
  const grid = document.getElementById("e-rule-grid");
  if (!grid) return;
  grid.innerHTML = customRules
    .map(
      (r) => `
      <div class="rule-item" onclick="toggleRule(this)" data-rule="${r.replace(/"/g, "&quot;")}">
        <div class="chk"></div>${r}
      </div>`,
    )
    .join("");
}

function openEditModal(id) {
  const t = trades.find((x) => x.id === id);
  if (!t) return;
  editingId = id;
  editGrade = t.grade || "";

  // if day modal is open, close it so edit modal displays consistently
  if (
    document.getElementById("day-modal") &&
    document.getElementById("day-modal").style.display === "block"
  ) {
    closeDayModal();
  }

  // fill fields
  document.getElementById("e-date").value = t.date || "";
  document.getElementById("e-ticker").value = t.ticker || "";
  document.getElementById("e-direction").value = t.direction || "CALL";
  document.getElementById("e-strike").value = t.strike || "";
  document.getElementById("e-expiry").value = t.expiry || "";
  document.getElementById("e-contracts").value = t.contracts || 1;
  document.getElementById("e-entry").value = t.entry || "";
  document.getElementById("e-exit").value = t.exit || "";
  document.getElementById("e-entry-time").value = t.entryTime || "";
  document.getElementById("e-exit-time").value = t.exitTime || "";
  // restore setup pills
  const setups = Array.isArray(t.setup) ? t.setup : t.setup ? [t.setup] : [];
  const editSetupGrid = document.getElementById("e-setup-grid");
  editSetupGrid.innerHTML = customSetups
    .map((s) => `<button class="setup-pill" onclick="togglePill(this)">${s}</button>`)
    .join("");
  editSetupGrid.querySelectorAll(".setup-pill").forEach((b) => {
    b.classList.toggle("on", setups.includes(b.textContent.trim()));
  });
  document.getElementById("e-what").value = t.what || "";
  document.getElementById("e-lesson").value = t.lesson || "";
  document.getElementById("e-diff").value = t.diff || "";
  calcEditPnl();

  // emotions
  document.querySelectorAll("#e-emotion-grid .pill").forEach((b) => {
    const on = (t.emotions || []).includes(b.textContent.trim());
    b.classList.toggle("on", on);
  });

  // rules
  buildEditRuleGrid();
  document.querySelectorAll("#e-rule-grid .rule-item").forEach((r) => {
    const on = (t.rules || []).includes(r.dataset.rule);
    r.classList.toggle("on", on);
    r.querySelector(".chk").textContent = on ? "✓" : "";
  });

  // grade
  document
    .querySelectorAll("#e-grade-row .grade-btn")
    .forEach((b) => (b.className = "grade-btn"));
  if (t.grade) {
    const gb = document.querySelector(
      `#e-grade-row .grade-btn[onclick*="'${t.grade}'"]`,
    );
    if (gb) gb.classList.add("on-" + t.grade);
  }

  document.getElementById("edit-modal").style.display = "block";
  document.body.style.overflow = "hidden";
}

function calcEditPnl() {
  const entry = parseFloat(document.getElementById("e-entry").value);
  const exit = parseFloat(document.getElementById("e-exit").value);
  const contracts = parseInt(document.getElementById("e-contracts").value) || 1;
  const el = document.getElementById("e-pnl-calc");
  if (entry && exit) {
    const pnl = (exit - entry) * 100 * contracts;
    el.value = (pnl >= 0 ? "+" : "") + "$" + pnl.toFixed(2);
    el.style.color = pnl >= 0 ? "var(--win)" : "var(--loss)";
  } else {
    el.value = "";
    el.style.color = "";
  }
}

function pickEditGrade(btn, g) {
  document
    .querySelectorAll("#e-grade-row .grade-btn")
    .forEach((b) => (b.className = "grade-btn"));
  btn.classList.add("on-" + g);
  editGrade = g;
}

function saveEditTrade() {
  const date = document.getElementById("e-date").value;
  const tick = document.getElementById("e-ticker").value.trim().toUpperCase();
  const dir = document.getElementById("e-direction").value;
  const entry = parseFloat(document.getElementById("e-entry").value);
  const exit = parseFloat(document.getElementById("e-exit").value);
  if (!date || !tick || !dir || !entry || !exit) {
    alert("Fill in: Date, Ticker, Direction, Entry Price, and Exit Price.");
    return;
  }
  const contracts = parseInt(document.getElementById("e-contracts").value) || 1;
  const pnl = (exit - entry) * 100 * contracts;
  const emotions = [
    ...document.querySelectorAll("#e-emotion-grid .pill.on"),
  ].map((b) => b.textContent.trim());
  const rules = [
    ...document.querySelectorAll("#e-rule-grid .rule-item.on"),
  ].map((r) => r.dataset.rule);
  const idx = trades.findIndex((x) => x.id === editingId);
  if (idx === -1) return;
  trades[idx] = {
    ...trades[idx],
    date,
    ticker: tick,
    direction: dir,
    strike: document.getElementById("e-strike").value,
    expiry: document.getElementById("e-expiry").value,
    contracts,
    entry,
    exit,
    pnl,
    entryTime: document.getElementById("e-entry-time").value,
    exitTime: document.getElementById("e-exit-time").value,
    setup: [...document.querySelectorAll("#e-setup-grid .setup-pill.on")].map(
      (b) => b.textContent.trim(),
    ),
    emotions,
    rules,
    grade: editGrade,
    what: document.getElementById("e-what").value,
    lesson: document.getElementById("e-lesson").value,
    diff: document.getElementById("e-diff").value,
  };
  localStorage.setItem("tj_green", JSON.stringify(trades));
  closeEditModal();
  updateHeader();
  renderHistory();
}

function closeEditModal() {
  document.getElementById("edit-modal").style.display = "none";
  document.body.style.overflow = "";
  editingId = null;
  editGrade = "";
}

// close modals on backdrop click
document.getElementById("edit-modal").addEventListener("click", function (e) {
  if (e.target === this) closeEditModal();
});
document.getElementById("rule-modal").addEventListener("click", function (e) {
  if (e.target === this) closeRuleEditor();
});
document.getElementById("day-modal").addEventListener("click", function (e) {
  if (e.target === this) closeDayModal();
});

// ── DAY MODAL (calendar day details) ──
function openDayModal(dateStr) {
  currentDay = dateStr;
  const title = new Date(dateStr).toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  document.getElementById("day-modal-title").textContent = title;
  const listEl = document.getElementById("day-modal-list");
  const dayTrades = trades.filter((t) => t.date === dateStr);
  if (!dayTrades.length) {
    listEl.innerHTML = `<div class="empty" style="padding:24px 0;text-align:center;">
         <div class="empty-sub" style="margin-bottom:12px">No trades for ${dateStr}</div>
         <button class="btn-ghost" onclick="openLogWithDate('${dateStr}')">Log trade for this day</button>
       </div>`;
  } else {
    const compact = dayTrades.length > 4; // switch to compact when busy
    listEl.innerHTML = dayTrades
      .map((t) => {
        const pc = t.pnl > 0 ? "w" : t.pnl < 0 ? "l" : "b";
        const ps = (t.pnl >= 0 ? "+" : "") + "$" + t.pnl.toFixed(2);
        const cc = t.pnl > 0 ? "is-win" : t.pnl < 0 ? "is-loss" : "";
        const eTags = (t.emotions || [])
          .map((e) => `<span class="ttag ttag-emotion">${e}</span>`)
          .join("");
        const rTags = (t.rules || [])
          .slice(0, 3)
          .map((r) => `<span class="ttag ttag-rule">${r}</span>`)
          .join("");
        const gTag = t.grade
          ? `<span class="ttag ttag-grade ${t.grade === "A" ? "A" : t.grade === "B" ? "B" : ""}">Grade ${t.grade}</span>`
          : "";
        // compact mode: minimal meta + expand button
        if (compact) {
          return `<div class="trade-card compact ${cc}" id="day-trade-${t.id}">
             <div class="tc-top" style="align-items:center;">
               <div style="display:flex;align-items:center;gap:8px;"><span class="tc-ticker">${t.ticker}</span><span class="tc-dir ${t.direction === "CALL" ? "call" : "put"}">${t.direction}</span></div>
               <div style="display:flex;align-items:center;gap:8px;">
                 <span class="tc-pnl ${pc}">${ps}</span>
                 <button class="del-btn edit-btn" onclick="openEditModal(${t.id})" title="Edit trade">✎</button>
                 <button class="del-btn" onclick="delTrade(${t.id})" title="Delete trade">✕</button>
                 <button class="del-btn" onclick="toggleDayTradeDetails(${t.id})" title="Toggle details">▾</button>
               </div>
             </div>
             <div class="tc-meta" style="display:none;">
               <div class="tc-meta-item"><div class="tc-meta-lbl">Date</div><div class="tc-meta-val">${t.date}</div></div>
               <div class="tc-meta-item"><div class="tc-meta-lbl">Qty</div><div class="tc-meta-val">${t.contracts}x</div></div>
               <div class="tc-meta-item"><div class="tc-meta-lbl">Entry</div><div class="tc-meta-val">$${t.entry.toFixed(2)}</div></div>
               <div class="tc-meta-item"><div class="tc-meta-lbl">Exit</div><div class="tc-meta-val">$${t.exit.toFixed(2)}</div></div>
             </div>
             ${gTag || rTags || eTags ? `<div class="tc-tags" style="display:none;">${gTag}${rTags}${eTags}</div>` : ""}
             ${t.what || t.lesson || t.diff ? `<div class="tc-notes" style="display:none;">${t.what ? `<strong>What happened:</strong> ${t.what}<br>` : ""}${t.lesson ? `<strong>Lesson:</strong> ${t.lesson}<br>` : ""}${t.diff ? `<strong>Next time:</strong> ${t.diff}` : ""}</div>` : ""}
           </div>`;
        }
        // regular/full card
        return `<div class="trade-card ${cc}">
           <div class="tc-top">
             <div style="display:flex;align-items:center;gap:8px;"><span class="tc-ticker">${t.ticker}</span><span class="tc-dir ${t.direction === "CALL" ? "call" : "put"}">${t.direction}</span></div>
             <div style="display:flex;align-items:center;gap:8px;"><span class="tc-pnl ${pc}">${ps}</span><button class="del-btn edit-btn" onclick="openEditModal(${t.id})" title="Edit trade">✎</button><button class="del-btn" onclick="delTrade(${t.id})" title="Delete trade">✕</button></div>
           </div>
           <div class="tc-meta">
             <div class="tc-meta-item"><div class="tc-meta-lbl">Date</div><div class="tc-meta-val">${t.date}</div></div>
             <div class="tc-meta-item"><div class="tc-meta-lbl">Qty</div><div class="tc-meta-val">${t.contracts}x</div></div>
             <div class="tc-meta-item"><div class="tc-meta-lbl">Entry</div><div class="tc-meta-val">$${t.entry.toFixed(2)}</div></div>
             <div class="tc-meta-item"><div class="tc-meta-lbl">Exit</div><div class="tc-meta-val">$${t.exit.toFixed(2)}</div></div>
           </div>
           ${gTag || rTags || eTags ? `<div class="tc-tags">${gTag}${rTags}${eTags}</div>` : ""}
           ${t.what || t.lesson || t.diff ? `<div class="tc-notes">${t.what ? `<strong>What happened:</strong> ${t.what}<br>` : ""}${t.lesson ? `<strong>Lesson:</strong> ${t.lesson}<br>` : ""}${t.diff ? `<strong>Next time:</strong> ${t.diff}` : ""}</div>` : ""}
         </div>`;
      })
      .join("");
  }
  document.getElementById("day-modal").style.display = "block";
  document.body.style.overflow = "hidden";
}

function closeDayModal() {
  document.getElementById("day-modal").style.display = "none";
  document.body.style.overflow = "";
  currentDay = null;
}

function openLogWithDate(dateStr) {
  closeDayModal();
  goTab("log");
  const inp = document.getElementById("f-date");
  if (inp) inp.value = dateStr;
  window.scrollTo(0, 0);
}

function toggleDayTradeDetails(id) {
  const card = document.getElementById("day-trade-" + id);
  if (!card) return;
  const isExpanded = card.classList.toggle("expanded");
  const meta = card.querySelector(".tc-meta");
  const tags = card.querySelector(".tc-tags");
  const notes = card.querySelector(".tc-notes");
  if (meta) meta.style.display = isExpanded ? "" : "none";
  if (tags) tags.style.display = isExpanded ? "" : "none";
  if (notes) notes.style.display = isExpanded ? "" : "none";
}
