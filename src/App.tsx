/// <reference types="vite/client" />
import { useState, useRef, useEffect, useCallback } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";
// Firebase Config
const firebaseConfig = {
  projectId: "vinodhan-coating",
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: "vinodhan-coating.firebaseapp.com",
  databaseURL: "https://vinodhan-coating.firebaseio.com",
  storageBucket: "vinodhan-coating.appspot.com",
  messagingSenderId: import.meta.env.VITE_FB_SENDER_ID || "",
  appId: import.meta.env.VITE_FB_APP_ID || "",
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
setPersistence(auth, browserLocalPersistence).catch(err => console.error("Persistence error:", err));

// Email to Role mapping
const EMAIL_ROLE_MAP = {
  "dhanshek514@gmail.com": { role: "Owner", name: "DS" },
  "sansuiarun@gmail.com": { role: "Owner", name: "Arun" },
  "vinothsakura@gmail.com": { role: "Site Executive", name: "Vinoth Kumar. N" }
};
const FB_PROJECT = "vinodhan-coating";
const FB_API_KEY = import.meta.env.VITE_FB_API_KEY;
const FB_BASE = `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/vinodhan`;

async function fbGet(docId, fallback) {
  try {
    console.log("🔄 Fetching:", docId);

    const res = await fetch(`${FB_BASE}/${docId}?key=${FB_API_KEY}`, {
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!res.ok) {
      console.error(`❌ fbGet failed for ${docId}:`, res.status, res.statusText);
      return fallback;
    }

    const json = await res.json();
    const parsed = JSON.parse(json.fields?.data?.stringValue ?? JSON.stringify(fallback));
    console.log("✅ Loaded:", docId, parsed);
    return parsed;

  } catch (e) {
    console.error("❌ fbGet error:", e);
    return fallback;
  }
}
async function fbSet(docId, data) {
  try {
    console.log("💾 Saving:", docId);

    const res = await fetch(`${FB_BASE}/${docId}?key=${FB_API_KEY}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: { data: { stringValue: JSON.stringify(data) } } })
    });

    if (!res.ok) {
      console.error(`❌ fbSet failed for ${docId}:`, res.status, res.statusText);
      return;
    }

    console.log("✅ Saved:", docId);

  } catch (e) {
    console.error("❌ fbSet error:", e);
  }
}
async function fbBackup(data) {
  try {
    console.log("🔐 Creating backup...");

    const backupId = new Date().toISOString().split("T")[0];
    const res = await fetch(`${FB_BASE}/backup_${backupId}?key=${FB_API_KEY}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: { data: { stringValue: JSON.stringify(data) } } })
    });

    if (!res.ok) {
      console.error(`❌ Backup failed:`, res.status, res.statusText);
      return;
    }

    console.log("✅ Backup created:", backupId);

  } catch (e) {
    console.error("❌ backup error:", e);
  }
}
const printCSS = `@page{size:A4;margin:0;}body{font-family:'Segoe UI',sans-serif;color:#1a2b4a;background:#fff;padding:15mm;margin:0;font-size:14px;}table{border-collapse:collapse;width:100%;}th,td{padding:7px 9px;font-size:13px;}h1,h2,h3{font-size:18px;}img{max-width:100%;object-fit:cover;}.no-print{display:none!important;}.print-only{display:inline!important;}.sig-section{page-break-inside:avoid;page-break-before:auto;}.worker-tile{page-break-inside:avoid;}.worker-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}`;
function printSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const clone = el.cloneNode(true) as HTMLElement;
  clone.style.display = "block";
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>VinoDhan Coating</title><style>${printCSS}</style></head><body onload="window.print();">${clone.outerHTML}</body></html>`;
  const existing = document.getElementById("print-overlay");
  if (existing) document.body.removeChild(existing);
  const overlay = document.createElement("div");
  overlay.id = "print-overlay";
  overlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:#f0f4f9;z-index:99999;display:flex;flex-direction:column;font-family:'Segoe UI',sans-serif;";
  const bar = document.createElement("div");
  bar.style.cssText = "display:flex;align-items:center;justify-content:space-between;padding:12px 20px;background:#0f3172;flex-shrink:0;gap:10px;flex-wrap:wrap;";
  const backBtn = document.createElement("button");
  backBtn.innerText = "← Back";
  backBtn.style.cssText = "background:rgba(255,255,255,0.15);color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;";
  backBtn.onclick = () => document.body.removeChild(overlay);
  const title = document.createElement("div");
  title.innerText = "Preview — scroll to review";
  title.style.cssText = "color:#fff;font-size:13px;font-weight:600;flex:1;text-align:center;";
  const dlBtn = document.createElement("button");
  dlBtn.innerText = "⬇️ Download & Print";
  dlBtn.style.cssText = "background:#f59e0b;color:#1a1a1a;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:800;cursor:pointer;";
  dlBtn.onclick = () => {
    const encoded = "data:text/html;charset=utf-8," + encodeURIComponent(html);
    const a = document.createElement("a");
    a.href = encoded; a.download = "VinoDhan-Document.html";
    a.style.display = "none";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };
  bar.appendChild(backBtn); bar.appendChild(title); bar.appendChild(dlBtn);
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "flex:1;width:100%;border:none;background:#fff;";
  overlay.appendChild(bar); overlay.appendChild(iframe);
  document.body.appendChild(overlay);
  iframe.contentDocument.open();
  iframe.contentDocument.write(html);
  iframe.contentDocument.close();
}

const USERS = [
  { id: "DHANS1416", name: "DS", role: "Owner", password: "Riseup1416" },
  { id: "Site Executive", name: "Vinoth Kumar. N", role: "Site Executive", password: "Vinoth1024" },
];
const USER_PHONES = { "DHANS1416": "9488246119", "Site Executive": "9486971024" };
const CATEGORIES = ["Applicator", "Semi-Applicator", "Helper"];
const CAT_COLOR = {
  "Applicator": { bg: "#dbeafe", color: "#1e40af" },
  "Semi-Applicator": { bg: "#ede9fe", color: "#5b21b6" },
  "Helper": { bg: "#dcfce7", color: "#166534" },
};
const WORK_TYPES = ["SQM", "RMT", "Manpower", "KGS", "Other"];
const WORK_TYPE_COLOR = {
  "SQM": { bg: "#dbeafe", color: "#1e40af" },
  "RMT": { bg: "#ede9fe", color: "#5b21b6" },
  "Manpower": { bg: "#fef3c7", color: "#d97706" },
  "KGS": { bg: "#dcfce7", color: "#166534" },
  "Other": { bg: "#fee2e2", color: "#991b1b" },
};
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const today = new Date().toISOString().split("T")[0];
const getDaysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();
const fmtDate = d => { if (!d) return "—"; const [y, m, dy] = d.split("-"); return `${dy}/${m}/${y}`; };
const RECYCLE_PASSWORD = "ARUN9312";

const EMPTY_WORKER = { id: 0, name: "", category: "Applicator", phone: "", aadhaar: "", doj: "", dob: "", photo: "" };
const EMPTY_EXEC = { name: "Vinoth Kumar. N", phone: "", aadhaar: "", doj: "", dob: "", photo: "" };
const INIT_WORKERS = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `Worker ${i + 1}`, category: i < 4 ? "Applicator" : i < 8 ? "Semi-Applicator" : "Helper", phone: "", aadhaar: "", doj: "", dob: "", photo: "" }));
const INIT_COMPANY = { name: "VinoDhan Coating", address: "Chennai, Tamil Nadu", phone: "+91 XXXXX XXXXX", gstin: "XX-XXXXXXXXX" };
const INIT_CLIENT = { name: "Swathi Engineering Agency", sendTo: "", address: "", place: "Chennai", pincode: "600037", phone: "", measureNo: "" };
const INIT_BANK = { accName: "VinoDhan Coating", bank: "Indian Bank", accNo: "XXXXXXXXXXXX", ifsc: "IDIB000XXXX", upi: "vinodhan@upi" };

type StyleObj = Record<string, any>;

const S: Record<string, any> = {
  btn: (bg = "#1e50a0", color = "#fff"): StyleObj => ({ background: bg, color, border: "none", borderRadius: "8px", padding: "9px 18px", fontWeight: 600, fontSize: "13px", cursor: "pointer" } as StyleObj),
  card: { background: "#fff", borderRadius: "14px", boxShadow: "0 2px 16px rgba(30,80,160,0.08)", padding: "20px" } as StyleObj,
  inp: { width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1.5px solid #bfdbfe", fontSize: "13px", outline: "none", boxSizing: "border-box", color: "#1a2b4a" } as StyleObj,
  lbl: { fontSize: "12px", fontWeight: 600, color: "#6b84a3", display: "block", marginBottom: "4px" } as StyleObj,
  badge: (cat: string): StyleObj => ({ ...CAT_COLOR[cat], fontSize: "11px", fontWeight: 600, borderRadius: "20px", padding: "2px 10px", display: "inline-block" } as StyleObj),
  wbadge: (type: string): StyleObj => ({ ...WORK_TYPE_COLOR[type], fontSize: "10px", fontWeight: 700, borderRadius: "20px", padding: "2px 8px", display: "inline-block" } as StyleObj),
};

function loadS(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } }
function saveS(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { } }

function calcWork(w) {
  if (w.workType === "Manpower") return (Number(w.labour) || 0) * (Number(w.rate) || 0);
  if (w.workType === "Other") return Number(w.amount) || 0;
  return (Number(w.area) || 0) * (Number(w.rate) || 0);
}
function workUnitLabel(w) {
  if (w.workType === "RMT") return `${w.area}rmt × ₹${w.rate}`;
  if (w.workType === "Manpower") return `${w.labour} Labour × ₹${w.rate}/day`;
  if (w.workType === "KGS") return `${w.area}kgs × ₹${w.rate}`;
  if (w.workType === "Other") return `₹${w.amount}`;
  return `${w.area}m² × ₹${w.rate}`;
}

// ── LOGO ──────────────────────────────────────────────
function LogoHex({ size = 48 }) {
  const cx = size / 2, r = size * 0.46, ri = size * 0.38;
  const pts = rad => Array.from({ length: 6 }, (_, i) => { const a = Math.PI / 180 * (60 * i - 30); return `${cx + rad * Math.cos(a)},${cx + rad * Math.sin(a)}`; }).join(" ");
  const lw = size * 0.38, lx = cx - lw / 2, lh = size * 0.072, dotY = cx + size * 0.16, dotCount = 5, dotGap = lw / (dotCount + 1);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id="lg1" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#d97706" /><stop offset="100%" stopColor="#f59e0b" /></linearGradient>
        <linearGradient id="lg2" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#92400e" /><stop offset="100%" stopColor="#b45309" /></linearGradient>
        <linearGradient id="lg3" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#451a03" /><stop offset="100%" stopColor="#78350f" /></linearGradient>
      </defs>
      <polygon points={pts(r)} fill="none" stroke="#f59e0b" strokeWidth={size * 0.03} />
      <polygon points={pts(ri)} fill="#162a4a" />
      <rect x={lx} y={dotY + lh * 0.2} width={lw} height={lh} rx={2} fill="url(#lg1)" />
      <rect x={lx} y={dotY - lh * 0.9} width={lw} height={lh} rx={2} fill="url(#lg2)" />
      <rect x={lx} y={dotY - lh * 2.0} width={lw} height={lh} rx={2} fill="url(#lg3)" />
      {Array.from({ length: dotCount }, (_, i) => <circle key={i} cx={lx + dotGap * (i + 1)} cy={dotY + lh * 0.7} r={size * 0.022} fill="#fff" fillOpacity={0.6} />)}
      <line x1={cx} y1={dotY - lh * 2.2} x2={cx} y2={dotY - lh * 3.5} stroke="#9ca3af" strokeWidth={size * 0.04} strokeLinecap="round" />
      <line x1={cx} y1={dotY - lh * 3.5} x2={cx + size * 0.14} y2={dotY - lh * 3.5} stroke="#9ca3af" strokeWidth={size * 0.04} strokeLinecap="round" />
      <line x1={cx + size * 0.14} y1={dotY - lh * 3.5} x2={cx + size * 0.14} y2={dotY - lh * 2.5} stroke="#9ca3af" strokeWidth={size * 0.04} strokeLinecap="round" />
      <rect x={cx - size * 0.18} y={dotY - lh * 2.5} width={size * 0.36} height={size * 0.1} rx={size * 0.05} fill="#d1d5db" />
    </svg>
  );
}

function ErrBox({ msg }) { return <div style={{ color: "#dc2626", fontSize: "12px", marginBottom: "12px", padding: "8px 12px", background: "#fee2e2", borderRadius: "8px" }}>{msg}</div>; }
function SuccessBox({ msg }) { return <div style={{ color: "#166534", fontSize: "12px", marginBottom: "12px", padding: "8px 12px", background: "#dcfce7", borderRadius: "8px" }}>✅ {msg}</div>; }

function EditField({ value, onChange, style = {}, placeholder = "Click to edit" }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const commit = () => { onChange(val); setEditing(false); };
  if (editing) return <input value={val} onChange={e => setVal(e.target.value)} onBlur={commit} autoFocus onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }} style={{ ...style, border: "1.5px solid #60a5fa", borderRadius: "4px", padding: "2px 6px", outline: "none", fontSize: "inherit", fontWeight: "inherit", fontFamily: "inherit", background: "#eff6ff", boxSizing: "border-box" }} />;
  return <span onClick={() => { setVal(value); setEditing(true); }} title="Click to edit" style={{ ...style, cursor: "text", borderBottom: "1px dashed #bfdbfe", minWidth: "40px", display: "inline-block" }}>{value || <span style={{ color: "#9db3cc", fontStyle: "italic" }}>{placeholder}</span>}</span>;
}

function PhotoUpload({ value, onChange }) {
  const handle = e => { e.stopPropagation(); const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = ev => onChange(ev.target.result); r.readAsDataURL(f); };
  return (
    <div style={{ marginBottom: "10px" }} onClick={e => e.stopPropagation()}>
      <label style={S.lbl}>Photo</label>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {value ? <img src={value} style={{ width: "56px", height: "56px", borderRadius: "8px", objectFit: "cover", border: "1.5px solid #bfdbfe" }} />
          : <div style={{ width: "56px", height: "56px", borderRadius: "8px", background: "#f0f4f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", border: "1.5px dashed #bfdbfe" }}>👤</div>}
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <label onClick={e => e.stopPropagation()} style={{ ...S.btn("#f0f6ff", "#1e50a0"), padding: "6px 12px", fontSize: "12px", cursor: "pointer", display: "inline-block" }}>
            📷 {value ? "Change" : "Upload"} Photo
            <input type="file" accept="image/*" onChange={handle} style={{ display: "none" }} onClick={e => e.stopPropagation()} />
          </label>
          {value && <button type="button" onClick={e => { e.stopPropagation(); onChange(""); }} style={{ ...S.btn("#fee2e2", "#991b1b"), padding: "6px 10px", fontSize: "12px" }}>✗</button>}
        </div>
      </div>
    </div>
  );
}

// ── PASSWORD MODAL ────────────────────────────────────
function PwModal({ title, onConfirm, onCancel }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const confirm = () => {
    if (pw !== RECYCLE_PASSWORD) { setErr("❌ Incorrect password."); return; }
    onConfirm();
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000 }}>
      <div style={{ background: "#fff", borderRadius: "16px", padding: "28px", width: "300px", textAlign: "center" }}>
        <div style={{ fontSize: "32px", marginBottom: "8px" }}>🔐</div>
        <h3 style={{ margin: "0 0 7px" }}>{title || "Confirm Action"}</h3>
        <p style={{ fontSize: "12px", color: "#6b84a3", margin: "0 0 16px" }}>Enter password to confirm.</p>
        <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Enter password" onKeyDown={e => e.key === "Enter" && confirm()} style={{ ...S.inp, marginBottom: "10px", textAlign: "center" }} />
        {err && <ErrBox msg={err} />}
        <div style={{ display: "flex", gap: "9px", justifyContent: "center" }}>
          <button onClick={confirm} style={S.btn("#dc2626")}>Confirm</button>
          <button onClick={onCancel} style={S.btn("#f0f4f9", "#1a2b4a")}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// ROOT COMPONENT - COMPLETE & CLEAN
// ════════════════════════════════════════════════════════════════════════════════

export default function App() {
  // ─── AUTH STATE ───
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ─── PAGE & UI STATE ───
  const [page, setPage] = useState("dashboard");
  const [landscape, setLandscape] = useState(true);
  const [ready, setReady] = useState(false);
  const [lastBackup, setLastBackup] = useState(null);

  // ─── INACTIVITY LOGOUT STATE ───
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const logoutTimer = useRef(null);
  const warningTimer = useRef(null);
  const countdownRef = useRef(null);

  // ─── DATA STATE ───
  const [workers, setWorkers] = useState(INIT_WORKERS);
  const [execProfile, setExecProfile] = useState(EMPTY_EXEC);
  const [sites, setSites] = useState([{ id: 1, name: "Site A", client: "Swathi Engineering Agency", status: "Active", works: [] }]);
  const [attendance, setAttendance] = useState({});
  const [assignments, setAssignments] = useState({});
  const [invoices, setInvoices] = useState([]);
  const [company, setCompany] = useState(INIT_COMPANY);
  const [client, setClient] = useState(INIT_CLIENT);
  const [bank, setBank] = useState(INIT_BANK);
  const [passwords, setPasswords] = useState({ "DHANS1416": "Riseup1416", "Site Executive": "Vinoth1024" });
  const [recycleBin, setRecycleBin] = useState({ sites: [], invoices: [], attendanceReports: [] });
  const [ledgers, setLedgers] = useState([]);
  const [savedReports, setSavedReports] = useState([]);
  const [savedPermits, setSavedPermits] = useState([]);

  // ════════════════════════════════════════════════════════════════════════════════
  // EFFECT 1: Firebase Auth State Listener
  // ════════════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = EMAIL_ROLE_MAP[firebaseUser.email];
        if (userData) {
          setUser(userData);
        } else {
          await signOut(auth);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ════════════════════════════════════════════════════════════════════════════════
  // EFFECT 2: Load All Data from Firebase (with localStorage fallback)
  // ════════════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    console.log("🔵 SIMPLIFIED EFFECT RUNNING");

    const loadAllData = async () => {
      try {
        console.log("📥 Loading from Firebase...");

        const projectId = "vinodhan-coating";
        const apiKey = "AIzaSyAz13tZTrb-qRfIui_6Q_X0U4NNm0mxtfE";

        try {
          const response = await fetch(
            `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/vinodhan/backup_2026-05-01?key=${apiKey}`
          );
          const firebaseData = await response.json();

          if (firebaseData.fields?.data?.stringValue) {
            const backupData = JSON.parse(firebaseData.fields.data.stringValue);
            console.log("✅ Data loaded from Firebase!");

            setWorkers(backupData.workers || INIT_WORKERS);
            setExecProfile(backupData.exec || EMPTY_EXEC);
            setSites(backupData.sites || [{ id: 1, name: "Site A", client: "Swathi Engineering Agency", status: "Active", works: [] }]);
            setAttendance(backupData.attendance || {});
            setAssignments(backupData.assignments || {});
            setInvoices(backupData.invoices || []);
            setCompany(backupData.company || INIT_COMPANY);
            setClient(backupData.client || INIT_CLIENT);
            setBank(backupData.bank || INIT_BANK);
            setPasswords(backupData.passwords || {});
            setRecycleBin(backupData.recycleBin || { sites: [], invoices: [] });
            setLedgers(backupData.ledgers || []);
            setSavedReports(backupData.savedReports || []);
            setSavedPermits(backupData.savedPermits || []);

            setReady(true);
            return;
          }
        } catch (firebaseError) {
          console.log("⚠️ Firebase fetch failed, using localStorage...");
        }

        // Fallback: Load from localStorage
        console.log("📤 Loading from localStorage...");
        setWorkers(loadS("vd_workers", INIT_WORKERS));
        setExecProfile(loadS("vd_exec", EMPTY_EXEC));
        setSites(loadS("vd_sites", [{ id: 1, name: "Site A", client: "Swathi Engineering Agency", status: "Active", works: [] }]));
        setAttendance(loadS("vd_attendance", {}));
        setAssignments(loadS("vd_assignments", {}));
        setInvoices(loadS("vd_invoices", []));
        setCompany(loadS("vd_company", INIT_COMPANY));
        setClient(loadS("vd_client", INIT_CLIENT));
        setBank(loadS("vd_bank", INIT_BANK));
        setPasswords(loadS("vd_passwords", { "DHANS1416": "Riseup1416", "Site Executive": "Vinoth1024" }));
        setRecycleBin(loadS("vd_recyclebin", { sites: [], invoices: [] }));
        setLedgers(loadS("vd_ledgers", []));
        setSavedReports(loadS("vd_savedReports", []));
        setSavedPermits(loadS("vd_savedPermits", []));

        console.log("✅ READY!");
        setReady(true);
      } catch (error) {
        console.error("❌ Error:", error);
        setReady(true);
      }
    };

    loadAllData();
  }, []);
  // EFFECT 2: Sync data to Firebase whenever it changes
  useEffect(() => {
    if (!ready) return; // Don't sync until initial load is done

    const syncToFirebase = async () => {
      try {
        console.log("☁️ Syncing to Firebase...");

        const allData = {
          workers,
          sites,
          invoices,
          ledgers,
          attendance,
          assignments,
          company,
          client,
          bank,
          passwords,
          recycleBin,
          savedReports,
          savedPermits,
          exec: execProfile,
        };

        const projectId = "vinodhan-coating";
        const apiKey = "AIzaSyAz13tZTrb-qRfIui_6Q_X0U4NNm0mxtfE";

        const response = await fetch(
          `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/vinodhan/backup_2026-05-01?key=${apiKey}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fields: {
                data: { stringValue: JSON.stringify(allData) },
              },
            }),
          }
        );

        if (response.ok) {
          console.log("✅ Synced to Firebase!");
        } else {
          console.error("❌ Sync failed:", response.status);
        }
      } catch (error) {
        console.error("⚠️ Firebase sync error:", error);
      }
    };

    // Debounce: sync after 2 seconds of no changes
    const timer = setTimeout(() => {
      syncToFirebase();
    }, 2000);

    return () => clearTimeout(timer);
  }, [workers, sites, invoices, ledgers, attendance, assignments, company, client, bank, passwords, recycleBin, savedReports, savedPermits, execProfile, ready]);

  // ════════════════════════════════════════════════════════════════════════════════
  // EFFECT 3-16: Auto-sync individual data to Firebase & localStorage
  // ════════════════════════════════════════════════════════════════════════════════
  useEffect(() => { if (!ready) return; saveS("vd_workers", workers); fbSet("workers", workers); }, [workers, ready]);
  useEffect(() => { if (!ready) return; saveS("vd_exec", execProfile); fbSet("exec", execProfile); }, [execProfile, ready]);
  useEffect(() => { if (!ready) return; saveS("vd_sites", sites); fbSet("sites", sites); }, [sites, ready]);
  useEffect(() => { if (!ready) return; saveS("vd_attendance", attendance); fbSet("attendance", attendance); }, [attendance, ready]);
  useEffect(() => { if (!ready) return; saveS("vd_assignments", assignments); fbSet("assignments", assignments); }, [assignments, ready]);
  useEffect(() => { if (!ready) return; saveS("vd_invoices", invoices); fbSet("invoices", invoices); }, [invoices, ready]);
  useEffect(() => { if (!ready) return; saveS("vd_company", company); fbSet("company", company); }, [company, ready]);
  useEffect(() => { if (!ready) return; saveS("vd_client", client); fbSet("client", client); }, [client, ready]);
  useEffect(() => { if (!ready) return; saveS("vd_bank", bank); fbSet("bank", bank); }, [bank, ready]);
  useEffect(() => { if (!ready) return; saveS("vd_passwords", passwords); fbSet("passwords", passwords); }, [passwords, ready]);
  useEffect(() => { if (!ready) return; saveS("vd_recyclebin", recycleBin); fbSet("recycleBin", recycleBin); }, [recycleBin, ready]);
  useEffect(() => { if (!ready) return; saveS("vd_ledgers", ledgers); fbSet("ledgers", ledgers); }, [ledgers, ready]);
  useEffect(() => { if (!ready) return; saveS("vd_savedReports", savedReports); fbSet("savedReports", savedReports); }, [savedReports, ready]);
  useEffect(() => { if (!ready) return; saveS("vd_savedPermits", savedPermits); fbSet("savedPermits", savedPermits); }, [savedPermits, ready]);

  // ════════════════════════════════════════════════════════════════════════════════
  // EFFECT 17: Daily Backup
  // ════════════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!ready || !lastBackup) return;
    const todayDate = new Date().toISOString().split("T")[0];
    const lastB = localStorage.getItem("vd_last_backup");
    if (lastB === todayDate) return;
    fbBackup({ workers, execProfile, sites, attendance, assignments, invoices, company, client, bank, passwords, recycleBin, ledgers, savedReports, savedPermits });
    localStorage.setItem("vd_last_backup", todayDate);
  }, [lastBackup, ready]);

  // ════════════════════════════════════════════════════════════════════════════════
  // EFFECT 18: Inactivity Logout Timer
  // ════════════════════════════════════════════════════════════════════════════════
  const doLogout = useCallback(async () => {
    await signOut(auth);
    setShowWarning(false);
    setPage("dashboard");
  }, []);

  const resetTimer = useCallback(() => {
    if (!user) return;
    clearTimeout(logoutTimer.current);
    clearTimeout(warningTimer.current);
    clearInterval(countdownRef.current);
    setShowWarning(false);
    setCountdown(30);

    warningTimer.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(30);
      countdownRef.current = setInterval(() => {
        setCountdown((p) => {
          if (p <= 1) {
            clearInterval(countdownRef.current);
            return 0;
          }
          return p - 1;
        });
      }, 1000);
      logoutTimer.current = setTimeout(doLogout, 30000);
    }, 120000); // 2 minutes
  }, [user, doLogout]);

  useEffect(() => {
    if (!user) return;
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];
    events.forEach((e) => window.addEventListener(e, resetTimer, true));
    resetTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer, true));
      clearTimeout(logoutTimer.current);
      clearTimeout(warningTimer.current);
      clearInterval(countdownRef.current);
    };
  }, [user, resetTimer]);

  // ════════════════════════════════════════════════════════════════════════════════
  // RENDER: Loading Screen
  // ════════════════════════════════════════════════════════════════════════════════
  if (!ready) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#0f3172",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Segoe UI',sans-serif",
      }}>
        <div style={{ marginBottom: "20px" }}><LogoHex size={80} /></div>
        <div style={{ color: "#fff", fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>VinoDhan Coating</div>
        <div style={{ color: "#f59e0b", fontSize: "12px" }}>Loading your data...</div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════════
  // RENDER: Login Page
  // ════════════════════════════════════════════════════════════════════════════════
  if (!user) {
    return <LoginPage onLogin={setUser} passwords={passwords} setPasswords={setPasswords} />;
  }

  // ════════════════════════════════════════════════════════════════════════════════
  // RENDER: Main App
  // ════════════════════════════════════════════════════════════════════════════════
  const ctx = {
    user,
    workers,
    setWorkers,
    execProfile,
    setExecProfile,
    sites,
    setSites,
    attendance,
    setAttendance,
    assignments,
    setAssignments,
    invoices,
    setInvoices,
    company,
    setCompany,
    client,
    setClient,
    bank,
    setBank,
    recycleBin,
    setRecycleBin,
    ledgers,
    setLedgers,
    savedReports,
    setSavedReports,
    savedPermits,
    setSavedPermits,
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      fontFamily: "'Segoe UI',sans-serif",
      background: "#f0f4f9",
      color: "#1a2b4a",
      overflow: "hidden",
    }}>
      <TopBar
        user={user}
        page={page}
        setPage={setPage}
        landscape={landscape}
        setLandscape={setLandscape}
        setUser={setUser}
        recycleBin={recycleBin}
        setRecycleBin={setRecycleBin}
        sites={sites}
        setSites={setSites}
        invoices={invoices}
        setInvoices={setInvoices}
        workers={workers}
        setWorkers={setWorkers}
        execProfile={execProfile}
        setExecProfile={setExecProfile}
        attendance={attendance}
        setAttendance={setAttendance}
        assignments={assignments}
        setAssignments={setAssignments}
        company={company}
        setCompany={setCompany}
        client={client}
        setClient={setClient}
        bank={bank}
        setBank={setBank}
      />

      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: landscape ? "24px 28px" : "16px 14px",
        paddingBottom: "80px",
      }}>
        {page === "dashboard" && <Dashboard {...ctx} landscape={landscape} />}
        {page === "sites" && <Sites {...ctx} />}
        {page === "workers" && <Workers {...ctx} />}
        {page === "attendance" && <Attendance {...ctx} />}
        {page === "permit" && <EntryPermit {...ctx} />}
        {page === "invoice" && <Invoice {...ctx} />}
        {page === "ledger" && <Ledger {...ctx} />}
      </div>

      {/* Inactivity Warning Modal */}
      {showWarning && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 99998,
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "32px",
            width: "300px",
            textAlign: "center",
            boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
          }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>⏱️</div>
            <h3 style={{ margin: "0 0 8px", fontSize: "16px", color: "#1a2b4a" }}>Session Expiring</h3>
            <p style={{ fontSize: "13px", color: "#6b84a3", margin: "0 0 8px" }}>You will be logged out due to inactivity in</p>
            <div style={{ fontSize: "36px", fontWeight: 800, color: "#dc2626", marginBottom: "20px" }}>{countdown}s</div>
            <button
              onClick={() => {
                resetTimer();
                setShowWarning(false);
              }}
              style={{ ...S.btn("#1e50a0"), width: "100%", padding: "12px", fontSize: "14px" }}
            >
              Stay Logged In
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// EXPORT EXCEL FUNCTION
// ════════════════════════════════════════════════════════════════════════════════
async function exportExcel({ workers, sites, invoices, attendance, assignments }) {
  // @ts-ignore
  const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs");
  const wb = XLSX.utils.book_new();

  // Sites & Works Sheet
  const swRows = [["Site No", "Site Name", "Client", "Status", "Place/Description", "Work Type", "Area/Labour", "Rate (₹)", "Amount (₹)", "From Date", "To Date"]];
  [...sites]
    .sort((a, b) => a.id - b.id)
    .forEach((s, idx) => {
      (s.works || []).forEach((w) => {
        swRows.push([
          idx + 1,
          s.name,
          s.client,
          s.status,
          w.place,
          w.workType || "SQM",
          w.workType === "Manpower" ? w.labour : w.area,
          w.rate,
          w.workType === "Manpower" ? (Number(w.labour) || 0) * (Number(w.rate) || 0) : (Number(w.area) || 0) * (Number(w.rate) || 0),
          w.fromDate || "—",
          w.toDate || "—",
        ]);
      });
    });

  const ws1 = XLSX.utils.aoa_to_sheet(swRows);
  ws1["!cols"] = [{ wch: 8 }, { wch: 20 }, { wch: 25 }, { wch: 12 }, { wch: 30 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Sites & Works");

  // Invoices Sheet
  const invRows = [["Invoice No", "Date", "Site Name", "Client", "Measure No", "Description", "Work Type", "Unit", "Rate (₹)", "Amount (₹)", "Invoice Total (₹)"]];
  [...invoices]
    .sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }))
    .forEach((inv) => {
      const cl = inv.snapshot?.client || {};
      (inv.works || []).forEach((w, i) => {
        invRows.push([
          inv.number,
          inv.date || "—",
          inv.siteName || "—",
          cl.name || "—",
          inv.measureNo || "—",
          w.place,
          w.workType || "SQM",
          w.workType === "Manpower" ? `${w.labour} Labour` : w.workType === "RMT" ? `${w.area} rmt` : `${w.area} m²`,
          w.rate,
          w.amount || 0,
          i === 0 ? inv.total : "",
        ]);
      });
    });

  const ws2 = XLSX.utils.aoa_to_sheet(invRows);
  ws2["!cols"] = [{ wch: 14 }, { wch: 12 }, { wch: 20 }, { wch: 25 }, { wch: 14 }, { wch: 30 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Invoices");

  // Workers Sheet
  const wRows = [["Name", "Category", "Phone", "Aadhaar", "Date of Birth", "Date of Joining"]];
  workers.forEach((w) => wRows.push([w.name, w.category, w.phone || "—", w.aadhaar || "—", w.dob || "—", w.doj || "—"]));

  const ws3 = XLSX.utils.aoa_to_sheet(wRows);
  ws3["!cols"] = [{ wch: 20 }, { wch: 18 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws3, "Workers");

  // Attendance Sheet
  const attRows = [["Worker Name", "Category", "Site", "Month", "Total Present", "Total Half", "Total Days"]];
  const months = {};
  Object.keys(attendance).forEach((key) => {
    const parts = key.split("_");
    const date = parts[0],
      siteId = parts[1],
      wid = parts[2];
    const month = date.slice(0, 7);
    const k = `${month}_${siteId}_${wid}`;
    if (!months[k]) months[k] = { month, siteId, wid, present: 0, half: 0 };
    if (attendance[key] === "Present") months[k].present++;
    if (attendance[key] === "Half") months[k].half += 0.5;
  });

  Object.values(months).forEach((r) => {
    const w = workers.find((x) => x.id === Number(r.wid));
    const s = sites.find((x) => x.id === Number(r.siteId));
    if (w && s) attRows.push([w.name, w.category, s.name, r.month, r.present, r.half, r.present + r.half]);
  });

  const ws4 = XLSX.utils.aoa_to_sheet(attRows);
  ws4["!cols"] = [{ wch: 20 }, { wch: 18 }, { wch: 20 }, { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws4, "Attendance Summary");

  XLSX.writeFile(wb, `VinoDhan-Report-${new Date().toISOString().split("T")[0]}.xlsx`);
}

// ── TOP BAR ───────────────────────────────────────────
function TopBar({ user, page, setPage, landscape, setLandscape, setUser, recycleBin, setRecycleBin, sites, setSites, invoices, setInvoices, workers, setWorkers, execProfile, setExecProfile, attendance, setAttendance, assignments, setAssignments, company, setCompany, client, setClient, bank, setBank }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showBin, setShowBin] = useState(false);
  const [pwModal, setPwModal] = useState(null);
  const [selBinSites, setSelBinSites] = useState([]);
  const [selBinInvs, setSelBinInvs] = useState([]);
  const [importPwModal, setImportPwModal] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [importPw, setImportPw] = useState("");
  const [importPwErr, setImportPwErr] = useState("");
  const binCount = (recycleBin.sites || []).length + (recycleBin.invoices || []).length;

  const bottomNav = [
    { id: "dashboard", label: "Dash", icon: "📊" },
    { id: "sites", label: "Sites", icon: "🏗️" },
    { id: "workers", label: "Workers", icon: "👷" },
    { id: "attendance", label: "Attend", icon: "✅" },
    { id: "permit", label: "Permit", icon: "🪪" },
    { id: "invoice", label: "Invoice", icon: "🧾" },
    { id: "ledger", label: "Ledger", icon: "📒" },
  ];

  const restoreSite = s => { setSites(p => [...p, s]); setRecycleBin(p => ({ ...p, sites: (p.sites || []).filter(x => x.id !== s.id) })); };
  const restoreInv = inv => { setInvoices(p => [...p, inv]); setRecycleBin(p => ({ ...p, invoices: (p.invoices || []).filter(x => x.id !== inv.id) })); };

  return (
    <>
      <div style={{ background: "#0f3172", boxShadow: "0 2px 12px rgba(0,0,0,0.2)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <LogoHex size={32} />
            <div>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#fff", lineHeight: 1 }}>VinoDhan</div>
              <div style={{ fontSize: "9px", color: "#f59e0b", letterSpacing: "2px" }}>COATING</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#1e50a0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", color: "#fff", fontWeight: 700 }}>{user.name[0]}</div>
            <button onClick={() => setDrawerOpen(true)} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "8px", padding: "7px 10px", cursor: "pointer", color: "#fff", fontSize: "18px", lineHeight: 1 }}>☰</button>
          </div>
        </div>
      </div>

      {drawerOpen && <>
        <div onClick={() => setDrawerOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000 }} />
        <div style={{ position: "fixed", top: 0, right: 0, width: "260px", height: "100%", background: "#0f3172", zIndex: 1001, display: "flex", flexDirection: "column", boxShadow: "-4px 0 20px rgba(0,0,0,0.3)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#1e50a0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", color: "#fff", fontWeight: 700 }}>{user.name[0]}</div>
              <div><div style={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}>{user.name}</div><div style={{ fontSize: "11px", color: "#90afd4" }}>{user.role}</div></div>
            </div>
            <button onClick={() => setDrawerOpen(false)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", color: "#fff", fontSize: "16px" }}>✕</button>
          </div>
          <div style={{ padding: "16px" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "#90afd4", marginBottom: "10px", letterSpacing: "1px" }}>DISPLAY MODE</div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => { setLandscape(true); setDrawerOpen(false); }} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", cursor: "pointer", background: landscape ? "#1e50a0" : "rgba(255,255,255,0.1)", color: "#fff", fontSize: "12px", fontWeight: 600 }}>⬜ Wide</button>
              <button onClick={() => { setLandscape(false); setDrawerOpen(false); }} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", cursor: "pointer", background: !landscape ? "#1e50a0" : "rgba(255,255,255,0.1)", color: "#fff", fontSize: "12px", fontWeight: 600 }}>📱 Tall</button>
            </div>
          </div>
          <div style={{ padding: "0 16px", marginBottom: "8px" }}>
            <label style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "none", cursor: "pointer", background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxSizing: "border-box" }}>
              📥 Import Backup
              <input type="file" accept=".json" style={{ display: "none" }} onChange={e => {
                const f = e.target.files?.[0];
                if (!f) return;
                setPendingFile(f);
                setImportPwModal(true);
                setImportPw("");
                setImportPwErr("");
              }} />
            </label>
          </div>
          <div style={{ padding: "0 16px", marginBottom: "8px" }}>
            <button onClick={() => exportExcel({ workers, sites, invoices, attendance, assignments })} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "none", cursor: "pointer", background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              📊 Export to Excel
            </button>
          </div>
          <div style={{ padding: "0 16px", marginBottom: "8px" }}>
            <button onClick={() => {
              const data = JSON.stringify({ workers, execProfile, sites, attendance, assignments, invoices, company, client, bank, recycleBin, ledgers, savedReports, savedPermits }, null, 2);
              const blob = new Blob([data], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `vinodhan-backup-${new Date().toISOString().split("T")[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
              setDrawerOpen(false);
            }} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "none", cursor: "pointer", background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              💾 Export Backup
            </button>
          </div>
          <div style={{ padding: "0 16px" }}>
            <button onClick={() => { setShowBin(true); setDrawerOpen(false); }} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "none", cursor: "pointer", background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              🗑️ Recycle Bin {binCount > 0 && <span style={{ background: "#dc2626", color: "#fff", borderRadius: "20px", padding: "1px 8px", fontSize: "11px", fontWeight: 800 }}>{binCount}</span>}
            </button>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ padding: "16px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <button onClick={async () => { setDrawerOpen(false); await signOut(auth); }} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "none", cursor: "pointer", background: "#fee2e2", color: "#991b1b", fontSize: "14px", fontWeight: 700 }}>🚪 Logout</button>
          </div>
        </div>
      </>}

      {/* RECYCLE BIN */}
      {showBin && (
        <div style={{ position: "fixed", inset: 0, background: "#f0f4f9", zIndex: 2000, overflowY: "auto", fontFamily: "'Segoe UI',sans-serif" }}>
          <div style={{ background: "#0f3172", padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={() => setShowBin(false)} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "8px", padding: "7px 14px", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>← Back</button>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>🗑️ Recycle Bin</div>
          </div>
          <div style={{ padding: "20px" }}>
            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <h3 style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#6b84a3", textTransform: "uppercase", letterSpacing: "1px" }}>🏗️ Sites ({(recycleBin.sites || []).length})</h3>
                <div style={{ display: "flex", gap: "7px" }}>
                  <button onClick={() => setSelBinSites(selBinSites.length === (recycleBin.sites || []).length ? ([]) : (recycleBin.sites || []).map((s: any) => s.id))} style={{ ...S.btn("#f0f6ff", "#1e50a0"), padding: "5px 11px", fontSize: "12px" }}>{selBinSites.length === (recycleBin.sites || []).length ? "Deselect All" : "Select All"}</button>
                  {selBinSites.length > 0 && <button onClick={() => setPwModal({ type: "bulkSite" })} style={{ ...S.btn("#fee2e2", "#991b1b"), padding: "5px 11px", fontSize: "12px" }}>🗑️ Delete Selected ({selBinSites.length})</button>}
                </div>
              </div>
              {(recycleBin.sites || []).length === 0 ? <div style={{ ...S.card, textAlign: "center", color: "#9db3cc", padding: "24px" }}>No deleted sites</div>
                : (recycleBin.sites || []).map((s: any) => (
                  <div key={s.id} style={{ ...S.card, marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div onClick={() => setSelBinSites(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} style={{ width: "20px", height: "20px", borderRadius: "5px", flexShrink: 0, background: selBinSites.includes(s.id) ? "#dc2626" : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: "12px", fontWeight: 700 }}>{selBinSites.includes(s.id) ? "✓" : ""}</div>
                      <div><div style={{ fontWeight: 600, fontSize: "14px" }}>{s.name}</div><div style={{ fontSize: "11px", color: "#6b84a3" }}>{s.client}</div></div>
                    </div>
                    <div style={{ display: "flex", gap: "7px" }}>
                      <button onClick={() => restoreSite(s)} style={{ ...S.btn("#dcfce7", "#166534"), padding: "5px 11px", fontSize: "12px" }}>↩️ Restore</button>
                      <button onClick={() => setPwModal({ type: "site", id: s.id })} style={{ ...S.btn("#fee2e2", "#991b1b"), padding: "5px 11px", fontSize: "12px" }}>🗑️ Delete</button>
                    </div>
                  </div>
                ))}
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <h3 style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#6b84a3", textTransform: "uppercase", letterSpacing: "1px" }}>🧾 Invoices ({(recycleBin.invoices || []).length})</h3>
                <div style={{ display: "flex", gap: "7px" }}>
                  <button onClick={() => setSelBinInvs(selBinInvs.length === (recycleBin.invoices || []).length ? [] : (recycleBin.invoices || []).map((i: any) => i.id))} style={{ ...S.btn("#f0f6ff", "#1e50a0"), padding: "5px 11px", fontSize: "12px" }}>{selBinInvs.length === (recycleBin.invoices || []).length ? "Deselect All" : "Select All"}</button>
                  {selBinInvs.length > 0 && <button onClick={() => setPwModal({ type: "bulkInv" })} style={{ ...S.btn("#fee2e2", "#991b1b"), padding: "5px 11px", fontSize: "12px" }}>🗑️ Delete Selected ({selBinInvs.length})</button>}
                </div>
              </div>
              {(recycleBin.invoices || []).length === 0 ? <div style={{ ...S.card, textAlign: "center", color: "#9db3cc", padding: "24px" }}>No deleted invoices</div>
                : (recycleBin.invoices || []).map((inv: any) => (
                  <div key={inv.id} style={{ ...S.card, marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div onClick={() => setSelBinInvs(p => p.includes(inv.id) ? p.filter(x => x !== inv.id) : [...p, inv.id])} style={{ width: "20px", height: "20px", borderRadius: "5px", flexShrink: 0, background: selBinInvs.includes(inv.id) ? "#dc2626" : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: "12px", fontWeight: 700 }}>{selBinInvs.includes(inv.id) ? "✓" : ""}</div>
                      <div><div style={{ fontWeight: 600, fontSize: "14px" }}>{inv.number}</div><div style={{ fontSize: "11px", color: "#6b84a3" }}>{fmtDate(inv.date)} — ₹{inv.total?.toLocaleString()}</div></div>
                    </div>
                    <div style={{ display: "flex", gap: "7px" }}>
                      <button onClick={() => restoreInv(inv)} style={{ ...S.btn("#dcfce7", "#166534"), padding: "5px 11px", fontSize: "12px" }}>↩️ Restore</button>
                      <button onClick={() => setPwModal({ type: "invoice", id: inv.id })} style={{ ...S.btn("#fee2e2", "#991b1b"), padding: "5px 11px", fontSize: "12px" }}>🗑️ Delete</button>
                    </div>
                  </div>
                ))}
            </div>
            <div style={{ marginTop: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <h3 style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#6b84a3", textTransform: "uppercase", letterSpacing: "1px" }}>✅ Attendance Reports ({(recycleBin.attendanceReports || []).length})</h3>
              </div>
              {(recycleBin.attendanceReports || []).length === 0
                ? <div style={{ ...S.card, textAlign: "center", color: "#9db3cc", padding: "24px" }}>No deleted reports</div>
                : (recycleBin.attendanceReports || []).map((r: any) => (
                  <div key={r.id} style={{ ...S.card, marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "14px" }}>{r.invoiceNumber}</div>
                      <div style={{ fontSize: "11px", color: "#6b84a3" }}>{r.siteName} — {r.workName}</div>
                      <div style={{ fontSize: "11px", color: "#6b84a3" }}>Deleted {r.savedAt}</div>
                    </div>
                    <div style={{ display: "flex", gap: "7px" }}>
                      <button onClick={() => { setSavedReports((p: any) => [...p, r]); setRecycleBin((p: any) => ({ ...p, attendanceReports: (p.attendanceReports || []).filter((x: any) => x.id !== r.id) })); }} style={{ ...S.btn("#dcfce7", "#166534"), padding: "5px 11px", fontSize: "12px" }}>↩️ Restore</button>
                      <button onClick={() => setPwModal({ type: "attReport", id: r.id })} style={{ ...S.btn("#fee2e2", "#991b1b"), padding: "5px 11px", fontSize: "12px" }}>🗑️ Delete</button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* PASSWORD MODAL FOR RECYCLE BIN */}
      {pwModal && <PwModal
        title="Permanent Delete"
        onConfirm={() => {
          if (pwModal.type === "site") setRecycleBin(p => ({ ...p, sites: (p.sites || []).filter(x => x.id !== pwModal.id) }));
          else if (pwModal.type === "invoice") setRecycleBin(p => ({ ...p, invoices: (p.invoices || []).filter(x => x.id !== pwModal.id) }));
          else if (pwModal.type === "bulkSite") { setRecycleBin(p => ({ ...p, sites: (p.sites || []).filter(x => !selBinSites.includes(x.id)) })); setSelBinSites([]); }
          else if (pwModal.type === "bulkInv") { setRecycleBin(p => ({ ...p, invoices: (p.invoices || []).filter(x => !selBinInvs.includes(x.id)) })); setSelBinInvs([]); }
          else if (pwModal.type === "attReport") setRecycleBin((p: any) => ({ ...p, attendanceReports: (p.attendanceReports || []).filter((x: any) => x.id !== pwModal.id) }));
          setPwModal(null);
        }}
        onCancel={() => setPwModal(null)}
      />}

      {importPwModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 4000 }}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "28px", width: "300px", textAlign: "center" }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>🔐</div>
            <h3 style={{ margin: "0 0 7px" }}>Import Backup</h3>
            <p style={{ fontSize: "12px", color: "#6b84a3", margin: "0 0 16px" }}>Enter password to restore data.</p>
            <input type="password" value={importPw} onChange={e => setImportPw(e.target.value)} placeholder="Enter password" style={{ ...S.inp, marginBottom: "10px", textAlign: "center" }} />
            {importPwErr && <div style={{ color: "#dc2626", fontSize: "12px", marginBottom: "10px" }}>{importPwErr}</div>}
            <div style={{ display: "flex", gap: "9px", justifyContent: "center" }}>
              <button onClick={() => {
                if (importPw !== "Risetogether1416") { setImportPwErr("❌ Incorrect password."); return; }
                const r = new FileReader();
                r.onload = (ev: any) => {
                  try {
                    const d = JSON.parse(ev.target.result as string);
                    if (d.workers) setWorkers(d.workers);
                    if (d.sites) setSites(d.sites);
                    if (d.invoices) setInvoices(d.invoices);
                    if (d.attendance) setAttendance(d.attendance);
                    if (d.assignments) setAssignments(d.assignments);
                    if (d.company) setCompany(d.company);
                    if (d.client) setClient(d.client);
                    if (d.bank) setBank(d.bank);
                    if (d.recycleBin) setRecycleBin(d.recycleBin);
                    if (d.execProfile) setExecProfile(d.execProfile);
                    if (d.ledgers) setLedgers(d.ledgers);
                    if (d.savedReports) setSavedReports(d.savedReports);
                    if (d.savedPermits) setSavedPermits(d.savedPermits);
                    setImportPwModal(false); setPendingFile(null);
                    setDrawerOpen(false);
                    alert("✅ Data restored successfully!");
                  } catch { setImportPwErr("❌ Invalid backup file."); }
                };
                r.readAsText(pendingFile);
              }} style={S.btn("#1e50a0")}>Confirm</button>
              <button onClick={() => { setImportPwModal(false); setPendingFile(null); setImportPwErr(""); }} style={S.btn("#f0f4f9", "#1a2b4a")}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#0f3172", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", zIndex: 900, boxShadow: "0 -2px 12px rgba(0,0,0,0.2)" }}>
        {bottomNav.map((item: any) => {
          const active = page === item.id;
          return (
            <button key={item.id} onClick={() => setPage(item.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "8px 2px", border: "none", cursor: "pointer", background: "transparent", color: active ? "#f59e0b" : "#90afd4", transition: "all .15s", minWidth: 0 }}>
              <span style={{ fontSize: "18px", lineHeight: 1, marginBottom: "3px" }}>{item.icon}</span>
              <span style={{ fontSize: "9px", fontWeight: active ? 700 : 400, whiteSpace: "nowrap" }}>{item.label}</span>
              {active && <div style={{ width: "20px", height: "2px", background: "#f59e0b", borderRadius: "2px", marginTop: "3px" }} />}
            </button>
          );
        })}
      </div>
    </>
  );
}

// ── LOGIN ─────────────────────────────────────────────
interface ILoginPageProps {
  onLogin?: (user: any) => void;
  passwords?: any;
  setPasswords?: any;
}

function LoginPage({ onLogin, passwords, setPasswords }: ILoginPageProps = {}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const userData = EMAIL_ROLE_MAP[userCred.user.email];

      if (!userData) {
        setError("Account not authorized");
        await signOut(auth);
        setLoading(false);
        return;
      }

      console.log("✅ Login successful:", userData.name, userData.role);
      onLogin(userData);  // ✅ Call the onLogin callback

      setLoading(false);
    } catch (err) {
      setError(err.message === "Firebase: Error (auth/user-not-found)."
        ? "Email not found"
        : err.message === "Firebase: Error (auth/wrong-password)."
          ? "Incorrect password"
          : err.message);
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setError("");
      setTimeout(() => setResetSent(false), 5000);
    } catch (err) {
      setError(err.message);
    }
  };

  const inpDark = { ...S.inp, background: "rgba(255,255,255,0.08)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.2)" };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#0a1628 0%,#1e3a5f 50%,#0f2040 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI',sans-serif", padding: "20px", position: "relative", overflow: "hidden" }}>
      <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0.06 }} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
        {Array.from({ length: 48 }, (_, k) => { const row = Math.floor(k / 6), col = k % 6; const x = col * 70 + (row % 2) * 35, y = row * 60; const pts = Array.from({ length: 6 }, (_, i) => { const a = Math.PI / 180 * (60 * i - 30); return `${x + 28 * Math.cos(a)},${y + 28 * Math.sin(a)}`; }).join(" "); return <polygon key={k} points={pts} fill="none" stroke="#fff" strokeWidth="0.5" />; })}
      </svg>
      <div style={{ textAlign: "center", marginBottom: "28px", zIndex: 1 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "14px" }}><LogoHex size={100} /></div>
        <h1 style={{ margin: "0 0 4px", fontSize: "28px", fontWeight: 800, color: "#fff", letterSpacing: "2px" }}>VinoDhan</h1>
        <div style={{ fontSize: "12px", fontWeight: 600, color: "#f59e0b", letterSpacing: "6px", marginBottom: "8px" }}>COATING</div>
        <div style={{ width: "160px", height: "1px", background: "linear-gradient(90deg,transparent,#f59e0b,transparent)", margin: "0 auto 8px" }} />
        <p style={{ margin: 0, fontSize: "11px", color: "#93c5fd", letterSpacing: "1px" }}>Specialised Epoxy Coating Services</p>
      </div>
      <div style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(10px)", borderRadius: "20px", padding: "28px", width: "100%", maxWidth: "360px", border: "1px solid rgba(255,255,255,0.12)", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: "20px" }}><h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#fff" }}>Welcome Back</h2><p style={{ margin: "4px 0 0", fontSize: "11px", color: "#93c5fd" }}>Sign in to continue</p></div>
        <div style={{ marginBottom: "12px" }}><label style={{ ...S.lbl, color: "#93c5fd" }}>EMAIL</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} placeholder="you@example.com" style={{ ...inpDark, marginBottom: "0" }} /></div>
        <div style={{ marginBottom: "8px" }}><label style={{ ...S.lbl, color: "#93c5fd" }}>PASSWORD</label><div style={{ position: "relative" }}><input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} placeholder="••••••••" style={{ ...inpDark, paddingRight: "42px" }} /><span onClick={() => setShowPw(p => !p)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", fontSize: "16px", userSelect: "none" }}>{showPw ? "🙈" : "👁️"}</span></div></div>
        <div style={{ textAlign: "right", marginBottom: "16px" }}><span onClick={handleForgotPassword} style={{ fontSize: "12px", color: "#f59e0b", cursor: "pointer", fontWeight: 700, textDecoration: "underline", textUnderlineOffset: "3px" }}>Forgot Password?</span></div>
        {error && <ErrBox msg={error} />}
        {resetSent && <div style={{ color: "#166534", fontSize: "12px", marginBottom: "12px", padding: "8px 12px", background: "#dcfce7", borderRadius: "8px" }}>✅ Reset link sent to {email}</div>}
        <button onClick={handleLogin} disabled={loading} style={{ ...S.btn("#f59e0b", "#1a1a1a"), width: "100%", padding: "12px", fontSize: "14px", fontWeight: 800, opacity: loading ? 0.6 : 1 }}>
          {loading ? "Signing in..." : "Login →"}
        </button>
      </div>
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────
function DashSiteWorks({ works }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderTop: "1px solid #e0eaff", marginTop: "6px" }}>
      <div onClick={() => setOpen(p => !p)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", cursor: "pointer" }}>
        <span style={{ fontSize: "11px", color: "#1e50a0", fontWeight: 600 }}>{open ? "▲ Hide" : "▼ Show"} {works.length} work{works.length !== 1 ? "s" : ""}</span>
      </div>
      {open && <div style={{ display: "flex", flexDirection: "column", gap: "4px", paddingBottom: "4px" }}>
        {works.map((w: any) => (
          <div key={w.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", padding: "3px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={S.wbadge(w.workType || "SQM")}>{w.workType || "SQM"}</span>
              <span style={{ color: "#1a2b4a" }}>{w.place}</span>
            </div>
            <span style={{ fontWeight: 600, color: "#166534" }}>₹{calcWork(w).toLocaleString()}</span>
          </div>
        ))}
      </div>}
    </div>
  );
}

function Dashboard({ user, workers, sites, invoices, ledgers, landscape }) {
  const totalSqm = sites.reduce((sum, s) => (s.works || []).filter(w => w.workType === "SQM" || !w.workType).reduce((a, w) => a + (Number(w.area) || 0), sum), 0);
  const totalRmt = sites.reduce((sum, s) => (s.works || []).filter(w => w.workType === "RMT").reduce((a, w) => a + (Number(w.area) || 0), sum), 0);
  const totalMp = sites.reduce((sum, s) => (s.works || []).filter(w => w.workType === "Manpower").reduce((a, w) => a + calcWork(w), sum), 0);
  const totalKgs = sites.reduce((sum, s) => (s.works || []).filter(w => w.workType === "KGS").reduce((a, w) => a + (Number(w.area) || 0), sum), 0);
  const totalOther = sites.reduce((sum, s) => (s.works || []).filter(w => w.workType === "Other").reduce((a, w) => a + (Number(w.amount) || 0), sum), 0);
  const totalRev = sites.reduce((sum, s) => (s.works || []).reduce((a, w) => a + calcWork(w), sum), 0);
  const activeSites = sites.filter(s => s.status === "Active").length;
  const completedSites = sites.filter(s => s.status === "Completed").length;
  const applicators = workers.filter(w => w.category === "Applicator").length;
  const semiApplicators = workers.filter(w => w.category === "Semi-Applicator").length;
  const helpers = workers.filter(w => w.category === "Helper").length;
  const [expandCard, setExpandCard] = useState(null);
  const [expandLedger, setExpandLedger] = useState(null);
  const invoicedWorkIds = new Set(invoices.flatMap(inv => (inv.works || []).map((w: any) => w.id)));
  const uninvoicedSites = sites.map((s: any) => ({
    ...s,
    uninvoicedWorks: (s.works || []).filter(w => !invoicedWorkIds.has(w.id))
  })).filter(s => s.uninvoicedWorks.length > 0);
  const totalUninvoiced = uninvoicedSites.reduce((a, s) => a + s.uninvoicedWorks.reduce((b, w) => b + calcWork(w), 0), 0);
  const totalInvoicedAmt = invoices.reduce((a, inv) => a + (inv.total || 0), 0);
  // Ledger calculations
  const allEntries = ledgers.flatMap(l => (l.entries || []).map((e: any) => ({ ...e, ledgerName: l.name, ledgerPrefix: l.measurePrefix || "" })));
  const totalTDS = allEntries.filter(e => e.particulars.includes("TDS")).reduce((a, e) => a + (e.debit || 0), 0);
  const totalRetention = allEntries.filter(e => e.particulars.includes("Retention")).reduce((a, e) => a + (e.debit || 0), 0);

  // Outstanding per ledger
  const ledgerBalances = ledgers.map((l: any) => {
    const entries = l.entries || [];
    const credit = entries.reduce((a, e) => a + (e.credit || 0), 0);
    const debit = entries.reduce((a, e) => a + (e.debit || 0), 0);
    return { id: l.id, name: l.name, balance: credit - debit, prefix: l.measurePrefix || "" };
  });
  const totalOutstanding = ledgerBalances.reduce((a, l) => a + l.balance, 0);

  // Tally
  const totalInvoiced = invoices.reduce((a, inv) => a + (inv.total || 0), 0);
  const bankPayments = ledgers
    .filter(l => !l.measurePrefix || !l.measurePrefix.toUpperCase().startsWith("SEAK"))
    .flatMap(l => (l.entries || []))
    .filter(e => e.particulars === "Bank Payment")
    .reduce((a, e) => a + (e.debit || 0), 0);
  const nonSeakOutstanding = ledgerBalances
    .filter(l => !l.prefix.toUpperCase().startsWith("SEAK"))
    .reduce((a, l) => a + l.balance, 0);
  const tallySum = totalTDS + totalRetention + bankPayments + nonSeakOutstanding;
  const tallyDiff = totalInvoiced - tallySum;
  const tallyOk = Math.abs(tallyDiff) < 1;
  return (
    <div>
      <h2 style={{ margin: "0 0 4px", fontSize: "20px", fontWeight: 800 }}>Good day, {user.name}! 👋</h2>
      <p style={{ margin: "0 0 20px", color: "#6b84a3", fontSize: "12px" }}>{today}</p>
      {/* ROW 1 — Summary cards */}
      <div style={{ ...S.card, padding: "16px", marginBottom: "16px" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "#9db3cc", letterSpacing: "1.5px", marginBottom: "12px" }}>👥 TEAM & REVENUE</div>
        <div style={{ display: "flex", gap: "12px", marginBottom: "12px", overflowX: "auto", paddingBottom: "8px", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
          {/* Workers */}
          <div style={{ ...S.card, background: "#dbeafe", boxShadow: "none", padding: "16px", minWidth: "160px", flexShrink: 0 }}>
            <div style={{ fontSize: "22px", marginBottom: "6px" }}>👷</div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#1e40af", marginBottom: "6px" }}>WORKERS & EXECUTIVES</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}><span style={{ color: "#1e40af" }}>Applicators</span><span style={{ fontWeight: 800, color: "#0f3172" }}>{applicators}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}><span style={{ color: "#5b21b6" }}>Semi-App</span><span style={{ fontWeight: 800, color: "#0f3172" }}>{semiApplicators}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}><span style={{ color: "#166534" }}>Helpers</span><span style={{ fontWeight: 800, color: "#0f3172" }}>{helpers}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}><span style={{ color: "#0f3172" }}>Executive</span><span style={{ fontWeight: 800, color: "#0f3172" }}>1</span></div>
              <div style={{ borderTop: "1px solid #bfdbfe", marginTop: "3px", paddingTop: "3px", display: "flex", justifyContent: "space-between", fontSize: "12px" }}><span style={{ color: "#6b84a3" }}>Total</span><span style={{ fontWeight: 800, color: "#0f3172" }}>{workers.length + 1}</span></div>
            </div>
          </div>
          {/* Sites */}
          <div style={{ ...S.card, background: "#dcfce7", boxShadow: "none", padding: "16px", minWidth: "150px", flexShrink: 0 }}>
            <div style={{ fontSize: "22px", marginBottom: "6px" }}>🏗️</div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#166534", marginBottom: "6px" }}>SITES</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#16a34a", display: "inline-block" }}></span>Active</span>
                <span style={{ fontWeight: 800, color: "#0f3172" }}>{activeSites}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2563eb", display: "inline-block" }}></span>Completed</span>
                <span style={{ fontWeight: 800, color: "#0f3172" }}>{completedSites}</span>
              </div>
              <div style={{ borderTop: "1px solid #bbf7d0", marginTop: "3px", paddingTop: "3px", display: "flex", justifyContent: "space-between", fontSize: "12px" }}><span style={{ color: "#6b84a3" }}>Total</span><span style={{ fontWeight: 800, color: "#0f3172" }}>{sites.length}</span></div>
            </div>
          </div>
          {/* Revenue */}
          <div style={{ ...S.card, background: "#fef3c7", boxShadow: "none", padding: "16px", minWidth: "130px", flexShrink: 0 }}>
            <div style={{ fontSize: "22px", marginBottom: "6px" }}>💰</div>
            <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f3172" }}>₹{totalRev.toLocaleString()}</div>
            <div style={{ fontSize: "11px", color: "#6b84a3", marginTop: "2px" }}>Revenue</div>
          </div>
          {/* Invoices */}
          <div onClick={() => setExpandCard(expandCard === "inv" ? null : "inv")} style={{ ...S.card, background: "#fce7f3", boxShadow: "none", padding: "16px", minWidth: "160px", flexShrink: 0, cursor: "pointer" }}>
            <div style={{ fontSize: "22px", marginBottom: "6px" }}>🧾</div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#9d174d", marginBottom: "6px" }}>INVOICES</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}><span style={{ color: "#9d174d" }}>Total Raised</span><span style={{ fontWeight: 800, color: "#0f3172" }}>{invoices.length}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}><span style={{ color: "#9d174d" }}>Total Billed</span><span style={{ fontWeight: 800, color: "#0f3172" }}>₹{totalInvoicedAmt.toLocaleString()}</span></div>
            </div>
            <div style={{ fontSize: "10px", color: "#9d174d", marginTop: "4px", fontWeight: 600 }}>{expandCard === "inv" ? "▲ Hide" : "▼ Details"}</div>
          </div>
          {/* Uninvoiced */}
          <div onClick={() => setExpandCard(expandCard === "uninv" ? null : "uninv")} style={{ ...S.card, background: "#fff7ed", boxShadow: "none", padding: "16px", minWidth: "150px", flexShrink: 0, cursor: "pointer" }}>
            <div style={{ fontSize: "22px", marginBottom: "6px" }}>📋</div>
            <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f3172" }}>₹{totalUninvoiced.toLocaleString()}</div>
            <div style={{ fontSize: "11px", color: "#6b84a3", marginTop: "2px" }}>Uninvoiced</div>
            <div style={{ fontSize: "10px", color: "#ea580c", marginTop: "4px", fontWeight: 600 }}>{expandCard === "uninv" ? "▲ Hide" : "▼ Details"}</div>
          </div>
        </div>
      </div>
      {/* ROW 2 — Breakdown cards */}
      <div style={{ ...S.card, padding: "16px", marginBottom: "16px" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "#9db3cc", letterSpacing: "1.5px", marginBottom: "12px" }}>📐 WORK SUMMARY</div>
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", overflowX: "auto", paddingBottom: "8px", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
          {/* SQM */}
          <div onClick={() => setExpandCard(expandCard === "sqm" ? null : "sqm")} style={{ ...S.card, background: "#ede9fe", boxShadow: "none", padding: "16px", minWidth: "130px", flexShrink: 0, cursor: "pointer" }}>
            <div style={{ fontSize: "22px", marginBottom: "6px" }}>📐</div>
            <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f3172" }}>{totalSqm}m²</div>
            <div style={{ fontSize: "11px", color: "#6b84a3", marginTop: "2px" }}>Total SQM</div>
            <div style={{ fontSize: "10px", color: "#7c3aed", marginTop: "4px", fontWeight: 600 }}>{expandCard === "sqm" ? "▲ Hide" : "▼ Details"}</div>
          </div>
          {/* RMT */}
          <div onClick={() => setExpandCard(expandCard === "rmt" ? null : "rmt")} style={{ ...S.card, background: "#fce7f3", boxShadow: "none", padding: "16px", minWidth: "130px", flexShrink: 0, cursor: "pointer" }}>
            <div style={{ fontSize: "22px", marginBottom: "6px" }}>📏</div>
            <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f3172" }}>{totalRmt}rmt</div>
            <div style={{ fontSize: "11px", color: "#6b84a3", marginTop: "2px" }}>Total RMT</div>
            <div style={{ fontSize: "10px", color: "#9d174d", marginTop: "4px", fontWeight: 600 }}>{expandCard === "rmt" ? "▲ Hide" : "▼ Details"}</div>
          </div>
          {/* Manpower */}
          <div onClick={() => setExpandCard(expandCard === "mp" ? null : "mp")} style={{ ...S.card, background: "#fef9c3", boxShadow: "none", padding: "16px", minWidth: "130px", flexShrink: 0, cursor: "pointer" }}>
            <div style={{ fontSize: "22px", marginBottom: "6px" }}>👨‍🔧</div>
            <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f3172" }}>₹{totalMp.toLocaleString()}</div>
            <div style={{ fontSize: "11px", color: "#6b84a3", marginTop: "2px" }}>Manpower</div>
            <div style={{ fontSize: "10px", color: "#d97706", marginTop: "4px", fontWeight: 600 }}>{expandCard === "mp" ? "▲ Hide" : "▼ Details"}</div>
          </div>
          {/* KGS */}
          <div onClick={() => setExpandCard(expandCard === "kgs" ? null : "kgs")} style={{ ...S.card, background: "#dcfce7", boxShadow: "none", padding: "16px", minWidth: "130px", flexShrink: 0, cursor: "pointer" }}>
            <div style={{ fontSize: "22px", marginBottom: "6px" }}>⚖️</div>
            <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f3172" }}>{totalKgs}kgs</div>
            <div style={{ fontSize: "11px", color: "#6b84a3", marginTop: "2px" }}>Total KGS</div>
            <div style={{ fontSize: "10px", color: "#166534", marginTop: "4px", fontWeight: 600 }}>{expandCard === "kgs" ? "▲ Hide" : "▼ Details"}</div>
          </div>
          {/* Other */}
          <div onClick={() => setExpandCard(expandCard === "other" ? null : "other")} style={{ ...S.card, background: "#fee2e2", boxShadow: "none", padding: "16px", minWidth: "130px", flexShrink: 0, cursor: "pointer" }}>
            <div style={{ fontSize: "22px", marginBottom: "6px" }}>🔧</div>
            <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f3172" }}>₹{totalOther.toLocaleString()}</div>
            <div style={{ fontSize: "11px", color: "#6b84a3", marginTop: "2px" }}>Other</div>
            <div style={{ fontSize: "10px", color: "#991b1b", marginTop: "4px", fontWeight: 600 }}>{expandCard === "other" ? "▲ Hide" : "▼ Details"}</div>
          </div>
        </div>
      </div>
      {/* ROW 3 — Ledger Summary */}
      {ledgers.length > 0 && <div style={{ ...S.card, padding: "16px", marginBottom: "16px" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "#9db3cc", letterSpacing: "1.5px", marginBottom: "12px" }}>💰 FINANCIAL OVERVIEW</div>
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", overflowX: "auto", paddingBottom: "8px", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
          {/* Outstanding */}
          <div onClick={() => setExpandLedger(expandLedger === "outstanding" ? null : "outstanding")} style={{ ...S.card, background: "#f0fdf4", boxShadow: "none", padding: "16px", minWidth: "150px", flexShrink: 0, cursor: "pointer" }}>
            <div style={{ fontSize: "22px", marginBottom: "6px" }}>💼</div>
            <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f3172" }}>₹{totalOutstanding.toLocaleString()}</div>
            <div style={{ fontSize: "11px", color: "#6b84a3", marginTop: "2px" }}>Outstanding</div>
            <div style={{ fontSize: "10px", color: "#166534", marginTop: "4px", fontWeight: 600 }}>{expandLedger === "outstanding" ? "▲ Hide" : "▼ Details"}</div>
          </div>
          {/* TDS */}
          <div onClick={() => setExpandLedger(expandLedger === "tds" ? null : "tds")} style={{ ...S.card, background: "#fef9c3", boxShadow: "none", padding: "16px", minWidth: "150px", flexShrink: 0, cursor: "pointer" }}>
            <div style={{ fontSize: "22px", marginBottom: "6px" }}>🧾</div>
            <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f3172" }}>₹{totalTDS.toLocaleString()}</div>
            <div style={{ fontSize: "11px", color: "#6b84a3", marginTop: "2px" }}>Total TDS</div>
            <div style={{ fontSize: "10px", color: "#d97706", marginTop: "4px", fontWeight: 600 }}>{expandLedger === "tds" ? "▲ Hide" : "▼ Details"}</div>
          </div>
          {/* Retention */}
          <div onClick={() => setExpandLedger(expandLedger === "retention" ? null : "retention")} style={{ ...S.card, background: "#ede9fe", boxShadow: "none", padding: "16px", minWidth: "150px", flexShrink: 0, cursor: "pointer" }}>
            <div style={{ fontSize: "22px", marginBottom: "6px" }}>🔒</div>
            <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f3172" }}>₹{totalRetention.toLocaleString()}</div>
            <div style={{ fontSize: "11px", color: "#6b84a3", marginTop: "2px" }}>Total Retention</div>
            <div style={{ fontSize: "10px", color: "#5b21b6", marginTop: "4px", fontWeight: 600 }}>{expandLedger === "retention" ? "▲ Hide" : "▼ Details"}</div>
          </div>
          {/* Tally */}
          <div onClick={() => setExpandLedger(expandLedger === "tally" ? null : "tally")} style={{ ...S.card, background: tallyOk ? "#dcfce7" : "#fee2e2", boxShadow: "none", padding: "16px", minWidth: "150px", flexShrink: 0, cursor: "pointer" }}>
            <div style={{ fontSize: "22px", marginBottom: "6px" }}>{tallyOk ? "✅" : "❌"}</div>
            <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f3172" }}>{tallyOk ? "Balanced" : `₹${Math.abs(tallyDiff).toLocaleString()}`}</div>
            <div style={{ fontSize: "11px", color: "#6b84a3", marginTop: "2px" }}>Tally</div>
            <div style={{ fontSize: "10px", color: tallyOk ? "#166534" : "#991b1b", marginTop: "4px", fontWeight: 600 }}>{expandLedger === "tally" ? "▲ Hide" : "▼ Details"}</div>
          </div>
        </div>
      </div>}
      {expandLedger && ledgers.length > 0 && <div style={{ ...S.card, marginBottom: "20px" }}>
        {expandLedger === "outstanding" && <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>💼 Outstanding per Ledger</h3>
            <span style={{ fontWeight: 800, color: "#166534", fontSize: "14px" }}>₹{totalOutstanding.toLocaleString()} Total</span>
          </div>
          {ledgerBalances.map((l, i) => (
            <div key={l.id} style={{ marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "3px" }}>
                <span style={{ fontWeight: 600, color: "#1a2b4a" }}>{l.name}</span>
                <span style={{ fontWeight: 700, color: l.balance >= 0 ? "#166534" : "#991b1b" }}>₹{l.balance.toLocaleString()}</span>
              </div>
              <div style={{ background: "#f0f4f9", borderRadius: "4px", height: "10px", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: "4px", background: l.balance >= 0 ? "linear-gradient(90deg,#166534,#4ade80)" : "linear-gradient(90deg,#991b1b,#f87171)", width: `${totalOutstanding > 0 ? (Math.abs(l.balance) / Math.abs(totalOutstanding)) * 100 : 0}%`, transition: "width 0.5s" }} />
              </div>
            </div>
          ))}
        </>}
        {expandLedger === "tds" && <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>🧾 TDS per Ledger</h3>
            <span style={{ fontWeight: 800, color: "#d97706", fontSize: "14px" }}>₹{totalTDS.toLocaleString()} Total</span>
          </div>
          {ledgers.map((l: any) => {
            const tds = (l.entries || []).filter(e => e.particulars.includes("TDS")).reduce((a, e) => a + (e.debit || 0), 0);
            if (tds === 0) return null;
            return (
              <div key={l.id} style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "3px" }}>
                  <span style={{ fontWeight: 600, color: "#1a2b4a" }}>{l.name}</span>
                  <span style={{ fontWeight: 700, color: "#d97706" }}>₹{tds.toLocaleString()}</span>
                </div>
                <div style={{ background: "#fef9c3", borderRadius: "4px", height: "10px", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: "4px", background: "linear-gradient(90deg,#d97706,#fbbf24)", width: `${totalTDS > 0 ? (tds / totalTDS) * 100 : 0}%`, transition: "width 0.5s" }} />
                </div>
              </div>
            );
          })}
        </>}
        {expandLedger === "retention" && <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>🔒 Retention per Ledger</h3>
            <span style={{ fontWeight: 800, color: "#5b21b6", fontSize: "14px" }}>₹{totalRetention.toLocaleString()} Total</span>
          </div>
          {ledgers.map((l: any) => {
            const ret = (l.entries || []).filter(e => e.particulars.includes("Retention")).reduce((a, e) => a + (e.debit || 0), 0);
            if (ret === 0) return null;
            return (
              <div key={l.id} style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "3px" }}>
                  <span style={{ fontWeight: 600, color: "#1a2b4a" }}>{l.name}</span>
                  <span style={{ fontWeight: 700, color: "#5b21b6" }}>₹{ret.toLocaleString()}</span>
                </div>
                <div style={{ background: "#ede9fe", borderRadius: "4px", height: "10px", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: "4px", background: "linear-gradient(90deg,#5b21b6,#a78bfa)", width: `${totalRetention > 0 ? (ret / totalRetention) * 100 : 0}%`, transition: "width 0.5s" }} />
                </div>
              </div>
            );
          })}
        </>}
        {expandLedger === "tally" && <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>{tallyOk ? "✅ Ledger Balanced" : "❌ Ledger Mismatch"}</h3>
            <span style={{ fontWeight: 800, color: tallyOk ? "#166534" : "#991b1b", fontSize: "14px" }}>{tallyOk ? "All Good" : `Diff: ₹${Math.abs(tallyDiff).toLocaleString()}`}</span>
          </div>
          {[
            ["Total Invoiced", "#0f3172", totalInvoiced],
            ["Less: TDS", "#d97706", -totalTDS],
            ["Less: Retention", "#5b21b6", -totalRetention],
            ["Less: Bank Payments", "#166534", -bankPayments],
            ["Outstanding Balance", "#1e50a0", nonSeakOutstanding],
          ].map(([lbl, color, val]) => (
            <div key={lbl} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f0f4f9", fontSize: "13px" }}>
              <span style={{ color: "#6b84a3", fontWeight: 600 }}>{lbl}</span>
              <span style={{ fontWeight: 700, color }}>{val < 0 ? `-₹${Math.abs(val).toLocaleString()}` : `₹${val.toLocaleString()}`}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: "14px", marginTop: "4px" }}>
            <span style={{ fontWeight: 700 }}>Difference</span>
            <span style={{ fontWeight: 800, color: tallyOk ? "#166534" : "#991b1b" }}>{tallyOk ? "₹0 ✅" : `₹${Math.abs(tallyDiff).toLocaleString()} ❌`}</span>
          </div>
        </>}
      </div>}
      {expandCard && (
        <div style={{ ...S.card, marginBottom: "20px" }}>
          {expandCard === "sqm" && <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>📐 SQM Breakdown</h3>
              <span style={{ fontWeight: 800, color: "#7c3aed", fontSize: "14px" }}>{totalSqm}m² Total</span>
            </div>
            {sites.filter(s => (s.works || []).some(w => w.workType === "SQM" || !w.workType)).map((s: any) => {
              const works = (s.works || []).filter(w => w.workType === "SQM" || !w.workType);
              const siteTotal = works.reduce((a, w) => a + (Number(w.area) || 0), 0);
              const grouped = Object.values(works.reduce((acc, w) => {
                const key = w.place.trim().toLowerCase();
                if (!acc[key]) acc[key] = { place: w.place.trim(), area: 0 };
                acc[key].area += Number(w.area) || 0;
                return acc;
              }, {}));
              return (
                <div key={s.id} style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontWeight: 700, fontSize: "13px", color: "#0f3172" }}>{s.name}</span>
                    <span style={{ fontWeight: 700, fontSize: "13px", color: "#7c3aed" }}>{siteTotal}m²</span>
                  </div>
                  {grouped.map((w: any) => (
                    <div key={w.id} style={{ marginBottom: "6px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "2px" }}>
                        <span style={{ color: "#1a2b4a" }}>{w.place}</span>
                        <span style={{ fontWeight: 600, color: "#7c3aed" }}>{w.area}m²</span>
                      </div>
                      <div style={{ background: "#ede9fe", borderRadius: "4px", height: "10px", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: "4px", background: "linear-gradient(90deg,#7c3aed,#a78bfa)", width: `${siteTotal > 0 ? (w.area / siteTotal) * 100 : 0}%`, transition: "width 0.5s" }} />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </>}
          {expandCard === "rmt" && <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>📏 RMT Breakdown</h3>
              <span style={{ fontWeight: 800, color: "#9d174d", fontSize: "14px" }}>{totalRmt}rmt Total</span>
            </div>
            {sites.filter(s => (s.works || []).some(w => w.workType === "RMT")).map((s: any) => {
              const works = (s.works || []).filter(w => w.workType === "RMT");
              const siteTotal = works.reduce((a, w) => a + (Number(w.area) || 0), 0);
              const grouped = Object.values(works.reduce((acc, w) => {
                const key = w.place.trim().toLowerCase();
                if (!acc[key]) acc[key] = { place: w.place.trim(), area: 0 };
                acc[key].area += Number(w.area) || 0;
                return acc;
              }, {}));
              return (
                <div key={s.id} style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontWeight: 700, fontSize: "13px", color: "#0f3172" }}>{s.name}</span>
                    <span style={{ fontWeight: 700, fontSize: "13px", color: "#9d174d" }}>{siteTotal}rmt</span>
                  </div>
                  {grouped.map((w: any) => (
                    <div key={w.id} style={{ marginBottom: "6px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "2px" }}>
                        <span style={{ color: "#1a2b4a" }}>{w.place}</span>
                        <span style={{ fontWeight: 600, color: "#9d174d" }}>{w.area}rmt</span>
                      </div>
                      <div style={{ background: "#fce7f3", borderRadius: "4px", height: "10px", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: "4px", background: "linear-gradient(90deg,#db2777,#f9a8d4)", width: `${totalRmt > 0 ? (Number(w.area) / totalRmt) * 100 : 0}%`, transition: "width 0.5s" }} />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </>}
          {expandCard === "mp" && <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>👨‍🔧 Manpower Breakdown</h3>
              <span style={{ fontWeight: 800, color: "#d97706", fontSize: "14px" }}>₹{totalMp.toLocaleString()} Total</span>
            </div>
            {sites.filter(s => (s.works || []).some(w => w.workType === "Manpower")).map((s: any) => {
              const works = (s.works || []).filter(w => w.workType === "Manpower");
              const siteTotal = works.reduce((a, w) => a + calcWork(w), 0);
              const grouped = Object.values(works.reduce((acc, w) => {
                const key = w.place.trim().toLowerCase();
                if (!acc[key]) acc[key] = { place: w.place.trim(), amount: 0 };
                acc[key].amount += calcWork(w);
                return acc;
              }, {}));
              return (
                <div key={s.id} style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontWeight: 700, fontSize: "13px", color: "#0f3172" }}>{s.name}</span>
                    <span style={{ fontWeight: 700, fontSize: "13px", color: "#d97706" }}>₹{siteTotal.toLocaleString()}</span>
                  </div>
                  {grouped.map((w: any) => (
                    <div key={w.id} style={{ marginBottom: "6px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "2px" }}>
                        <span style={{ color: "#1a2b4a" }}>{w.place}</span>
                        <span style={{ fontWeight: 600, color: "#d97706" }}>₹{w.amount.toLocaleString()}</span>
                      </div>
                      <div style={{ background: "#fef9c3", borderRadius: "4px", height: "10px", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: "4px", background: "linear-gradient(90deg,#d97706,#fbbf24)", width: `${siteTotal > 0 ? (w.amount / siteTotal) * 100 : 0}%`, transition: "width 0.5s" }} />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </>}
          {expandCard === "kgs" && <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>⚖️ KGS Breakdown</h3>
              <span style={{ fontWeight: 800, color: "#166534", fontSize: "14px" }}>{totalKgs}kgs Total</span>
            </div>
            {sites.filter(s => (s.works || []).some(w => w.workType === "KGS")).map((s: any) => {
              const works = (s.works || []).filter(w => w.workType === "KGS");
              const siteTotal = works.reduce((a, w) => a + (Number(w.area) || 0), 0);
              const grouped = Object.values(works.reduce((acc, w) => {
                const key = w.place.trim().toLowerCase();
                if (!acc[key]) acc[key] = { place: w.place.trim(), area: 0 };
                acc[key].area += Number(w.area) || 0;
                return acc;
              }, {}));
              return (
                <div key={s.id} style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontWeight: 700, fontSize: "13px", color: "#0f3172" }}>{s.name}</span>
                    <span style={{ fontWeight: 700, fontSize: "13px", color: "#166534" }}>{siteTotal}kgs</span>
                  </div>
                  {grouped.map((w, i) => (
                    <div key={i} style={{ marginBottom: "6px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "2px" }}>
                        <span style={{ color: "#1a2b4a" }}>{w.place}</span>
                        <span style={{ fontWeight: 600, color: "#166534" }}>{w.area}kgs</span>
                      </div>
                      <div style={{ background: "#dcfce7", borderRadius: "4px", height: "10px", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: "4px", background: "linear-gradient(90deg,#166534,#4ade80)", width: `${siteTotal > 0 ? (w.area / siteTotal) * 100 : 0}%`, transition: "width 0.5s" }} />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </>}
          {expandCard === "other" && <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>🔧 Other Breakdown</h3>
              <span style={{ fontWeight: 800, color: "#991b1b", fontSize: "14px" }}>₹{totalOther.toLocaleString()} Total</span>
            </div>
            {sites.filter(s => (s.works || []).some(w => w.workType === "Other")).map((s: any) => {
              const works = (s.works || []).filter(w => w.workType === "Other");
              const siteTotal = works.reduce((a, w) => a + (Number(w.amount) || 0), 0);
              return (
                <div key={s.id} style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontWeight: 700, fontSize: "13px", color: "#0f3172" }}>{s.name}</span>
                    <span style={{ fontWeight: 700, fontSize: "13px", color: "#991b1b" }}>₹{siteTotal.toLocaleString()}</span>
                  </div>
                  {works.map((w, i) => (
                    <div key={i} style={{ marginBottom: "6px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "2px" }}>
                        <span style={{ color: "#1a2b4a" }}>{w.place}</span>
                        <span style={{ fontWeight: 600, color: "#991b1b" }}>₹{Number(w.amount).toLocaleString()}</span>
                      </div>
                      <div style={{ background: "#fee2e2", borderRadius: "4px", height: "10px", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: "4px", background: "linear-gradient(90deg,#991b1b,#f87171)", width: `${siteTotal > 0 ? (Number(w.amount) / siteTotal) * 100 : 0}%`, transition: "width 0.5s" }} />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </>}
          {expandCard === "inv" && <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>🧾 Invoice Breakdown</h3>
              <span style={{ fontWeight: 800, color: "#9d174d", fontSize: "14px" }}>
                {invoices.length} Invoices — ₹{invoices.reduce((a, inv) => a + (inv.total || 0), 0).toLocaleString()} Total
              </span>
            </div>
            {(() => {
              const grouped = Object.values(invoices.reduce((acc, inv) => {
                const raw = (inv.siteName || "Unknown").trim().toLowerCase();
                const key = raw.includes("wist") || raw.includes("wisr") ? "Wistron" : (inv.siteName || "Unknown").trim();
                if (!acc[key]) acc[key] = { siteName: key, count: 0, total: 0 };
                acc[key].count++;
                acc[key].total += inv.total || 0;
                return acc;
              }, {})).sort((a, b) => b.total - a.total);
              const grandTotal = invoices.reduce((a, inv) => a + (inv.total || 0), 0);
              return grouped.map((g, i) => (
                <div key={i} style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "2px" }}>
                    <span style={{ fontWeight: 600, color: "#1a2b4a" }}>{g.siteName}</span>
                    <span style={{ fontWeight: 700, color: "#9d174d" }}>
                      {g.count} invoice{g.count !== 1 ? "s" : ""} — ₹{g.total.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ background: "#fce7f3", borderRadius: "4px", height: "10px", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: "4px", background: "linear-gradient(90deg,#db2777,#f9a8d4)", width: `${grandTotal > 0 ? (g.total / grandTotal) * 100 : 0}%`, transition: "width 0.5s" }} />
                  </div>
                </div>
              ));
            })()}
          </>}
          {expandCard === "uninv" && <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>📋 Uninvoiced Works</h3>
              <span style={{ fontWeight: 800, color: "#ea580c", fontSize: "14px" }}>₹{totalUninvoiced.toLocaleString()} Total</span>
            </div>
            {uninvoicedSites.length === 0 ? <div style={{ textAlign: "center", color: "#9db3cc", padding: "20px" }}>All works have been invoiced! ✅</div>
              : uninvoicedSites.map((s: any) => {
                const siteTotal = s.uninvoicedWorks.reduce((a, w) => a + calcWork(w), 0);
                return (
                  <div key={s.id} style={{ marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ fontWeight: 700, fontSize: "13px", color: "#0f3172" }}>{s.name}</span>
                      <span style={{ fontWeight: 700, fontSize: "13px", color: "#ea580c" }}>₹{siteTotal.toLocaleString()}</span>
                    </div>
                    {s.uninvoicedWorks.map((w: any) => (
                      <div key={w.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "#fff7ed", borderRadius: "8px", marginBottom: "5px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                          <span style={S.wbadge(w.workType || "SQM")}>{w.workType || "SQM"}</span>
                          <span style={{ fontSize: "12px", color: "#1a2b4a" }}>{w.place}</span>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: "12px", color: "#ea580c" }}>₹{calcWork(w).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
          </>}
        </div>
      )}
      <div style={S.card}>
        <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 700 }}>🏗️ Sites Overview</h3>
        {[...sites].sort((a, b) => {
          if (a.status === "Active" && b.status !== "Active") return -1;
          if (a.status !== "Active" && b.status === "Active") return 1;
          if (a.status === "Active") return b.id - a.id;
          const aMax = (a.works || []).map((w: any) => w.toDate || "").filter(Boolean).sort().pop() || "";
          const bMax = (b.works || []).map((w: any) => w.toDate || "").filter(Boolean).sort().pop() || "";
          return bMax.localeCompare(aMax);
        }).map((site, idx) => {
          const rev = (site.works || []).reduce((a, w) => a + calcWork(w), 0);
          return (
            <div key={site.id} style={{ padding: "12px 14px", background: "#f0f6ff", borderRadius: "10px", marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div><h3 style={{ margin: "0 0 2px", fontSize: "15px", fontWeight: 700 }}>{sites.length - idx}. {site.name}</h3><div style={{ fontSize: "11px", color: "#6b84a3" }}>{site.client}</div></div>
                <div style={{ textAlign: "right" }}><div style={{ fontWeight: 700, color: "#166534", fontSize: "13px" }}>₹{rev.toLocaleString()}</div><span style={{ background: site.status === "Active" ? "#dcfce7" : "#fee2e2", color: site.status === "Active" ? "#166534" : "#991b1b", fontSize: "10px", fontWeight: 600, borderRadius: "20px", padding: "2px 9px" }}>{site.status}</span></div>
              </div>
              {(site.works || []).length > 0 && <DashSiteWorks works={site.works} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── SITE WORKS DROPDOWN ───────────────────────────────
function SiteWorksDropdown({ works, siteId, isExp, tab, startEdit, deleteWork }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: "10px", borderRadius: "10px", overflow: "hidden", border: "1.5px solid #bfdbfe" }}>
      <div onClick={() => setOpen(p => !p)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "#1e50a0", cursor: "pointer" }}>
        <span style={{ fontSize: "12px", fontWeight: 700, color: "#fff" }}>📐 {works.length} Work{works.length !== 1 ? "s" : ""}</span>
        <span style={{ color: "#fff", fontSize: "12px" }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && <div style={{ background: "#f8faff", padding: "8px 10px" }}>
        {[...works].sort((a, b) => (b.fromDate || "").localeCompare(a.fromDate || "")).map((w: any) => (
          <div key={w.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #e8f0ff" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                <span style={S.wbadge(w.workType || "SQM")}>{w.workType || "SQM"}</span>
                <span style={{ fontWeight: 600, fontSize: "12px" }}>{w.place}</span>
              </div>
              {w.fromDate && <div style={{ fontSize: "10px", color: "#6b84a3" }}>{w.fromDate} → {w.toDate || "ongoing"}</div>}
              <div style={{ fontSize: "10px", color: "#6b84a3" }}>{workUnitLabel(w)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 700, fontSize: "13px", color: "#166534" }}>₹{calcWork(w).toLocaleString()}</div>
              {isExp && tab === "works" && <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
                <button onClick={e => { e.stopPropagation(); startEdit(siteId, w); }} style={{ ...S.btn("#f0f6ff", "#1e50a0"), padding: "3px 7px", fontSize: "11px" }}>✏️</button>
                <button onClick={e => { e.stopPropagation(); deleteWork(siteId, w.id); }} style={{ ...S.btn("#fee2e2", "#991b1b"), padding: "3px 7px", fontSize: "11px" }}>🗑️</button>
              </div>}
            </div>
          </div>
        ))}
      </div>}
    </div>
  );
}

// ── SITES ─────────────────────────────────────────────
function Sites({ sites, setSites, workers, assignments, setAssignments, recycleBin, setRecycleBin, invoices, setInvoices }) {
  const [showAdd, setShowAdd] = useState(false);
  const [siteForm, setSiteForm] = useState({ name: "", client: "Swathi Engineering Agency", status: "Active" });
  const [expandSite, setExpandSite] = useState(null);
  const [siteTab, setSiteTab] = useState({});
  const EMPTY_WORK = { place: "", workersList: "", fromDate: "", toDate: "", area: "", rate: "", labour: "", amount: "", workType: "SQM" };
  const [workForm, setWorkForm] = useState(EMPTY_WORK);
  const [editWorkId, setEditWorkId] = useState(null);
  const [addingWork, setAddingWork] = useState(null);
  const [saveMsg, setSaveMsg] = useState({});

  const getTab = id => siteTab[id] || "works";
  const addSite = () => { if (!siteForm.name.trim()) return; const ns = { id: Date.now(), ...siteForm, works: [] }; setSites(p => [...p, ns]); setAssignments(p => ({ ...p, [ns.id]: {} })); setSiteForm({ name: "", client: "Swathi Engineering Agency", status: "Active" }); setShowAdd(false); };
  const [delSiteModal, setDelSiteModal] = useState(null);
  const [delWorkModal, setDelWorkModal] = useState(null);
  const [editSiteModal, setEditSiteModal] = useState(null);
  const [editSiteForm, setEditSiteForm] = useState({ name: "", client: "" });
  const [editSitePwModal, setEditSitePwModal] = useState(false);
  const [orphanWarning, setOrphanWarning] = useState(null);
  const deleteSite = id => {
    const site = sites.find(s => s.id === id);
    const siteWorkIds = (site?.works || []).map((w: any) => w.id);
    const linked = invoices.filter(inv => (inv.works || []).some(w => siteWorkIds.includes(w.id)));
    if (linked.length > 0) {
      setOrphanWarning({ siteId: id, wid: null, isSite: true, invoices: linked });
    } else {
      setDelSiteModal(id);
    }
  };
  const confirmDeleteSite = () => {
    const s = sites.find(x => x.id === delSiteModal);
    if (s) { setRecycleBin(p => ({ ...p, sites: [...(p.sites || []), s] })); setSites(p => p.filter(x => x.id !== delSiteModal)); }
    setDelSiteModal(null);
  };
  const toggleWorker = (siteId, w) => setAssignments(p => { const c = { ...(p[siteId] || {}) }; if (c[w.id]) delete c[w.id]; else c[w.id] = w.category; return { ...p, [siteId]: c }; });
  const changeDesig = (siteId, wid, desig) => setAssignments(p => ({ ...p, [siteId]: { ...(p[siteId] || {}), [wid]: desig } }));
  const saveWork = siteId => {
    if (!workForm.place) return;
    if (workForm.workType === "Manpower" && (!workForm.labour || !workForm.rate)) return;
    if (workForm.workType === "Other" && !workForm.amount) return;
    if (workForm.workType !== "Manpower" && workForm.workType !== "Other" && (!workForm.area || !workForm.rate)) return;
    setSites(p => p.map((s: any) => {
      if (s.id !== siteId) return s;
      if (editWorkId) return { ...s, works: (s.works || []).map((w: any) => w.id === editWorkId ? { ...w, ...workForm, area: Number(workForm.area), rate: Number(workForm.rate), labour: Number(workForm.labour) } : w) };
      return { ...s, works: [...(s.works || []), { id: crypto.randomUUID(), ...workForm, area: Number(workForm.area), rate: Number(workForm.rate), labour: Number(workForm.labour) }] };
    }));
    setWorkForm(EMPTY_WORK); setAddingWork(null); setEditWorkId(null);
    setSaveMsg(p => ({ ...p, [siteId]: true }));
    setTimeout(() => setSaveMsg(p => ({ ...p, [siteId]: false })), 2500);
  };
  const deleteWork = (siteId, wid) => {
    console.log("Deleting work ID:", wid);
    console.log("Invoice work IDs:", invoices.map((inv: any) => (inv.works || []).map((w: any) => w.id)));
    const linked = invoices.filter(inv => (inv.works || []).some(w => w.id === wid));
    if (linked.length > 0) {
      setOrphanWarning({ siteId, wid, invoices: linked });
    } else {
      setDelWorkModal({ siteId, wid });
    }
  };
  const confirmDeleteWork = () => { setSites(p => p.map((s: any) => s.id === delWorkModal.siteId ? { ...s, works: (s.works || []).filter(w => w.id !== delWorkModal.wid) } : s)); setDelWorkModal(null); };
  const startEdit = (siteId, w) => { setAddingWork(siteId); setEditWorkId(w.id); setWorkForm({ place: w.place, workersList: w.workersList || "", fromDate: w.fromDate || "", toDate: w.toDate || "", area: String(w.area || ""), rate: String(w.rate || ""), labour: String(w.labour || ""), amount: String(w.amount || ""), workType: w.workType || "SQM" }); };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
        <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800 }}>🏗️ Sites</h2>
        <button onClick={() => setShowAdd(p => !p)} style={S.btn()}>+ Add Site</button>
      </div>
      {showAdd && <div style={{ ...S.card, marginBottom: "16px", border: "1.5px solid #bfdbfe" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: "14px" }}>New Site</h3>
        {[["Site Name", "name"], ["Client", "client"]].map(([lbl, key]) => (
          <div key={key} style={{ marginBottom: "10px" }}><label style={S.lbl}>{lbl}</label><input value={siteForm[key]} onChange={e => setSiteForm(p => ({ ...p, [key]: e.target.value }))} style={S.inp} /></div>
        ))}
        <div style={{ marginBottom: "12px" }}><label style={S.lbl}>Status</label><select value={siteForm.status} onChange={e => setSiteForm(p => ({ ...p, status: e.target.value }))} style={S.inp}><option>Active</option><option>Completed</option><option>On Hold</option></select></div>
        <div style={{ display: "flex", gap: "9px" }}><button onClick={addSite} style={S.btn()}>Save</button><button onClick={() => setShowAdd(false)} style={S.btn("#f0f4f9", "#1a2b4a")}>Cancel</button></div>
      </div>}
      {delSiteModal && <PwModal
        title="Move Site to Recycle Bin?"
        onConfirm={confirmDeleteSite}
        onCancel={() => setDelSiteModal(null)}
      />}
      {delWorkModal && <PwModal
        title="Delete Work Entry?"
        onConfirm={confirmDeleteWork}
        onCancel={() => setDelWorkModal(null)}
      />}
      {editSitePwModal && <PwModal
        title="Edit Site Details?"
        onConfirm={() => {
          setSites(p => p.map((s: any) => s.id === editSiteModal.id ? { ...s, name: editSiteForm.name, client: editSiteForm.client } : s));
          setEditSitePwModal(false);
          setEditSiteModal(null);
        }}
        onCancel={() => setEditSitePwModal(false)}
      />}

      {editSiteModal && !editSitePwModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000 }}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "28px", width: "320px" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: "14px", fontWeight: 700 }}>✏️ Edit Site</h3>
            <div style={{ marginBottom: "10px" }}>
              <label style={S.lbl}>Site Name</label>
              <input value={editSiteForm.name} onChange={e => setEditSiteForm(p => ({ ...p, name: e.target.value }))} style={S.inp} />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={S.lbl}>Client</label>
              <input value={editSiteForm.client} onChange={e => setEditSiteForm(p => ({ ...p, client: e.target.value }))} style={S.inp} />
            </div>
            <div style={{ display: "flex", gap: "9px", justifyContent: "center" }}>
              <button onClick={() => setEditSitePwModal(true)} style={S.btn()}>🔐 Save</button>
              <button onClick={() => setEditSiteModal(null)} style={S.btn("#f0f4f9", "#1a2b4a")}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {orphanWarning && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000 }}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "28px", width: "320px", textAlign: "center" }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>⚠️</div>
            <h3 style={{ margin: "0 0 7px", color: "#d97706" }}>Linked to Invoice!</h3>
            <p style={{ fontSize: "12px", color: "#6b84a3", margin: "0 0 10px" }}>This work is linked to the following invoice(s):</p>
            <div style={{ marginBottom: "14px" }}>
              {orphanWarning.invoices.map((inv: any) => (
                <div key={inv.id} style={{ padding: "7px 12px", background: "#fef3c7", borderRadius: "8px", marginBottom: "6px", fontSize: "13px", fontWeight: 600, color: "#d97706" }}>
                  🧾 {inv.number} — ₹{inv.total?.toLocaleString()}
                </div>
              ))}
            </div>
            <p style={{ fontSize: "12px", color: "#dc2626", margin: "0 0 16px" }}>Deleting will flag the invoice as incomplete!</p>
            <div style={{ display: "flex", gap: "9px", justifyContent: "center" }}>
              <button onClick={() => {
                setInvoices(p => p.map((inv: any) =>
                  orphanWarning.invoices.some(oi => oi.id === inv.id)
                    ? { ...inv, flagged: true }
                    : inv
                ));
                setOrphanWarning(null);
                if (orphanWarning.isSite) {
                  setDelSiteModal(orphanWarning.siteId);
                } else {
                  setDelWorkModal({ siteId: orphanWarning.siteId, wid: orphanWarning.wid });
                }
              }} style={S.btn("#dc2626")}>Proceed</button>
              <button onClick={() => setOrphanWarning(null)} style={S.btn("#f0f4f9", "#1a2b4a")}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {[...sites].sort((a, b) => {
        if (a.status === "Active" && b.status !== "Active") return -1;
        if (a.status !== "Active" && b.status === "Active") return 1;
        if (a.status === "Active") return b.id - a.id;
        const aMax = (a.works || []).map((w: any) => w.toDate || "").filter(Boolean).sort().pop() || "";
        const bMax = (b.works || []).map((w: any) => w.toDate || "").filter(Boolean).sort().pop() || "";
        return bMax.localeCompare(aMax);
      }).map((site, idx) => {
        const sa = assignments[site.id] || {}; const isExp = expandSite === site.id; const tab = getTab(site.id);
        const rev = (site.works || []).reduce((a, w) => a + calcWork(w), 0);
        return (
          <div key={site.id} style={{ ...S.card, marginBottom: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "9px" }}>
              <div style={{ flex: 1, minWidth: 0, marginRight: "8px" }}>
                <h3 style={{ margin: "0 0 2px", fontSize: "15px", fontWeight: 700 }}>{sites.length - idx}. {site.name}</h3>
                <div style={{ fontSize: "11px", color: "#6b84a3" }}>{site.client}</div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#166534", marginTop: "3px" }}>₹{rev.toLocaleString()}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px", alignItems: "flex-end", flexShrink: 0 }}>
                <select value={site.status} onChange={e => setSites(p => p.map((s: any) => s.id === site.id ? { ...s, status: e.target.value } : s))} style={{ padding: "3px 8px", borderRadius: "20px", border: "none", fontSize: "11px", fontWeight: 600, outline: "none", cursor: "pointer", background: site.status === "Active" ? "#dcfce7" : site.status === "On Hold" ? "#fef9c3" : "#fee2e2", color: site.status === "Active" ? "#166534" : site.status === "On Hold" ? "#d97706" : "#991b1b" }}>
                  <option value="Active">Active</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                </select>
                <button onClick={() => { setEditSiteForm({ name: site.name, client: site.client }); setEditSiteModal(site); }} style={{ ...S.btn("#eff6ff", "#1e50a0"), padding: "4px 12px", fontSize: "11px", fontWeight: 600 }}>✏️ Edit</button>
                <button onClick={() => deleteSite(site.id)} style={{ ...S.btn("#fee2e2", "#991b1b"), padding: "4px 9px", fontSize: "12px" }}>🗑️</button>
              </div>
            </div>
            {(site.works || []).length > 0 && <SiteWorksDropdown works={site.works} siteId={site.id} isExp={isExp} tab={tab} startEdit={startEdit} deleteWork={deleteWork} />}
            <button onClick={() => setExpandSite(isExp ? null : site.id)} style={S.btn("#f0f6ff", "#1e50a0")}>{isExp ? "Close ▲" : "Manage ▼"}</button>
            {isExp && <div style={{ marginTop: "12px" }}>
              <div style={{ display: "flex", gap: "7px", marginBottom: "12px" }}>
                {[["works", "📐 Works"], ["assign", "⚙️ Workers"]].map(([t, lbl]) => (
                  <button key={t} onClick={() => setSiteTab(p => ({ ...p, [site.id]: t }))} style={S.btn(tab === t ? "#1e50a0" : "#e5e7eb", tab === t ? "#fff" : "#374151")}>{lbl}</button>
                ))}
              </div>
              {tab === "works" && <div>
                {saveMsg[site.id] && <SuccessBox msg="Work entry saved successfully!" />}
                <button onClick={() => { setAddingWork(addingWork === site.id ? null : site.id); setEditWorkId(null); setWorkForm(EMPTY_WORK); }} style={{ ...S.btn(), marginBottom: "10px", fontSize: "12px", padding: "7px 13px" }}>+ Add Work Entry</button>
                {addingWork === site.id && <div style={{ ...S.card, marginBottom: "10px", border: "1.5px solid #bfdbfe", padding: "14px" }}>
                  <h4 style={{ margin: "0 0 10px" }}>{editWorkId ? "Edit" : "New"} Work Entry</h4>
                  <div style={{ marginBottom: "10px" }}>
                    <label style={S.lbl}>Work Type</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {WORK_TYPES.map((t: any) => (
                        <button key={t} onClick={() => setWorkForm(p => ({ ...p, workType: t }))} style={{ ...S.btn(workForm.workType === t ? WORK_TYPE_COLOR[t].color : "#e5e7eb", workForm.workType === t ? "#fff" : "#374151"), padding: "6px 14px", fontSize: "12px" }}>{t}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "9px" }}>
                    <div style={{ gridColumn: "1/-1" }}><label style={S.lbl}>Place / Description</label><input value={workForm.place} onChange={e => setWorkForm(p => ({ ...p, place: e.target.value }))} style={S.inp} /></div>
                    <div><label style={S.lbl}>From Date</label><input type="date" value={workForm.fromDate} onChange={e => setWorkForm(p => ({ ...p, fromDate: e.target.value }))} style={S.inp} /></div>
                    <div><label style={S.lbl}>To Date</label><input type="date" value={workForm.toDate} onChange={e => setWorkForm(p => ({ ...p, toDate: e.target.value }))} style={S.inp} /></div>
                    {workForm.workType === "Manpower"
                      ? <><div><label style={S.lbl}>No. of Labour</label><input type="number" value={workForm.labour} onChange={e => setWorkForm(p => ({ ...p, labour: e.target.value }))} style={S.inp} /></div>
                        <div><label style={S.lbl}>Rate per Day (₹)</label><input type="number" value={workForm.rate} onChange={e => setWorkForm(p => ({ ...p, rate: e.target.value }))} style={S.inp} /></div></>
                      : workForm.workType === "Other"
                        ? <><div style={{ gridColumn: "1/-1" }}><label style={S.lbl}>Amount (₹)</label><input type="number" value={workForm.amount} onChange={e => setWorkForm(p => ({ ...p, amount: e.target.value }))} style={S.inp} /></div></>
                        : <><div><label style={S.lbl}>{workForm.workType === "RMT" ? "Length (rmt)" : workForm.workType === "KGS" ? "Weight (kgs)" : "Area (m²)"}</label><input type="number" value={workForm.area} onChange={e => setWorkForm(p => ({ ...p, area: e.target.value }))} style={S.inp} /></div>
                          <div><label style={S.lbl}>Rate (₹/{workForm.workType === "RMT" ? "rmt" : workForm.workType === "KGS" ? "kgs" : "m²"})</label><input type="number" value={workForm.rate} onChange={e => setWorkForm(p => ({ ...p, rate: e.target.value }))} style={S.inp} /></div></>
                    }
                  </div>
                  {((workForm.workType === "Manpower" && workForm.labour && workForm.rate) || (workForm.workType === "Other" && workForm.amount) || (workForm.workType !== "Manpower" && workForm.workType !== "Other" && workForm.area && workForm.rate)) &&
                    <div style={{ marginTop: "8px", padding: "7px 11px", background: "#dcfce7", borderRadius: "7px", fontSize: "13px", fontWeight: 600, color: "#166534" }}>
                      💰 ₹{workForm.workType === "Manpower" ? (Number(workForm.labour) * Number(workForm.rate)).toLocaleString() : workForm.workType === "Other" ? Number(workForm.amount).toLocaleString() : (Number(workForm.area) * Number(workForm.rate)).toLocaleString()}
                    </div>}
                  <div style={{ display: "flex", gap: "7px", marginTop: "11px" }}>
                    <button onClick={() => saveWork(site.id)} style={{ ...S.btn(), fontSize: "12px", padding: "7px 13px" }}>💾 Save</button>
                    <button onClick={() => { setAddingWork(null); setEditWorkId(null); }} style={{ ...S.btn("#f0f4f9", "#1a2b4a"), fontSize: "12px", padding: "7px 13px" }}>Cancel</button>
                  </div>
                </div>}
              </div>}
              {tab === "assign" && <div style={{ background: "#f8faff", borderRadius: "10px", padding: "12px" }}>
                <p style={{ margin: "0 0 10px", fontSize: "11px", color: "#6b84a3", fontWeight: 600 }}>Click to assign/remove workers.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {workers.map((w: any) => {
                    const isA = !!sa[w.id]; const desig = sa[w.id] || w.category; return (
                      <div key={w.id} style={{ display: "flex", alignItems: "center", gap: "9px", padding: "8px 12px", borderRadius: "9px", background: isA ? "#fff" : "#f0f4f9", border: isA ? `1.5px solid ${CAT_COLOR[desig].color}` : "1.5px solid transparent" }}>
                        <div onClick={() => toggleWorker(site.id, w)} style={{ width: "20px", height: "20px", borderRadius: "5px", flexShrink: 0, background: isA ? "#1e50a0" : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: "12px", fontWeight: 700 }}>{isA ? "✓" : ""}</div>
                        <div style={{ flex: 1 }}><div style={{ fontSize: "13px", fontWeight: 600 }}>{w.name}</div><div style={{ fontSize: "10px", color: "#6b84a3" }}>Profile: <span style={{ color: CAT_COLOR[w.category].color, fontWeight: 600 }}>{w.category}</span></div></div>
                        {isA && <select value={desig} onChange={e => changeDesig(site.id, w.id, e.target.value)} onClick={e => e.stopPropagation()} style={{ padding: "3px 6px", borderRadius: "6px", border: `1.5px solid ${CAT_COLOR[desig].color}`, fontSize: "11px", fontWeight: 600, color: CAT_COLOR[desig].color, background: CAT_COLOR[desig].bg, outline: "none" }}>
                          {CATEGORIES.map((c: any) => <option key={c}>{c}</option>)}
                        </select>}
                      </div>
                    );
                  })}
                </div>
              </div>}
            </div>}
          </div>
        );
      })}
    </div>
  );
}

// ── WORKERS ───────────────────────────────────────────
function Workers({ workers, setWorkers, execProfile, setExecProfile }) {
  const [view, setView] = useState("list");
  const [editId, setEditId] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_WORKER });
  const [delConfirm, setDelConfirm] = useState(null);
  const [showAadhaar, setShowAadhaar] = useState({});
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const saveEdit = () => { setWorkers(p => p.map((w: any) => w.id === editId ? { ...w, ...form } : w)); setEditId(null); };
  const addWorker = () => { if (!form.name.trim() || workers.length >= 20) return; setWorkers(p => [...p, { ...form, id: Date.now() }]); setForm({ ...EMPTY_WORKER }); setAddOpen(false); };
  const deleteWorker = id => { setWorkers(p => p.filter(w => w.id !== id)); setDelConfirm(null); };
  const mask = n => (!n || n.length < 4) ? (n || "—") : "XXXX-XXXX-" + n.slice(-4);
  const openEdit = w => { setForm({ ...w }); setEditId(w.id); };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "8px" }}>
        <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800 }}>👷 Workers & Profiles</h2>
        <div style={{ display: "flex", gap: "7px" }}>
          <button onClick={() => setView("list")} style={S.btn(view === "list" ? "#1e50a0" : "#e5e7eb", view === "list" ? "#fff" : "#374151")}>Workers</button>
          <button onClick={() => setView("exec")} style={S.btn(view === "exec" ? "#1e50a0" : "#e5e7eb", view === "exec" ? "#fff" : "#374151")}>Executive</button>
          {view === "list" && workers.length < 20 && <button onClick={() => { setAddOpen(p => !p); setForm({ ...EMPTY_WORKER }); }} style={S.btn("#0f3172")}>+ Add</button>}
        </div>
      </div>
      {addOpen && view === "list" && <div style={{ ...S.card, marginBottom: "16px", border: "1.5px solid #bfdbfe" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 700 }}>New Worker Profile</h3>
        <WForm form={form} setF={setF} />
        <div style={{ display: "flex", gap: "8px" }}><button onClick={addWorker} style={S.btn()}>💾 Save</button><button onClick={() => setAddOpen(false)} style={S.btn("#f0f4f9", "#1a2b4a")}>Cancel</button></div>
      </div>}
      {view === "exec" && <div style={{ ...S.card, maxWidth: "500px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "13px", marginBottom: "16px" }}>
          {execProfile.photo ? <img src={execProfile.photo} style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }} /> : <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#1e50a0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "17px", color: "#fff", fontWeight: 700 }}>V</div>}
          <div><div style={{ fontSize: "15px", fontWeight: 700 }}>Vinoth Kumar. N</div><div style={{ fontSize: "11px", color: "#6b84a3" }}>Site Executive</div></div>
        </div>
        {editId === "exec"
          ? <><EForm form={form} setF={setF} /><div style={{ display: "flex", gap: "8px" }}><button onClick={() => { setExecProfile({ ...execProfile, ...form }); setEditId(null); }} style={S.btn()}>💾 Save</button><button onClick={() => setEditId(null)} style={S.btn("#f0f4f9", "#1a2b4a")}>Cancel</button></div></>
          : <>{execProfile.photo && <img src={execProfile.photo} style={{ width: "80px", height: "80px", borderRadius: "8px", objectFit: "cover", marginBottom: "12px" }} />}
            <PRow label="Phone" value={execProfile.phone || "—"} />
            <PRow label="Aadhaar" value={showAadhaar["exec"] ? (execProfile.aadhaar || "—") : mask(execProfile.aadhaar)} toggle={() => setShowAadhaar(p => ({ ...p, exec: !p["exec"] }))} />
            <PRow label="Date of Birth" value={execProfile.dob || "—"} />
            <PRow label="Date of Joining" value={execProfile.doj || "—"} />
            <button onClick={() => { setForm({ ...EMPTY_WORKER, ...execProfile }); setEditId("exec"); }} style={{ ...S.btn(), marginTop: "12px" }}>✏️ Edit Profile</button>
          </>}
      </div>}
      {view === "list" && <>
        <div style={{ fontSize: "11px", color: "#6b84a3", marginBottom: "12px" }}>{workers.length}/20 workers</div>
        {CATEGORIES.map((cat: any) => (
          <div key={cat} style={{ marginBottom: "20px" }}>
            <h3 style={{ margin: "0 0 9px", fontSize: "12px", fontWeight: 700, color: CAT_COLOR[cat].color, textTransform: "uppercase", letterSpacing: ".05em" }}>{cat}s ({workers.filter(w => w.category === cat).length})</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "10px" }}>
              {workers.filter(w => w.category === cat).map((w: any) => (
                <WCard key={w.id} w={w} isEditing={editId === w.id} form={form} setF={setF}
                  onEdit={() => openEdit(w)} onSave={saveEdit} onCancel={() => setEditId(null)}
                  onDelete={() => setDelConfirm(w.id)} showAadhaar={!!showAadhaar[w.id]}
                  toggleAadhaar={() => setShowAadhaar(p => ({ ...p, [w.id]: !p[w.id] }))} mask={mask} />
              ))}
            </div>
          </div>
        ))}
      </>}
      {delConfirm && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
        <div style={{ background: "#fff", borderRadius: "16px", padding: "28px", width: "290px", textAlign: "center" }}>
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>⚠️</div>
          <h3 style={{ margin: "0 0 7px" }}>Delete Worker?</h3>
          <p style={{ fontSize: "12px", color: "#6b84a3", margin: "0 0 20px" }}>Removes <strong>{workers.find(w => w.id === delConfirm)?.name}</strong> permanently.</p>
          <div style={{ display: "flex", gap: "9px", justifyContent: "center" }}><button onClick={() => deleteWorker(delConfirm)} style={S.btn("#dc2626")}>Yes, Delete</button><button onClick={() => setDelConfirm(null)} style={S.btn("#f0f4f9", "#1a2b4a")}>Cancel</button></div>
        </div>
      </div>}
    </div>
  );
}

function WCard({ w, isEditing, form, setF, onEdit, onSave, onCancel, onDelete, showAadhaar, toggleAadhaar, mask }) {
  const [exp, setExp] = useState(false);
  return (
    <div style={{ ...S.card, padding: "13px" }}>
      <div onClick={() => !isEditing && setExp(p => !p)} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: exp || isEditing ? "11px" : "0", cursor: "pointer" }}>
        {w.photo ? <img src={w.photo} style={{ width: "38px", height: "38px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: CAT_COLOR[w.category].bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, color: CAT_COLOR[w.category].color, flexShrink: 0 }}>{w.name[0]}</div>}
        <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{w.name}</div><span style={S.badge(w.category)}>{w.category}</span></div>
        <div style={{ fontSize: "12px", color: "#90afd4" }}>{exp || isEditing ? "▲" : "▼"}</div>
      </div>
      {isEditing && <div><WForm form={form} setF={setF} /><div style={{ display: "flex", gap: "7px" }}><button onClick={onSave} style={{ ...S.btn(), padding: "6px 12px", fontSize: "12px" }}>💾</button><button onClick={onCancel} style={{ ...S.btn("#f0f4f9", "#1a2b4a"), padding: "6px 12px", fontSize: "12px" }}>Cancel</button></div></div>}
      {!isEditing && exp && <div>
        {w.photo && <img src={w.photo} style={{ width: "80px", height: "80px", borderRadius: "8px", objectFit: "cover", marginBottom: "10px" }} />}
        <PRow label="📞 Phone" value={w.phone || "—"} />
        <PRow label="🪪 Aadhaar" value={showAadhaar ? (w.aadhaar || "—") : mask(w.aadhaar)} toggle={toggleAadhaar} />
        <PRow label="🎂 DOB" value={w.dob ? fmtDate(w.dob) : "—"} />
        <PRow label="📅 Joined" value={w.doj ? fmtDate(w.doj) : "—"} />
        <div style={{ display: "flex", gap: "7px", marginTop: "10px" }}><button onClick={onEdit} style={{ ...S.btn(), padding: "5px 12px", fontSize: "12px" }}>✏️ Edit</button><button onClick={onDelete} style={{ ...S.btn("#fee2e2", "#991b1b"), padding: "5px 12px", fontSize: "12px" }}>🗑️ Delete</button></div>
      </div>}
    </div>
  );
}
function PRow({ label, value, toggle }) { return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid #f0f4f9", fontSize: "12px" }}><span style={{ color: "#6b84a3", fontWeight: 600, fontSize: "11px" }}>{label}</span><span style={{ fontWeight: 500 }}>{value}{toggle && <span onClick={toggle} style={{ marginLeft: "7px", fontSize: "11px", color: "#1e50a0", cursor: "pointer" }}>👁</span>}</span></div>; }
function WForm({ form, setF }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
    <div style={{ gridColumn: "1/-1" }}><PhotoUpload value={form.photo || ""} onChange={v => setF("photo", v)} /></div>
    <div style={{ gridColumn: "1/-1" }}><label style={S.lbl}>Full Name</label><input value={form.name} onChange={e => setF("name", e.target.value)} placeholder="Worker name" style={S.inp} /></div>
    <div><label style={S.lbl}>Default Category</label><select value={form.category} onChange={e => setF("category", e.target.value)} style={S.inp}>{CATEGORIES.map((c: any) => <option key={c}>{c}</option>)}</select></div>
    <div><label style={S.lbl}>Phone</label><input value={form.phone} onChange={e => setF("phone", e.target.value)} placeholder="10-digit" style={S.inp} maxLength={10} /></div>
    <div><label style={S.lbl}>Aadhaar</label><input value={form.aadhaar} onChange={e => setF("aadhaar", e.target.value)} placeholder="12-digit" style={S.inp} maxLength={12} /></div>
    <div><label style={S.lbl}>Date of Birth</label><input type="date" value={form.dob} onChange={e => setF("dob", e.target.value)} style={S.inp} /></div>
    <div><label style={S.lbl}>Date of Joining</label><input type="date" value={form.doj} onChange={e => setF("doj", e.target.value)} style={S.inp} /></div>
  </div>;
}
function EForm({ form, setF }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
    <div style={{ gridColumn: "1/-1" }}><PhotoUpload value={form.photo || ""} onChange={v => setF("photo", v)} /></div>
    <div><label style={S.lbl}>Phone</label><input value={form.phone} onChange={e => setF("phone", e.target.value)} style={S.inp} maxLength={10} /></div>
    <div><label style={S.lbl}>Aadhaar</label><input value={form.aadhaar} onChange={e => setF("aadhaar", e.target.value)} style={S.inp} maxLength={12} /></div>
    <div><label style={S.lbl}>Date of Birth</label><input type="date" value={form.dob} onChange={e => setF("dob", e.target.value)} style={S.inp} /></div>
    <div><label style={S.lbl}>Date of Joining</label><input type="date" value={form.doj} onChange={e => setF("doj", e.target.value)} style={S.inp} /></div>
  </div>;
}
// ── ATTENDANCE ────────────────────────────────────────────
// Helper — builds { "YYYY-MM": ["YYYY-MM-DD", ...] } for a date range
function buildMonthGroups(fromDate: string, toDate?: string): Record<string, string[]> {
  if (!fromDate) return {};
  const start = new Date(fromDate);
  const end = toDate ? new Date(toDate) : new Date(today);
  const groups: Record<string, string[]> = {};
  const cur = new Date(start);
  while (cur <= end) {
    const ds = cur.toISOString().split("T")[0];
    const mk = ds.slice(0, 7);
    if (!groups[mk]) groups[mk] = [];
    groups[mk].push(ds);
    cur.setDate(cur.getDate() + 1);
  }
  return groups;
}

// ── ATTENDANCE ────────────────────────────────────────
function Attendance({ workers, sites, attendance, setAttendance, assignments, invoices, savedReports, setSavedReports, recycleBin, setRecycleBin }: any) {
  const [tab, setTab] = useState("mark");
  const [reportTab, setReportTab] = useState("report");

  // ── Mark tab state ──
  const [selSite, setSelSite] = useState(sites[0]?.id || 0);
  const [selWork, setSelWork] = useState("");
  const [selDate, setSelDate] = useState(today);
  const [unmarkConfirm, setUnmarkConfirm] = useState(null);

  // ── Report tab state ──
  const [repSite, setRepSite] = useState(sites[0]?.id || 0);
  const [repWork, setRepWork] = useState("");
  const [saveReportModal, setSaveReportModal] = useState(false);
  const [reportDelModal, setReportDelModal] = useState(null);
  const [viewReportId, setViewReportId] = useState(null);

  // ── Mark tab derived ──
  const markWorks = (sites.find((s: any) => s.id === selSite)?.works || []);
  const markWorkObj = markWorks.find((w: any) => w.id === selWork);
  const minDate = markWorkObj?.fromDate || "";
  const maxDate = markWorkObj?.toDate || today;
  const sa = assignments[selSite] || {};
  const aids = Object.keys(sa).map(Number);

  const getKey = (date: string, siteId: any, workId: any, workerId: any) =>
    `${date}_${siteId}_${workId}_${workerId}`;
  const getStatus = (wid: any) =>
    attendance[getKey(selDate, selSite, selWork, wid)] || null;
  const mark = (wid: any, status: any) =>
    setAttendance((p: any) => {
      const key = getKey(selDate, selSite, selWork, wid);
      if (status === null) { const n = { ...p }; delete n[key]; return n; }
      return { ...p, [key]: status };
    });

  const present = aids.filter(w => getStatus(w) === "Present").length;
  const absent = aids.filter(w => getStatus(w) === "Absent").length;
  const half = aids.filter(w => getStatus(w) === "Half").length;

  // ── Report tab derived ──
  const repWorks = (sites.find((s: any) => s.id === repSite)?.works || []);
  const repWorkObj = repWorks.find((w: any) => w.id === repWork);
  const repSiteObj = sites.find((s: any) => s.id === repSite);
  const repAssign = assignments[repSite] || {};
  const repWorkers = workers.filter((w: any) => repAssign[w.id]);
  const linkedInv = repWork
    ? invoices.find((inv: any) => (inv.works || []).some((w: any) => w.id === repWork))
    : null;

  const monthGroups = repWorkObj
    ? buildMonthGroups(repWorkObj.fromDate, repWorkObj.toDate)
    : {};

  const getRepAtt = (date: string, wid: any) =>
    attendance[getKey(date, repSite, repWork, wid)] || "";
  const getMonthTotal = (dates: string[], wid: any) =>
    dates.reduce((a, d) => {
      const v = getRepAtt(d, wid);
      return v === "Present" ? a + 1 : v === "Half" ? a + 0.5 : a;
    }, 0);
  const getGrandTotal = (wid: any) =>
    Object.values(monthGroups).flat().reduce((a, d) => {
      const v = getRepAtt(d, wid);
      return v === "Present" ? a + 1 : v === "Half" ? a + 0.5 : a;
    }, 0);

  const fmtMK = (mk: string) => {
    const [y, m] = mk.split("-");
    return `${MONTHS[parseInt(m) - 1]} ${y}`;
  };

  // ── History rows: all invoiced works, newest first ──
  const historyRows = [...invoices]
    .sort((a: any, b: any) =>
      b.number.localeCompare(a.number, undefined, { numeric: true })
    )
    .flatMap((inv: any) =>
      (inv.works || []).map((w: any) => ({
        invoiceNumber: inv.number,
        invoiceId: inv.id,
        siteName: inv.siteName || "—",
        workName: w.place,
        workId: w.id,
      }))
    );

  // ── Open print overlay ──
  const openPrintOverlay = (html: string, filename: string) => {
    const existing = document.getElementById("print-overlay");
    if (existing) document.body.removeChild(existing);
    const overlay = document.createElement("div");
    overlay.id = "print-overlay";
    overlay.style.cssText =
      "position:fixed;top:0;left:0;width:100%;height:100%;background:#f0f4f9;z-index:99999;display:flex;flex-direction:column;font-family:'Segoe UI',sans-serif;";
    const bar = document.createElement("div");
    bar.style.cssText =
      "display:flex;align-items:center;justify-content:space-between;padding:12px 20px;background:#0f3172;flex-shrink:0;gap:10px;";
    const backBtn = document.createElement("button");
    backBtn.innerText = "← Back";
    backBtn.style.cssText =
      "background:rgba(255,255,255,0.15);color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;";
    backBtn.onclick = () => document.body.removeChild(overlay);
    const dlBtn = document.createElement("button");
    dlBtn.innerText = "⬇️ Download & Print";
    dlBtn.style.cssText =
      "background:#f59e0b;color:#1a1a1a;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:800;cursor:pointer;";
    dlBtn.onclick = () => {
      const a = document.createElement("a");
      a.href = "data:text/html;charset=utf-8," + encodeURIComponent(html);
      a.download = `${filename}.html`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    bar.appendChild(backBtn);
    bar.appendChild(dlBtn);
    const iframe: any = document.createElement("iframe");
    iframe.style.cssText = "flex:1;width:100%;border:none;";
    overlay.appendChild(bar);
    overlay.appendChild(iframe);
    document.body.appendChild(overlay);
    iframe.contentDocument.open();
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
  };

  // ── Generate report HTML (shared by live print + saved print) ──
  const buildReportHTML = ({
    invoiceNumber, client, siteName, nameOfWork, place, fromDate, toDate, monthRows, wkrs, isLive,
  }: any) => {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Attendance Report</title>
    <style>@page{size:A4 landscape;margin:8mm;}body{font-family:'Segoe UI',sans-serif;color:#1a2b4a;background:#fff;padding:8mm;margin:0;font-size:11px;}
    table{border-collapse:collapse;width:100%;}th,td{padding:5px 6px;font-size:10px;}
    h3{font-size:12px;color:#0f3172;margin:10px 0 5px;border-bottom:1px solid #0f3172;padding-bottom:3px;}</style>
    </head><body onload="window.print();">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;padding-bottom:10px;border-bottom:2px solid #0f3172;">
      <div><div style="font-size:18px;font-weight:800;color:#0f3172;">VinoDhan Coating</div>
      <div style="font-size:14px;font-weight:700;color:#0f3172;">ATTENDANCE REPORT</div></div>
      <div style="background:#dbeafe;color:#1e40af;border:1.5px solid #bfdbfe;border-radius:8px;padding:5px 12px;font-weight:700;font-size:13px;">${invoiceNumber}</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px 16px;margin-bottom:12px;font-size:11px;">
      <div><b>Client:</b> ${client}</div><div><b>Site:</b> ${siteName}</div>
      <div style="grid-column:1/-1"><b>Name of Work:</b> ${(nameOfWork as string[]).join(" &nbsp;|&nbsp; ")}</div>
      <div><b>Place:</b> ${place}</div>
      <div><b>Duration:</b> ${fmtDate(fromDate)} to ${fmtDate(toDate)}</div>
    </div>
    ${(monthRows as [string, string[]][]).map(([mk, dates]) => {
      const [y, m] = mk.split("-");
      const mLabel = `${MONTHS[parseInt(m) - 1]} ${y}`;
      return `<h3>${mLabel}</h3>
      <table><thead><tr style="background:#0f3172;color:#fff;">
        <th style="text-align:left;min-width:120px;padding:6px 8px;">Worker</th>
        ${dates.map((d: string) => `<th style="text-align:center;min-width:20px;">${parseInt(d.split("-")[2])}</th>`).join("")}
        <th style="text-align:center;border-left:2px solid #f59e0b;color:#f59e0b;min-width:40px;">Total</th>
      </tr></thead><tbody>
      ${wkrs.map((w: any, i: number) => {
        const getV = isLive
          ? (d: string) => attendance[getKey(d, repSite, repWork, w.id)] || ""
          : (d: string) => (w.attendance.find((a: any) => a.date === d)?.val || "");
        const mTotal = dates.reduce((a: number, d: string) => {
          const v = getV(d);
          return v === "Present" ? a + 1 : v === "Half" ? a + 0.5 : a;
        }, 0);
        return `<tr style="background:${i % 2 === 0 ? "#fff" : "#f8faff"};border-bottom:1px solid #f0f4f9;">
          <td style="font-weight:600;padding:6px 8px;">${w.name}</td>
          ${dates.map((d: string) => {
          const v = getV(d);
          const bg = v === "Present" ? "#dcfce7" : v === "Half" ? "#fef9c3" : v === "Absent" ? "#fee2e2" : "transparent";
          const col = v === "Present" ? "#166534" : v === "Half" ? "#d97706" : v === "Absent" ? "#991b1b" : "#d1d5db";
          return `<td style="text-align:center;background:${bg};color:${col};font-weight:600;">${v === "Present" ? "P" : v === "Half" ? "H" : v === "Absent" ? "A" : ""}</td>`;
        }).join("")}
          <td style="text-align:center;font-weight:800;color:#1e50a0;border-left:2px solid #bfdbfe;">${mTotal}</td>
        </tr>`;
      }).join("")}
      </tbody></table>`;
    }).join("")}
    </body></html>`;
  };

  const printLive = () => {
    if (!repWorkObj) return;
    const html = buildReportHTML({
      invoiceNumber: linkedInv?.number || "—",
      client: linkedInv?.snapshot?.client?.name || repSiteObj?.client || "—",
      siteName: repSiteObj?.name || "—",
      nameOfWork: (linkedInv?.works || [repWorkObj]).map((w: any) => w.place),
      place: linkedInv?.sitePlace || "—",
      fromDate: repWorkObj.fromDate,
      toDate: repWorkObj.toDate || today,
      monthRows: Object.entries(monthGroups),
      wkrs: repWorkers,
      isLive: true,
    });
    openPrintOverlay(html, `Attendance-${linkedInv?.number || repWorkObj.place}`);
  };

  const printSaved = (r: any) => {
    const groups = buildMonthGroups(r.fromDate, r.toDate);
    const html = buildReportHTML({
      invoiceNumber: r.invoiceNumber,
      client: r.client,
      siteName: r.siteName,
      nameOfWork: r.nameOfWork || [r.workName],
      place: r.place,
      fromDate: r.fromDate,
      toDate: r.toDate,
      monthRows: Object.entries(groups),
      wkrs: r.workers,
      isLive: false,
    });
    openPrintOverlay(html, `Attendance-${r.invoiceNumber}`);
  };

  // ── Save report ──
  const doSave = () => {
    if (!repWorkObj) return;
    const allDates = Object.values(monthGroups).flat();
    const report = {
      id: Date.now(),
      siteId: repSite,
      siteName: repSiteObj?.name || "—",
      workId: repWork,
      workName: repWorkObj.place,
      invoiceId: linkedInv?.id || null,
      invoiceNumber: linkedInv?.number || "—",
      client: linkedInv?.snapshot?.client?.name || repSiteObj?.client || "—",
      place: linkedInv?.sitePlace || "—",
      nameOfWork: (linkedInv?.works || [repWorkObj]).map((w: any) => w.place),
      fromDate: repWorkObj.fromDate,
      toDate: repWorkObj.toDate || today,
      savedAt: today,
      workers: repWorkers.map((w: any) => ({
        id: w.id,
        name: w.name,
        category: repAssign[w.id] || w.category,
        attendance: allDates.map(date => ({ date, val: getRepAtt(date, w.id) })),
      })),
    };
    setSavedReports((p: any) => [...p, report]);
    setSaveReportModal(false);
  };

  // ── Soft delete ──
  const softDelete = (id: any) => {
    const r = savedReports.find((x: any) => x.id === id);
    if (r) {
      setRecycleBin((p: any) => ({
        ...p,
        attendanceReports: [...(p.attendanceReports || []), r],
      }));
      setSavedReports((p: any) => p.filter((x: any) => x.id !== id));
    }
    setReportDelModal(null);
  };

  const viewReport = viewReportId
    ? savedReports.find((r: any) => r.id === viewReportId)
    : null;

  // ── Shared month table renderer (for live preview + saved view) ──
  const MonthTable = ({ dates, workers: wks, getAtt }: any) => (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
        <thead>
          <tr style={{ background: "#0f3172", color: "#fff" }}>
            <th style={{ padding: "7px 10px", textAlign: "left", fontWeight: 600, minWidth: "130px" }}>Worker</th>
            {dates.map((d: string) => (
              <th key={d} style={{ padding: "5px 3px", textAlign: "center", fontWeight: 600, minWidth: "22px" }}>
                {parseInt(d.split("-")[2])}
              </th>
            ))}
            <th style={{ padding: "7px 10px", textAlign: "center", fontWeight: 600, borderLeft: "2px solid #f59e0b", color: "#f59e0b", minWidth: "50px" }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {wks.map((w: any, idx: number) => {
            const mTotal = dates.reduce((a: number, d: string) => {
              const v = getAtt(d, w.id ?? w);
              return v === "Present" ? a + 1 : v === "Half" ? a + 0.5 : a;
            }, 0);
            return (
              <tr key={w.id ?? idx} style={{ background: idx % 2 === 0 ? "#fff" : "#f8faff", borderBottom: "1px solid #f0f4f9" }}>
                <td style={{ padding: "7px 10px", fontWeight: 600 }}>{w.name}</td>
                {dates.map((d: string) => {
                  const v = getAtt(d, w.id ?? w);
                  const bg = v === "Present" ? "#dcfce7" : v === "Half" ? "#fef9c3" : v === "Absent" ? "#fee2e2" : "transparent";
                  const col = v === "Present" ? "#166534" : v === "Half" ? "#d97706" : v === "Absent" ? "#991b1b" : "#d1d5db";
                  return (
                    <td key={d} style={{ padding: "4px 2px", textAlign: "center", background: bg, color: col, fontWeight: 600 }}>
                      {v === "Present" ? "P" : v === "Half" ? "H" : v === "Absent" ? "A" : ""}
                    </td>
                  );
                })}
                <td style={{ padding: "7px 10px", textAlign: "center", fontWeight: 800, color: "#1e50a0", borderLeft: "2px solid #bfdbfe" }}>{mTotal}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  // ── Shared report header ──
  const ReportHeader = ({ invoiceNumber, client, siteName, nameOfWork, place, fromDate, toDate }: any) => (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", paddingBottom: "14px", borderBottom: "2px solid #0f3172" }}>
        <div>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f3172" }}>VinoDhan Coating</div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f3172", marginTop: "2px" }}>ATTENDANCE REPORT</div>
        </div>
        {invoiceNumber && invoiceNumber !== "—" && (
          <div style={{ textAlign: "right" }}>
            <div style={{ background: "#dbeafe", color: "#1e40af", border: "1.5px solid #bfdbfe", borderRadius: "8px", padding: "6px 14px", fontWeight: 700, fontSize: "14px" }}>{invoiceNumber}</div>
            <div style={{ fontSize: "10px", color: "#6b84a3", marginTop: "4px" }}>Invoice reference</div>
          </div>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 20px", marginBottom: "16px", fontSize: "13px" }}>
        {[["Client", client], ["Site Name", siteName], ["Name of Work", (nameOfWork as string[]).join(" | ")], ["Place", place], ["Duration", `${fmtDate(fromDate)} to ${fmtDate(toDate)}`]].map(([lbl, val]) => (
          <div key={lbl} style={{ display: "flex", gap: "8px", padding: "4px 0", borderBottom: "1px solid #f0f4f9" }}>
            <span style={{ fontWeight: 600, color: "#6b84a3", minWidth: "100px", fontSize: "12px" }}>{lbl}</span>
            <span style={{ color: "#1a2b4a" }}>: {val}</span>
          </div>
        ))}
      </div>
    </>
  );

  // ═══════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════
  return (
    <div>
      <h2 style={{ margin: "0 0 16px", fontSize: "20px", fontWeight: 800 }}>✅ Attendance</h2>

      {/* Main tabs */}
      <div style={{ display: "flex", gap: "7px", marginBottom: "16px" }}>
        {[["mark", "📝 Mark"], ["report", "📊 Report"]].map(([t, lbl]) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ ...S.btn(tab === t ? "#1e50a0" : "#e5e7eb", tab === t ? "#fff" : "#374151"), flexShrink: 0 }}>{lbl}</button>
        ))}
      </div>

  {/* ════════════════ MARK TAB ════════════════ */ }
  {
    tab === "mark" && <>
      <div style={{ display: "flex", gap: "12px", marginBottom: "12px", flexWrap: "wrap", boxSizing: "border-box" }}>
        <div style={{ flex: 1, minWidth: "140px" }}>
          <label style={S.lbl}>Site</label>
          <select value={selSite} onChange={e => { setSelSite(Number(e.target.value)); setSelWork(""); }} style={S.inp}>
            {sites.map((st: any) => <option key={st.id} value={st.id}>{st.name}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: "140px" }}>
          <label style={S.lbl}>Work</label>
          <select value={selWork} onChange={e => setSelWork(e.target.value)} style={S.inp}>
            <option value="">— Select Work —</option>
            {markWorks.map((w: any) => <option key={w.id} value={w.id}>{w.place}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: "140px" }}>
          <label style={S.lbl}>Date</label>
          <input type="date" value={selDate} min={minDate} max={maxDate}
            onChange={e => setSelDate(e.target.value)} style={S.inp} disabled={!selWork} />
              </div>
            </div>

    {
      markWorkObj && (
        <div style={{ fontSize: "11px", color: "#6b84a3", marginBottom: "12px", padding: "6px 10px", background: "#f0f6ff", borderRadius: "7px" }}>
          📅 Work period: <strong>{fmtDate(markWorkObj.fromDate)}</strong> → <strong>{markWorkObj.toDate ? fmtDate(markWorkObj.toDate) : "Ongoing"}</strong>
        </div>
      )
    }

    {
      !selWork ? (
        <div style={{ ...S.card, textAlign: "center", color: "#9db3cc", padding: "32px" }}>Select a site and work to mark attendance.</div>
      ) : <>
        <div style={{ ...S.card, marginBottom: "16px", display: "flex", gap: "18px", flexWrap: "wrap" }}>
          {[["Present", present, "#166534"], ["Half", half, "#d97706"], ["Absent", absent, "#991b1b"], ["Unmarked", aids.length - present - absent - half, "#6b84a3"], ["Total", aids.length, "#1e50a0"]].map(([lbl, val, color]) => (
            <div key={lbl}><span style={{ fontSize: "19px", fontWeight: 800, color }}>{val}</span><div style={{ fontSize: "10px", color: "#6b84a3" }}>{lbl}</div></div>
          ))}
        </div>
        {aids.length === 0 ? (
          <div style={{ ...S.card, textAlign: "center", color: "#9db3cc", padding: "32px" }}>No workers assigned to this site.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "10px" }}>
            {aids.map((wid: any) => {
              const w = workers.find((x: any) => x.id === wid); if (!w) return null;
              const desig = sa[wid] || w.category; const status = getStatus(wid);
              return (
                <div key={wid} style={{ ...S.card, padding: "13px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                    {w.photo
                      ? <img src={w.photo} style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }} />
                      : <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: CAT_COLOR[w.category].bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: CAT_COLOR[w.category].color }}>{w.name[0]}</div>}
                    <div><div style={{ fontWeight: 600, fontSize: "13px" }}>{w.name}</div><span style={S.badge(desig)}>{desig}</span></div>
                  </div>
                  <div style={{ display: "flex", gap: "5px" }}>
                    {[["Present", "✓ P", "#166534"], ["Half", "½ H", "#d97706"], ["Absent", "✗ A", "#991b1b"]].map(([st, lbl, ac]) => (
                      <button key={st} onClick={() => { if (status === st) setUnmarkConfirm({ wid, st }); else mark(wid, st); }}
                        style={{ flex: 1, padding: "6px 4px", borderRadius: "6px", border: "none", fontSize: "11px", fontWeight: 600, cursor: "pointer", background: status === st ? ac : "#e5e7eb", color: status === st ? "#fff" : "#6b7280" }}>{lbl}</button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </>
    }
      </>}

  {/* ════════════════ REPORT TAB ════════════════ */ }
  {
    tab === "report" && <>
      <div style={{ display: "flex", gap: "7px", marginBottom: "16px" }}>
        {[["report", "📋 Report"], ["history", "📁 History"]].map(([t, lbl]) => (
          <button key={t} onClick={() => setReportTab(t)}
            style={{ ...S.btn(reportTab === t ? "#0f3172" : "#e5e7eb", reportTab === t ? "#fff" : "#374151"), flexShrink: 0 }}>{lbl}</button>
        ))}
      </div>

      {/* ── Report sub-tab ── */}
      {reportTab === "report" && <>
        <div style={{ ...S.card, marginBottom: "16px" }}>
          <h3 style={{ margin: "0 0 14px", fontSize: "14px", fontWeight: 700 }}>Report Settings</h3>
          <div style={{ display: "flex", gap: "12px", marginBottom: "12px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "140px" }}>
              <label style={S.lbl}>Site</label>
              <select value={repSite} onChange={e => { setRepSite(Number(e.target.value)); setRepWork(""); }} style={S.inp}>
                {sites.map((st: any) => <option key={st.id} value={st.id}>{st.name}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: "140px" }}>
              <label style={S.lbl}>Work</label>
              <select value={repWork} onChange={e => setRepWork(e.target.value)} style={S.inp}>
                <option value="">— Select Work —</option>
                {repWorks.map((w: any) => <option key={w.id} value={w.id}>{w.place}</option>)}
              </select>
            </div>
          </div>

          {repWork && repWorkObj && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "14px", padding: "12px", background: "#f0f6ff", borderRadius: "9px", fontSize: "12px" }}>
              {[["Site Name", repSiteObj?.name || "—"], ["Client", linkedInv?.snapshot?.client?.name || repSiteObj?.client || "—"], ["Place", linkedInv?.sitePlace || "—"], ["Invoice #", linkedInv?.number || "No invoice linked"], ["Duration", `${fmtDate(repWorkObj.fromDate)} → ${repWorkObj.toDate ? fmtDate(repWorkObj.toDate) : "Ongoing"}`]].map(([lbl, val]) => (
                <div key={lbl}><span style={{ color: "#6b84a3", fontWeight: 600, fontSize: "11px" }}>{lbl}: </span><span style={{ color: "#1e50a0", fontWeight: 600 }}>{val}</span></div>
              ))}
              <div style={{ gridColumn: "1/-1" }}>
                <span style={{ color: "#6b84a3", fontWeight: 600, fontSize: "11px" }}>Name of Work: </span>
                {(linkedInv?.works || [repWorkObj]).map((w: any, i: number) => (
                  <div key={i} style={{ color: "#1e50a0", fontWeight: 600, paddingLeft: "98px" }}>{w.place}</div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "9px" }}>
            <button onClick={printLive} disabled={!repWork || repWorkers.length === 0}
              style={{ ...S.btn(), opacity: (!repWork || repWorkers.length === 0) ? 0.5 : 1 }}>🖨️ Print / PDF</button>
            <button onClick={() => setSaveReportModal(true)} disabled={!repWork || repWorkers.length === 0}
              style={{ ...S.btn("#166534"), opacity: (!repWork || repWorkers.length === 0) ? 0.5 : 1 }}>💾 Save Report</button>
                  </div>
                </div>

          { repWork && repWorkObj ? (
                  <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", boxShadow: "0 2px 16px rgba(30,80,160,0.08)", overflowX: "auto" }}>
                    <ReportHeader
                      invoiceNumber={linkedInv?.number}
                      client={linkedInv?.snapshot?.client?.name || repSiteObj?.client || "—"}
                      siteName={repSiteObj?.name || "—"}
                      nameOfWork={(linkedInv?.works || [repWorkObj]).map((w: any) => w.place)}
                      place={linkedInv?.sitePlace || "—"}
                      fromDate={repWorkObj.fromDate}
                      toDate={repWorkObj.toDate || today}
                    />
                    {Object.entries(monthGroups).map(([mk, dates]) => (
                      <div key={mk} style={{ marginBottom: "20px" }}>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f3172", marginBottom: "8px", padding: "5px 0", borderBottom: "1px solid #0f3172" }}>{fmtMK(mk)}</div>
                        <MonthTable dates={dates} workers={repWorkers} getAtt={(d: string, wid: any) => getRepAtt(d, wid)} />
                      </div>
                    ))}
                    {Object.keys(monthGroups).length > 1 && (
                      <div style={{ background: "#f0f6ff", borderRadius: "9px", padding: "12px 14px", marginTop: "4px" }}>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "#0f3172", marginBottom: "8px" }}>Grand Total (All Months)</div>
                        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                          {repWorkers.map((w: any) => (
                            <div key={w.id} style={{ fontSize: "12px" }}>
                              <span style={{ color: "#6b84a3" }}>{w.name}: </span>
                              <span style={{ fontWeight: 800, color: "#1e50a0" }}>{getGrandTotal(w.id)} days</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div style={{ display: "flex", gap: "16px", marginTop: "14px", fontSize: "11px" }}>
                      {[["P", "Present", "#dcfce7", "#166534"], ["H", "Half Day", "#fef9c3", "#d97706"], ["A", "Absent", "#fee2e2", "#991b1b"]].map(([sym, lbl, bg, col]) => (
                        <div key={sym} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <span style={{ background: bg, color: col, fontWeight: 700, padding: "2px 6px", borderRadius: "4px", fontSize: "10px" }}>{sym}</span>
                          <span style={{ color: "#6b84a3" }}>{lbl}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ ...S.card, textAlign: "center", color: "#9db3cc", padding: "40px" }}>
                    <div style={{ fontSize: "28px", marginBottom: "10px" }}>📊</div>
                    Select a site and work to generate the report.
                  </div>
                )}
            </>}

            {/* ── History sub-tab ── */}
            {reportTab === "history" && (
              viewReportId && viewReport ? (
                <div>
                  <div style={{ display: "flex", gap: "9px", marginBottom: "16px", alignItems: "center" }}>
                    <button onClick={() => setViewReportId(null)} style={S.btn("#f0f4f9", "#1a2b4a")}>← Back</button>
                    <button onClick={() => printSaved(viewReport)} style={S.btn()}>🖨️ Print / PDF</button>
                    <span style={{ background: "#dbeafe", color: "#1e40af", borderRadius: "6px", padding: "4px 10px", fontWeight: 700, fontSize: "12px", marginLeft: "auto" }}>{viewReport.invoiceNumber}</span>
                  </div>
                  <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", boxShadow: "0 2px 16px rgba(30,80,160,0.08)", overflowX: "auto" }}>
                    <ReportHeader
                      invoiceNumber={viewReport.invoiceNumber}
                      client={viewReport.client}
                      siteName={viewReport.siteName}
                      nameOfWork={viewReport.nameOfWork || [viewReport.workName]}
                      place={viewReport.place}
                      fromDate={viewReport.fromDate}
                      toDate={viewReport.toDate}
                    />
                    {Object.entries(buildMonthGroups(viewReport.fromDate, viewReport.toDate)).map(([mk, dates]) => {
                      const [y, m] = mk.split("-");
                      return (
                        <div key={mk} style={{ marginBottom: "20px" }}>
                          <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f3172", marginBottom: "8px", padding: "5px 0", borderBottom: "1px solid #0f3172" }}>{MONTHS[parseInt(m) - 1]} {y}</div>
                          <MonthTable
                            dates={dates}
                            workers={viewReport.workers}
                            getAtt={(d: string, wid: any) => {
                              const wk = viewReport.workers.find((x: any) => x.id === wid);
                              return wk?.attendance.find((a: any) => a.date === d)?.val || "";
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={S.card}>
                  <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 700 }}>📁 Attendance History</h3>
                  <div style={{ fontSize: "11px", color: "#6b84a3", marginBottom: "10px" }}>All invoiced works — newest first</div>
                  <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 1fr 110px 100px", gap: "8px", padding: "6px 10px", background: "#f0f4f9", borderRadius: "7px", marginBottom: "6px", fontSize: "11px", fontWeight: 700, color: "#6b84a3" }}>
                    <span>#</span><span>Site</span><span>Work</span><span>Invoice</span><span>Status</span>
                  </div>
                  {historyRows.length === 0 ? (
                    <div style={{ textAlign: "center", color: "#9db3cc", padding: "30px" }}>No invoiced works yet.</div>
                  ) : historyRows.map((row: any, idx: number) => {
                    const saved = savedReports.find((r: any) => r.workId === row.workId);
                    return (
                      <div key={`${row.workId}-${idx}`} style={{ display: "grid", gridTemplateColumns: "32px 1fr 1fr 110px 100px", gap: "8px", padding: "8px 10px", borderRadius: "8px", background: saved ? "#f0fdf4" : "#f8faff", border: `0.5px solid ${saved ? "#bbf7d0" : "transparent"}`, marginBottom: "5px", alignItems: "center", fontSize: "12px" }}>
                        <span style={{ color: "#6b84a3", fontWeight: 600 }}>{idx + 1}</span>
                        <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={row.siteName}>{row.siteName}</span>
                        <span style={{ color: "#6b84a3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={row.workName}>{row.workName}</span>
                        <span style={{ background: "#dbeafe", color: "#1e40af", borderRadius: "6px", padding: "2px 7px", fontWeight: 700, fontSize: "11px", display: "inline-block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.invoiceNumber}</span>
                        {saved ? (
                          <div style={{ display: "flex", gap: "4px" }}>
                            <button onClick={() => setViewReportId(saved.id)} style={{ ...S.btn(), padding: "4px 8px", fontSize: "11px" }}>🖨️</button>
                            <button onClick={() => setReportDelModal(saved.id)} style={{ ...S.btn("#fee2e2", "#991b1b"), padding: "4px 8px", fontSize: "11px" }}>🗑️</button>
                          </div>
                        ) : (
                          <span style={{ background: "#f0f4f9", color: "#9db3cc", borderRadius: "6px", padding: "3px 7px", fontSize: "10px", fontWeight: 600 }}>Not available</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </>}

          {/* ════════ MODALS ════════ */}
          {saveReportModal && <PwModal title="Save Attendance Report?" onConfirm={doSave} onCancel={() => setSaveReportModal(false)} />}
          {reportDelModal && <PwModal title="Delete Report?" onConfirm={() => softDelete(reportDelModal)} onCancel={() => setReportDelModal(null)} />}

          {unmarkConfirm && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000 }}>
              <div style={{ background: "#fff", borderRadius: "16px", padding: "28px", width: "300px", textAlign: "center" }}>
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>⚠️</div>
                <h3 style={{ margin: "0 0 7px" }}>Remove Attendance?</h3>
                <p style={{ fontSize: "12px", color: "#6b84a3", margin: "0 0 16px" }}>Remove <strong>{unmarkConfirm.st}</strong> mark?</p>
                <div style={{ display: "flex", gap: "9px", justifyContent: "center" }}>
                  <button onClick={() => { mark(unmarkConfirm.wid, null); setUnmarkConfirm(null); }} style={S.btn("#dc2626")}>Yes, Remove</button>
                  <button onClick={() => setUnmarkConfirm(null)} style={S.btn("#f0f4f9", "#1a2b4a")}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
        );
}
        // ── ENTRY PERMIT ──────────────────────────────────────
        function EntryPermit({workers, sites, assignments, setWorkers, savedPermits, setSavedPermits}) {
  const [siteMode, setSiteMode] = useState("existing");
        const [selSite, setSelSite] = useState(sites[0]?.id || 0);
        const [manualSiteName, setManualSiteName] = useState("");
        const [manualClient, setManualClient] = useState("");
        const [manualPlace, setManualPlace] = useState("");
        const [selectedWorkers, setSelectedWorkers] = useState([]);
        const [fromDate, setFromDate] = useState(today);
        const [toDate, setToDate] = useState(today);
        const [showExecSign, setShowExecSign] = useState(true);
        const [permitPlaceOfWork, setPermitPlaceOfWork] = useState("");
        const [savePermitModal, setSavePermitModal] = useState(false);
        const [permitDelModal, setPermitDelModal] = useState(null);

  const siteObj = sites.find(s => s.id === selSite);
        const permitSiteName = siteMode === "existing" ? (siteObj?.name || "") : manualSiteName;
        const permitClient = siteMode === "existing" ? (siteObj?.client || "") : manualClient;
        const permitPlace = siteMode === "existing" ? "Chennai" : manualPlace;

        const sa = siteMode === "existing" ? (assignments[selSite] || { }) : { };
  const assignedWorkers = siteMode === "existing" ? workers.filter(w => sa[w.id]) : workers;
  const toggleWorker = wid => setSelectedWorkers(p => p.includes(wid) ? p.filter(x => x !== wid) : [...p, wid]);
  const selectAll = () => setSelectedWorkers(assignedWorkers.map((w: any) => w.id));
  const clearAll = () => setSelectedWorkers([]);
  const permitWorkers = workers.filter(w => selectedWorkers.includes(w.id));
  const updateWorkerPhoto = (wid, photo) => setWorkers(p => p.map((w: any) => w.id === wid ? {...w, photo} : w));

        return (
        <div>
          <h2 style={{ margin: "0 0 16px", fontSize: "20px", fontWeight: 800 }}>🪪 Entry Permit</h2>
          <div style={{ ...S.card, marginBottom: "16px" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: "14px", fontWeight: 700 }}>Permit Settings</h3>
            {/* Mode Toggle */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
              <button onClick={() => setSiteMode("existing")} style={{ ...S.btn(siteMode === "existing" ? "#1e50a0" : "#e5e7eb", siteMode === "existing" ? "#fff" : "#374151"), fontSize: "12px", padding: "7px 14px" }}>📋 Existing Site</button>
              <button onClick={() => setSiteMode("manual")} style={{ ...S.btn(siteMode === "manual" ? "#1e50a0" : "#e5e7eb", siteMode === "manual" ? "#fff" : "#374151"), fontSize: "12px", padding: "7px 14px" }}>✏️ Manual Entry</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: "10px", marginBottom: "14px" }}>
              {siteMode === "existing"
                ? <div style={{ gridColumn: "1/-1" }}><label style={S.lbl}>Select Site</label><select value={selSite} onChange={e => { setSelSite(Number(e.target.value)); setSelectedWorkers([]); }} style={S.inp}>{sites.map((st: any) => <option key={st.id} value={st.id}>{st.name}</option>)}</select></div>
                : <><div><label style={S.lbl}>Site Name</label><input value={manualSiteName} onChange={e => setManualSiteName(e.target.value)} placeholder="Enter site name" style={S.inp} /></div>
                  <div><label style={S.lbl}>Client</label><input value={manualClient} onChange={e => setManualClient(e.target.value)} placeholder="Client name" style={S.inp} /></div>
                  <div><label style={S.lbl}>Place</label><input value={manualPlace} onChange={e => setManualPlace(e.target.value)} placeholder="Location" style={S.inp} /></div></>
              }
              {siteMode === "existing" && <>
                <div><label style={S.lbl}>Site Name</label><input value={permitSiteName} readOnly style={{ ...S.inp, background: "#f0f4f9", color: "#6b84a3" }} /></div>
                <div><label style={S.lbl}>Client</label><input value={permitClient} readOnly style={{ ...S.inp, background: "#f0f4f9", color: "#6b84a3" }} /></div>
                <div><label style={S.lbl}>Place</label><input value={permitPlace} readOnly style={{ ...S.inp, background: "#f0f4f9", color: "#6b84a3" }} /></div>
              </>}
              <div><label style={S.lbl}>Valid From</label><input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={S.inp} /></div>
              <div><label style={S.lbl}>Valid To</label><input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={S.inp} /></div>
            </div>
            <div style={{ marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <label style={S.lbl}>Select Workers ({selectedWorkers.length} selected)</label>
                <div style={{ display: "flex", gap: "7px" }}>
                  <button onClick={selectAll} style={{ ...S.btn("#f0f6ff", "#1e50a0"), padding: "5px 10px", fontSize: "11px" }}>Select All</button>
                  <button onClick={clearAll} style={{ ...S.btn("#fee2e2", "#991b1b"), padding: "5px 10px", fontSize: "11px" }}>Clear</button>
                </div>
              </div>
              {assignedWorkers.length === 0 ? <div style={{ color: "#9db3cc", fontSize: "13px", padding: "12px", background: "#f8faff", borderRadius: "8px" }}>No workers assigned to this site.</div>
                : <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {assignedWorkers.map((w: any) => {
                    const sel = selectedWorkers.includes(w.id); const desig = sa[w.id] || w.category;
                    return (
                      <div key={w.id} style={{ borderRadius: "10px", border: sel ? `1.5px solid ${CAT_COLOR[desig].color}` : "1.5px solid #e5e7eb", overflow: "hidden", background: sel ? CAT_COLOR[desig].bg : "#f8faff" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px" }}>
                          <div onClick={() => toggleWorker(w.id)} style={{ width: "22px", height: "22px", borderRadius: "5px", flexShrink: 0, background: sel ? "#1e50a0" : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: "13px", fontWeight: 700 }}>{sel ? "✓" : ""}</div>
                          {w.photo ? <img src={w.photo} style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, color: "#9ca3af", flexShrink: 0 }}>{w.name[0]}</div>}
                          <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: "13px", color: sel ? CAT_COLOR[desig].color : "#1a2b4a" }}>{w.name}</div><span style={S.badge(desig)}>{desig}</span></div>
                          <div onClick={e => e.stopPropagation()}>
                            <label style={{ ...S.btn("#fff", "#1e50a0"), padding: "5px 10px", fontSize: "11px", cursor: "pointer", border: "1.5px solid #bfdbfe", display: "inline-block" }}>
                              📷 {w.photo ? "Change" : "Add"} Photo
                              <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { e.stopPropagation(); const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = ev => updateWorkerPhoto(w.id, ev.target.result); r.readAsDataURL(f); }} />
                            </label>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>}
            </div>
            <div style={{ display: "flex", gap: "9px", flexWrap: "wrap" }}>
              <button onClick={() => printSection("entry-permit")} style={{ ...S.btn(), opacity: selectedWorkers.length === 0 ? 0.5 : 1 }} disabled={selectedWorkers.length === 0}>🖨️ Print Entry Permit ({selectedWorkers.length} workers)</button>
              <button onClick={() => setSavePermitModal(true)} style={{ ...S.btn("#166534"), opacity: selectedWorkers.length === 0 ? 0.5 : 1 }} disabled={selectedWorkers.length === 0}>💾 Save Permit</button>
            </div>
          </div>
          {savePermitModal && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000 }}>
              <div style={{ background: "#fff", borderRadius: "16px", padding: "28px", width: "300px", textAlign: "center" }}>
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>💾</div>
                <h3 style={{ margin: "0 0 7px" }}>Save Entry Permit?</h3>
                <p style={{ fontSize: "12px", color: "#6b84a3", margin: "0 0 16px" }}>
                  Save permit for <strong>{permitSiteName}</strong> with <strong>{permitWorkers.length} workers</strong>
                </p>
                <div style={{ display: "flex", gap: "9px", justifyContent: "center" }}>
                  <button onClick={() => {
                    const permit = {
                      id: Date.now(),
                      siteName: permitSiteName,
                      client: permitClient,
                      place: permitPlaceOfWork,
                      fromDate,
                      toDate,
                      savedAt: today,
                      workers: permitWorkers.map((w: any) => ({
                        id: w.id,
                        name: w.name,
                        category: sa[w.id] || w.category,
                        aadhaar: w.aadhaar || "",
                        phone: w.phone || "",
                        dob: w.dob || "",
                        photo: w.photo || ""
                      }))
                    };
                    setSavedPermits(p => [...p, permit]);
                    setSavePermitModal(false);
                    alert("✅ Permit saved successfully!");
                  }} style={S.btn("#166534")}>💾 Save</button>
                  <button onClick={() => setSavePermitModal(false)} style={S.btn("#f0f4f9", "#1a2b4a")}>Cancel</button>
                </div>
              </div>
            </div>
          )}
          {permitWorkers.length > 0 ? (
            <div id="entry-permit" style={{ background: "#fff", padding: "28px", borderRadius: "12px", boxShadow: "0 2px 16px rgba(30,80,160,0.08)" }}>
              <div style={{ textAlign: "center", marginBottom: "20px", paddingBottom: "14px", borderBottom: "2px solid #0f3172" }}><div style={{ fontSize: "22px", fontWeight: 800, color: "#0f3172", letterSpacing: "2px" }}>ENTRY PERMIT</div></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 30px", marginBottom: "24px", fontSize: "13px" }}>
                <div style={{ display: "flex", gap: "8px", padding: "5px 0", borderBottom: "1px solid #f0f4f9" }}><span style={{ fontWeight: 700, color: "#6b84a3", minWidth: "100px", fontSize: "12px" }}>Site Name</span><span style={{ color: "#1a2b4a", fontWeight: 600 }}>: {permitSiteName}</span></div>
                <div style={{ display: "flex", gap: "8px", padding: "5px 0", borderBottom: "1px solid #f0f4f9" }}><span style={{ fontWeight: 700, color: "#6b84a3", minWidth: "100px", fontSize: "12px" }}>Contractor</span><span style={{ color: "#1a2b4a", fontWeight: 600 }}>: VinoDhan Coating</span></div>
                <div style={{ display: "flex", gap: "8px", padding: "5px 0", borderBottom: "1px solid #f0f4f9", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, color: "#6b84a3", minWidth: "100px", fontSize: "12px" }}>Place of Work</span>
                  <span className="no-print" style={{ flex: 1 }}><input value={permitPlaceOfWork} onChange={e => setPermitPlaceOfWork(e.target.value)} placeholder="Enter place of work" style={{ ...S.inp, padding: "2px 8px", fontSize: "12px", width: "100%" }} /></span>
                  <span className="print-only" style={{ color: "#1a2b4a", fontWeight: 600, display: "none" }}>: {permitPlaceOfWork || "—"}</span>
                </div>
                <div style={{ display: "flex", gap: "8px", padding: "5px 0", borderBottom: "1px solid #f0f4f9" }}><span style={{ fontWeight: 700, color: "#6b84a3", minWidth: "100px", fontSize: "12px" }}>Client</span><span style={{ color: "#1a2b4a", fontWeight: 600 }}>: {permitClient}</span></div>
                <div style={{ display: "flex", gap: "8px", padding: "5px 0", borderBottom: "1px solid #f0f4f9" }}><span style={{ fontWeight: 700, color: "#6b84a3", minWidth: "100px", fontSize: "12px" }}>Valid From</span><span style={{ color: "#1a2b4a", fontWeight: 600 }}>: {fmtDate(fromDate)}</span></div>
                <div style={{ display: "flex", gap: "8px", padding: "5px 0", borderBottom: "1px solid #f0f4f9" }}><span style={{ fontWeight: 700, color: "#6b84a3", minWidth: "100px", fontSize: "12px" }}>Valid To</span><span style={{ color: "#1a2b4a", fontWeight: 600 }}>: {fmtDate(toDate)}</span></div>
              </div>
              <div className="worker-grid">
                {permitWorkers.slice(0, -2).map((w: any) => (
                  <div key={w.id} className="worker-tile" style={{ border: "1.5px solid #e5e7eb", borderRadius: "10px", overflow: "hidden", display: "flex", minHeight: "130px" }}>
                    <div style={{ width: "100px", flexShrink: 0, background: "#f0f4f9", display: "flex", alignItems: "center", justifyContent: "center", borderRight: "1px solid #e5e7eb" }}>
                      {w.photo ? <img src={w.photo} style={{ width: "100px", height: "130px", objectFit: "cover" }} /> : <div style={{ textAlign: "center", padding: "10px" }}><div style={{ fontSize: "32px" }}>👤</div><div style={{ fontSize: "9px", color: "#9db3cc", marginTop: "4px" }}>No Photo</div></div>}
                    </div>
                    <div style={{ flex: 1, padding: "12px 14px", fontSize: "12px" }}>
                      <div style={{ fontWeight: 800, fontSize: "14px", color: "#0f3172", marginBottom: "8px" }}>{w.name}</div>
                      {[["Category", sa[w.id] || w.category], ["Aadhaar", w.aadhaar || "—"], ["Phone", w.phone || "—"], ["DOB", w.dob ? fmtDate(w.dob) : "—"]].map(([lbl, val]) => (
                        <div key={lbl} style={{ display: "flex", gap: "6px", marginBottom: "5px" }}><span style={{ color: "#6b84a3", fontWeight: 600, minWidth: "65px" }}>{lbl}</span><span style={{ color: "#1a2b4a" }}>: {val}</span></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ pageBreakInside: "avoid" }}>
                <div className="worker-grid" style={{ marginBottom: "14px" }}>
                  {permitWorkers.slice(-2).map((w: any) => (
                    <div key={w.id} className="worker-tile" style={{ border: "1.5px solid #e5e7eb", borderRadius: "10px", overflow: "hidden", display: "flex", minHeight: "130px" }}>
                      <div style={{ width: "100px", flexShrink: 0, background: "#f0f4f9", display: "flex", alignItems: "center", justifyContent: "center", borderRight: "1px solid #e5e7eb" }}>
                        {w.photo ? <img src={w.photo} style={{ width: "100px", height: "130px", objectFit: "cover" }} /> : <div style={{ textAlign: "center", padding: "10px" }}><div style={{ fontSize: "32px" }}>👤</div><div style={{ fontSize: "9px", color: "#9db3cc", marginTop: "4px" }}>No Photo</div></div>}
                      </div>
                      <div style={{ flex: 1, padding: "12px 14px", fontSize: "12px" }}>
                        <div style={{ fontWeight: 800, fontSize: "14px", color: "#0f3172", marginBottom: "8px" }}>{w.name}</div>
                        {[["Category", sa[w.id] || w.category], ["Aadhaar", w.aadhaar || "—"], ["Phone", w.phone || "—"], ["DOB", w.dob ? fmtDate(w.dob) : "—"]].map(([lbl, val]) => (
                          <div key={lbl} style={{ display: "flex", gap: "6px", marginBottom: "5px" }}><span style={{ color: "#6b84a3", fontWeight: 600, minWidth: "65px" }}>{lbl}</span><span style={{ color: "#1a2b4a" }}>: {val}</span></div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="sig-section" style={{ marginTop: "40px", display: "flex", justifyContent: "flex-end", alignItems: "flex-end", flexWrap: "wrap", gap: "12px" }}>
                  <div className="no-print" style={{ position: "absolute", bottom: "20mm", left: "15mm" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#6b84a3", cursor: "pointer" }}>
                      <input type="checkbox" checked={showExecSign} onChange={e => setShowExecSign(e.target.checked)} />
                      Show Executive Signature
                    </label>
                  </div>
                  {showExecSign && <div style={{ textAlign: "center", marginLeft: "auto" }}>
                    <div style={{ width: "200px", borderBottom: "1px solid #1a2b4a", marginBottom: "6px", height: "40px" }}></div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#1a2b4a" }}>Vinoth Kumar. N</div>
                    <div style={{ fontSize: "11px", color: "#6b84a3" }}>Site Executive — VinoDhan Coating</div>
                  </div>}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ ...S.card, textAlign: "center", color: "#9db3cc", padding: "40px" }}><div style={{ fontSize: "32px", marginBottom: "10px" }}>🪪</div><div>Select workers above to preview the entry permit</div></div>
          )}

          {/* Saved Permits List */}
          {savedPermits.length > 0 && <div style={{ ...S.card, marginTop: "20px" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 700 }}>📁 Saved Permits</h3>
            {[...savedPermits].sort((a, b) => b.id - a.id).map((p: any) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 13px", background: "#f8faff", borderRadius: "9px", marginBottom: "6px" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "13px" }}>{p.siteName}</div>
                  <div style={{ fontSize: "11px", color: "#6b84a3" }}>{fmtDate(p.fromDate)} → {fmtDate(p.toDate)} — {p.workers.length} workers</div>
                  <div style={{ fontSize: "11px", color: "#6b84a3" }}>Saved {fmtDate(p.savedAt)}</div>
                </div>
                <div style={{ display: "flex", gap: "7px" }}>
                  <button onClick={() => {
                    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Entry Permit</title><style>@page{size:A4;margin:0;}body{font-family:'Segoe UI',sans-serif;color:#1a2b4a;background:#fff;padding:15mm;margin:0;font-size:13px;}table{border-collapse:collapse;width:100%;}</style></head><body onload="window.print();">
          <div style="text-align:center;margin-bottom:20px;padding-bottom:14px;border-bottom:2px solid #0f3172;">
            <div style="font-size:22px;font-weight:800;color:#0f3172;letter-spacing:2px;">ENTRY PERMIT</div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 30px;margin-bottom:24px;font-size:13px;">
            ${[["Site Name", p.siteName], ["Contractor", "VinoDhan Coating"], ["Place of Work", p.place], ["Client", p.client], ["Valid From", fmtDate(p.fromDate)], ["Valid To", fmtDate(p.toDate)]].map(([lbl, val]) => `
              <div style="display:flex;gap:8px;padding:5px 0;border-bottom:1px solid #f0f4f9;">
                <span style="font-weight:700;color:#6b84a3;min-width:100px;font-size:12px;">${lbl}</span>
                <span style="color:#1a2b4a;font-weight:600;">: ${val}</span>
              </div>
            `).join("")}
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
            ${p.workers.map((w: any) => `
              <div style="border:1.5px solid #e5e7eb;border-radius:10px;overflow:hidden;display:flex;min-height:130px;">
                <div style="width:100px;flex-shrink:0;background:#f0f4f9;display:flex;align-items:center;justify-content:center;border-right:1px solid #e5e7eb;">
                  ${w.photo ? `<img src="${w.photo}" style="width:100px;height:130px;object-fit:cover;"/>` : `<div style="text-align:center;padding:10px;"><div style="font-size:32px;">👤</div></div>`}
                </div>
                <div style="flex:1;padding:12px 14px;font-size:12px;">
                  <div style="font-weight:800;font-size:14px;color:#0f3172;margin-bottom:8px;">${w.name}</div>
                  <div style="display:flex;gap:6px;margin-bottom:5px;"><span style="color:#6b84a3;font-weight:600;min-width:65px;">Category</span><span>: ${w.category}</span></div>
                  <div style="display:flex;gap:6px;margin-bottom:5px;"><span style="color:#6b84a3;font-weight:600;min-width:65px;">Aadhaar</span><span>: ${w.aadhaar || "—"}</span></div>
                  <div style="display:flex;gap:6px;margin-bottom:5px;"><span style="color:#6b84a3;font-weight:600;min-width:65px;">Phone</span><span>: ${w.phone || "—"}</span></div>
                  <div style="display:flex;gap:6px;margin-bottom:5px;"><span style="color:#6b84a3;font-weight:600;min-width:65px;">DOB</span><span>: ${w.dob ? fmtDate(w.dob) : "—"}</span></div>
                </div>
              </div>
            `).join("")}
          </div>
          </body></html>`;
                    const existing = document.getElementById("print-overlay");
                    if (existing) document.body.removeChild(existing);
                    const overlay = document.createElement("div");
                    overlay.id = "print-overlay";
                    overlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:#f0f4f9;z-index:99999;display:flex;flex-direction:column;";
                    const bar = document.createElement("div");
                    bar.style.cssText = "display:flex;align-items:center;justify-content:space-between;padding:12px 20px;background:#0f3172;flex-shrink:0;gap:10px;";
                    const backBtn = document.createElement("button");
                    backBtn.innerText = "← Back";
                    backBtn.style.cssText = "background:rgba(255,255,255,0.15);color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;";
                    backBtn.onclick = () => document.body.removeChild(overlay);
                    const dlBtn = document.createElement("button");
                    dlBtn.innerText = "⬇️ Download & Print";
                    dlBtn.style.cssText = "background:#f59e0b;color:#1a1a1a;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:800;cursor:pointer;";
                    dlBtn.onclick = () => {
                      const a = document.createElement("a");
                      a.href = "data:text/html;charset=utf-8," + encodeURIComponent(html);
                      a.download = `Permit-${p.siteName}-${p.savedAt}.html`;
                      a.style.display = "none"; document.body.appendChild(a); a.click(); document.body.removeChild(a);
                    };
                    bar.appendChild(backBtn); bar.appendChild(dlBtn);
                    const iframe = document.createElement("iframe");
                    iframe.style.cssText = "flex:1;width:100%;border:none;";
                    overlay.appendChild(bar); overlay.appendChild(iframe);
                    document.body.appendChild(overlay);
                    iframe.contentDocument.open();
                    iframe.contentDocument.write(html);
                    iframe.contentDocument.close();
                  }} style={{ ...S.btn(), padding: "5px 11px", fontSize: "12px" }}>🖨️ Print</button>
                  <button onClick={() => setPermitDelModal(p.id)} style={{ ...S.btn("#fee2e2", "#991b1b"), padding: "5px 11px", fontSize: "12px" }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>}

          {permitDelModal && <PwModal
            title="Delete Saved Permit?"
            onConfirm={() => { setSavedPermits(p => p.filter(x => x.id !== permitDelModal)); setPermitDelModal(null); }}
            onCancel={() => setPermitDelModal(null)}
          />}
        </div>
        );
}

        // ── INVOICE ───────────────────────────────────────────
        function Invoice({sites, invoices, setInvoices, company, setCompany, client, setClient, bank, setBank, recycleBin, setRecycleBin}) {
  const [selWorks, setSelWorks] = useState([]);
        const [openSites, setOpenSites] = useState([]);
        const [viewInv, setViewInv] = useState(null);
        const [tab, setTab] = useState("new");
        const [invNum, setInvNum] = useState(`INV-${new Date().getFullYear()}-001`);
        const [invDate, setInvDate] = useState(today);
        const [invSiteName, setInvSiteName] = useState("");
        const [invSitePlace, setInvSitePlace] = useState("");
        const [pwModal, setPwModal] = useState(null);
        const [statusModal, setStatusModal] = useState(null);
        const sigCanvas = useRef(null);
        const [sigMode, setSigMode] = useState("none");
        const [sigImage, setSigImage] = useState(null);
        const [sigDrawing, setSigDrawing] = useState(false);
        const lastPt = useRef(null);

  const invoicedWorkIds = new Set(invoices.flatMap(inv => (inv.works || []).map((w: any) => w.id)));

        const allWorks = sites
    .flatMap(s => (s.works || [])
      .filter(w => selWorks.includes(w.id) && !invoicedWorkIds.has(w.id))
      .map((w: any) => ({...w, siteId: s.id, siteName: s.name, amount: calcWork(w) }))
        )
    .sort((a, b) => (a.fromDate || "").localeCompare(b.fromDate || ""));

  const total = allWorks.reduce((a, w) => a + w.amount, 0);
  useEffect(() => {
    if (allWorks.length > 0) {
          setInvSiteName(allWorks[0].siteName || "");
    } else {
          setInvSiteName("");
    }
  }, [allWorks.length]);
  const startDraw = e => {setSigDrawing(true); const r = sigCanvas.current.getBoundingClientRect(); const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left; const y = (e.touches ? e.touches[0].clientY : e.clientY) - r.top; lastPt.current = {x, y}; };
  const draw = e => { if (!sigDrawing || !sigCanvas.current || !lastPt.current) return; e.preventDefault(); const r = sigCanvas.current.getBoundingClientRect(); const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left; const y = (e.touches ? e.touches[0].clientY : e.clientY) - r.top; const ctx = sigCanvas.current.getContext("2d"); ctx.strokeStyle = "#1a2b4a"; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(lastPt.current.x, lastPt.current.y); ctx.lineTo(x, y); ctx.stroke(); lastPt.current = {x, y}; };
  const endDraw = () => {setSigDrawing(false); if (sigCanvas.current) setSigImage(sigCanvas.current.toDataURL()); };
  const clearSig = () => {sigCanvas.current?.getContext("2d")?.clearRect(0, 0, 180, 90); setSigImage(null); };
  const uploadSig = e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = ev => { if (ev.target?.result) setSigImage(ev.target.result); }; r.readAsDataURL(f); };

  const saveInv = () => {
    if (allWorks.length === 0) return;
    setInvoices(p => [...p, {id: Date.now(), number: invNum, date: invDate, total, works: allWorks, siteName: invSiteName, sitePlace: invSitePlace, measureNo: client.measureNo, status: "raised", snapshot: {company: {...company}, client: {...client}, bank: {...bank} } }]);
        setSelWorks([]); setTab("history");
  };

  // Delete invoice → password → recycle bin
  const deleteInv = inv => {
          setPwModal({
            action: () => {
              setRecycleBin(p => ({ ...p, invoices: [...(p.invoices || []), inv] }));
              setInvoices(p => p.filter(i => i.id !== inv.id));
              setPwModal(null);
            }
          });
  };

  const upC = (k, v) => setCompany(p => ({...p, [k]: v }));
  const upCl = (k, v) => setClient(p => ({...p, [k]: v }));
  const upB = (k, v) => setBank(p => ({...p, [k]: v }));
  const fmtD = d => { if (!d) return "—"; const [y, m, dy] = d.split("-"); return `${dy}/${m}/${y}`; };

        const InvDoc = ({inv}) => {
    const works = inv ? inv.works : allWorks;
        const tot = inv ? inv.total : total;
        const num = inv ? inv.number : invNum;
        const dt = inv ? fmtD(inv.date) : fmtD(invDate);
        const editable = !inv;
        const displaySiteName = inv ? inv.siteName : invSiteName;
        const displayMeasureNo = inv ? inv.measureNo : client.measureNo;
        const snap = inv?.snapshot;
        const dispCompany = snap ? snap.company : company;
        const dispClient = snap ? snap.client : client;
        const dispBank = snap ? snap.bank : bank;
        return (
        <div style={{ width: "210mm", maxWidth: "100%", minHeight: "auto", margin: "0 auto", background: "#fff", padding: "20mm", borderRadius: "12px", boxShadow: "0 2px 20px rgba(0,0,0,0.08)", fontSize: "13px", border: "2px solid #0f3172", outline: "4px solid #e8f0fe", outlineOffset: "-8px", boxSizing: "border-box" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", paddingBottom: "16px", borderBottom: "2px solid #0f3172", marginBottom: "16px" }}>
            <div style={{ flex: 1, minWidth: "180px" }}>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f3172", marginBottom: "6px" }}>
                {editable ? <EditField value={company.name} onChange={v => upC("name", v)} style={{ fontSize: "18px", fontWeight: 800, color: "#0f3172" }} /> : dispCompany.name}
              </div>
              <div style={{ fontSize: "11px" }}>
                {[
                  ["Address", editable ? <EditField value={company.address} onChange={v => upC("address", v)} /> : dispCompany.address],
                  ["Ph", editable ? <EditField value={company.phone} onChange={v => upC("phone", v)} /> : dispCompany.phone],
                  ["Udyam", editable ? <EditField value={company.gstin} onChange={v => upC("gstin", v)} /> : dispCompany.gstin],
                ].map(([lbl, val]) => (
                  <div key={lbl} style={{ display: "flex", gap: "4px", alignItems: "flex-start", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 600, color: "#6b84a3", minWidth: "55px", flexShrink: 0 }}>{lbl}</span>
                    <span style={{ color: "#6b84a3", fontWeight: 600, paddingRight: "6px" }}>:</span>
                    <span style={{ flex: 1 }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#0f3172", marginBottom: "8px", alignSelf: "flex-start" }}>INVOICE</div>
              <div style={{ fontSize: "11px" }}>
                {[
                  ["No", editable ? <input value={invNum} onChange={e => setInvNum(e.target.value)} style={{ border: "1.5px solid #bfdbfe", borderRadius: "5px", padding: "2px 6px", fontSize: "11px", outline: "none", width: "120px", color: "#1a2b4a", fontFamily: "inherit" }} /> : num],
                  ["Date", editable ? <input type="date" value={invDate} onChange={e => setInvDate(e.target.value)} style={{ border: "1.5px solid #bfdbfe", borderRadius: "5px", padding: "2px 6px", fontSize: "11px", outline: "none", width: "130px", color: "#1a2b4a", fontFamily: "inherit" }} /> : dt],
                ].map(([lbl, val]) => (
                  <div key={lbl} style={{ display: "flex", gap: "4px", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 600, color: "#6b84a3", minWidth: "35px", flexShrink: 0 }}>{lbl}</span>
                    <span style={{ color: "#6b84a3", fontWeight: 600, paddingRight: "6px" }}>:</span>
                    <span>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bill To + Site Details */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
            <div style={{ padding: "12px 14px", background: "#f0f6ff", borderRadius: "9px", flex: 1, minWidth: "200px" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#6b84a3", marginBottom: "6px" }}>BILL TO</div>
              <div style={{ fontSize: "11px" }}>
                {[
                  ["To", editable ? <EditField value={client.sendTo} onChange={v => upCl("sendTo", v)} placeholder="Recipient" /> : dispClient.sendTo],
                  ["Company", editable ? <EditField value={client.name} onChange={v => upCl("name", v)} style={{ fontWeight: 700 }} /> : <strong>{dispClient.name}</strong>],
                  ...(editable || (dispClient.address) ? [["Address", editable ? <EditField value={client.address || ""} onChange={v => upCl("address", v)} placeholder="Address" /> : dispClient.address]] : []),
                  ["Place", <>{editable ? <EditField value={client.place} onChange={v => upCl("place", v)} /> : dispClient.place}{" — "}{editable ? <EditField value={client.pincode} onChange={v => upCl("pincode", v)} style={{ width: "70px" }} /> : dispClient.pincode}</>],
                  ["Ph", editable ? <EditField value={client.phone} onChange={v => upCl("phone", v)} placeholder="Phone" /> : dispClient.phone],
                ].map(([lbl, val]) => (
                  <div key={lbl} style={{ display: "flex", gap: "4px", alignItems: "flex-start", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 600, color: "#6b84a3", minWidth: "70px", flexShrink: 0 }}>{lbl}</span>
                    <span style={{ color: "#6b84a3", fontWeight: 600, paddingRight: "6px" }}>:</span>
                    <span style={{ flex: 1 }}>{val}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px dashed #bfdbfe", display: "flex", gap: "4px", alignItems: "flex-start" }}>
                <span style={{ fontWeight: 600, color: "#6b84a3", fontSize: "11px", flexShrink: 0 }}>Measurement Job No</span>
                <span style={{ color: "#6b84a3", fontWeight: 600, paddingRight: "6px", fontSize: "11px" }}>:</span>
                <span style={{ flex: 1, fontSize: "11px" }}>{editable ? <EditField value={client.measureNo} onChange={v => upCl("measureNo", v)} placeholder="Sheet no." /> : <strong>{displayMeasureNo || "—"}</strong>}</span>
              </div>
            </div>
            <div style={{ padding: "12px 14px", background: "#f0f6ff", borderRadius: "9px", flex: 1, minWidth: "200px" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#6b84a3", marginBottom: "6px" }}>SITE DETAILS</div>
              <div style={{ fontSize: "11px" }}>
                {[
                  ["Site Name", editable ? <EditField value={invSiteName} onChange={v => setInvSiteName(v)} placeholder="Site name" /> : displaySiteName || "—"],
                  ...(editable || (inv?.sitePlace) ? [["Place", editable ? <EditField value={invSitePlace} onChange={v => setInvSitePlace(v)} placeholder="Site place" /> : inv?.sitePlace || "—"]] : []),
                ].map(([lbl, val]) => (
                  <div key={lbl} style={{ display: "flex", gap: "4px", alignItems: "flex-start", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 600, color: "#6b84a3", minWidth: "70px", flexShrink: 0 }}>{lbl}</span>
                    <span style={{ color: "#6b84a3", fontWeight: 600, paddingRight: "6px" }}>:</span>
                    <span style={{ flex: 1 }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto", marginBottom: "16px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead><tr style={{ background: "#0f3172", color: "#fff" }}>
                {["S.No", "Description", "Unit", "Rate (₹)", "Amount (₹)"].map((h, i) => <th key={h} style={{ padding: "8px 9px", textAlign: i > 1 ? "right" : "left", fontWeight: 600, fontSize: "11px" }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {works.length === 0 && <tr><td colSpan={5} style={{ padding: "16px", textAlign: "center", color: "#9db3cc" }}>No work entries.</td></tr>}
                {works.map((w, i) => {
                  const type = w.workType || "SQM";
                  const unitStr = type === "Manpower" ? `${w.labour} Labour` : type === "RMT" ? `${w.area} rmt` : type === "KGS" ? `${w.area} kgs` : type === "Other" ? "—" : `${w.area} m²`;
                  return (
                    <tr key={w.id || i} style={{ borderBottom: "1px solid #f0f4f9", background: i % 2 === 0 ? "#fff" : "#f8faff" }}>
                      <td style={{ padding: "8px 9px", color: "#6b84a3", textAlign: "center" }}>{i + 1}</td>
                      <td style={{ padding: "8px 9px" }}>{w.place}</td>
                      <td style={{ padding: "8px 9px", textAlign: "right" }}>{unitStr}</td>
                      <td style={{ padding: "8px 9px", textAlign: "right" }}>₹{w.rate}</td>
                      <td style={{ padding: "8px 9px", fontWeight: 700, textAlign: "right" }}>₹{w.amount.toLocaleString()}</td>
                    </tr>
                  );
                })}
                <tr style={{ background: "#0f3172", color: "#fff" }}><td colSpan={4} style={{ padding: "10px 9px", fontWeight: 700, textAlign: "right" }}>TOTAL</td><td style={{ padding: "10px 9px", fontWeight: 800, fontSize: "16px", textAlign: "right", color: "#f59e0b", letterSpacing: "0.5px" }}>₹{tot.toLocaleString()}</td></tr>
              </tbody>
            </table>
          </div>

          {/* Bank + Signature */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "14px", marginTop: "20px" }}>
            <div style={{ padding: "12px 14px", background: "#f8faff", borderRadius: "9px", fontSize: "11px", flex: 1, minWidth: "0", width: "100%", boxSizing: "border-box" }}>
              <div style={{ fontWeight: 700, marginBottom: "6px" }}>Bank Details</div>
              {[
                ["Acc Name", editable ? <EditField value={bank.accName} onChange={v => upB("accName", v)} /> : dispBank.accName],
                ["Bank", editable ? <EditField value={bank.bank} onChange={v => upB("bank", v)} /> : dispBank.bank],
                ["A/C No", editable ? <EditField value={bank.accNo} onChange={v => upB("accNo", v)} /> : dispBank.accNo],
                ["IFSC", editable ? <EditField value={bank.ifsc} onChange={v => upB("ifsc", v)} /> : dispBank.ifsc],
                ["UPI", editable ? <EditField value={bank.upi} onChange={v => upB("upi", v)} /> : dispBank.upi],
              ].map(([lbl, val]) => (
                <div key={lbl} style={{ display: "flex", gap: "4px", alignItems: "flex-start", marginBottom: "4px" }}>
                  <span style={{ fontWeight: 600, color: "#6b84a3", minWidth: "60px", flexShrink: 0 }}>{lbl}</span>
                  <span style={{ color: "#6b84a3", fontWeight: 600, paddingRight: "6px" }}>:</span>
                  <span style={{ flex: 1 }}>{val}</span>
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center" }}>
              {/* Signature box */}
              <div style={{ width: "180px", height: "90px", border: "1.5px dashed #bfdbfe", borderRadius: "8px", marginBottom: "6px", overflow: "hidden", background: "#fafcff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {sigImage ? <img src={sigImage} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  : sigMode === "draw" ? <canvas ref={sigCanvas} width={180} height={90} onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw} onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} style={{ cursor: "crosshair", touchAction: "none", display: "block" }} />
                    : <span className="no-print" style={{ fontSize: "11px", color: "#9db3cc" }}>{sigMode === "physical" ? "Physical Sign" : "Seal / Signature"}</span>}
              </div>
              {/* Signature controls — hidden on print */}
              {editable && <div className="no-print" style={{ display: "flex", gap: "4px", justifyContent: "center", marginBottom: "6px", flexWrap: "wrap" }}>
                <button onClick={() => { setSigMode("draw"); setSigImage(null); setTimeout(() => sigCanvas.current?.getContext("2d")?.clearRect(0, 0, 180, 90), 50); }} style={{ ...S.btn(sigMode === "draw" ? "#1e50a0" : "#f0f6ff", sigMode === "draw" ? "#fff" : "#1e50a0"), padding: "4px 8px", fontSize: "10px" }}>✏️ Draw</button>
                <label style={{ ...S.btn(sigMode === "upload" ? "#1e50a0" : "#f0f6ff", sigMode === "upload" ? "#fff" : "#1e50a0"), padding: "4px 8px", fontSize: "10px", cursor: "pointer" }}>
                  📁 Upload<input type="file" accept="image/*" onChange={e => { setSigMode("upload"); uploadSig(e); }} style={{ display: "none" }} />
                </label>
                <button onClick={() => { setSigMode("physical"); setSigImage(null); clearSig(); }} style={{ ...S.btn(sigMode === "physical" ? "#1e50a0" : "#f0f6ff", sigMode === "physical" ? "#fff" : "#1e50a0"), padding: "4px 8px", fontSize: "10px" }}>🖊️ Physical</button>
                {(sigImage || sigMode === "draw") && <button onClick={() => { clearSig(); setSigMode("none"); }} style={{ ...S.btn("#fee2e2", "#991b1b"), padding: "4px 8px", fontSize: "10px" }}>✗</button>}
              </div>}
              <div style={{ borderTop: "1px solid #1a2b4a", paddingTop: "5px", fontSize: "11px", color: "#6b84a3" }}>Authorised Signatory<br /><strong>{dispCompany.name}</strong></div>
            </div>
          </div>
        </div>
        );
  };

        return (
        <div>
          <h2 style={{ margin: "0 0 16px", fontSize: "20px", fontWeight: 800 }}>🧾 Invoice</h2>
          <div style={{ display: "flex", gap: "7px", marginBottom: "20px" }}>
            {[["new", "➕ New"], ["history", "📁 History"]].map(([t, lbl]) => (
              <button key={t} onClick={() => setTab(t)} style={S.btn(tab === t ? "#1e50a0" : "#e5e7eb", tab === t ? "#fff" : "#374151")}>{lbl}</button>
            ))}
          </div>

          {tab === "new" && <>
            <div style={{ ...S.card, marginBottom: "16px" }}>
              <h3 style={{ margin: "0 0 11px", fontSize: "13px", fontWeight: 700 }}>Invoice Settings</h3>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "12px" }}>
                <div style={{ flex: 1, minWidth: "140px" }}><label style={S.lbl}>Invoice No</label><input value={invNum} onChange={e => setInvNum(e.target.value)} style={S.inp} /></div>
                <div style={{ flex: 1, minWidth: "140px" }}><label style={S.lbl}>Invoice Date</label><input type="date" value={invDate} onChange={e => setInvDate(e.target.value)} style={S.inp} /></div>
              </div>
              <label style={S.lbl}>Select Sites & Works to Invoice</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "6px", marginBottom: "12px" }}>
                {sites.map((s: any) => {
                  const uninvoiced = (s.works || []).filter(w => !invoicedWorkIds.has(w.id));
                  if (uninvoiced.length === 0) return null;
                  const selAll = uninvoiced.every(w => selWorks.includes(w.id));
                  const siteOpen = openSites.includes(s.id);
                  return (
                    <div key={s.id} style={{ border: "1.5px solid #bfdbfe", borderRadius: "10px", overflow: "hidden" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: "#1e50a0" }}>
                        <div onClick={() => { if (selAll) setSelWorks(p => p.filter(id => !uninvoiced.map((w: any) => w.id).includes(id))); else setSelWorks(p => [...new Set([...p, ...uninvoiced.map((w: any) => w.id)])]); }} style={{ width: "20px", height: "20px", borderRadius: "5px", flexShrink: 0, background: selAll ? "#f59e0b" : "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>{selAll ? "✓" : ""}</div>
                        <div onClick={() => setOpenSites(p => siteOpen ? p.filter(x => x !== s.id) : [...p, s.id])} style={{ flex: 1, cursor: "pointer" }}>
                          <div style={{ fontWeight: 700, fontSize: "13px", color: "#fff" }}>{s.name}</div>
                        </div>
                        <span style={{ background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: "10px", fontWeight: 600, borderRadius: "20px", padding: "2px 9px" }}>{uninvoiced.length} work{uninvoiced.length !== 1 ? "s" : ""}</span>
                        <span style={{ background: s.status === "Active" ? "#dcfce7" : "#fee2e2", color: s.status === "Active" ? "#166534" : "#991b1b", fontSize: "10px", fontWeight: 600, borderRadius: "20px", padding: "2px 9px" }}>{s.status}</span>
                        <span onClick={() => setOpenSites(p => siteOpen ? p.filter(x => x !== s.id) : [...p, s.id])} style={{ color: "#fff", fontSize: "12px", cursor: "pointer" }}>{siteOpen ? "▲" : "▼"}</span>
                      </div>
                      {siteOpen && uninvoiced.map((w: any) => {
                        const wsel = selWorks.includes(w.id);
                        return (
                          <div key={w.id} onClick={() => setSelWorks(p => wsel ? p.filter(id => id !== w.id) : [...p, w.id])} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px 8px 20px", background: wsel ? "#eff6ff" : "#fff", borderTop: "1px solid #e5e7eb", cursor: "pointer" }}>
                            <div style={{ width: "16px", height: "16px", borderRadius: "4px", flexShrink: 0, background: wsel ? "#1e50a0" : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "10px", fontWeight: 700 }}>{wsel ? "✓" : ""}</div>
                            <span style={S.wbadge(w.workType || "SQM")}>{w.workType || "SQM"}</span>
                            <div style={{ flex: 1, fontSize: "12px", fontWeight: 500 }}>{w.place}</div>
                            <div style={{ fontSize: "12px", fontWeight: 700, color: "#166534" }}>₹{calcWork(w).toLocaleString()}</div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: "9px" }}>
                <button onClick={() => printSection("invoice-doc")} style={{ ...S.btn(), opacity: allWorks.length === 0 ? 0.5 : 1 }} disabled={allWorks.length === 0}>🖨️ Print / PDF</button>
                <button onClick={saveInv} style={{ ...S.btn("#166534"), opacity: allWorks.length === 0 ? 0.5 : 1 }} disabled={allWorks.length === 0}>💾 Save Invoice</button>
              </div>
            </div>
            <div id="invoice-doc"><InvDoc inv={null} /></div>
          </>}

          {tab === "history" && (viewInv
            ? <><div style={{ display: "flex", gap: "9px", marginBottom: "16px" }}>
              <button onClick={() => setViewInv(null)} style={S.btn("#f0f4f9", "#1a2b4a")}>← Back</button>
              <button onClick={() => printSection("invoice-history-doc")} style={S.btn()}>🖨️ Print</button>
            </div>
              <div id="invoice-history-doc"><InvDoc inv={viewInv} /></div>
            </>
            : <div style={S.card}>
              <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 700 }}>Saved Invoices</h3>
              <div style={{ display: "flex", gap: "16px", marginBottom: "14px", padding: "12px 14px", background: "#f0f6ff", borderRadius: "10px", flexWrap: "wrap" }}>
                <div><span style={{ fontSize: "20px", fontWeight: 800, color: "#0f3172" }}>{invoices.length}</span><div style={{ fontSize: "11px", color: "#6b84a3" }}>Total Invoices</div></div>
                <div><span style={{ fontSize: "20px", fontWeight: 800, color: "#166534" }}>₹{invoices.reduce((a, inv) => a + (inv.total || 0), 0).toLocaleString()}</span><div style={{ fontSize: "11px", color: "#6b84a3" }}>Total Billed</div></div>
              </div>
              {invoices.length === 0 ? <p style={{ color: "#9db3cc", fontSize: "13px" }}>No invoices saved yet.</p>
                : [...invoices].sort((a, b) => b.number.localeCompare(a.number, undefined, { numeric: true })).map((inv, idx) => (
                  <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 13px", background: inv.status === "accepted" ? "#f0fdf4" : "#f8faff", borderRadius: "9px", marginBottom: "6px", border: inv.status === "accepted" ? "1.5px solid #bbf7d0" : "1.5px solid transparent" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "4px" }}>
                        <span style={{ background: "#dbeafe", color: "#1e40af", fontWeight: 700, borderRadius: "6px", padding: "2px 8px", fontSize: "12px" }}>{inv.number}</span>
                        {inv.status === "accepted"
                          ? <span style={{ background: "#dcfce7", color: "#166534", fontWeight: 700, borderRadius: "6px", padding: "2px 8px", fontSize: "10px" }}>🔒 Accepted</span>
                          : <span style={{ background: "#fef9c3", color: "#d97706", fontWeight: 700, borderRadius: "6px", padding: "2px 8px", fontSize: "10px" }}>🟡 Raised</span>
                        }
                        {inv.flagged && <span style={{ color: "#dc2626", fontSize: "11px" }}>⚠️ Incomplete</span>}
                      </div>
                      <div style={{ fontSize: "11px", color: "#6b84a3" }}>{fmtD(inv.date)} — {inv.siteName || "—"}</div>
                      {inv.measureNo && <div style={{ fontSize: "10px", fontWeight: 600, color: "#1e50a0", marginTop: "2px" }}>📋 {inv.measureNo}</div>}
                    </div>
                    <div style={{ display: "flex", gap: "7px", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <div style={{ fontWeight: 700, color: "#166534", fontSize: "13px" }}>₹{inv.total?.toLocaleString()}</div>
                      <button onClick={() => setViewInv(inv)} style={{ ...S.btn(), padding: "5px 11px", fontSize: "12px" }}>View</button>
                      <button onClick={() => setStatusModal(inv)} style={{ ...S.btn(inv.status === "accepted" ? "#fee2e2" : "#166534"), padding: "5px 11px", fontSize: "12px" }}>
                        {inv.status === "accepted" ? "🔓 Unmark" : "🔒 Accept"}
                      </button>
                      {inv.status !== "accepted" && <button onClick={() => deleteInv(inv)} style={{ ...S.btn("#fee2e2", "#991b1b"), padding: "5px 11px", fontSize: "12px" }}>🗑️</button>}
                    </div>
                  </div>
                ))}
            </div>
          )}
          {statusModal && (
            <PwModal
              title={statusModal.status === "accepted" ? "Unmark as Accepted?" : "Mark as Accepted?"}
              onConfirm={() => {
                const newStatus = statusModal.status === "accepted" ? "raised" : "accepted";
                setInvoices(p => p.map((inv: any) => inv.id === statusModal.id ? { ...inv, status: newStatus } : inv));
                setStatusModal(null);
              }}
              onCancel={() => setStatusModal(null)}
            />
          )}

          {/* Password modal for invoice delete */}
          {pwModal && <PwModal
            title="Move to Recycle Bin?"
            onConfirm={pwModal.action}
            onCancel={() => setPwModal(null)}
          />}
        </div>
        );
}
        async function exportLedgerExcel(ledger, rows, totalDebit, totalCredit, closingBalance) {
  // @ts-ignore
  const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs");
        const wb = XLSX.utils.book_new();
        const wsRows = [
        ["VinoDhan Coating — " + ledger.name],
        ["Client: " + ledger.client + (ledger.region ? " — " + ledger.region : "")],
        [],
        ["Date", "Particulars", "Note", "Debit (₹)", "Credit (₹)", "Closing Balance (₹)"],
        ];
  rows.forEach(e => {
          wsRows.push([fmtDate(e.date), e.particulars, e.note || "", e.debit > 0 ? e.debit : "", e.credit > 0 ? e.credit : "", e.balance]);
  });
        wsRows.push([]);
        wsRows.push(["", "", "TOTAL", totalDebit, totalCredit, closingBalance]);
        const ws = XLSX.utils.aoa_to_sheet(wsRows);
        ws["!cols"] = [{wch: 14 }, {wch: 25 }, {wch: 20 }, {wch: 14 }, {wch: 14 }, {wch: 18 }];
        XLSX.utils.book_append_sheet(wb, ws, ledger.name.slice(0, 31));
        XLSX.writeFile(wb, `${ledger.name}-${new Date().toISOString().split("T")[0]}.xlsx`);
}
        // ── LEDGER ────────────────────────────────────────────
        function Ledger({ledgers, setLedgers, invoices}) {
  const [showAdd, setShowAdd] = useState(false);
        const [form, setForm] = useState({name: "", region: "", client: "Swathi Engineering Agency", measurePrefix: "", enableTds: false, tdsRate: 1, enableRetention: false, retentionRate: 5 });
        const [selLedger, setSelLedger] = useState(null);
        const [editLedgerId, setEditLedgerId] = useState(null);
        const [delLedgerModal, setDelLedgerModal] = useState(null);

  const saveLedger = () => {
    if (!form.name.trim()) return;
        if (editLedgerId) {
          setLedgers(p => p.map((l: any) => l.id === editLedgerId ? { ...l, name: form.name, region: form.region, client: form.client, measurePrefix: form.measurePrefix, enableTds: form.enableTds, tdsRate: Number(form.tdsRate), enableRetention: form.enableRetention, retentionRate: Number(form.retentionRate) } : l));
        setEditLedgerId(null);
    } else {
      const nl = {id: Date.now(), name: form.name, region: form.region, client: form.client, measurePrefix: form.measurePrefix, enableTds: form.enableTds, tdsRate: Number(form.tdsRate), enableRetention: form.enableRetention, retentionRate: Number(form.retentionRate), entries: [] };
      setLedgers(p => [...p, nl]);
    }
        setForm({name: "", region: "", client: "Swathi Engineering Agency", measurePrefix: "", enableTds: false, tdsRate: 1, enableRetention: false, retentionRate: 5 });
        setShowAdd(false);
  };

        if (selLedger) {
    const ledger = ledgers.find(l => l.id === selLedger);
        if (!ledger) {setSelLedger(null); return null; }
        return <LedgerDetail ledger={ledger} ledgers={ledgers} setLedgers={setLedgers} invoices={invoices} onBack={() => setSelLedger(null)} />;
  }

        return (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800 }}>📒 Ledger</h2>
            <button onClick={() => { setEditLedgerId(null); setForm({ name: "", region: "", client: "Swathi Engineering Agency", measurePrefix: "", enableTds: false, tdsRate: 1, enableRetention: false, retentionRate: 5 }); setShowAdd(p => !p); }} style={S.btn()}>+ New Ledger</button>
          </div>

          {showAdd && <div style={{ ...S.card, marginBottom: "16px", border: "1.5px solid #bfdbfe" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 700 }}>{editLedgerId ? "Edit Ledger" : "New Ledger"}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
              <div><label style={S.lbl}>Ledger Name</label><input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Karnataka Ledger" style={S.inp} /></div>
              <div><label style={S.lbl}>Region</label><input value={form.region} onChange={e => setForm(p => ({ ...p, region: e.target.value }))} placeholder="e.g. Bengaluru" style={S.inp} /></div>
              <div style={{ gridColumn: "1/-1" }}><label style={S.lbl}>Client</label><input value={form.client} onChange={e => setForm(p => ({ ...p, client: e.target.value }))} style={S.inp} /></div>
              <div style={{ gridColumn: "1/-1" }}><label style={S.lbl}>Measurement Job No Prefix (e.g. SEAK or SEAC)</label><input value={form.measurePrefix} onChange={e => setForm(p => ({ ...p, measurePrefix: e.target.value.toUpperCase() }))} placeholder="e.g. SEAK" style={S.inp} /></div>
              <div>
                <label style={S.lbl}>TDS</label>
                <select value={form.enableTds ? "yes" : "no"} onChange={e => setForm(p => ({ ...p, enableTds: e.target.value === "yes" }))} style={S.inp}>
                  <option value="no">Not Applicable</option>
                  <option value="yes">Applicable</option>
                </select>
              </div>
              {form.enableTds && <div><label style={S.lbl}>TDS Rate (%)</label><input type="number" value={form.tdsRate} onChange={e => setForm(p => ({ ...p, tdsRate: e.target.value }))} style={S.inp} /></div>}
              <div>
                <label style={S.lbl}>Retention</label>
                <select value={form.enableRetention ? "yes" : "no"} onChange={e => setForm(p => ({ ...p, enableRetention: e.target.value === "yes" }))} style={S.inp}>
                  <option value="no">Not Applicable</option>
                  <option value="yes">Applicable</option>
                </select>
              </div>
              {form.enableRetention && <div><label style={S.lbl}>Retention Rate (%)</label><input type="number" value={form.retentionRate} onChange={e => setForm(p => ({ ...p, retentionRate: e.target.value }))} style={S.inp} /></div>}
            </div>
            <div style={{ display: "flex", gap: "9px" }}>
              <button onClick={saveLedger} style={S.btn()}>💾 {editLedgerId ? "Update" : "Save"}</button>
              <button onClick={() => { setShowAdd(false); setEditLedgerId(null); setForm({ name: "", region: "", client: "Swathi Engineering Agency", measurePrefix: "", enableTds: false, tdsRate: 1, enableRetention: false, retentionRate: 5 }); }} style={S.btn("#f0f4f9", "#1a2b4a")}>Cancel</button>
            </div>
          </div>}

          {ledgers.length === 0 ? <div style={{ ...S.card, textAlign: "center", color: "#9db3cc", padding: "40px" }}>
            <div style={{ fontSize: "32px", marginBottom: "10px" }}>📒</div>
            <div>No ledgers yet. Create one to get started.</div>
          </div>
            : <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {ledgers.map((l: any) => (
                <div key={l.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "15px" }}>{l.name}</div>
                    <div style={{ fontSize: "11px", color: "#6b84a3" }}>{l.client} {l.region ? `— ${l.region}` : ""}</div>
                    {l.measurePrefix && <div style={{ fontSize: "11px", fontWeight: 600, color: "#1e50a0", marginTop: "2px" }}>Job Prefix: {l.measurePrefix}</div>}
                    <div style={{ display: "flex", gap: "6px", marginTop: "5px" }}>
                      {l.enableTds && <span style={{ ...WORK_TYPE_COLOR["Manpower"], fontSize: "10px", fontWeight: 600, borderRadius: "20px", padding: "2px 8px" }}>TDS {l.tdsRate}%</span>}
                      {l.enableRetention && <span style={{ ...WORK_TYPE_COLOR["SQM"], fontSize: "10px", fontWeight: 600, borderRadius: "20px", padding: "2px 8px" }}>Retention {l.retentionRate}%</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "7px" }}>
                    <button onClick={() => setSelLedger(l.id)} style={S.btn()}>Open →</button>
                    <button onClick={() => { setForm({ name: l.name, region: l.region, client: l.client, measurePrefix: l.measurePrefix || "", enableTds: l.enableTds, tdsRate: l.tdsRate, enableRetention: l.enableRetention, retentionRate: l.retentionRate }); setEditLedgerId(l.id); setShowAdd(true); }} style={{ ...S.btn("#f0f6ff", "#1e50a0"), padding: "9px 12px" }}>✏️</button>
                    <button onClick={() => setDelLedgerModal(l.id)} style={{ ...S.btn("#fee2e2", "#991b1b"), padding: "9px 12px" }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>}
          {delLedgerModal && <PwModal
            title="Delete Ledger?"
            onConfirm={() => { setLedgers(p => p.filter(l => l.id !== delLedgerModal)); setDelLedgerModal(null); }}
            onCancel={() => setDelLedgerModal(null)}
          />}
        </div>
        );
}

        function LedgerDetail({ledger, ledgers, setLedgers, invoices, onBack}) {
  const [showAdd, setShowAdd] = useState(false);
        const [entryForm, setEntryForm] = useState({date: today, particulars: "Bank Payment", customParticulars: "", debit: "", credit: "", note: "" });
        const [pwModal, setPwModal] = useState(null);
        const [delEntryModal, setDelEntryModal] = useState(null);
        const [editEntryModal, setEditEntryModal] = useState(null);
        const [editPwModal, setEditPwModal] = useState(null);
        const [editRateModal, setEditRateModal] = useState(null);
        const [rateForm, setRateForm] = useState({tdsRate: "", retentionRate: "" });
        const [ratePwModal, setRatePwModal] = useState(false);
        const [showTransfer, setShowTransfer] = useState(false);
        const [transferForm, setTransferForm] = useState({date: today, amount: "", toLedgerId: "", note: "" });
        const PARTICULARS = ["Bank Payment", "Transfer Received", "TDS Deduction", "Retention Deduction", "Other"];

  const updateLedger = updated => {
          setLedgers(p => p.map((l: any) => l.id === ledger.id ? updated : l));
  };

  // Pull invoices not yet added to this ledger
  const linkedInvIds = new Set((ledger.entries || []).filter(e => e.invoiceId).map((e: any) => e.invoiceId));
  const allLinkedInvIds = new Set(ledgers.flatMap(l => (l.entries || []).filter(e => e.invoiceId).map((e: any) => e.invoiceId)));
  const availableInvoices = invoices.filter(inv => {
    if (allLinkedInvIds.has(inv.id)) return false;
        if (ledger.measurePrefix && inv.measureNo && inv.measureNo.trim() !== "") {
      return inv.measureNo.toUpperCase().startsWith(ledger.measurePrefix.toUpperCase());
    }
        if (ledger.measurePrefix && (!inv.measureNo || inv.measureNo.trim() === "")) {
      return true;
    }
        return true;
  }).sort((a, b) => {
    const getOrder = inv => {
      if (!inv.measureNo || inv.measureNo.trim() === "") return 0;
        if (inv.measureNo.toUpperCase().startsWith("SEAC")) return 1;
        if (inv.measureNo.toUpperCase().startsWith("SEAK")) return 2;
        return 0;
    };
        const orderDiff = getOrder(a) - getOrder(b);
        if (orderDiff !== 0) return orderDiff;
        return a.number.localeCompare(b.number, undefined, {numeric: true });
  });

  const addInvoiceEntry = inv => {
    const amount = inv.total || 0;
        const newEntries = [{id: crypto.randomUUID(), date: inv.date || today, particulars: "Cont Invoice", credit: amount, debit: 0, note: inv.number, invoiceId: inv.id }];
        if (ledger.enableTds) {
          newEntries.push({ id: crypto.randomUUID(), date: inv.date || today, particulars: `TDS @ ${ledger.tdsRate}%`, debit: parseFloat((amount * ledger.tdsRate / 100).toFixed(2)), credit: 0, note: inv.number, invoiceId: inv.id });
    }
        if (ledger.enableRetention) {
          newEntries.push({ id: crypto.randomUUID(), date: inv.date || today, particulars: `Retention @ ${ledger.retentionRate}%`, debit: parseFloat((amount * ledger.retentionRate / 100).toFixed(2)), credit: 0, note: inv.number, invoiceId: inv.id });
    }
        updateLedger({...ledger, entries: [...(ledger.entries || []), ...newEntries] });
  };

  const addManualEntry = () => {
    if (!entryForm.debit && !entryForm.credit) return;
        const particulars = entryForm.particulars === "Other" ? entryForm.customParticulars : entryForm.particulars;
        const entry = {id: crypto.randomUUID(), date: entryForm.date, particulars, debit: Number(entryForm.debit) || 0, credit: Number(entryForm.credit) || 0, note: entryForm.note };
        updateLedger({...ledger, entries: [...(ledger.entries || []), entry] });
        setEntryForm({date: today, particulars: "Bank Payment", customParticulars: "", debit: "", credit: "", note: "" });
        setShowAdd(false);
  };

  const deleteEntry = id => {
    const entry = (ledger.entries || []).find(e => e.id === id);
        if (entry && entry.invoiceId) {
          updateLedger({ ...ledger, entries: (ledger.entries || []).filter(e => e.invoiceId !== entry.invoiceId) });
    } else if (entry && entry.transferId) {
          setLedgers(p => p.map((l: any) => ({ ...l, entries: (l.entries || []).filter(e => e.transferId !== entry.transferId) })));
    } else {
          updateLedger({ ...ledger, entries: (ledger.entries || []).filter(e => e.id !== id) });
    }
  };

  // Sort entries by date
  const sorted = [...(ledger.entries || [])].sort((a, b) => a.date.localeCompare(b.date));

        // Calculate running balance (credit increases balance, debit decreases)
        let balance = 0;
  const rows = sorted.map((e: any) => {
          balance = balance + (e.credit || 0) - (e.debit || 0);
        return {...e, balance};
  });

  const totalCredit = sorted.reduce((a, e) => a + (e.credit || 0), 0);
  const totalDebit = sorted.reduce((a, e) => a + (e.debit || 0), 0);
        const closingBalance = totalCredit - totalDebit;

        return (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button onClick={onBack} style={S.btn("#f0f4f9", "#1a2b4a")}>← Back</button>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>📒 {ledger.name}</h2>
            </div>
            <div style={{ display: "flex", gap: "7px", flexWrap: "wrap" }}>
              <button onClick={() => setShowAdd(p => !p)} style={S.btn()}>+ Add Entry</button>
              <button onClick={() => setShowTransfer(p => !p)} style={S.btn("#7c3aed")}>↔️ Transfer</button>
              <button onClick={() => {
                const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${ledger.name}</title><style>${printCSS}</style></head><body onload="window.print();">
  <div style="font-family:'Segoe UI',sans-serif;color:#1a2b4a;padding:10mm;">
    <div style="text-align:center;margin-bottom:16px;border-bottom:2px solid #0f3172;padding-bottom:12px;">
      <div style="font-size:20px;font-weight:800;color:#0f3172;">VinoDhan Coating</div>
      <div style="font-size:16px;font-weight:700;color:#0f3172;margin-top:4px;">${ledger.name}</div>
      <div style="font-size:12px;color:#6b84a3;margin-top:4px;">Client: ${ledger.client}${ledger.region ? " — " + ledger.region : ""}</div>
    </div>
    <div style="display:flex;gap:20px;margin-bottom:16px;font-size:12px;">
      <div><span style="font-weight:600;color:#6b84a3;">Total Credit: </span><span style="font-weight:700;color:#166534;">₹${totalCredit.toLocaleString()}</span></div>
      <div><span style="font-weight:600;color:#6b84a3;">Total Debit: </span><span style="font-weight:700;color:#991b1b;">₹${totalDebit.toLocaleString()}</span></div>
      <div><span style="font-weight:600;color:#6b84a3;">Closing Balance: </span><span style="font-weight:700;color:#1e50a0;">₹${closingBalance.toLocaleString()}</span></div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:12px;">
      <thead>
        <tr style="background:#0f3172;color:#fff;">
          <th style="padding:8px 10px;text-align:left;">Date</th>
          <th style="padding:8px 10px;text-align:left;">Particulars</th>
          <th style="padding:8px 10px;text-align:left;">Note</th>
          <th style="padding:8px 10px;text-align:right;">Debit (₹)</th>
          <th style="padding:8px 10px;text-align:right;">Credit (₹)</th>
          <th style="padding:8px 10px;text-align:right;">Balance (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((e, idx) => `
          <tr style="background:${e.transferId ? "#fef9c3" :
                    e.particulars === "Cont Invoice" ? "#f0fdf4" :
                      e.particulars === "Bank Payment" ? "#eff6ff" :
                        (e.particulars.includes("TDS") || e.particulars.includes("Retention")) ? "#fdf4ff" :
                          idx % 2 === 0 ? "#fff" : "#f8faff"
                  };border-bottom:1px solid #e5e7eb;">
            <td style="padding:7px 10px;white-space:nowrap;">${fmtDate(e.date)}</td>
            <td style="padding:7px 10px;font-weight:600;">${e.particulars}</td>
            <td style="padding:7px 10px;color:#6b84a3;font-size:11px;">${e.note || "—"}</td>
            <td style="padding:7px 10px;text-align:right;color:#991b1b;font-weight:600;">${e.debit > 0 ? "₹" + e.debit.toLocaleString() : "—"}</td>
            <td style="padding:7px 10px;text-align:right;color:#166534;font-weight:600;">${e.credit > 0 ? "₹" + e.credit.toLocaleString() : "—"}</td>
            <td style="padding:7px 10px;text-align:right;font-weight:700;color:#1e50a0;">₹${e.balance.toLocaleString()}</td>
          </tr>
        `).join("")}
        <tr style="background:#0f3172;color:#fff;font-weight:700;">
          <td colspan="3" style="padding:10px;text-align:right;">TOTAL</td>
          <td style="padding:10px;text-align:right;">₹${totalDebit.toLocaleString()}</td>
          <td style="padding:10px;text-align:right;">₹${totalCredit.toLocaleString()}</td>
          <td style="padding:10px;text-align:right;color:#f59e0b;font-size:14px;">₹${closingBalance.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>
  </div>
  </body></html>`;
                const existing = document.getElementById("print-overlay");
                if (existing) document.body.removeChild(existing);
                const overlay = document.createElement("div");
                overlay.id = "print-overlay";
                overlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:#f0f4f9;z-index:99999;display:flex;flex-direction:column;font-family:'Segoe UI',sans-serif;";
                const bar = document.createElement("div");
                bar.style.cssText = "display:flex;align-items:center;justify-content:space-between;padding:12px 20px;background:#0f3172;flex-shrink:0;gap:10px;flex-wrap:wrap;";
                const backBtn = document.createElement("button");
                backBtn.innerText = "← Back";
                backBtn.style.cssText = "background:rgba(255,255,255,0.15);color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;";
                backBtn.onclick = () => document.body.removeChild(overlay);
                const title = document.createElement("div");
                title.innerText = "Preview — scroll to review";
                title.style.cssText = "color:#fff;font-size:13px;font-weight:600;flex:1;text-align:center;";
                const dlBtn = document.createElement("button");
                dlBtn.innerText = "⬇️ Download & Print";
                dlBtn.style.cssText = "background:#f59e0b;color:#1a1a1a;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:800;cursor:pointer;";
                dlBtn.onclick = () => {
                  const encoded = "data:text/html;charset=utf-8," + encodeURIComponent(html);
                  const a = document.createElement("a");
                  a.href = encoded; a.download = `${ledger.name}-${new Date().toISOString().split("T")[0]}.html`;
                  a.style.display = "none"; document.body.appendChild(a); a.click(); document.body.removeChild(a);
                };
                bar.appendChild(backBtn); bar.appendChild(title); bar.appendChild(dlBtn);
                const iframe = document.createElement("iframe");
                iframe.style.cssText = "flex:1;width:100%;border:none;";
                overlay.appendChild(bar); overlay.appendChild(iframe);
                document.body.appendChild(overlay);
                iframe.contentDocument.open();
                iframe.contentDocument.write(html);
                iframe.contentDocument.close();
              }} style={S.btn("#166534")}>🖨️ Print</button>
              <button onClick={() => exportLedgerExcel(ledger, rows, totalDebit, totalCredit, closingBalance)} style={S.btn("#d97706", "#fff")}>📊 Excel</button>
            </div>
          </div>

          {/* Summary Cards */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "16px", overflowX: "auto", paddingBottom: "4px" }}>
            <div style={{ ...S.card, background: "#dcfce7", boxShadow: "none", padding: "14px", minWidth: "130px", flexShrink: 0 }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#166534", marginBottom: "4px" }}>TOTAL CREDIT</div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f3172" }}>₹{totalCredit.toLocaleString()}</div>
            </div>
            <div style={{ ...S.card, background: "#fee2e2", boxShadow: "none", padding: "14px", minWidth: "130px", flexShrink: 0 }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#991b1b", marginBottom: "4px" }}>TOTAL DEBIT</div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f3172" }}>₹{totalDebit.toLocaleString()}</div>
            </div>
            <div style={{ ...S.card, background: "#dbeafe", boxShadow: "none", padding: "14px", minWidth: "130px", flexShrink: 0 }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#1e40af", marginBottom: "4px" }}>CLOSING BALANCE</div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f3172" }}>₹{closingBalance.toLocaleString()}</div>
            </div>
            {ledger.enableTds && <div style={{ ...S.card, background: "#fef9c3", boxShadow: "none", padding: "14px", minWidth: "130px", flexShrink: 0 }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#d97706", marginBottom: "4px" }}>TDS {ledger.tdsRate}%</div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f3172" }}>₹{sorted.filter(e => e.particulars.includes("TDS")).reduce((a, e) => a + (e.debit || 0), 0).toLocaleString()}</div>
              <button onClick={() => { setRateForm({ tdsRate: String(ledger.tdsRate), retentionRate: String(ledger.retentionRate) }); setRatePwModal(true); }} style={{ ...S.btn("#f59e0b", "#fff"), padding: "3px 8px", fontSize: "10px", marginTop: "6px" }}>✏️ Edit Rate</button>
            </div>}
            {ledger.enableRetention && <div style={{ ...S.card, background: "#ede9fe", boxShadow: "none", padding: "14px", minWidth: "130px", flexShrink: 0 }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#5b21b6", marginBottom: "4px" }}>RETENTION {ledger.retentionRate}%</div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f3172" }}>₹{sorted.filter(e => e.particulars.includes("Retention")).reduce((a, e) => a + (e.debit || 0), 0).toLocaleString()}</div>
              <button onClick={() => { setRateForm({ tdsRate: String(ledger.tdsRate), retentionRate: String(ledger.retentionRate) }); setRatePwModal(true); }} style={{ ...S.btn("#7c3aed", "#fff"), padding: "3px 8px", fontSize: "10px", marginTop: "6px" }}>✏️ Edit Rate</button>
            </div>}
          </div>
          {/* Chennai Extra Cards — shows on any ledger that received a transfer */}
          {(() => {
            const transferCredits = (ledger.entries || []).filter(e => e.transferId && e.credit > 0);
            const hasTransferReceived = transferCredits.length > 0;
            if (!hasTransferReceived) return null;

            // Find source ledger (the one that sent transfer to this ledger)
            const sourceLedger = ledgers.find(l =>
              (l.entries || []).some(e =>
                e.transferId && e.debit > 0 &&
                transferCredits.some(ce => ce.transferId === e.transferId)
              )
            );

            const totalTransferReceived = transferCredits.reduce((a, e) => a + (e.credit || 0), 0);

            const thisTDS = (ledger.entries || []).filter(e => e.particulars.includes("TDS")).reduce((a, e) => a + (e.debit || 0), 0);
            const sourceTDS = sourceLedger ? (sourceLedger.entries || []).filter(e => e.particulars.includes("TDS")).reduce((a, e) => a + (e.debit || 0), 0) : 0;
            const combinedTDS = thisTDS + sourceTDS;

            const thisRetention = (ledger.entries || []).filter(e => e.particulars.includes("Retention")).reduce((a, e) => a + (e.debit || 0), 0);
            const sourceRetention = sourceLedger ? (sourceLedger.entries || []).filter(e => e.particulars.includes("Retention")).reduce((a, e) => a + (e.debit || 0), 0) : 0;
            const combinedRetention = thisRetention + sourceRetention;

            return (
              <div style={{ ...S.card, marginBottom: "16px", border: "1.5px solid #0f3172" }}>
                <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 700, color: "#0f3172" }}>
                  📊 Combined Summary {sourceLedger ? `— ${sourceLedger.name} + ${ledger.name}` : ""}
                </h3>
                <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "4px" }}>
                  {/* Transfer Received */}
                  <div style={{ ...S.card, background: "#fef9c3", boxShadow: "none", padding: "14px", minWidth: "150px", flexShrink: 0 }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#d97706", marginBottom: "4px" }}>
                      TRANSFER FROM {sourceLedger ? sourceLedger.name.toUpperCase() : "SOURCE"}
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f3172" }}>₹{totalTransferReceived.toLocaleString()}</div>
                  </div>
                  {/* Combined TDS */}
                  <div style={{ ...S.card, background: "#fef9c3", boxShadow: "none", padding: "14px", minWidth: "150px", flexShrink: 0 }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#d97706", marginBottom: "4px" }}>COMBINED TDS</div>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f3172" }}>₹{combinedTDS.toLocaleString()}</div>
                    {sourceLedger && <div style={{ fontSize: "10px", color: "#6b84a3", marginTop: "4px" }}>
                      {sourceLedger.name}: ₹{sourceTDS.toLocaleString()} + {ledger.name}: ₹{thisTDS.toLocaleString()}
                    </div>}
                  </div>
                  {/* Combined Retention */}
                  <div style={{ ...S.card, background: "#ede9fe", boxShadow: "none", padding: "14px", minWidth: "150px", flexShrink: 0 }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#5b21b6", marginBottom: "4px" }}>COMBINED RETENTION</div>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f3172" }}>₹{combinedRetention.toLocaleString()}</div>
                    {sourceLedger && <div style={{ fontSize: "10px", color: "#6b84a3", marginTop: "4px" }}>
                      {sourceLedger.name}: ₹{sourceRetention.toLocaleString()} + {ledger.name}: ₹{thisRetention.toLocaleString()}
                    </div>}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Transfer Form */}
          {showTransfer && <div style={{ ...S.card, marginBottom: "14px", border: "1.5px solid #7c3aed" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: 700 }}>↔️ Transfer to Another Ledger</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "9px" }}>
              <div><label style={S.lbl}>Date</label><input type="date" value={transferForm.date} onChange={e => setTransferForm(p => ({ ...p, date: e.target.value }))} style={S.inp} /></div>
              <div><label style={S.lbl}>Amount (₹)</label><input type="number" value={transferForm.amount} onChange={e => setTransferForm(p => ({ ...p, amount: e.target.value }))} style={S.inp} /></div>
              <div style={{ gridColumn: "1/-1" }}><label style={S.lbl}>Transfer To</label>
                <select value={transferForm.toLedgerId} onChange={e => setTransferForm(p => ({ ...p, toLedgerId: e.target.value }))} style={S.inp}>
                  <option value="">Select Ledger...</option>
                  {ledgers.filter(l => l.id !== ledger.id).map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: "1/-1" }}><label style={S.lbl}>Note (optional)</label><input value={transferForm.note} onChange={e => setTransferForm(p => ({ ...p, note: e.target.value }))} placeholder="e.g. cheque no, reference" style={S.inp} /></div>
            </div>
            <div style={{ display: "flex", gap: "7px", marginTop: "11px" }}>
              <button onClick={() => {
                if (!transferForm.amount || !transferForm.toLedgerId) return;
                const transferId = crypto.randomUUID();
                const amount = Number(transferForm.amount);
                const toLedger = ledgers.find(l => String(l.id) === String(transferForm.toLedgerId));
                if (!toLedger) return;
                const debitEntry = { id: crypto.randomUUID(), date: transferForm.date, particulars: "Transfer to " + toLedger.name, debit: amount, credit: 0, note: transferForm.note, transferId };
                const creditEntry = { id: crypto.randomUUID(), date: transferForm.date, particulars: "Transfer from " + ledger.name, debit: 0, credit: amount, note: transferForm.note, transferId };
                setLedgers(p => p.map((l: any) => {
                  if (String(l.id) === String(ledger.id)) return { ...l, entries: [...(l.entries || []), debitEntry] };
                  if (String(l.id) === String(toLedger.id)) return { ...l, entries: [...(l.entries || []), creditEntry] };
                  return l;
                }));
                setTransferForm({ date: today, amount: "", toLedgerId: "", note: "" });
                setShowTransfer(false);
              }} style={S.btn("#7c3aed")}>💾 Save Transfer</button>
              <button onClick={() => setShowTransfer(false)} style={S.btn("#f0f4f9", "#1a2b4a")}>Cancel</button>
            </div>
          </div>}

          {/* Add Invoice */}
          {availableInvoices.length > 0 && <div style={{ ...S.card, marginBottom: "14px", border: "1.5px solid #bfdbfe" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: 700 }}>📥 Add Invoice to Ledger</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {availableInvoices.map((inv: any) => (
                <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#f0f6ff", borderRadius: "8px" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "13px" }}>{inv.number}</div>
                    <div style={{ fontSize: "11px", color: "#6b84a3" }}>{fmtDate(inv.date)} — ₹{inv.total?.toLocaleString()}</div>
                    <div style={{ fontSize: "11px", color: "#6b84a3" }}>{inv.siteName || "—"}</div>
                    {inv.measureNo && <div style={{ fontSize: "10px", fontWeight: 700, color: "#1e50a0", marginTop: "2px" }}>📋 {inv.measureNo}</div>}
                  </div>
                  <button onClick={() => addInvoiceEntry(inv)} style={{ ...S.btn("#166634"), padding: "5px 12px", fontSize: "12px" }}>+ Add</button>
                </div>
              ))}
            </div>
          </div>}

          {/* Manual Entry Form */}
          {showAdd && <div style={{ ...S.card, marginBottom: "14px", border: "1.5px solid #bfdbfe" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: 700 }}>New Manual Entry</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "9px" }}>
              <div><label style={S.lbl}>Date</label><input type="date" value={entryForm.date} onChange={e => setEntryForm(p => ({ ...p, date: e.target.value }))} style={S.inp} /></div>
              <div><label style={S.lbl}>Particulars</label>
                <select value={entryForm.particulars} onChange={e => setEntryForm(p => ({ ...p, particulars: e.target.value }))} style={S.inp}>
                  {PARTICULARS.map((p: any) => <option key={p}>{p}</option>)}
                </select>
              </div>
              {entryForm.particulars === "Other" && <div style={{ gridColumn: "1/-1" }}><label style={S.lbl}>Description</label><input value={entryForm.customParticulars} onChange={e => setEntryForm(p => ({ ...p, customParticulars: e.target.value }))} placeholder="Enter description" style={S.inp} /></div>}
              <div><label style={S.lbl}>Debit (₹)</label><input type="number" value={entryForm.debit} onChange={e => setEntryForm(p => ({ ...p, debit: e.target.value, credit: "" }))} style={S.inp} /></div>
              <div><label style={S.lbl}>Credit (₹)</label><input type="number" value={entryForm.credit} onChange={e => setEntryForm(p => ({ ...p, credit: e.target.value, debit: "" }))} style={S.inp} /></div>
              <div style={{ gridColumn: "1/-1" }}><label style={S.lbl}>Note (optional)</label><input value={entryForm.note} onChange={e => setEntryForm(p => ({ ...p, note: e.target.value }))} placeholder="e.g. cheque no, reference" style={S.inp} /></div>
            </div>
            <div style={{ display: "flex", gap: "7px", marginTop: "11px" }}>
              <button onClick={addManualEntry} style={S.btn()}>💾 Save</button>
              <button onClick={() => setShowAdd(false)} style={S.btn("#f0f4f9", "#1a2b4a")}>Cancel</button>
            </div>
          </div>}

          {/* Ledger Table */}
          <div style={{ ...S.card, overflowX: "auto" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 700 }}>📋 {ledger.client} — {ledger.region || "All Regions"}</h3>
            {rows.length === 0 ? <div style={{ textAlign: "center", color: "#9db3cc", padding: "30px" }}>No entries yet.</div>
              : <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", minWidth: "500px" }}>
                <thead><tr style={{ background: "#0f3172", color: "#fff" }}>
                  <th style={{ padding: "8px 10px", textAlign: "left" }}>Date</th>
                  <th style={{ padding: "8px 10px", textAlign: "left" }}>Particulars</th>
                  <th style={{ padding: "8px 10px", textAlign: "right" }}>Debit (₹)</th>
                  <th style={{ padding: "8px 10px", textAlign: "right" }}>Credit (₹)</th>
                  <th style={{ padding: "8px 10px", textAlign: "right" }}>Balance (₹)</th>
                  <th style={{ padding: "8px 10px", textAlign: "center" }}>Action</th>
                </tr></thead>
                <tbody>
                  {rows.map((e, idx) => (
                    <tr key={e.id} style={{
                      background:
                        e.transferId ? "#fef9c3" :
                          e.particulars === "Cont Invoice" ? "#f0fdf4" :
                            e.particulars === "Bank Payment" ? "#eff6ff" :
                              (e.particulars.includes("TDS") || e.particulars.includes("Retention")) ? "#fdf4ff" :
                                idx % 2 === 0 ? "#fff" : "#f8faff"
                      , borderBottom: "1px solid #f0f4f9"
                    }}>
                      <td style={{ padding: "7px 10px", whiteSpace: "nowrap" }}>{fmtDate(e.date)}</td>
                      <td style={{ padding: "7px 10px" }}>
                        <div style={{ fontWeight: 600 }}>{e.particulars}</div>
                        {e.note && <div style={{ fontSize: "11px", marginTop: "3px" }}>
                          {e.invoiceId
                            ? <span style={{ background: "#dbeafe", color: "#1e40af", fontWeight: 700, borderRadius: "6px", padding: "2px 8px", fontSize: "11px" }}>{e.note}</span>
                            : e.transferId
                              ? <span style={{ background: "#fef9c3", color: "#d97706", fontWeight: 700, borderRadius: "6px", padding: "2px 8px", fontSize: "11px" }}>{e.note}</span>
                              : <span style={{ color: "#6b84a3", fontSize: "10px" }}>{e.note}</span>
                          }
                        </div>}
                      </td>
                      <td style={{ padding: "7px 10px", textAlign: "right", color: "#991b1b", fontWeight: 600 }}>{e.debit > 0 ? `₹${e.debit.toLocaleString()}` : "—"}</td>
                      <td style={{ padding: "7px 10px", textAlign: "right", color: "#166534", fontWeight: 600 }}>{e.credit > 0 ? `₹${e.credit.toLocaleString()}` : "—"}</td>
                      <td style={{ padding: "7px 10px", textAlign: "right", fontWeight: 700, color: "#1e50a0" }}>₹{e.balance.toLocaleString()}</td>
                      <td style={{ padding: "7px 10px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                          <button onClick={() => setEditPwModal({ ...e })} style={{ ...S.btn("#f0f6ff", "#1e50a0"), padding: "3px 8px", fontSize: "11px" }}>✏️</button>
                          <button onClick={() => setDelEntryModal(e.id)} style={{ ...S.btn("#fee2e2", "#991b1b"), padding: "3px 8px", fontSize: "11px" }}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: "#0f3172", color: "#fff", fontWeight: 700 }}>
                    <td colSpan={2} style={{ padding: "10px", textAlign: "right" }}>TOTAL</td>
                    <td style={{ padding: "10px", textAlign: "right" }}>₹{totalDebit.toLocaleString()}</td>
                    <td style={{ padding: "10px", textAlign: "right" }}>₹{totalCredit.toLocaleString()}</td>
                    <td style={{ padding: "10px", textAlign: "right", color: "#f59e0b", fontSize: "14px" }}>₹{closingBalance.toLocaleString()}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>}
          </div>
          {editPwModal && <PwModal
            title="Edit Entry?"
            onConfirm={() => { setEditEntryModal({ ...editPwModal }); setEditPwModal(null); }}
            onCancel={() => setEditPwModal(null)}
          />}
          {editEntryModal && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000 }}>
              <div style={{ background: "#fff", borderRadius: "16px", padding: "28px", width: "320px" }}>
                <h3 style={{ margin: "0 0 14px", fontSize: "14px", fontWeight: 700 }}>✏️ Edit Entry</h3>
                <div style={{ display: "grid", gap: "10px", marginBottom: "14px" }}>
                  <div><label style={S.lbl}>Date</label>
                    <input type="date" value={editEntryModal.date} onChange={e => setEditEntryModal(p => ({ ...p, date: e.target.value }))} style={S.inp} />
                  </div>
                  <div><label style={S.lbl}>Particulars</label>
                    <input value={editEntryModal.particulars} onChange={e => setEditEntryModal(p => ({ ...p, particulars: e.target.value }))} style={S.inp} />
                  </div>
                  <div><label style={S.lbl}>Debit (₹)</label>
                    {(editEntryModal.particulars.includes("TDS") || editEntryModal.particulars.includes("Retention")) && (
                      <div style={{ display: "flex", gap: "7px", marginBottom: "7px" }}>
                        <button onClick={() => setEditEntryModal(p => ({ ...p, debit: 0, credit: 0, particulars: p.particulars + " (N/A)" }))} style={{ ...S.btn("#fee2e2", "#991b1b"), padding: "4px 10px", fontSize: "11px" }}>✗ Not Applicable</button>
                        <span style={{ fontSize: "11px", color: "#6b84a3", alignSelf: "center" }}>Sets amount to zero</span>
                      </div>
                    )}
                    <input type="number" value={editEntryModal.debit || ""} onChange={e => setEditEntryModal(p => ({ ...p, debit: Number(e.target.value), credit: 0 }))} style={S.inp} />
                  </div>
                  <div><label style={S.lbl}>Credit (₹)</label>
                    <input type="number" value={editEntryModal.credit || ""} onChange={e => setEditEntryModal(p => ({ ...p, credit: Number(e.target.value), debit: 0 }))} style={S.inp} />
                  </div>
                  <div><label style={S.lbl}>Note</label>
                    <input value={editEntryModal.note || ""} onChange={e => setEditEntryModal(p => ({ ...p, note: e.target.value }))} placeholder="e.g. cheque no, reference" style={S.inp} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "9px", justifyContent: "center" }}>
                  <button onClick={() => {
                    updateLedger({ ...ledger, entries: (ledger.entries || []).map((e: any) => e.id === editEntryModal.id ? { ...editEntryModal } : e) });
                    setEditEntryModal(null);
                  }} style={S.btn()}>💾 Save</button>
                  <button onClick={() => setEditEntryModal(null)} style={S.btn("#f0f4f9", "#1a2b4a")}>Cancel</button>
                </div>
              </div>
            </div>
          )}
          {ratePwModal && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000 }}>
              <div style={{ background: "#fff", borderRadius: "16px", padding: "28px", width: "300px", textAlign: "center" }}>
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>🔐</div>
                <h3 style={{ margin: "0 0 7px" }}>Edit Rates</h3>
                <p style={{ fontSize: "12px", color: "#6b84a3", margin: "0 0 16px" }}>Enter password to edit TDS/Retention rates.</p>
                <input type="password" id="rate-pw-input" placeholder="Enter password" style={{ ...S.inp, marginBottom: "14px", textAlign: "center" }} />
                {ledger.enableTds && <div style={{ marginBottom: "10px", textAlign: "left" }}>
                  <label style={S.lbl}>TDS Rate (%)</label>
                  <input type="number" value={rateForm.tdsRate} onChange={e => setRateForm(p => ({ ...p, tdsRate: e.target.value }))} style={S.inp} />
                </div>}
                {ledger.enableRetention && <div style={{ marginBottom: "14px", textAlign: "left" }}>
                  <label style={S.lbl}>Retention Rate (%)</label>
                  <input type="number" value={rateForm.retentionRate} onChange={e => setRateForm(p => ({ ...p, retentionRate: e.target.value }))} style={S.inp} />
                </div>}
                <div id="rate-err" style={{ color: "#dc2626", fontSize: "12px", marginBottom: "10px", display: "none" }}>❌ Incorrect password.</div>
                <div style={{ display: "flex", gap: "9px", justifyContent: "center" }}>
                  <button onClick={() => {
                    const pw = document.getElementById("rate-pw-input").value;
                    if (pw !== RECYCLE_PASSWORD) { document.getElementById("rate-err").style.display = "block"; return; }
                    updateLedger({ ...ledger, tdsRate: Number(rateForm.tdsRate), retentionRate: Number(rateForm.retentionRate) });
                    setRatePwModal(false);
                  }} style={S.btn("#1e50a0")}>Confirm</button>
                  <button onClick={() => setRatePwModal(false)} style={S.btn("#f0f4f9", "#1a2b4a")}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {delEntryModal && <PwModal
            title="Delete Entry?"
            onConfirm={() => { deleteEntry(delEntryModal); setDelEntryModal(null); }}
            onCancel={() => setDelEntryModal(null)}
          />}
        </div>
  );
  }

