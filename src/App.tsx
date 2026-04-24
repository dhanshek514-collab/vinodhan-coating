import { useState, useRef, useEffect, useCallback } from "react";
const FB_PROJECT = "vinodhan-coating";
const FB_API_KEY = import.meta.env.VITE_FB_API_KEY;
const FB_BASE    = `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/vinodhan`;

async function fbGet(docId, fallback) {
  try {
    const res = await fetch(`${FB_BASE}/${docId}?key=${FB_API_KEY}`);
    if(!res.ok) return fallback;
    const json = await res.json();
    return JSON.parse(json.fields?.data?.stringValue ?? JSON.stringify(fallback));
  } catch { return fallback; }
}
async function fbSet(docId, data) {
  try {
    await fetch(`${FB_BASE}/${docId}?key=${FB_API_KEY}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: { data: { stringValue: JSON.stringify(data) } } })
    });
  } catch(e) { console.error("fbSet error", e); }
}
async function fbBackup(data) {
  try {
    const backupId = new Date().toISOString().split("T")[0]; // e.g. "2026-04-17"
    await fetch(`${FB_BASE}/backup_${backupId}?key=${FB_API_KEY}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: { data: { stringValue: JSON.stringify(data) } } })
    });
  } catch(e) { console.error("backup error", e); }
}
const printCSS = `@page{size:A4;margin:0;}body{font-family:'Segoe UI',sans-serif;color:#1a2b4a;background:#fff;padding:15mm;margin:0;}table{border-collapse:collapse;width:100%;}th,td{padding:6px 8px;}img{max-width:100%;object-fit:cover;}.no-print{display:none!important;}`;
function printSection(id) {
  const el = document.getElementById(id);
  if(!el) return;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>VinoDhan Coating</title><style>${printCSS}</style></head><body onload="window.print();">${el.outerHTML}</body></html>`;
  const existing = document.getElementById("print-overlay");
  if(existing) document.body.removeChild(existing);
  const overlay = document.createElement("div");
  overlay.id="print-overlay";
  overlay.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;background:#f0f4f9;z-index:99999;display:flex;flex-direction:column;font-family:'Segoe UI',sans-serif;";
  const bar = document.createElement("div");
  bar.style.cssText="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;background:#0f3172;flex-shrink:0;gap:10px;flex-wrap:wrap;";
  const backBtn = document.createElement("button");
  backBtn.innerText="← Back";
  backBtn.style.cssText="background:rgba(255,255,255,0.15);color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;";
  backBtn.onclick=()=>document.body.removeChild(overlay);
  const title = document.createElement("div");
  title.innerText="Preview — scroll to review";
  title.style.cssText="color:#fff;font-size:13px;font-weight:600;flex:1;text-align:center;";
  const dlBtn = document.createElement("button");
  dlBtn.innerText="⬇️ Download & Print";
  dlBtn.style.cssText="background:#f59e0b;color:#1a1a1a;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:800;cursor:pointer;";
  dlBtn.onclick=()=>{
    const encoded="data:text/html;charset=utf-8,"+encodeURIComponent(html);
    const a=document.createElement("a");
    a.href=encoded; a.download="VinoDhan-Document.html";
    a.style.display="none";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };
  bar.appendChild(backBtn); bar.appendChild(title); bar.appendChild(dlBtn);
  const content=document.createElement("div");
  content.style.cssText="flex:1;overflow-y:auto;padding:24px;background:#f0f4f9;";
  content.innerHTML=el.outerHTML;
  overlay.appendChild(bar); overlay.appendChild(content);
  document.body.appendChild(overlay);
}

const USERS = [
  { id:"DHANS1416", name:"DS", role:"Owner", password:"Riseup1416" },
  { id:"Site Executive", name:"Vinoth Kumar. N", role:"Site Executive", password:"Vinoth1024" },
];
const USER_PHONES = { "DHANS1416":"9488246119", "Site Executive":"9486971024" };
const CATEGORIES = ["Applicator","Semi-Applicator","Helper"];
const CAT_COLOR = {
  "Applicator":      { bg:"#dbeafe", color:"#1e40af" },
  "Semi-Applicator": { bg:"#ede9fe", color:"#5b21b6" },
  "Helper":          { bg:"#dcfce7", color:"#166534" },
};
const WORK_TYPES = ["SQM","RMT","Manpower","KGS","Other"];
const WORK_TYPE_COLOR = {
  "SQM":      { bg:"#dbeafe", color:"#1e40af" },
  "RMT":      { bg:"#ede9fe", color:"#5b21b6" },
  "Manpower": { bg:"#fef3c7", color:"#d97706" },
  "KGS":      { bg:"#dcfce7", color:"#166534" },
  "Other":    { bg:"#fee2e2", color:"#991b1b" },
};
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const today = new Date().toISOString().split("T")[0];
const getDaysInMonth = (m,y) => new Date(y,m+1,0).getDate();
const fmtDate = d => { if(!d)return"—"; const [y,m,dy]=d.split("-"); return `${dy}/${m}/${y}`; };
const RECYCLE_PASSWORD = "ARUN9312";

const EMPTY_WORKER = { id:0, name:"", category:"Applicator", phone:"", aadhaar:"", doj:"", dob:"", photo:"" };
const EMPTY_EXEC = { name:"Vinoth Kumar. N", phone:"", aadhaar:"", doj:"", dob:"", photo:"" };
const INIT_WORKERS = Array.from({length:12},(_,i)=>({ id:i+1, name:`Worker ${i+1}`, category:i<4?"Applicator":i<8?"Semi-Applicator":"Helper", phone:"",aadhaar:"",doj:"",dob:"",photo:"" }));
const INIT_COMPANY = { name:"VinoDhan Coating", address:"Chennai, Tamil Nadu", phone:"+91 XXXXX XXXXX", gstin:"XX-XXXXXXXXX" };
const INIT_CLIENT  = { name:"Swathi Engineering Agency", sendTo:"", place:"Chennai", pincode:"600037", phone:"", measureNo:"" };
const INIT_BANK    = { accName:"VinoDhan Coating", bank:"Indian Bank", accNo:"XXXXXXXXXXXX", ifsc:"IDIB000XXXX", upi:"vinodhan@upi" };

const S = {
  btn:(bg="#1e50a0",color="#fff")=>({background:bg,color,border:"none",borderRadius:"8px",padding:"9px 18px",fontWeight:600,fontSize:"13px",cursor:"pointer"}),
  card:{ background:"#fff",borderRadius:"14px",boxShadow:"0 2px 16px rgba(30,80,160,0.08)",padding:"20px" },
  inp:{ width:"100%",padding:"9px 12px",borderRadius:"8px",border:"1.5px solid #bfdbfe",fontSize:"13px",outline:"none",boxSizing:"border-box",color:"#1a2b4a" },
  lbl:{ fontSize:"12px",fontWeight:600,color:"#6b84a3",display:"block",marginBottom:"4px" },
  badge:cat=>({...CAT_COLOR[cat],fontSize:"11px",fontWeight:600,borderRadius:"20px",padding:"2px 10px",display:"inline-block"}),
  wbadge:type=>({...WORK_TYPE_COLOR[type],fontSize:"10px",fontWeight:700,borderRadius:"20px",padding:"2px 8px",display:"inline-block"}),
};

function loadS(key,fallback){try{const v=localStorage.getItem(key);return v?JSON.parse(v):fallback;}catch{return fallback;}}
function saveS(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}}

function calcWork(w){
  if(w.workType==="Manpower") return (Number(w.labour)||0)*(Number(w.rate)||0);
  if(w.workType==="Other") return Number(w.amount)||0;
  return (Number(w.area)||0)*(Number(w.rate)||0);
}
function workUnitLabel(w){
  if(w.workType==="RMT") return `${w.area}rmt × ₹${w.rate}`;
  if(w.workType==="Manpower") return `${w.labour} Labour × ₹${w.rate}/day`;
  if(w.workType==="KGS") return `${w.area}kgs × ₹${w.rate}`;
  if(w.workType==="Other") return `₹${w.amount}`;
  return `${w.area}m² × ₹${w.rate}`;
}

// ── LOGO ──────────────────────────────────────────────
function LogoHex({size=48}){
  const cx=size/2,r=size*0.46,ri=size*0.38;
  const pts=rad=>Array.from({length:6},(_,i)=>{const a=Math.PI/180*(60*i-30);return `${cx+rad*Math.cos(a)},${cx+rad*Math.sin(a)}`;}).join(" ");
  const lw=size*0.38,lx=cx-lw/2,lh=size*0.072,dotY=cx+size*0.16,dotCount=5,dotGap=lw/(dotCount+1);
  return(
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id="lg1" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#d97706"/><stop offset="100%" stopColor="#f59e0b"/></linearGradient>
        <linearGradient id="lg2" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#92400e"/><stop offset="100%" stopColor="#b45309"/></linearGradient>
        <linearGradient id="lg3" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#451a03"/><stop offset="100%" stopColor="#78350f"/></linearGradient>
      </defs>
      <polygon points={pts(r)} fill="none" stroke="#f59e0b" strokeWidth={size*0.03}/>
      <polygon points={pts(ri)} fill="#162a4a"/>
      <rect x={lx} y={dotY+lh*0.2} width={lw} height={lh} rx={2} fill="url(#lg1)"/>
      <rect x={lx} y={dotY-lh*0.9} width={lw} height={lh} rx={2} fill="url(#lg2)"/>
      <rect x={lx} y={dotY-lh*2.0} width={lw} height={lh} rx={2} fill="url(#lg3)"/>
      {Array.from({length:dotCount},(_,i)=><circle key={i} cx={lx+dotGap*(i+1)} cy={dotY+lh*0.7} r={size*0.022} fill="#fff" fillOpacity={0.6}/>)}
      <line x1={cx} y1={dotY-lh*2.2} x2={cx} y2={dotY-lh*3.5} stroke="#9ca3af" strokeWidth={size*0.04} strokeLinecap="round"/>
      <line x1={cx} y1={dotY-lh*3.5} x2={cx+size*0.14} y2={dotY-lh*3.5} stroke="#9ca3af" strokeWidth={size*0.04} strokeLinecap="round"/>
      <line x1={cx+size*0.14} y1={dotY-lh*3.5} x2={cx+size*0.14} y2={dotY-lh*2.5} stroke="#9ca3af" strokeWidth={size*0.04} strokeLinecap="round"/>
      <rect x={cx-size*0.18} y={dotY-lh*2.5} width={size*0.36} height={size*0.1} rx={size*0.05} fill="#d1d5db"/>
    </svg>
  );
}

function ErrBox({msg}){return <div style={{color:"#dc2626",fontSize:"12px",marginBottom:"12px",padding:"8px 12px",background:"#fee2e2",borderRadius:"8px"}}>{msg}</div>;}
function SuccessBox({msg}){return <div style={{color:"#166534",fontSize:"12px",marginBottom:"12px",padding:"8px 12px",background:"#dcfce7",borderRadius:"8px"}}>✅ {msg}</div>;}

function EditField({value,onChange,style={},placeholder="Click to edit"}){
  const [editing,setEditing]=useState(false);
  const [val,setVal]=useState(value);
  const commit=()=>{onChange(val);setEditing(false);};
  if(editing) return <input value={val} onChange={e=>setVal(e.target.value)} onBlur={commit} autoFocus onKeyDown={e=>{if(e.key==="Enter")commit();if(e.key==="Escape")setEditing(false);}} style={{...style,border:"1.5px solid #60a5fa",borderRadius:"4px",padding:"2px 6px",outline:"none",fontSize:"inherit",fontWeight:"inherit",fontFamily:"inherit",background:"#eff6ff",boxSizing:"border-box"}}/>;
  return <span onClick={()=>{setVal(value);setEditing(true);}} title="Click to edit" style={{...style,cursor:"text",borderBottom:"1px dashed #bfdbfe",minWidth:"40px",display:"inline-block"}}>{value||<span style={{color:"#9db3cc",fontStyle:"italic"}}>{placeholder}</span>}</span>;
}

function PhotoUpload({value,onChange}){
  const handle=e=>{e.stopPropagation();const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>onChange(ev.target.result);r.readAsDataURL(f);};
  return(
    <div style={{marginBottom:"10px"}} onClick={e=>e.stopPropagation()}>
      <label style={S.lbl}>Photo</label>
      <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
        {value?<img src={value} style={{width:"56px",height:"56px",borderRadius:"8px",objectFit:"cover",border:"1.5px solid #bfdbfe"}}/>
        :<div style={{width:"56px",height:"56px",borderRadius:"8px",background:"#f0f4f9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",border:"1.5px dashed #bfdbfe"}}>👤</div>}
        <div style={{display:"flex",gap:"6px",alignItems:"center"}}>
          <label onClick={e=>e.stopPropagation()} style={{...S.btn("#f0f6ff","#1e50a0"),padding:"6px 12px",fontSize:"12px",cursor:"pointer",display:"inline-block"}}>
            📷 {value?"Change":"Upload"} Photo
            <input type="file" accept="image/*" onChange={handle} style={{display:"none"}} onClick={e=>e.stopPropagation()}/>
          </label>
          {value&&<button type="button" onClick={e=>{e.stopPropagation();onChange("");}} style={{...S.btn("#fee2e2","#991b1b"),padding:"6px 10px",fontSize:"12px"}}>✗</button>}
        </div>
      </div>
    </div>
  );
}

// ── PASSWORD MODAL ────────────────────────────────────
function PwModal({title,onConfirm,onCancel}){
  const [pw,setPw]=useState("");
  const [err,setErr]=useState("");
  const confirm=()=>{
    if(pw!==RECYCLE_PASSWORD){setErr("❌ Incorrect password.");return;}
    onConfirm();
  };
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:3000}}>
      <div style={{background:"#fff",borderRadius:"16px",padding:"28px",width:"300px",textAlign:"center"}}>
        <div style={{fontSize:"32px",marginBottom:"8px"}}>🔐</div>
        <h3 style={{margin:"0 0 7px"}}>{title||"Confirm Action"}</h3>
        <p style={{fontSize:"12px",color:"#6b84a3",margin:"0 0 16px"}}>Enter password to confirm.</p>
        <input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="Enter password" onKeyDown={e=>e.key==="Enter"&&confirm()} style={{...S.inp,marginBottom:"10px",textAlign:"center"}}/>
        {err&&<ErrBox msg={err}/>}
        <div style={{display:"flex",gap:"9px",justifyContent:"center"}}>
          <button onClick={confirm} style={S.btn("#dc2626")}>Confirm</button>
          <button onClick={onCancel} style={S.btn("#f0f4f9","#1a2b4a")}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────
export default function App(){
const [user,setUser] = useState(()=>{const u=loadS("vd_user",null);return u&&u.id?u:null;});
  const [page,setPage]           = useState("dashboard");
  const [landscape,setLandscape] = useState(true);
  const [showWarning,setShowWarning] = useState(false);
  const [countdown,setCountdown] = useState(30);
  const [ready,setReady]         = useState(false);
  const [lastBackup,setLastBackup] = useState(null);
  const [workers,setWorkers]     = useState(INIT_WORKERS);
  const [execProfile,setExecProfile] = useState(EMPTY_EXEC);
  const [sites,setSites]         = useState([{id:1,name:"Site A",client:"Swathi Engineering Agency",status:"Active",works:[]}]);
  const [attendance,setAttendance] = useState({});
  const [assignments,setAssignments] = useState({});
  const [invoices,setInvoices]   = useState([]);
  const [company,setCompany]     = useState(INIT_COMPANY);
  const [client,setClient]       = useState(INIT_CLIENT);
  const [bank,setBank]           = useState(INIT_BANK);
  const [passwords,setPasswords] = useState({"DHANS1416":"Riseup1416","Site Executive":"Vinoth1024"});
  const [recycleBin,setRecycleBin] = useState({sites:[],invoices:[]});

  useEffect(()=>{
    async function loadAll(){
      const [w,e,s,a,as,inv,co,cl,b,pw,rb] = await Promise.all([
        fbGet("workers",INIT_WORKERS),
        fbGet("exec",EMPTY_EXEC),
        fbGet("sites",[{id:1,name:"Site A",client:"Swathi Engineering Agency",status:"Active",works:[]}]),
        fbGet("attendance",{}),
        fbGet("assignments",{}),
        fbGet("invoices",[]),
        fbGet("company",INIT_COMPANY),
        fbGet("client",INIT_CLIENT),
        fbGet("bank",INIT_BANK),
        fbGet("passwords",{"DHANS1416":"Riseup1416","Site Executive":"Vinoth1024"}),
        fbGet("recycleBin",{sites:[],invoices:[]}),
      ]);
      setWorkers(w);setExecProfile(e);setSites(s);
      setAttendance(a);setAssignments(as);setInvoices(inv);
      setCompany(co);setClient(cl);setBank(b);setPasswords(pw);
      setRecycleBin(rb);setReady(true);
const todayDate=new Date().toISOString().split("T")[0];
const lastB=localStorage.getItem("vd_last_backup");
if(lastB!==todayDate){
  setLastBackup(todayDate);
}
    }
    loadAll();
  },[]);

  useEffect(()=>{if(!ready)return;saveS("vd_workers",workers);fbSet("workers",workers);},[workers,ready]);
  useEffect(()=>{if(!ready)return;saveS("vd_exec",execProfile);fbSet("exec",execProfile);},[execProfile,ready]);
  useEffect(()=>{if(!ready)return;saveS("vd_sites",sites);fbSet("sites",sites);},[sites,ready]);
  useEffect(()=>{if(!ready)return;saveS("vd_attendance",attendance);fbSet("attendance",attendance);},[attendance,ready]);
  useEffect(()=>{if(!ready)return;saveS("vd_assignments",assignments);fbSet("assignments",assignments);},[assignments,ready]);
  useEffect(()=>{if(!ready)return;saveS("vd_invoices",invoices);fbSet("invoices",invoices);},[invoices,ready]);
  useEffect(()=>{if(!ready)return;saveS("vd_company",company);fbSet("company",company);},[company,ready]);
  useEffect(()=>{if(!ready)return;saveS("vd_client",client);fbSet("client",client);},[client,ready]);
  useEffect(()=>{if(!ready)return;saveS("vd_bank",bank);fbSet("bank",bank);},[bank,ready]);
  useEffect(()=>{if(!ready)return;saveS("vd_passwords",passwords);fbSet("passwords",passwords);},[passwords,ready]);
  useEffect(()=>{if(!ready)return;saveS("vd_recyclebin",recycleBin);fbSet("recycleBin",recycleBin);},[recycleBin,ready]);
useEffect(()=>{
  if(!ready||!lastBackup)return;
  const todayDate=new Date().toISOString().split("T")[0];
  const lastB=localStorage.getItem("vd_last_backup");
  if(lastB===todayDate)return;
  fbBackup({workers,execProfile,sites,attendance,assignments,invoices,company,client,bank,passwords,recycleBin});
  localStorage.setItem("vd_last_backup",todayDate);
},[lastBackup,ready]);
  
  const logoutTimer=useRef(null);
  const warningTimer=useRef(null);
  const countdownRef=useRef(null);
  const doLogout=useCallback(()=>{setShowWarning(false);saveS("vd_user",null);setUser(null);setPage("dashboard");},[]);
  const resetTimer=useCallback(()=>{
    if(!user)return;
    clearTimeout(logoutTimer.current);clearTimeout(warningTimer.current);clearInterval(countdownRef.current);
    setShowWarning(false);setCountdown(30);
    warningTimer.current=setTimeout(()=>{
  setShowWarning(true);setCountdown(30);
  countdownRef.current=setInterval(()=>setCountdown(p=>{if(p<=1){clearInterval(countdownRef.current);return 0;}return p-1;}),1000);
  logoutTimer.current=setTimeout(doLogout,30000);
},120000);
  },[user,doLogout]);

  useEffect(()=>{
    if(!user)return;
    const events=["mousemove","mousedown","keydown","touchstart","scroll","click"];
    events.forEach(e=>window.addEventListener(e,resetTimer,true));
    resetTimer();
    return()=>{events.forEach(e=>window.removeEventListener(e,resetTimer,true));clearTimeout(logoutTimer.current);clearTimeout(warningTimer.current);clearInterval(countdownRef.current);};
  },[user,resetTimer]);

  if(!ready) return(
    <div style={{minHeight:"100vh",background:"#0f3172",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{marginBottom:"20px"}}><LogoHex size={80}/></div>
      <div style={{color:"#fff",fontSize:"16px",fontWeight:700,marginBottom:"8px"}}>VinoDhan Coating</div>
      <div style={{color:"#f59e0b",fontSize:"12px"}}>Loading your data...</div>
    </div>
  );
  if(!user) return <LoginPage onLogin={setUser} passwords={passwords} setPasswords={setPasswords}/>;

  const ctx={user,workers,setWorkers,execProfile,setExecProfile,sites,setSites,attendance,setAttendance,assignments,setAssignments,invoices,setInvoices,company,setCompany,client,setClient,bank,setBank,recycleBin,setRecycleBin};

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100vh",fontFamily:"'Segoe UI',sans-serif",background:"#f0f4f9",color:"#1a2b4a",overflow:"hidden"}}>
      <TopBar user={user} page={page} setPage={setPage} landscape={landscape} setLandscape={setLandscape} setUser={setUser} recycleBin={recycleBin} setRecycleBin={setRecycleBin} sites={sites} setSites={setSites} invoices={invoices} setInvoices={setInvoices} workers={workers} setWorkers={setWorkers} execProfile={execProfile} setExecProfile={setExecProfile} attendance={attendance} setAttendance={setAttendance} assignments={assignments} setAssignments={setAssignments} company={company} setCompany={setCompany} client={client} setClient={setClient} bank={bank} setBank={setBank}/>
      <div style={{flex:1,overflowY:"auto",padding:landscape?"24px 28px":"16px 14px",paddingBottom:"80px"}}>
        {page==="dashboard"  && <Dashboard {...ctx} landscape={landscape}/>}
        {page==="sites"      && <Sites {...ctx}/>}
        {page==="workers"    && <Workers {...ctx}/>}
        {page==="attendance" && <Attendance {...ctx}/>}
        {page==="permit"     && <EntryPermit {...ctx}/>}
        {page==="invoice"    && <Invoice {...ctx}/>}
      </div>
      {showWarning&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:99998}}>
          <div style={{background:"#fff",borderRadius:"16px",padding:"32px",width:"300px",textAlign:"center",boxShadow:"0 8px 40px rgba(0,0,0,0.3)"}}>
            <div style={{fontSize:"40px",marginBottom:"12px"}}>⏱️</div>
            <h3 style={{margin:"0 0 8px",fontSize:"16px",color:"#1a2b4a"}}>Session Expiring</h3>
            <p style={{fontSize:"13px",color:"#6b84a3",margin:"0 0 8px"}}>You will be logged out due to inactivity in</p>
            <div style={{fontSize:"36px",fontWeight:800,color:"#dc2626",marginBottom:"20px"}}>{countdown}s</div>
            <button onClick={()=>{resetTimer();setShowWarning(false);}} style={{...S.btn("#1e50a0"),width:"100%",padding:"12px",fontSize:"14px"}}>Stay Logged In</button>
          </div>
        </div>
      )}
    </div>
  );
}
async function exportExcel({workers,sites,invoices,attendance,assignments}){
  const XLSX=await import("https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs");
  const wb=XLSX.utils.book_new();
  const swRows=[["Site No","Site Name","Client","Status","Place/Description","Work Type","Area/Labour","Rate (₹)","Amount (₹)","From Date","To Date"]];
  [...sites].sort((a,b)=>a.id-b.id).forEach((s,idx)=>{
    (s.works||[]).forEach(w=>{
      swRows.push([idx+1,s.name,s.client,s.status,w.place,w.workType||"SQM",w.workType==="Manpower"?w.labour:w.area,w.rate,w.workType==="Manpower"?(Number(w.labour)||0)*(Number(w.rate)||0):(Number(w.area)||0)*(Number(w.rate)||0),w.fromDate||"—",w.toDate||"—"]);
    });
  });
  const ws1=XLSX.utils.aoa_to_sheet(swRows);
  ws1["!cols"]=[{wch:8},{wch:20},{wch:25},{wch:12},{wch:30},{wch:12},{wch:14},{wch:10},{wch:14},{wch:12},{wch:12}];
  XLSX.utils.book_append_sheet(wb,ws1,"Sites & Works");
  const invRows=[["Invoice No","Date","Site Name","Client","Measure No","Description","Work Type","Unit","Rate (₹)","Amount (₹)","Invoice Total (₹)"]];
  [...invoices].sort((a,b)=>a.number.localeCompare(b.number,undefined,{numeric:true})).forEach(inv=>{
    const cl=inv.snapshot?.client||{};
    (inv.works||[]).forEach((w,i)=>{
      invRows.push([inv.number,inv.date||"—",inv.siteName||"—",cl.name||"—",inv.measureNo||"—",w.place,w.workType||"SQM",w.workType==="Manpower"?`${w.labour} Labour`:w.workType==="RMT"?`${w.area} rmt`:`${w.area} m²`,w.rate,w.amount||0,i===0?inv.total:""]);
    });
  });
  const ws2=XLSX.utils.aoa_to_sheet(invRows);
  ws2["!cols"]=[{wch:14},{wch:12},{wch:20},{wch:25},{wch:14},{wch:30},{wch:12},{wch:14},{wch:10},{wch:14},{wch:16}];
  XLSX.utils.book_append_sheet(wb,ws2,"Invoices");
  const wRows=[["Name","Category","Phone","Aadhaar","Date of Birth","Date of Joining"]];
  workers.forEach(w=>wRows.push([w.name,w.category,w.phone||"—",w.aadhaar||"—",w.dob||"—",w.doj||"—"]));
  const ws3=XLSX.utils.aoa_to_sheet(wRows);
  ws3["!cols"]=[{wch:20},{wch:18},{wch:14},{wch:16},{wch:14},{wch:14}];
  XLSX.utils.book_append_sheet(wb,ws3,"Workers");
  const attRows=[["Worker Name","Category","Site","Month","Total Present","Total Half","Total Days"]];
  const months={};
  Object.keys(attendance).forEach(key=>{
    const parts=key.split("_");
    const date=parts[0],siteId=parts[1],wid=parts[2];
    const month=date.slice(0,7);
    const k=`${month}_${siteId}_${wid}`;
    if(!months[k])months[k]={month,siteId,wid,present:0,half:0};
    if(attendance[key]==="Present")months[k].present++;
    if(attendance[key]==="Half")months[k].half+=0.5;
  });
  Object.values(months).forEach(r=>{
    const w=workers.find(x=>x.id===Number(r.wid));
    const s=sites.find(x=>x.id===Number(r.siteId));
    if(w&&s)attRows.push([w.name,w.category,s.name,r.month,r.present,r.half,r.present+r.half]);
  });
  const ws4=XLSX.utils.aoa_to_sheet(attRows);
  ws4["!cols"]=[{wch:20},{wch:18},{wch:20},{wch:10},{wch:14},{wch:12},{wch:12}];
  XLSX.utils.book_append_sheet(wb,ws4,"Attendance Summary");
  XLSX.writeFile(wb,`VinoDhan-Report-${new Date().toISOString().split("T")[0]}.xlsx`);
}
// ── TOP BAR ───────────────────────────────────────────
function TopBar({user,page,setPage,landscape,setLandscape,setUser,recycleBin,setRecycleBin,sites,setSites,invoices,setInvoices,workers,setWorkers,execProfile,setExecProfile,attendance,setAttendance,assignments,setAssignments,company,setCompany,client,setClient,bank,setBank}){
  const [drawerOpen,setDrawerOpen]=useState(false);
  const [showBin,setShowBin]=useState(false);
  const [pwModal,setPwModal]=useState(null);
  const [selBinSites,setSelBinSites]=useState([]);
const [selBinInvs,setSelBinInvs]=useState([]);
  const [importPwModal,setImportPwModal]=useState(false);
const [pendingFile,setPendingFile]=useState(null);
const [importPw,setImportPw]=useState("");
const [importPwErr,setImportPwErr]=useState("");
  const binCount=(recycleBin.sites||[]).length+(recycleBin.invoices||[]).length;

  const bottomNav=[
    {id:"dashboard",label:"Dash",icon:"📊"},
    {id:"sites",label:"Sites",icon:"🏗️"},
    {id:"workers",label:"Workers",icon:"👷"},
    {id:"attendance",label:"Attend",icon:"✅"},
    {id:"permit",label:"Permit",icon:"🪪"},
    {id:"invoice",label:"Invoice",icon:"🧾"},
  ];

  const restoreSite=s=>{setSites(p=>[...p,s]);setRecycleBin(p=>({...p,sites:(p.sites||[]).filter(x=>x.id!==s.id)}));};
  const restoreInv=inv=>{setInvoices(p=>[...p,inv]);setRecycleBin(p=>({...p,invoices:(p.invoices||[]).filter(x=>x.id!==inv.id)}));};

  return(
    <>
      <div style={{background:"#0f3172",boxShadow:"0 2px 12px rgba(0,0,0,0.2)",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
            <LogoHex size={32}/>
            <div>
              <div style={{fontSize:"14px",fontWeight:800,color:"#fff",lineHeight:1}}>VinoDhan</div>
              <div style={{fontSize:"9px",color:"#f59e0b",letterSpacing:"2px"}}>COATING</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
            <div style={{width:"30px",height:"30px",borderRadius:"50%",background:"#1e50a0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",color:"#fff",fontWeight:700}}>{user.name[0]}</div>
            <button onClick={()=>setDrawerOpen(true)} style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:"8px",padding:"7px 10px",cursor:"pointer",color:"#fff",fontSize:"18px",lineHeight:1}}>☰</button>
          </div>
        </div>
      </div>

      {drawerOpen&&<>
        <div onClick={()=>setDrawerOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:1000}}/>
        <div style={{position:"fixed",top:0,right:0,width:"260px",height:"100%",background:"#0f3172",zIndex:1001,display:"flex",flexDirection:"column",boxShadow:"-4px 0 20px rgba(0,0,0,0.3)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 16px",borderBottom:"1px solid rgba(255,255,255,0.1)"}}>
            <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
              <div style={{width:"40px",height:"40px",borderRadius:"50%",background:"#1e50a0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",color:"#fff",fontWeight:700}}>{user.name[0]}</div>
              <div><div style={{fontSize:"14px",fontWeight:700,color:"#fff"}}>{user.name}</div><div style={{fontSize:"11px",color:"#90afd4"}}>{user.role}</div></div>
            </div>
            <button onClick={()=>setDrawerOpen(false)} style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:"8px",padding:"6px 10px",cursor:"pointer",color:"#fff",fontSize:"16px"}}>✕</button>
          </div>
          <div style={{padding:"16px"}}>
            <div style={{fontSize:"11px",fontWeight:600,color:"#90afd4",marginBottom:"10px",letterSpacing:"1px"}}>DISPLAY MODE</div>
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={()=>{setLandscape(true);setDrawerOpen(false);}} style={{flex:1,padding:"10px",borderRadius:"8px",border:"none",cursor:"pointer",background:landscape?"#1e50a0":"rgba(255,255,255,0.1)",color:"#fff",fontSize:"12px",fontWeight:600}}>⬜ Wide</button>
              <button onClick={()=>{setLandscape(false);setDrawerOpen(false);}} style={{flex:1,padding:"10px",borderRadius:"8px",border:"none",cursor:"pointer",background:!landscape?"#1e50a0":"rgba(255,255,255,0.1)",color:"#fff",fontSize:"12px",fontWeight:600}}>📱 Tall</button>
            </div>
          </div>
          <div style={{padding:"0 16px",marginBottom:"8px"}}>
  <label style={{width:"100%",padding:"12px",borderRadius:"10px",border:"none",cursor:"pointer",background:"rgba(255,255,255,0.1)",color:"#fff",fontSize:"13px",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",boxSizing:"border-box"}}>
    📥 Import Backup
    <input type="file" accept=".json" style={{display:"none"}} onChange={e=>{
      const f=e.target.files?.[0];
      if(!f)return;
      setPendingFile(f);
      setImportPwModal(true);
      setImportPw("");
      setImportPwErr("");
    }}/>
  </label>
</div>
<div style={{padding:"0 16px",marginBottom:"8px"}}>
  <button onClick={()=>exportExcel({workers,sites,invoices,attendance,assignments})} style={{width:"100%",padding:"12px",borderRadius:"10px",border:"none",cursor:"pointer",background:"rgba(255,255,255,0.1)",color:"#fff",fontSize:"13px",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"}}>
    📊 Export to Excel
  </button>
</div>
<div style={{padding:"0 16px",marginBottom:"8px"}}>
  <button onClick={()=>{
    const data=JSON.stringify({workers,execProfile,sites,attendance,assignments,invoices,company,client,bank,recycleBin},null,2);
    const blob=new Blob([data],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download=`vinodhan-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setDrawerOpen(false);
  }} style={{width:"100%",padding:"12px",borderRadius:"10px",border:"none",cursor:"pointer",background:"rgba(255,255,255,0.1)",color:"#fff",fontSize:"13px",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"}}>
    💾 Export Backup
  </button>
</div>
          <div style={{padding:"0 16px"}}>
            <button onClick={()=>{setShowBin(true);setDrawerOpen(false);}} style={{width:"100%",padding:"12px",borderRadius:"10px",border:"none",cursor:"pointer",background:"rgba(255,255,255,0.1)",color:"#fff",fontSize:"13px",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"}}>
              🗑️ Recycle Bin {binCount>0&&<span style={{background:"#dc2626",color:"#fff",borderRadius:"20px",padding:"1px 8px",fontSize:"11px",fontWeight:800}}>{binCount}</span>}
            </button>
          </div>
          <div style={{flex:1}}/>
          <div style={{padding:"16px",borderTop:"1px solid rgba(255,255,255,0.1)"}}>
            <button onClick={()=>{setDrawerOpen(false);saveS("vd_user",null);setUser(null);}} style={{width:"100%",padding:"12px",borderRadius:"10px",border:"none",cursor:"pointer",background:"#fee2e2",color:"#991b1b",fontSize:"14px",fontWeight:700}}>🚪 Logout</button>
          </div>
        </div>
      </>}

      {/* RECYCLE BIN */}
      {showBin&&(
        <div style={{position:"fixed",inset:0,background:"#f0f4f9",zIndex:2000,overflowY:"auto",fontFamily:"'Segoe UI',sans-serif"}}>
          <div style={{background:"#0f3172",padding:"14px 16px",display:"flex",alignItems:"center",gap:"12px"}}>
            <button onClick={()=>setShowBin(false)} style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:"8px",padding:"7px 14px",color:"#fff",fontSize:"13px",fontWeight:600,cursor:"pointer"}}>← Back</button>
            <div style={{fontSize:"15px",fontWeight:700,color:"#fff"}}>🗑️ Recycle Bin</div>
          </div>
          <div style={{padding:"20px"}}>
            <div style={{marginBottom:"20px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
  <h3 style={{margin:0,fontSize:"13px",fontWeight:700,color:"#6b84a3",textTransform:"uppercase",letterSpacing:"1px"}}>🏗️ Sites ({(recycleBin.sites||[]).length})</h3>
  <div style={{display:"flex",gap:"7px"}}>
    <button onClick={()=>setSelBinSites(selBinSites.length===(recycleBin.sites||[]).length?([]): (recycleBin.sites||[]).map(s=>s.id))} style={{...S.btn("#f0f6ff","#1e50a0"),padding:"5px 11px",fontSize:"12px"}}>{selBinSites.length===(recycleBin.sites||[]).length?"Deselect All":"Select All"}</button>
    {selBinSites.length>0&&<button onClick={()=>setPwModal({type:"bulkSite"})} style={{...S.btn("#fee2e2","#991b1b"),padding:"5px 11px",fontSize:"12px"}}>🗑️ Delete Selected ({selBinSites.length})</button>}
  </div>
</div>
              {(recycleBin.sites||[]).length===0?<div style={{...S.card,textAlign:"center",color:"#9db3cc",padding:"24px"}}>No deleted sites</div>
              :(recycleBin.sites||[]).map(s=>(
  <div key={s.id} style={{...S.card,marginBottom:"10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
    <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
      <div onClick={()=>setSelBinSites(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p,s.id])} style={{width:"20px",height:"20px",borderRadius:"5px",flexShrink:0,background:selBinSites.includes(s.id)?"#dc2626":"#e5e7eb",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#fff",fontSize:"12px",fontWeight:700}}>{selBinSites.includes(s.id)?"✓":""}</div>
      <div><div style={{fontWeight:600,fontSize:"14px"}}>{s.name}</div><div style={{fontSize:"11px",color:"#6b84a3"}}>{s.client}</div></div>
    </div>
    <div style={{display:"flex",gap:"7px"}}>
      <button onClick={()=>restoreSite(s)} style={{...S.btn("#dcfce7","#166534"),padding:"5px 11px",fontSize:"12px"}}>↩️ Restore</button>
      <button onClick={()=>setPwModal({type:"site",id:s.id})} style={{...S.btn("#fee2e2","#991b1b"),padding:"5px 11px",fontSize:"12px"}}>🗑️ Delete</button>
    </div>
  </div>
))}
            </div>
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
  <h3 style={{margin:0,fontSize:"13px",fontWeight:700,color:"#6b84a3",textTransform:"uppercase",letterSpacing:"1px"}}>🧾 Invoices ({(recycleBin.invoices||[]).length})</h3>
  <div style={{display:"flex",gap:"7px"}}>
    <button onClick={()=>setSelBinInvs(selBinInvs.length===(recycleBin.invoices||[]).length?[]:(recycleBin.invoices||[]).map(i=>i.id))} style={{...S.btn("#f0f6ff","#1e50a0"),padding:"5px 11px",fontSize:"12px"}}>{selBinInvs.length===(recycleBin.invoices||[]).length?"Deselect All":"Select All"}</button>
    {selBinInvs.length>0&&<button onClick={()=>setPwModal({type:"bulkInv"})} style={{...S.btn("#fee2e2","#991b1b"),padding:"5px 11px",fontSize:"12px"}}>🗑️ Delete Selected ({selBinInvs.length})</button>}
  </div>
</div>
              {(recycleBin.invoices||[]).length===0?<div style={{...S.card,textAlign:"center",color:"#9db3cc",padding:"24px"}}>No deleted invoices</div>
              :(recycleBin.invoices||[]).map(inv=>(
  <div key={inv.id} style={{...S.card,marginBottom:"10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
    <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
      <div onClick={()=>setSelBinInvs(p=>p.includes(inv.id)?p.filter(x=>x!==inv.id):[...p,inv.id])} style={{width:"20px",height:"20px",borderRadius:"5px",flexShrink:0,background:selBinInvs.includes(inv.id)?"#dc2626":"#e5e7eb",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#fff",fontSize:"12px",fontWeight:700}}>{selBinInvs.includes(inv.id)?"✓":""}</div>
      <div><div style={{fontWeight:600,fontSize:"14px"}}>{inv.number}</div><div style={{fontSize:"11px",color:"#6b84a3"}}>{fmtDate(inv.date)} — ₹{inv.total?.toLocaleString()}</div></div>
    </div>
    <div style={{display:"flex",gap:"7px"}}>
      <button onClick={()=>restoreInv(inv)} style={{...S.btn("#dcfce7","#166534"),padding:"5px 11px",fontSize:"12px"}}>↩️ Restore</button>
      <button onClick={()=>setPwModal({type:"invoice",id:inv.id})} style={{...S.btn("#fee2e2","#991b1b"),padding:"5px 11px",fontSize:"12px"}}>🗑️ Delete</button>
    </div>
  </div>
))}
            </div>
          </div>
        </div>
      )}

      {/* PASSWORD MODAL FOR RECYCLE BIN */}
      {pwModal&&<PwModal
  title="Permanent Delete"
  onConfirm={()=>{
    if(pwModal.type==="site") setRecycleBin(p=>({...p,sites:(p.sites||[]).filter(x=>x.id!==pwModal.id)}));
    else if(pwModal.type==="invoice") setRecycleBin(p=>({...p,invoices:(p.invoices||[]).filter(x=>x.id!==pwModal.id)}));
    else if(pwModal.type==="bulkSite"){setRecycleBin(p=>({...p,sites:(p.sites||[]).filter(x=>!selBinSites.includes(x.id))}));setSelBinSites([]);}
    else if(pwModal.type==="bulkInv"){setRecycleBin(p=>({...p,invoices:(p.invoices||[]).filter(x=>!selBinInvs.includes(x.id))}));setSelBinInvs([]);}
    setPwModal(null);
  }}
  onCancel={()=>setPwModal(null)}
/>}

      {importPwModal&&(
  <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:4000}}>
    <div style={{background:"#fff",borderRadius:"16px",padding:"28px",width:"300px",textAlign:"center"}}>
      <div style={{fontSize:"32px",marginBottom:"8px"}}>🔐</div>
      <h3 style={{margin:"0 0 7px"}}>Import Backup</h3>
      <p style={{fontSize:"12px",color:"#6b84a3",margin:"0 0 16px"}}>Enter password to restore data.</p>
      <input type="password" value={importPw} onChange={e=>setImportPw(e.target.value)} placeholder="Enter password" style={{...S.inp,marginBottom:"10px",textAlign:"center"}}/>
      {importPwErr&&<div style={{color:"#dc2626",fontSize:"12px",marginBottom:"10px"}}>{importPwErr}</div>}
      <div style={{display:"flex",gap:"9px",justifyContent:"center"}}>
        <button onClick={()=>{
          if(importPw!=="Risetogether1416"){setImportPwErr("❌ Incorrect password.");return;}
          const r=new FileReader();
          r.onload=ev=>{
            try{
              const d=JSON.parse(ev.target.result);
              if(d.workers)setWorkers(d.workers);
              if(d.sites)setSites(d.sites);
              if(d.invoices)setInvoices(d.invoices);
              if(d.attendance)setAttendance(d.attendance);
              if(d.assignments)setAssignments(d.assignments);
              if(d.company)setCompany(d.company);
              if(d.client)setClient(d.client);
              if(d.bank)setBank(d.bank);
              if(d.recycleBin)setRecycleBin(d.recycleBin);
              if(d.execProfile)setExecProfile(d.execProfile);
              setImportPwModal(false);setPendingFile(null);
              setDrawerOpen(false);
              alert("✅ Data restored successfully!");
            }catch{setImportPwErr("❌ Invalid backup file.");}
          };
          r.readAsText(pendingFile);
        }} style={S.btn("#1e50a0")}>Confirm</button>
        <button onClick={()=>{setImportPwModal(false);setPendingFile(null);setImportPwErr("");}} style={S.btn("#f0f4f9","#1a2b4a")}>Cancel</button>
      </div>
    </div>
  </div>
)}
  
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#0f3172",borderTop:"1px solid rgba(255,255,255,0.1)",display:"flex",zIndex:900,boxShadow:"0 -2px 12px rgba(0,0,0,0.2)"}}>
        {bottomNav.map(item=>{
          const active=page===item.id;
          return(
            <button key={item.id} onClick={()=>setPage(item.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"8px 2px",border:"none",cursor:"pointer",background:"transparent",color:active?"#f59e0b":"#90afd4",transition:"all .15s",minWidth:0}}>
              <span style={{fontSize:"18px",lineHeight:1,marginBottom:"3px"}}>{item.icon}</span>
              <span style={{fontSize:"9px",fontWeight:active?700:400,whiteSpace:"nowrap"}}>{item.label}</span>
              {active&&<div style={{width:"20px",height:"2px",background:"#f59e0b",borderRadius:"2px",marginTop:"3px"}}/>}
            </button>
          );
        })}
      </div>
    </>
  );
}

// ── LOGIN ─────────────────────────────────────────────
function LoginPage({onLogin,passwords,setPasswords}){
  const [mode,setMode]=useState("login");
  const [id,setId]=useState("");
  const [pw,setPw]=useState("");
  const [err,setErr]=useState("");
  const [showPw,setShowPw]=useState(false);
  const [fStep,setFStep]=useState(1);
  const [fUser,setFUser]=useState("");
  const [genOtp,setGenOtp]=useState("");
  const [entOtp,setEntOtp]=useState("");
  const [newPw,setNewPw]=useState("");
  const [cnfPw,setCnfPw]=useState("");
  const [fErr,setFErr]=useState("");
  const [fMsg,setFMsg]=useState("");
  const [showNewPw,setShowNewPw]=useState(false);
  const [showCnfPw,setShowCnfPw]=useState(false);

  const login=()=>{
    if(!id){setErr("Please select a User ID.");return;}
    if(!pw){setErr("Please enter your password.");return;}
    const u=USERS.find(u=>u.id===id&&passwords[id]===pw);
    u?(saveS("vd_user",u),onLogin(u)):setErr("Invalid User ID or Password. Password is case sensitive.");
  };
  const sendOtp=()=>{if(!fUser){setFErr("Please select a user.");return;}const otp=String(Math.floor(100000+Math.random()*900000));setGenOtp(otp);setFStep(2);setFErr("");setFMsg(`OTP sent to ${USER_PHONES[fUser]} — Demo OTP: ${otp}`);};
  const verifyOtp=()=>{entOtp===genOtp?(setFStep(3),setFErr(""),setFMsg("")):setFErr("Incorrect OTP. Try again.");};
  const resetPw=()=>{if(!newPw||newPw.length<6){setFErr("Min 6 characters.");return;}if(newPw!==cnfPw){setFErr("Passwords do not match.");return;}setPasswords(p=>({...p,[fUser]:newPw}));setMode("login");setFStep(1);setFUser("");setEntOtp("");setNewPw("");setCnfPw("");setGenOtp("");setFErr("");setFMsg("");alert("✅ Password reset! Please log in with your new password.");};
  const resetForgot=()=>{setMode("login");setFStep(1);setFUser("");setEntOtp("");setNewPw("");setCnfPw("");setGenOtp("");setFErr("");setFMsg("");};
  const inpDark={...S.inp,background:"rgba(255,255,255,0.08)",color:"#fff",border:"1.5px solid rgba(255,255,255,0.2)"};

  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0a1628 0%,#1e3a5f 50%,#0f2040 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Segoe UI',sans-serif",padding:"20px",position:"relative",overflow:"hidden"}}>
      <svg style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",opacity:0.06}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
        {Array.from({length:48},(_,k)=>{const row=Math.floor(k/6),col=k%6;const x=col*70+(row%2)*35,y=row*60;const pts=Array.from({length:6},(_,i)=>{const a=Math.PI/180*(60*i-30);return `${x+28*Math.cos(a)},${y+28*Math.sin(a)}`;}).join(" ");return <polygon key={k} points={pts} fill="none" stroke="#fff" strokeWidth="0.5"/>;})}
      </svg>
      <div style={{textAlign:"center",marginBottom:"28px",zIndex:1}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:"14px"}}><LogoHex size={100}/></div>
        <h1 style={{margin:"0 0 4px",fontSize:"28px",fontWeight:800,color:"#fff",letterSpacing:"2px"}}>VinoDhan</h1>
        <div style={{fontSize:"12px",fontWeight:600,color:"#f59e0b",letterSpacing:"6px",marginBottom:"8px"}}>COATING</div>
        <div style={{width:"160px",height:"1px",background:"linear-gradient(90deg,transparent,#f59e0b,transparent)",margin:"0 auto 8px"}}/>
        <p style={{margin:0,fontSize:"11px",color:"#93c5fd",letterSpacing:"1px"}}>Specialised Epoxy Coating Services</p>
      </div>
      <div style={{background:"rgba(255,255,255,0.06)",backdropFilter:"blur(10px)",borderRadius:"20px",padding:"28px",width:"100%",maxWidth:"360px",border:"1px solid rgba(255,255,255,0.12)",zIndex:1}}>
        {mode==="login"&&<>
          <div style={{textAlign:"center",marginBottom:"20px"}}><h2 style={{margin:0,fontSize:"16px",fontWeight:700,color:"#fff"}}>Welcome Back</h2><p style={{margin:"4px 0 0",fontSize:"11px",color:"#93c5fd"}}>Sign in to continue</p></div>
          <div style={{marginBottom:"12px"}}><label style={{...S.lbl,color:"#93c5fd"}}>USER ID</label><select value={id} onChange={e=>setId(e.target.value)} style={inpDark}><option value="" style={{background:"#1e3a5f"}}>Select User ID...</option><option value="DHANS1416" style={{background:"#1e3a5f"}}>DHANS1416</option><option value="Site Executive" style={{background:"#1e3a5f"}}>Site Executive</option></select></div>
          <div style={{marginBottom:"8px"}}><label style={{...S.lbl,color:"#93c5fd"}}>PASSWORD</label><div style={{position:"relative"}}><input type={showPw?"text":"password"} value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="Enter password" style={{...inpDark,paddingRight:"42px"}}/><span onClick={()=>setShowPw(p=>!p)} style={{position:"absolute",right:"12px",top:"50%",transform:"translateY(-50%)",cursor:"pointer",fontSize:"16px",userSelect:"none"}}>{showPw?"🙈":"👁️"}</span></div></div>
          <div style={{textAlign:"right",marginBottom:"16px"}}><span onClick={()=>setMode("forgot")} style={{fontSize:"12px",color:"#f59e0b",cursor:"pointer",fontWeight:700,textDecoration:"underline",textUnderlineOffset:"3px"}}>Forgot Password / ID?</span></div>
          {err&&<ErrBox msg={err}/>}
          <button onClick={login} style={{...S.btn("#f59e0b","#1a1a1a"),width:"100%",padding:"12px",fontSize:"14px",fontWeight:800}}>Login →</button>
        </>}
        {mode==="forgot"&&<>
          <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"18px"}}><span onClick={resetForgot} style={{cursor:"pointer",fontSize:"18px",color:"#93c5fd"}}>←</span><h3 style={{margin:0,fontSize:"15px",fontWeight:700,color:"#fff"}}>{fStep===1?"Forgot Password":fStep===2?"Enter OTP":"Reset Password"}</h3></div>
          <div style={{display:"flex",justifyContent:"center",gap:"7px",marginBottom:"20px"}}>{[1,2,3].map(n=><div key={n} style={{width:"26px",height:"5px",borderRadius:"3px",background:fStep>=n?"#f59e0b":"rgba(255,255,255,0.2)"}}/>)}</div>
          {fStep===1&&<><p style={{fontSize:"13px",color:"#93c5fd",margin:"0 0 14px"}}>Select your User ID to receive an OTP.</p><div style={{marginBottom:"14px"}}><label style={{...S.lbl,color:"#93c5fd"}}>SELECT USER ID</label><select value={fUser} onChange={e=>setFUser(e.target.value)} style={inpDark}><option value="" style={{background:"#1e3a5f"}}>Select...</option><option value="DHANS1416" style={{background:"#1e3a5f"}}>DHANS1416</option><option value="Site Executive" style={{background:"#1e3a5f"}}>Site Executive</option></select></div>{fUser&&<div style={{padding:"9px 13px",background:"rgba(245,158,11,0.15)",borderRadius:"8px",fontSize:"12px",color:"#f59e0b",marginBottom:"13px",border:"1px solid rgba(245,158,11,0.3)"}}>📱 OTP to: <strong>{USER_PHONES[fUser]}</strong></div>}{fErr&&<ErrBox msg={fErr}/>}<button onClick={sendOtp} style={{...S.btn("#f59e0b","#1a1a1a"),width:"100%",padding:"11px",fontWeight:800}}>Send OTP →</button></>}
          {fStep===2&&<>{fMsg&&<div style={{padding:"9px 13px",background:"rgba(74,222,128,0.1)",borderRadius:"8px",fontSize:"12px",color:"#4ade80",marginBottom:"14px",border:"1px solid rgba(74,222,128,0.2)",lineHeight:"1.6"}}>{fMsg}</div>}<div style={{marginBottom:"14px"}}><label style={{...S.lbl,color:"#93c5fd"}}>6-DIGIT OTP</label><input value={entOtp} onChange={e=>setEntOtp(e.target.value)} placeholder="······" maxLength={6} style={{...inpDark,fontSize:"22px",letterSpacing:"8px",textAlign:"center",fontWeight:700}}/></div>{fErr&&<ErrBox msg={fErr}/>}<button onClick={verifyOtp} style={{...S.btn("#f59e0b","#1a1a1a"),width:"100%",padding:"11px",marginBottom:"9px",fontWeight:800}}>Verify OTP →</button><div style={{textAlign:"center"}}><span onClick={sendOtp} style={{fontSize:"12px",color:"#f59e0b",cursor:"pointer",textDecoration:"underline"}}>Resend OTP</span></div></>}
          {fStep===3&&<><div style={{padding:"9px 13px",background:"rgba(74,222,128,0.1)",borderRadius:"8px",fontSize:"12px",color:"#4ade80",marginBottom:"14px",border:"1px solid rgba(74,222,128,0.2)"}}>✅ OTP verified!</div><div style={{marginBottom:"11px"}}><label style={{...S.lbl,color:"#93c5fd"}}>NEW PASSWORD</label><div style={{position:"relative"}}><input type={showNewPw?"text":"password"} value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder="Min 6 characters" style={{...inpDark,paddingRight:"42px"}}/><span onClick={()=>setShowNewPw(p=>!p)} style={{position:"absolute",right:"12px",top:"50%",transform:"translateY(-50%)",cursor:"pointer",fontSize:"16px"}}>{showNewPw?"🙈":"👁️"}</span></div></div><div style={{marginBottom:"14px"}}><label style={{...S.lbl,color:"#93c5fd"}}>CONFIRM PASSWORD</label><div style={{position:"relative"}}><input type={showCnfPw?"text":"password"} value={cnfPw} onChange={e=>setCnfPw(e.target.value)} placeholder="Re-enter" style={{...inpDark,paddingRight:"42px"}} onKeyDown={e=>e.key==="Enter"&&resetPw()}/><span onClick={()=>setShowCnfPw(p=>!p)} style={{position:"absolute",right:"12px",top:"50%",transform:"translateY(-50%)",cursor:"pointer",fontSize:"16px"}}>{showCnfPw?"🙈":"👁️"}</span></div></div>{fErr&&<ErrBox msg={fErr}/>}<button onClick={resetPw} style={{...S.btn("#f59e0b","#1a1a1a"),width:"100%",padding:"11px",fontWeight:800}}>Reset Password ✓</button></>}
        </>}
      </div>
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────
function DashSiteWorks({works}){
  const [open,setOpen]=useState(false);
  return(
    <div style={{borderTop:"1px solid #e0eaff",marginTop:"6px"}}>
      <div onClick={()=>setOpen(p=>!p)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0",cursor:"pointer"}}>
        <span style={{fontSize:"11px",color:"#1e50a0",fontWeight:600}}>{open?"▲ Hide":"▼ Show"} {works.length} work{works.length!==1?"s":""}</span>
      </div>
      {open&&<div style={{display:"flex",flexDirection:"column",gap:"4px",paddingBottom:"4px"}}>
        {works.map(w=>(
          <div key={w.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:"12px",padding:"3px 0"}}>
            <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
              <span style={S.wbadge(w.workType||"SQM")}>{w.workType||"SQM"}</span>
              <span style={{color:"#1a2b4a"}}>{w.place}</span>
            </div>
            <span style={{fontWeight:600,color:"#166534"}}>₹{calcWork(w).toLocaleString()}</span>
          </div>
        ))}
      </div>}
    </div>
  );
}

function Dashboard({user,workers,sites,invoices,landscape}){
  const totalSqm=sites.reduce((sum,s)=>(s.works||[]).filter(w=>w.workType==="SQM"||!w.workType).reduce((a,w)=>a+(Number(w.area)||0),sum),0);
  const totalRmt=sites.reduce((sum,s)=>(s.works||[]).filter(w=>w.workType==="RMT").reduce((a,w)=>a+(Number(w.area)||0),sum),0);
  const totalMp=sites.reduce((sum,s)=>(s.works||[]).filter(w=>w.workType==="Manpower").reduce((a,w)=>a+calcWork(w),sum),0);
const totalKgs=sites.reduce((sum,s)=>(s.works||[]).filter(w=>w.workType==="KGS").reduce((a,w)=>a+(Number(w.area)||0),sum),0);
const totalOther=sites.reduce((sum,s)=>(s.works||[]).filter(w=>w.workType==="Other").reduce((a,w)=>a+(Number(w.amount)||0),sum),0);
const totalRev=sites.reduce((sum,s)=>(s.works||[]).reduce((a,w)=>a+calcWork(w),sum),0);
  const activeSites=sites.filter(s=>s.status==="Active").length;
  const completedSites=sites.filter(s=>s.status==="Completed").length;
const applicators=workers.filter(w=>w.category==="Applicator").length;
const semiApplicators=workers.filter(w=>w.category==="Semi-Applicator").length;
const helpers=workers.filter(w=>w.category==="Helper").length;
  const [expandCard,setExpandCard]=useState(null);
  return(
    <div>
      <h2 style={{margin:"0 0 4px",fontSize:"20px",fontWeight:800}}>Good day, {user.name}! 👋</h2>
      <p style={{margin:"0 0 20px",color:"#6b84a3",fontSize:"12px"}}>{today}</p>
      {/* ROW 1 — Summary cards */}
<div style={{display:"flex",gap:"12px",marginBottom:"12px",overflowX:"auto",paddingBottom:"8px",WebkitOverflowScrolling:"touch",scrollbarWidth:"none"}}>
  {/* Workers */}
  <div style={{...S.card,background:"#dbeafe",boxShadow:"none",padding:"16px",minWidth:"160px",flexShrink:0}}>
    <div style={{fontSize:"22px",marginBottom:"6px"}}>👷</div>
    <div style={{fontSize:"11px",fontWeight:700,color:"#1e40af",marginBottom:"6px"}}>WORKERS</div>
    <div style={{display:"flex",flexDirection:"column",gap:"3px"}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:"12px"}}><span style={{color:"#1e40af"}}>Applicators</span><span style={{fontWeight:800,color:"#0f3172"}}>{applicators}</span></div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:"12px"}}><span style={{color:"#5b21b6"}}>Semi-App</span><span style={{fontWeight:800,color:"#0f3172"}}>{semiApplicators}</span></div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:"12px"}}><span style={{color:"#166534"}}>Helpers</span><span style={{fontWeight:800,color:"#0f3172"}}>{helpers}</span></div>
      <div style={{borderTop:"1px solid #bfdbfe",marginTop:"3px",paddingTop:"3px",display:"flex",justifyContent:"space-between",fontSize:"12px"}}><span style={{color:"#6b84a3"}}>Total</span><span style={{fontWeight:800,color:"#0f3172"}}>{workers.length}</span></div>
    </div>
  </div>
  {/* Sites */}
  <div style={{...S.card,background:"#dcfce7",boxShadow:"none",padding:"16px",minWidth:"150px",flexShrink:0}}>
    <div style={{fontSize:"22px",marginBottom:"6px"}}>🏗️</div>
    <div style={{fontSize:"11px",fontWeight:700,color:"#166534",marginBottom:"6px"}}>SITES</div>
    <div style={{display:"flex",flexDirection:"column",gap:"3px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:"12px"}}>
        <span style={{display:"flex",alignItems:"center",gap:"4px"}}><span style={{width:"8px",height:"8px",borderRadius:"50%",background:"#16a34a",display:"inline-block"}}></span>Active</span>
        <span style={{fontWeight:800,color:"#0f3172"}}>{activeSites}</span>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:"12px"}}>
        <span style={{display:"flex",alignItems:"center",gap:"4px"}}><span style={{width:"8px",height:"8px",borderRadius:"50%",background:"#2563eb",display:"inline-block"}}></span>Completed</span>
        <span style={{fontWeight:800,color:"#0f3172"}}>{completedSites}</span>
      </div>
      <div style={{borderTop:"1px solid #bbf7d0",marginTop:"3px",paddingTop:"3px",display:"flex",justifyContent:"space-between",fontSize:"12px"}}><span style={{color:"#6b84a3"}}>Total</span><span style={{fontWeight:800,color:"#0f3172"}}>{sites.length}</span></div>
    </div>
  </div>
  {/* Revenue */}
  <div style={{...S.card,background:"#fef3c7",boxShadow:"none",padding:"16px",minWidth:"130px",flexShrink:0}}>
    <div style={{fontSize:"22px",marginBottom:"6px"}}>💰</div>
    <div style={{fontSize:"18px",fontWeight:800,color:"#0f3172"}}>₹{totalRev.toLocaleString()}</div>
    <div style={{fontSize:"11px",color:"#6b84a3",marginTop:"2px"}}>Revenue</div>
  </div>
</div>
{/* ROW 2 — Breakdown cards */}
<div style={{display:"flex",gap:"12px",marginBottom:"20px",overflowX:"auto",paddingBottom:"8px",WebkitOverflowScrolling:"touch",scrollbarWidth:"none"}}>
  {/* SQM */}
  <div onClick={()=>setExpandCard(expandCard==="sqm"?null:"sqm")} style={{...S.card,background:"#ede9fe",boxShadow:"none",padding:"16px",minWidth:"130px",flexShrink:0,cursor:"pointer"}}>
    <div style={{fontSize:"22px",marginBottom:"6px"}}>📐</div>
    <div style={{fontSize:"18px",fontWeight:800,color:"#0f3172"}}>{totalSqm}m²</div>
    <div style={{fontSize:"11px",color:"#6b84a3",marginTop:"2px"}}>Total SQM</div>
    <div style={{fontSize:"10px",color:"#7c3aed",marginTop:"4px",fontWeight:600}}>{expandCard==="sqm"?"▲ Hide":"▼ Details"}</div>
  </div>
  {/* RMT */}
  <div onClick={()=>setExpandCard(expandCard==="rmt"?null:"rmt")} style={{...S.card,background:"#fce7f3",boxShadow:"none",padding:"16px",minWidth:"130px",flexShrink:0,cursor:"pointer"}}>
    <div style={{fontSize:"22px",marginBottom:"6px"}}>📏</div>
    <div style={{fontSize:"18px",fontWeight:800,color:"#0f3172"}}>{totalRmt}rmt</div>
    <div style={{fontSize:"11px",color:"#6b84a3",marginTop:"2px"}}>Total RMT</div>
    <div style={{fontSize:"10px",color:"#9d174d",marginTop:"4px",fontWeight:600}}>{expandCard==="rmt"?"▲ Hide":"▼ Details"}</div>
  </div>
  {/* Other Charges (Manpower) */}
  <div onClick={()=>setExpandCard(expandCard==="mp"?null:"mp")} style={{...S.card,background:"#fef9c3",boxShadow:"none",padding:"16px",minWidth:"130px",flexShrink:0,cursor:"pointer"}}>
    <div style={{fontSize:"22px",marginBottom:"6px"}}>👨‍🔧</div>
    <div style={{fontSize:"18px",fontWeight:800,color:"#0f3172"}}>₹{totalMp.toLocaleString()}</div>
    <div style={{fontSize:"11px",color:"#6b84a3",marginTop:"2px"}}>Other Charges</div>
    <div style={{fontSize:"10px",color:"#d97706",marginTop:"4px",fontWeight:600}}>{expandCard==="mp"?"▲ Hide":"▼ Details"}</div>
  </div>
  {/* KGS */}
  <div onClick={()=>setExpandCard(expandCard==="kgs"?null:"kgs")} style={{...S.card,background:"#dcfce7",boxShadow:"none",padding:"16px",minWidth:"130px",flexShrink:0,cursor:"pointer"}}>
    <div style={{fontSize:"22px",marginBottom:"6px"}}>⚖️</div>
    <div style={{fontSize:"18px",fontWeight:800,color:"#0f3172"}}>{totalKgs}kgs</div>
    <div style={{fontSize:"11px",color:"#6b84a3",marginTop:"2px"}}>Total KGS</div>
    <div style={{fontSize:"10px",color:"#166534",marginTop:"4px",fontWeight:600}}>{expandCard==="kgs"?"▲ Hide":"▼ Details"}</div>
  </div>
  {/* Other */}
  <div onClick={()=>setExpandCard(expandCard==="other"?null:"other")} style={{...S.card,background:"#fee2e2",boxShadow:"none",padding:"16px",minWidth:"130px",flexShrink:0,cursor:"pointer"}}>
    <div style={{fontSize:"22px",marginBottom:"6px"}}>🔧</div>
    <div style={{fontSize:"18px",fontWeight:800,color:"#0f3172"}}>₹{totalOther.toLocaleString()}</div>
    <div style={{fontSize:"11px",color:"#6b84a3",marginTop:"2px"}}>Other</div>
    <div style={{fontSize:"10px",color:"#991b1b",marginTop:"4px",fontWeight:600}}>{expandCard==="other"?"▲ Hide":"▼ Details"}</div>
  </div>
  {/* Invoices */}
  <div onClick={()=>setExpandCard(expandCard==="inv"?null:"inv")} style={{...S.card,background:"#fce7f3",boxShadow:"none",padding:"16px",minWidth:"160px",flexShrink:0,cursor:"pointer"}}>
    <div style={{fontSize:"22px",marginBottom:"6px"}}>🧾</div>
    <div style={{fontSize:"11px",fontWeight:700,color:"#9d174d",marginBottom:"6px"}}>INVOICES</div>
    <div style={{display:"flex",flexDirection:"column",gap:"3px"}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:"12px"}}><span style={{color:"#9d174d"}}>Total Raised</span><span style={{fontWeight:800,color:"#0f3172"}}>{invoices.length}</span></div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:"12px"}}><span style={{color:"#9d174d"}}>Total Billed</span><span style={{fontWeight:800,color:"#0f3172"}}>₹{invoices.reduce((a,inv)=>a+(inv.total||0),0).toLocaleString()}</span></div>
    </div>
    <div style={{fontSize:"10px",color:"#9d174d",marginTop:"4px",fontWeight:600}}>{expandCard==="inv"?"▲ Hide":"▼ Details"}</div>
  </div>
</div>
      {expandCard&&(
  <div style={{...S.card,marginBottom:"20px"}}>
    {expandCard==="sqm"&&<>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}>
        <h3 style={{margin:0,fontSize:"14px",fontWeight:700}}>📐 SQM Breakdown</h3>
        <span style={{fontWeight:800,color:"#7c3aed",fontSize:"14px"}}>{totalSqm}m² Total</span>
      </div>
      {sites.filter(s=>(s.works||[]).some(w=>w.workType==="SQM"||!w.workType)).map(s=>{
  const works=(s.works||[]).filter(w=>w.workType==="SQM"||!w.workType);
  const siteTotal=works.reduce((a,w)=>a+(Number(w.area)||0),0);
  const grouped=Object.values(works.reduce((acc,w)=>{
    const key=w.place.trim().toLowerCase();
    if(!acc[key])acc[key]={place:w.place.trim(),area:0};
    acc[key].area+=Number(w.area)||0;
    return acc;
  },{}));
  return(
    <div key={s.id} style={{marginBottom:"16px"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}>
        <span style={{fontWeight:700,fontSize:"13px",color:"#0f3172"}}>{s.name}</span>
        <span style={{fontWeight:700,fontSize:"13px",color:"#7c3aed"}}>{siteTotal}m²</span>
      </div>
      {grouped.map(w=>(
              <div key={w.id} style={{marginBottom:"6px"}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:"11px",marginBottom:"2px"}}>
                  <span style={{color:"#1a2b4a"}}>{w.place}</span>
                  <span style={{fontWeight:600,color:"#7c3aed"}}>{w.area}m²</span>
                </div>
                <div style={{background:"#ede9fe",borderRadius:"4px",height:"10px",overflow:"hidden"}}>
                  <div style={{height:"100%",borderRadius:"4px",background:"linear-gradient(90deg,#7c3aed,#a78bfa)",width:`${siteTotal>0?(w.area/siteTotal)*100:0}%`,transition:"width 0.5s"}}/>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </>}
    {expandCard==="rmt"&&<>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}>
        <h3 style={{margin:0,fontSize:"14px",fontWeight:700}}>📏 RMT Breakdown</h3>
        <span style={{fontWeight:800,color:"#9d174d",fontSize:"14px"}}>{totalRmt}rmt Total</span>
      </div>
      {sites.filter(s=>(s.works||[]).some(w=>w.workType==="RMT")).map(s=>{
        const works=(s.works||[]).filter(w=>w.workType==="RMT");
  const siteTotal=works.reduce((a,w)=>a+(Number(w.area)||0),0);
  const grouped=Object.values(works.reduce((acc,w)=>{
    const key=w.place.trim().toLowerCase();
    if(!acc[key])acc[key]={place:w.place.trim(),area:0};
    acc[key].area+=Number(w.area)||0;
    return acc;
  },{}));
  return(
    <div key={s.id} style={{marginBottom:"16px"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}>
        <span style={{fontWeight:700,fontSize:"13px",color:"#0f3172"}}>{s.name}</span>
        <span style={{fontWeight:700,fontSize:"13px",color:"#9d174d"}}>{siteTotal}rmt</span>
      </div>
      {grouped.map(w=>(
              <div key={w.id} style={{marginBottom:"6px"}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:"11px",marginBottom:"2px"}}>
                  <span style={{color:"#1a2b4a"}}>{w.place}</span>
                  <span style={{fontWeight:600,color:"#9d174d"}}>{w.area}rmt</span>
                </div>
                <div style={{background:"#fce7f3",borderRadius:"4px",height:"10px",overflow:"hidden"}}>
                  <div style={{height:"100%",borderRadius:"4px",background:"linear-gradient(90deg,#db2777,#f9a8d4)",width:`${totalRmt>0?(Number(w.area)/totalRmt)*100:0}%`,transition:"width 0.5s"}}/>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </>}
    {expandCard==="mp"&&<>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}>
        <h3 style={{margin:0,fontSize:"14px",fontWeight:700}}>👨‍🔧 Other Charges Breakdown</h3>
        <span style={{fontWeight:800,color:"#d97706",fontSize:"14px"}}>₹{totalMp.toLocaleString()} Total</span>
      </div>
      {sites.filter(s=>(s.works||[]).some(w=>w.workType==="Manpower")).map(s=>{
        const works=(s.works||[]).filter(w=>w.workType==="Manpower");
  const siteTotal=works.reduce((a,w)=>a+calcWork(w),0);
  const grouped=Object.values(works.reduce((acc,w)=>{
    const key=w.place.trim().toLowerCase();
    if(!acc[key])acc[key]={place:w.place.trim(),amount:0};
    acc[key].amount+=calcWork(w);
    return acc;
  },{}));
  return(
    <div key={s.id} style={{marginBottom:"16px"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}>
        <span style={{fontWeight:700,fontSize:"13px",color:"#0f3172"}}>{s.name}</span>
        <span style={{fontWeight:700,fontSize:"13px",color:"#d97706"}}>₹{siteTotal.toLocaleString()}</span>
      </div>
      {grouped.map(w=>(
              <div key={w.id} style={{marginBottom:"6px"}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:"11px",marginBottom:"2px"}}>
                  <span style={{color:"#1a2b4a"}}>{w.place}</span>
                  <span style={{fontWeight:600,color:"#d97706"}}>₹{w.amount.toLocaleString()}</span>
                </div>
                <div style={{background:"#fef9c3",borderRadius:"4px",height:"10px",overflow:"hidden"}}>
                  <div style={{height:"100%",borderRadius:"4px",background:"linear-gradient(90deg,#d97706,#fbbf24)",width:`${siteTotal>0?(w.amount/siteTotal)*100:0}%`,transition:"width 0.5s"}}/>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </>}
    {expandCard==="kgs"&&<>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}>
        <h3 style={{margin:0,fontSize:"14px",fontWeight:700}}>⚖️ KGS Breakdown</h3>
        <span style={{fontWeight:800,color:"#166534",fontSize:"14px"}}>{totalKgs}kgs Total</span>
      </div>
      {sites.filter(s=>(s.works||[]).some(w=>w.workType==="KGS")).map(s=>{
        const works=(s.works||[]).filter(w=>w.workType==="KGS");
        const siteTotal=works.reduce((a,w)=>a+(Number(w.area)||0),0);
        const grouped=Object.values(works.reduce((acc,w)=>{
          const key=w.place.trim().toLowerCase();
          if(!acc[key])acc[key]={place:w.place.trim(),area:0};
          acc[key].area+=Number(w.area)||0;
          return acc;
        },{}));
        return(
          <div key={s.id} style={{marginBottom:"16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}>
              <span style={{fontWeight:700,fontSize:"13px",color:"#0f3172"}}>{s.name}</span>
              <span style={{fontWeight:700,fontSize:"13px",color:"#166534"}}>{siteTotal}kgs</span>
            </div>
            {grouped.map((w,i)=>(
              <div key={i} style={{marginBottom:"6px"}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:"11px",marginBottom:"2px"}}>
                  <span style={{color:"#1a2b4a"}}>{w.place}</span>
                  <span style={{fontWeight:600,color:"#166534"}}>{w.area}kgs</span>
                </div>
                <div style={{background:"#dcfce7",borderRadius:"4px",height:"10px",overflow:"hidden"}}>
                  <div style={{height:"100%",borderRadius:"4px",background:"linear-gradient(90deg,#166534,#4ade80)",width:`${siteTotal>0?(w.area/siteTotal)*100:0}%`,transition:"width 0.5s"}}/>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </>}
    {expandCard==="other"&&<>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}>
        <h3 style={{margin:0,fontSize:"14px",fontWeight:700}}>🔧 Other Breakdown</h3>
        <span style={{fontWeight:800,color:"#991b1b",fontSize:"14px"}}>₹{totalOther.toLocaleString()} Total</span>
      </div>
      {sites.filter(s=>(s.works||[]).some(w=>w.workType==="Other")).map(s=>{
        const works=(s.works||[]).filter(w=>w.workType==="Other");
        const siteTotal=works.reduce((a,w)=>a+(Number(w.amount)||0),0);
        return(
          <div key={s.id} style={{marginBottom:"16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}>
              <span style={{fontWeight:700,fontSize:"13px",color:"#0f3172"}}>{s.name}</span>
              <span style={{fontWeight:700,fontSize:"13px",color:"#991b1b"}}>₹{siteTotal.toLocaleString()}</span>
            </div>
            {works.map((w,i)=>(
              <div key={i} style={{marginBottom:"6px"}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:"11px",marginBottom:"2px"}}>
                  <span style={{color:"#1a2b4a"}}>{w.place}</span>
                  <span style={{fontWeight:600,color:"#991b1b"}}>₹{Number(w.amount).toLocaleString()}</span>
                </div>
                <div style={{background:"#fee2e2",borderRadius:"4px",height:"10px",overflow:"hidden"}}>
                  <div style={{height:"100%",borderRadius:"4px",background:"linear-gradient(90deg,#991b1b,#f87171)",width:`${siteTotal>0?(Number(w.amount)/siteTotal)*100:0}%`,transition:"width 0.5s"}}/>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </>}
    {expandCard==="inv"&&<>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}>
        <h3 style={{margin:0,fontSize:"14px",fontWeight:700}}>🧾 Invoice Breakdown</h3>
        <span style={{fontWeight:800,color:"#9d174d",fontSize:"14px"}}>
          {invoices.length} Invoices — ₹{invoices.reduce((a,inv)=>a+(inv.total||0),0).toLocaleString()} Total
        </span>
      </div>
      {(()=>{
        const grouped=Object.values(invoices.reduce((acc,inv)=>{
          const raw=(inv.siteName||"Unknown").trim().toLowerCase();
const key=raw.includes("wist")||raw.includes("wisr")?"Wistron":(inv.siteName||"Unknown").trim();
          if(!acc[key])acc[key]={siteName:key,count:0,total:0};
          acc[key].count++;
          acc[key].total+=inv.total||0;
          return acc;
        },{})).sort((a,b)=>b.total-a.total);
        const grandTotal=invoices.reduce((a,inv)=>a+(inv.total||0),0);
        return grouped.map((g,i)=>(
          <div key={i} style={{marginBottom:"12px"}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:"12px",marginBottom:"2px"}}>
              <span style={{fontWeight:600,color:"#1a2b4a"}}>{g.siteName}</span>
              <span style={{fontWeight:700,color:"#9d174d"}}>
                {g.count} invoice{g.count!==1?"s":""} — ₹{g.total.toLocaleString()}
              </span>
            </div>
            <div style={{background:"#fce7f3",borderRadius:"4px",height:"10px",overflow:"hidden"}}>
              <div style={{height:"100%",borderRadius:"4px",background:"linear-gradient(90deg,#db2777,#f9a8d4)",width:`${grandTotal>0?(g.total/grandTotal)*100:0}%`,transition:"width 0.5s"}}/>
            </div>
          </div>
        ));
      })()}
    </>}
  </div>
)}
      <div style={S.card}>
        <h3 style={{margin:"0 0 12px",fontSize:"14px",fontWeight:700}}>🏗️ Sites Overview</h3>
        {[...sites].sort((a,b)=>{
  if(a.status==="Active"&&b.status!=="Active") return -1;
  if(a.status!=="Active"&&b.status==="Active") return 1;
  if(a.status==="Active") return b.id-a.id;
const aMax=(a.works||[]).map(w=>w.toDate||"").filter(Boolean).sort().pop()||"";
const bMax=(b.works||[]).map(w=>w.toDate||"").filter(Boolean).sort().pop()||"";
return bMax.localeCompare(aMax);
}).map((site,idx)=>{
          const rev=(site.works||[]).reduce((a,w)=>a+calcWork(w),0);
          return(
            <div key={site.id} style={{padding:"12px 14px",background:"#f0f6ff",borderRadius:"10px",marginBottom:"8px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><h3 style={{margin:"0 0 2px",fontSize:"15px",fontWeight:700}}>{sites.length-idx}. {site.name}</h3><div style={{fontSize:"11px",color:"#6b84a3"}}>{site.client}</div></div>
                <div style={{textAlign:"right"}}><div style={{fontWeight:700,color:"#166534",fontSize:"13px"}}>₹{rev.toLocaleString()}</div><span style={{background:site.status==="Active"?"#dcfce7":"#fee2e2",color:site.status==="Active"?"#166534":"#991b1b",fontSize:"10px",fontWeight:600,borderRadius:"20px",padding:"2px 9px"}}>{site.status}</span></div>
              </div>
              {(site.works||[]).length>0&&<DashSiteWorks works={site.works}/>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── SITE WORKS DROPDOWN ───────────────────────────────
function SiteWorksDropdown({works,siteId,isExp,tab,startEdit,deleteWork}){
  const [open,setOpen]=useState(false);
  return(
    <div style={{marginBottom:"10px",borderRadius:"10px",overflow:"hidden",border:"1.5px solid #bfdbfe"}}>
      <div onClick={()=>setOpen(p=>!p)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",background:"#1e50a0",cursor:"pointer"}}>
        <span style={{fontSize:"12px",fontWeight:700,color:"#fff"}}>📐 {works.length} Work{works.length!==1?"s":""}</span>
        <span style={{color:"#fff",fontSize:"12px"}}>{open?"▲":"▼"}</span>
      </div>
      {open&&<div style={{background:"#f8faff",padding:"8px 10px"}}>
        {[...works].sort((a,b)=>(b.fromDate||"").localeCompare(a.fromDate||"")).map(w=>(
          <div key={w.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid #e8f0ff"}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"2px"}}>
                <span style={S.wbadge(w.workType||"SQM")}>{w.workType||"SQM"}</span>
                <span style={{fontWeight:600,fontSize:"12px"}}>{w.place}</span>
              </div>
              {w.fromDate&&<div style={{fontSize:"10px",color:"#6b84a3"}}>{w.fromDate} → {w.toDate||"ongoing"}</div>}
              <div style={{fontSize:"10px",color:"#6b84a3"}}>{workUnitLabel(w)}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontWeight:700,fontSize:"13px",color:"#166534"}}>₹{calcWork(w).toLocaleString()}</div>
              {isExp&&tab==="works"&&<div style={{display:"flex",gap:"4px",marginTop:"4px"}}>
                <button onClick={e=>{e.stopPropagation();startEdit(siteId,w);}} style={{...S.btn("#f0f6ff","#1e50a0"),padding:"3px 7px",fontSize:"11px"}}>✏️</button>
                <button onClick={e=>{e.stopPropagation();deleteWork(siteId,w.id);}} style={{...S.btn("#fee2e2","#991b1b"),padding:"3px 7px",fontSize:"11px"}}>🗑️</button>
              </div>}
            </div>
          </div>
        ))}
      </div>}
    </div>
  );
}

// ── SITES ─────────────────────────────────────────────
function Sites({sites,setSites,workers,assignments,setAssignments,recycleBin,setRecycleBin,invoices,setInvoices}){
  const [showAdd,setShowAdd]=useState(false);
  const [siteForm,setSiteForm]=useState({name:"",client:"Swathi Engineering Agency",status:"Active"});
  const [expandSite,setExpandSite]=useState(null);
  const [siteTab,setSiteTab]=useState({});
  const EMPTY_WORK={place:"",workersList:"",fromDate:"",toDate:"",area:"",rate:"",labour:"",amount:"",workType:"SQM"};
  const [workForm,setWorkForm]=useState(EMPTY_WORK);
  const [editWorkId,setEditWorkId]=useState(null);
  const [addingWork,setAddingWork]=useState(null);
  const [saveMsg,setSaveMsg]=useState({});

  const getTab=id=>siteTab[id]||"works";
  const addSite=()=>{if(!siteForm.name.trim())return;const ns={id:Date.now(),...siteForm,works:[]};setSites(p=>[...p,ns]);setAssignments(p=>({...p,[ns.id]:{}}));setSiteForm({name:"",client:"Swathi Engineering Agency",status:"Active"});setShowAdd(false);};
  const [delSiteModal,setDelSiteModal]=useState(null);
  const [delWorkModal,setDelWorkModal]=useState(null);
  const [orphanWarning,setOrphanWarning]=useState(null);
const deleteSite=id=>{
  const site=sites.find(s=>s.id===id);
  const siteWorkIds=(site?.works||[]).map(w=>w.id);
  const linked=invoices.filter(inv=>(inv.works||[]).some(w=>siteWorkIds.includes(w.id)));
  if(linked.length>0){
    setOrphanWarning({siteId:id,wid:null,isSite:true,invoices:linked});
  } else {
    setDelSiteModal(id);
  }
};
const confirmDeleteSite=()=>{
  const s=sites.find(x=>x.id===delSiteModal);
  if(s){setRecycleBin(p=>({...p,sites:[...(p.sites||[]),s]}));setSites(p=>p.filter(x=>x.id!==delSiteModal));}
  setDelSiteModal(null);
};
  const toggleWorker=(siteId,w)=>setAssignments(p=>{const c={...(p[siteId]||{})};if(c[w.id])delete c[w.id];else c[w.id]=w.category;return{...p,[siteId]:c};});
  const changeDesig=(siteId,wid,desig)=>setAssignments(p=>({...p,[siteId]:{...(p[siteId]||{}),[wid]:desig}}));
  const saveWork=siteId=>{
    if(!workForm.place)return;
if(workForm.workType==="Manpower"&&(!workForm.labour||!workForm.rate))return;
if(workForm.workType==="Other"&&!workForm.amount)return;
if(workForm.workType!=="Manpower"&&workForm.workType!=="Other"&&(!workForm.area||!workForm.rate))return;
    setSites(p=>p.map(s=>{
      if(s.id!==siteId)return s;
      if(editWorkId)return{...s,works:(s.works||[]).map(w=>w.id===editWorkId?{...w,...workForm,area:Number(workForm.area),rate:Number(workForm.rate),labour:Number(workForm.labour)}:w)};
      return{...s,works:[...(s.works||[]),{id:crypto.randomUUID(),...workForm,area:Number(workForm.area),rate:Number(workForm.rate),labour:Number(workForm.labour)}]};
    }));
    setWorkForm(EMPTY_WORK);setAddingWork(null);setEditWorkId(null);
    setSaveMsg(p=>({...p,[siteId]:true}));
    setTimeout(()=>setSaveMsg(p=>({...p,[siteId]:false})),2500);
  };
  const deleteWork=(siteId,wid)=>{
  console.log("Deleting work ID:", wid);
  console.log("Invoice work IDs:", invoices.map(inv=>(inv.works||[]).map(w=>w.id)));
  const linked=invoices.filter(inv=>(inv.works||[]).some(w=>w.id===wid));
  if(linked.length>0){
    setOrphanWarning({siteId,wid,invoices:linked});
  } else {
    setDelWorkModal({siteId,wid});
  }
};
const confirmDeleteWork=()=>{setSites(p=>p.map(s=>s.id===delWorkModal.siteId?{...s,works:(s.works||[]).filter(w=>w.id!==delWorkModal.wid)}:s));setDelWorkModal(null);};
  const startEdit=(siteId,w)=>{setAddingWork(siteId);setEditWorkId(w.id);setWorkForm({place:w.place,workersList:w.workersList||"",fromDate:w.fromDate||"",toDate:w.toDate||"",area:String(w.area||""),rate:String(w.rate||""),labour:String(w.labour||""),amount:String(w.amount||""),workType:w.workType||"SQM"});};

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"18px"}}>
        <h2 style={{margin:0,fontSize:"20px",fontWeight:800}}>🏗️ Sites</h2>
        <button onClick={()=>setShowAdd(p=>!p)} style={S.btn()}>+ Add Site</button>
      </div>
      {showAdd&&<div style={{...S.card,marginBottom:"16px",border:"1.5px solid #bfdbfe"}}>
        <h3 style={{margin:"0 0 12px",fontSize:"14px"}}>New Site</h3>
        {[["Site Name","name"],["Client","client"]].map(([lbl,key])=>(
          <div key={key} style={{marginBottom:"10px"}}><label style={S.lbl}>{lbl}</label><input value={siteForm[key]} onChange={e=>setSiteForm(p=>({...p,[key]:e.target.value}))} style={S.inp}/></div>
        ))}
        <div style={{marginBottom:"12px"}}><label style={S.lbl}>Status</label><select value={siteForm.status} onChange={e=>setSiteForm(p=>({...p,status:e.target.value}))} style={S.inp}><option>Active</option><option>Completed</option><option>On Hold</option></select></div>
        <div style={{display:"flex",gap:"9px"}}><button onClick={addSite} style={S.btn()}>Save</button><button onClick={()=>setShowAdd(false)} style={S.btn("#f0f4f9","#1a2b4a")}>Cancel</button></div>
      </div>}
{delSiteModal&&<PwModal
  title="Move Site to Recycle Bin?"
  onConfirm={confirmDeleteSite}
  onCancel={()=>setDelSiteModal(null)}
/>}
{delWorkModal&&<PwModal
  title="Delete Work Entry?"
  onConfirm={confirmDeleteWork}
  onCancel={()=>setDelWorkModal(null)}
/>}
{orphanWarning&&(
  <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:3000}}>
    <div style={{background:"#fff",borderRadius:"16px",padding:"28px",width:"320px",textAlign:"center"}}>
      <div style={{fontSize:"32px",marginBottom:"8px"}}>⚠️</div>
      <h3 style={{margin:"0 0 7px",color:"#d97706"}}>Linked to Invoice!</h3>
      <p style={{fontSize:"12px",color:"#6b84a3",margin:"0 0 10px"}}>This work is linked to the following invoice(s):</p>
      <div style={{marginBottom:"14px"}}>
        {orphanWarning.invoices.map(inv=>(
          <div key={inv.id} style={{padding:"7px 12px",background:"#fef3c7",borderRadius:"8px",marginBottom:"6px",fontSize:"13px",fontWeight:600,color:"#d97706"}}>
            🧾 {inv.number} — ₹{inv.total?.toLocaleString()}
          </div>
        ))}
      </div>
      <p style={{fontSize:"12px",color:"#dc2626",margin:"0 0 16px"}}>Deleting will flag the invoice as incomplete!</p>
      <div style={{display:"flex",gap:"9px",justifyContent:"center"}}>
        <button onClick={()=>{
  setInvoices(p=>p.map(inv=>
    orphanWarning.invoices.some(oi=>oi.id===inv.id)
    ?{...inv,flagged:true}
    :inv
  ));
  setOrphanWarning(null);
  if(orphanWarning.isSite){
    setDelSiteModal(orphanWarning.siteId);
  } else {
    setDelWorkModal({siteId:orphanWarning.siteId,wid:orphanWarning.wid});
  }
}} style={S.btn("#dc2626")}>Proceed</button>
        <button onClick={()=>setOrphanWarning(null)} style={S.btn("#f0f4f9","#1a2b4a")}>Cancel</button>
      </div>
    </div>
  </div>
)}
      {[...sites].sort((a,b)=>{
  if(a.status==="Active"&&b.status!=="Active") return -1;
  if(a.status!=="Active"&&b.status==="Active") return 1;
  if(a.status==="Active") return b.id-a.id;
const aMax=(a.works||[]).map(w=>w.toDate||"").filter(Boolean).sort().pop()||"";
const bMax=(b.works||[]).map(w=>w.toDate||"").filter(Boolean).sort().pop()||"";
return bMax.localeCompare(aMax);
}).map((site,idx)=>{
        const sa=assignments[site.id]||{};const isExp=expandSite===site.id;const tab=getTab(site.id);
        const rev=(site.works||[]).reduce((a,w)=>a+calcWork(w),0);
        return(
          <div key={site.id} style={{...S.card,marginBottom:"12px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"9px"}}>
              <div>
                <h3 style={{margin:"0 0 2px",fontSize:"15px",fontWeight:700}}>{sites.length-idx}. {site.name}</h3>
                <div style={{fontSize:"11px",color:"#6b84a3"}}>{site.client}</div>
                <div style={{fontSize:"13px",fontWeight:700,color:"#166534",marginTop:"3px"}}>₹{rev.toLocaleString()}</div>
              </div>
              <div style={{display:"flex",gap:"6px",alignItems:"center"}}>
                <select value={site.status} onChange={e=>setSites(p=>p.map(s=>s.id===site.id?{...s,status:e.target.value}:s))} style={{padding:"3px 8px",borderRadius:"20px",border:"none",fontSize:"11px",fontWeight:600,outline:"none",cursor:"pointer",background:site.status==="Active"?"#dcfce7":site.status==="On Hold"?"#fef9c3":"#fee2e2",color:site.status==="Active"?"#166534":site.status==="On Hold"?"#d97706":"#991b1b"}}>
  <option value="Active">Active</option>
  <option value="On Hold">On Hold</option>
  <option value="Completed">Completed</option>
</select>
                <button onClick={()=>deleteSite(site.id)} style={{...S.btn("#fee2e2","#991b1b"),padding:"4px 9px",fontSize:"12px"}}>🗑️</button>
              </div>
            </div>
            {(site.works||[]).length>0&&<SiteWorksDropdown works={site.works} siteId={site.id} isExp={isExp} tab={tab} startEdit={startEdit} deleteWork={deleteWork}/>}
            <button onClick={()=>setExpandSite(isExp?null:site.id)} style={S.btn("#f0f6ff","#1e50a0")}>{isExp?"Close ▲":"Manage ▼"}</button>
            {isExp&&<div style={{marginTop:"12px"}}>
              <div style={{display:"flex",gap:"7px",marginBottom:"12px"}}>
                {[["works","📐 Works"],["assign","⚙️ Workers"]].map(([t,lbl])=>(
                  <button key={t} onClick={()=>setSiteTab(p=>({...p,[site.id]:t}))} style={S.btn(tab===t?"#1e50a0":"#e5e7eb",tab===t?"#fff":"#374151")}>{lbl}</button>
                ))}
              </div>
              {tab==="works"&&<div>
                {saveMsg[site.id]&&<SuccessBox msg="Work entry saved successfully!"/>}
                <button onClick={()=>{setAddingWork(addingWork===site.id?null:site.id);setEditWorkId(null);setWorkForm(EMPTY_WORK);}} style={{...S.btn(),marginBottom:"10px",fontSize:"12px",padding:"7px 13px"}}>+ Add Work Entry</button>
                {addingWork===site.id&&<div style={{...S.card,marginBottom:"10px",border:"1.5px solid #bfdbfe",padding:"14px"}}>
                  <h4 style={{margin:"0 0 10px"}}>{editWorkId?"Edit":"New"} Work Entry</h4>
                  <div style={{marginBottom:"10px"}}>
                    <label style={S.lbl}>Work Type</label>
                    <div style={{display:"flex",gap:"8px"}}>
                      {WORK_TYPES.map(t=>(
                        <button key={t} onClick={()=>setWorkForm(p=>({...p,workType:t}))} style={{...S.btn(workForm.workType===t?WORK_TYPE_COLOR[t].color:"#e5e7eb",workForm.workType===t?"#fff":"#374151"),padding:"6px 14px",fontSize:"12px"}}>{t}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"9px"}}>
                    <div style={{gridColumn:"1/-1"}}><label style={S.lbl}>Place / Description</label><input value={workForm.place} onChange={e=>setWorkForm(p=>({...p,place:e.target.value}))} style={S.inp}/></div>
                    <div><label style={S.lbl}>From Date</label><input type="date" value={workForm.fromDate} onChange={e=>setWorkForm(p=>({...p,fromDate:e.target.value}))} style={S.inp}/></div>
                    <div><label style={S.lbl}>To Date</label><input type="date" value={workForm.toDate} onChange={e=>setWorkForm(p=>({...p,toDate:e.target.value}))} style={S.inp}/></div>
                    {workForm.workType==="Manpower"
  ?<><div><label style={S.lbl}>No. of Labour</label><input type="number" value={workForm.labour} onChange={e=>setWorkForm(p=>({...p,labour:e.target.value}))} style={S.inp}/></div>
    <div><label style={S.lbl}>Rate per Day (₹)</label><input type="number" value={workForm.rate} onChange={e=>setWorkForm(p=>({...p,rate:e.target.value}))} style={S.inp}/></div></>
  :workForm.workType==="Other"
  ?<><div style={{gridColumn:"1/-1"}}><label style={S.lbl}>Amount (₹)</label><input type="number" value={workForm.amount} onChange={e=>setWorkForm(p=>({...p,amount:e.target.value}))} style={S.inp}/></div></>
  :<><div><label style={S.lbl}>{workForm.workType==="RMT"?"Length (rmt)":workForm.workType==="KGS"?"Weight (kgs)":"Area (m²)"}</label><input type="number" value={workForm.area} onChange={e=>setWorkForm(p=>({...p,area:e.target.value}))} style={S.inp}/></div>
    <div><label style={S.lbl}>Rate (₹/{workForm.workType==="RMT"?"rmt":workForm.workType==="KGS"?"kgs":"m²"})</label><input type="number" value={workForm.rate} onChange={e=>setWorkForm(p=>({...p,rate:e.target.value}))} style={S.inp}/></div></>
}
                  </div>
                  {((workForm.workType==="Manpower"&&workForm.labour&&workForm.rate)||(workForm.workType==="Other"&&workForm.amount)||(workForm.workType!=="Manpower"&&workForm.workType!=="Other"&&workForm.area&&workForm.rate))&&
  <div style={{marginTop:"8px",padding:"7px 11px",background:"#dcfce7",borderRadius:"7px",fontSize:"13px",fontWeight:600,color:"#166534"}}>
    💰 ₹{workForm.workType==="Manpower"?(Number(workForm.labour)*Number(workForm.rate)).toLocaleString():workForm.workType==="Other"?Number(workForm.amount).toLocaleString():(Number(workForm.area)*Number(workForm.rate)).toLocaleString()}
  </div>}
                  <div style={{display:"flex",gap:"7px",marginTop:"11px"}}>
                    <button onClick={()=>saveWork(site.id)} style={{...S.btn(),fontSize:"12px",padding:"7px 13px"}}>💾 Save</button>
                    <button onClick={()=>{setAddingWork(null);setEditWorkId(null);}} style={{...S.btn("#f0f4f9","#1a2b4a"),fontSize:"12px",padding:"7px 13px"}}>Cancel</button>
                  </div>
                </div>}
              </div>}
              {tab==="assign"&&<div style={{background:"#f8faff",borderRadius:"10px",padding:"12px"}}>
                <p style={{margin:"0 0 10px",fontSize:"11px",color:"#6b84a3",fontWeight:600}}>Click to assign/remove workers.</p>
                <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                  {workers.map(w=>{const isA=!!sa[w.id];const desig=sa[w.id]||w.category;return(
                    <div key={w.id} style={{display:"flex",alignItems:"center",gap:"9px",padding:"8px 12px",borderRadius:"9px",background:isA?"#fff":"#f0f4f9",border:isA?`1.5px solid ${CAT_COLOR[desig].color}`:"1.5px solid transparent"}}>
                      <div onClick={()=>toggleWorker(site.id,w)} style={{width:"20px",height:"20px",borderRadius:"5px",flexShrink:0,background:isA?"#1e50a0":"#e5e7eb",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#fff",fontSize:"12px",fontWeight:700}}>{isA?"✓":""}</div>
                      <div style={{flex:1}}><div style={{fontSize:"13px",fontWeight:600}}>{w.name}</div><div style={{fontSize:"10px",color:"#6b84a3"}}>Profile: <span style={{color:CAT_COLOR[w.category].color,fontWeight:600}}>{w.category}</span></div></div>
                      {isA&&<select value={desig} onChange={e=>changeDesig(site.id,w.id,e.target.value)} onClick={e=>e.stopPropagation()} style={{padding:"3px 6px",borderRadius:"6px",border:`1.5px solid ${CAT_COLOR[desig].color}`,fontSize:"11px",fontWeight:600,color:CAT_COLOR[desig].color,background:CAT_COLOR[desig].bg,outline:"none"}}>
                        {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                      </select>}
                    </div>
                  );})}
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
function Workers({workers,setWorkers,execProfile,setExecProfile}){
  const [view,setView]=useState("list");
  const [editId,setEditId]=useState(null);
  const [addOpen,setAddOpen]=useState(false);
  const [form,setForm]=useState({...EMPTY_WORKER});
  const [delConfirm,setDelConfirm]=useState(null);
  const [showAadhaar,setShowAadhaar]=useState({});
  const setF=(k,v)=>setForm(p=>({...p,[k]:v}));
  const saveEdit=()=>{setWorkers(p=>p.map(w=>w.id===editId?{...w,...form}:w));setEditId(null);};
  const addWorker=()=>{if(!form.name.trim()||workers.length>=20)return;setWorkers(p=>[...p,{...form,id:Date.now()}]);setForm({...EMPTY_WORKER});setAddOpen(false);};
  const deleteWorker=id=>{setWorkers(p=>p.filter(w=>w.id!==id));setDelConfirm(null);};
  const mask=n=>(!n||n.length<4)?(n||"—"):"XXXX-XXXX-"+n.slice(-4);
  const openEdit=w=>{setForm({...w});setEditId(w.id);};
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"18px",flexWrap:"wrap",gap:"8px"}}>
        <h2 style={{margin:0,fontSize:"20px",fontWeight:800}}>👷 Workers & Profiles</h2>
        <div style={{display:"flex",gap:"7px"}}>
          <button onClick={()=>setView("list")} style={S.btn(view==="list"?"#1e50a0":"#e5e7eb",view==="list"?"#fff":"#374151")}>Workers</button>
          <button onClick={()=>setView("exec")} style={S.btn(view==="exec"?"#1e50a0":"#e5e7eb",view==="exec"?"#fff":"#374151")}>Executive</button>
          {view==="list"&&workers.length<20&&<button onClick={()=>{setAddOpen(p=>!p);setForm({...EMPTY_WORKER});}} style={S.btn("#0f3172")}>+ Add</button>}
        </div>
      </div>
      {addOpen&&view==="list"&&<div style={{...S.card,marginBottom:"16px",border:"1.5px solid #bfdbfe"}}>
        <h3 style={{margin:"0 0 12px",fontSize:"14px",fontWeight:700}}>New Worker Profile</h3>
        <WForm form={form} setF={setF}/>
        <div style={{display:"flex",gap:"8px"}}><button onClick={addWorker} style={S.btn()}>💾 Save</button><button onClick={()=>setAddOpen(false)} style={S.btn("#f0f4f9","#1a2b4a")}>Cancel</button></div>
      </div>}
      {view==="exec"&&<div style={{...S.card,maxWidth:"500px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"13px",marginBottom:"16px"}}>
          {execProfile.photo?<img src={execProfile.photo} style={{width:"48px",height:"48px",borderRadius:"50%",objectFit:"cover"}}/>:<div style={{width:"48px",height:"48px",borderRadius:"50%",background:"#1e50a0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"17px",color:"#fff",fontWeight:700}}>V</div>}
          <div><div style={{fontSize:"15px",fontWeight:700}}>Vinoth Kumar. N</div><div style={{fontSize:"11px",color:"#6b84a3"}}>Site Executive</div></div>
        </div>
        {editId==="exec"
          ?<><EForm form={form} setF={setF}/><div style={{display:"flex",gap:"8px"}}><button onClick={()=>{setExecProfile({...execProfile,...form});setEditId(null);}} style={S.btn()}>💾 Save</button><button onClick={()=>setEditId(null)} style={S.btn("#f0f4f9","#1a2b4a")}>Cancel</button></div></>
          :<>{execProfile.photo&&<img src={execProfile.photo} style={{width:"80px",height:"80px",borderRadius:"8px",objectFit:"cover",marginBottom:"12px"}}/>}
            <PRow label="Phone" value={execProfile.phone||"—"}/>
            <PRow label="Aadhaar" value={showAadhaar["exec"]?(execProfile.aadhaar||"—"):mask(execProfile.aadhaar)} toggle={()=>setShowAadhaar(p=>({...p,exec:!p["exec"]}))}/>
            <PRow label="Date of Birth" value={execProfile.dob||"—"}/>
            <PRow label="Date of Joining" value={execProfile.doj||"—"}/>
            <button onClick={()=>{setForm({...EMPTY_WORKER,...execProfile});setEditId("exec");}} style={{...S.btn(),marginTop:"12px"}}>✏️ Edit Profile</button>
          </>}
      </div>}
      {view==="list"&&<>
        <div style={{fontSize:"11px",color:"#6b84a3",marginBottom:"12px"}}>{workers.length}/20 workers</div>
        {CATEGORIES.map(cat=>(
          <div key={cat} style={{marginBottom:"20px"}}>
            <h3 style={{margin:"0 0 9px",fontSize:"12px",fontWeight:700,color:CAT_COLOR[cat].color,textTransform:"uppercase",letterSpacing:".05em"}}>{cat}s ({workers.filter(w=>w.category===cat).length})</h3>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:"10px"}}>
              {workers.filter(w=>w.category===cat).map(w=>(
                <WCard key={w.id} w={w} isEditing={editId===w.id} form={form} setF={setF}
                  onEdit={()=>openEdit(w)} onSave={saveEdit} onCancel={()=>setEditId(null)}
                  onDelete={()=>setDelConfirm(w.id)} showAadhaar={!!showAadhaar[w.id]}
                  toggleAadhaar={()=>setShowAadhaar(p=>({...p,[w.id]:!p[w.id]}))} mask={mask}/>
              ))}
            </div>
          </div>
        ))}
      </>}
      {delConfirm&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
        <div style={{background:"#fff",borderRadius:"16px",padding:"28px",width:"290px",textAlign:"center"}}>
          <div style={{fontSize:"32px",marginBottom:"8px"}}>⚠️</div>
          <h3 style={{margin:"0 0 7px"}}>Delete Worker?</h3>
          <p style={{fontSize:"12px",color:"#6b84a3",margin:"0 0 20px"}}>Removes <strong>{workers.find(w=>w.id===delConfirm)?.name}</strong> permanently.</p>
          <div style={{display:"flex",gap:"9px",justifyContent:"center"}}><button onClick={()=>deleteWorker(delConfirm)} style={S.btn("#dc2626")}>Yes, Delete</button><button onClick={()=>setDelConfirm(null)} style={S.btn("#f0f4f9","#1a2b4a")}>Cancel</button></div>
        </div>
      </div>}
    </div>
  );
}

function WCard({w,isEditing,form,setF,onEdit,onSave,onCancel,onDelete,showAadhaar,toggleAadhaar,mask}){
  const [exp,setExp]=useState(false);
  return(
    <div style={{...S.card,padding:"13px"}}>
      <div onClick={()=>!isEditing&&setExp(p=>!p)} style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:exp||isEditing?"11px":"0",cursor:"pointer"}}>
        {w.photo?<img src={w.photo} style={{width:"38px",height:"38px",borderRadius:"50%",objectFit:"cover",flexShrink:0}}/>:<div style={{width:"38px",height:"38px",borderRadius:"50%",background:CAT_COLOR[w.category].bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",fontWeight:700,color:CAT_COLOR[w.category].color,flexShrink:0}}>{w.name[0]}</div>}
        <div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,fontSize:"13px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{w.name}</div><span style={S.badge(w.category)}>{w.category}</span></div>
        <div style={{fontSize:"12px",color:"#90afd4"}}>{exp||isEditing?"▲":"▼"}</div>
      </div>
      {isEditing&&<div><WForm form={form} setF={setF}/><div style={{display:"flex",gap:"7px"}}><button onClick={onSave} style={{...S.btn(),padding:"6px 12px",fontSize:"12px"}}>💾</button><button onClick={onCancel} style={{...S.btn("#f0f4f9","#1a2b4a"),padding:"6px 12px",fontSize:"12px"}}>Cancel</button></div></div>}
      {!isEditing&&exp&&<div>
        {w.photo&&<img src={w.photo} style={{width:"80px",height:"80px",borderRadius:"8px",objectFit:"cover",marginBottom:"10px"}}/>}
        <PRow label="📞 Phone" value={w.phone||"—"}/>
        <PRow label="🪪 Aadhaar" value={showAadhaar?(w.aadhaar||"—"):mask(w.aadhaar)} toggle={toggleAadhaar}/>
        <PRow label="🎂 DOB" value={w.dob?fmtDate(w.dob):"—"}/>
        <PRow label="📅 Joined" value={w.doj?fmtDate(w.doj):"—"}/>
        <div style={{display:"flex",gap:"7px",marginTop:"10px"}}><button onClick={onEdit} style={{...S.btn(),padding:"5px 12px",fontSize:"12px"}}>✏️ Edit</button><button onClick={onDelete} style={{...S.btn("#fee2e2","#991b1b"),padding:"5px 12px",fontSize:"12px"}}>🗑️ Delete</button></div>
      </div>}
    </div>
  );
}
function PRow({label,value,toggle}){return <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"1px solid #f0f4f9",fontSize:"12px"}}><span style={{color:"#6b84a3",fontWeight:600,fontSize:"11px"}}>{label}</span><span style={{fontWeight:500}}>{value}{toggle&&<span onClick={toggle} style={{marginLeft:"7px",fontSize:"11px",color:"#1e50a0",cursor:"pointer"}}>👁</span>}</span></div>;}
function WForm({form,setF}){return<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"12px"}}>
  <div style={{gridColumn:"1/-1"}}><PhotoUpload value={form.photo||""} onChange={v=>setF("photo",v)}/></div>
  <div style={{gridColumn:"1/-1"}}><label style={S.lbl}>Full Name</label><input value={form.name} onChange={e=>setF("name",e.target.value)} placeholder="Worker name" style={S.inp}/></div>
  <div><label style={S.lbl}>Default Category</label><select value={form.category} onChange={e=>setF("category",e.target.value)} style={S.inp}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></div>
  <div><label style={S.lbl}>Phone</label><input value={form.phone} onChange={e=>setF("phone",e.target.value)} placeholder="10-digit" style={S.inp} maxLength={10}/></div>
  <div><label style={S.lbl}>Aadhaar</label><input value={form.aadhaar} onChange={e=>setF("aadhaar",e.target.value)} placeholder="12-digit" style={S.inp} maxLength={12}/></div>
  <div><label style={S.lbl}>Date of Birth</label><input type="date" value={form.dob} onChange={e=>setF("dob",e.target.value)} style={S.inp}/></div>
  <div><label style={S.lbl}>Date of Joining</label><input type="date" value={form.doj} onChange={e=>setF("doj",e.target.value)} style={S.inp}/></div>
</div>;}
function EForm({form,setF}){return<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"12px"}}>
  <div style={{gridColumn:"1/-1"}}><PhotoUpload value={form.photo||""} onChange={v=>setF("photo",v)}/></div>
  <div><label style={S.lbl}>Phone</label><input value={form.phone} onChange={e=>setF("phone",e.target.value)} style={S.inp} maxLength={10}/></div>
  <div><label style={S.lbl}>Aadhaar</label><input value={form.aadhaar} onChange={e=>setF("aadhaar",e.target.value)} style={S.inp} maxLength={12}/></div>
  <div><label style={S.lbl}>Date of Birth</label><input type="date" value={form.dob} onChange={e=>setF("dob",e.target.value)} style={S.inp}/></div>
  <div><label style={S.lbl}>Date of Joining</label><input type="date" value={form.doj} onChange={e=>setF("doj",e.target.value)} style={S.inp}/></div>
</div>;}

// ── ATTENDANCE ────────────────────────────────────────
function Attendance({workers,sites,attendance,setAttendance,assignments}){
  const [tab,setTab]=useState("mark");
  const [selSite,setSelSite]=useState(sites[0]?.id||0);
  const [selDate,setSelDate]=useState(today);
  const [repSite,setRepSite]=useState(sites[0]?.id||0);
  const [repMonth,setRepMonth]=useState(new Date().getMonth());
  const [repYear,setRepYear]=useState(new Date().getFullYear());
  const [repClient,setRepClient]=useState("Swathi Engineering Agency");
  const [repPlace,setRepPlace]=useState("Chennai");
  const [repNameOfWork,setRepNameOfWork]=useState("");
  const [repFromDate,setRepFromDate]=useState(`${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,"0")}-01`);
  const [repToDate,setRepToDate]=useState(today);
  const [unmarkConfirm,setUnmarkConfirm]=useState(null);
  const mark=(wid,status)=>setAttendance(p=>{
  const key=`${selDate}_${selSite}_${wid}`;
  if(status===null){const n={...p};delete n[key];return n;}
  return {...p,[key]:status};
});
  const getStatus=wid=>attendance[`${selDate}_${selSite}_${wid}`]||null;
  const sa=selSite?(assignments[selSite]||{}):{};
  const aids=Object.keys(sa).map(Number);
  const present=aids.filter(w=>getStatus(w)==="Present").length;
  const absent=aids.filter(w=>getStatus(w)==="Absent").length;
  const half=aids.filter(w=>getStatus(w)==="Half").length;
  const daysInMonth=getDaysInMonth(repMonth,repYear);
  const days=Array.from({length:daysInMonth},(_,i)=>i+1);
  const repSiteObj=sites.find(s=>s.id===repSite);
  const repAssign=assignments[repSite]||{};
  const repWorkers=workers.filter(w=>repAssign[w.id]);
  const getAttVal=(wid,day)=>{const dd=String(day).padStart(2,"0");const mm=String(repMonth+1).padStart(2,"0");return attendance[`${repYear}-${mm}-${dd}_${repSite}_${wid}`]||"";};
  const getTotalDays=wid=>days.reduce((acc,d)=>{const v=getAttVal(wid,d);if(v==="Present")return acc+1;if(v==="Half")return acc+0.5;return acc;},0);
  const fromDate=fmtDate(repFromDate);const toDate=fmtDate(repToDate);
  return(
    <div>
      <h2 style={{margin:"0 0 16px",fontSize:"20px",fontWeight:800}}>✅ Attendance</h2>
      <div style={{display:"flex",gap:"7px",marginBottom:"16px",overflowX:"auto",paddingBottom:"4px"}}>
        {[["mark","📝 Mark"],["report","📊 Report"]].map(([t,lbl])=>(
          <button key={t} onClick={()=>setTab(t)} style={{...S.btn(tab===t?"#1e50a0":"#e5e7eb",tab===t?"#fff":"#374151"),flexShrink:0}}>{lbl}</button>
        ))}
      </div>
      {tab==="mark"&&<>
        <div style={{display:"flex",gap:"12px",marginBottom:"16px",flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:"140px"}}><label style={S.lbl}>Site</label><select value={selSite} onChange={e=>setSelSite(Number(e.target.value))} style={S.inp}>{sites.map(st=><option key={st.id} value={st.id}>{st.name}</option>)}</select></div>
          <div style={{flex:1,minWidth:"140px"}}><label style={S.lbl}>Date</label><input type="date" value={selDate} onChange={e=>setSelDate(e.target.value)} style={S.inp}/></div>
        </div>
        <div style={{...S.card,marginBottom:"16px",display:"flex",gap:"18px",flexWrap:"wrap"}}>
          {[["Present",present,"#166534"],["Half",half,"#d97706"],["Absent",absent,"#991b1b"],["Unmarked",aids.length-present-absent-half,"#6b84a3"],["Total",aids.length,"#1e50a0"]].map(([lbl,val,color])=>(
            <div key={lbl}><span style={{fontSize:"19px",fontWeight:800,color}}>{val}</span><div style={{fontSize:"10px",color:"#6b84a3"}}>{lbl}</div></div>
          ))}
        </div>
        {aids.length===0?<div style={{...S.card,textAlign:"center",color:"#9db3cc",padding:"32px"}}>No workers assigned to this site.</div>
        :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:"10px"}}>
          {aids.map(wid=>{
            const w=workers.find(x=>x.id===wid);if(!w)return null;
            const desig=sa[wid]||w.category;const status=getStatus(wid);
            return(
              <div key={wid} style={{...S.card,padding:"13px"}}>
                <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"10px"}}>
                  {w.photo?<img src={w.photo} style={{width:"36px",height:"36px",borderRadius:"50%",objectFit:"cover"}}/>:<div style={{width:"36px",height:"36px",borderRadius:"50%",background:CAT_COLOR[w.category].bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",fontWeight:700,color:CAT_COLOR[w.category].color}}>{w.name[0]}</div>}
                  <div><div style={{fontWeight:600,fontSize:"13px"}}>{w.name}</div><span style={S.badge(desig)}>{desig}</span></div>
                </div>
                <div style={{display:"flex",gap:"5px"}}>
                  {[["Present","✓ P","#166534"],["Half","½ H","#d97706"],["Absent","✗ A","#991b1b"]].map(([st,lbl,ac])=>(
  <button key={st} onClick={()=>{
    if(status===st){
  setUnmarkConfirm({wid,st});
} else {
      mark(wid,st);
    }
  }} style={{flex:1,padding:"6px 4px",borderRadius:"6px",border:"none",fontSize:"11px",fontWeight:600,cursor:"pointer",background:status===st?ac:"#e5e7eb",color:status===st?"#fff":"#6b7280"}}>{lbl}</button>
))}
                </div>
              </div>
            );
          })}
        </div>}
      </>}
      {tab==="report"&&<>
        <div style={{...S.card,marginBottom:"16px"}}>
          <h3 style={{margin:"0 0 14px",fontSize:"14px",fontWeight:700}}>Report Settings</h3>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:"10px",marginBottom:"12px"}}>
            <div><label style={S.lbl}>Site</label><select value={repSite} onChange={e=>setRepSite(Number(e.target.value))} style={S.inp}>{sites.map(st=><option key={st.id} value={st.id}>{st.name}</option>)}</select></div>
            <div><label style={S.lbl}>Month</label><select value={repMonth} onChange={e=>setRepMonth(Number(e.target.value))} style={S.inp}>{MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}</select></div>
            <div><label style={S.lbl}>Year</label><select value={repYear} onChange={e=>setRepYear(Number(e.target.value))} style={S.inp}>{Array.from({length:5},(_,i)=>new Date().getFullYear()-2+i).map(y=><option key={y}>{y}</option>)}</select></div>
            <div><label style={S.lbl}>Client Name</label><input value={repClient} onChange={e=>setRepClient(e.target.value)} style={S.inp}/></div>
            <div><label style={S.lbl}>Name of Work</label><input value={repNameOfWork} onChange={e=>setRepNameOfWork(e.target.value)} placeholder="e.g. Epoxy Floor Coating" style={S.inp}/></div>
            <div><label style={S.lbl}>Place</label><input value={repPlace} onChange={e=>setRepPlace(e.target.value)} style={S.inp}/></div>
            <div><label style={S.lbl}>Work From Date</label><input type="date" value={repFromDate} onChange={e=>setRepFromDate(e.target.value)} style={S.inp}/></div>
            <div><label style={S.lbl}>Work To Date</label><input type="date" value={repToDate} onChange={e=>setRepToDate(e.target.value)} style={S.inp}/></div>
          </div>
          <button onClick={()=>{
  const el=document.getElementById("att-report");
  if(!el)return;
  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Attendance Report</title><style>@page{size:A4 landscape;margin:0;}body{font-family:'Segoe UI',sans-serif;color:#1a2b4a;background:#fff;padding:6mm;margin:0;}table{border-collapse:collapse;width:100%;table-layout:fixed;}th,td{padding:2px 1px;font-size:8px;overflow:hidden;}th:first-child,td:first-child{width:90px;font-size:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}th:not(:first-child),td:not(:first-child){width:18px;text-align:center;}img{max-width:100%;}.no-print{display:none!important;}</style></head><body onload="window.print();">${el.outerHTML}</body></html>`;
  const a=document.createElement("a");
  a.href="data:text/html;charset=utf-8,"+encodeURIComponent(html);
  a.download="Attendance-Report.html";
  a.style.display="none";
  document.body.appendChild(a);a.click();document.body.removeChild(a);
}} style={S.btn()}>🖨️ Print / PDF</button>
        </div>
        <div id="att-report" style={{background:"#fff",padding:"24px",borderRadius:"12px",boxShadow:"0 2px 16px rgba(30,80,160,0.08)",overflowX:"auto"}}>
          <div style={{textAlign:"center",marginBottom:"20px",borderBottom:"2px solid #0f3172",paddingBottom:"14px"}}>
  <div style={{fontSize:"22px",fontWeight:800,color:"#0f3172",marginBottom:"6px"}}>VinoDhan Coating</div>
<div style={{fontSize:"18px",fontWeight:800,color:"#0f3172"}}>ATTENDANCE REPORT</div>
  <div style={{fontSize:"12px",color:"#6b84a3",marginTop:"4px"}}>{MONTHS[repMonth]} {repYear}</div>
</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px 20px",marginBottom:"20px",fontSize:"13px"}}>
            {[["Client",repClient],["Site Name",repSiteObj?.name||"—"],["Name of Work",repNameOfWork||"—"],["Place",repPlace],["Duration",`${fromDate} to ${toDate}`]].map(([lbl,val])=>(
              <div key={lbl} style={{display:"flex",gap:"8px",padding:"4px 0",borderBottom:"1px solid #f0f4f9"}}><span style={{fontWeight:600,color:"#6b84a3",minWidth:"90px"}}>{lbl}</span><span style={{color:"#1a2b4a"}}>: {val}</span></div>
            ))}
          </div>
          {repWorkers.length===0?<div style={{textAlign:"center",color:"#9db3cc",padding:"30px"}}>No workers assigned.</div>
          :<div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:"11px"}}>
              <thead><tr style={{background:"#0f3172",color:"#fff"}}>
                <th style={{padding:"8px 10px",textAlign:"left",fontWeight:600,whiteSpace:"nowrap",minWidth:"130px"}}>Worker Name</th>
                {days.map(d=><th key={d} style={{padding:"6px 4px",textAlign:"center",fontWeight:600,minWidth:"22px"}}>{d}</th>)}
                <th style={{padding:"8px 10px",textAlign:"center",fontWeight:600,whiteSpace:"nowrap"}}>Total</th>
              </tr></thead>
              <tbody>
                {repWorkers.map((w,idx)=>{
                  const total=getTotalDays(w.id);
                  return(
                    <tr key={w.id} style={{background:idx%2===0?"#fff":"#f8faff",borderBottom:"1px solid #f0f4f9"}}>
                      <td style={{padding:"7px 10px",fontWeight:600,whiteSpace:"nowrap"}}>{w.name}</td>
                      {days.map(d=>{const v=getAttVal(w.id,d);const bg=v==="Present"?"#dcfce7":v==="Half"?"#fef9c3":v==="Absent"?"#fee2e2":"transparent";const col=v==="Present"?"#166534":v==="Half"?"#d97706":v==="Absent"?"#991b1b":"#d1d5db";return <td key={d} style={{padding:"4px 2px",textAlign:"center",background:bg,color:col,fontWeight:600,fontSize:"10px"}}>{v==="Present"?"P":v==="Half"?"H":v==="Absent"?"A":""}</td>;})}
                      <td style={{padding:"7px 10px",textAlign:"center",fontWeight:800,color:"#1e50a0"}}>{total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>}
          <div style={{display:"flex",gap:"16px",marginTop:"14px",fontSize:"11px"}}>
            {[["P","Present","#dcfce7","#166534"],["H","Half Day","#fef9c3","#d97706"],["A","Absent","#fee2e2","#991b1b"]].map(([sym,lbl,bg,col])=>(
              <div key={sym} style={{display:"flex",alignItems:"center",gap:"5px"}}><span style={{background:bg,color:col,fontWeight:700,padding:"2px 6px",borderRadius:"4px",fontSize:"10px"}}>{sym}</span><span style={{color:"#6b84a3"}}>{lbl}</span></div>
            ))}
          </div>
        </div>
      </>}
      {unmarkConfirm&&(
  <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:3000}}>
    <div style={{background:"#fff",borderRadius:"16px",padding:"28px",width:"300px",textAlign:"center"}}>
      <div style={{fontSize:"32px",marginBottom:"8px"}}>⚠️</div>
      <h3 style={{margin:"0 0 7px"}}>Remove Attendance?</h3>
      <p style={{fontSize:"12px",color:"#6b84a3",margin:"0 0 16px"}}>Are you sure you want to remove the <strong>{unmarkConfirm.st}</strong> mark?</p>
      <div style={{display:"flex",gap:"9px",justifyContent:"center"}}>
        <button onClick={()=>{mark(unmarkConfirm.wid,null);setUnmarkConfirm(null);}} style={S.btn("#dc2626")}>Yes, Remove</button>
        <button onClick={()=>setUnmarkConfirm(null)} style={S.btn("#f0f4f9","#1a2b4a")}>Cancel</button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
// ── ENTRY PERMIT ──────────────────────────────────────
function EntryPermit({workers,sites,assignments,setWorkers}){
  const [siteMode,setSiteMode]=useState("existing");
  const [selSite,setSelSite]=useState(sites[0]?.id||0);
  const [manualSiteName,setManualSiteName]=useState("");
  const [manualClient,setManualClient]=useState("");
  const [manualPlace,setManualPlace]=useState("");
  const [selectedWorkers,setSelectedWorkers]=useState([]);
  const [fromDate,setFromDate]=useState(today);
  const [toDate,setToDate]=useState(today);
  const [showExecSign,setShowExecSign]=useState(true);

  const siteObj=sites.find(s=>s.id===selSite);
  const permitSiteName=siteMode==="existing"?(siteObj?.name||"")    :manualSiteName;
  const permitClient  =siteMode==="existing"?(siteObj?.client||"")  :manualClient;
  const permitPlace   =siteMode==="existing"?"Chennai"              :manualPlace;

  const sa=siteMode==="existing"?(assignments[selSite]||{}):{};
  const assignedWorkers=siteMode==="existing"?workers.filter(w=>sa[w.id]):workers;
  const toggleWorker=wid=>setSelectedWorkers(p=>p.includes(wid)?p.filter(x=>x!==wid):[...p,wid]);
  const selectAll=()=>setSelectedWorkers(assignedWorkers.map(w=>w.id));
  const clearAll=()=>setSelectedWorkers([]);
  const permitWorkers=workers.filter(w=>selectedWorkers.includes(w.id));
  const updateWorkerPhoto=(wid,photo)=>setWorkers(p=>p.map(w=>w.id===wid?{...w,photo}:w));

  return(
    <div>
      <h2 style={{margin:"0 0 16px",fontSize:"20px",fontWeight:800}}>🪪 Entry Permit</h2>
      <div style={{...S.card,marginBottom:"16px"}}>
        <h3 style={{margin:"0 0 14px",fontSize:"14px",fontWeight:700}}>Permit Settings</h3>
        {/* Mode Toggle */}
        <div style={{display:"flex",gap:"8px",marginBottom:"14px"}}>
          <button onClick={()=>setSiteMode("existing")} style={{...S.btn(siteMode==="existing"?"#1e50a0":"#e5e7eb",siteMode==="existing"?"#fff":"#374151"),fontSize:"12px",padding:"7px 14px"}}>📋 Existing Site</button>
          <button onClick={()=>setSiteMode("manual")} style={{...S.btn(siteMode==="manual"?"#1e50a0":"#e5e7eb",siteMode==="manual"?"#fff":"#374151"),fontSize:"12px",padding:"7px 14px"}}>✏️ Manual Entry</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"10px",marginBottom:"14px"}}>
          {siteMode==="existing"
            ?<div style={{gridColumn:"1/-1"}}><label style={S.lbl}>Select Site</label><select value={selSite} onChange={e=>{setSelSite(Number(e.target.value));setSelectedWorkers([]);}} style={S.inp}>{sites.map(st=><option key={st.id} value={st.id}>{st.name}</option>)}</select></div>
            :<><div><label style={S.lbl}>Site Name</label><input value={manualSiteName} onChange={e=>setManualSiteName(e.target.value)} placeholder="Enter site name" style={S.inp}/></div>
               <div><label style={S.lbl}>Client</label><input value={manualClient} onChange={e=>setManualClient(e.target.value)} placeholder="Client name" style={S.inp}/></div>
               <div><label style={S.lbl}>Place</label><input value={manualPlace} onChange={e=>setManualPlace(e.target.value)} placeholder="Location" style={S.inp}/></div></>
          }
          {siteMode==="existing"&&<>
            <div><label style={S.lbl}>Site Name</label><input value={permitSiteName} readOnly style={{...S.inp,background:"#f0f4f9",color:"#6b84a3"}}/></div>
            <div><label style={S.lbl}>Client</label><input value={permitClient} readOnly style={{...S.inp,background:"#f0f4f9",color:"#6b84a3"}}/></div>
            <div><label style={S.lbl}>Place</label><input value={permitPlace} readOnly style={{...S.inp,background:"#f0f4f9",color:"#6b84a3"}}/></div>
          </>}
          <div><label style={S.lbl}>Valid From</label><input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} style={S.inp}/></div>
          <div><label style={S.lbl}>Valid To</label><input type="date" value={toDate} onChange={e=>setToDate(e.target.value)} style={S.inp}/></div>
        </div>
        <div style={{marginBottom:"14px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
            <label style={S.lbl}>Select Workers ({selectedWorkers.length} selected)</label>
            <div style={{display:"flex",gap:"7px"}}>
              <button onClick={selectAll} style={{...S.btn("#f0f6ff","#1e50a0"),padding:"5px 10px",fontSize:"11px"}}>Select All</button>
              <button onClick={clearAll} style={{...S.btn("#fee2e2","#991b1b"),padding:"5px 10px",fontSize:"11px"}}>Clear</button>
            </div>
          </div>
          {assignedWorkers.length===0?<div style={{color:"#9db3cc",fontSize:"13px",padding:"12px",background:"#f8faff",borderRadius:"8px"}}>No workers assigned to this site.</div>
          :<div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
            {assignedWorkers.map(w=>{
              const sel=selectedWorkers.includes(w.id);const desig=sa[w.id]||w.category;
              return(
                <div key={w.id} style={{borderRadius:"10px",border:sel?`1.5px solid ${CAT_COLOR[desig].color}`:"1.5px solid #e5e7eb",overflow:"hidden",background:sel?CAT_COLOR[desig].bg:"#f8faff"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"10px",padding:"10px 12px"}}>
                    <div onClick={()=>toggleWorker(w.id)} style={{width:"22px",height:"22px",borderRadius:"5px",flexShrink:0,background:sel?"#1e50a0":"#e5e7eb",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#fff",fontSize:"13px",fontWeight:700}}>{sel?"✓":""}</div>
                    {w.photo?<img src={w.photo} style={{width:"36px",height:"36px",borderRadius:"50%",objectFit:"cover",flexShrink:0}}/>:<div style={{width:"36px",height:"36px",borderRadius:"50%",background:"#e5e7eb",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",fontWeight:700,color:"#9ca3af",flexShrink:0}}>{w.name[0]}</div>}
                    <div style={{flex:1}}><div style={{fontWeight:600,fontSize:"13px",color:sel?CAT_COLOR[desig].color:"#1a2b4a"}}>{w.name}</div><span style={S.badge(desig)}>{desig}</span></div>
                    <div onClick={e=>e.stopPropagation()}>
                      <label style={{...S.btn("#fff","#1e50a0"),padding:"5px 10px",fontSize:"11px",cursor:"pointer",border:"1.5px solid #bfdbfe",display:"inline-block"}}>
                        📷 {w.photo?"Change":"Add"} Photo
                        <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{e.stopPropagation();const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>updateWorkerPhoto(w.id,ev.target.result);r.readAsDataURL(f);}}/>
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>}
        </div>
        <button onClick={()=>printSection("entry-permit")} style={{...S.btn(),opacity:selectedWorkers.length===0?0.5:1}} disabled={selectedWorkers.length===0}>🖨️ Print Entry Permit ({selectedWorkers.length} workers)</button>
      </div>
      {permitWorkers.length>0?(
        <div id="entry-permit" style={{background:"#fff",padding:"28px",borderRadius:"12px",boxShadow:"0 2px 16px rgba(30,80,160,0.08)"}}>
          <div style={{textAlign:"center",marginBottom:"20px",paddingBottom:"14px",borderBottom:"2px solid #0f3172"}}><div style={{fontSize:"22px",fontWeight:800,color:"#0f3172",letterSpacing:"2px"}}>ENTRY PERMIT</div></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px 30px",marginBottom:"24px",fontSize:"13px"}}>
            {[["Client",permitClient],["Contractor","VinoDhan Coating"],["Site Name",permitSiteName],["Place",permitPlace],["Valid From",fmtDate(fromDate)],["Valid To",fmtDate(toDate)]].map(([lbl,val])=>(
              <div key={lbl} style={{display:"flex",gap:"8px",padding:"5px 0",borderBottom:"1px solid #f0f4f9"}}><span style={{fontWeight:700,color:"#6b84a3",minWidth:"100px",fontSize:"12px"}}>{lbl}</span><span style={{color:"#1a2b4a",fontWeight:600}}>: {val}</span></div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px"}}>
            {permitWorkers.map(w=>(
              <div key={w.id} style={{border:"1.5px solid #e5e7eb",borderRadius:"10px",overflow:"hidden",display:"flex",minHeight:"130px"}}>
                <div style={{width:"100px",flexShrink:0,background:"#f0f4f9",display:"flex",alignItems:"center",justifyContent:"center",borderRight:"1px solid #e5e7eb"}}>
                  {w.photo?<img src={w.photo} style={{width:"100px",height:"130px",objectFit:"cover"}}/>:<div style={{textAlign:"center",padding:"10px"}}><div style={{fontSize:"32px"}}>👤</div><div style={{fontSize:"9px",color:"#9db3cc",marginTop:"4px"}}>No Photo</div></div>}
                </div>
                <div style={{flex:1,padding:"12px 14px",fontSize:"12px"}}>
                  <div style={{fontWeight:800,fontSize:"14px",color:"#0f3172",marginBottom:"8px"}}>{w.name}</div>
                  {[["Category",sa[w.id]||w.category],["Aadhaar",w.aadhaar||"—"],["Phone",w.phone||"—"],["DOB",w.dob?fmtDate(w.dob):"—"]].map(([lbl,val])=>(
                    <div key={lbl} style={{display:"flex",gap:"6px",marginBottom:"5px"}}><span style={{color:"#6b84a3",fontWeight:600,minWidth:"65px"}}>{lbl}</span><span style={{color:"#1a2b4a"}}>: {val}</span></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{marginTop:"40px",display:"flex",justifyContent:"space-between",alignItems:"flex-end",flexWrap:"wrap",gap:"12px"}}>
  <div className="no-print">
    <label style={{display:"flex",alignItems:"center",gap:"8px",fontSize:"12px",color:"#6b84a3",cursor:"pointer"}}>
      <input type="checkbox" checked={showExecSign} onChange={e=>setShowExecSign(e.target.checked)}/>
      Show Executive Signature
    </label>
  </div>
  {showExecSign&&<div style={{textAlign:"center"}}><div style={{width:"200px",borderBottom:"1px solid #1a2b4a",marginBottom:"6px",height:"40px"}}></div><div style={{fontSize:"12px",fontWeight:700,color:"#1a2b4a"}}>Vinoth Kumar. N</div><div style={{fontSize:"11px",color:"#6b84a3"}}>Site Executive — VinoDhan Coating</div></div>}
</div>
        </div>
      ):(
        <div style={{...S.card,textAlign:"center",color:"#9db3cc",padding:"40px"}}><div style={{fontSize:"32px",marginBottom:"10px"}}>🪪</div><div>Select workers above to preview the entry permit</div></div>
      )}
    </div>
  );
}

// ── INVOICE ───────────────────────────────────────────
function Invoice({sites,invoices,setInvoices,company,setCompany,client,setClient,bank,setBank,recycleBin,setRecycleBin}){
  const [selWorks,setSelWorks]=useState([]);
  const [openSites,setOpenSites]=useState([]);
  const [viewInv,setViewInv]=useState(null);
  const [tab,setTab]=useState("new");
  const [invNum,setInvNum]=useState(`INV-${new Date().getFullYear()}-001`);
  const [invDate,setInvDate]=useState(today);
  const [invSiteName,setInvSiteName]=useState("");
  const [pwModal,setPwModal]=useState(null);
  const sigCanvas=useRef(null);
  const [sigMode,setSigMode]=useState("none");
  const [sigImage,setSigImage]=useState(null);
  const [sigDrawing,setSigDrawing]=useState(false);
  const lastPt=useRef(null);

  const invoicedWorkIds=new Set(invoices.flatMap(inv=>(inv.works||[]).map(w=>w.id)));

  const allWorks=sites
    .flatMap(s=>(s.works||[])
      .filter(w=>selWorks.includes(w.id)&&!invoicedWorkIds.has(w.id))
      .map(w=>({...w,siteId:s.id,siteName:s.name,amount:calcWork(w)}))
    )
    .sort((a,b)=>(a.fromDate||"").localeCompare(b.fromDate||""));

  const total=allWorks.reduce((a,w)=>a+w.amount,0);
useEffect(()=>{
  if(allWorks.length>0){
    setInvSiteName(allWorks[0].siteName||"");
  } else {
    setInvSiteName("");
  }
},[allWorks.length]);
  const startDraw=e=>{setSigDrawing(true);const r=sigCanvas.current.getBoundingClientRect();const x=(e.touches?e.touches[0].clientX:e.clientX)-r.left;const y=(e.touches?e.touches[0].clientY:e.clientY)-r.top;lastPt.current={x,y};};
  const draw=e=>{if(!sigDrawing||!sigCanvas.current||!lastPt.current)return;e.preventDefault();const r=sigCanvas.current.getBoundingClientRect();const x=(e.touches?e.touches[0].clientX:e.clientX)-r.left;const y=(e.touches?e.touches[0].clientY:e.clientY)-r.top;const ctx=sigCanvas.current.getContext("2d");ctx.strokeStyle="#1a2b4a";ctx.lineWidth=2;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(lastPt.current.x,lastPt.current.y);ctx.lineTo(x,y);ctx.stroke();lastPt.current={x,y};};
  const endDraw=()=>{setSigDrawing(false);if(sigCanvas.current)setSigImage(sigCanvas.current.toDataURL());};
  const clearSig=()=>{sigCanvas.current?.getContext("2d")?.clearRect(0,0,180,90);setSigImage(null);};
  const uploadSig=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>{if(ev.target?.result)setSigImage(ev.target.result);};r.readAsDataURL(f);};

  const saveInv=()=>{
  if(allWorks.length===0)return;
  setInvoices(p=>[...p,{id:Date.now(),number:invNum,date:invDate,total,works:allWorks,siteName:invSiteName,measureNo:client.measureNo,snapshot:{company:{...company},client:{...client},bank:{...bank}}}]);
  setSelWorks([]);setTab("history");
};

  // Delete invoice → password → recycle bin
  const deleteInv=inv=>{
    setPwModal({action:()=>{
      setRecycleBin(p=>({...p,invoices:[...(p.invoices||[]),inv]}));
      setInvoices(p=>p.filter(i=>i.id!==inv.id));
      setPwModal(null);
    }});
  };

  const upC=(k,v)=>setCompany(p=>({...p,[k]:v}));
  const upCl=(k,v)=>setClient(p=>({...p,[k]:v}));
  const upB=(k,v)=>setBank(p=>({...p,[k]:v}));
  const fmtD=d=>{if(!d)return"—";const[y,m,dy]=d.split("-");return`${dy}/${m}/${y}`;};

  const InvDoc=({inv})=>{
    const works=inv?inv.works:allWorks;
    const tot=inv?inv.total:total;
    const num=inv?inv.number:invNum;
    const dt=inv?fmtD(inv.date):fmtD(invDate);
    const editable=!inv;
    const displaySiteName=inv?inv.siteName:invSiteName;
const displayMeasureNo=inv?inv.measureNo:client.measureNo;
const snap=inv?.snapshot;
const dispCompany=snap?snap.company:company;
const dispClient=snap?snap.client:client;
const dispBank=snap?snap.bank:bank;
    return(
      <div style={{width:"210mm",minHeight:"297mm",margin:"0 auto",background:"#fff",padding:"20mm",borderRadius:"12px",boxShadow:"0 2px 20px rgba(0,0,0,0.08)",fontSize:"13px",border:"2px solid #0f3172",outline:"4px solid #e8f0fe",outlineOffset:"-8px",boxSizing:"border-box"}}>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"12px",paddingBottom:"16px",borderBottom:"2px solid #0f3172",marginBottom:"16px"}}>
          <div style={{flex:1,minWidth:"180px"}}>
            <div style={{fontSize:"18px",fontWeight:800,color:"#0f3172",marginBottom:"4px"}}>{editable?<EditField value={company.name} onChange={v=>upC("name",v)} style={{fontSize:"18px",fontWeight:800,color:"#0f3172"}}/>:dispCompany.name}</div>
            <div style={{fontSize:"11px",color:"#6b84a3",lineHeight:"1.9"}}>
              {editable?<EditField value={company.address} onChange={v=>upC("address",v)}/>:dispCompany.address}<br/>
              Ph: {editable?<EditField value={company.phone} onChange={v=>upC("phone",v)}/>:dispCompany.phone}<br/>
Udyam: {editable?<EditField value={company.gstin} onChange={v=>upC("gstin",v)}/>:dispCompany.gstin}
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:"22px",fontWeight:800,color:"#0f3172",marginBottom:"6px"}}>INVOICE</div>
            <div style={{fontSize:"11px",color:"#6b84a3",lineHeight:"2.2"}}>
              <strong>No: </strong>{editable?<input value={invNum} onChange={e=>setInvNum(e.target.value)} style={{border:"1.5px solid #bfdbfe",borderRadius:"5px",padding:"2px 6px",fontSize:"11px",outline:"none",width:"120px",color:"#1a2b4a",fontFamily:"inherit"}}/>:num}<br/>
              <strong>Date: </strong>{editable?<input type="date" value={invDate} onChange={e=>setInvDate(e.target.value)} style={{border:"1.5px solid #bfdbfe",borderRadius:"5px",padding:"2px 6px",fontSize:"11px",outline:"none",width:"130px",color:"#1a2b4a",fontFamily:"inherit"}}/>:dt}
            </div>
          </div>
        </div>

        {/* Bill To + Site Name */}
<div style={{display:"flex",gap:"12px",marginBottom:"16px",flexWrap:"wrap"}}>
<div style={{padding:"12px 14px",background:"#f0f6ff",borderRadius:"9px",flex:1,minWidth:"200px"}}>
          <div style={{fontSize:"10px",fontWeight:700,color:"#6b84a3",marginBottom:"6px"}}>BILL TO</div>
          <div style={{fontSize:"11px",lineHeight:"2.1"}}>
            <span style={{fontWeight:600,color:"#6b84a3"}}>To: </span>{editable?<EditField value={client.sendTo} onChange={v=>upCl("sendTo",v)} placeholder="Recipient"/>:dispClient.sendTo}<br/>
<span style={{fontWeight:600,color:"#6b84a3"}}>Company: </span>{editable?<EditField value={client.name} onChange={v=>upCl("name",v)} style={{fontWeight:700}}/>:<strong>{dispClient.name}</strong>}<br/>
<span style={{fontWeight:600,color:"#6b84a3"}}>Place: </span>{editable?<EditField value={client.place} onChange={v=>upCl("place",v)}/>:dispClient.place}{" — "}{editable?<EditField value={client.pincode} onChange={v=>upCl("pincode",v)} style={{width:"70px"}}/>:dispClient.pincode}<br/>
<span style={{fontWeight:600,color:"#6b84a3"}}>Ph: </span>{editable?<EditField value={client.phone} onChange={v=>upCl("phone",v)} placeholder="Phone"/>:dispClient.phone}
          </div>
          <div style={{marginTop:"10px",paddingTop:"8px",borderTop:"1px dashed #bfdbfe"}}>
            <span style={{fontWeight:600,color:"#6b84a3",fontSize:"11px"}}>Measurement Sheet No: </span>
            {editable?<EditField value={client.measureNo} onChange={v=>upCl("measureNo",v)} placeholder="Sheet no."/>:<strong>{displayMeasureNo||"—"}</strong>}
         </div>
</div>
<div style={{padding:"12px 14px",background:"#f0f6ff",borderRadius:"9px",flex:1,minWidth:"200px"}}>
  <div style={{fontSize:"10px",fontWeight:700,color:"#6b84a3",marginBottom:"6px"}}>SITE DETAILS</div>
  <div style={{fontSize:"11px",lineHeight:"2.1"}}>
    <span style={{fontWeight:600,color:"#6b84a3"}}>Site Name: </span>
{editable?<EditField value={invSiteName} onChange={v=>setInvSiteName(v)} placeholder="Site name"/>:displaySiteName||"—"}
  </div>
</div>
</div>

        {/* Table */}
        <div style={{overflowX:"auto",marginBottom:"16px"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:"12px"}}>
            <thead><tr style={{background:"#0f3172",color:"#fff"}}>
              {["S.No","Description","Unit","Rate (₹)","Amount (₹)"].map((h,i)=><th key={h} style={{padding:"8px 9px",textAlign:i>1?"right":"left",fontWeight:600,fontSize:"11px"}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {works.length===0&&<tr><td colSpan={5} style={{padding:"16px",textAlign:"center",color:"#9db3cc"}}>No work entries.</td></tr>}
              {works.map((w,i)=>{
                const type=w.workType||"SQM";
                const unitStr=type==="Manpower"?`${w.labour} Labour`:type==="RMT"?`${w.area} rmt`:type==="KGS"?`${w.area} kgs`:type==="Other"?w.place:`${w.area} m²`;
                return(
                  <tr key={w.id||i} style={{borderBottom:"1px solid #f0f4f9",background:i%2===0?"#fff":"#f8faff"}}>
                    <td style={{padding:"8px 9px",color:"#6b84a3",textAlign:"center"}}>{i+1}</td>
                    <td style={{padding:"8px 9px"}}>{w.place}</td>
                    <td style={{padding:"8px 9px",textAlign:"right"}}>{unitStr}</td>
                    <td style={{padding:"8px 9px",textAlign:"right"}}>₹{w.rate}</td>
                    <td style={{padding:"8px 9px",fontWeight:700,textAlign:"right"}}>₹{w.amount.toLocaleString()}</td>
                  </tr>
                );
              })}
              <tr style={{background:"#0f3172",color:"#fff"}}><td colSpan={4} style={{padding:"10px 9px",fontWeight:700,textAlign:"right"}}>TOTAL</td><td style={{padding:"10px 9px",fontWeight:800,fontSize:"16px",textAlign:"right",color:"#f59e0b",letterSpacing:"0.5px"}}>₹{tot.toLocaleString()}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Bank + Signature */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"14px",marginTop:"20px"}}>
          <div style={{padding:"12px 14px",background:"#f8faff",borderRadius:"9px",fontSize:"11px",lineHeight:"2",flex:1,minWidth:"180px"}}>
            <div style={{fontWeight:700,marginBottom:"3px"}}>Bank Details</div>
            Acc Name: {editable?<EditField value={bank.accName} onChange={v=>upB("accName",v)}/>:dispBank.accName}<br/>
Bank: {editable?<EditField value={bank.bank} onChange={v=>upB("bank",v)}/>:dispBank.bank}<br/>
A/C No: {editable?<EditField value={bank.accNo} onChange={v=>upB("accNo",v)}/>:dispBank.accNo}<br/>
IFSC: {editable?<EditField value={bank.ifsc} onChange={v=>upB("ifsc",v)}/>:dispBank.ifsc}<br/>
UPI: {editable?<EditField value={bank.upi} onChange={v=>upB("upi",v)}/>:dispBank.upi}
          </div>
          <div style={{textAlign:"center"}}>
            {/* Signature box */}
            <div style={{width:"180px",height:"90px",border:"1.5px dashed #bfdbfe",borderRadius:"8px",marginBottom:"6px",overflow:"hidden",background:"#fafcff",display:"flex",alignItems:"center",justifyContent:"center"}}>
              {sigImage?<img src={sigImage} style={{width:"100%",height:"100%",objectFit:"contain"}}/>
              :sigMode==="draw"?<canvas ref={sigCanvas} width={180} height={90} onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw} onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} style={{cursor:"crosshair",touchAction:"none",display:"block"}}/>
              :<span style={{fontSize:"11px",color:"#9db3cc"}}>{sigMode==="physical"?"Physical Sign":"Seal / Signature"}</span>}
            </div>
            {/* Signature controls — hidden on print */}
            {editable&&<div className="no-print" style={{display:"flex",gap:"4px",justifyContent:"center",marginBottom:"6px",flexWrap:"wrap"}}>
              <button onClick={()=>{setSigMode("draw");setSigImage(null);setTimeout(()=>sigCanvas.current?.getContext("2d")?.clearRect(0,0,180,90),50);}} style={{...S.btn(sigMode==="draw"?"#1e50a0":"#f0f6ff",sigMode==="draw"?"#fff":"#1e50a0"),padding:"4px 8px",fontSize:"10px"}}>✏️ Draw</button>
              <label style={{...S.btn(sigMode==="upload"?"#1e50a0":"#f0f6ff",sigMode==="upload"?"#fff":"#1e50a0"),padding:"4px 8px",fontSize:"10px",cursor:"pointer"}}>
                📁 Upload<input type="file" accept="image/*" onChange={e=>{setSigMode("upload");uploadSig(e);}} style={{display:"none"}}/>
              </label>
              <button onClick={()=>{setSigMode("physical");setSigImage(null);clearSig();}} style={{...S.btn(sigMode==="physical"?"#1e50a0":"#f0f6ff",sigMode==="physical"?"#fff":"#1e50a0"),padding:"4px 8px",fontSize:"10px"}}>🖊️ Physical</button>
              {(sigImage||sigMode==="draw")&&<button onClick={()=>{clearSig();setSigMode("none");}} style={{...S.btn("#fee2e2","#991b1b"),padding:"4px 8px",fontSize:"10px"}}>✗</button>}
            </div>}
            <div style={{borderTop:"1px solid #1a2b4a",paddingTop:"5px",fontSize:"11px",color:"#6b84a3"}}>Authorised Signatory<br/><strong>{dispCompany.name}</strong></div>
          </div>
        </div>
      </div>
    );
  };

  return(
    <div>
      <h2 style={{margin:"0 0 16px",fontSize:"20px",fontWeight:800}}>🧾 Invoice</h2>
      <div style={{display:"flex",gap:"7px",marginBottom:"20px"}}>
        {[["new","➕ New"],["history","📁 History"]].map(([t,lbl])=>(
          <button key={t} onClick={()=>setTab(t)} style={S.btn(tab===t?"#1e50a0":"#e5e7eb",tab===t?"#fff":"#374151")}>{lbl}</button>
        ))}
      </div>

      {tab==="new"&&<>
        <div style={{...S.card,marginBottom:"16px"}}>
          <h3 style={{margin:"0 0 11px",fontSize:"13px",fontWeight:700}}>Invoice Settings</h3>
          <div style={{display:"flex",gap:"10px",flexWrap:"wrap",marginBottom:"12px"}}>
            <div style={{flex:1,minWidth:"140px"}}><label style={S.lbl}>Invoice No</label><input value={invNum} onChange={e=>setInvNum(e.target.value)} style={S.inp}/></div>
            <div style={{flex:1,minWidth:"140px"}}><label style={S.lbl}>Invoice Date</label><input type="date" value={invDate} onChange={e=>setInvDate(e.target.value)} style={S.inp}/></div>
          </div>
          <label style={S.lbl}>Select Sites & Works to Invoice</label>
          <div style={{display:"flex",flexDirection:"column",gap:"8px",marginTop:"6px",marginBottom:"12px"}}>
            {sites.map(s=>{
              const uninvoiced=(s.works||[]).filter(w=>!invoicedWorkIds.has(w.id));
              if(uninvoiced.length===0) return null;
              const selAll=uninvoiced.every(w=>selWorks.includes(w.id));
              const siteOpen=openSites.includes(s.id);
              return(
                <div key={s.id} style={{border:"1.5px solid #bfdbfe",borderRadius:"10px",overflow:"hidden"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"10px",padding:"10px 12px",background:"#1e50a0"}}>
                    <div onClick={()=>{if(selAll)setSelWorks(p=>p.filter(id=>!uninvoiced.map(w=>w.id).includes(id)));else setSelWorks(p=>[...new Set([...p,...uninvoiced.map(w=>w.id)])]);}} style={{width:"20px",height:"20px",borderRadius:"5px",flexShrink:0,background:selAll?"#f59e0b":"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:"12px",fontWeight:700,cursor:"pointer"}}>{selAll?"✓":""}</div>
                    <div onClick={()=>setOpenSites(p=>siteOpen?p.filter(x=>x!==s.id):[...p,s.id])} style={{flex:1,cursor:"pointer"}}>
                      <div style={{fontWeight:700,fontSize:"13px",color:"#fff"}}>{s.name}</div>
                    </div>
                    <span style={{background:"rgba(255,255,255,0.15)",color:"#fff",fontSize:"10px",fontWeight:600,borderRadius:"20px",padding:"2px 9px"}}>{uninvoiced.length} work{uninvoiced.length!==1?"s":""}</span>
                    <span style={{background:s.status==="Active"?"#dcfce7":"#fee2e2",color:s.status==="Active"?"#166534":"#991b1b",fontSize:"10px",fontWeight:600,borderRadius:"20px",padding:"2px 9px"}}>{s.status}</span>
                    <span onClick={()=>setOpenSites(p=>siteOpen?p.filter(x=>x!==s.id):[...p,s.id])} style={{color:"#fff",fontSize:"12px",cursor:"pointer"}}>{siteOpen?"▲":"▼"}</span>
                  </div>
                  {siteOpen&&uninvoiced.map(w=>{
                    const wsel=selWorks.includes(w.id);
                    return(
                      <div key={w.id} onClick={()=>setSelWorks(p=>wsel?p.filter(id=>id!==w.id):[...p,w.id])} style={{display:"flex",alignItems:"center",gap:"10px",padding:"8px 12px 8px 20px",background:wsel?"#eff6ff":"#fff",borderTop:"1px solid #e5e7eb",cursor:"pointer"}}>
                        <div style={{width:"16px",height:"16px",borderRadius:"4px",flexShrink:0,background:wsel?"#1e50a0":"#e5e7eb",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:"10px",fontWeight:700}}>{wsel?"✓":""}</div>
                        <span style={S.wbadge(w.workType||"SQM")}>{w.workType||"SQM"}</span>
                        <div style={{flex:1,fontSize:"12px",fontWeight:500}}>{w.place}</div>
                        <div style={{fontSize:"12px",fontWeight:700,color:"#166534"}}>₹{calcWork(w).toLocaleString()}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
          <div style={{display:"flex",gap:"9px"}}>
            <button onClick={()=>printSection("invoice-doc")} style={{...S.btn(),opacity:allWorks.length===0?0.5:1}} disabled={allWorks.length===0}>🖨️ Print / PDF</button>
            <button onClick={saveInv} style={{...S.btn("#166534"),opacity:allWorks.length===0?0.5:1}} disabled={allWorks.length===0}>💾 Save Invoice</button>
          </div>
        </div>
        <div id="invoice-doc"><InvDoc inv={null}/></div>
      </>}

      {tab==="history"&&(viewInv
        ?<><div style={{display:"flex",gap:"9px",marginBottom:"16px"}}>
            <button onClick={()=>setViewInv(null)} style={S.btn("#f0f4f9","#1a2b4a")}>← Back</button>
            <button onClick={()=>printSection("invoice-history-doc")} style={S.btn()}>🖨️ Print</button>
          </div>
          <div id="invoice-history-doc"><InvDoc inv={viewInv}/></div>
        </>
        :<div style={S.card}>
  <h3 style={{margin:"0 0 12px",fontSize:"14px",fontWeight:700}}>Saved Invoices</h3>
  <div style={{display:"flex",gap:"16px",marginBottom:"14px",padding:"12px 14px",background:"#f0f6ff",borderRadius:"10px",flexWrap:"wrap"}}>
    <div><span style={{fontSize:"20px",fontWeight:800,color:"#0f3172"}}>{invoices.length}</span><div style={{fontSize:"11px",color:"#6b84a3"}}>Total Invoices</div></div>
    <div><span style={{fontSize:"20px",fontWeight:800,color:"#166534"}}>₹{invoices.reduce((a,inv)=>a+(inv.total||0),0).toLocaleString()}</span><div style={{fontSize:"11px",color:"#6b84a3"}}>Total Billed</div></div>
  </div>
          {invoices.length===0?<p style={{color:"#9db3cc",fontSize:"13px"}}>No invoices saved yet.</p>
          :[...invoices].sort((a,b)=>b.number.localeCompare(a.number,undefined,{numeric:true})).map((inv,idx)=>(
            <div key={inv.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 13px",background:"#f8faff",borderRadius:"9px",marginBottom:"6px"}}>
             <div><div style={{fontWeight:600,fontSize:"13px"}}>{invoices.length-idx}. {inv.number} {inv.flagged&&<span style={{color:"#dc2626",fontSize:"11px"}}>⚠️ Incomplete</span>}</div><div style={{fontSize:"11px",color:"#6b84a3"}}>{fmtD(inv.date)}</div></div>
              <div style={{display:"flex",gap:"7px",alignItems:"center"}}>
                <div style={{fontWeight:700,color:"#166534",fontSize:"13px"}}>₹{inv.total?.toLocaleString()}</div>
                <button onClick={()=>setViewInv(inv)} style={{...S.btn(),padding:"5px 11px",fontSize:"12px"}}>View</button>
                <button onClick={()=>deleteInv(inv)} style={{...S.btn("#fee2e2","#991b1b"),padding:"5px 11px",fontSize:"12px"}}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Password modal for invoice delete */}
      {pwModal&&<PwModal
        title="Move to Recycle Bin?"
        onConfirm={pwModal.action}
        onCancel={()=>setPwModal(null)}
      />}
    </div>
  );
}
