import { useState, useRef } from 'react';

const printCSS = `@media print{.no-print{display:none!important;}@page{size:A4;margin:18mm;}}`;
const se = document.createElement('style');
se.innerText = printCSS;
document.head.appendChild(se);

const USERS = [
  { id: 'owner', name: 'DS', role: 'Owner', password: 'owner123' },
  {
    id: 'exec',
    name: 'Vinoth Kumar. N',
    role: 'Site Executive',
    password: 'exec123',
  },
];
const USER_PHONES = { owner: '98XXXXXX01', exec: '98XXXXXX02' };
const CATEGORIES = ['Applicator', 'Semi-Applicator', 'Helper'];
const CAT_COLOR = {
  Applicator: { bg: '#dbeafe', color: '#1e40af' },
  'Semi-Applicator': { bg: '#ede9fe', color: '#5b21b6' },
  Helper: { bg: '#dcfce7', color: '#166534' },
};
const today = new Date().toISOString().split('T')[0];
const EMPTY_WORKER = {
  name: '',
  category: 'Applicator',
  phone: '',
  aadhaar: '',
  doj: '',
};
const EMPTY_EXEC = { name: 'Vinoth Kumar. N', phone: '', aadhaar: '', doj: '' };
const INIT_WORKERS = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: `Worker ${i + 1}`,
  category: i < 4 ? 'Applicator' : i < 8 ? 'Semi-Applicator' : 'Helper',
  phone: '',
  aadhaar: '',
  doj: '',
}));
const INIT_COMPANY = {
  name: 'VinoDhan Coating',
  address: 'Chennai, Tamil Nadu',
  phone: '+91 XXXXX XXXXX',
  gstin: 'XX-XXXXXXXXX',
  udyam: 'UDYAM-TN-XX-XXXXXXX',
};
const INIT_CLIENT = {
  sendTo: '',
  name: 'Swathi Engineering Agency',
  place: 'Chennai',
  pincode: '600037',
  phone: '',
  measureNo: '',
};
const INIT_BANK = {
  accName: 'VinoDhan Coating',
  bank: 'Indian Bank',
  accNo: 'XXXXXXXXXXXX',
  ifsc: 'IDIB000XXXX',
  upi: 'vinodhan@upi',
};
const getDates = (s, e) => {
  const d = [];
  let c = new Date(s);
  const l = new Date(e);
  while (c <= l) {
    d.push(c.toISOString().split('T')[0]);
    c.setDate(c.getDate() + 1);
  }
  return d;
};

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'sites', label: 'Sites', icon: '🏗️' },
  { id: 'workers', label: 'Workers', icon: '👷' },
  { id: 'attendance', label: 'Attendance', icon: '✅' },
  { id: 'invoice', label: 'Invoice', icon: '🧾' },
];

// ── STYLES ────────────────────────────────────────────
const S = {
  btn: (bg = '#1e50a0', color = '#fff') => ({
    background: bg,
    color,
    border: 'none',
    borderRadius: '8px',
    padding: '9px 18px',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
  }),
  card: {
    background: '#fff',
    borderRadius: '14px',
    boxShadow: '0 2px 16px rgba(30,80,160,0.08)',
    padding: '20px',
  },
  inp: {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1.5px solid #bfdbfe',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
    color: '#1a2b4a',
  },
  lbl: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#6b84a3',
    display: 'block',
    marginBottom: '4px',
  },
  badge: (cat) => ({
    ...CAT_COLOR[cat],
    fontSize: '11px',
    fontWeight: 600,
    borderRadius: '20px',
    padding: '2px 10px',
    display: 'inline-block',
  }),
};

function ErrBox({ msg }) {
  return (
    <div
      style={{
        color: '#dc2626',
        fontSize: '12px',
        marginBottom: '12px',
        padding: '8px 12px',
        background: '#fee2e2',
        borderRadius: '8px',
      }}
    >
      {msg}
    </div>
  );
}

function EditField({
  value,
  onChange,
  style = {},
  placeholder = 'Click to edit',
  multiline = false,
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const commit = () => {
    onChange(val);
    setEditing(false);
  };
  if (editing) {
    const p = {
      value: val,
      onChange: (e) => setVal(e.target.value),
      onBlur: commit,
      autoFocus: true,
      onKeyDown: (e) => {
        if (e.key === 'Enter' && !multiline) commit();
        if (e.key === 'Escape') setEditing(false);
      },
      style: {
        ...style,
        border: '1.5px solid #60a5fa',
        borderRadius: '4px',
        padding: '2px 6px',
        outline: 'none',
        fontSize: 'inherit',
        fontWeight: 'inherit',
        fontFamily: 'inherit',
        color: 'inherit',
        background: '#eff6ff',
        width: '100%',
        boxSizing: 'border-box',
      },
    };
    return multiline ? <textarea {...p} rows={2} /> : <input {...p} />;
  }
  return (
    <span
      onClick={() => {
        setVal(value);
        setEditing(true);
      }}
      title="Click to edit"
      style={{
        ...style,
        cursor: 'text',
        borderBottom: '1px dashed #bfdbfe',
        minWidth: '40px',
        display: 'inline-block',
      }}
    >
      {value || (
        <span style={{ color: '#9db3cc', fontStyle: 'italic' }}>
          {placeholder}
        </span>
      )}
    </span>
  );
}

// ── ROOT ──────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [landscape, setLandscape] = useState(true);
  const [workers, setWorkers] = useState(INIT_WORKERS);
  const [execProfile, setExecProfile] = useState(EMPTY_EXEC);
  const [sites, setSites] = useState([
    {
      id: 1,
      name: 'Site A — Chennai North',
      client: 'Swathi Engineering Agency',
      status: 'Active',
      works: [],
    },
  ]);
  const [attendance, setAttendance] = useState({});
  const [assignments, setAssignments] = useState({
    1: {
      1: 'Applicator',
      2: 'Applicator',
      3: 'Semi-Applicator',
      4: 'Helper',
      5: 'Helper',
      6: 'Helper',
    },
  });
  const [invoices, setInvoices] = useState([]);
  const [company, setCompany] = useState(INIT_COMPANY);
  const [client, setClient] = useState(INIT_CLIENT);
  const [bank, setBank] = useState(INIT_BANK);
  const [passwords, setPasswords] = useState({
    owner: 'owner123',
    exec: 'exec123',
  });

  if (!user)
    return (
      <LoginPage
        onLogin={setUser}
        passwords={passwords}
        setPasswords={setPasswords}
      />
    );

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
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        fontFamily: "'Segoe UI',sans-serif",
        background: '#f0f4f9',
        color: '#1a2b4a',
        overflow: 'hidden',
      }}
    >
      {/* TOP BAR */}
      <TopBar
        user={user}
        page={page}
        setPage={setPage}
        landscape={landscape}
        setLandscape={setLandscape}
        setUser={setUser}
      />
      {/* CONTENT */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: landscape ? '24px 28px' : '16px 14px',
          transition: 'padding .3s',
        }}
      >
        {page === 'dashboard' && <Dashboard {...ctx} landscape={landscape} />}
        {page === 'sites' && <Sites {...ctx} />}
        {page === 'workers' && <Workers {...ctx} />}
        {page === 'attendance' && <Attendance {...ctx} />}
        {page === 'invoice' && <Invoice {...ctx} />}
      </div>
    </div>
  );
}

// ── TOP BAR ───────────────────────────────────────────
function TopBar({ user, page, setPage, landscape, setLandscape, setUser }) {
  const scrollRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const onMouseDown = (e) => {
    setDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };
  const onMouseMove = (e) => {
    if (!dragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    scrollRef.current.scrollLeft = scrollLeft - (x - startX);
  };
  const onMouseUp = () => setDragging(false);

  return (
    <div
      style={{ background: '#0f3172', boxShadow: '0 2px 12px rgba(0,0,0,0.2)' }}
      className="no-print"
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '20px' }}>🏗️</div>
          <div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 800,
                color: '#fff',
                lineHeight: 1,
              }}
            >
              VinoDhan
            </div>
            <div style={{ fontSize: '10px', color: '#90afd4' }}>
              Coating Services
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* User badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              background: 'rgba(255,255,255,0.1)',
              padding: '5px 10px',
              borderRadius: '20px',
            }}
          >
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: '#1e50a0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                color: '#fff',
                fontWeight: 700,
              }}
            >
              {user.name[0]}
            </div>
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#fff',
                  lineHeight: 1,
                }}
              >
                {user.name}
              </div>
              <div style={{ fontSize: '10px', color: '#90afd4' }}>
                {user.role}
              </div>
            </div>
          </div>
          {/* Orientation toggle */}
          <button
            onClick={() => setLandscape((p) => !p)}
            title={landscape ? 'Switch to Portrait' : 'Switch to Landscape'}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 10px',
              cursor: 'pointer',
              color: '#fff',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {landscape ? '⬜' : '📱'}
            <span style={{ fontSize: '10px', fontWeight: 600 }}>
              {landscape ? 'Wide' : 'Tall'}
            </span>
          </button>
          {/* Logout */}
          <button
            onClick={() => setUser(null)}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 10px',
              cursor: 'pointer',
              color: '#90afd4',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            🚪
          </button>
        </div>
      </div>

      {/* Scrollable nav */}
      <div
        ref={scrollRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseUp}
        onMouseUp={onMouseUp}
        style={{
          display: 'flex',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          padding: '0 10px 10px',
          gap: '6px',
          cursor: dragging ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
      >
        {NAV.map((item) => {
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              style={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '9px 18px',
                borderRadius: '22px',
                border: 'none',
                cursor: 'pointer',
                background: active ? '#fff' : 'rgba(255,255,255,0.1)',
                color: active ? '#0f3172' : '#fff',
                fontWeight: active ? 700 : 500,
                fontSize: '13px',
                boxShadow: active ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                transition: 'all .2s',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ fontSize: '15px' }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
        {/* spacer */}
        <div style={{ flexShrink: 0, width: '10px' }} />
      </div>
    </div>
  );
}

// ── LOGIN ─────────────────────────────────────────────
function LoginPage({ onLogin, passwords, setPasswords }) {
  const [mode, setMode] = useState('login');
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [fStep, setFStep] = useState(1);
  const [fUser, setFUser] = useState('');
  const [genOtp, setGenOtp] = useState('');
  const [entOtp, setEntOtp] = useState('');
  const [newPw, setNewPw] = useState('');
  const [cnfPw, setCnfPw] = useState('');
  const [fErr, setFErr] = useState('');
  const [fMsg, setFMsg] = useState('');

  const login = () => {
    const u = USERS.find((u) => u.id === id && u.password === passwords[id]);
    u ? onLogin(u) : setErr('Invalid User ID or Password.');
  };
  const sendOtp = () => {
    if (!fUser) {
      setFErr('Please select a user.');
      return;
    }
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    setGenOtp(otp);
    setFStep(2);
    setFErr('');
    setFMsg(`OTP sent to ${USER_PHONES[fUser]} — Demo OTP: ${otp}`);
  };
  const verifyOtp = () => {
    entOtp === genOtp
      ? (setFStep(3), setFErr(''), setFMsg(''))
      : setFErr('Incorrect OTP. Try again.');
  };
  const resetPw = () => {
    if (!newPw || newPw.length < 6) {
      setFErr('Min 6 characters.');
      return;
    }
    if (newPw !== cnfPw) {
      setFErr('Passwords do not match.');
      return;
    }
    setPasswords((p) => ({ ...p, [fUser]: newPw }));
    setMode('login');
    setFStep(1);
    setFUser('');
    setEntOtp('');
    setNewPw('');
    setCnfPw('');
    setGenOtp('');
    setFErr('');
    setFMsg('');
    alert('✅ Password reset! Log in with new password.');
  };
  const resetForgot = () => {
    setMode('login');
    setFStep(1);
    setFUser('');
    setEntOtp('');
    setNewPw('');
    setCnfPw('');
    setGenOtp('');
    setFErr('');
    setFMsg('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg,#0f3172,#1e50a0)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Segoe UI',sans-serif",
        padding: '20px',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '40px 36px',
          width: '100%',
          maxWidth: '360px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '26px' }}>
          <div style={{ fontSize: '34px', marginBottom: '6px' }}>🏗️</div>
          <h1
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 800,
              color: '#0f3172',
            }}
          >
            VinoDhan Coating
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#6b84a3' }}>
            Specialised Epoxy Coating Services
          </p>
        </div>

        {mode === 'login' && (
          <>
            <div style={{ marginBottom: '12px' }}>
              <label style={S.lbl}>USER ID</label>
              <select
                value={id}
                onChange={(e) => setId(e.target.value)}
                style={S.inp}
              >
                <option value="">Select user...</option>
                <option value="owner">Owner (DS)</option>
                <option value="exec">Site Executive (Vinoth Kumar)</option>
              </select>
            </div>
            <div style={{ marginBottom: '6px' }}>
              <label style={S.lbl}>PASSWORD</label>
              <input
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && login()}
                placeholder="Enter password"
                style={S.inp}
              />
            </div>
            <div style={{ textAlign: 'right', marginBottom: '14px' }}>
              <span
                onClick={() => setMode('forgot')}
                style={{
                  fontSize: '12px',
                  color: '#1e50a0',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Forgot Password / ID?
              </span>
            </div>
            {err && <ErrBox msg={err} />}
            <button
              onClick={login}
              style={{ ...S.btn(), width: '100%', padding: '12px' }}
            >
              Login →
            </button>
            <div
              style={{
                marginTop: '16px',
                padding: '10px',
                background: '#f0f4f9',
                borderRadius: '8px',
                fontSize: '11px',
                color: '#6b84a3',
                lineHeight: '1.7',
              }}
            >
              <strong>Demo:</strong> owner / owner123 | exec / exec123
            </div>
          </>
        )}

        {mode === 'forgot' && (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '18px',
              }}
            >
              <span
                onClick={resetForgot}
                style={{
                  cursor: 'pointer',
                  fontSize: '18px',
                  color: '#6b84a3',
                }}
              >
                ←
              </span>
              <h3
                style={{
                  margin: 0,
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#0f3172',
                }}
              >
                {fStep === 1
                  ? 'Forgot Password'
                  : fStep === 2
                  ? 'Enter OTP'
                  : 'Reset Password'}
              </h3>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '7px',
                marginBottom: '20px',
              }}
            >
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  style={{
                    width: '26px',
                    height: '5px',
                    borderRadius: '3px',
                    background: fStep >= n ? '#1e50a0' : '#e5e7eb',
                    transition: 'background .3s',
                  }}
                />
              ))}
            </div>
            {fStep === 1 && (
              <>
                <p
                  style={{
                    fontSize: '13px',
                    color: '#6b84a3',
                    margin: '0 0 14px',
                  }}
                >
                  Select your account to receive an OTP on your registered
                  mobile.
                </p>
                <div style={{ marginBottom: '14px' }}>
                  <label style={S.lbl}>SELECT ACCOUNT</label>
                  <select
                    value={fUser}
                    onChange={(e) => setFUser(e.target.value)}
                    style={S.inp}
                  >
                    <option value="">Select...</option>
                    <option value="owner">Owner (DS)</option>
                    <option value="exec">Site Executive (Vinoth Kumar)</option>
                  </select>
                </div>
                {fUser && (
                  <div
                    style={{
                      padding: '9px 13px',
                      background: '#f0f6ff',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#1e50a0',
                      marginBottom: '13px',
                    }}
                  >
                    📱 OTP to: <strong>{USER_PHONES[fUser]}</strong>
                  </div>
                )}
                {fErr && <ErrBox msg={fErr} />}
                <button
                  onClick={sendOtp}
                  style={{ ...S.btn(), width: '100%', padding: '11px' }}
                >
                  Send OTP →
                </button>
              </>
            )}
            {fStep === 2 && (
              <>
                {fMsg && (
                  <div
                    style={{
                      padding: '9px 13px',
                      background: '#dcfce7',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#166534',
                      marginBottom: '14px',
                      lineHeight: '1.6',
                    }}
                  >
                    {fMsg}
                  </div>
                )}
                <div style={{ marginBottom: '14px' }}>
                  <label style={S.lbl}>ENTER 6-DIGIT OTP</label>
                  <input
                    value={entOtp}
                    onChange={(e) => setEntOtp(e.target.value)}
                    placeholder="······"
                    maxLength={6}
                    style={{
                      ...S.inp,
                      fontSize: '22px',
                      letterSpacing: '8px',
                      textAlign: 'center',
                      fontWeight: 700,
                    }}
                  />
                </div>
                {fErr && <ErrBox msg={fErr} />}
                <button
                  onClick={verifyOtp}
                  style={{
                    ...S.btn(),
                    width: '100%',
                    padding: '11px',
                    marginBottom: '9px',
                  }}
                >
                  Verify OTP →
                </button>
                <div style={{ textAlign: 'center' }}>
                  <span
                    onClick={sendOtp}
                    style={{
                      fontSize: '12px',
                      color: '#1e50a0',
                      cursor: 'pointer',
                    }}
                  >
                    Resend OTP
                  </span>
                </div>
              </>
            )}
            {fStep === 3 && (
              <>
                <div
                  style={{
                    padding: '9px 13px',
                    background: '#dcfce7',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#166534',
                    marginBottom: '14px',
                  }}
                >
                  ✅ OTP verified!
                </div>
                <div style={{ marginBottom: '11px' }}>
                  <label style={S.lbl}>NEW PASSWORD</label>
                  <input
                    type="password"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="Min 6 characters"
                    style={S.inp}
                  />
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={S.lbl}>CONFIRM PASSWORD</label>
                  <input
                    type="password"
                    value={cnfPw}
                    onChange={(e) => setCnfPw(e.target.value)}
                    placeholder="Re-enter password"
                    style={S.inp}
                    onKeyDown={(e) => e.key === 'Enter' && resetPw()}
                  />
                </div>
                {fErr && <ErrBox msg={fErr} />}
                <button
                  onClick={resetPw}
                  style={{ ...S.btn(), width: '100%', padding: '11px' }}
                >
                  Reset Password ✓
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────
function Dashboard({
  user,
  workers,
  sites,
  attendance,
  assignments,
  landscape,
}) {
  const activeSites = sites.filter((s) => s.status === 'Active').length;
  const totalSqm = sites.reduce(
    (sum, s) => (s.works || []).reduce((a, w) => a + (w.area || 0), sum),
    0
  );
  const totalRev = sites.reduce(
    (sum, s) =>
      (s.works || []).reduce((a, w) => a + (w.area || 0) * (w.rate || 0), sum),
    0
  );
  const todayAtt = Object.entries(attendance).filter(
    ([k, v]) => k.startsWith(today) && v === 'Present'
  ).length;
  const stats = [
    {
      label: 'Total Workers',
      value: workers.length,
      icon: '👷',
      color: '#dbeafe',
    },
    { label: 'Active Sites', value: activeSites, icon: '🏗️', color: '#dcfce7' },
    { label: 'Present Today', value: todayAtt, icon: '✅', color: '#fef9c3' },
    {
      label: 'Total Sq.m',
      value: `${totalSqm}m²`,
      icon: '📐',
      color: '#ede9fe',
    },
    {
      label: 'Revenue',
      value: `₹${totalRev.toLocaleString()}`,
      icon: '💰',
      color: '#fef3c7',
    },
  ];
  return (
    <div>
      <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 800 }}>
        Good day, {user.name}! 👋
      </h2>
      <p style={{ margin: '0 0 20px', color: '#6b84a3', fontSize: '12px' }}>
        {today}
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: landscape ? 'repeat(5,1fr)' : 'repeat(2,1fr)',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        {stats.map((st) => (
          <div
            key={st.label}
            style={{
              ...S.card,
              background: st.color,
              boxShadow: 'none',
              padding: '16px',
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '6px' }}>
              {st.icon}
            </div>
            <div
              style={{ fontSize: '20px', fontWeight: 800, color: '#0f3172' }}
            >
              {st.value}
            </div>
            <div
              style={{ fontSize: '11px', color: '#6b84a3', marginTop: '2px' }}
            >
              {st.label}
            </div>
          </div>
        ))}
      </div>
      <div style={S.card}>
        <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700 }}>
          🏗️ Sites Overview
        </h3>
        {sites.map((site) => {
          const sa = assignments[site.id] || {};
          const byDesig = CATEGORIES.reduce(
            (acc, c) => ({
              ...acc,
              [c]: Object.values(sa).filter((d) => d === c).length,
            }),
            {}
          );
          const rev = (site.works || []).reduce(
            (a, w) => a + (w.area || 0) * (w.rate || 0),
            0
          );
          return (
            <div
              key={site.id}
              style={{
                padding: '12px 14px',
                background: '#f0f6ff',
                borderRadius: '10px',
                marginBottom: '8px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '6px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>
                    {site.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b84a3' }}>
                    {site.client}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontWeight: 700,
                      color: '#166534',
                      fontSize: '13px',
                    }}
                  >
                    ₹{rev.toLocaleString()}
                  </div>
                  <span
                    style={{
                      background:
                        site.status === 'Active' ? '#dcfce7' : '#fee2e2',
                      color: site.status === 'Active' ? '#166534' : '#991b1b',
                      fontSize: '10px',
                      fontWeight: 600,
                      borderRadius: '20px',
                      padding: '2px 9px',
                    }}
                  >
                    {site.status}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {Object.keys(sa).length === 0 ? (
                  <span style={{ fontSize: '11px', color: '#9db3cc' }}>
                    No workers assigned
                  </span>
                ) : (
                  CATEGORIES.map(
                    (c) =>
                      byDesig[c] > 0 && (
                        <span key={c} style={S.badge(c)}>
                          {byDesig[c]} {c}
                        </span>
                      )
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── SITES ─────────────────────────────────────────────
function Sites({ sites, setSites, workers, assignments, setAssignments }) {
  const [showAdd, setShowAdd] = useState(false);
  const [siteForm, setSiteForm] = useState({
    name: '',
    client: 'Swathi Engineering Agency',
    status: 'Active',
  });
  const [expandSite, setExpandSite] = useState(null);
  const [siteTab, setSiteTab] = useState({});
  const [workForm, setWorkForm] = useState({
    place: '',
    workersList: '',
    fromDate: '',
    toDate: '',
    area: '',
    rate: '',
  });
  const [editWorkId, setEditWorkId] = useState(null);
  const [addingWork, setAddingWork] = useState(null);
  const getTab = (id) => siteTab[id] || 'assign';
  const addSite = () => {
    if (!siteForm.name.trim()) return;
    const ns = { id: Date.now(), ...siteForm, works: [] };
    setSites((p) => [...p, ns]);
    setAssignments((p) => ({ ...p, [ns.id]: {} }));
    setSiteForm({
      name: '',
      client: 'Swathi Engineering Agency',
      status: 'Active',
    });
    setShowAdd(false);
  };
  const deleteSite = (id) => setSites((p) => p.filter((s) => s.id !== id));
  const toggleWorker = (siteId, w) =>
    setAssignments((p) => {
      const c = { ...(p[siteId] || {}) };
      if (c[w.id]) delete c[w.id];
      else c[w.id] = w.category;
      return { ...p, [siteId]: c };
    });
  const changeDesig = (siteId, wid, desig) =>
    setAssignments((p) => ({
      ...p,
      [siteId]: { ...(p[siteId] || {}), [wid]: desig },
    }));
  const saveWork = (siteId) => {
    if (!workForm.place || !workForm.area || !workForm.rate) return;
    setSites((p) =>
      p.map((s) => {
        if (s.id !== siteId) return s;
        if (editWorkId)
          return {
            ...s,
            works: (s.works || []).map((w) =>
              w.id === editWorkId
                ? {
                    ...w,
                    ...workForm,
                    area: Number(workForm.area),
                    rate: Number(workForm.rate),
                  }
                : w
            ),
          };
        return {
          ...s,
          works: [
            ...(s.works || []),
            {
              id: Date.now(),
              ...workForm,
              area: Number(workForm.area),
              rate: Number(workForm.rate),
            },
          ],
        };
      })
    );
    setWorkForm({
      place: '',
      workersList: '',
      fromDate: '',
      toDate: '',
      area: '',
      rate: '',
    });
    setAddingWork(null);
    setEditWorkId(null);
  };
  const deleteWork = (siteId, wid) =>
    setSites((p) =>
      p.map((s) =>
        s.id === siteId
          ? { ...s, works: (s.works || []).filter((w) => w.id !== wid) }
          : s
      )
    );
  const startEdit = (siteId, w) => {
    setAddingWork(siteId);
    setEditWorkId(w.id);
    setWorkForm({
      place: w.place,
      workersList: w.workersList || '',
      fromDate: w.fromDate || '',
      toDate: w.toDate || '',
      area: w.area,
      rate: w.rate,
    });
  };
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '18px',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>
          🏗️ Sites
        </h2>
        <button onClick={() => setShowAdd((p) => !p)} style={S.btn()}>
          + Add Site
        </button>
      </div>
      {showAdd && (
        <div
          style={{
            ...S.card,
            marginBottom: '16px',
            border: '1.5px solid #bfdbfe',
          }}
        >
          <h3 style={{ margin: '0 0 12px', fontSize: '14px' }}>New Site</h3>
          {[
            ['Site Name', 'name'],
            ['Client', 'client'],
          ].map(([lbl, key]) => (
            <div key={key} style={{ marginBottom: '10px' }}>
              <label style={S.lbl}>{lbl}</label>
              <input
                value={siteForm[key]}
                onChange={(e) =>
                  setSiteForm((p) => ({ ...p, [key]: e.target.value }))
                }
                style={S.inp}
              />
            </div>
          ))}
          <div style={{ marginBottom: '12px' }}>
            <label style={S.lbl}>Status</label>
            <select
              value={siteForm.status}
              onChange={(e) =>
                setSiteForm((p) => ({ ...p, status: e.target.value }))
              }
              style={S.inp}
            >
              <option>Active</option>
              <option>Completed</option>
              <option>On Hold</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '9px' }}>
            <button onClick={addSite} style={S.btn()}>
              Save
            </button>
            <button
              onClick={() => setShowAdd(false)}
              style={S.btn('#f0f4f9', '#1a2b4a')}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {sites.map((site) => {
        const sa = assignments[site.id] || {};
        const aids = Object.keys(sa).map(Number);
        const isExp = expandSite === site.id;
        const tab = getTab(site.id);
        const rev = (site.works || []).reduce(
          (a, w) => a + (w.area || 0) * (w.rate || 0),
          0
        );
        return (
          <div key={site.id} style={{ ...S.card, marginBottom: '12px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '9px',
              }}
            >
              <div>
                <h3
                  style={{
                    margin: '0 0 2px',
                    fontSize: '15px',
                    fontWeight: 700,
                  }}
                >
                  {site.name}
                </h3>
                <div style={{ fontSize: '11px', color: '#6b84a3' }}>
                  {site.client}
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#166534',
                    marginTop: '3px',
                  }}
                >
                  ₹{rev.toLocaleString()}
                </div>
              </div>
              <div
                style={{ display: 'flex', gap: '6px', alignItems: 'center' }}
              >
                <span
                  style={{
                    background:
                      site.status === 'Active' ? '#dcfce7' : '#fee2e2',
                    color: site.status === 'Active' ? '#166534' : '#991b1b',
                    fontSize: '10px',
                    fontWeight: 600,
                    borderRadius: '20px',
                    padding: '2px 10px',
                  }}
                >
                  {site.status}
                </span>
                <button
                  onClick={() => deleteSite(site.id)}
                  style={{
                    ...S.btn('#fee2e2', '#991b1b'),
                    padding: '4px 9px',
                    fontSize: '12px',
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
            <button
              onClick={() => setExpandSite(isExp ? null : site.id)}
              style={S.btn('#f0f6ff', '#1e50a0')}
            >
              {isExp ? 'Close ▲' : 'Manage ▼'}
            </button>
            {isExp && (
              <div style={{ marginTop: '12px' }}>
                <div
                  style={{ display: 'flex', gap: '7px', marginBottom: '12px' }}
                >
                  {[
                    ['assign', '⚙️ Workers'],
                    ['works', '📐 Works'],
                  ].map(([t, lbl]) => (
                    <button
                      key={t}
                      onClick={() =>
                        setSiteTab((p) => ({ ...p, [site.id]: t }))
                      }
                      style={S.btn(
                        tab === t ? '#1e50a0' : '#e5e7eb',
                        tab === t ? '#fff' : '#374151'
                      )}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
                {tab === 'assign' && (
                  <div
                    style={{
                      background: '#f8faff',
                      borderRadius: '10px',
                      padding: '12px',
                    }}
                  >
                    <p
                      style={{
                        margin: '0 0 10px',
                        fontSize: '11px',
                        color: '#6b84a3',
                        fontWeight: 600,
                      }}
                    >
                      Click to assign/remove. Set site role for assigned
                      workers.
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      {workers.map((w) => {
                        const isA = !!sa[w.id];
                        const desig = sa[w.id] || w.category;
                        return (
                          <div
                            key={w.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '9px',
                              padding: '8px 12px',
                              borderRadius: '9px',
                              background: isA ? '#fff' : '#f0f4f9',
                              border: isA
                                ? `1.5px solid ${CAT_COLOR[desig].color}`
                                : '1.5px solid transparent',
                            }}
                          >
                            <div
                              onClick={() => toggleWorker(site.id, w)}
                              style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '5px',
                                flexShrink: 0,
                                background: isA ? '#1e50a0' : '#e5e7eb',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: '#fff',
                                fontSize: '12px',
                                fontWeight: 700,
                              }}
                            >
                              {isA ? '✓' : ''}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div
                                style={{ fontSize: '13px', fontWeight: 600 }}
                              >
                                {w.name}
                              </div>
                              <div
                                style={{ fontSize: '10px', color: '#6b84a3' }}
                              >
                                Profile:{' '}
                                <span
                                  style={{
                                    color: CAT_COLOR[w.category].color,
                                    fontWeight: 600,
                                  }}
                                >
                                  {w.category}
                                </span>
                              </div>
                            </div>
                            {isA && (
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'flex-end',
                                  gap: '2px',
                                }}
                              >
                                <label
                                  style={{
                                    fontSize: '10px',
                                    color: '#6b84a3',
                                    fontWeight: 600,
                                  }}
                                >
                                  SITE ROLE
                                </label>
                                <select
                                  value={desig}
                                  onChange={(e) =>
                                    changeDesig(site.id, w.id, e.target.value)
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    padding: '3px 6px',
                                    borderRadius: '6px',
                                    border: `1.5px solid ${CAT_COLOR[desig].color}`,
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: CAT_COLOR[desig].color,
                                    background: CAT_COLOR[desig].bg,
                                    outline: 'none',
                                  }}
                                >
                                  {CATEGORIES.map((c) => (
                                    <option key={c}>{c}</option>
                                  ))}
                                </select>
                                {desig !== w.category && (
                                  <div
                                    style={{
                                      fontSize: '10px',
                                      color: '#d97706',
                                    }}
                                  >
                                    ⚠ Differs
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {tab === 'works' && (
                  <div>
                    <button
                      onClick={() => {
                        setAddingWork(addingWork === site.id ? null : site.id);
                        setEditWorkId(null);
                        setWorkForm({
                          place: '',
                          workersList: '',
                          fromDate: '',
                          toDate: '',
                          area: '',
                          rate: '',
                        });
                      }}
                      style={{
                        ...S.btn(),
                        marginBottom: '10px',
                        fontSize: '12px',
                        padding: '7px 13px',
                      }}
                    >
                      + Add Work Entry
                    </button>
                    {addingWork === site.id && (
                      <div
                        style={{
                          ...S.card,
                          marginBottom: '10px',
                          border: '1.5px solid #bfdbfe',
                          padding: '14px',
                        }}
                      >
                        <h4 style={{ margin: '0 0 10px' }}>
                          {editWorkId ? 'Edit' : 'New'} Work Entry
                        </h4>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '9px',
                          }}
                        >
                          <div style={{ gridColumn: '1/-1' }}>
                            <label style={S.lbl}>Place / Description</label>
                            <input
                              value={workForm.place}
                              onChange={(e) =>
                                setWorkForm((p) => ({
                                  ...p,
                                  place: e.target.value,
                                }))
                              }
                              placeholder="e.g. East Wing Floor"
                              style={S.inp}
                            />
                          </div>
                          <div style={{ gridColumn: '1/-1' }}>
                            <label style={S.lbl}>Workers (notes)</label>
                            <input
                              value={workForm.workersList}
                              onChange={(e) =>
                                setWorkForm((p) => ({
                                  ...p,
                                  workersList: e.target.value,
                                }))
                              }
                              placeholder="e.g. Raju, Selvam"
                              style={S.inp}
                            />
                          </div>
                          <div>
                            <label style={S.lbl}>From Date</label>
                            <input
                              type="date"
                              value={workForm.fromDate}
                              onChange={(e) =>
                                setWorkForm((p) => ({
                                  ...p,
                                  fromDate: e.target.value,
                                }))
                              }
                              style={S.inp}
                            />
                          </div>
                          <div>
                            <label style={S.lbl}>To Date</label>
                            <input
                              type="date"
                              value={workForm.toDate}
                              onChange={(e) =>
                                setWorkForm((p) => ({
                                  ...p,
                                  toDate: e.target.value,
                                }))
                              }
                              style={S.inp}
                            />
                          </div>
                          <div>
                            <label style={S.lbl}>Area (sq.m)</label>
                            <input
                              type="number"
                              value={workForm.area}
                              onChange={(e) =>
                                setWorkForm((p) => ({
                                  ...p,
                                  area: e.target.value,
                                }))
                              }
                              placeholder="250"
                              style={S.inp}
                            />
                          </div>
                          <div>
                            <label style={S.lbl}>Rate (₹/sq.m)</label>
                            <input
                              type="number"
                              value={workForm.rate}
                              onChange={(e) =>
                                setWorkForm((p) => ({
                                  ...p,
                                  rate: e.target.value,
                                }))
                              }
                              placeholder="45"
                              style={S.inp}
                            />
                          </div>
                        </div>
                        {workForm.area && workForm.rate && (
                          <div
                            style={{
                              marginTop: '8px',
                              padding: '7px 11px',
                              background: '#dcfce7',
                              borderRadius: '7px',
                              fontSize: '13px',
                              fontWeight: 600,
                              color: '#166534',
                            }}
                          >
                            💰 ₹
                            {(
                              Number(workForm.area) * Number(workForm.rate)
                            ).toLocaleString()}
                          </div>
                        )}
                        <div
                          style={{
                            display: 'flex',
                            gap: '7px',
                            marginTop: '11px',
                          }}
                        >
                          <button
                            onClick={() => saveWork(site.id)}
                            style={{
                              ...S.btn(),
                              fontSize: '12px',
                              padding: '7px 13px',
                            }}
                          >
                            💾 Save
                          </button>
                          <button
                            onClick={() => {
                              setAddingWork(null);
                              setEditWorkId(null);
                            }}
                            style={{
                              ...S.btn('#f0f4f9', '#1a2b4a'),
                              fontSize: '12px',
                              padding: '7px 13px',
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    {(site.works || []).length === 0 ? (
                      <div
                        style={{
                          color: '#9db3cc',
                          fontSize: '13px',
                          textAlign: 'center',
                          padding: '18px',
                        }}
                      >
                        No work entries yet.
                      </div>
                    ) : (
                      (site.works || []).map((w) => (
                        <div
                          key={w.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '11px 13px',
                            background: '#f8faff',
                            borderRadius: '9px',
                            marginBottom: '6px',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '13px' }}>
                              {w.place}
                            </div>
                            {w.workersList && (
                              <div
                                style={{ fontSize: '11px', color: '#6b84a3' }}
                              >
                                👷 {w.workersList}
                              </div>
                            )}
                            {w.fromDate && (
                              <div
                                style={{ fontSize: '11px', color: '#6b84a3' }}
                              >
                                {w.fromDate} → {w.toDate || 'ongoing'}
                              </div>
                            )}
                            <div style={{ fontSize: '11px', color: '#6b84a3' }}>
                              {w.area}m² × ₹{w.rate}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div
                              style={{
                                fontWeight: 700,
                                fontSize: '14px',
                                color: '#166534',
                              }}
                            >
                              ₹{(w.area * w.rate).toLocaleString()}
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                gap: '5px',
                                marginTop: '5px',
                              }}
                            >
                              <button
                                onClick={() => startEdit(site.id, w)}
                                style={{
                                  ...S.btn('#f0f6ff', '#1e50a0'),
                                  padding: '4px 8px',
                                  fontSize: '12px',
                                }}
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => deleteWork(site.id, w.id)}
                                style={{
                                  ...S.btn('#fee2e2', '#991b1b'),
                                  padding: '4px 8px',
                                  fontSize: '12px',
                                }}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── WORKERS ───────────────────────────────────────────
function Workers({ workers, setWorkers, execProfile, setExecProfile }) {
  const [view, setView] = useState('list');
  const [editId, setEditId] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_WORKER);
  const [delConfirm, setDelConfirm] = useState(null);
  const [showAadhaar, setShowAadhaar] = useState({});
  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const saveEdit = () => {
    setWorkers((p) => p.map((w) => (w.id === editId ? { ...w, ...form } : w)));
    setEditId(null);
  };
  const addWorker = () => {
    if (!form.name.trim() || workers.length >= 20) return;
    setWorkers((p) => [...p, { id: Date.now(), ...form }]);
    setForm(EMPTY_WORKER);
    setAddOpen(false);
  };
  const deleteWorker = (id) => {
    setWorkers((p) => p.filter((w) => w.id !== id));
    setDelConfirm(null);
  };
  const mask = (n) =>
    !n || n.length < 4 ? n || '—' : 'XXXX-XXXX-' + n.slice(-4);
  const openEdit = (w) => {
    setForm({
      name: w.name,
      category: w.category,
      phone: w.phone,
      aadhaar: w.aadhaar,
      doj: w.doj,
    });
    setEditId(w.id);
  };
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>
          👷 Workers
        </h2>
        <div style={{ display: 'flex', gap: '7px' }}>
          <button
            onClick={() => setView('list')}
            style={S.btn(
              view === 'list' ? '#1e50a0' : '#e5e7eb',
              view === 'list' ? '#fff' : '#374151'
            )}
          >
            Workers
          </button>
          <button
            onClick={() => setView('exec')}
            style={S.btn(
              view === 'exec' ? '#1e50a0' : '#e5e7eb',
              view === 'exec' ? '#fff' : '#374151'
            )}
          >
            Executive
          </button>
          {view === 'list' && workers.length < 20 && (
            <button
              onClick={() => {
                setAddOpen((p) => !p);
                setForm(EMPTY_WORKER);
              }}
              style={S.btn('#0f3172')}
            >
              + Add
            </button>
          )}
        </div>
      </div>
      {addOpen && view === 'list' && (
        <div
          style={{
            ...S.card,
            marginBottom: '16px',
            border: '1.5px solid #bfdbfe',
          }}
        >
          <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700 }}>
            New Worker
          </h3>
          <WForm form={form} setF={setF} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={addWorker} style={S.btn()}>
              💾 Save
            </button>
            <button
              onClick={() => setAddOpen(false)}
              style={S.btn('#f0f4f9', '#1a2b4a')}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {view === 'exec' && (
        <div style={{ ...S.card, maxWidth: '500px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '13px',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: '#1e50a0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '17px',
                color: '#fff',
                fontWeight: 700,
              }}
            >
              V
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700 }}>
                Vinoth Kumar. N
              </div>
              <div style={{ fontSize: '11px', color: '#6b84a3' }}>
                Site Executive
              </div>
            </div>
          </div>
          {editId === 'exec' ? (
            <>
              <EForm form={form} setF={setF} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    setExecProfile(form);
                    setEditId(null);
                  }}
                  style={S.btn()}
                >
                  💾 Save
                </button>
                <button
                  onClick={() => setEditId(null)}
                  style={S.btn('#f0f4f9', '#1a2b4a')}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <PRow label="Phone" value={execProfile.phone || '—'} />
              <PRow
                label="Aadhaar"
                value={
                  showAadhaar['exec']
                    ? execProfile.aadhaar || '—'
                    : mask(execProfile.aadhaar)
                }
                toggle={() => setShowAadhaar((p) => ({ ...p, exec: !p.exec }))}
              />
              <PRow label="Joined" value={execProfile.doj || '—'} />
              <button
                onClick={() => {
                  setForm({
                    name: execProfile.name,
                    phone: execProfile.phone,
                    aadhaar: execProfile.aadhaar,
                    doj: execProfile.doj,
                  });
                  setEditId('exec');
                }}
                style={{ ...S.btn(), marginTop: '12px' }}
              >
                ✏️ Edit
              </button>
            </>
          )}
        </div>
      )}
      {view === 'list' && (
        <>
          <div
            style={{ fontSize: '11px', color: '#6b84a3', marginBottom: '12px' }}
          >
            {workers.length}/20 workers
          </div>
          {CATEGORIES.map((cat) => (
            <div key={cat} style={{ marginBottom: '20px' }}>
              <h3
                style={{
                  margin: '0 0 9px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: CAT_COLOR[cat].color,
                  textTransform: 'uppercase',
                  letterSpacing: '.05em',
                }}
              >
                {cat}s ({workers.filter((w) => w.category === cat).length})
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))',
                  gap: '10px',
                }}
              >
                {workers
                  .filter((w) => w.category === cat)
                  .map((w) => (
                    <WCard
                      key={w.id}
                      w={w}
                      isEditing={editId === w.id}
                      form={form}
                      setF={setF}
                      onEdit={() => openEdit(w)}
                      onSave={saveEdit}
                      onCancel={() => setEditId(null)}
                      onDelete={() => setDelConfirm(w.id)}
                      showAadhaar={!!showAadhaar[w.id]}
                      toggleAadhaar={() =>
                        setShowAadhaar((p) => ({ ...p, [w.id]: !p[w.id] }))
                      }
                      mask={mask}
                    />
                  ))}
              </div>
            </div>
          ))}
        </>
      )}
      {delConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '28px',
              width: '290px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚠️</div>
            <h3 style={{ margin: '0 0 7px' }}>Delete Worker?</h3>
            <p
              style={{ fontSize: '12px', color: '#6b84a3', margin: '0 0 20px' }}
            >
              Removes{' '}
              <strong>{workers.find((w) => w.id === delConfirm)?.name}</strong>{' '}
              permanently.
            </p>
            <div
              style={{ display: 'flex', gap: '9px', justifyContent: 'center' }}
            >
              <button
                onClick={() => deleteWorker(delConfirm)}
                style={S.btn('#dc2626')}
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setDelConfirm(null)}
                style={S.btn('#f0f4f9', '#1a2b4a')}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function WCard({
  w,
  isEditing,
  form,
  setF,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  showAadhaar,
  toggleAadhaar,
  mask,
}) {
  const [exp, setExp] = useState(false);
  return (
    <div
      style={{ ...S.card, padding: '13px', cursor: 'pointer' }}
      onClick={() => !isEditing && setExp((p) => !p)}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: exp || isEditing ? '11px' : '0',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: CAT_COLOR[w.category].bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 700,
            color: CAT_COLOR[w.category].color,
            flexShrink: 0,
          }}
        >
          {w.name[0]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: '13px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {w.name}
          </div>
          <span style={S.badge(w.category)}>{w.category}</span>
        </div>
        <div style={{ fontSize: '12px', color: '#90afd4' }}>
          {exp || isEditing ? '▲' : '▼'}
        </div>
      </div>
      {isEditing ? (
        <div onClick={(e) => e.stopPropagation()}>
          <WForm form={form} setF={setF} />
          <div style={{ display: 'flex', gap: '7px' }}>
            <button
              onClick={onSave}
              style={{ ...S.btn(), padding: '6px 12px', fontSize: '12px' }}
            >
              💾
            </button>
            <button
              onClick={onCancel}
              style={{
                ...S.btn('#f0f4f9', '#1a2b4a'),
                padding: '6px 12px',
                fontSize: '12px',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        exp && (
          <div onClick={(e) => e.stopPropagation()}>
            <PRow label="📞 Phone" value={w.phone || '—'} />
            <PRow
              label="🪪 Aadhaar"
              value={showAadhaar ? w.aadhaar || '—' : mask(w.aadhaar)}
              toggle={toggleAadhaar}
            />
            <PRow label="📅 Joined" value={w.doj || '—'} />
            <div style={{ display: 'flex', gap: '7px', marginTop: '10px' }}>
              <button
                onClick={onEdit}
                style={{ ...S.btn(), padding: '5px 12px', fontSize: '12px' }}
              >
                ✏️ Edit
              </button>
              <button
                onClick={onDelete}
                style={{
                  ...S.btn('#fee2e2', '#991b1b'),
                  padding: '5px 12px',
                  fontSize: '12px',
                }}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}
function PRow({ label, value, toggle }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '5px 0',
        borderBottom: '1px solid #f0f4f9',
        fontSize: '12px',
      }}
    >
      <span style={{ color: '#6b84a3', fontWeight: 600, fontSize: '11px' }}>
        {label}
      </span>
      <span style={{ fontWeight: 500 }}>
        {value}
        {toggle && (
          <span
            onClick={toggle}
            style={{
              marginLeft: '7px',
              fontSize: '11px',
              color: '#1e50a0',
              cursor: 'pointer',
            }}
          >
            👁
          </span>
        )}
      </span>
    </div>
  );
}
function WForm({ form, setF }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
        marginBottom: '10px',
      }}
    >
      <div style={{ gridColumn: '1/-1' }}>
        <label style={S.lbl}>Full Name</label>
        <input
          value={form.name}
          onChange={(e) => setF('name', e.target.value)}
          placeholder="Worker name"
          style={S.inp}
        />
      </div>
      <div>
        <label style={S.lbl}>Default Category</label>
        <select
          value={form.category}
          onChange={(e) => setF('category', e.target.value)}
          style={S.inp}
        >
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label style={S.lbl}>Phone</label>
        <input
          value={form.phone}
          onChange={(e) => setF('phone', e.target.value)}
          placeholder="10-digit"
          style={S.inp}
          maxLength={10}
        />
      </div>
      <div>
        <label style={S.lbl}>Aadhaar</label>
        <input
          value={form.aadhaar}
          onChange={(e) => setF('aadhaar', e.target.value)}
          placeholder="12-digit"
          style={S.inp}
          maxLength={12}
        />
      </div>
      <div>
        <label style={S.lbl}>Date of Joining</label>
        <input
          type="date"
          value={form.doj}
          onChange={(e) => setF('doj', e.target.value)}
          style={S.inp}
        />
      </div>
    </div>
  );
}
function EForm({ form, setF }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
        marginBottom: '10px',
      }}
    >
      <div>
        <label style={S.lbl}>Phone</label>
        <input
          value={form.phone}
          onChange={(e) => setF('phone', e.target.value)}
          style={S.inp}
          maxLength={10}
        />
      </div>
      <div>
        <label style={S.lbl}>Aadhaar</label>
        <input
          value={form.aadhaar}
          onChange={(e) => setF('aadhaar', e.target.value)}
          style={S.inp}
          maxLength={12}
        />
      </div>
      <div style={{ gridColumn: '1/-1' }}>
        <label style={S.lbl}>Date of Joining</label>
        <input
          type="date"
          value={form.doj}
          onChange={(e) => setF('doj', e.target.value)}
          style={S.inp}
        />
      </div>
    </div>
  );
}

// ── ATTENDANCE ────────────────────────────────────────
function Attendance({
  workers,
  sites,
  attendance,
  setAttendance,
  assignments,
}) {
  const [tab, setTab] = useState('mark');
  const [selSite, setSelSite] = useState(sites[0]?.id || null);
  const [selDate, setSelDate] = useState(today);
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const mark = (wid, status) =>
    setAttendance((p) => ({ ...p, [`${selDate}_${selSite}_${wid}`]: status }));
  const getStatus = (wid) => attendance[`${selDate}_${selSite}_${wid}`] || null;
  const sa = selSite ? assignments[selSite] || {} : {};
  const aids = Object.keys(sa).map(Number);
  const present = aids.filter((w) => getStatus(w) === 'Present').length;
  const absent = aids.filter((w) => getStatus(w) === 'Absent').length;
  const half = aids.filter((w) => getStatus(w) === 'Half').length;
  const getBulk = (siteId, date, field) => {
    const k = `bulk_${date}_${siteId}`;
    return (attendance[k] || {})[field] || 0;
  };
  const setBulk = (siteId, date, field, val) => {
    const k = `bulk_${date}_${siteId}`;
    setAttendance((p) => ({
      ...p,
      [k]: { ...(p[k] || {}), [field]: Number(val) },
    }));
  };
  const rangeDates = getDates(fromDate, toDate);
  return (
    <div>
      <h2 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: 800 }}>
        ✅ Attendance
      </h2>
      <div
        style={{
          display: 'flex',
          gap: '7px',
          marginBottom: '16px',
          overflowX: 'auto',
          paddingBottom: '4px',
        }}
      >
        {[
          ['mark', '📝 Mark'],
          ['bulk', '🔢 Bulk'],
          ['report', '📊 Report'],
        ].map(([t, lbl]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              ...S.btn(
                tab === t ? '#1e50a0' : '#e5e7eb',
                tab === t ? '#fff' : '#374151'
              ),
              flexShrink: 0,
            }}
          >
            {lbl}
          </button>
        ))}
      </div>
      {tab === 'mark' && (
        <>
          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '16px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: 1, minWidth: '140px' }}>
              <label style={S.lbl}>Site</label>
              <select
                value={selSite || ''}
                onChange={(e) => setSelSite(Number(e.target.value))}
                style={S.inp}
              >
                {sites.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: '140px' }}>
              <label style={S.lbl}>Date</label>
              <input
                type="date"
                value={selDate}
                onChange={(e) => setSelDate(e.target.value)}
                style={S.inp}
              />
            </div>
          </div>
          <div
            style={{
              ...S.card,
              marginBottom: '16px',
              display: 'flex',
              gap: '18px',
              flexWrap: 'wrap',
            }}
          >
            {[
              ['Present', present, '#166534'],
              ['Half', half, '#d97706'],
              ['Absent', absent, '#991b1b'],
              ['Unmarked', aids.length - present - absent - half, '#6b84a3'],
              ['Total', aids.length, '#1e50a0'],
            ].map(([lbl, val, color]) => (
              <div key={lbl}>
                <span style={{ fontSize: '19px', fontWeight: 800, color }}>
                  {val}
                </span>
                <div style={{ fontSize: '10px', color: '#6b84a3' }}>{lbl}</div>
              </div>
            ))}
          </div>
          {aids.length === 0 ? (
            <div
              style={{
                ...S.card,
                textAlign: 'center',
                color: '#9db3cc',
                padding: '32px',
              }}
            >
              No workers assigned.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))',
                gap: '10px',
              }}
            >
              {aids.map((wid) => {
                const w = workers.find((x) => x.id === wid);
                if (!w) return null;
                const desig = sa[wid] || w.category;
                const status = getStatus(wid);
                return (
                  <div key={wid} style={{ ...S.card, padding: '13px' }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: '13px',
                        marginBottom: '4px',
                      }}
                    >
                      {w.name}
                    </div>
                    <span
                      style={{
                        ...S.badge(desig),
                        marginBottom: '8px',
                        display: 'inline-block',
                      }}
                    >
                      {desig}
                    </span>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      {[
                        ['Present', '✓ P', '#166534'],
                        ['Half', '½ H', '#d97706'],
                        ['Absent', '✗ A', '#991b1b'],
                      ].map(([st, lbl, activeColor]) => (
                        <button
                          key={st}
                          onClick={() => mark(wid, st)}
                          style={{
                            flex: 1,
                            padding: '6px 4px',
                            borderRadius: '6px',
                            border: 'none',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            background: status === st ? activeColor : '#e5e7eb',
                            color: status === st ? '#fff' : '#6b7280',
                          }}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      {tab === 'bulk' && (
        <>
          <div style={{ marginBottom: '14px' }}>
            <label style={S.lbl}>Date</label>
            <input
              type="date"
              value={selDate}
              onChange={(e) => setSelDate(e.target.value)}
              style={{ ...S.inp, maxWidth: '200px' }}
            />
          </div>
          <p style={{ fontSize: '12px', color: '#6b84a3', margin: '0 0 12px' }}>
            Enter headcount numbers directly per site.
          </p>
          {sites.map((site) => {
            const p = getBulk(site.id, selDate, 'present');
            const h = getBulk(site.id, selDate, 'half');
            const a = getBulk(site.id, selDate, 'absent');
            const md = p + h * 0.5;
            return (
              <div key={site.id} style={{ ...S.card, marginBottom: '11px' }}>
                <h3
                  style={{
                    margin: '0 0 11px',
                    fontSize: '14px',
                    fontWeight: 700,
                  }}
                >
                  {site.name}
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3,1fr)',
                    gap: '9px',
                    marginBottom: '9px',
                  }}
                >
                  {[
                    ['Present', 'present', '#dcfce7', '#166534'],
                    ['Half Day', 'half', '#fef9c3', '#d97706'],
                    ['Absent', 'absent', '#fee2e2', '#991b1b'],
                  ].map(([lbl, field, bg, color]) => (
                    <div key={field}>
                      <label style={{ ...S.lbl, color }}>{lbl}</label>
                      <input
                        type="number"
                        min="0"
                        value={getBulk(site.id, selDate, field)}
                        onChange={(e) =>
                          setBulk(site.id, selDate, field, e.target.value)
                        }
                        style={{
                          ...S.inp,
                          background: bg,
                          borderColor: color,
                          color,
                          fontWeight: 700,
                          textAlign: 'center',
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    padding: '7px 11px',
                    background: '#f0f6ff',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#1e50a0',
                  }}
                >
                  👉 Man-Days: <strong>{md}</strong>
                </div>
              </div>
            );
          })}
        </>
      )}
      {tab === 'report' && (
        <>
          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '16px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: 1, minWidth: '130px' }}>
              <label style={S.lbl}>From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={S.inp}
              />
            </div>
            <div style={{ flex: 1, minWidth: '130px' }}>
              <label style={S.lbl}>To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={S.inp}
              />
            </div>
          </div>
          {sites.map((site) => {
            const siteA = assignments[site.id] || {};
            const aids2 = Object.keys(siteA).map(Number);
            if (aids2.length === 0) return null;
            const rows = aids2
              .map((wid) => {
                const w = workers.find((x) => x.id === wid);
                if (!w) return null;
                let p = 0,
                  h = 0,
                  a = 0;
                rangeDates.forEach((d) => {
                  const v = attendance[`${d}_${site.id}_${wid}`];
                  if (v === 'Present') p++;
                  else if (v === 'Absent') a++;
                  else if (v === 'Half') h++;
                });
                return {
                  w,
                  desig: siteA[wid] || w.category,
                  p,
                  h,
                  a,
                  md: p + h * 0.5,
                };
              })
              .filter(Boolean);
            let bp = 0,
              bh = 0;
            rangeDates.forEach((d) => {
              const bk = attendance[`bulk_${d}_${site.id}`] || {};
              bp += bk.present || 0;
              bh += bk.half || 0;
            });
            return (
              <div key={site.id} style={{ ...S.card, marginBottom: '14px' }}>
                <h3
                  style={{
                    margin: '0 0 12px',
                    fontSize: '14px',
                    fontWeight: 700,
                  }}
                >
                  {site.name}
                </h3>
                {rows.length > 0 && (
                  <div style={{ overflowX: 'auto', marginBottom: '10px' }}>
                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '12px',
                      }}
                    >
                      <thead>
                        <tr style={{ background: '#f0f6ff' }}>
                          {['Worker', 'Role', 'P', 'H', 'A', 'Man-Days'].map(
                            (h) => (
                              <th
                                key={h}
                                style={{
                                  padding: '8px 10px',
                                  textAlign: 'left',
                                  fontWeight: 600,
                                  color: '#1e50a0',
                                  fontSize: '11px',
                                }}
                              >
                                {h}
                              </th>
                            )
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map(({ w, desig, p, h, a, md }) => (
                          <tr
                            key={w.id}
                            style={{ borderBottom: '1px solid #f0f4f9' }}
                          >
                            <td
                              style={{ padding: '8px 10px', fontWeight: 600 }}
                            >
                              {w.name}
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              <span style={S.badge(desig)}>
                                {desig.split('-')[0]}
                              </span>
                            </td>
                            <td
                              style={{
                                padding: '8px 10px',
                                color: '#166534',
                                fontWeight: 600,
                              }}
                            >
                              {p}
                            </td>
                            <td
                              style={{
                                padding: '8px 10px',
                                color: '#d97706',
                                fontWeight: 600,
                              }}
                            >
                              {h}
                            </td>
                            <td
                              style={{ padding: '8px 10px', color: '#991b1b' }}
                            >
                              {a}
                            </td>
                            <td
                              style={{
                                padding: '8px 10px',
                                fontWeight: 700,
                                color: '#1e50a0',
                              }}
                            >
                              {md}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {(bp > 0 || bh > 0) && (
                  <div
                    style={{
                      padding: '8px 12px',
                      background: '#f0f6ff',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  >
                    Bulk: Present {bp} | Half {bh} |{' '}
                    <strong>Man-Days: {bp + bh * 0.5}</strong>
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

// ── INVOICE ───────────────────────────────────────────
function Invoice({
  sites,
  attendance,
  assignments,
  invoices,
  setInvoices,
  company,
  setCompany,
  client,
  setClient,
  bank,
  setBank,
}) {
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [selSite, setSelSite] = useState('all');
  const [viewInv, setViewInv] = useState(null);
  const [tab, setTab] = useState('new');
  const rangeDates = getDates(fromDate, toDate);
  const getManDays = (siteId) => {
    const sa = assignments[siteId] || {};
    const aids = Object.keys(sa).map(Number);
    let t = 0;
    aids.forEach((wid) =>
      rangeDates.forEach((d) => {
        const v = attendance[`${d}_${siteId}_${wid}`];
        if (v === 'Present') t++;
        else if (v === 'Half') t += 0.5;
      })
    );
    rangeDates.forEach((d) => {
      const bk = attendance[`bulk_${d}_${siteId}`] || {};
      t += (bk.present || 0) + (bk.half || 0) * 0.5;
    });
    return t;
  };
  const filtSites =
    selSite === 'all' ? sites : sites.filter((s) => s.id === Number(selSite));
  const allWorks = filtSites.flatMap((s) =>
    (s.works || []).map((w) => ({
      ...w,
      siteId: s.id,
      siteName: s.name,
      amount: (w.area || 0) * (w.rate || 0),
    }))
  );
  const total = allWorks.reduce((a, w) => a + w.amount, 0);
  const [invNum, setInvNum] = useState(`INV-${new Date().getFullYear()}-001`);
  const [invDate, setInvDate] = useState(today);
  const saveInv = () => {
    setInvoices((p) => [
      ...p,
      {
        id: Date.now(),
        number: invNum,
        date: invDate,
        total,
        works: allWorks,
        fromDate,
        toDate,
      },
    ]);
    setTab('history');
  };
  const fmtDate = (d) => {
    if (!d) return '—';
    const [y, m, dy] = d.split('-');
    return `${dy}/${m}/${y}`;
  };
  const upC = (k, v) => setCompany((p) => ({ ...p, [k]: v }));
  const upCl = (k, v) => setClient((p) => ({ ...p, [k]: v }));
  const upB = (k, v) => setBank((p) => ({ ...p, [k]: v }));
  const tip = (
    <span
      style={{
        fontSize: '10px',
        color: '#60a5fa',
        marginLeft: '6px',
        fontStyle: 'italic',
      }}
    >
      ✎ tap to edit
    </span>
  );

  // ── Signature state ──
  const sigCanvas = useRef(null);
  const [sigMode, setSigMode] = useState('none'); // "none"|"draw"|"image"
  const [sigImage, setSigImage] = useState(null); // data-url
  const [sigDrawing, setSigDrawing] = useState(false);
  const lastPt = useRef(null);

  const startDraw = (e) => {
    setSigDrawing(true);
    const r = sigCanvas.current.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
    lastPt.current = { x, y };
  };
  const draw = (e) => {
    if (!sigDrawing) return;
    e.preventDefault();
    const r = sigCanvas.current.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
    const ctx = sigCanvas.current.getContext('2d');
    ctx.strokeStyle = '#1a2b4a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPt.current.x, lastPt.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastPt.current = { x, y };
  };
  const endDraw = () => {
    setSigDrawing(false);
    setSigImage(sigCanvas.current.toDataURL());
  };
  const clearSig = () => {
    const ctx = sigCanvas.current?.getContext('2d');
    ctx?.clearRect(0, 0, 300, 100);
    setSigImage(null);
  };
  const uploadSig = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => setSigImage(ev.target.result);
    r.readAsDataURL(f);
  };

  const InvDoc = ({ inv }) => {
    const works = inv ? inv.works : allWorks;
    const tot = inv ? inv.total : total;
    const num = inv ? inv.number : invNum;
    const dt = inv ? fmtDate(inv.date) : fmtDate(invDate);
    const editable = !inv;
    return (
      <div
        style={{
          maxWidth: '750px',
          margin: '0 auto',
          background: '#fff',
          padding: '28px',
          borderRadius: '12px',
          boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
          fontSize: '13px',
        }}
      >
        {/* ── Company header ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            paddingBottom: '16px',
            borderBottom: '2px solid #0f3172',
            marginBottom: '16px',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: '#0f3172',
                marginBottom: '4px',
              }}
            >
              {editable ? (
                <EditField
                  value={company.name}
                  onChange={(v) => upC('name', v)}
                  style={{
                    fontSize: '20px',
                    fontWeight: 800,
                    color: '#0f3172',
                  }}
                />
              ) : (
                company.name
              )}
            </div>
            <div
              style={{ fontSize: '11px', color: '#6b84a3', lineHeight: '1.9' }}
            >
              {editable ? (
                <EditField
                  value={company.address}
                  onChange={(v) => upC('address', v)}
                  style={{ fontSize: '11px', color: '#6b84a3' }}
                />
              ) : (
                company.address
              )}
              <br />
              Ph:{' '}
              {editable ? (
                <EditField
                  value={company.phone}
                  onChange={(v) => upC('phone', v)}
                  style={{ fontSize: '11px', color: '#6b84a3' }}
                />
              ) : (
                company.phone
              )}
              <br />
              GSTIN:{' '}
              {editable ? (
                <EditField
                  value={company.gstin}
                  onChange={(v) => upC('gstin', v)}
                  style={{ fontSize: '11px', color: '#6b84a3' }}
                />
              ) : (
                company.gstin
              )}
              <br />
              Udyam:{' '}
              {editable ? (
                <EditField
                  value={company.udyam}
                  onChange={(v) => upC('udyam', v)}
                  style={{ fontSize: '11px', color: '#6b84a3' }}
                />
              ) : (
                company.udyam
              )}
            </div>
          </div>
          {/* Invoice No + Date — always editable on new invoice */}
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: '#0f3172',
                marginBottom: '6px',
              }}
            >
              INVOICE
            </div>
            <div
              style={{ fontSize: '11px', color: '#6b84a3', lineHeight: '2.2' }}
            >
              <strong>No: </strong>
              {editable ? (
                <input
                  value={invNum}
                  onChange={(e) => setInvNum(e.target.value)}
                  style={{
                    border: '1.5px solid #bfdbfe',
                    borderRadius: '5px',
                    padding: '2px 6px',
                    fontSize: '11px',
                    outline: 'none',
                    width: '130px',
                    color: '#1a2b4a',
                    fontFamily: 'inherit',
                  }}
                />
              ) : (
                num
              )}
              <br />
              <strong>Date: </strong>
              {editable ? (
                <input
                  type="date"
                  value={invDate}
                  onChange={(e) => setInvDate(e.target.value)}
                  style={{
                    border: '1.5px solid #bfdbfe',
                    borderRadius: '5px',
                    padding: '2px 6px',
                    fontSize: '11px',
                    outline: 'none',
                    width: '140px',
                    color: '#1a2b4a',
                    fontFamily: 'inherit',
                  }}
                />
              ) : (
                dt
              )}
            </div>
          </div>
        </div>

        {/* ── Bill To ── */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              flex: 1,
              padding: '14px 16px',
              background: '#f0f6ff',
              borderRadius: '9px',
              minWidth: '200px',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#6b84a3',
                marginBottom: '8px',
                letterSpacing: '.05em',
              }}
            >
              BILL TO {editable && tip}
            </div>
            <div style={{ fontSize: '11px', lineHeight: '2.1' }}>
              <span style={{ fontWeight: 600, color: '#6b84a3' }}>To: </span>
              {editable ? (
                <EditField
                  value={client.sendTo}
                  onChange={(v) => upCl('sendTo', v)}
                  placeholder="Recipient name / dept"
                  style={{ fontSize: '11px' }}
                />
              ) : (
                client.sendTo
              )}
              <br />
              <span style={{ fontWeight: 600, color: '#6b84a3' }}>
                Company:{' '}
              </span>
              {editable ? (
                <EditField
                  value={client.name}
                  onChange={(v) => upCl('name', v)}
                  style={{ fontWeight: 700, fontSize: '11px' }}
                />
              ) : (
                <strong>{client.name}</strong>
              )}
              <br />
              <span style={{ fontWeight: 600, color: '#6b84a3' }}>Place: </span>
              {editable ? (
                <EditField
                  value={client.place}
                  onChange={(v) => upCl('place', v)}
                  style={{ fontSize: '11px' }}
                />
              ) : (
                client.place
              )}
              {' — '}
              {editable ? (
                <EditField
                  value={client.pincode}
                  onChange={(v) => upCl('pincode', v)}
                  placeholder="Pincode"
                  style={{ fontSize: '11px', width: '70px' }}
                />
              ) : (
                client.pincode
              )}
              <br />
              <span style={{ fontWeight: 600, color: '#6b84a3' }}>Ph: </span>
              {editable ? (
                <EditField
                  value={client.phone}
                  onChange={(v) => upCl('phone', v)}
                  placeholder="Phone number"
                  style={{ fontSize: '11px' }}
                />
              ) : (
                client.phone
              )}
            </div>
            {/* Gap then Measurement Sheet No */}
            <div
              style={{
                marginTop: '14px',
                paddingTop: '10px',
                borderTop: '1px dashed #bfdbfe',
              }}
            >
              <span
                style={{ fontWeight: 600, color: '#6b84a3', fontSize: '11px' }}
              >
                Measurement Sheet No:{' '}
              </span>
              {editable ? (
                <EditField
                  value={client.measureNo}
                  onChange={(v) => upCl('measureNo', v)}
                  placeholder="Enter sheet no."
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#1a2b4a',
                  }}
                />
              ) : (
                <strong>{client.measureNo || '—'}</strong>
              )}
            </div>
          </div>
        </div>

        {/* ── Works table ── */}
        <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '12px',
            }}
          >
            <thead>
              <tr style={{ background: '#0f3172', color: '#fff' }}>
                {[
                  'S.No',
                  'Description',
                  'Area (m²)',
                  'Rate (₹)',
                  'Amount (₹)',
                ].map((h, i) => (
                  <th
                    key={h}
                    style={{
                      padding: '8px 9px',
                      textAlign: i > 1 ? 'right' : 'left',
                      fontWeight: 600,
                      fontSize: '11px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {works.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: '16px',
                      textAlign: 'center',
                      color: '#9db3cc',
                    }}
                  >
                    No work entries. Add them in Sites → Work Entries.
                  </td>
                </tr>
              )}
              {works.map((w, i) => (
                <tr
                  key={w.id || i}
                  style={{
                    borderBottom: '1px solid #f0f4f9',
                    background: i % 2 === 0 ? '#fff' : '#f8faff',
                  }}
                >
                  <td
                    style={{
                      padding: '8px 9px',
                      color: '#6b84a3',
                      textAlign: 'center',
                    }}
                  >
                    {i + 1}
                  </td>
                  <td style={{ padding: '8px 9px' }}>
                    {w.siteName}
                    {w.place ? ` — ${w.place}` : ''}
                  </td>
                  <td style={{ padding: '8px 9px', textAlign: 'right' }}>
                    {w.area} m²
                  </td>
                  <td style={{ padding: '8px 9px', textAlign: 'right' }}>
                    ₹{w.rate}
                  </td>
                  <td
                    style={{
                      padding: '8px 9px',
                      fontWeight: 700,
                      textAlign: 'right',
                    }}
                  >
                    ₹{w.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
              <tr style={{ background: '#0f3172', color: '#fff' }}>
                <td
                  colSpan={4}
                  style={{
                    padding: '10px 9px',
                    fontWeight: 700,
                    textAlign: 'right',
                  }}
                >
                  TOTAL
                </td>
                <td
                  style={{
                    padding: '10px 9px',
                    fontWeight: 800,
                    fontSize: '14px',
                    textAlign: 'right',
                  }}
                >
                  ₹{tot.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Bank + Signature ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginTop: '20px',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          {/* Bank */}
          <div
            style={{
              padding: '12px 14px',
              background: '#f8faff',
              borderRadius: '9px',
              fontSize: '11px',
              lineHeight: '2',
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: '3px' }}>
              Bank Details {editable && tip}
            </div>
            Acc Name:{' '}
            {editable ? (
              <EditField
                value={bank.accName}
                onChange={(v) => upB('accName', v)}
                style={{ fontSize: '11px' }}
              />
            ) : (
              bank.accName
            )}
            <br />
            Bank:{' '}
            {editable ? (
              <EditField
                value={bank.bank}
                onChange={(v) => upB('bank', v)}
                style={{ fontSize: '11px' }}
              />
            ) : (
              bank.bank
            )}
            <br />
            A/C No:{' '}
            {editable ? (
              <EditField
                value={bank.accNo}
                onChange={(v) => upB('accNo', v)}
                style={{ fontSize: '11px' }}
              />
            ) : (
              bank.accNo
            )}
            <br />
            IFSC:{' '}
            {editable ? (
              <EditField
                value={bank.ifsc}
                onChange={(v) => upB('ifsc', v)}
                style={{ fontSize: '11px' }}
              />
            ) : (
              bank.ifsc
            )}
            <br />
            UPI:{' '}
            {editable ? (
              <EditField
                value={bank.upi}
                onChange={(v) => upB('upi', v)}
                style={{ fontSize: '11px' }}
              />
            ) : (
              bank.upi
            )}
          </div>

          {/* Signature */}
          <div style={{ textAlign: 'center', minWidth: '180px' }}>
            {/* Seal / signature area */}
            <div
              style={{
                width: '180px',
                height: '90px',
                border: '1.5px dashed #bfdbfe',
                borderRadius: '8px',
                marginBottom: '6px',
                overflow: 'hidden',
                position: 'relative',
                background: '#fafcff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {sigImage ? (
                <img
                  src={sigImage}
                  alt="signature"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                />
              ) : sigMode === 'draw' ? (
                <canvas
                  ref={sigCanvas}
                  width={180}
                  height={90}
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={endDraw}
                  onMouseLeave={endDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={endDraw}
                  style={{
                    cursor: 'crosshair',
                    touchAction: 'none',
                    display: 'block',
                  }}
                />
              ) : (
                <span style={{ fontSize: '11px', color: '#9db3cc' }}>
                  Seal / Signature
                </span>
              )}
            </div>

            {/* Controls — hidden in print */}
            {editable && (
              <div
                className="no-print"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '4px',
                  justifyContent: 'center',
                  marginBottom: '6px',
                }}
              >
                <button
                  onClick={() => {
                    setSigMode('draw');
                    setSigImage(null);
                    setTimeout(() => {
                      const ctx = sigCanvas.current?.getContext('2d');
                      ctx?.clearRect(0, 0, 300, 100);
                    }, 50);
                  }}
                  style={{
                    ...S.btn('#f0f6ff', '#1e50a0'),
                    padding: '4px 8px',
                    fontSize: '10px',
                  }}
                >
                  ✏️ Draw
                </button>
                <label
                  style={{
                    ...S.btn('#f0f6ff', '#1e50a0'),
                    padding: '4px 8px',
                    fontSize: '10px',
                    cursor: 'pointer',
                  }}
                >
                  📁 Upload
                  <input
                    type="file"
                    accept="image/*"
                    onChange={uploadSig}
                    style={{ display: 'none' }}
                  />
                </label>
                {(sigImage || sigMode === 'draw') && (
                  <button
                    onClick={() => {
                      clearSig();
                      setSigMode('none');
                    }}
                    style={{
                      ...S.btn('#fee2e2', '#991b1b'),
                      padding: '4px 8px',
                      fontSize: '10px',
                    }}
                  >
                    ✗ Clear
                  </button>
                )}
              </div>
            )}

            <div
              style={{
                borderTop: '1px solid #1a2b4a',
                paddingTop: '5px',
                fontSize: '11px',
                color: '#6b84a3',
              }}
            >
              Authorised Signatory
              <br />
              <strong>
                {editable ? (
                  <EditField
                    value={company.name}
                    onChange={(v) => upC('name', v)}
                    style={{ fontSize: '11px' }}
                  />
                ) : (
                  company.name
                )}
              </strong>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <h2 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: 800 }}>
        🧾 Invoice
      </h2>
      <div
        style={{ display: 'flex', gap: '7px', marginBottom: '20px' }}
        className="no-print"
      >
        {[
          ['new', '➕ New'],
          ['history', '📁 History'],
        ].map(([t, lbl]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={S.btn(
              tab === t ? '#1e50a0' : '#e5e7eb',
              tab === t ? '#fff' : '#374151'
            )}
          >
            {lbl}
          </button>
        ))}
      </div>
      {tab === 'new' && (
        <>
          <div style={{ ...S.card, marginBottom: '16px' }} className="no-print">
            <h3
              style={{ margin: '0 0 11px', fontSize: '13px', fontWeight: 700 }}
            >
              Invoice Settings
            </h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '120px' }}>
                <label style={S.lbl}>From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  style={S.inp}
                />
              </div>
              <div style={{ flex: 1, minWidth: '120px' }}>
                <label style={S.lbl}>To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  style={S.inp}
                />
              </div>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label style={S.lbl}>Site</label>
                <select
                  value={selSite}
                  onChange={(e) => setSelSite(e.target.value)}
                  style={S.inp}
                >
                  <option value="all">All Sites</option>
                  {sites.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '9px', marginTop: '12px' }}>
              <button
                onClick={() => setTimeout(() => window.print(), 100)}
                style={S.btn()}
              >
                🖨️ Print / PDF
              </button>
              <button onClick={saveInv} style={S.btn('#166534')}>
                💾 Save
              </button>
            </div>
          </div>
          <InvDoc inv={null} />
        </>
      )}
      {tab === 'history' &&
        (viewInv ? (
          <>
            <div
              style={{ display: 'flex', gap: '9px', marginBottom: '16px' }}
              className="no-print"
            >
              <button
                onClick={() => setViewInv(null)}
                style={S.btn('#f0f4f9', '#1a2b4a')}
              >
                ← Back
              </button>
              <button
                onClick={() => setTimeout(() => window.print(), 100)}
                style={S.btn()}
              >
                🖨️ Print
              </button>
            </div>
            <InvDoc inv={viewInv} />
          </>
        ) : (
          <div style={S.card}>
            <h3
              style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700 }}
            >
              Saved Invoices
            </h3>
            {invoices.length === 0 ? (
              <p style={{ color: '#9db3cc', fontSize: '13px' }}>
                No invoices saved yet.
              </p>
            ) : (
              invoices.map((inv) => (
                <div
                  key={inv.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 13px',
                    background: '#f8faff',
                    borderRadius: '9px',
                    marginBottom: '6px',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>
                      {inv.number}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b84a3' }}>
                      {inv.date} · {inv.fromDate}→{inv.toDate}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: '7px',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        color: '#166534',
                        fontSize: '13px',
                      }}
                    >
                      ₹{inv.total.toLocaleString()}
                    </div>
                    <button
                      onClick={() => setViewInv(inv)}
                      style={{
                        ...S.btn(),
                        padding: '5px 11px',
                        fontSize: '12px',
                      }}
                    >
                      View
                    </button>
                    <button
                      onClick={() =>
                        setInvoices((p) => p.filter((i) => i.id !== inv.id))
                      }
                      style={{
                        ...S.btn('#fee2e2', '#991b1b'),
                        padding: '5px 11px',
                        fontSize: '12px',
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ))}
    </div>
  );
}
