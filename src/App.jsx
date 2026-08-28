import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Mic, Plus, X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Check,
  Trash2, Pill, Clock, Target, Sparkles, Camera, BellRing, AlertTriangle,
  Pencil, ListChecks, Sun, LayoutGrid, TrendingUp, Compass, CalendarDays, Palette,
  CalendarRange, Award, Brain, Flag,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";

/* ============================================================
   CONSTANTS
   ============================================================ */

const STEP_STATUSES = ["Not Started", "In Progress", "Complete", "Postponed"];
const STATUS_VAR = {
  "Not Started": "var(--db-slate)",
  "In Progress": "var(--db-amber)",
  "Complete": "var(--db-green)",
  "Postponed": "var(--db-rose)",
};

const ND_FACTORS = [
  { key: "focus", label: "Focus" },
  { key: "taskSwitch", label: "Task-switching" },
  { key: "sensory", label: "Sensory load" },
  { key: "overwhelm", label: "Overwhelm" },
  { key: "recovery", label: "Recovery need" },
  { key: "emotional", label: "Emotional regulation" },
];

const GOAL_COLORS = ["#D4AF37", "#7FB899", "#8AA9D6", "#E3A63E", "#C48FE0", "#E28080"];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const DEFAULT_HABIT_DEFS = {
  "Mind & Mood": [
    { id: "mm1", name: "Meditate / breathe" },
    { id: "mm2", name: "Journal" },
    { id: "mm3", name: "Gratitude note" },
    { id: "mm4", name: "Read for pleasure" },
    { id: "mm5", name: "Screen-free wind-down" },
  ],
  "Body & Health": [
    { id: "bh1", name: "Move for 20 min" },
    { id: "bh2", name: "Hit water goal" },
    { id: "bh3", name: "Eat a real meal" },
    { id: "bh4", name: "Stretch" },
    { id: "bh5", name: "Sleep by target time" },
  ],
  "Self-Care & Growth": [
    { id: "sc1", name: "Tidy one space" },
    { id: "sc2", name: "Connect with someone" },
    { id: "sc3", name: "Learn something new" },
    { id: "sc4", name: "Time outside" },
    { id: "sc5", name: "One kind thing for yourself" },
  ],
};

const THEMES = {
  navyGold: {
    label: "Navy & Gold",
    blurb: "Calm, dark, low glare",
    bg: "#0B1B33", panel: "#12233F", panelAlt: "#1A2E52", border: "#2A4A7A",
    gold: "#D4AF37", ivory: "#F4F1E8", slate: "#8FA3C4",
    green: "#5FBE8B", amber: "#E3A63E", rose: "#E28080", onAccent: "#0B1B33",
  },
  softFocus: {
    label: "Soft Focus",
    blurb: "Light, muted, gentle daytime",
    bg: "#F6F5F1", panel: "#FFFFFF", panelAlt: "#EFECE4", border: "#D9D3C6",
    gold: "#8C7A54", ivory: "#2E2B24", slate: "#8A8272",
    green: "#4F9E72", amber: "#C0872E", rose: "#C0685F", onAccent: "#FFFFFF",
  },
  highContrast: {
    label: "High Contrast",
    blurb: "Bold, maximum clarity",
    bg: "#000000", panel: "#111111", panelAlt: "#1E1E1E", border: "#FFFFFF",
    gold: "#FFD400", ivory: "#FFFFFF", slate: "#D2D2D2",
    green: "#00E676", amber: "#FFB300", rose: "#FF6B6B", onAccent: "#000000",
  },
  warmSand: {
    label: "Warm Sand",
    blurb: "Cozy, grounding, warm",
    bg: "#F5EEE1", panel: "#FFFCF6", panelAlt: "#ECE0C9", border: "#D6C4A0",
    gold: "#B5652D", ivory: "#3A2E20", slate: "#8A7A5F",
    green: "#5C8F5A", amber: "#C98A2E", rose: "#BE5C46", onAccent: "#FFFCF6",
  },
  coolSage: {
    label: "Cool Sage",
    blurb: "Muted, calming, low arousal",
    bg: "#18251F", panel: "#20302A", panelAlt: "#2A3E36", border: "#3D5A4E",
    gold: "#8FBFA6", ivory: "#E9F1EC", slate: "#8FAA9C",
    green: "#7FD9A4", amber: "#D9B36B", rose: "#D18585", onAccent: "#16241E",
  },
  grayscale: {
    label: "Grayscale",
    blurb: "No hue at all — light/dark only",
    bg: "#FFFFFF", panel: "#F4F4F4", panelAlt: "#E6E6E6", border: "#ABABAB",
    gold: "#000000", ivory: "#141414", slate: "#6E6E6E",
    green: "#D6D6D6", amber: "#8C8C8C", rose: "#242424", onAccent: "#FFFFFF",
  },
  colorblindSafe: {
    label: "Colorblind Safe",
    blurb: "Okabe-Ito palette — distinct for all colour vision",
    bg: "#0B1B2E", panel: "#132A45", panelAlt: "#1B3A5C", border: "#2E5478",
    gold: "#0072B2", ivory: "#F5F5F5", slate: "#9BB0C4",
    green: "#009E73", amber: "#E69F00", rose: "#D55E00", onAccent: "#F5F5F5",
  },
};
const THEME_VAR_MAP = [
  ["bg", "--db-bg"], ["panel", "--db-panel"], ["panelAlt", "--db-panel-alt"],
  ["border", "--db-border"], ["gold", "--db-gold"], ["ivory", "--db-ivory"],
  ["slate", "--db-slate"], ["green", "--db-green"], ["amber", "--db-amber"], ["rose", "--db-rose"],
  ["onAccent", "--db-on-accent"],
];
function themeToCssVars(theme) {
  const vars = {};
  THEME_VAR_MAP.forEach(([key, cssVar]) => {
    vars[cssVar] = theme[key];
  });
  vars["--db-gold-soft"] = theme.gold + "24";
  vars["--db-gold-border"] = theme.gold + "59";
  vars["--db-rose-soft"] = theme.rose + "26";
  return vars;
}

function allHabitsFlat(defs) {
  return Object.entries(defs).flatMap(([cat, list]) => list.map((h) => ({ ...h, category: cat })));
}

/* ============================================================
   STORAGE HELPERS
   ============================================================ */

async function storageGet(key, fallback) {
  try {
    const res = await window.storage.get(key);
    return res && res.value ? JSON.parse(res.value) : fallback;
  } catch {
    return fallback;
  }
}
async function storageSet(key, value) {
  try {
    await window.storage.set(key, JSON.stringify(value));
  } catch (e) {
    console.error("storage set failed", key, e);
  }
}
async function storageListKeys(prefix) {
  try {
    const res = await window.storage.list(prefix);
    return res && res.keys ? res.keys : [];
  } catch {
    return [];
  }
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ============================================================
   DATE HELPERS (local-time safe, no UTC shifting)
   ============================================================ */

function toKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function fromKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function startOfWeek(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}
function isSameDay(a, b) {
  return toKey(a) === toKey(b);
}
function formatDisplay(date) {
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}
function monthKeyOf(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function monthLabel(year, month) {
  return new Date(year, month, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}
function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/* ============================================================
   DEFAULT DATA SHAPES
   ============================================================ */

function emptyPriority() {
  return { id: uid(), text: "", done: false, goalId: null, taskId: null, status: null };
}

/* ---- goal tiers + urgency (traffic light) ---- */
function allGoals(goals) {
  return [
    ...(goals.longTerm || []).map((g) => ({ ...g, kind: "Long-term" })),
    ...(goals.midTerm || []).map((g) => ({ ...g, kind: "Mid-term" })),
    ...(goals.shortTerm || []).map((g) => ({ ...g, kind: "Short-term" })),
  ];
}
function findGoal(goals, goalId) {
  if (!goalId) return null;
  return allGoals(goals).find((g) => g.id === goalId) || null;
}
/*
  Urgency is a provisional default (open design question — see spec section 1):
  blends days-remaining-to-deadline against % of linked steps complete.
  Swap this function out once the exact trigger logic is agreed.
*/
function calcUrgency(task, goals) {
  const goal = findGoal(goals, task.goalId);
  if (!goal || !goal.deadline) return { level: "none", label: "No deadline" };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = fromKey(goal.deadline);
  const daysLeft = Math.round((deadline - today) / 86400000);
  const total = task.steps.length;
  const complete = task.steps.filter((s) => s.status === "Complete").length;
  const pct = total > 0 ? complete / total : 0;
  if (daysLeft < 0) return { level: "red", label: "Overdue" };
  if (daysLeft <= 7 && pct < 0.8) return { level: "red", label: `${daysLeft}d left` };
  if (daysLeft <= 21 && pct < 0.5) return { level: "amber", label: `${daysLeft}d left` };
  return { level: "green", label: `${daysLeft}d left` };
}
const URGENCY_COLOR = { none: "var(--db-border)", green: "var(--db-green)", amber: "var(--db-amber)", red: "var(--db-rose)" };
function TrafficDot({ task, goals }) {
  const u = calcUrgency(task, goals);
  return <span className="db-traffic-dot" style={{ background: URGENCY_COLOR[u.level] }} title={u.label} />;
}
/* ---- cadence review helpers (shared by Daily / Weekly / Monthly planners) ---- */
function periodKeyFor(cadence, date) {
  if (cadence === "weekly") return toKey(startOfWeek(date));
  if (cadence === "monthly") return monthKeyOf(date);
  return toKey(date);
}
function periodEndDate(cadence, refDate) {
  if (cadence === "weekly") return addDays(startOfWeek(refDate), 6);
  if (cadence === "monthly") return new Date(refDate.getFullYear(), refDate.getMonth(), daysInMonth(refDate.getFullYear(), refDate.getMonth()));
  return refDate;
}
// A deferred task reappears once the viewed period reaches or passes its deferred-to date.
function tasksDueForReview(tasks, cadence, periodKey, refDate) {
  const endDate = periodEndDate(cadence, refDate);
  return tasks.filter((t) => {
    if (t.cadence !== cadence) return false;
    if (t.status === "Completed" && t.statusPeriod === periodKey) return false;
    if (t.deferredTo && fromKey(t.deferredTo) > endDate) return false;
    return true;
  });
}
function defaultEntry(dateKey) {
  return {
    date: dateKey,
    dayFocus: "",
    top3: [emptyPriority(), emptyPriority(), emptyPriority()],
    top3Reward: "",
    tier2: [emptyPriority(), emptyPriority(), emptyPriority()],
    tier2Reward: "",
    catchAll: [],
    habitSlotIds: [null, null, null],
    schedule: [],
    medDoses: {},
    nd: { focus: 0, taskSwitch: 0, sensory: 0, overwhelm: 0, recovery: 0, emotional: 0 },
    energy: 0,
    productivity: 0,
    mood: 0,
    randomThoughts: "",
    eod: { wentWell: "", wasHard: "", carryForward: "" },
  };
}

/* ============================================================
   SMALL REUSABLE COMPONENTS
   ============================================================ */

function MicButton({ onResult }) {
  const [listening, setListening] = useState(false);
  const recogRef = useRef(null);
  const SR = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
  if (!SR) return null;
  const toggle = () => {
    if (listening) {
      recogRef.current?.stop();
      setListening(false);
      return;
    }
    const recog = new SR();
    recog.continuous = false;
    recog.interimResults = false;
    recog.onresult = (e) => {
      onResult(e.results[0][0].transcript);
      setListening(false);
    };
    recog.onerror = () => setListening(false);
    recog.onend = () => setListening(false);
    try {
      recog.start();
      recogRef.current = recog;
      setListening(true);
    } catch {
      setListening(false);
    }
  };
  return (
    <button type="button" onClick={toggle} className={`db-mic ${listening ? "db-mic-on" : ""}`} aria-label="Dictate" title="Dictate">
      <Mic size={14} />
    </button>
  );
}

function VoiceInput({ value, onChange, placeholder, className = "" }) {
  return (
    <div className="db-field-row">
      <input
        className={`db-input ${className}`}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      <MicButton onResult={(t) => onChange(value ? `${value} ${t}` : t)} />
    </div>
  );
}

function VoiceTextArea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <div className="db-field-row db-field-row-top">
      <textarea
        className="db-textarea"
        value={value}
        placeholder={placeholder}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
      />
      <MicButton onResult={(t) => onChange(value ? `${value} ${t}` : t)} />
    </div>
  );
}

function CheckBox({ checked, onChange }) {
  return (
    <label className="db-check">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="db-check-box">{checked && <Check size={14} strokeWidth={3} />}</span>
    </label>
  );
}

function ScoreDots({ value, min = 0, max, onChange }) {
  const items = [];
  for (let i = min; i <= max; i++) items.push(i);
  return (
    <div className="db-dots">
      {items.map((i) => (
        <button key={i} type="button" className={`db-dot ${value === i ? "db-dot-on" : ""}`} onClick={() => onChange(i)}>
          {i}
        </button>
      ))}
    </div>
  );
}

function TaskStatusControl({ status, onStatus }) {
  const [pendingDefer, setPendingDefer] = useState(false);
  return (
    <div className="db-row" style={{ gap: 6 }}>
      <select
        className="db-status-select"
        value={status || "Started"}
        onChange={(e) => {
          if (e.target.value === "NeedsMoreWork") {
            setPendingDefer(true);
            return;
          }
          setPendingDefer(false);
          onStatus(e.target.value, null);
        }}
      >
        <option value="Started">Started</option>
        <option value="Completed">Completed</option>
        <option value="NeedsMoreWork">Needs more work</option>
      </select>
      {pendingDefer && (
        <input
          type="date"
          className="db-input"
          onChange={(e) => {
            if (e.target.value) {
              onStatus("NeedsMoreWork", e.target.value);
              setPendingDefer(false);
            }
          }}
        />
      )}
    </div>
  );
}

function StatusPill({ status, onCycle }) {
  return (
    <button type="button" className="db-status-pill" style={{ "--pill-color": STATUS_VAR[status] }} onClick={onCycle}>
      {status}
    </button>
  );
}
function nextStatus(s) {
  const i = STEP_STATUSES.indexOf(s);
  return STEP_STATUSES[(i + 1) % STEP_STATUSES.length];
}

function GoalDot({ color }) {
  return <span className="db-goal-dot" style={{ background: color || "transparent", borderColor: color || "var(--db-border)" }} />;
}

function GoalPicker({ value, onChange, goals }) {
  const all = allGoals(goals);
  return (
    <select className="db-select db-select-sm" value={value || ""} onChange={(e) => onChange(e.target.value || null)}>
      <option value="">No goal</option>
      {all.map((g) => (
        <option key={g.id} value={g.id}>
          {g.kind}: {g.title}
        </option>
      ))}
    </select>
  );
}

function IconBtn({ onClick, children, title, danger }) {
  return (
    <button type="button" onClick={onClick} title={title} className={`db-icon-btn ${danger ? "db-icon-btn-danger" : ""}`}>
      {children}
    </button>
  );
}

function ThemePicker({ themeName, setThemeName }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="db-theme-wrap">
      <IconBtn title="Color scheme" onClick={() => setOpen((v) => !v)}>
        <Palette size={15} />
      </IconBtn>
      {open && (
        <div className="db-theme-panel">
          <div className="db-theme-panel-title">Color scheme</div>
          {Object.entries(THEMES).map(([key, t]) => (
            <button
              key={key}
              className={`db-theme-option ${themeName === key ? "db-theme-option-active" : ""}`}
              onClick={() => {
                setThemeName(key);
                setOpen(false);
              }}
            >
              <span className="db-theme-swatches">
                <span className="db-swatch" style={{ background: t.bg }} />
                <span className="db-swatch" style={{ background: t.panelAlt }} />
                <span className="db-swatch" style={{ background: t.gold }} />
                <span className="db-swatch" style={{ background: t.rose }} />
              </span>
              <span>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{t.label}</div>
                <div style={{ fontSize: 11, color: "var(--db-slate)" }}>{t.blurb}</div>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   STYLES
   ============================================================ */

const STYLES = `
.db-app {
  --db-bg: #0B1B33;
  --db-panel: #12233F;
  --db-panel-alt: #1A2E52;
  --db-border: #2A4A7A;
  --db-gold: #D4AF37;
  --db-gold-soft: rgba(212,175,55,0.14);
  --db-ivory: #F4F1E8;
  --db-slate: #8FA3C4;
  --db-green: #5FBE8B;
  --db-amber: #E3A63E;
  --db-rose: #E28080;
  background: var(--db-bg);
  color: var(--db-ivory);
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.db-display { font-family: Georgia, "Iowan Old Style", "Times New Roman", serif; letter-spacing: 0.01em; }
.db-topbar { position: sticky; top: 0; z-index: 20; background: var(--db-panel); border-bottom: 1px solid var(--db-border); }
.db-brand { display:flex; align-items:center; justify-content:space-between; gap:10px; padding: 14px 16px 8px; }
.db-brand-left { display:flex; align-items:center; gap:10px; }
.db-brand-mark { width:28px; height:28px; border-radius:8px; background: var(--db-gold); color:var(--db-on-accent); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:15px; flex-shrink:0; }
.db-brand-title { font-size: 17px; font-weight: 600; }
.db-tabs { display:flex; gap:4px; overflow-x:auto; padding: 0 10px 10px; scrollbar-width:none; }
.db-tabs::-webkit-scrollbar { display:none; }
.db-tab { display:flex; align-items:center; gap:6px; white-space:nowrap; padding:8px 12px; border-radius:10px; font-size:13px; color:var(--db-slate); background:transparent; border:1px solid transparent; flex-shrink:0; }
.db-tab-active { color: var(--db-gold); background: var(--db-gold-soft); border-color: var(--db-gold-border); }
.db-main { max-width: 720px; margin: 0 auto; padding: 14px 12px 60px; }
.db-card { background: var(--db-panel); border:1px solid var(--db-border); border-radius:14px; padding:14px; margin-bottom:12px; }
.db-card-title { display:flex; align-items:center; gap:8px; font-size:14px; font-weight:600; color:var(--db-gold); margin-bottom:10px; }
.db-card-sub { font-size:12px; color:var(--db-slate); margin-top:-6px; margin-bottom:10px; }
.db-input, .db-textarea, .db-select { background: var(--db-panel-alt); border:1px solid var(--db-border); color:var(--db-ivory); border-radius:9px; padding:8px 10px; font-size:14px; width:100%; }
.db-input:focus, .db-textarea:focus, .db-select:focus { outline:2px solid var(--db-gold); outline-offset:1px; }
.db-select-sm { font-size:12px; padding:5px 6px; width:auto; max-width:150px; }
.db-textarea { resize:vertical; }
.db-field-row { display:flex; align-items:center; gap:6px; flex:1; }
.db-field-row-top { align-items:flex-start; }
.db-field-row input, .db-field-row textarea { flex:1; }
.db-mic { flex-shrink:0; width:30px; height:30px; border-radius:50%; background:var(--db-panel-alt); border:1px solid var(--db-border); color:var(--db-slate); display:flex; align-items:center; justify-content:center; }
.db-mic-on { background: var(--db-rose); color:var(--db-on-accent); border-color:var(--db-rose); }
.db-check { position:relative; display:flex; align-items:center; cursor:pointer; }
.db-check input { position:absolute; opacity:0; width:22px; height:22px; margin:0; }
.db-check-box { width:22px; height:22px; border-radius:6px; border:2px solid var(--db-border); display:flex; align-items:center; justify-content:center; color:var(--db-on-accent); flex-shrink:0; }
.db-check input:checked + .db-check-box { background: var(--db-gold); border-color: var(--db-gold); }
.db-dots { display:flex; gap:6px; flex-wrap:wrap; }
.db-dot { width:30px; height:30px; border-radius:8px; border:1px solid var(--db-border); background:var(--db-panel-alt); color:var(--db-slate); font-size:13px; }
.db-dot-on { background: var(--db-gold); color:var(--db-on-accent); border-color:var(--db-gold); font-weight:700; }
.db-status-pill { font-size:11px; padding:4px 9px; border-radius:999px; border:1px solid var(--pill-color); color:var(--pill-color); background:transparent; white-space:nowrap; }
.db-goal-dot { width:10px; height:10px; border-radius:50%; border:2px solid; display:inline-block; flex-shrink:0; }
.db-traffic-dot { width:10px; height:10px; border-radius:50%; display:inline-block; flex-shrink:0; }
.db-tier-btns { display:flex; gap:6px; flex-wrap:wrap; }
.db-tier-btn { font-size:12px; padding:4px 8px; border-radius:8px; border:1px solid var(--db-border); background:var(--db-panel-alt); color:var(--db-slate); cursor:pointer; }
.db-tier-btn:hover { border-color: var(--db-gold); color: var(--db-ivory); }
.db-review-row { display:flex; flex-direction:column; gap:6px; padding:10px; border-radius:10px; background: var(--db-panel-alt); margin-bottom:8px; }
.db-review-top { display:flex; align-items:center; gap:8px; }
.db-review-title { flex:1; font-size:14px; }
.db-status-select { font-size:12px; padding:4px 8px; border-radius:8px; border:1px solid var(--db-border); background:var(--db-panel); color:var(--db-ivory); }
.db-weekend { background: var(--db-panel-alt) !important; }
.db-month-picker { display:flex; align-items:center; gap:8px; }
.db-icon-btn { width:30px; height:30px; border-radius:8px; background:var(--db-panel-alt); border:1px solid var(--db-border); color:var(--db-slate); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.db-icon-btn-danger { color: var(--db-rose); }
.db-row { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
.db-priority-row { display:flex; flex-direction:column; gap:6px; padding:8px; border-radius:10px; background: var(--db-panel-alt); margin-bottom:8px; }
.db-priority-top { display:flex; align-items:center; gap:8px; }
.db-priority-meta { display:flex; align-items:center; gap:8px; padding-left:30px; }
.db-reward { display:flex; align-items:center; gap:8px; margin-top:4px; padding:8px 10px; border-radius:9px; background:var(--db-gold-soft); border:1px dashed var(--db-gold-border); }
.db-reward svg { color: var(--db-gold); flex-shrink:0; }
.db-datebar { display:flex; align-items:center; gap:8px; margin-bottom:14px; }
.db-datebar input[type=date] { flex:1; }
.db-btn { background:var(--db-panel-alt); border:1px solid var(--db-border); color:var(--db-ivory); border-radius:9px; padding:8px 12px; font-size:13px; display:flex; align-items:center; gap:6px; }
.db-btn-gold { background: var(--db-gold); color:var(--db-on-accent); border-color:var(--db-gold); font-weight:600; }
.db-btn-ghost { background:transparent; }
.db-add-row { display:flex; gap:8px; margin-top:6px; }
.db-list-item { display:flex; align-items:center; gap:8px; margin-bottom:6px; }
.db-schedule-row { display:flex; flex-direction:column; gap:6px; padding:10px; border-radius:10px; background:var(--db-panel-alt); margin-bottom:8px; border-left:3px solid var(--db-gold); }
.db-schedule-top { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.db-time-input { width:90px; flex-shrink:0; }
.db-med-row { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:8px 10px; border-radius:10px; background:var(--db-panel-alt); margin-bottom:6px; }
.db-med-doses { display:flex; gap:6px; flex-wrap:wrap; }
.db-med-dose { display:flex; align-items:center; gap:4px; font-size:12px; color:var(--db-slate); }
.db-banner { display:flex; align-items:center; gap:8px; background: var(--db-rose-soft); border:1px solid var(--db-rose); color:var(--db-rose); border-radius:10px; padding:8px 10px; margin-bottom:10px; font-size:13px; }
.db-nd-total { font-size:22px; font-weight:700; color:var(--db-gold); }
.db-nd-band { font-size:12px; padding:3px 10px; border-radius:999px; border:1px solid currentColor; }
.db-goal-card { padding:10px; border-radius:10px; background:var(--db-panel-alt); margin-bottom:8px; border-left:4px solid; }
.db-goal-desc { font-size:12px; color:var(--db-slate); margin:4px 0; }
.db-progress-count { font-size:12px; color:var(--db-gold); }
.db-task-card { padding:10px; border-radius:10px; background:var(--db-panel-alt); margin-bottom:8px; }
.db-step-row { display:flex; align-items:center; gap:8px; margin: 6px 0 6px 14px; }
.db-week-grid { width:100%; border-collapse:collapse; font-size:12px; }
.db-week-grid th, .db-week-grid td { text-align:center; padding:4px; border-bottom:1px solid var(--db-border); }
.db-week-grid th { color:var(--db-slate); font-weight:500; }
.db-habit-name { text-align:left !important; }
.db-cat-header { color:var(--db-gold); font-weight:600; font-size:13px; margin: 12px 0 6px; }
.db-vision-grid { display:grid; grid-template-columns: repeat(3, 1fr); gap:8px; }
.db-vision-slot { aspect-ratio: 1; border-radius:12px; border:2px dashed var(--db-border); display:flex; align-items:center; justify-content:center; overflow:hidden; cursor:pointer; position:relative; background:var(--db-panel-alt); color:var(--db-slate); }
.db-vision-slot img { width:100%; height:100%; object-fit:cover; }
.db-vision-remove { position:absolute; top:4px; right:4px; width:22px; height:22px; border-radius:50%; background:var(--db-panel); color:var(--db-ivory); display:flex; align-items:center; justify-content:center; border:1px solid var(--db-border); }
.db-bucket-item { display:flex; align-items:center; gap:8px; padding:8px 4px; border-bottom:1px solid var(--db-border); }
.db-bucket-item.done span { text-decoration:line-through; color:var(--db-slate); }
.db-month-nav { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
.db-month-title { font-size:16px; font-weight:600; color:var(--db-gold); }
.db-cal-grid { display:grid; grid-template-columns: repeat(7,1fr); gap:4px; }
.db-cal-day { aspect-ratio:1; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:11px; background:var(--db-panel-alt); }
.db-stat-grid { display:grid; grid-template-columns: repeat(2,1fr); gap:8px; margin-bottom:12px; }
.db-stat { background:var(--db-panel-alt); border-radius:10px; padding:10px; text-align:center; }
.db-stat-num { font-size:20px; font-weight:700; color:var(--db-gold); }
.db-stat-label { font-size:11px; color:var(--db-slate); }
.db-empty { color:var(--db-slate); font-size:13px; padding:8px 0; }
.db-loading { display:flex; align-items:center; justify-content:center; min-height:100vh; color:var(--db-gold); }
.db-theme-wrap { position:relative; }
.db-theme-panel { position:absolute; right:0; top:36px; width:230px; background:var(--db-panel); border:1px solid var(--db-border); border-radius:12px; padding:8px; z-index:30; box-shadow: 0 8px 24px rgba(0,0,0,0.35); }
.db-theme-panel-title { font-size:12px; color:var(--db-slate); padding:4px 6px 8px; }
.db-theme-option { display:flex; align-items:center; gap:10px; width:100%; text-align:left; padding:8px 6px; border-radius:8px; background:transparent; }
.db-theme-option-active { background: var(--db-gold-soft); }
.db-theme-swatches { display:flex; gap:3px; flex-shrink:0; }
.db-swatch { width:12px; height:20px; border-radius:3px; border:1px solid rgba(255,255,255,0.15); }
@media (prefers-reduced-motion: reduce) { .db-app * { transition:none !important; } }
`;

/* ============================================================
   TODAY TAB
   ============================================================ */

function TodayTab({ selectedDate, setSelectedDate, tasks, setTasks, goals, habitDefs, medications, setMedications }) {
  const dateKey = toKey(selectedDate);
  const [entry, setEntryState] = useState(null);
  const [habitWeek, setHabitWeekState] = useState({});
  const [addingMed, setAddingMed] = useState(false);
  const [reviewNotice, setReviewNotice] = useState("");
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );
  const notifiedRef = useRef(new Set());

  const weekStartKey = toKey(startOfWeek(selectedDate));
  const weekdayKey = WEEKDAYS[selectedDate.getDay()];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const e = await storageGet(`entry:${dateKey}`, null);
      const hw = await storageGet(`habitweek:${weekStartKey}`, {});
      if (!cancelled) {
        setEntryState(e || defaultEntry(dateKey));
        setHabitWeekState(hw);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dateKey, weekStartKey]);

  const setEntry = useCallback(
    (updater) => {
      setEntryState((prev) => {
        const base = prev || defaultEntry(dateKey);
        const next = typeof updater === "function" ? updater(base) : updater;
        storageSet(`entry:${dateKey}`, next);
        return next;
      });
    },
    [dateKey]
  );

  const setHabitWeek = useCallback(
    (updater) => {
      setHabitWeekState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        storageSet(`habitweek:${weekStartKey}`, next);
        return next;
      });
    },
    [weekStartKey]
  );

  const isToday = isSameDay(selectedDate, new Date());

  /* ---- overdue dose detection + notifications (only meaningful for today) ---- */
  const overdueDoses = useMemo(() => {
    if (!isToday || !entry) return [];
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const result = [];
    for (const med of medications) {
      for (const sched of med.schedule || []) {
        const taken = entry.medDoses?.[med.id]?.[sched.label];
        if (!taken && timeToMinutes(sched.time) <= nowMin) {
          result.push({ medId: med.id, medName: med.name, label: sched.label });
        }
      }
    }
    return result;
  }, [isToday, entry, medications]);

  useEffect(() => {
    if (!isToday || notifPermission !== "granted") return;
    const interval = setInterval(() => {
      overdueDoses.forEach((d) => {
        const key = `${dateKey}:${d.medId}:${d.label}`;
        if (!notifiedRef.current.has(key)) {
          notifiedRef.current.add(key);
          try {
            new Notification("Medication reminder", { body: `${d.medName} — ${d.label} dose not yet taken` });
          } catch {}
        }
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [overdueDoses, notifPermission, isToday, dateKey]);

  if (!entry) return <div className="db-empty">Loading today…</div>;

  const ndTotal = ND_FACTORS.reduce((sum, f) => sum + (entry.nd[f.key] || 0), 0);
  const ndBand = ndTotal <= 8 ? "Low" : ndTotal <= 16 ? "Moderate" : "High";
  const ndColor = ndBand === "Low" ? "var(--db-green)" : ndBand === "Moderate" ? "var(--db-amber)" : "var(--db-rose)";

  const updatePriority = (listKey, id, patch) => {
    setEntry((e) => ({ ...e, [listKey]: e[listKey].map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
  };

  const flatSteps = tasks.flatMap((t) => t.steps.map((s) => ({ ...s, taskId: t.id, taskTitle: t.title })));

  const addScheduleSlot = () => {
    setEntry((e) => ({ ...e, schedule: [...e.schedule, { id: uid(), time: "09:00", taskId: null, stepId: null }] }));
  };
  const updateScheduleSlot = (id, patch) => {
    setEntry((e) => ({ ...e, schedule: e.schedule.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));
  };
  const removeScheduleSlot = (id) => {
    setEntry((e) => ({ ...e, schedule: e.schedule.filter((s) => s.id !== id) }));
  };
  const setStepStatus = (taskId, stepId, status) => {
    setTasks((prev) => prev.map((t) => (t.id !== taskId ? t : { ...t, steps: t.steps.map((s) => (s.id === stepId ? { ...s, status } : s)) })));
  };

  /* ---- Daily task review: tick-to-assign in one motion, plus status + defer ---- */
  const assignedTaskIds = new Set([...entry.top3, ...entry.tier2, ...entry.catchAll].map((p) => p.taskId).filter(Boolean));
  const dueToday = tasksDueForReview(tasks, "daily", dateKey, selectedDate).filter((t) => !assignedTaskIds.has(t.id));

  const assignTaskToday = (task, listKey) => {
    const row = { id: uid(), text: task.title, done: false, goalId: task.goalId, taskId: task.id, status: "Started" };
    if (listKey === "catchAll") {
      setEntry((e) => ({ ...e, catchAll: [...e.catchAll, row] }));
      return;
    }
    setEntry((e) => {
      const list = e[listKey];
      const emptyIdx = list.findIndex((p) => !p.taskId && !p.text);
      if (emptyIdx === -1) {
        setReviewNotice(listKey === "top3" ? "Top 3 is full — clear a slot first." : "3 More Things is full — clear a slot first.");
        return e;
      }
      const next = [...list];
      next[emptyIdx] = { ...row, id: list[emptyIdx].id };
      return { ...e, [listKey]: next };
    });
  };

  const setTaskReviewStatus = (listKey, rowId, taskId, status, deferDate) => {
    if (status === "NeedsMoreWork" && deferDate) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: "NeedsMoreWork", statusPeriod: dateKey, deferredTo: deferDate } : t)));
      // clear the slot so it stops occupying today's priority list; it will reappear on the deferred date
      setEntry((e) => {
        if (listKey === "catchAll") return { ...e, catchAll: e.catchAll.filter((p) => p.id !== rowId) };
        return { ...e, [listKey]: e[listKey].map((p) => (p.id === rowId ? { id: p.id, text: "", done: false, goalId: null, taskId: null, status: null } : p)) };
      });
      return;
    }
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status, statusPeriod: dateKey, deferredTo: null } : t)));
    updatePriority(listKey, rowId, { status, done: status === "Completed" });
  };

  const resolvedToday = [...entry.top3, ...entry.tier2, ...entry.catchAll].filter((p) => p.taskId && p.status === "Completed").length;
  const totalDailyAssigned = [...entry.top3, ...entry.tier2, ...entry.catchAll].filter((p) => p.taskId).length;

  const habitsFlat = allHabitsFlat(habitDefs);
  const toggleHabitSlot = (habitId) => {
    setHabitWeek((hw) => {
      const cur = hw[habitId] || {};
      return { ...hw, [habitId]: { ...cur, [weekdayKey]: !cur[weekdayKey] } };
    });
  };

  const addMedication = (med) => {
    setMedications((prev) => [...prev, med]);
    setAddingMed(false);
  };
  const removeMedication = (id) => {
    setMedications((prev) => prev.filter((m) => m.id !== id));
  };
  const toggleDose = (medId, label) => {
    setEntry((e) => ({
      ...e,
      medDoses: { ...e.medDoses, [medId]: { ...(e.medDoses[medId] || {}), [label]: !(e.medDoses[medId]?.[label]) } },
    }));
  };

  return (
    <div>
      {/* Date bar */}
      <div className="db-datebar">
        <input
          type="date"
          className="db-input"
          value={dateKey}
          onChange={(ev) => ev.target.value && setSelectedDate(fromKey(ev.target.value))}
        />
        <button className="db-btn" onClick={() => setSelectedDate(new Date())}>
          <CalendarIcon size={14} /> Today
        </button>
      </div>

      {/* Task review: daily-cadence tasks due for assignment */}
      {(dueToday.length > 0 || totalDailyAssigned > 0) && (
        <div className="db-card">
          <div className="db-card-title">
            <ListChecks size={16} /> Tasks Due Today
          </div>
          {totalDailyAssigned > 0 && (
            <div className="db-card-sub" style={{ marginBottom: 8 }}>
              {resolvedToday} of {totalDailyAssigned} resolved for today
            </div>
          )}
          {reviewNotice && (
            <div className="db-card-sub" style={{ color: "var(--db-rose)", marginBottom: 8 }}>
              {reviewNotice}
            </div>
          )}
          {dueToday.length === 0 ? (
            <div className="db-card-sub">All daily tasks are assigned or resolved for today.</div>
          ) : (
            dueToday.map((t) => (
              <div key={t.id} className="db-review-row">
                <div className="db-review-top">
                  <TrafficDot task={t} goals={goals} />
                  <div className="db-review-title">{t.title}</div>
                </div>
                <div className="db-tier-btns">
                  <button className="db-tier-btn" onClick={() => { setReviewNotice(""); assignTaskToday(t, "top3"); }}>→ Top 3</button>
                  <button className="db-tier-btn" onClick={() => { setReviewNotice(""); assignTaskToday(t, "tier2"); }}>→ Secondary</button>
                  <button className="db-tier-btn" onClick={() => { setReviewNotice(""); assignTaskToday(t, "catchAll"); }}>→ Nice-to-have</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Box 1: Day's Focus */}
      <div className="db-card">
        <div className="db-card-title">
          <Sun size={16} /> Day's Focus
        </div>
        <VoiceInput value={entry.dayFocus} onChange={(v) => setEntry((e) => ({ ...e, dayFocus: v }))} placeholder="What would make today a win?" />
      </div>

      {/* Box 2: Top 3 Priorities */}
      <div className="db-card">
        <div className="db-card-title">
          <Target size={16} /> Top 3 Priorities
        </div>
        {entry.top3.map((p) => (
          <div key={p.id} className="db-priority-row">
            <div className="db-priority-top">
              {p.taskId ? (
                <TaskStatusControl status={p.status} onStatus={(status, deferDate) => setTaskReviewStatus("top3", p.id, p.taskId, status, deferDate)} />
              ) : (
                <CheckBox checked={p.done} onChange={(v) => updatePriority("top3", p.id, { done: v })} />
              )}
              <VoiceInput value={p.text} onChange={(v) => updatePriority("top3", p.id, { text: v })} placeholder="Priority…" />
            </div>
            <div className="db-priority-meta">
              <GoalDot color={allGoals(goals).find((g) => g.id === p.goalId)?.color} />
              <GoalPicker value={p.goalId} onChange={(v) => updatePriority("top3", p.id, { goalId: v })} goals={goals} />
            </div>
          </div>
        ))}
        <div className="db-reward">
          <Sparkles size={16} />
          <input
            className="db-input"
            style={{ background: "transparent", border: "none" }}
            placeholder="Reward for finishing all 3…"
            value={entry.top3Reward}
            onChange={(ev) => setEntry((e) => ({ ...e, top3Reward: ev.target.value }))}
          />
        </div>
      </div>

      {/* Box 3: 3 More Things */}
      <div className="db-card">
        <div className="db-card-title">
          <ListChecks size={16} /> 3 More Things
        </div>
        {entry.tier2.map((p) => (
          <div key={p.id} className="db-priority-row">
            <div className="db-priority-top">
              {p.taskId ? (
                <TaskStatusControl status={p.status} onStatus={(status, deferDate) => setTaskReviewStatus("tier2", p.id, p.taskId, status, deferDate)} />
              ) : (
                <CheckBox checked={p.done} onChange={(v) => updatePriority("tier2", p.id, { done: v })} />
              )}
              <VoiceInput value={p.text} onChange={(v) => updatePriority("tier2", p.id, { text: v })} placeholder="Also today…" />
            </div>
            <div className="db-priority-meta">
              <GoalDot color={allGoals(goals).find((g) => g.id === p.goalId)?.color} />
              <GoalPicker value={p.goalId} onChange={(v) => updatePriority("tier2", p.id, { goalId: v })} goals={goals} />
            </div>
          </div>
        ))}
        <div className="db-reward">
          <Sparkles size={16} />
          <input
            className="db-input"
            style={{ background: "transparent", border: "none" }}
            placeholder="Reward for finishing these 3…"
            value={entry.tier2Reward}
            onChange={(ev) => setEntry((e) => ({ ...e, tier2Reward: ev.target.value }))}
          />
        </div>
      </div>

      {/* Box 4: Catch-all */}
      <div className="db-card">
        <div className="db-card-title">
          <LayoutGrid size={16} /> If There's Time
        </div>
        {entry.catchAll.map((p) => (
          <div key={p.id} className="db-list-item">
            {p.taskId ? (
              <TaskStatusControl status={p.status} onStatus={(status, deferDate) => setTaskReviewStatus("catchAll", p.id, p.taskId, status, deferDate)} />
            ) : (
              <CheckBox checked={p.done} onChange={(v) => updatePriority("catchAll", p.id, { done: v })} />
            )}
            <VoiceInput value={p.text} onChange={(v) => updatePriority("catchAll", p.id, { text: v })} placeholder="Something else…" />
            <IconBtn danger onClick={() => setEntry((e) => ({ ...e, catchAll: e.catchAll.filter((x) => x.id !== p.id) }))}>
              <X size={14} />
            </IconBtn>
          </div>
        ))}
        <button className="db-btn db-btn-ghost" onClick={() => setEntry((e) => ({ ...e, catchAll: [...e.catchAll, emptyPriority()] }))}>
          <Plus size={14} /> Add item
        </button>
      </div>

      {/* Habits & Self-Care (3 is a focus, not a cap) */}
      <div className="db-card">
        <div className="db-card-title">
          <Sparkles size={16} /> Habits &amp; Self-Care
        </div>
        <div className="db-card-sub">3 is a focus, not a limit — ticking here also updates the Habits tab.</div>
        {entry.habitSlotIds.map((habitId, slotIdx) => {
          const done = habitId ? !!habitWeek[habitId]?.[weekdayKey] : false;
          return (
            <div key={slotIdx} className="db-row">
              <CheckBox checked={done} onChange={() => habitId && toggleHabitSlot(habitId)} />
              <select
                className="db-select"
                value={habitId || ""}
                onChange={(ev) => {
                  const v = ev.target.value || null;
                  setEntry((e) => {
                    const ids = [...e.habitSlotIds];
                    ids[slotIdx] = v;
                    return { ...e, habitSlotIds: ids };
                  });
                }}
              >
                <option value="">Choose a habit…</option>
                {Object.entries(habitDefs).map(([cat, list]) => (
                  <optgroup key={cat} label={cat}>
                    {list.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {slotIdx >= 3 && (
                <IconBtn danger onClick={() => setEntry((e) => ({ ...e, habitSlotIds: e.habitSlotIds.filter((_, i) => i !== slotIdx) }))}>
                  <X size={14} />
                </IconBtn>
              )}
            </div>
          );
        })}
        <button className="db-btn db-btn-ghost" onClick={() => setEntry((e) => ({ ...e, habitSlotIds: [...e.habitSlotIds, null] }))}>
          <Plus size={14} /> Add another habit
        </button>
      </div>

      {/* Daily Schedule */}
      <div className="db-card">
        <div className="db-card-title">
          <Clock size={16} /> Daily Schedule
        </div>
        {[...entry.schedule]
          .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
          .map((slot) => {
            const step = flatSteps.find((s) => s.id === slot.stepId);
            return (
              <div key={slot.id} className="db-schedule-row">
                <div className="db-schedule-top">
                  <input
                    type="time"
                    className="db-input db-time-input"
                    value={slot.time}
                    onChange={(ev) => updateScheduleSlot(slot.id, { time: ev.target.value })}
                  />
                  <select
                    className="db-select"
                    style={{ flex: 1 }}
                    value={slot.stepId || ""}
                    onChange={(ev) => {
                      const s = flatSteps.find((x) => x.id === ev.target.value);
                      updateScheduleSlot(slot.id, { stepId: s?.id || null, taskId: s?.taskId || null });
                    }}
                  >
                    <option value="">Link a step…</option>
                    {tasks.map((t) => (
                      <optgroup key={t.id} label={t.title}>
                        {t.steps.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.text || "(untitled step)"}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <IconBtn danger onClick={() => removeScheduleSlot(slot.id)}>
                    <X size={14} />
                  </IconBtn>
                </div>
                {step && (
                  <div style={{ paddingLeft: 4 }}>
                    <StatusPill status={step.status} onCycle={() => setStepStatus(slot.taskId, slot.stepId, nextStatus(step.status))} />
                  </div>
                )}
              </div>
            );
          })}
        <button className="db-btn db-btn-ghost" onClick={addScheduleSlot}>
          <Plus size={14} /> Add time slot
        </button>
      </div>

      {/* ND Check-in */}
      <div className="db-card">
        <div className="db-card-title">
          <Compass size={16} /> Neurodivergence Impact Check-in
        </div>
        <div className="db-card-sub">A personal self-awareness tool, not a diagnostic instrument.</div>
        {ND_FACTORS.map((f) => (
          <div key={f.key} className="db-row" style={{ flexDirection: "column", alignItems: "flex-start" }}>
            <span style={{ fontSize: 13, marginBottom: 4 }}>{f.label}</span>
            <ScoreDots value={entry.nd[f.key]} max={4} onChange={(v) => setEntry((e) => ({ ...e, nd: { ...e.nd, [f.key]: v } }))} />
          </div>
        ))}
        <div className="db-row" style={{ marginTop: 8 }}>
          <span className="db-nd-total">{ndTotal}/24</span>
          <span className="db-nd-band" style={{ color: ndColor }}>
            {ndBand}
          </span>
        </div>
      </div>

      {/* Quick indicators */}
      <div className="db-card">
        <div className="db-card-title">
          <TrendingUp size={16} /> Energy · Productivity · Mood
        </div>
        {[
          { key: "energy", label: "Energy" },
          { key: "productivity", label: "Productivity" },
          { key: "mood", label: "Mood" },
        ].map((f) => (
          <div key={f.key} className="db-row" style={{ flexDirection: "column", alignItems: "flex-start" }}>
            <span style={{ fontSize: 13, marginBottom: 4 }}>{f.label}</span>
            <ScoreDots value={entry[f.key]} min={1} max={5} onChange={(v) => setEntry((e) => ({ ...e, [f.key]: v }))} />
          </div>
        ))}
      </div>

      {/* Medication tracker */}
      <div className="db-card">
        <div className="db-card-title">
          <Pill size={16} /> Medication
        </div>
        {overdueDoses.length > 0 && (
          <div className="db-banner">
            <AlertTriangle size={15} />
            <span>{overdueDoses.map((d) => `${d.medName} (${d.label})`).join(", ")} not yet taken.</span>
          </div>
        )}
        {typeof Notification !== "undefined" && notifPermission !== "granted" && (
          <button
            className="db-btn"
            style={{ marginBottom: 10 }}
            onClick={async () => {
              const perm = await Notification.requestPermission();
              setNotifPermission(perm);
            }}
          >
            <BellRing size={14} /> Enable dose reminders
          </button>
        )}
        {medications.map((med) => (
          <div key={med.id} className="db-med-row">
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{med.name}</div>
              <div className="db-med-doses">
                {med.schedule.map((s) => (
                  <label key={s.label} className="db-med-dose">
                    <CheckBox checked={!!entry.medDoses?.[med.id]?.[s.label]} onChange={() => toggleDose(med.id, s.label)} />
                    {s.label} ({s.time})
                  </label>
                ))}
              </div>
            </div>
            <IconBtn danger onClick={() => removeMedication(med.id)}>
              <Trash2 size={14} />
            </IconBtn>
          </div>
        ))}
        {addingMed ? (
          <AddMedForm onSave={addMedication} onCancel={() => setAddingMed(false)} />
        ) : (
          <button className="db-btn db-btn-ghost" onClick={() => setAddingMed(true)}>
            <Plus size={14} /> Add medication
          </button>
        )}
      </div>

      {/* Random Thoughts */}
      <div className="db-card">
        <div className="db-card-title">Random Thoughts</div>
        <VoiceTextArea value={entry.randomThoughts} onChange={(v) => setEntry((e) => ({ ...e, randomThoughts: v }))} placeholder="Anything on your mind…" rows={3} />
      </div>

      {/* End of Day Reflection */}
      <div className="db-card">
        <div className="db-card-title">End of Day Reflection</div>
        <div style={{ marginBottom: 8 }}>
          <div className="db-card-sub" style={{ marginBottom: 4 }}>
            What went well
          </div>
          <VoiceTextArea value={entry.eod.wentWell} onChange={(v) => setEntry((e) => ({ ...e, eod: { ...e.eod, wentWell: v } }))} rows={2} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <div className="db-card-sub" style={{ marginBottom: 4 }}>
            What was hard
          </div>
          <VoiceTextArea value={entry.eod.wasHard} onChange={(v) => setEntry((e) => ({ ...e, eod: { ...e.eod, wasHard: v } }))} rows={2} />
        </div>
        <div>
          <div className="db-card-sub" style={{ marginBottom: 4 }}>
            One thing to carry into tomorrow
          </div>
          <VoiceTextArea value={entry.eod.carryForward} onChange={(v) => setEntry((e) => ({ ...e, eod: { ...e.eod, carryForward: v } }))} rows={2} />
        </div>
      </div>
    </div>
  );
}

function AddMedForm({ onSave, onCancel }) {
  const [name, setName] = useState("");
  const [schedule, setSchedule] = useState([{ label: "AM", time: "08:00" }]);
  return (
    <div className="db-priority-row">
      <input className="db-input" placeholder="Medication name" value={name} onChange={(e) => setName(e.target.value)} style={{ marginBottom: 6 }} />
      {schedule.map((s, i) => (
        <div key={i} className="db-row">
          <input
            className="db-input"
            style={{ maxWidth: 90 }}
            placeholder="Label"
            value={s.label}
            onChange={(e) => setSchedule((prev) => prev.map((x, idx) => (idx === i ? { ...x, label: e.target.value } : x)))}
          />
          <input
            type="time"
            className="db-input"
            style={{ maxWidth: 110 }}
            value={s.time}
            onChange={(e) => setSchedule((prev) => prev.map((x, idx) => (idx === i ? { ...x, time: e.target.value } : x)))}
          />
          <IconBtn danger onClick={() => setSchedule((prev) => prev.filter((_, idx) => idx !== i))}>
            <X size={14} />
          </IconBtn>
        </div>
      ))}
      <button className="db-btn db-btn-ghost" onClick={() => setSchedule((prev) => [...prev, { label: "", time: "12:00" }])}>
        <Plus size={14} /> Add dose time
      </button>
      <div className="db-row" style={{ marginTop: 8 }}>
        <button
          className="db-btn db-btn-gold"
          onClick={() => name.trim() && onSave({ id: uid(), name: name.trim(), schedule })}
        >
          Save
        </button>
        <button className="db-btn db-btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   WEEKLY PLANNER TAB
   ============================================================ */

function WeeklyPlannerTab({ tasks, setTasks, goals }) {
  const [refDate, setRefDate] = useState(() => new Date());
  const weekStart = startOfWeek(refDate);
  const weekEnd = addDays(weekStart, 6);
  const weekKey = toKey(weekStart);
  const weekLabel = `${weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${weekEnd.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;

  const due = tasksDueForReview(tasks, "weekly", weekKey, refDate);
  const resolvedThisWeek = tasks.filter((t) => t.cadence === "weekly" && t.status === "Completed" && t.statusPeriod === weekKey);

  const [pendingDefer, setPendingDefer] = useState(null);

  const setStatus = (task, status, deferDate) => {
    if (status === "NeedsMoreWork" && deferDate) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: "NeedsMoreWork", statusPeriod: weekKey, deferredTo: deferDate } : t)));
      setPendingDefer(null);
      return;
    }
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status, statusPeriod: weekKey, deferredTo: null } : t)));
  };

  return (
    <div>
      <div className="db-month-nav">
        <IconBtn onClick={() => setRefDate((d) => addDays(d, -7))}>
          <ChevronLeft size={16} />
        </IconBtn>
        <div className="db-month-title">{weekLabel}</div>
        <IconBtn onClick={() => setRefDate((d) => addDays(d, 7))}>
          <ChevronRight size={16} />
        </IconBtn>
      </div>
      <button className="db-btn db-btn-ghost" style={{ marginBottom: 10 }} onClick={() => setRefDate(new Date())}>
        <CalendarIcon size={14} /> This week
      </button>

      <div className="db-card">
        <div className="db-card-title">
          <CalendarRange size={16} /> To Review This Week
        </div>
        <div className="db-card-sub" style={{ marginBottom: 8 }}>
          A week-at-a-glance list for now — a full 7-day grid layout is still being designed.
        </div>
        {due.length === 0 ? (
          <div className="db-card-sub">Nothing weekly-cadence waiting on review.</div>
        ) : (
          due.map((t) => (
            <div key={t.id} className="db-review-row">
              <div className="db-review-top">
                <TrafficDot task={t} goals={goals} />
                <div className="db-review-title">{t.title}</div>
              </div>
              <div className="db-row" style={{ gap: 6 }}>
                <select
                  className="db-status-select"
                  value={t.statusPeriod === weekKey ? t.status || "Started" : "Started"}
                  onChange={(e) => {
                    if (e.target.value === "NeedsMoreWork") {
                      setPendingDefer(t.id);
                      return;
                    }
                    setPendingDefer(null);
                    setStatus(t, e.target.value, null);
                  }}
                >
                  <option value="Started">Started</option>
                  <option value="Completed">Completed</option>
                  <option value="NeedsMoreWork">Needs more work</option>
                </select>
                {pendingDefer === t.id && (
                  <input
                    type="date"
                    className="db-input"
                    onChange={(e) => e.target.value && setStatus(t, "NeedsMoreWork", e.target.value)}
                  />
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {resolvedThisWeek.length > 0 && (
        <div className="db-card">
          <div className="db-card-title">Resolved This Week</div>
          {resolvedThisWeek.map((t) => (
            <div key={t.id} className="db-list-item">
              <Check size={14} />
              <span>{t.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   GOALS & TASKS TAB
   ============================================================ */

const GOAL_TIERS = [
  { kind: "longTerm", label: "Long-Term Goals", sub: "5–10 years" },
  { kind: "midTerm", label: "Mid-Term Goals", sub: "1–2 years" },
  { kind: "shortTerm", label: "Short-Term Goals", sub: "Up to 6 months" },
];
const CADENCE_LABEL = { daily: "Daily", weekly: "Weekly", monthly: "Monthly" };

function GoalsTasksTab({ tasks, setTasks, goals, setGoals }) {
  const linkedStats = (goalId) => {
    const linkedTasks = tasks.filter((t) => t.goalId === goalId);
    const allSteps = linkedTasks.flatMap((t) => t.steps);
    const complete = allSteps.filter((s) => s.status === "Complete").length;
    return { complete, total: allSteps.length };
  };

  const goalCount = () => allGoals(goals).length;
  const addGoal = (kind) => {
    const color = GOAL_COLORS[goalCount() % GOAL_COLORS.length];
    const newGoal = { id: uid(), title: "New goal", description: "", color, deadline: "" };
    setGoals((g) => ({ ...g, [kind]: [...g[kind], newGoal] }));
  };
  const updateGoal = (kind, id, patch) => {
    setGoals((g) => ({ ...g, [kind]: g[kind].map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  };
  const removeGoal = (kind, id) => {
    setGoals((g) => ({ ...g, [kind]: g[kind].filter((x) => x.id !== id) }));
  };

  const addTask = () => {
    setTasks((prev) => [...prev, { id: uid(), title: "New task", goalId: null, cadence: "daily", status: null, statusPeriod: null, deferredTo: null, steps: [] }]);
  };
  const updateTask = (id, patch) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };
  const removeTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };
  const addStep = (taskId) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, steps: [...t.steps, { id: uid(), text: "", status: "Not Started" }] } : t)));
  };
  const updateStep = (taskId, stepId, patch) => {
    setTasks((prev) => prev.map((t) => (t.id !== taskId ? t : { ...t, steps: t.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)) })));
  };
  const removeStep = (taskId, stepId) => {
    setTasks((prev) => prev.map((t) => (t.id !== taskId ? t : { ...t, steps: t.steps.filter((s) => s.id !== stepId) })));
  };

  const GoalSection = ({ kind, label, sub }) => (
    <div className="db-card">
      <div className="db-card-title">
        {label} <span className="db-card-sub" style={{ marginLeft: 6 }}>({sub})</span>
      </div>
      {goals[kind].map((g) => {
        const stats = linkedStats(g.id);
        return (
          <div key={g.id} className="db-goal-card" style={{ borderLeftColor: g.color }}>
            <div className="db-row">
              <input className="db-input" value={g.title} onChange={(e) => updateGoal(kind, g.id, { title: e.target.value })} />
              <IconBtn danger onClick={() => removeGoal(kind, g.id)}>
                <Trash2 size={14} />
              </IconBtn>
            </div>
            <textarea
              className="db-textarea"
              rows={2}
              placeholder="Description"
              value={g.description}
              onChange={(e) => updateGoal(kind, g.id, { description: e.target.value })}
            />
            <div className="db-row" style={{ marginTop: 4 }}>
              <label className="db-card-sub" style={{ minWidth: 62 }}>Deadline</label>
              <input
                type="date"
                className="db-input"
                value={g.deadline || ""}
                onChange={(e) => updateGoal(kind, g.id, { deadline: e.target.value })}
              />
            </div>
            <div className="db-progress-count">
              {stats.total > 0 ? `${stats.complete}/${stats.total} linked steps complete` : "No linked steps yet"}
            </div>
          </div>
        );
      })}
      <button className="db-btn db-btn-ghost" onClick={() => addGoal(kind)}>
        <Plus size={14} /> Add {label.toLowerCase()}
      </button>
    </div>
  );

  return (
    <div>
      {GOAL_TIERS.map((tier) => (
        <GoalSection key={tier.kind} kind={tier.kind} label={tier.label} sub={tier.sub} />
      ))}

      <div className="db-card">
        <div className="db-card-title">Task Tracker</div>
        {tasks.map((t) => (
          <div key={t.id} className="db-task-card">
            <div className="db-row">
              <TrafficDot task={t} goals={goals} />
              <input className="db-input" value={t.title} onChange={(e) => updateTask(t.id, { title: e.target.value })} />
              <GoalPicker value={t.goalId} onChange={(v) => updateTask(t.id, { goalId: v })} goals={goals} />
              <select
                className="db-select db-select-sm"
                value={t.cadence || "daily"}
                onChange={(e) => updateTask(t.id, { cadence: e.target.value })}
                title="How often this task comes up for review"
              >
                {Object.entries(CADENCE_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              <IconBtn danger onClick={() => removeTask(t.id)}>
                <Trash2 size={14} />
              </IconBtn>
            </div>
            {t.steps.map((s) => (
              <div key={s.id} className="db-step-row">
                <input className="db-input" value={s.text} placeholder="Step…" onChange={(e) => updateStep(t.id, s.id, { text: e.target.value })} />
                <StatusPill status={s.status} onCycle={() => updateStep(t.id, s.id, { status: nextStatus(s.status) })} />
                <IconBtn danger onClick={() => removeStep(t.id, s.id)}>
                  <X size={14} />
                </IconBtn>
              </div>
            ))}
            <button className="db-btn db-btn-ghost" style={{ marginLeft: 14 }} onClick={() => addStep(t.id)}>
              <Plus size={14} /> Add step
            </button>
          </div>
        ))}
        <button className="db-btn db-btn-gold" onClick={addTask}>
          <Plus size={14} /> New task
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   HABITS TAB
   ============================================================ */

function HabitsTab({ habitDefs, setHabitDefs }) {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [habitWeek, setHabitWeekState] = useState({});
  const [editing, setEditing] = useState(false);
  const weekStartKey = toKey(weekStart);

  useEffect(() => {
    (async () => {
      const hw = await storageGet(`habitweek:${weekStartKey}`, {});
      setHabitWeekState(hw);
    })();
  }, [weekStartKey]);

  const setHabitWeek = useCallback(
    (updater) => {
      setHabitWeekState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        storageSet(`habitweek:${weekStartKey}`, next);
        return next;
      });
    },
    [weekStartKey]
  );

  const toggle = (habitId, day) => {
    setHabitWeek((hw) => {
      const cur = hw[habitId] || {};
      return { ...hw, [habitId]: { ...cur, [day]: !cur[day] } };
    });
  };

  const renameHabit = (cat, id, name) => {
    setHabitDefs((defs) => ({ ...defs, [cat]: defs[cat].map((h) => (h.id === id ? { ...h, name } : h)) }));
  };

  const categoryTotal = (cat) => {
    let done = 0;
    const list = habitDefs[cat];
    list.forEach((h) => {
      WEEKDAYS.forEach((d) => {
        if (habitWeek[h.id]?.[d]) done++;
      });
    });
    return `${done}/${list.length * 7}`;
  };

  return (
    <div>
      <div className="db-datebar">
        <button className="db-btn" onClick={() => setWeekStart(addDays(weekStart, -7))}>
          <ChevronLeft size={14} />
        </button>
        <div style={{ flex: 1, textAlign: "center", fontSize: 13, color: "var(--db-slate)" }}>
          Week of {formatDisplay(weekStart)}
        </div>
        <button className="db-btn" onClick={() => setWeekStart(addDays(weekStart, 7))}>
          <ChevronRight size={14} />
        </button>
        <button className="db-btn" onClick={() => setWeekStart(startOfWeek(new Date()))}>
          This Week
        </button>
      </div>
      <button className="db-btn db-btn-ghost" style={{ marginBottom: 10 }} onClick={() => setEditing((v) => !v)}>
        <Pencil size={14} /> {editing ? "Done editing" : "Edit habit names"}
      </button>

      {Object.entries(habitDefs).map(([cat, list]) => (
        <div key={cat} className="db-card">
          <div className="db-card-title" style={{ justifyContent: "space-between" }}>
            <span>{cat}</span>
            <span className="db-progress-count">{categoryTotal(cat)}</span>
          </div>
          <table className="db-week-grid">
            <thead>
              <tr>
                <th className="db-habit-name"></th>
                {WEEKDAYS.map((d) => (
                  <th key={d}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((h) => (
                <tr key={h.id}>
                  <td className="db-habit-name">
                    {editing ? (
                      <input className="db-input" style={{ fontSize: 12, padding: "4px 6px" }} value={h.name} onChange={(e) => renameHabit(cat, h.id, e.target.value)} />
                    ) : (
                      h.name
                    )}
                  </td>
                  {WEEKDAYS.map((d) => (
                    <td key={d}>
                      <CheckBox checked={habitWeek[h.id]?.[d]} onChange={() => toggle(h.id, d)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   PROGRESS TAB
   ============================================================ */

function ProgressTab({ theme }) {
  const t = theme || THEMES.navyGold;
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [habitWeeks, setHabitWeeks] = useState([]);

  useEffect(() => {
    (async () => {
      const entryKeys = await storageListKeys("entry:");
      const sortedKeys = entryKeys.sort().slice(-60);
      const entryData = await Promise.all(sortedKeys.map((k) => storageGet(k, null)));
      setEntries(entryData.filter(Boolean));

      const hwKeys = await storageListKeys("habitweek:");
      const sortedHw = hwKeys.sort().slice(-12);
      const hwData = await Promise.all(
        sortedHw.map(async (k) => ({ week: k.replace("habitweek:", ""), data: await storageGet(k, {}) }))
      );
      setHabitWeeks(hwData);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="db-empty">Crunching your data…</div>;
  if (entries.length === 0) return <div className="db-empty">Log a few days on the Today tab to see trends here.</div>;

  const impactByDate = entries
    .map((e) => ({
      date: e.date.slice(5),
      total: ND_FACTORS.reduce((s, f) => s + (e.nd?.[f.key] || 0), 0),
    }))
    .sort((a, b) => (a.date > b.date ? 1 : -1));

  const dayOfWeekAgg = {};
  entries.forEach((e) => {
    const dow = WEEKDAYS[fromKey(e.date).getDay()];
    const total = ND_FACTORS.reduce((s, f) => s + (e.nd?.[f.key] || 0), 0);
    if (!dayOfWeekAgg[dow]) dayOfWeekAgg[dow] = { sum: 0, n: 0 };
    dayOfWeekAgg[dow].sum += total;
    dayOfWeekAgg[dow].n += 1;
  });
  const byDayOfWeek = WEEKDAYS.map((d) => ({ day: d, avg: dayOfWeekAgg[d] ? +(dayOfWeekAgg[d].sum / dayOfWeekAgg[d].n).toFixed(1) : 0 }));

  const factorAgg = ND_FACTORS.map((f) => {
    const vals = entries.map((e) => e.nd?.[f.key] || 0);
    const avg = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
    return { factor: f.label, avg: +avg.toFixed(1) };
  });

  const habitTrend = habitWeeks
    .sort((a, b) => (a.week > b.week ? 1 : -1))
    .map((hw) => {
      const row = { week: hw.week.slice(5) };
      const cats = { "Mind & Mood": 0, "Body & Health": 0, "Self-Care & Growth": 0 };
      Object.values(hw.data).forEach(() => {});
      row["Mind & Mood"] = 0;
      row["Body & Health"] = 0;
      row["Self-Care & Growth"] = 0;
      return row;
    });

  return (
    <div>
      <div className="db-card">
        <div className="db-card-title">Total Impact Over Time</div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={impactByDate}>
            <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: t.slate }} />
            <YAxis tick={{ fontSize: 11, fill: t.slate }} domain={[0, 24]} />
            <Tooltip contentStyle={{ background: t.panel, border: `1px solid ${t.border}` }} />
            <Line type="monotone" dataKey="total" stroke={t.gold} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="db-card">
        <div className="db-card-title">Average Impact by Day of Week</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={byDayOfWeek}>
            <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: t.slate }} />
            <YAxis tick={{ fontSize: 11, fill: t.slate }} domain={[0, 24]} />
            <Tooltip contentStyle={{ background: t.panel, border: `1px solid ${t.border}` }} />
            <Bar dataKey="avg" fill={t.green} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="db-card">
        <div className="db-card-title">Average Impact by Factor</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={factorAgg} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
            <XAxis type="number" domain={[0, 4]} tick={{ fontSize: 11, fill: t.slate }} />
            <YAxis type="category" dataKey="factor" width={110} tick={{ fontSize: 11, fill: t.slate }} />
            <Tooltip contentStyle={{ background: t.panel, border: `1px solid ${t.border}` }} />
            <Bar dataKey="avg" fill={t.amber} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ============================================================
   PERFORMANCE AGAINST OBJECTIVES TAB
   ============================================================ */

function goalPct(goal, tasks) {
  const linked = tasks.filter((t) => t.goalId === goal.id);
  const steps = linked.flatMap((t) => t.steps);
  if (steps.length === 0) return null;
  return steps.filter((s) => s.status === "Complete").length / steps.length;
}

function PerformanceTab({ tasks, goals, theme }) {
  const t = theme || THEMES.navyGold;
  const [snapshots, setSnapshots] = useState({});
  const [loading, setLoading] = useState(true);
  const list = allGoals(goals);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const today = toKey(new Date());
      const next = {};
      for (const g of list) {
        const key = `goalsnapshot:${g.id}`;
        const existing = await storageGet(key, null);
        const pct = goalPct(g, tasks);
        if (pct === null) continue;
        if (!existing) {
          await storageSet(key, { date: today, pct });
          next[g.id] = { date: today, pct };
        } else {
          next[g.id] = existing;
          // refresh the snapshot roughly weekly so the trend keeps moving
          const daysSince = Math.round((new Date() - fromKey(existing.date)) / 86400000);
          if (daysSince >= 7) {
            await storageSet(key, { date: today, pct });
          }
        }
      }
      if (!cancelled) {
        setSnapshots(next);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goals, tasks.length]);

  if (loading) return <div className="db-empty">Crunching your goals…</div>;
  if (list.length === 0) return <div className="db-empty">Add some goals on the Goals &amp; Tasks tab to see progress here.</div>;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div>
      <div className="db-card-sub" style={{ marginBottom: 10 }}>
        Are you converging or stalling on each goal — not "act now" (that's the traffic light on Goals &amp; Tasks), but "is this actually moving."
      </div>
      {GOAL_TIERS.map((tier) => {
        const tierGoals = goals[tier.kind] || [];
        if (tierGoals.length === 0) return null;
        return (
          <div key={tier.kind} className="db-card">
            <div className="db-card-title">{tier.label}</div>
            {tierGoals.map((g) => {
              const pct = goalPct(g, tasks);
              const linked = tasks.filter((tk) => tk.goalId === g.id);
              const steps = linked.flatMap((tk) => tk.steps);
              const complete = steps.filter((s) => s.status === "Complete").length;
              const snap = snapshots[g.id];
              let trend = "Trend building — check back in a week.";
              if (snap && pct !== null) {
                const delta = pct - snap.pct;
                if (Math.abs(delta) < 0.03) trend = "Holding steady";
                else if (delta > 0) trend = "Active — moving forward";
                else trend = "Stagnating — no recent progress";
              }
              let deadlineNote = "No deadline set";
              if (g.deadline) {
                const days = Math.round((fromKey(g.deadline) - today) / 86400000);
                deadlineNote = days < 0 ? `Deadline passed ${Math.abs(days)}d ago` : `${days}d to deadline`;
              }
              return (
                <div key={g.id} className="db-goal-card" style={{ borderLeftColor: g.color }}>
                  <div className="db-row">
                    <span style={{ flex: 1 }}>{g.title}</span>
                  </div>
                  <div className="db-progress-count">
                    {steps.length > 0 ? `${complete}/${steps.length} steps complete (${Math.round((pct || 0) * 100)}%)` : "No linked steps yet"}
                  </div>
                  <div className="db-card-sub">{deadlineNote} · {trend}</div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   FUTURE TAB
   ============================================================ */

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 800;
        let { width, height } = img;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height >= width && height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function FutureTab({ bucketlist, setBucketlist, visionboard, setVisionboard }) {
  const addBucket = () => setBucketlist((prev) => [...prev, { id: uid(), text: "", done: false, term: "shortTerm", detail: "", budget: "" }]);
  const updateBucket = (id, patch) => setBucketlist((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const removeBucket = (id) => setBucketlist((prev) => prev.filter((b) => b.id !== id));

  const handleFile = async (idx, file) => {
    if (!file) return;
    try {
      const dataUrl = await compressImage(file);
      setVisionboard((prev) => prev.map((p, i) => (i === idx ? dataUrl : p)));
    } catch (e) {
      console.error("image compress failed", e);
    }
  };

  return (
    <div>
      <div className="db-card">
        <div className="db-card-title">Bucket List</div>
        {bucketlist.map((b) => (
          <div key={b.id} className={`db-bucket-item ${b.done ? "done" : ""}`} style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }}>
            <div className="db-row">
              <CheckBox checked={b.done} onChange={(v) => updateBucket(b.id, { done: v })} />
              <VoiceInput value={b.text} onChange={(v) => updateBucket(b.id, { text: v })} placeholder="Someday…" />
              <IconBtn danger onClick={() => removeBucket(b.id)}>
                <X size={14} />
              </IconBtn>
            </div>
            <div className="db-row" style={{ paddingLeft: 30, gap: 8 }}>
              <select className="db-select db-select-sm" value={b.term || "shortTerm"} onChange={(e) => updateBucket(b.id, { term: e.target.value })}>
                <option value="longTerm">Long-term</option>
                <option value="midTerm">Mid-term</option>
                <option value="shortTerm">Short-term</option>
              </select>
              <input className="db-input" placeholder="Detail (optional)" value={b.detail || ""} onChange={(e) => updateBucket(b.id, { detail: e.target.value })} />
              <input className="db-input" style={{ maxWidth: 110 }} placeholder="Budget (optional)" value={b.budget || ""} onChange={(e) => updateBucket(b.id, { budget: e.target.value })} />
            </div>
          </div>
        ))}
        <button className="db-btn db-btn-ghost" onClick={addBucket}>
          <Plus size={14} /> Add to bucket list
        </button>
      </div>

      <div className="db-card">
        <div className="db-card-title">Vision Board</div>
        <div className="db-vision-grid">
          {visionboard.map((photo, idx) => (
            <label key={idx} className="db-vision-slot">
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFile(idx, e.target.files?.[0])} />
              {photo ? <img src={photo} alt="" /> : <Camera size={22} />}
              {photo && (
                <span
                  className="db-vision-remove"
                  onClick={(e) => {
                    e.preventDefault();
                    setVisionboard((prev) => prev.map((p, i) => (i === idx ? null : p)));
                  }}
                >
                  <X size={13} />
                </span>
              )}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MONTH VIEW TAB
   ============================================================ */

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function MonthViewTab({ theme, tasks, setTasks, goals }) {
  const t = theme || THEMES.navyGold;
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [entries, setEntries] = useState([]);
  const [notes, setNotesState] = useState({ lookingAhead: "", memories: "", insights: "", improve: "", strengths: "", affirmations: "", gratitude: "" });
  const [loading, setLoading] = useState(true);
  const [pendingDefer, setPendingDefer] = useState(null);
  const mKey = `${month.year}-${String(month.month + 1).padStart(2, "0")}`;
  const refDate = new Date(month.year, month.month, 1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const dim = daysInMonth(month.year, month.month);
      const keys = Array.from({ length: dim }, (_, i) => {
        const d = new Date(month.year, month.month, i + 1);
        return `entry:${toKey(d)}`;
      });
      const data = await Promise.all(keys.map((k) => storageGet(k, null)));
      const n = await storageGet(`monthnotes:${mKey}`, {});
      if (!cancelled) {
        setEntries(data.filter(Boolean));
        setNotesState({ lookingAhead: "", memories: "", insights: "", improve: "", strengths: "", affirmations: "", gratitude: "", ...n });
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mKey, month.year, month.month]);

  const setNotes = (updater) => {
    setNotesState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      storageSet(`monthnotes:${mKey}`, next);
      return next;
    });
  };

  const avg = (fn) => {
    const vals = entries.map(fn).filter((v) => v > 0);
    if (!vals.length) return "—";
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  };

  const dim = daysInMonth(month.year, month.month);
  const firstDow = new Date(month.year, month.month, 1).getDay();
  const entryByDay = {};
  entries.forEach((e) => {
    entryByDay[fromKey(e.date).getDate()] = e;
  });

  const bandColor = (e) => {
    if (!e) return "var(--db-panel-alt)";
    const total = ND_FACTORS.reduce((s, f) => s + (e.nd?.[f.key] || 0), 0);
    if (total <= 8) return t.green + "55";
    if (total <= 16) return t.amber + "55";
    return t.rose + "55";
  };

  const dueMonthly = tasksDueForReview(tasks, "monthly", mKey, refDate);
  const setMonthlyStatus = (task, status, deferDate) => {
    if (status === "NeedsMoreWork" && deferDate) {
      setTasks((prev) => prev.map((x) => (x.id === task.id ? { ...x, status: "NeedsMoreWork", statusPeriod: mKey, deferredTo: deferDate } : x)));
      setPendingDefer(null);
      return;
    }
    setTasks((prev) => prev.map((x) => (x.id === task.id ? { ...x, status, statusPeriod: mKey, deferredTo: null } : x)));
  };

  const yearOptions = [];
  const thisYear = new Date().getFullYear();
  for (let y = thisYear - 5; y <= thisYear + 5; y++) yearOptions.push(y);

  return (
    <div>
      <div className="db-month-nav">
        <IconBtn onClick={() => setMonth((m) => (m.month === 0 ? { year: m.year - 1, month: 11 } : { year: m.year, month: m.month - 1 }))}>
          <ChevronLeft size={16} />
        </IconBtn>
        <div className="db-month-picker">
          <select className="db-select db-select-sm" value={month.month} onChange={(e) => setMonth((m) => ({ ...m, month: Number(e.target.value) }))}>
            {MONTH_NAMES.map((name, i) => (
              <option key={name} value={i}>{name}</option>
            ))}
          </select>
          <select className="db-select db-select-sm" value={month.year} onChange={(e) => setMonth((m) => ({ ...m, year: Number(e.target.value) }))}>
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <IconBtn onClick={() => setMonth((m) => (m.month === 11 ? { year: m.year + 1, month: 0 } : { year: m.year, month: m.month + 1 }))}>
          <ChevronRight size={16} />
        </IconBtn>
      </div>

      {loading ? (
        <div className="db-empty">Loading month…</div>
      ) : (
        <>
          <div className="db-card">
            <div className="db-card-title">
              <CalendarDays size={16} /> At a Glance
            </div>
            <div className="db-stat-grid">
              <div className="db-stat">
                <div className="db-stat-num">{entries.length}</div>
                <div className="db-stat-label">Days logged</div>
              </div>
              <div className="db-stat">
                <div className="db-stat-num">{avg((e) => e.energy)}</div>
                <div className="db-stat-label">Avg energy</div>
              </div>
              <div className="db-stat">
                <div className="db-stat-num">{avg((e) => e.productivity)}</div>
                <div className="db-stat-label">Avg productivity</div>
              </div>
              <div className="db-stat">
                <div className="db-stat-num">{avg((e) => e.mood)}</div>
                <div className="db-stat-label">Avg mood</div>
              </div>
            </div>
            <div className="db-cal-grid">
              {Array.from({ length: firstDow }).map((_, i) => (
                <div key={`pad-${i}`} />
              ))}
              {Array.from({ length: dim }).map((_, i) => {
                const day = i + 1;
                const e = entryByDay[day];
                const dow = (firstDow + i) % 7;
                const weekend = dow === 0 || dow === 6;
                return (
                  <div key={day} className={`db-cal-day ${weekend ? "db-weekend" : ""}`} style={{ background: bandColor(e) }}>
                    {day}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="db-card">
            <div className="db-card-title">
              <CalendarDays size={16} /> Monthly Tasks Due for Review
            </div>
            {dueMonthly.length === 0 ? (
              <div className="db-card-sub">Nothing monthly-cadence waiting on review.</div>
            ) : (
              dueMonthly.map((task) => (
                <div key={task.id} className="db-review-row">
                  <div className="db-review-top">
                    <TrafficDot task={task} goals={goals} />
                    <div className="db-review-title">{task.title}</div>
                  </div>
                  <div className="db-row" style={{ gap: 6 }}>
                    <select
                      className="db-status-select"
                      value={task.statusPeriod === mKey ? task.status || "Started" : "Started"}
                      onChange={(e) => {
                        if (e.target.value === "NeedsMoreWork") {
                          setPendingDefer(task.id);
                          return;
                        }
                        setPendingDefer(null);
                        setMonthlyStatus(task, e.target.value, null);
                      }}
                    >
                      <option value="Started">Started</option>
                      <option value="Completed">Completed</option>
                      <option value="NeedsMoreWork">Needs more work</option>
                    </select>
                    {pendingDefer === task.id && (
                      <input type="date" className="db-input" onChange={(e) => e.target.value && setMonthlyStatus(task, "NeedsMoreWork", e.target.value)} />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="db-card">
            <div className="db-card-title">Looking Ahead</div>
            <VoiceTextArea value={notes.lookingAhead} onChange={(v) => setNotes((n) => ({ ...n, lookingAhead: v }))} rows={3} placeholder="What's coming up this month…" />
          </div>

          <div className="db-card">
            <div className="db-card-title">Looking Back</div>
            <div className="db-card-sub" style={{ marginBottom: 4 }}>Memories</div>
            <VoiceTextArea value={notes.memories} onChange={(v) => setNotes((n) => ({ ...n, memories: v }))} rows={2} placeholder="What stood out this month…" />
            <div className="db-card-sub" style={{ marginTop: 10, marginBottom: 4 }}>Insights / lessons learned</div>
            <VoiceTextArea value={notes.insights} onChange={(v) => setNotes((n) => ({ ...n, insights: v }))} rows={2} placeholder="What did this month teach you…" />
            <div className="db-card-sub" style={{ marginTop: 10, marginBottom: 4 }}>Things to do better</div>
            <VoiceTextArea value={notes.improve} onChange={(v) => setNotes((n) => ({ ...n, improve: v }))} rows={2} placeholder="What would you change…" />
            <div className="db-card-sub" style={{ marginTop: 10, marginBottom: 4 }}>Strengths</div>
            <VoiceTextArea value={notes.strengths} onChange={(v) => setNotes((n) => ({ ...n, strengths: v }))} rows={2} placeholder="What did you do well…" />
            <div className="db-card-sub" style={{ marginTop: 10, marginBottom: 4 }}>Affirmations</div>
            <VoiceTextArea value={notes.affirmations} onChange={(v) => setNotes((n) => ({ ...n, affirmations: v }))} rows={2} placeholder="What do you want to remember about yourself…" />
            <div className="db-card-sub" style={{ marginTop: 10, marginBottom: 4 }}>Gratitude</div>
            <VoiceTextArea value={notes.gratitude} onChange={(v) => setNotes((n) => ({ ...n, gratitude: v }))} rows={2} placeholder="What are you grateful for…" />
          </div>
        </>
      )}
    </div>
  );
}

/* ============================================================
   APP SHELL
   ============================================================ */

const TABS = [
  { key: "goals", label: "Goals & Tasks", icon: Target },
  { key: "monthly", label: "Monthly Planner", icon: CalendarDays },
  { key: "weekly", label: "Weekly Planner", icon: CalendarRange },
  { key: "daily", label: "Daily Planner", icon: Sun },
  { key: "habits", label: "Habit Monitoring", icon: ListChecks },
  { key: "wellbeing", label: "Neurodivergence / Wellbeing Review", icon: Brain },
  { key: "performance", label: "Performance Against Objectives", icon: Award },
  { key: "future", label: "Future Objectives", icon: Compass },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const [tasks, setTasksState] = useState([]);
  const [goals, setGoalsState] = useState({ longTerm: [], midTerm: [], shortTerm: [] });
  const [habitDefs, setHabitDefsState] = useState(DEFAULT_HABIT_DEFS);
  const [medications, setMedicationsState] = useState([]);
  const [bucketlist, setBucketlistState] = useState([]);
  const [visionboard, setVisionboardState] = useState(Array(6).fill(null));
  const [themeName, setThemeNameState] = useState("navyGold");

  useEffect(() => {
    (async () => {
      const [t, g, h, m, b, v, th] = await Promise.all([
        storageGet("tasks", []),
        storageGet("goals", { longTerm: [], midTerm: [], shortTerm: [] }),
        storageGet("habitdefs", DEFAULT_HABIT_DEFS),
        storageGet("medications", []),
        storageGet("bucketlist", []),
        storageGet("visionboard", Array(6).fill(null)),
        storageGet("theme", "navyGold"),
      ]);
      setTasksState(t);
      setGoalsState(g);
      setHabitDefsState(h);
      setMedicationsState(m);
      setBucketlistState(b);
      setVisionboardState(v);
      setThemeNameState(THEMES[th] ? th : "navyGold");
      setLoading(false);
    })();
  }, []);

  const setThemeName = (name) => {
    setThemeNameState(name);
    storageSet("theme", name);
  };
  const activeTheme = THEMES[themeName] || THEMES.navyGold;

  function makeSetter(setState, key) {
    return (updater) => {
      setState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        storageSet(key, next);
        return next;
      });
    };
  }

  const setTasks = makeSetter(setTasksState, "tasks");
  const setGoals = makeSetter(setGoalsState, "goals");
  const setHabitDefs = makeSetter(setHabitDefsState, "habitdefs");
  const setMedications = makeSetter(setMedicationsState, "medications");
  const setBucketlist = makeSetter(setBucketlistState, "bucketlist");
  const setVisionboard = makeSetter(setVisionboardState, "visionboard");

  return (
    <div className="db-app" style={themeToCssVars(activeTheme)}>
      <style>{STYLES}</style>
      {loading ? (
        <div className="db-loading">Loading D.Beste Daily…</div>
      ) : (
        <>
          <div className="db-topbar">
            <div className="db-brand">
              <div className="db-brand-left">
                <div className="db-brand-mark db-display">D</div>
                <div className="db-brand-title db-display">D.Beste Daily</div>
              </div>
              <ThemePicker themeName={themeName} setThemeName={setThemeName} />
            </div>
            <div className="db-tabs">
              {TABS.map((t) => {
                const Icon = t.icon;
                return (
                  <button key={t.key} className={`db-tab ${activeTab === t.key ? "db-tab-active" : ""}`} onClick={() => setActiveTab(t.key)}>
                    <Icon size={14} /> {t.label}
                  </button>
                );
              })}
            </div>
          </div>
          <main className="db-main">
            {activeTab === "daily" && (
              <TodayTab
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                tasks={tasks}
                setTasks={setTasks}
                goals={goals}
                habitDefs={habitDefs}
                medications={medications}
                setMedications={setMedications}
              />
            )}
            {activeTab === "goals" && <GoalsTasksTab tasks={tasks} setTasks={setTasks} goals={goals} setGoals={setGoals} />}
            {activeTab === "weekly" && <WeeklyPlannerTab tasks={tasks} setTasks={setTasks} goals={goals} />}
            {activeTab === "habits" && <HabitsTab habitDefs={habitDefs} setHabitDefs={setHabitDefs} />}
            {activeTab === "wellbeing" && <ProgressTab theme={activeTheme} />}
            {activeTab === "performance" && <PerformanceTab tasks={tasks} goals={goals} theme={activeTheme} />}
            {activeTab === "future" && (
              <FutureTab bucketlist={bucketlist} setBucketlist={setBucketlist} visionboard={visionboard} setVisionboard={setVisionboard} />
            )}
            {activeTab === "monthly" && <MonthViewTab theme={activeTheme} tasks={tasks} setTasks={setTasks} goals={goals} />}
          </main>
        </>
      )}
    </div>
  );
}
