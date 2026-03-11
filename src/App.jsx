import { useState, useEffect, useRef } from "react";

// ── LOGO ───────────────────────────────────────────────────────────────────
const LOGO_B64 = "data:image/png;base64,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";

// ── CONSTANTS ──────────────────────────────────────────────────────────────
const APP_NAME_DEFAULT = "Barret Water";
const DEFAULT_PRICES   = { p20: 5000, p12: 3000 };
const DEFAULT_CV20 = [{ id:"tapa20", name:"Tapa", monto:100 }, { id:"etiq20", name:"Etiqueta", monto:84 }];
const DEFAULT_CV12 = [{ id:"tapa12", name:"Tapa", monto:100 }, { id:"etiq12", name:"Etiqueta", monto:84 }];
const DEFAULT_FIJOS_CATS = [{ id:"gnc", name:"GNC", icon:"⛽" }, { id:"agua", name:"Agua", icon:"💧" }, { id:"luz", name:"Luz", icon:"💡" }, { id:"filtros", name:"Filtros", icon:"🔧" }];
const DEFAULT_SECTORS = [
  { id:"reinversion", name:"Reinversión", monto:800,  color:"#0EA5E9", icon:"🏭" },
  { id:"sueldos",    name:"Sueldos",      monto:1200, color:"#10B981", icon:"💼" },
  { id:"insumos",    name:"Insumos",      monto:484,  color:"#F59E0B", icon:"🧴" },
  { id:"operativo",  name:"Operativos",   monto:600,  color:"#8B5CF6", icon:"⚙️" },
  { id:"ganancia",   name:"Ganancia",     monto:1416, color:"#EC4899", icon:"📈" },
];
const DAILY_UNIT_GOAL = 10;
const PAGO_TIPOS = [
  { id:"efectivo",      label:"Efectivo",      icon:"💵", color:"#10B981" },
  { id:"transferencia", label:"Transferencia", icon:"🏦", color:"#0EA5E9" },
  { id:"fiado",         label:"Fiado",         icon:"📋", color:"#F59E0B" },
];
const GASTO_TIPOS = [
  { id:"operativo",      label:"Operativo",      icon:"⚙️", color:"#8B5CF6" },
  { id:"fijo",           label:"Costo Fijo",     icon:"🔁", color:"#0EA5E9" },
  { id:"extraordinario", label:"Extraordinario", icon:"⚠️", color:"#ef4444" },
];
const DIAS_SEMANA = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const ESTADOS_CLIENTE = [
  { id:"activo",  label:"Activo",  color:"#10B981" },
  { id:"pausado", label:"Pausado", color:"#F59E0B" },
  { id:"perdido", label:"Perdido", color:"#ef4444" },
];

// ── UTILS ──────────────────────────────────────────────────────────────────
const fmt         = n => "$" + Math.round(n).toLocaleString("es-AR");
const todayKey    = () => { const d = new Date(new Date().toLocaleString("en-US",{timeZone:"America/Argentina/Buenos_Aires"})); return d.toISOString().slice(0,10); };
const todayDow    = () => new Date(new Date().toLocaleString("en-US",{timeZone:"America/Argentina/Buenos_Aires"})).getDay();
const labelDate   = iso => new Date(iso+"T12:00:00").toLocaleDateString("es-AR",{weekday:"short",day:"numeric",month:"short"});
const labelDateLong = iso => new Date(iso+"T12:00:00").toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"long"});
const currentMonth  = () => todayKey().slice(0,7);
const prevMonth     = () => { const d=new Date(currentMonth()+"-01"); d.setMonth(d.getMonth()-1); return d.toISOString().slice(0,7); };
const weekStart     = () => { const d=new Date(new Date().toLocaleString("en-US",{timeZone:"America/Argentina/Buenos_Aires"})); d.setDate(d.getDate()-d.getDay()); return d.toISOString().slice(0,10); };
const prevWeekStart = () => { const d=new Date(new Date().toLocaleString("en-US",{timeZone:"America/Argentina/Buenos_Aires"})); d.setDate(d.getDate()-d.getDay()-7); return d.toISOString().slice(0,10); };
const prevWeekEnd   = () => { const d=new Date(new Date().toLocaleString("en-US",{timeZone:"America/Argentina/Buenos_Aires"})); d.setDate(d.getDate()-d.getDay()-1); return d.toISOString().slice(0,10); };
const diffDays      = (a,b) => Math.round((new Date(b)-new Date(a))/(1000*60*60*24));
const addDays       = (iso,n) => { const d=new Date(iso+"T12:00:00"); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); };

// Calcula próxima visita según configuración del cliente
function proximaVisita(cli) {
  const hoy = todayKey();
  if (!cli.frecuenciaTipo || cli.frecuenciaTipo === "ninguna") return null;
  if (cli.frecuenciaTipo === "dias") {
    const cada = cli.frecuenciaDias || 7;
    const ultima = cli.ultimaVisita || hoy;
    return addDays(ultima, cada);
  }
  if (cli.frecuenciaTipo === "semanal") {
    const diasFijos = cli.diasSemana || [];
    if (!diasFijos.length) return null;
    const dow = todayDow();
    let menor = 99;
    diasFijos.forEach(d => { let diff = (d - dow + 7) % 7; if (diff === 0) diff = 7; if (diff < menor) menor = diff; });
    return addDays(hoy, menor);
  }
  return null;
}

// Verifica si un cliente toca hoy
function tocaHoy(cli) {
  if (!cli.frecuenciaTipo || cli.frecuenciaTipo === "ninguna") return false;
  if (cli.estado === "pausado" || cli.estado === "perdido") return false;
  if (cli.frecuenciaTipo === "semanal") {
    return (cli.diasSemana || []).includes(todayDow());
  }
  if (cli.frecuenciaTipo === "dias") {
    const ultima = cli.ultimaVisita;
    if (!ultima) return true;
    const cada = cli.frecuenciaDias || 7;
    const prox = proximaVisita(cli);
    return prox <= todayKey();
  }
  return false;
}

async function sget(k) { try { const r=await storage.get(k); if(!r) return null; const v=r.value; if(typeof v==="string"){ try{return JSON.parse(v);}catch{return v;} } return v; } catch { return null; } }
async function sset(k,v) { try { await storage.set(k,v); } catch {} }

const emptyDay   = (date) => ({ date:date||todayKey(), ventas:[], gastos:[], nota:"" });
const costoTotal = arr => arr.reduce((a,c)=>a+(parseFloat(c.monto)||0),0);

function dayTotals(day, prices, cv20, cv12) {
  const p20=prices?.p20||5000, p12=prices?.p12||3000;
  let cobrado=0,fiado=0,efectivo=0,transferencia=0,u20=0,u12=0;
  (day.ventas||[]).forEach(v=>{
    const m=v.montoManual!=null?v.montoManual:((v.u20||0)*p20+(v.u12||0)*p12);
    u20+=v.u20||0; u12+=v.u12||0;
    if(v.pago==="fiado") fiado+=m;
    else { cobrado+=m; if(v.pago==="efectivo") efectivo+=m; else transferencia+=m; }
  });
  const gastosOp   = (day.gastos||[]).filter(g=>g.tipo==="operativo").reduce((a,g)=>a+(parseFloat(g.monto)||0),0);
  const gastosExt  = (day.gastos||[]).filter(g=>g.tipo==="extraordinario").reduce((a,g)=>a+(parseFloat(g.monto)||0),0);
  const gastosFijos= (day.gastos||[]).filter(g=>g.tipo==="fijo").reduce((a,g)=>a+(parseFloat(g.monto)||0),0);
  const gastos = gastosOp+gastosExt+gastosFijos;
  return{cobrado,fiado,efectivo,transferencia,gastos,gastosOp,gastosExt,gastosFijos,u20,u12};
}

function calcCierreSemanal(days,prices,cv20,cv12,fijosCats) {
  const u20=days.reduce((a,d)=>a+dayTotals(d,prices,cv20,cv12).u20,0);
  const u12=days.reduce((a,d)=>a+dayTotals(d,prices,cv20,cv12).u12,0);
  const totalBidones=u20+u12;
  const cobrado=days.reduce((a,d)=>a+dayTotals(d,prices,cv20,cv12).cobrado,0);
  const gastosOp=days.reduce((a,d)=>a+dayTotals(d,prices,cv20,cv12).gastosOp,0);
  const gastosExt=days.reduce((a,d)=>a+dayTotals(d,prices,cv20,cv12).gastosExt,0);
  const fijosPorCat=fijosCats.map(cat=>{
    const total=days.reduce((a,d)=>{
      const gs=(d.gastos||[]).filter(g=>g.tipo==="fijo"&&g.cat===cat.id);
      return a+gs.reduce((b,g)=>b+(parseFloat(g.monto)||0),0);
    },0);
    return{...cat,total,porBidon:totalBidones>0?total/totalBidones:0};
  }).filter(c=>c.total>0);
  const totalFijos=fijosPorCat.reduce((a,c)=>a+c.total,0);
  const costosVarTotal=u20*costoTotal(cv20)+u12*costoTotal(cv12);
  const costoTotalReal=costosVarTotal+totalFijos+gastosOp;
  const costoXBidon=totalBidones>0?costoTotalReal/totalBidones:0;
  const precioPromedio=totalBidones>0?cobrado/totalBidones:0;
  const utilidad=cobrado-costoTotalReal-gastosExt;
  const utilSinExt=cobrado-costoTotalReal;
  return{u20,u12,totalBidones,cobrado,gastosOp,gastosExt,totalFijos,fijosPorCat,costosVarTotal,costoTotalReal,costoXBidon,precioPromedio,utilidad,utilSinExt};
}

// ── THEME ──────────────────────────────────────────────────────────────────
const DARK = {
  bg:        "#07101f",
  bgCard:    "linear-gradient(145deg,rgba(255,255,255,0.055),rgba(255,255,255,0.018))",
  border:    "rgba(255,255,255,0.09)",
  borderTop: "rgba(255,255,255,0.16)",
  text:      "#e2e8f0",
  textMuted: "#64748b",
  textDim:   "#334155",
  input:     "rgba(255,255,255,0.06)",
  inputBorder:"rgba(255,255,255,0.1)",
  navBg:     "rgba(7,16,31,0.95)",
  accent:    "#0EA5E9",
};
const LIGHT = {
  bg:        "#f0f4f8",
  bgCard:    "linear-gradient(145deg,rgba(255,255,255,0.92),rgba(255,255,255,0.75))",
  border:    "rgba(0,0,0,0.08)",
  borderTop: "rgba(255,255,255,0.9)",
  text:      "#0f172a",
  textMuted: "#64748b",
  textDim:   "#94a3b8",
  input:     "rgba(0,0,0,0.04)",
  inputBorder:"rgba(0,0,0,0.1)",
  navBg:     "rgba(240,244,248,0.97)",
  accent:    "#0284C7",
};

// ── DESIGN PRIMITIVES ──────────────────────────────────────────────────────
const glassCard = (th) => ({
  background: th.bgCard,
  border: `1px solid ${th.border}`,
  borderTop: `1px solid ${th.borderTop}`,
  borderRadius: 18,
  boxShadow: "0 4px 24px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.08)",
  padding: "14px 16px",
  marginBottom: 12,
});
const inputStyle = (th) => ({
  padding: "10px 13px",
  background: th.input,
  border: `1px solid ${th.inputBorder}`,
  borderRadius: 11,
  color: th.text,
  fontSize: 14,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
});
const btnPrimary = {
  background: "linear-gradient(135deg,#0EA5E9,#0284C7)",
  border: "none",
  borderRadius: 14,
  color: "white",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  padding: "13px",
  width: "100%",
  boxShadow: "0 6px 20px rgba(14,165,233,0.3)",
};
const btnGhost = (th) => ({
  background: "rgba(255,255,255,0.06)",
  border: `1px solid ${th.border}`,
  borderRadius: 11,
  color: th.textMuted,
  cursor: "pointer",
  padding: "8px 14px",
  fontSize: 13,
});

// ── GLASS CARD COMPONENT ───────────────────────────────────────────────────
function GCard({ children, style, th }) {
  return <div style={{...glassCard(th),...style}}>{children}</div>;
}
function Label({ children, th }) {
  return <div style={{fontSize:11,fontWeight:600,color:th?.textMuted||"#64748b",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em"}}>{children}</div>;
}
function Row({ label, value, vc, th }) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0"}}>
      <span style={{fontSize:12,color:th?.textMuted||"#64748b"}}>{label}</span>
      <span style={{fontSize:13,fontWeight:600,color:vc||th?.text||"#e2e8f0"}}>{value}</span>
    </div>
  );
}
function PBar({ pct, a, b, style }) {
  return (
    <div style={{height:6,borderRadius:99,background:"rgba(255,255,255,0.06)",overflow:"hidden",...style}}>
      <div style={{height:"100%",width:`${Math.min(pct,100)}%`,background:`linear-gradient(90deg,${a},${b})`,borderRadius:99,transition:"width 0.5s ease"}}/>
    </div>
  );
}
function StatBox({ label, value, color, th }) {
  return (
    <div style={{padding:"12px",background:`${color}12`,borderRadius:13,border:`1px solid ${color}22`,borderTop:`1px solid ${color}35`}}>
      <div style={{fontSize:10,color:th?.textMuted||"#64748b",marginBottom:3,textTransform:"uppercase",letterSpacing:"0.04em"}}>{label}</div>
      <div style={{fontSize:18,fontWeight:700,color}}>{value}</div>
    </div>
  );
}
function Empty({ icon, text, th }) {
  return (
    <div style={{textAlign:"center",padding:"48px 20px",color:th?.textMuted||"#475569"}}>
      <div style={{fontSize:40,marginBottom:12,opacity:0.5}}>{icon}</div>
      <div style={{fontSize:13}}>{text}</div>
    </div>
  );
}
function SectionTitle({ children, th }) {
  return <div style={{fontSize:12,fontWeight:700,color:th?.textMuted||"#94a3b8",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:10,marginTop:4}}>{children}</div>;
}
function TotalRow({ label, value, color, th }) {
  return (
    <div style={{marginTop:10,padding:"10px 13px",background:"rgba(255,255,255,0.04)",borderRadius:10,display:"flex",justifyContent:"space-between",borderTop:`1px solid rgba(255,255,255,0.08)`}}>
      <span style={{fontSize:13,color:th?.textMuted||"#94a3b8"}}>{label}</span>
      <span style={{fontSize:15,fontWeight:700,color:color||th?.text||"#e2e8f0"}}>{value}</span>
    </div>
  );
}
function FiadoRow({ f, onCobrar, onDelete, dimmed, th }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",marginBottom:8,background:"rgba(255,255,255,0.03)",borderRadius:11,border:`1px solid rgba(255,255,255,0.07)`,opacity:dimmed?0.5:1}}>
      <div style={{flex:1}}>
        <div style={{display:"flex",alignItems:"baseline",gap:6,flexWrap:"wrap"}}>
          <span style={{fontSize:13,fontWeight:600,color:th?.text||"#e2e8f0",textDecoration:dimmed?"line-through":"none"}}>{f.nombre}</span>
          {f.direccion&&<span style={{fontSize:10,color:th?.textMuted||"#64748b",fontStyle:"italic"}}>📍 {f.direccion}</span>}
        </div>
        {f.nota&&<div style={{fontSize:11,color:th?.textMuted||"#64748b"}}>{f.nota}</div>}
        <div style={{fontSize:10,color:th?.textDim||"#475569"}}>{labelDate(f.fecha)}{f.fechaCobro?` → cobrado ${labelDate(f.fechaCobro)}`:""}</div>
      </div>
      <span style={{fontWeight:700,color:dimmed?"#10B981":"#F59E0B",fontSize:14}}>{fmt(f.monto)}</span>
      {!dimmed&&<button onClick={onCobrar} style={{background:"rgba(16,185,129,0.15)",border:"1px solid rgba(16,185,129,0.28)",borderRadius:8,color:"#10B981",cursor:"pointer",padding:"5px 9px",fontSize:12,fontWeight:600}}>✅ Cobrar</button>}
      <button onClick={onDelete} style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.18)",borderRadius:8,color:"#ef4444",cursor:"pointer",padding:"4px 9px",fontSize:14}}>×</button>
    </div>
  );
}

// ── CONFIRM DIALOG ─────────────────────────────────────────────────────────
function ConfirmDialog({ msg, onConfirm, onCancel, th }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{...glassCard(th),maxWidth:340,width:"100%",padding:24}}>
        <div style={{fontSize:15,fontWeight:600,color:th.text,marginBottom:8}}>⚠️ Confirmar acción</div>
        <div style={{fontSize:13,color:th.textMuted,marginBottom:20}}>{msg}</div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onCancel} style={{...btnGhost(th),flex:1,textAlign:"center"}}>Cancelar</button>
          <button onClick={onConfirm} style={{flex:2,padding:"11px",background:"linear-gradient(135deg,#ef4444,#dc2626)",border:"none",borderRadius:11,color:"white",fontWeight:700,cursor:"pointer",fontSize:13}}>Confirmar</button>
        </div>
      </div>
    </div>
  );
}

// ── MODAL SHELL ────────────────────────────────────────────────────────────
function BottomModal({ children, onClose, th }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:300,display:"flex",alignItems:"flex-end"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:"100%",maxWidth:500,margin:"0 auto",background:th.bg,borderRadius:"22px 22px 0 0",padding:"16px 18px 40px",boxShadow:"0 -12px 48px rgba(0,0,0,0.4)",borderTop:`1px solid ${th.border}`}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:14,position:"relative"}}>
          <div style={{width:36,height:4,background:th.border,borderRadius:99}}/>
          <button onClick={onClose} style={{position:"absolute",right:0,top:-8,...btnGhost(th),padding:"3px 10px",fontSize:16}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── CLIENTE SEARCH INPUT ───────────────────────────────────────────────────
function ClienteSearch({ clientes, value, onChange, th }) {
  const [showSug,setShowSug] = useState(false);
  const filtered = clientes.filter(c=>
    c.nombre.toLowerCase().includes(value.toLowerCase()) ||
    (c.direccion||"").toLowerCase().includes(value.toLowerCase()) ||
    (c.tel||"").includes(value)
  ).slice(0,6);
  return (
    <div style={{position:"relative"}}>
      <input type="text" placeholder="Buscar cliente..." value={value}
        onChange={e=>{onChange({query:e.target.value,cliente:null});setShowSug(true);}}
        onFocus={()=>setShowSug(true)}
        style={inputStyle(th)}/>
      {showSug&&value&&filtered.length>0&&(
        <div style={{position:"absolute",top:"100%",left:0,right:0,background:th.bg,borderRadius:"0 0 12px 12px",border:`1px solid ${th.border}`,zIndex:50,overflow:"hidden",boxShadow:"0 8px 24px rgba(0,0,0,0.3)"}}>
          {filtered.map(c=>(
            <div key={c.id} onClick={()=>{onChange({query:c.nombre,cliente:c});setShowSug(false);}}
              style={{padding:"10px 14px",cursor:"pointer",fontSize:13,borderBottom:`1px solid ${th.border}`,color:th.text}}>
              <span style={{fontWeight:600}}>{c.nombre}</span>
              {c.direccion&&<span style={{color:th.textMuted,marginLeft:8,fontSize:11}}>📍 {c.direccion}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── ENTREGAR MODAL ─────────────────────────────────────────────────────────
function EntregarModal({ pedido, onConfirm, onClose, th }) {
  const [pago,setPago]   = useState("efectivo");
  const [c20,setC20]     = useState(true);
  const [c12,setC12]     = useState(true);
  const [nota,setNota]   = useState("");
  return (
    <BottomModal onClose={onClose} th={th}>
      <div style={{fontSize:15,fontWeight:700,color:th.text,marginBottom:14}}>✅ Confirmar entrega</div>
      <GCard th={th} style={{marginBottom:14}}>
        <div style={{fontWeight:600,color:th.text}}>{pedido.nombre}</div>
        <div style={{fontSize:12,color:th.textMuted,marginTop:2}}>
          {[pedido.u20>0?`${pedido.u20}×20L`:"",pedido.u12>0?`${pedido.u12}×12L`:""].filter(Boolean).join(" · ")}
          {pedido.nota?` · ${pedido.nota}`:""}
        </div>
      </GCard>
      {pedido.u20>0&&(
        <div onClick={()=>setC20(v=>!v)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",background:c20?"rgba(16,185,129,0.08)":"rgba(245,158,11,0.08)",borderRadius:12,border:`1px solid ${c20?"rgba(16,185,129,0.2)":"rgba(245,158,11,0.2)"}`,marginBottom:8,cursor:"pointer",userSelect:"none"}}>
          <span style={{fontSize:13,color:th.text}}>🪣 Bidón 20L — ¿trajo el vacío?</span>
          <span style={{fontWeight:700,color:c20?"#10B981":"#F59E0B"}}>{c20?"✓ Sí":"✗ No"}</span>
        </div>
      )}
      {pedido.u12>0&&(
        <div onClick={()=>setC12(v=>!v)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",background:c12?"rgba(16,185,129,0.08)":"rgba(245,158,11,0.08)",borderRadius:12,border:`1px solid ${c12?"rgba(16,185,129,0.2)":"rgba(245,158,11,0.2)"}`,marginBottom:14,cursor:"pointer",userSelect:"none"}}>
          <span style={{fontSize:13,color:th.text}}>🪣 Bidón 12L — ¿trajo el vacío?</span>
          <span style={{fontWeight:700,color:c12?"#10B981":"#F59E0B"}}>{c12?"✓ Sí":"✗ No"}</span>
        </div>
      )}
      <Label th={th}>Forma de pago</Label>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
        {PAGO_TIPOS.map(t=>(
          <button key={t.id} onClick={()=>setPago(t.id)} style={{padding:"10px 4px",borderRadius:12,border:`2px solid ${pago===t.id?t.color:th.border}`,background:pago===t.id?`${t.color}20`:"transparent",color:pago===t.id?t.color:th.textMuted,cursor:"pointer",fontWeight:pago===t.id?700:400,fontSize:12}}>
            <div style={{fontSize:18,marginBottom:2}}>{t.icon}</div>{t.label}
          </button>
        ))}
      </div>
      <Label th={th}>Nota de visita (opcional)</Label>
      <input type="text" placeholder="Anotá algo sobre la visita..." value={nota} onChange={e=>setNota(e.target.value)} style={{...inputStyle(th),marginBottom:16}}/>
      <button onClick={()=>onConfirm({pago,canje20:c20,canje12:c12,nota})} style={{...btnPrimary,background:"linear-gradient(135deg,#10B981,#059669)",boxShadow:"0 6px 20px rgba(16,185,129,0.3)"}}>
        ✅ Confirmar entrega
      </button>
    </BottomModal>
  );
}

// ── NUEVO PEDIDO MODAL ─────────────────────────────────────────────────────
function NuevoPedidoModal({ clientes, editPedido, onSave, onClose, onAddCliente, th }) {
  const init = editPedido||{id:Date.now(),clienteId:null,nombre:"",direccion:"",u20:0,u12:0,nota:""};
  const [form,setForm]   = useState(init);
  const [query,setQuery] = useState(editPedido?.nombre||"");
  const setU = (f,d) => setForm(v=>({...v,[f]:Math.max(0,(v[f]||0)+d)}));
  const canSave = form.clienteId&&(form.u20>0||form.u12>0);
  return (
    <BottomModal onClose={onClose} th={th}>
      <div style={{fontSize:15,fontWeight:700,color:th.text,marginBottom:14}}>{editPedido?"✏️ Editar pedido":"📦 Nuevo pedido"}</div>
      <Label th={th}>Cliente *</Label>
      <ClienteSearch clientes={clientes} value={query} th={th}
        onChange={({query:q,cliente})=>{ setQuery(q); if(cliente) setForm(v=>({...v,clienteId:cliente.id,nombre:cliente.nombre,direccion:cliente.direccion||""})); else setForm(v=>({...v,clienteId:null,nombre:"",direccion:""})); }}/>
      {!form.clienteId&&query.length>1&&(
        <button onClick={()=>onAddCliente(query,setForm,setQuery)} style={{width:"100%",padding:"8px",background:"rgba(16,185,129,0.08)",border:"1px dashed rgba(16,185,129,0.3)",borderRadius:10,color:"#10B981",cursor:"pointer",fontSize:12,marginTop:6}}>
          ➕ Agregar "{query}" como cliente nuevo
        </button>
      )}
      {form.clienteId&&<div style={{fontSize:11,color:"#10B981",marginTop:4}}>✓ {form.nombre}</div>}
      <div style={{marginTop:12}}>
        <Label th={th}>Bidones</Label>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          {[["u20","20L"],["u12","12L"]].map(([field,label])=>(
            <GCard key={field} th={th} style={{marginBottom:0,padding:"10px 12px"}}>
              <div style={{fontSize:12,fontWeight:600,color:th.text,marginBottom:10}}>Bidón {label}</div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <button onClick={()=>setU(field,-1)} style={{width:34,height:34,borderRadius:9,background:"rgba(255,255,255,0.07)",border:`1px solid ${th.border}`,color:th.text,fontSize:20,cursor:"pointer"}}>−</button>
                <span style={{fontSize:24,fontWeight:700,color:form[field]>0?th.accent:th.textDim}}>{form[field]||0}</span>
                <button onClick={()=>setU(field,1)} style={{width:34,height:34,borderRadius:9,background:`${th.accent}22`,border:`1px solid ${th.accent}44`,color:th.accent,fontSize:20,cursor:"pointer"}}>+</button>
              </div>
            </GCard>
          ))}
        </div>
      </div>
      <Label th={th}>Nota</Label>
      <input type="text" placeholder="Observación..." value={form.nota||""} onChange={e=>setForm(v=>({...v,nota:e.target.value}))} style={{...inputStyle(th),marginBottom:16}}/>
      <button onClick={()=>canSave&&onSave({...form,id:editPedido?.id||Date.now()})} disabled={!canSave} style={{...btnPrimary,opacity:canSave?1:0.4,cursor:canSave?"pointer":"not-allowed"}}>
        {editPedido?"✅ Guardar cambios":"➕ Agregar pedido"}
      </button>
    </BottomModal>
  );
}

// ── SALE MODAL ─────────────────────────────────────────────────────────────
function SaleModal({ clientes, prices, onSave, onClose, onAddCliente, editVenta, th }) {
  const init = editVenta||{id:Date.now(),clienteId:null,nombre:"",u20:0,u12:0,pago:"efectivo",nota:"",canje20:true,canje12:true};
  const [venta,setVenta] = useState(init);
  const [query,setQuery] = useState(editVenta?.nombre||"");
  const p20=prices?.p20||5000, p12=prices?.p12||3000;
  const monto=(venta.u20||0)*p20+(venta.u12||0)*p12;
  const canSave=venta.clienteId&&(venta.u20>0||venta.u12>0);
  const tipo=PAGO_TIPOS.find(t=>t.id===venta.pago);
  const setU=(field,delta)=>setVenta(v=>({...v,[field]:Math.max(0,(v[field]||0)+delta)}));
  return (
    <BottomModal onClose={onClose} th={th}>
      <div style={{fontSize:15,fontWeight:700,color:th.text,marginBottom:14}}>{editVenta?"✏️ Editar venta":"➕ Nueva venta"}</div>
      <Label th={th}>Cliente *</Label>
      <ClienteSearch clientes={clientes} value={query} th={th}
        onChange={({query:q,cliente})=>{ setQuery(q); if(cliente) setVenta(v=>({...v,clienteId:cliente.id,nombre:cliente.nombre})); else setVenta(v=>({...v,clienteId:null,nombre:""})); }}/>
      {!venta.clienteId&&query.length>1&&(
        <button onClick={()=>onAddCliente(query,setVenta,setQuery)} style={{width:"100%",padding:"8px",background:"rgba(16,185,129,0.08)",border:"1px dashed rgba(16,185,129,0.3)",borderRadius:10,color:"#10B981",cursor:"pointer",fontSize:12,marginTop:6}}>
          ➕ Agregar "{query}" como cliente nuevo
        </button>
      )}
      {venta.clienteId&&<div style={{fontSize:11,color:"#10B981",marginTop:4}}>✓ {venta.nombre}</div>}
      <div style={{marginTop:12}}>
        <Label th={th}>Bidones</Label>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          {[["u20","20L",p20,"canje20"],["u12","12L",p12,"canje12"]].map(([field,label,price,cf])=>(
            <GCard key={field} th={th} style={{marginBottom:0,padding:"10px 12px"}}>
              <div style={{fontSize:12,fontWeight:600,color:th.text}}>{label}</div>
              <div style={{fontSize:10,color:th.textMuted,marginBottom:8}}>{fmt(price)} c/u</div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <button onClick={()=>setU(field,-1)} style={{width:32,height:32,borderRadius:9,background:"rgba(255,255,255,0.07)",border:`1px solid ${th.border}`,color:th.text,fontSize:18,cursor:"pointer"}}>−</button>
                <span style={{fontSize:22,fontWeight:700,color:venta[field]>0?th.accent:th.textDim}}>{venta[field]||0}</span>
                <button onClick={()=>setU(field,1)} style={{width:32,height:32,borderRadius:9,background:`${th.accent}22`,border:`1px solid ${th.accent}44`,color:th.accent,fontSize:18,cursor:"pointer"}}>+</button>
              </div>
              {venta[field]>0&&(
                <div onClick={()=>setVenta(v=>({...v,[cf]:!v[cf]}))}
                  style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:11,color:venta[cf]?"#10B981":"#F59E0B",userSelect:"none"}}>
                  <div style={{width:14,height:14,borderRadius:4,border:`2px solid ${venta[cf]?"#10B981":"#F59E0B"}`,background:venta[cf]?"#10B981":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"white"}}>{venta[cf]?"✓":""}</div>
                  {venta[cf]?"Trajo vacío":"Sin vacío ⚠️"}
                </div>
              )}
            </GCard>
          ))}
        </div>
      </div>
      <Label th={th}>Forma de pago</Label>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
        {PAGO_TIPOS.map(t=>(
          <button key={t.id} onClick={()=>setVenta(v=>({...v,pago:t.id}))} style={{padding:"10px 4px",borderRadius:12,border:`2px solid ${venta.pago===t.id?t.color:th.border}`,background:venta.pago===t.id?`${t.color}20`:"transparent",color:venta.pago===t.id?t.color:th.textMuted,cursor:"pointer",fontWeight:venta.pago===t.id?700:400,fontSize:12}}>
            <div style={{fontSize:18,marginBottom:2}}>{t.icon}</div>{t.label}
          </button>
        ))}
      </div>
      <Label th={th}>Nota</Label>
      <input type="text" placeholder="Observación..." value={venta.nota} onChange={e=>setVenta(v=>({...v,nota:e.target.value}))} style={{...inputStyle(th),marginBottom:12}}/>
      {monto>0&&<div style={{padding:"10px 14px",background:`${tipo?.color}15`,borderRadius:11,marginBottom:12,display:"flex",justifyContent:"space-between",border:`1px solid ${tipo?.color}25`}}>
        <span style={{fontSize:13,color:th.textMuted}}>Total</span>
        <span style={{fontWeight:700,fontSize:18,color:tipo?.color}}>{fmt(monto)}</span>
      </div>}
      <button onClick={()=>canSave&&onSave({...venta,id:editVenta?.id||Date.now()})} disabled={!canSave} style={{...btnPrimary,opacity:canSave?1:0.4,cursor:canSave?"pointer":"not-allowed"}}>
        {editVenta?"✅ Guardar cambios":"✅ Registrar venta"}
      </button>
    </BottomModal>
  );
}

// ── COBRAR MODAL ───────────────────────────────────────────────────────────
function CobrarModal({ fiado, onCobrar, onClose, th }) {
  const [fecha,setFecha] = useState(todayKey());
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{...glassCard(th),maxWidth:380,width:"100%",padding:24}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <div style={{fontSize:15,fontWeight:700,color:th.text}}>✅ Registrar cobro</div>
          <button onClick={onClose} style={{...btnGhost(th),padding:"3px 10px"}}>✕</button>
        </div>
        <div style={{fontSize:13,color:th.textMuted,marginBottom:16}}>{fiado.nombre} · <span style={{color:"#F59E0B",fontWeight:600}}>{fmt(fiado.monto)}</span></div>
        <Label th={th}>Fecha de cobro</Label>
        <input type="date" value={fecha} max={todayKey()} onChange={e=>setFecha(e.target.value)} style={{...inputStyle(th),marginBottom:12}}/>
        <div style={{fontSize:12,color:th.textMuted,marginBottom:16,padding:"10px 12px",background:"rgba(16,185,129,0.08)",borderRadius:10}}>
          Se sumará al reporte del {labelDate(fecha)}.
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{...btnGhost(th),flex:1,textAlign:"center"}}>Cancelar</button>
          <button onClick={()=>onCobrar(fiado,fecha)} style={{flex:2,padding:"12px",background:"linear-gradient(135deg,#10B981,#059669)",border:"none",borderRadius:12,color:"white",fontWeight:700,cursor:"pointer"}}>✅ Confirmar</button>
        </div>
      </div>
    </div>
  );
}

// ── FIADO MANUAL MODAL ─────────────────────────────────────────────────────
function FiadoManualModal({ clientes, onSave, onClose, th }) {
  const [nombre,setNombre]=useState(""); const [clienteId,setClienteId]=useState(null);
  const [monto,setMonto]=useState(""); const [fecha,setFecha]=useState(todayKey());
  const [nota,setNota]=useState(""); const [query,setQuery]=useState("");
  const canSave=nombre&&parseFloat(monto)>0;
  return (
    <BottomModal onClose={onClose} th={th}>
      <div style={{fontSize:15,fontWeight:700,color:th.text,marginBottom:14}}>📋 Agregar fiado</div>
      <Label th={th}>Cliente</Label>
      <ClienteSearch clientes={clientes} value={query} th={th}
        onChange={({query:q,cliente})=>{ setQuery(q); setNombre(q); if(cliente){setClienteId(cliente.id);setNombre(cliente.nombre);} else setClienteId(null); }}/>
      <div style={{marginTop:10}}>
        <Label th={th}>Monto</Label>
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:th.textMuted}}>$</span>
          <input type="number" placeholder="0" value={monto} onChange={e=>setMonto(e.target.value)} style={{...inputStyle(th),paddingLeft:26}}/>
        </div>
      </div>
      <div style={{marginTop:10}}>
        <Label th={th}>Fecha</Label>
        <input type="date" value={fecha} max={todayKey()} onChange={e=>setFecha(e.target.value)} style={inputStyle(th)}/>
      </div>
      <div style={{marginTop:10,marginBottom:16}}>
        <Label th={th}>Nota</Label>
        <input type="text" placeholder="..." value={nota} onChange={e=>setNota(e.target.value)} style={inputStyle(th)}/>
      </div>
      <button onClick={()=>canSave&&onSave({id:Date.now(),nombre,clienteId,monto:parseFloat(monto),fecha,nota,cobrado:false})} disabled={!canSave}
        style={{...btnPrimary,background:"linear-gradient(135deg,#F59E0B,#d97706)",boxShadow:"0 6px 20px rgba(245,158,11,0.3)",opacity:canSave?1:0.4,cursor:canSave?"pointer":"not-allowed"}}>
        ✅ Agregar fiado
      </button>
    </BottomModal>
  );
}

// ── GASTO PANEL ────────────────────────────────────────────────────────────
function GastoPanel({ gastos, setGastos, fijosCats, onSave, onBack, th }) {
  const list = gastos.length ? gastos : [{desc:"",monto:"",tipo:"operativo",cat:""}];
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
        <button onClick={onBack} style={{...btnGhost(th)}}>← Volver</button>
        <span style={{fontWeight:700,fontSize:15,color:th.text}}>💸 Gastos del día</span>
      </div>
      {list.map((g,i)=>(
        <GCard key={i} th={th} style={{padding:12}}>
          <div style={{display:"flex",gap:8,marginBottom:8}}>
            <input type="text" placeholder="Descripción..." value={g.desc}
              onChange={e=>{const ng=[...gastos];ng[i]={...ng[i],desc:e.target.value};setGastos(ng);}}
              style={{...inputStyle(th),flex:2,fontSize:13}}/>
            <div style={{position:"relative",flex:1}}>
              <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:th.textMuted,fontSize:13}}>$</span>
              <input type="number" placeholder="0" value={g.monto}
                onChange={e=>{const ng=[...gastos];ng[i]={...ng[i],monto:e.target.value};setGastos(ng);}}
                style={{...inputStyle(th),paddingLeft:24,fontSize:13}}/>
            </div>
            {gastos.length>1&&<button onClick={()=>setGastos(gastos.filter((_,j)=>j!==i))}
              style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:10,color:"#ef4444",cursor:"pointer",padding:"0 10px",fontSize:18}}>×</button>}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:g.tipo==="fijo"?8:0}}>
            {GASTO_TIPOS.map(t=>(
              <button key={t.id} onClick={()=>{const ng=[...gastos];ng[i]={...ng[i],tipo:t.id,cat:t.id==="fijo"?(fijosCats[0]?.id||""):""};setGastos(ng);}}
                style={{padding:"7px 4px",borderRadius:9,border:`2px solid ${g.tipo===t.id?t.color:th.border}`,background:g.tipo===t.id?`${t.color}18`:"transparent",color:g.tipo===t.id?t.color:th.textMuted,cursor:"pointer",fontSize:11,fontWeight:g.tipo===t.id?700:400}}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
          {g.tipo==="fijo"&&(
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {fijosCats.map(cat=>(
                <button key={cat.id} onClick={()=>{const ng=[...gastos];ng[i]={...ng[i],cat:cat.id};setGastos(ng);}}
                  style={{padding:"5px 10px",borderRadius:8,border:`1px solid ${g.cat===cat.id?"#0EA5E9":th.border}`,background:g.cat===cat.id?"rgba(14,165,233,0.15)":"transparent",color:g.cat===cat.id?"#0EA5E9":th.textMuted,cursor:"pointer",fontSize:12,fontWeight:g.cat===cat.id?700:400}}>
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          )}
        </GCard>
      ))}
      <button onClick={()=>setGastos([...gastos,{desc:"",monto:"",tipo:"operativo",cat:""}])}
        style={{width:"100%",padding:"9px",background:"transparent",border:`1px dashed ${th.border}`,borderRadius:10,color:th.textMuted,cursor:"pointer",fontSize:12,marginBottom:14}}>
        + Agregar gasto
      </button>
      <button onClick={onSave} style={{...btnPrimary,background:"linear-gradient(135deg,#F59E0B,#d97706)",boxShadow:"0 6px 20px rgba(245,158,11,0.25)"}}>
        ✅ Guardar gastos
      </button>
    </div>
  );
}

// ── APP ────────────────────────────────────────────────────────────────────
export default function App() {
  // ── theme ──────────────────────────────────────────────────────────────
  const [darkMode,setDarkMode]   = useState(true);
  const th = darkMode ? DARK : LIGHT;

  // ── nav ────────────────────────────────────────────────────────────────
  const [mainTab,setMainTab]     = useState("ruteo");  // ruteo | ventas | clientes | reportes | config
  const [subTab,setSubTab]       = useState("caja");   // caja | fiados | historial | semana | mes | metricas

  // ── data ───────────────────────────────────────────────────────────────
  const [sectors,setSectors]     = useState(DEFAULT_SECTORS);
  const [prices,setPrices]       = useState(DEFAULT_PRICES);
  const [cv20,setCv20]           = useState(DEFAULT_CV20);
  const [cv12,setCv12]           = useState(DEFAULT_CV12);
  const [fijosCats,setFijosCats] = useState(DEFAULT_FIJOS_CATS);
  const [history,setHistory]     = useState([]);
  const [fiados,setFiados]       = useState([]);
  const [clientes,setClientes]   = useState([]);
  const [pedidos,setPedidos]     = useState([]);
  const [appName,setAppName]     = useState(APP_NAME_DEFAULT);
  const [goalArs,setGoalArs]     = useState(50000);
  const [alertPct,setAlertPct]   = useState(30);

  // ── ui state ───────────────────────────────────────────────────────────
  const [toast,setToast]         = useState(null);
  const [confirm,setConfirm]     = useState(null); // {msg, onConfirm}
  const [selectedDate,setSelectedDate] = useState(todayKey());
  const [today,setToday]         = useState(emptyDay());
  const [saleModal,setSaleModal] = useState(null);
  const [cobrarModal,setCobrarModal] = useState(null);
  const [fiadoManual,setFiadoManual] = useState(false);
  const [nuevoPedidoModal,setNuevoPedidoModal] = useState(null);
  const [entregarModal,setEntregarModal] = useState(null);
  const [showBidones,setShowBidones] = useState(false);
  const [dragIdx,setDragIdx]     = useState(null);
  const [cliSearch,setCliSearch] = useState("");
  const [editingCli,setEditingCli] = useState(null);
  const [cForm,setCForm]         = useState({nombre:"",tel:"",direccion:"",nota:"",estado:"activo",frecuenciaTipo:"ninguna",frecuenciaDias:7,diasSemana:[],u20Estimado:0,u12Estimado:0});

  // config tmp
  const [tmpSectors,setTmpSectors]     = useState(DEFAULT_SECTORS);
  const [tmpPrices,setTmpPrices]       = useState(DEFAULT_PRICES);
  const [tmpCv20,setTmpCv20]           = useState(DEFAULT_CV20);
  const [tmpCv12,setTmpCv12]           = useState(DEFAULT_CV12);
  const [tmpFijosCats,setTmpFijosCats] = useState(DEFAULT_FIJOS_CATS);
  const [tmpName,setTmpName]           = useState(APP_NAME_DEFAULT);
  const [restoreText,setRestoreText]   = useState("");
  const [showRestore,setShowRestore]   = useState(false);

  // ── load ───────────────────────────────────────────────────────────────
  useEffect(()=>{
    (async()=>{
      const s   = await sget("sectors_v3");    if(s)  {setSectors(s);setTmpSectors(s);}
      const pr  = await sget("prices_v1");     if(pr) {setPrices(pr);setTmpPrices(pr);}
      const c20 = await sget("costos20_v2");   if(c20){setCv20(c20);setTmpCv20(c20);}
      const c12 = await sget("costos12_v2");   if(c12){setCv12(c12);setTmpCv12(c12);}
      const fc  = await sget("fijosCats_v1");  if(fc) {setFijosCats(fc);setTmpFijosCats(fc);}
      const h   = await sget("history_v5");    if(h)  setHistory(h);
      const f   = await sget("fiados_v2");     if(f)  setFiados(f);
      const c   = await sget("clientes_v1");   if(c)  setClientes(c);
      const al  = await sget("alertPct");      if(al!=null) setAlertPct(al);
      const gl  = await sget("goalArs");       if(gl!=null) setGoalArs(gl);
      const an  = await sget("appName");       if(an) {setAppName(an);setTmpName(an);}
      const dm  = await sget("darkMode");      if(dm!=null) setDarkMode(dm);
      const p   = await sget("pedidos_v1");
      if(p){ const hoy=todayKey(); const act=p.filter(x=>!x.entregado).map(x=>x.fecha<hoy?{...x,fecha:hoy}:x); setPedidos(act); await sset("pedidos_v1",act); }
    })();
  },[]);

  useEffect(()=>{
    const d=history.find(x=>x.date===selectedDate)||emptyDay(selectedDate);
    setToday(d);
  },[selectedDate,history]);

  const showToast=(msg,color="#10B981")=>{setToast({msg,color});setTimeout(()=>setToast(null),2800);};
  const askConfirm=(msg,onConfirm)=>setConfirm({msg,onConfirm});

  const saveDay=async(day)=>{
    const nh=[{...day,savedAt:Date.now()},...history.filter(d=>d.date!==day.date)];
    setHistory(nh); await sset("history_v5",nh);
  };

  // ── pedidos ────────────────────────────────────────────────────────────
  const savePedido=async(pedido)=>{
    const existe=pedidos.find(p=>p.id===pedido.id);
    const np=existe?pedidos.map(p=>p.id===pedido.id?{...pedido,fecha:pedido.fecha||todayKey()}:p):[...pedidos,{...pedido,fecha:todayKey(),entregado:false}];
    setPedidos(np); await sset("pedidos_v1",np);
    setNuevoPedidoModal(null); showToast(existe?"✅ Pedido actualizado":"📦 Pedido agregado");
  };

  const deletePedido=async(id)=>{
    askConfirm("¿Eliminar este pedido?",async()=>{
      const np=pedidos.filter(p=>p.id!==id); setPedidos(np); await sset("pedidos_v1",np);
      setConfirm(null); showToast("🗑️ Eliminado","#ef4444");
    });
  };

  const confirmarEntrega=async(pedido,{pago,canje20,canje12,nota})=>{
    const venta={id:Date.now(),clienteId:pedido.clienteId,nombre:pedido.nombre,u20:pedido.u20||0,u12:pedido.u12||0,pago,nota,canje20,canje12};
    const targetDay=history.find(d=>d.date===todayKey())||emptyDay(todayKey());
    const newDay={...targetDay,ventas:[...(targetDay.ventas||[]),venta]};
    const nh=[{...newDay,savedAt:Date.now()},...history.filter(d=>d.date!==todayKey())];
    setHistory(nh); await sset("history_v5",nh);
    if(selectedDate===todayKey()) setToday(newDay);
    if(pago==="fiado"){
      const monto=(pedido.u20||0)*prices.p20+(pedido.u12||0)*prices.p12;
      const cliEnt=clientes.find(c=>c.id===pedido.clienteId);
      const nf=[...fiados,{id:Date.now(),nombre:pedido.nombre,clienteId:pedido.clienteId,direccion:cliEnt?.direccion||"",monto,nota,fecha:todayKey(),cobrado:false,ventaId:venta.id}];
      setFiados(nf); await sset("fiados_v2",nf);
    }
    // actualizar bidones + ultima visita en una sola operacion para evitar que se pisen
    if(pedido.clienteId){
      const deudas=[];
      if(!canje20&&(pedido.u20||0)>0) deudas.push({tipo:"20L",cant:pedido.u20});
      if(!canje12&&(pedido.u12||0)>0) deudas.push({tipo:"12L",cant:pedido.u12});
      const nc=clientes.map(c=>{
        if(c.id!==pedido.clienteId) return c;
        const bd=[...(c.bidonesDeben||[])];
        deudas.forEach(d=>{const ex=bd.find(b=>b.tipo===d.tipo);if(ex)ex.cant+=d.cant;else bd.push({...d});});
        return{...c,bidonesDeben:bd,ultimaVisita:todayKey(),visitas:(c.visitas||0)+1,notaUltimaVisita:nota||c.notaUltimaVisita};
      });
      setClientes(nc); await sset("clientes_v1",nc);
    }
    const np=pedidos.filter(p=>p.id!==pedido.id);
    setPedidos(np); await sset("pedidos_v1",np);
    setEntregarModal(null); showToast("✅ Entrega confirmada — venta registrada");
  };

  const onDragStart=(i)=>setDragIdx(i);
  const onDragOver=(e,i)=>{ e.preventDefault(); if(dragIdx===null||dragIdx===i)return; const np=[...pedidos]; const [r]=np.splice(dragIdx,1); np.splice(i,0,r); setDragIdx(i); setPedidos(np); };
  const onDragEnd=async()=>{ setDragIdx(null); await sset("pedidos_v1",pedidos); };

  // ── ventas ─────────────────────────────────────────────────────────────
  const addVenta=async(venta)=>{
    const newDay={...today,ventas:[...(today.ventas||[]),venta]};
    setToday(newDay); setSaleModal(null); await saveDay(newDay);
    if(venta.pago==="fiado"){
      const monto=(venta.u20||0)*prices.p20+(venta.u12||0)*prices.p12;
      const cliVenta=clientes.find(c=>c.id===venta.clienteId);
      const nf=[...fiados,{id:Date.now(),nombre:venta.nombre,clienteId:venta.clienteId,direccion:cliVenta?.direccion||"",monto,nota:venta.nota,fecha:selectedDate,cobrado:false,ventaId:venta.id}];
      setFiados(nf); await sset("fiados_v2",nf);
    }
    const deudas=[];
    if(!venta.canje20&&(venta.u20||0)>0) deudas.push({tipo:"20L",cant:venta.u20});
    if(!venta.canje12&&(venta.u12||0)>0) deudas.push({tipo:"12L",cant:venta.u12});
    if(deudas.length>0&&venta.clienteId){
      const nc=clientes.map(c=>{ if(c.id!==venta.clienteId)return c; const bd=[...(c.bidonesDeben||[])]; deudas.forEach(d=>{const ex=bd.find(b=>b.tipo===d.tipo);if(ex)ex.cant+=d.cant;else bd.push({...d});}); return{...c,bidonesDeben:bd}; });
      setClientes(nc); await sset("clientes_v1",nc);
    }
    showToast("✅ Venta registrada");
  };

  const editVentaFn=async(venta)=>{ const newDay={...today,ventas:today.ventas.map(v=>v.id===venta.id?venta:v)}; setToday(newDay); setSaleModal(null); await saveDay(newDay); showToast("✅ Venta actualizada"); };

  const deleteVenta=async(id)=>{
    askConfirm("¿Eliminar esta venta?",async()=>{
      const newDay={...today,ventas:today.ventas.filter(v=>v.id!==id)};
      setToday(newDay); await saveDay(newDay);
      const nf=fiados.filter(f=>f.ventaId!==id); setFiados(nf); await sset("fiados_v2",nf);
      setConfirm(null); showToast("🗑️ Eliminado","#ef4444");
    });
  };

  const saveGastos=async()=>{ await saveDay(today); setMainTab("ventas"); setSubTab("caja"); showToast("✅ Gastos guardados"); };

  // ── add cliente from modal ─────────────────────────────────────────────
  const handleAddClienteFromModal=async(nombre,setFormFn,setQuery)=>{
    const nuevo={id:Date.now(),nombre,tel:"",direccion:"",nota:"",bidonesDeben:[],estado:"activo",frecuenciaTipo:"ninguna",frecuenciaDias:7,diasSemana:[],visitas:0};
    const nc=[...clientes,nuevo]; setClientes(nc); await sset("clientes_v1",nc);
    setFormFn(v=>({...v,clienteId:nuevo.id,nombre:nuevo.nombre,direccion:""}));
    setQuery&&setQuery(nuevo.nombre);
    showToast(`👤 "${nombre}" agregado`);
  };

  // ── fiados ─────────────────────────────────────────────────────────────
  const addFiadoManual=async(f)=>{ const nf=[...fiados,f]; setFiados(nf); await sset("fiados_v2",nf); setFiadoManual(false); showToast("📋 Fiado agregado"); };

  const cobrarFiado=async(fiado,fecha)=>{
    // Marcar fiado como cobrado
    const nf=fiados.map(f=>f.id===fiado.id?{...f,cobrado:true,fechaCobro:fecha}:f);
    setFiados(nf); await sset("fiados_v2",nf);
    // Crear venta de cobro en el día correspondiente
    // Usar today si coincide la fecha, sino buscar en history
    const targetDay = fecha===todayKey()
      ? today
      : (history.find(d=>d.date===fecha)||emptyDay(fecha));
    const cobroVenta={id:Date.now(),clienteId:fiado.clienteId,nombre:fiado.nombre,u20:0,u12:0,pago:"efectivo",nota:`Cobro fiado ${labelDate(fiado.fecha)}`,montoManual:fiado.monto};
    const newDay={...targetDay,ventas:[...(targetDay.ventas||[]),cobroVenta]};
    const nh=[{...newDay,savedAt:Date.now()},...history.filter(d=>d.date!==fecha)];
    setHistory(nh); await sset("history_v5",nh);
    // Actualizar today si la fecha del cobro es la fecha seleccionada
    if(fecha===selectedDate) setToday(newDay);
    setCobrarModal(null); showToast(`✅ Cobro registrado en ${labelDate(fecha)}`);
  };

  const deleteFiado=async(id)=>{
    askConfirm("¿Eliminar este fiado?",async()=>{
      const nf=fiados.filter(f=>f.id!==id); setFiados(nf); await sset("fiados_v2",nf);
      setConfirm(null); showToast("🗑️ Eliminado","#ef4444");
    });
  };

  // ── clientes ───────────────────────────────────────────────────────────
  const saveCliente=async()=>{
    if(!cForm.nombre) return;
    const base={...cForm,bidonesDeben:editingCli?(clientes.find(c=>c.id===editingCli)?.bidonesDeben||[]):[]};
    const nc=editingCli?clientes.map(c=>c.id===editingCli?{...c,...base}:c):[...clientes,{id:Date.now(),...base,visitas:0,bidonesDeben:[]}];
    setClientes(nc); await sset("clientes_v1",nc);
    setCForm({nombre:"",tel:"",direccion:"",nota:"",estado:"activo",frecuenciaTipo:"ninguna",frecuenciaDias:7,diasSemana:[],u20Estimado:0,u12Estimado:0});
    setEditingCli(null); showToast(editingCli?"✅ Cliente actualizado":"👤 Cliente agregado");
  };

  const deleteCliente=async(id)=>{
    askConfirm("¿Eliminar este cliente? No se puede deshacer.",async()=>{
      const nc=clientes.filter(c=>c.id!==id); setClientes(nc); await sset("clientes_v1",nc);
      setConfirm(null); showToast("🗑️ Cliente eliminado","#ef4444");
    });
  };

  const devolverBidon=async(clienteId,tipo)=>{
    const nc=clientes.map(c=>{ if(c.id!==clienteId)return c; const bd=(c.bidonesDeben||[]).map(b=>b.tipo===tipo?{...b,cant:Math.max(0,b.cant-1)}:b).filter(b=>b.cant>0); return{...c,bidonesDeben:bd}; });
    setClientes(nc); await sset("clientes_v1",nc); showToast("✅ Bidón devuelto");
  };

  const handleFoto=(clienteId,e)=>{ const file=e.target.files[0]; if(!file)return; const reader=new FileReader(); reader.onload=async(ev)=>{ const nc=clientes.map(c=>c.id===clienteId?{...c,foto:ev.target.result}:c); setClientes(nc); await sset("clientes_v1",nc); showToast("📷 Foto guardada"); }; reader.readAsDataURL(file); };

  // ── config ─────────────────────────────────────────────────────────────
  const saveCfg=async()=>{
    setSectors(tmpSectors); setPrices(tmpPrices); setCv20(tmpCv20); setCv12(tmpCv12); setFijosCats(tmpFijosCats); setAppName(tmpName);
    await sset("sectors_v3",tmpSectors); await sset("prices_v1",tmpPrices); await sset("costos20_v2",tmpCv20);
    await sset("costos12_v2",tmpCv12); await sset("fijosCats_v1",tmpFijosCats); await sset("alertPct",alertPct);
    await sset("goalArs",goalArs); await sset("appName",tmpName); showToast("✅ Configuración guardada");
  };

  const exportBackup=()=>{ const data={history,fiados,clientes,sectors,prices,cv20,cv12,fijosCats,alertPct,goalArs,appName}; const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="barret-backup.json"; a.click(); showToast("📤 Exportado"); };

  const importBackup=async()=>{
    try{
      const data=JSON.parse(restoreText);
      if(data.history)  {setHistory(data.history);   await sset("history_v5",data.history);}
      if(data.fiados)   {setFiados(data.fiados);     await sset("fiados_v2",data.fiados);}
      if(data.clientes) {setClientes(data.clientes); await sset("clientes_v1",data.clientes);}
      if(data.sectors)  {setSectors(data.sectors);   setTmpSectors(data.sectors); await sset("sectors_v3",data.sectors);}
      if(data.prices)   {setPrices(data.prices);     setTmpPrices(data.prices);   await sset("prices_v1",data.prices);}
      if(data.appName)  {setAppName(data.appName);   setTmpName(data.appName);    await sset("appName",data.appName);}
      setRestoreText(""); setShowRestore(false); showToast("✅ Datos restaurados");
    }catch{ showToast("❌ JSON inválido","#ef4444"); }
  };

  // ── WA ─────────────────────────────────────────────────────────────────
  const buildWADia=(day)=>{
    const t=dayTotals(day,prices,cv20,cv12);
    const cobradas=(day.ventas||[]).filter(v=>v.pago!=="fiado");
    const fiadas=(day.ventas||[]).filter(v=>v.pago==="fiado");
    const lines=[`💧 *${appName}*`,`📅 ${labelDateLong(day.date)}`,``,`🛒 *Ventas*`,
      ...cobradas.map(v=>{ const m=v.montoManual!=null?v.montoManual:((v.u20||0)*prices.p20+(v.u12||0)*prices.p12); const desc=v.montoManual!=null?"(cobro fiado)":[v.u20>0?`${v.u20}×20L`:"",v.u12>0?`${v.u12}×12L`:""].filter(Boolean).join(" "); return`  • ${v.nombre} — ${desc} — ${fmt(m)}`; }),
      `  *Total cobrado: ${fmt(t.cobrado)}*`,``,
      fiadas.length>0?`📋 *Fiados: ${fmt(t.fiado)}*`:null,
      fiadas.length>0?fiadas.map(v=>`  • ${v.nombre}`).join("\n"):null,
      t.gastos>0?`💸 *Egresos: ${fmt(t.gastos)}*`:null,
      `📈 *Ganancia: ${fmt(t.cobrado-t.gastos)}*`,
      day.nota?`\n📝 ${day.nota}`:null,
    ].filter(l=>l!==null).join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(lines)}`,"_blank");
  };

  const buildWASemana=(days)=>{
    const ws2=weekStart(); const we=new Date(ws2+"T12:00:00"); we.setDate(we.getDate()+6);
    const cierre=calcCierreSemanal(days,prices,cv20,cv12,fijosCats);
    const lines=[`💧 *${appName} — Cierre Semanal*`,`📅 ${labelDate(ws2)} al ${labelDate(we.toISOString().slice(0,10))}`,``,
      `🛒 Ventas: ${fmt(cierre.cobrado)}`,`📦 Bidones: ${cierre.u20>0?`${cierre.u20}×20L `:""}${cierre.u12>0?`${cierre.u12}×12L`:""} (${cierre.totalBidones} total)`,``,
      cierre.fijosPorCat.length>0?`🔁 Costos fijos:`:null,
      ...cierre.fijosPorCat.map(c=>`  • ${c.icon} ${c.name}: ${fmt(c.total)} → ${fmt(Math.round(c.porBidon))}/bidón`),
      `💸 *Egresos: ${fmt(cierre.costoTotalReal+cierre.gastosExt)}*`,
      `📈 *Utilidad: ${fmt(cierre.utilidad)}*`,
    ].filter(l=>l!==null).join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(lines)}`,"_blank");
  };

  // ── derived ────────────────────────────────────────────────────────────
  const todayT       = dayTotals(today,prices,cv20,cv12);
  const isToday      = selectedDate===todayKey();
  const ws           = weekStart();
  const pws          = prevWeekStart(); const pwe=prevWeekEnd();
  const cm           = currentMonth();
  const thisWeek     = history.filter(d=>d.date>=ws);
  const prevWeek     = history.filter(d=>d.date>=pws&&d.date<=pwe);
  const thisMonth    = history.filter(d=>d.date.startsWith(cm));
  const lastMonth    = history.filter(d=>d.date.startsWith(prevMonth()));
  const goalProgress = Math.min((todayT.cobrado/(goalArs||50000))*100,100);
  const unitProgress = Math.min(((todayT.u20+todayT.u12)/DAILY_UNIT_GOAL)*100,100);
  const gastoAlert   = todayT.cobrado>0&&(todayT.gastos/todayT.cobrado)*100>alertPct;
  const cierreSemana = calcCierreSemanal(thisWeek,prices,cv20,cv12,fijosCats);
  const cierrePrevSem= calcCierreSemanal(prevWeek,prices,cv20,cv12,fijosCats);
  const monthTotal   = thisMonth.reduce((a,d)=>a+dayTotals(d,prices,cv20,cv12).cobrado,0);
  const lastMonthTotal=lastMonth.reduce((a,d)=>a+dayTotals(d,prices,cv20,cv12).cobrado,0);
  const sectoresToday= sectors.map(s=>({...s,totalDay:s.monto*(todayT.u20+todayT.u12)}));
  const clienteRanking=clientes.map(c=>({...c,totalMes:thisMonth.reduce((a,d)=>{const vs=(d.ventas||[]).filter(v=>v.clienteId===c.id&&!v.montoManual&&v.pago!=="fiado"); return a+vs.reduce((b,v)=>b+(v.u20||0)*prices.p20+(v.u12||0)*prices.p12,0);},0)})).filter(c=>c.totalMes>0).sort((a,b)=>b.totalMes-a.totalMes).slice(0,5);
  const bidonesSinDevolver = clientes.flatMap(c=>(c.bidonesDeben||[]).filter(b=>b.cant>0).map(b=>({...b,nombre:c.nombre,clienteId:c.id})));
  const totalSinDevolver   = bidonesSinDevolver.reduce((a,b)=>a+b.cant,0);

  // visitas programadas para hoy
  const visitasProgramadas = clientes.filter(c=>tocaHoy(c) && c.estado!=="perdido");
  // clientes filtrados
  const clientesFiltrados  = clientes.filter(c=>
    c.nombre.toLowerCase().includes(cliSearch.toLowerCase()) ||
    (c.direccion||"").toLowerCase().includes(cliSearch.toLowerCase()) ||
    (c.tel||"").includes(cliSearch)
  );

  // ── render helpers ─────────────────────────────────────────────────────
  const NAV_TABS = [
    { id:"ventas",    label:"Ventas",   icon:"💰" },
    { id:"clientes",  label:"Clientes", icon:"👥" },
    { id:"reportes",  label:"Reportes", icon:"📊" },
    { id:"config",    label:"Config",   icon:"⚙️" },
  ];

  return (
    <div style={{minHeight:"100vh",background:th.bg,fontFamily:"'DM Sans',system-ui,sans-serif",color:th.text,paddingBottom:72}}>
      {/* modals */}
      {saleModal&&<SaleModal clientes={clientes} prices={prices} editVenta={saleModal!=="new"?saleModal:null} onSave={saleModal==="new"?addVenta:editVentaFn} onAddCliente={(n,sf,sq)=>handleAddClienteFromModal(n,sf,sq)} onClose={()=>setSaleModal(null)} th={th}/>}
      {cobrarModal&&<CobrarModal fiado={cobrarModal} onCobrar={cobrarFiado} onClose={()=>setCobrarModal(null)} th={th}/>}
      {fiadoManual&&<FiadoManualModal clientes={clientes} onSave={addFiadoManual} onClose={()=>setFiadoManual(false)} th={th}/>}
      {nuevoPedidoModal&&<NuevoPedidoModal clientes={clientes} editPedido={nuevoPedidoModal!=="new"?nuevoPedidoModal:null} onSave={savePedido} onClose={()=>setNuevoPedidoModal(null)} onAddCliente={(n,sf,sq)=>handleAddClienteFromModal(n,sf,sq)} th={th}/>}
      {entregarModal&&<EntregarModal pedido={entregarModal} onConfirm={(opts)=>confirmarEntrega(entregarModal,opts)} onClose={()=>setEntregarModal(null)} th={th}/>}
      {confirm&&<ConfirmDialog msg={confirm.msg} onConfirm={confirm.onConfirm} onCancel={()=>setConfirm(null)} th={th}/>}

      {/* toast */}
      {toast&&<div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:toast.color,color:"white",padding:"10px 20px",borderRadius:30,fontSize:13,fontWeight:600,zIndex:999,boxShadow:"0 8px 24px rgba(0,0,0,0.4)",whiteSpace:"nowrap",zIndex:998}}>{toast.msg}</div>}

      {/* bidones overlay */}
      {showBidones&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setShowBidones(false)}>
          <div style={{...glassCard(th),maxWidth:380,width:"100%",padding:24}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
              <div style={{fontSize:15,fontWeight:700,color:th.text}}>🪣 Bidones sin devolver</div>
              <button onClick={()=>setShowBidones(false)} style={{...btnGhost(th),padding:"3px 10px"}}>✕</button>
            </div>
            {bidonesSinDevolver.length===0?<div style={{color:th.textMuted,fontSize:13}}>Todos devueltos ✅</div>:
              bidonesSinDevolver.map((b,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",marginBottom:8,background:"rgba(239,68,68,0.08)",borderRadius:11,border:"1px solid rgba(239,68,68,0.2)"}}>
                  <div><div style={{fontSize:13,fontWeight:600,color:th.text}}>{b.nombre}</div><div style={{fontSize:12,color:"#ef4444"}}>{b.cant}× {b.tipo}</div></div>
                  <button onClick={()=>devolverBidon(b.clienteId,b.tipo)} style={{fontSize:12,padding:"5px 10px",background:"rgba(16,185,129,0.15)",border:"1px solid rgba(16,185,129,0.3)",borderRadius:8,color:"#10B981",cursor:"pointer"}}>Devolvió 1</button>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={{background:darkMode?"linear-gradient(135deg,rgba(14,165,233,0.12),rgba(14,165,233,0.03))":"linear-gradient(135deg,rgba(14,165,233,0.08),rgba(14,165,233,0.02))",borderBottom:`1px solid ${th.border}`,padding:"11px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,backdropFilter:"blur(12px)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <img src={LOGO_B64} alt="logo" style={{width:34,height:34,objectFit:"contain"}}/>
          <div>
            <div style={{fontWeight:700,fontSize:14,color:th.text}}>{appName}</div>
            <div style={{fontSize:10,color:th.textMuted}}>{labelDate(todayKey())}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {totalSinDevolver>0&&<button onClick={()=>setShowBidones(true)} style={{background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:20,padding:"4px 11px",color:"#ef4444",cursor:"pointer",fontSize:11,fontWeight:700}}>🪣 {totalSinDevolver}</button>}
          {cierreSemana.cobrado>0&&<div style={{textAlign:"right"}}><div style={{fontSize:9,color:th.textMuted}}>Semana</div><div style={{color:th.accent,fontWeight:700,fontSize:13}}>{fmt(cierreSemana.cobrado)}</div></div>}
          <button onClick={async()=>{ const nd=!darkMode; setDarkMode(nd); await sset("darkMode",nd); }} style={{...btnGhost(th),padding:"6px 10px",fontSize:14}}>{darkMode?"☀️":"🌙"}</button>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{padding:"16px 14px",maxWidth:680,margin:"0 auto"}}>

        {/* ── RUTEO ── */}
        {mainTab==="ruteo"&&<>
          {/* SECCIÓN 1: Visitas programadas */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontSize:13,fontWeight:700,color:th.text}}>📅 Visitas programadas</div>
            <div style={{fontSize:11,color:th.textMuted}}>{visitasProgramadas.length} de {clientes.filter(c=>c.frecuenciaTipo!=="ninguna"&&c.estado==="activo").length} activos</div>
          </div>

          {visitasProgramadas.length===0&&(
            <GCard th={th} style={{textAlign:"center",padding:"20px",marginBottom:16}}>
              <div style={{fontSize:11,color:th.textMuted}}>Sin visitas programadas para hoy</div>
              <div style={{fontSize:10,color:th.textDim,marginTop:4}}>Configurá la frecuencia de tus clientes en el tab Clientes</div>
            </GCard>
          )}

          {visitasProgramadas.map((cli,i)=>{
            const yaEntregado = pedidos.some(p=>p.clienteId===cli.id&&p.esProgramado);
            const diasSinVisita = cli.ultimaVisita ? diffDays(cli.ultimaVisita, todayKey()) : null;
            const mapsUrl = cli.direccion ? `https://maps.google.com/?q=${encodeURIComponent(cli.direccion+" San José Entre Ríos Argentina")}` : "";
            return(
              <GCard key={cli.id} th={th} style={{marginBottom:10,opacity:yaEntregado?0.5:1}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  <div style={{width:32,height:32,borderRadius:10,background:`${th.accent}20`,border:`1px solid ${th.accent}35`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:th.accent,flexShrink:0}}>{i+1}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:14,color:th.text}}>{cli.nombre}</div>
                    <div style={{fontSize:11,color:th.textMuted,display:"flex",gap:8,flexWrap:"wrap",marginTop:2}}>
                      {cli.direccion&&<span>📍 {cli.direccion}</span>}
                      {(cli.u20Estimado>0||cli.u12Estimado>0)&&<span style={{color:th.accent}}>{cli.u20Estimado>0?`${cli.u20Estimado}×20L`:""}{cli.u12Estimado>0?` ${cli.u12Estimado}×12L`:""} est.</span>}
                    </div>
                    {diasSinVisita!==null&&<div style={{fontSize:10,color:diasSinVisita>7?"#ef4444":th.textDim,marginTop:2}}>Última visita: hace {diasSinVisita} día{diasSinVisita!==1?"s":""}</div>}
                    {cli.notaUltimaVisita&&<div style={{fontSize:10,color:th.textMuted,marginTop:2,fontStyle:"italic"}}>"{cli.notaUltimaVisita}"</div>}
                  </div>
                  {yaEntregado&&<span style={{fontSize:11,color:"#10B981",fontWeight:600}}>✅ Entregado</span>}
                </div>
                {!yaEntregado&&<div style={{display:"grid",gridTemplateColumns:mapsUrl?"1fr 1fr 1fr":"1fr 1fr",gap:8}}>
                  {mapsUrl&&<a href={mapsUrl} target="_blank" rel="noreferrer" style={{padding:"9px 4px",background:`${th.accent}14`,border:`1px solid ${th.accent}30`,borderRadius:10,color:th.accent,textDecoration:"none",fontWeight:600,fontSize:12,textAlign:"center",display:"block"}}>📍 Maps</a>}
                  <button onClick={()=>setEntregarModal({...cli,clienteId:cli.id,u20:cli.u20Estimado||0,u12:cli.u12Estimado||0,esProgramado:true})} style={{padding:"9px 4px",background:"linear-gradient(135deg,rgba(16,185,129,0.2),rgba(5,150,105,0.15))",border:"1px solid rgba(16,185,129,0.3)",borderRadius:10,color:"#10B981",cursor:"pointer",fontWeight:700,fontSize:12}}>✅ Entregar</button>
                  <button onClick={()=>setNuevoPedidoModal({id:`prog-${cli.id}`,clienteId:cli.id,nombre:cli.nombre,direccion:cli.direccion||"",u20:cli.u20Estimado||0,u12:cli.u12Estimado||0,nota:"",esProgramado:true})} style={{padding:"9px 4px",background:"rgba(139,92,246,0.1)",border:"1px solid rgba(139,92,246,0.25)",borderRadius:10,color:"#8B5CF6",cursor:"pointer",fontWeight:600,fontSize:12}}>✏️ Ajustar</button>
                </div>}
              </GCard>
            );
          })}

          {/* SECCIÓN 2: Pedidos del día */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6,marginBottom:10}}>
            <div style={{fontSize:13,fontWeight:700,color:th.text}}>📲 Pedidos del día</div>
            <button onClick={()=>setNuevoPedidoModal("new")} style={{padding:"7px 13px",background:`${th.accent}20`,border:`1px solid ${th.accent}35`,borderRadius:10,color:th.accent,fontWeight:700,cursor:"pointer",fontSize:12}}>+ Pedido</button>
          </div>

          {pedidos.length===0&&<GCard th={th} style={{textAlign:"center",padding:"18px",marginBottom:8}}><div style={{fontSize:11,color:th.textMuted}}>Sin pedidos puntuales por ahora</div></GCard>}

          {pedidos.map((p,i)=>{
            const cli=clientes.find(c=>c.id===p.clienteId);
            const mapsUrl=cli?.direccion?`https://maps.google.com/?q=${encodeURIComponent(cli.direccion+" San José Entre Ríos Argentina")}`:"";
            return(
              <div key={p.id} draggable onDragStart={()=>onDragStart(i)} onDragOver={e=>onDragOver(e,i)} onDragEnd={onDragEnd}
                style={{...glassCard(th),marginBottom:10,cursor:"grab",opacity:dragIdx===i?0.45:1,transition:"opacity 0.15s"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  <div style={{width:28,height:28,borderRadius:9,background:"rgba(139,92,246,0.15)",border:"1px solid rgba(139,92,246,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#8B5CF6",flexShrink:0}}>{i+1}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:13,color:th.text}}>{p.nombre}</div>
                    <div style={{fontSize:11,color:th.textMuted}}>{[p.u20>0?`${p.u20}×20L`:"",p.u12>0?`${p.u12}×12L`:""].filter(Boolean).join(" · ")}{p.nota?` · ${p.nota}`:""}</div>
                    {cli?.direccion&&<div style={{fontSize:10,color:th.textDim,marginTop:1}}>📍 {cli.direccion}</div>}
                  </div>
                  <span style={{fontSize:16,color:th.textDim}}>⠿</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:mapsUrl?"1fr 1fr 1fr 1fr":"1fr 1fr 1fr",gap:7}}>
                  {mapsUrl&&<a href={mapsUrl} target="_blank" rel="noreferrer" style={{padding:"8px 4px",background:`${th.accent}14`,border:`1px solid ${th.accent}30`,borderRadius:9,color:th.accent,textDecoration:"none",fontWeight:600,fontSize:11,textAlign:"center",display:"block"}}>📍 Maps</a>}
                  <button onClick={()=>setNuevoPedidoModal(p)} style={{padding:"8px 4px",background:"rgba(139,92,246,0.1)",border:"1px solid rgba(139,92,246,0.22)",borderRadius:9,color:"#8B5CF6",cursor:"pointer",fontWeight:600,fontSize:11}}>✏️ Editar</button>
                  <button onClick={()=>setEntregarModal(p)} style={{padding:"8px 4px",background:"rgba(16,185,129,0.15)",border:"1px solid rgba(16,185,129,0.3)",borderRadius:9,color:"#10B981",cursor:"pointer",fontWeight:700,fontSize:11}}>✅ Entregar</button>
                  <button onClick={()=>deletePedido(p.id)} style={{padding:"8px 4px",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.18)",borderRadius:9,color:"#ef4444",cursor:"pointer",fontSize:11}}>🗑️</button>
                </div>
              </div>
            );
          })}
          {pedidos.length>1&&<div style={{textAlign:"center",fontSize:11,color:th.textDim,marginTop:4}}>💡 Arrastrá para reordenar</div>}
        </>}

        {/* ── VENTAS ── */}
        {mainTab==="ventas"&&<>
          {/* sub-nav */}
          <div style={{display:"flex",gap:6,marginBottom:16}}>
            {[["caja","📦 Caja"],["fiados","💳 Fiados"],["gastos","💸 Gastos"]].map(([k,l])=>(
              <button key={k} onClick={()=>setSubTab(k)} style={{padding:"8px 14px",borderRadius:20,border:`1px solid ${subTab===k?th.accent:th.border}`,background:subTab===k?`${th.accent}20`:"transparent",color:subTab===k?th.accent:th.textMuted,cursor:"pointer",fontSize:12,fontWeight:subTab===k?700:400}}>
                {l}
              </button>
            ))}
          </div>

          {subTab==="caja"&&<>
            <GCard th={th} style={{marginBottom:14,display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
              <div><div style={{fontSize:10,color:th.textMuted,textTransform:"uppercase",letterSpacing:"0.05em"}}>Día</div>
              <div style={{fontWeight:700,fontSize:14,color:isToday?th.accent:th.text}}>{isToday?"📅 Hoy":labelDate(selectedDate)}</div></div>
              <input type="date" value={selectedDate} max={todayKey()} onChange={e=>setSelectedDate(e.target.value)} style={{...inputStyle(th),width:"auto",fontSize:13}}/>
            </GCard>

            {isToday&&<GCard th={th} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{fontSize:12,fontWeight:600,color:th.textMuted,textTransform:"uppercase",letterSpacing:"0.05em"}}>Objetivo diario</span>
                <span style={{fontSize:12,color:goalProgress>=100?"#10B981":th.textMuted}}>{fmt(todayT.cobrado)} / {fmt(goalArs)}</span>
              </div>
              <PBar pct={goalProgress} a={th.accent} b="#38bdf8"/>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:5}}>
                <span style={{fontSize:10,color:th.textDim}}>Unidades: {todayT.u20+todayT.u12} / {DAILY_UNIT_GOAL}</span>
                <span style={{fontSize:10,color:goalProgress>=100?"#10B981":th.textMuted,fontWeight:600}}>{goalProgress>=100?"🎉 Meta!":Math.round(goalProgress)+"%"}</span>
              </div>
              <PBar pct={unitProgress} a="#8B5CF6" b="#a78bfa" style={{marginTop:4}}/>
            </GCard>}

            {gastoAlert&&<div style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:12,padding:"10px 14px",marginBottom:12,fontSize:13,color:"#fca5a5"}}>⚠️ Gastos ({Math.round((todayT.gastos/todayT.cobrado)*100)}%) superan el {alertPct}%</div>}

            <div style={{marginBottom:14}}>
              {(today.ventas||[]).length===0&&<Empty icon="🛒" text="Sin ventas en este día" th={th}/>}
              {(today.ventas||[]).map(v=>{
                const tipo=PAGO_TIPOS.find(t=>t.id===v.pago);
                const monto=v.montoManual!=null?v.montoManual:((v.u20||0)*prices.p20+(v.u12||0)*prices.p12);
                return(
                  <div key={v.id} style={{...glassCard(th),display:"flex",alignItems:"center",gap:8,padding:"10px 12px",marginBottom:8,borderLeft:`3px solid ${tipo.color}`}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:600,fontSize:13,color:th.text}}>{v.nombre}</div>
                      <div style={{fontSize:11,color:th.textMuted}}>{[v.u20>0?`${v.u20}×20L`:"",v.u12>0?`${v.u12}×12L`:"",v.nota].filter(Boolean).join(" · ")}</div>
                      {((!v.canje20&&v.u20>0)||(!v.canje12&&v.u12>0))&&<div style={{fontSize:10,color:"#F59E0B",marginTop:1}}>⚠️ Bidón sin devolver</div>}
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontWeight:700,color:tipo.color,fontSize:14}}>{fmt(monto)}</div>
                      <div style={{fontSize:10,color:th.textDim}}>{tipo.label}</div>
                    </div>
                    {!v.montoManual&&<button onClick={()=>setSaleModal(v)} style={{...btnGhost(th),padding:"4px 8px",fontSize:12}}>✏️</button>}
                    <button onClick={()=>deleteVenta(v.id)} style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.18)",borderRadius:8,color:"#ef4444",cursor:"pointer",padding:"4px 9px",fontSize:13}}>×</button>
                  </div>
                );
              })}
              <button onClick={()=>setSaleModal("new")} style={{...btnPrimary,marginTop:4}}>+ Nueva venta</button>
            </div>

            {(today.ventas||[]).length>0&&<>
              <GCard th={th} style={{marginBottom:12}}>
                <SectionTitle th={th}>Resumen del día</SectionTitle>
                <Row label="💵 Efectivo" value={fmt(todayT.efectivo)} vc="#10B981" th={th}/>
                <Row label="🏦 Transferencia" value={fmt(todayT.transferencia)} vc={th.accent} th={th}/>
                {todayT.fiado>0&&<Row label="📋 Fiados" value={fmt(todayT.fiado)} vc="#F59E0B" th={th}/>}
                <TotalRow label="Total cobrado" value={fmt(todayT.cobrado)} color={th.accent} th={th}/>
                {todayT.gastos>0&&<>
                  {todayT.gastosOp>0&&<Row label="⚙️ Operativos" value={`−${fmt(todayT.gastosOp)}`} vc="#8B5CF6" th={th}/>}
                  {todayT.gastosFijos>0&&<Row label="🔁 Costos fijos" value={`−${fmt(todayT.gastosFijos)}`} vc={th.accent} th={th}/>}
                  {todayT.gastosExt>0&&<Row label="⚠️ Extraordinarios" value={`−${fmt(todayT.gastosExt)}`} vc="#ef4444" th={th}/>}
                  <TotalRow label="Ganancia est." value={fmt(todayT.cobrado-todayT.gastos)} color="#10B981" th={th}/>
                </>}
              </GCard>
              {(todayT.u20+todayT.u12)>0&&<GCard th={th} style={{marginBottom:12}}>
                <SectionTitle th={th}>Separación del día</SectionTitle>
                {sectoresToday.map(s=>(
                  <div key={s.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 10px",marginBottom:5,background:`${s.color}0d`,borderRadius:9,border:`1px solid ${s.color}20`}}>
                    <div><span style={{marginRight:6}}>{s.icon}</span><span style={{fontSize:12,color:th.text}}>{s.name}</span><span style={{fontSize:10,color:th.textMuted,marginLeft:6}}>{fmt(s.monto)}/u</span></div>
                    <span style={{fontWeight:700,color:s.color,fontSize:14}}>{fmt(s.totalDay)}</span>
                  </div>
                ))}
              </GCard>}
              <div style={{display:"flex",gap:10,marginBottom:12}}>
                <button onClick={()=>buildWADia(today)} style={{flex:1,padding:"11px",background:"rgba(37,211,102,0.12)",border:"1px solid rgba(37,211,102,0.25)",borderRadius:12,color:"#25d366",cursor:"pointer",fontWeight:600,fontSize:13}}>📤 WA Día</button>
              </div>
            </>}

            <GCard th={th}>
              <Label th={th}>Nota del día</Label>
              <textarea placeholder="Anotá algo..." value={today.nota||""} onChange={e=>setToday(t=>({...t,nota:e.target.value}))} onBlur={()=>saveDay(today)} rows={2} style={{...inputStyle(th),resize:"none"}}/>
            </GCard>
          </>}

          {subTab==="gastos"&&<GastoPanel gastos={today.gastos?.length?today.gastos:[{desc:"",monto:"",tipo:"operativo",cat:""}]} setGastos={g=>setToday(t=>({...t,gastos:g}))} fijosCats={fijosCats} onSave={saveGastos} onBack={()=>setSubTab("caja")} th={th}/>}

          {subTab==="fiados"&&<>
            <button onClick={()=>setFiadoManual(true)} style={{width:"100%",padding:"11px",marginBottom:14,background:"rgba(245,158,11,0.08)",border:"1px dashed rgba(245,158,11,0.3)",borderRadius:12,color:"#F59E0B",cursor:"pointer",fontWeight:600,fontSize:13}}>+ Agregar fiado manualmente</button>
            {fiados.filter(f=>!f.cobrado).length>0&&<>
              <SectionTitle th={th}>Pendientes</SectionTitle>
              {fiados.filter(f=>!f.cobrado).map(f=><FiadoRow key={f.id} f={f} onCobrar={()=>setCobrarModal(f)} onDelete={()=>deleteFiado(f.id)} th={th}/>)}
              <TotalRow label="Total pendiente" value={fmt(fiados.filter(f=>!f.cobrado).reduce((a,f)=>a+f.monto,0))} color="#F59E0B" th={th}/>
            </>}
            {fiados.filter(f=>!f.cobrado).length===0&&<Empty icon="💳" text="Sin fiados pendientes" th={th}/>}
            {fiados.filter(f=>f.cobrado).length>0&&<>
              <SectionTitle th={th} style={{marginTop:16}}>Cobrados</SectionTitle>
              {fiados.filter(f=>f.cobrado).slice(-8).map(f=><FiadoRow key={f.id} f={f} onCobrar={()=>{}} onDelete={()=>deleteFiado(f.id)} dimmed th={th}/>)}
            </>}
          </>}
        </>}

        {/* ── CLIENTES ── */}
        {mainTab==="clientes"&&<>
          {/* Búsqueda */}
          <GCard th={th} style={{marginBottom:14}}>
            <input type="text" placeholder="Buscar por nombre, dirección o teléfono..." value={cliSearch} onChange={e=>setCliSearch(e.target.value)} style={inputStyle(th)}/>
          </GCard>

          {/* Formulario agregar/editar */}
          <GCard th={th} style={{marginBottom:16}}>
            <SectionTitle th={th}>{editingCli?"Editar cliente":"Agregar cliente"}</SectionTitle>
            <input type="text" placeholder="Nombre *" value={cForm.nombre} onChange={e=>setCForm(f=>({...f,nombre:e.target.value}))} style={{...inputStyle(th),marginBottom:8}}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
              <div><Label th={th}>Teléfono</Label><input type="text" value={cForm.tel} onChange={e=>setCForm(f=>({...f,tel:e.target.value}))} style={inputStyle(th)}/></div>
              <div><Label th={th}>Dirección</Label><input type="text" value={cForm.direccion} onChange={e=>setCForm(f=>({...f,direccion:e.target.value}))} style={inputStyle(th)}/></div>
            </div>

            {/* Estado */}
            <Label th={th}>Estado</Label>
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              {ESTADOS_CLIENTE.map(e=>(
                <button key={e.id} onClick={()=>setCForm(f=>({...f,estado:e.id}))} style={{flex:1,padding:"7px",borderRadius:9,border:`2px solid ${cForm.estado===e.id?e.color:th.border}`,background:cForm.estado===e.id?`${e.color}18`:"transparent",color:cForm.estado===e.id?e.color:th.textMuted,cursor:"pointer",fontSize:12,fontWeight:cForm.estado===e.id?700:400}}>
                  {e.label}
                </button>
              ))}
            </div>

            {/* Frecuencia */}
            <Label th={th}>Frecuencia de visita</Label>
            <div style={{display:"flex",gap:6,marginBottom:10}}>
              {[["ninguna","Sin frecuencia"],["semanal","Días fijos"],["dias","Cada X días"]].map(([k,l])=>(
                <button key={k} onClick={()=>setCForm(f=>({...f,frecuenciaTipo:k}))} style={{flex:1,padding:"7px 4px",borderRadius:9,border:`2px solid ${cForm.frecuenciaTipo===k?th.accent:th.border}`,background:cForm.frecuenciaTipo===k?`${th.accent}18`:"transparent",color:cForm.frecuenciaTipo===k?th.accent:th.textMuted,cursor:"pointer",fontSize:11,fontWeight:cForm.frecuenciaTipo===k?700:400}}>
                  {l}
                </button>
              ))}
            </div>
            {cForm.frecuenciaTipo==="semanal"&&(
              <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
                {DIAS_SEMANA.map((d,i)=>(
                  <button key={i} onClick={()=>setCForm(f=>({...f,diasSemana:f.diasSemana.includes(i)?f.diasSemana.filter(x=>x!==i):[...f.diasSemana,i]}))}
                    style={{padding:"6px 10px",borderRadius:9,border:`2px solid ${cForm.diasSemana.includes(i)?th.accent:th.border}`,background:cForm.diasSemana.includes(i)?`${th.accent}20`:"transparent",color:cForm.diasSemana.includes(i)?th.accent:th.textMuted,cursor:"pointer",fontSize:12,fontWeight:cForm.diasSemana.includes(i)?700:400}}>
                    {d}
                  </button>
                ))}
              </div>
            )}
            {cForm.frecuenciaTipo==="dias"&&(
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                <span style={{fontSize:12,color:th.textMuted}}>Cada</span>
                <input type="number" min="1" max="30" value={cForm.frecuenciaDias} onChange={e=>setCForm(f=>({...f,frecuenciaDias:parseInt(e.target.value)||7}))} style={{...inputStyle(th),width:70,textAlign:"center"}}/>
                <span style={{fontSize:12,color:th.textMuted}}>días</span>
              </div>
            )}

            {/* Bidones estimados */}
            {cForm.frecuenciaTipo!=="ninguna"&&<>
              <Label th={th}>Bidones estimados por visita</Label>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                {[["u20Estimado","20L"],["u12Estimado","12L"]].map(([field,label])=>(
                  <div key={field} style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:12,color:th.textMuted,minWidth:30}}>{label}:</span>
                    <button onClick={()=>setCForm(f=>({...f,[field]:Math.max(0,(f[field]||0)-1)}))} style={{...btnGhost(th),padding:"4px 10px"}}>−</button>
                    <span style={{fontWeight:700,color:th.accent,minWidth:20,textAlign:"center"}}>{cForm[field]||0}</span>
                    <button onClick={()=>setCForm(f=>({...f,[field]:(f[field]||0)+1}))} style={{...btnGhost(th),padding:"4px 10px"}}>+</button>
                  </div>
                ))}
              </div>
            </>}

            <Label th={th}>Nota</Label>
            <input type="text" value={cForm.nota} onChange={e=>setCForm(f=>({...f,nota:e.target.value}))} style={{...inputStyle(th),marginBottom:12}}/>
            <div style={{display:"flex",gap:8}}>
              {editingCli&&<button onClick={()=>{setEditingCli(null);setCForm({nombre:"",tel:"",direccion:"",nota:"",estado:"activo",frecuenciaTipo:"ninguna",frecuenciaDias:7,diasSemana:[],u20Estimado:0,u12Estimado:0});}} style={{...btnGhost(th)}}>Cancelar</button>}
              <button onClick={saveCliente} style={{...btnPrimary,background:"linear-gradient(135deg,#8B5CF6,#7C3AED)",boxShadow:"0 6px 20px rgba(139,92,246,0.3)"}}>
                {editingCli?"✅ Guardar":"👤 Agregar"}
              </button>
            </div>
          </GCard>

          {clientesFiltrados.length===0&&<Empty icon="👥" text="Sin clientes todavía" th={th}/>}
          {clientesFiltrados.map(c=>{
            const estado=ESTADOS_CLIENTE.find(e=>e.id===(c.estado||"activo"));
            const fiadosPend=fiados.filter(f=>f.clienteId===c.id&&!f.cobrado).reduce((a,f)=>a+f.monto,0);
            const bidonesDeben=(c.bidonesDeben||[]).filter(b=>b.cant>0);
            const prox=proximaVisita(c);
            const diasProx=prox?diffDays(todayKey(),prox):null;
            const totalCompras=history.reduce((a,d)=>{const vs=(d.ventas||[]).filter(v=>v.clienteId===c.id&&!v.montoManual&&v.pago!=="fiado"); return a+vs.reduce((b,v)=>b+(v.u20||0)*prices.p20+(v.u12||0)*prices.p12,0);},0);
            return(
              <GCard key={c.id} th={th} style={{marginBottom:12}}>
                <div style={{display:"flex",gap:12,marginBottom:10}}>
                  <div style={{position:"relative",flexShrink:0}}>
                    <div style={{width:50,height:50,borderRadius:12,background:`${th.accent}15`,border:`1px solid ${th.border}`,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>
                      {c.foto?<img src={c.foto} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:"👤"}
                    </div>
                    <label style={{position:"absolute",bottom:-4,right:-4,width:18,height:18,borderRadius:6,background:th.accent,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9}}>
                      📷<input type="file" accept="image/*" style={{display:"none"}} onChange={e=>handleFoto(c.id,e)}/>
                    </label>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontWeight:700,fontSize:14,color:th.text}}>{c.nombre}</span>
                      <span style={{fontSize:10,fontWeight:600,color:estado.color,background:`${estado.color}18`,padding:"2px 7px",borderRadius:20}}>{estado.label}</span>
                    </div>
                    {c.tel&&<a href={`https://wa.me/54${c.tel.replace(/\D/g,"")}`} target="_blank" rel="noreferrer" style={{fontSize:12,color:"#25d366",textDecoration:"none",display:"block",marginTop:2}}>📱 {c.tel}</a>}
                    {c.direccion&&<a href={`https://maps.google.com/?q=${encodeURIComponent(c.direccion+" San José Entre Ríos Argentina")}`} target="_blank" rel="noreferrer" style={{display:"block",fontSize:12,color:th.accent,textDecoration:"none",marginTop:1}}>📍 {c.direccion}</a>}
                    {c.frecuenciaTipo&&c.frecuenciaTipo!=="ninguna"&&<div style={{fontSize:10,color:th.textMuted,marginTop:2}}>
                      {c.frecuenciaTipo==="semanal"?`📅 ${(c.diasSemana||[]).map(d=>DIAS_SEMANA[d]).join(", ")}`:`🔄 Cada ${c.frecuenciaDias} días`}
                      {prox&&<span style={{marginLeft:6,color:diasProx<=1?"#10B981":diasProx<=3?"#F59E0B":th.textDim}}>→ próx. {diasProx===0?"hoy":diasProx===1?"mañana":`en ${diasProx}d`}</span>}
                    </div>}
                    {c.visitas>0&&<div style={{fontSize:10,color:th.textDim,marginTop:1}}>🏃 {c.visitas} visita{c.visitas!==1?"s":""}{c.ultimaVisita?` · última hace ${diffDays(c.ultimaVisita,todayKey())}d`:""}</div>}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    <button onClick={()=>{setEditingCli(c.id);setCForm({nombre:c.nombre,tel:c.tel||"",direccion:c.direccion||"",nota:c.nota||"",estado:c.estado||"activo",frecuenciaTipo:c.frecuenciaTipo||"ninguna",frecuenciaDias:c.frecuenciaDias||7,diasSemana:c.diasSemana||[],u20Estimado:c.u20Estimado||0,u12Estimado:c.u12Estimado||0});window.scrollTo(0,0);}} style={{...btnGhost(th),padding:"4px 9px",fontSize:12}}>✏️</button>
                    <button onClick={()=>deleteCliente(c.id)} style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.18)",borderRadius:8,color:"#ef4444",cursor:"pointer",padding:"4px 9px",fontSize:13}}>🗑️</button>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:bidonesDeben.length>0?10:0}}>
                  <div style={{padding:"8px 10px",background:`${th.accent}0d`,borderRadius:9}}><div style={{fontSize:9,color:th.textMuted,textTransform:"uppercase",letterSpacing:"0.05em"}}>Compras totales</div><div style={{fontWeight:600,color:th.accent,fontSize:13}}>{totalCompras>0?fmt(totalCompras):"—"}</div></div>
                  <div style={{padding:"8px 10px",background:fiadosPend>0?"rgba(245,158,11,0.1)":"rgba(255,255,255,0.04)",borderRadius:9}}><div style={{fontSize:9,color:th.textMuted,textTransform:"uppercase",letterSpacing:"0.05em"}}>Fiado pendiente</div><div style={{fontWeight:600,color:fiadosPend>0?"#F59E0B":th.textDim,fontSize:13}}>{fiadosPend>0?fmt(fiadosPend):"Sin deuda"}</div></div>
                </div>
                {bidonesDeben.length>0&&<div style={{padding:"9px 11px",background:"rgba(239,68,68,0.08)",borderRadius:9,border:"1px solid rgba(239,68,68,0.2)"}}>
                  <div style={{fontSize:10,color:"#ef4444",marginBottom:5}}>🪣 Bidones que debe</div>
                  {bidonesDeben.map(b=>(
                    <div key={b.tipo} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                      <span style={{fontSize:12,color:th.text}}>{b.cant}× bidón {b.tipo}</span>
                      <button onClick={()=>devolverBidon(c.id,b.tipo)} style={{fontSize:11,padding:"3px 9px",background:"rgba(16,185,129,0.15)",border:"1px solid rgba(16,185,129,0.3)",borderRadius:7,color:"#10B981",cursor:"pointer"}}>Devolvió 1</button>
                    </div>
                  ))}
                </div>}
                {c.notaUltimaVisita&&<div style={{fontSize:11,color:th.textMuted,marginTop:8,padding:"7px 10px",background:"rgba(255,255,255,0.03)",borderRadius:8,borderLeft:`2px solid ${th.accent}`,fontStyle:"italic"}}>Última visita: "{c.notaUltimaVisita}"</div>}
              </GCard>
            );
          })}
        </>}

        {/* ── REPORTES ── */}
        {mainTab==="reportes"&&<>
          <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
            {[["historial","📅 Historial"],["semana","📊 Semana"],["mes","🗓 Mes"],["metricas","📈 Métricas"]].map(([k,l])=>(
              <button key={k} onClick={()=>setSubTab(k)} style={{padding:"8px 14px",borderRadius:20,border:`1px solid ${subTab===k?th.accent:th.border}`,background:subTab===k?`${th.accent}20`:"transparent",color:subTab===k?th.accent:th.textMuted,cursor:"pointer",fontSize:12,fontWeight:subTab===k?700:400}}>
                {l}
              </button>
            ))}
          </div>

          {subTab==="historial"&&<>
            {history.length===0&&<Empty icon="📅" text="Sin días guardados" th={th}/>}
            {[...history].sort((a,b)=>b.date.localeCompare(a.date)).map(d=>{
              const t=dayTotals(d,prices,cv20,cv12);
              return(
                <GCard key={d.date} th={th} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                    <div>
                      <div style={{fontWeight:600,fontSize:14,color:th.text}}>{labelDate(d.date)}</div>
                      <div style={{fontSize:11,color:th.textMuted}}>{d.ventas?.length||0} ventas · {t.u20>0?`${t.u20}×20L`:""}{t.u12>0?` ${t.u12}×12L`:""}</div>
                      {t.fiado>0&&<div style={{fontSize:11,color:"#F59E0B"}}>📋 Fiados: {fmt(t.fiado)}</div>}
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:18,fontWeight:700,color:th.accent}}>{fmt(t.cobrado)}</div>
                      {t.gastos>0&&<div style={{fontSize:11,color:th.textMuted}}>−{fmt(t.gastos)}</div>}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>{setSelectedDate(d.date);setMainTab("ventas");setSubTab("caja");}} style={{flex:1,padding:"8px",...btnGhost(th),textAlign:"center",fontSize:12,fontWeight:600}}>✏️ Editar</button>
                    <button onClick={()=>buildWADia(d)} style={{flex:1,padding:"8px",background:"rgba(37,211,102,0.1)",border:"1px solid rgba(37,211,102,0.22)",borderRadius:9,color:"#25d366",cursor:"pointer",fontSize:12,fontWeight:600}}>📤 WA</button>
                    <button onClick={()=>askConfirm("¿Eliminar este día?",async()=>{const nh=history.filter(x=>x.date!==d.date);setHistory(nh);await sset("history_v5",nh);setConfirm(null);showToast("🗑️ Eliminado","#ef4444");})} style={{padding:"8px 10px",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.18)",borderRadius:9,color:"#ef4444",cursor:"pointer",fontSize:12}}>🗑️</button>
                  </div>
                </GCard>
              );
            })}
          </>}

          {subTab==="semana"&&<>
            {thisWeek.length===0?<Empty icon="📊" text="Sin datos esta semana" th={th}/>:<>
              <GCard th={th}>
                <SectionTitle th={th}>Cierre semanal</SectionTitle>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                  <StatBox label="Cobrado" value={fmt(cierreSemana.cobrado)} color={th.accent} th={th}/>
                  <StatBox label="Utilidad" value={fmt(cierreSemana.utilidad)} color="#10B981" th={th}/>
                  <StatBox label="20L" value={`${cierreSemana.u20} u.`} color="#8B5CF6" th={th}/>
                  <StatBox label="12L" value={`${cierreSemana.u12} u.`} color="#64748b" th={th}/>
                </div>
                <Row label="Cobrado" value={fmt(cierreSemana.cobrado)} vc={th.accent} th={th}/>
                {cierreSemana.fijosPorCat.map(c=><Row key={c.id} label={`${c.icon} ${c.name}`} value={`${fmt(c.total)} (${fmt(Math.round(c.porBidon))}/u)`} vc={th.accent} th={th}/>)}
                {cierreSemana.gastosOp>0&&<Row label="⚙️ Operativos" value={`−${fmt(cierreSemana.gastosOp)}`} vc="#8B5CF6" th={th}/>}
                {cierreSemana.gastosExt>0&&<Row label="⚠️ Extraordinarios" value={`−${fmt(cierreSemana.gastosExt)}`} vc="#ef4444" th={th}/>}
                {cierreSemana.totalBidones>0&&<><Row label="Costo/bidón" value={fmt(Math.round(cierreSemana.costoXBidon))} vc={th.textMuted} th={th}/><Row label="Precio prom./bidón" value={fmt(Math.round(cierreSemana.precioPromedio))} vc={th.textMuted} th={th}/></>}
                <TotalRow label="✅ Utilidad" value={fmt(cierreSemana.utilidad)} color="#10B981" th={th}/>
              </GCard>
              <button onClick={()=>buildWASemana(thisWeek)} style={{width:"100%",padding:"12px",background:"rgba(37,211,102,0.1)",border:"1px solid rgba(37,211,102,0.22)",borderRadius:12,color:"#25d366",cursor:"pointer",fontWeight:600,fontSize:13,marginTop:8}}>📤 Compartir cierre por WA</button>
              {cierrePrevSem.cobrado>0&&<GCard th={th} style={{marginTop:12}}>
                <SectionTitle th={th}>Semana anterior</SectionTitle>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <StatBox label="Cobrado" value={fmt(cierrePrevSem.cobrado)} color={th.textMuted} th={th}/>
                  <StatBox label="Utilidad" value={fmt(cierrePrevSem.utilidad)} color={th.textMuted} th={th}/>
                </div>
                {cierreSemana.cobrado>0&&<div style={{marginTop:12,padding:"11px",background:cierreSemana.utilidad>=cierrePrevSem.utilidad?"rgba(16,185,129,0.1)":"rgba(239,68,68,0.1)",borderRadius:11,border:`1px solid ${cierreSemana.utilidad>=cierrePrevSem.utilidad?"rgba(16,185,129,0.25)":"rgba(239,68,68,0.25)"}`,textAlign:"center"}}>
                  <div style={{fontSize:11,color:th.textMuted,marginBottom:3}}>Utilidad vs semana anterior</div>
                  <div style={{fontSize:18,fontWeight:700,color:cierreSemana.utilidad>=cierrePrevSem.utilidad?"#10B981":"#ef4444"}}>{cierreSemana.utilidad>=cierrePrevSem.utilidad?"▲":"▼"} {fmt(Math.abs(cierreSemana.utilidad-cierrePrevSem.utilidad))}</div>
                </div>}
              </GCard>}
            </>}
          </>}

          {subTab==="mes"&&<GCard th={th}>
            <SectionTitle th={th}>{new Date(cm+"-15").toLocaleDateString("es-AR",{month:"long",year:"numeric"})}</SectionTitle>
            {thisMonth.length===0?<Empty icon="🗓" text="Sin datos este mes" th={th}/>:<>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                <StatBox label="Total cobrado" value={fmt(monthTotal)} color={th.accent} th={th}/>
                <StatBox label="Días activos" value={thisMonth.length} color="#8B5CF6" th={th}/>
              </div>
              {lastMonthTotal>0&&<div style={{padding:"11px",background:monthTotal>=lastMonthTotal?"rgba(16,185,129,0.1)":"rgba(239,68,68,0.1)",borderRadius:11,border:`1px solid ${monthTotal>=lastMonthTotal?"rgba(16,185,129,0.25)":"rgba(239,68,68,0.25)"}`,textAlign:"center"}}>
                <div style={{fontSize:11,color:th.textMuted,marginBottom:3}}>vs mes anterior ({fmt(lastMonthTotal)})</div>
                <div style={{fontSize:18,fontWeight:700,color:monthTotal>=lastMonthTotal?"#10B981":"#ef4444"}}>{monthTotal>=lastMonthTotal?"▲":"▼"} {fmt(Math.abs(monthTotal-lastMonthTotal))} ({Math.round(Math.abs((monthTotal-lastMonthTotal)/lastMonthTotal)*100)}%)</div>
              </div>}
            </>}
          </GCard>}

          {subTab==="metricas"&&<>
            <GCard th={th} style={{marginBottom:12}}>
              <SectionTitle th={th}>Rentabilidad por producto</SectionTitle>
              {[["20L",prices.p20,cv20],["12L",prices.p12,cv12]].map(([l,p,costos])=>{
                const cT=costoTotal(costos);
                return(
                  <div key={l} style={{padding:12,background:"rgba(255,255,255,0.03)",borderRadius:11,marginBottom:10,border:`1px solid ${th.border}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                      <span style={{fontWeight:600,color:th.text}}>Bidón {l}</span>
                      <span style={{color:"#10B981",fontWeight:700}}>Margen: {fmt(p-cT)}</span>
                    </div>
                    {costos.map(c=><Row key={c.id} label={`• ${c.name}`} value={fmt(c.monto)} vc={th.textMuted} th={th}/>)}
                    <Row label="Costo variable" value={fmt(cT)} vc="#F59E0B" th={th}/>
                    <Row label="Precio venta" value={fmt(p)} vc={th.accent} th={th}/>
                    <PBar pct={((p-cT)/p)*100} a="#10B981" b="#34d399" style={{marginTop:8}}/>
                    <div style={{fontSize:10,color:th.textMuted,marginTop:4}}>{Math.round(((p-cT)/p)*100)}% margen</div>
                  </div>
                );
              })}
            </GCard>
            {clienteRanking.length>0&&<GCard th={th}>
              <SectionTitle th={th}>Top clientes del mes</SectionTitle>
              {clienteRanking.map((c,i)=>(
                <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 11px",marginBottom:6,background:"rgba(255,255,255,0.03)",borderRadius:10}}>
                  <div style={{width:26,height:26,borderRadius:8,background:i===0?"rgba(245,158,11,0.2)":"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:i===0?"#F59E0B":th.textMuted}}>{i+1}</div>
                  <div style={{flex:1,fontSize:13,fontWeight:600,color:th.text}}>{c.nombre}</div>
                  <div style={{fontWeight:700,color:th.accent,fontSize:14}}>{fmt(c.totalMes)}</div>
                </div>
              ))}
            </GCard>}
          </>}
        </>}

        {/* ── CONFIG ── */}
        {mainTab==="config"&&<>
          <GCard th={th} style={{marginBottom:12}}>
            <SectionTitle th={th}>General</SectionTitle>
            <Label th={th}>Nombre de la app</Label>
            <input type="text" value={tmpName} onChange={e=>setTmpName(e.target.value)} style={{...inputStyle(th),marginBottom:10}}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              <div><Label th={th}>Meta diaria $</Label><div style={{position:"relative"}}><span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:th.textMuted}}>$</span><input type="number" value={goalArs} onChange={e=>setGoalArs(parseFloat(e.target.value)||0)} style={{...inputStyle(th),paddingLeft:24}}/></div></div>
              <div><Label th={th}>Alerta gastos %</Label><input type="number" value={alertPct} onChange={e=>setAlertPct(parseFloat(e.target.value)||0)} style={inputStyle(th)}/></div>
            </div>
          </GCard>

          <GCard th={th} style={{marginBottom:12}}>
            <SectionTitle th={th}>Precios</SectionTitle>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><Label th={th}>Bidón 20L</Label><div style={{position:"relative"}}><span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:th.textMuted}}>$</span><input type="number" value={tmpPrices.p20} onChange={e=>setTmpPrices(p=>({...p,p20:parseFloat(e.target.value)||0}))} style={{...inputStyle(th),paddingLeft:24}}/></div></div>
              <div><Label th={th}>Bidón 12L</Label><div style={{position:"relative"}}><span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:th.textMuted}}>$</span><input type="number" value={tmpPrices.p12} onChange={e=>setTmpPrices(p=>({...p,p12:parseFloat(e.target.value)||0}))} style={{...inputStyle(th),paddingLeft:24}}/></div></div>
            </div>
          </GCard>

          <GCard th={th} style={{marginBottom:12}}>
            <SectionTitle th={th}>Separación por sector</SectionTitle>
            {tmpSectors.map((s,i)=>(
              <div key={s.id} style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
                <input type="text" value={s.icon} onChange={e=>{const ns=[...tmpSectors];ns[i]={...ns[i],icon:e.target.value};setTmpSectors(ns);}} style={{...inputStyle(th),width:44,textAlign:"center",padding:"8px"}}/>
                <input type="text" value={s.name} onChange={e=>{const ns=[...tmpSectors];ns[i]={...ns[i],name:e.target.value};setTmpSectors(ns);}} style={{...inputStyle(th),flex:2}}/>
                <div style={{position:"relative",flex:1}}><span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:th.textMuted,fontSize:12}}>$</span><input type="number" value={s.monto} onChange={e=>{const ns=[...tmpSectors];ns[i]={...ns[i],monto:parseFloat(e.target.value)||0};setTmpSectors(ns);}} style={{...inputStyle(th),paddingLeft:22}}/></div>
              </div>
            ))}
          </GCard>

          <GCard th={th} style={{marginBottom:12}}>
            <SectionTitle th={th}>Costos variables — 20L</SectionTitle>
            {tmpCv20.map((c,i)=>(
              <div key={c.id} style={{display:"flex",gap:8,marginBottom:8}}>
                <input type="text" value={c.name} onChange={e=>{const n=[...tmpCv20];n[i]={...n[i],name:e.target.value};setTmpCv20(n);}} style={{...inputStyle(th),flex:2}}/>
                <div style={{position:"relative",flex:1}}><span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:th.textMuted,fontSize:12}}>$</span><input type="number" value={c.monto} onChange={e=>{const n=[...tmpCv20];n[i]={...n[i],monto:parseFloat(e.target.value)||0};setTmpCv20(n);}} style={{...inputStyle(th),paddingLeft:22}}/></div>
              </div>
            ))}
            <SectionTitle th={th} style={{marginTop:12}}>Costos variables — 12L</SectionTitle>
            {tmpCv12.map((c,i)=>(
              <div key={c.id} style={{display:"flex",gap:8,marginBottom:8}}>
                <input type="text" value={c.name} onChange={e=>{const n=[...tmpCv12];n[i]={...n[i],name:e.target.value};setTmpCv12(n);}} style={{...inputStyle(th),flex:2}}/>
                <div style={{position:"relative",flex:1}}><span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:th.textMuted,fontSize:12}}>$</span><input type="number" value={c.monto} onChange={e=>{const n=[...tmpCv12];n[i]={...n[i],monto:parseFloat(e.target.value)||0};setTmpCv12(n);}} style={{...inputStyle(th),paddingLeft:22}}/></div>
              </div>
            ))}
          </GCard>

          <GCard th={th} style={{marginBottom:12}}>
            <SectionTitle th={th}>Categorías costos fijos</SectionTitle>
            {tmpFijosCats.map((c,i)=>(
              <div key={c.id} style={{display:"flex",gap:8,marginBottom:8}}>
                <input type="text" value={c.icon} onChange={e=>{const n=[...tmpFijosCats];n[i]={...n[i],icon:e.target.value};setTmpFijosCats(n);}} style={{...inputStyle(th),width:44,textAlign:"center",padding:"8px"}}/>
                <input type="text" value={c.name} onChange={e=>{const n=[...tmpFijosCats];n[i]={...n[i],name:e.target.value};setTmpFijosCats(n);}} style={{...inputStyle(th),flex:1}}/>
              </div>
            ))}
          </GCard>

          <button onClick={saveCfg} style={{...btnPrimary,marginBottom:12}}>✅ Guardar configuración</button>

          <GCard th={th} style={{marginBottom:12}}>
            <SectionTitle th={th}>Backup</SectionTitle>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <button onClick={exportBackup} style={{padding:"10px",background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.25)",borderRadius:11,color:"#10B981",cursor:"pointer",fontSize:13,fontWeight:600}}>📤 Exportar</button>
              <button onClick={()=>setShowRestore(v=>!v)} style={{padding:"10px",background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.25)",borderRadius:11,color:"#F59E0B",cursor:"pointer",fontSize:13,fontWeight:600}}>📥 Importar</button>
            </div>
            {showRestore&&<><textarea placeholder='Pegá el JSON de backup aquí...' value={restoreText} onChange={e=>setRestoreText(e.target.value)} rows={4} style={{...inputStyle(th),resize:"none",marginTop:10}}/><button onClick={importBackup} style={{...btnPrimary,marginTop:8,background:"linear-gradient(135deg,#F59E0B,#d97706)"}}>✅ Restaurar</button></>}
          </GCard>
        </>}

      </div>

      {/* BOTTOM NAV */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:th.navBg,borderTop:`1px solid ${th.border}`,display:"flex",alignItems:"center",zIndex:200,backdropFilter:"blur(16px)"}}>
        {/* Ruteo como botón central destacado */}
        <button onClick={()=>setMainTab("ruteo")} style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"10px 0",flex:1,border:"none",background:"none",cursor:"pointer",color:mainTab==="ruteo"?th.accent:th.textMuted,borderTop:mainTab==="ruteo"?`2px solid ${th.accent}`:"2px solid transparent",transition:"color 0.15s"}}>
          <span style={{fontSize:20,marginBottom:2}}>🗺</span>
          <span style={{fontSize:10,fontWeight:mainTab==="ruteo"?700:400}}>Ruteo</span>
        </button>
        {NAV_TABS.map(t=>(
          <button key={t.id} onClick={()=>{setMainTab(t.id);if(t.id==="ventas")setSubTab("caja");if(t.id==="reportes")setSubTab("historial");}} style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"10px 0",flex:1,border:"none",background:"none",cursor:"pointer",color:mainTab===t.id?th.accent:th.textMuted,borderTop:mainTab===t.id?`2px solid ${th.accent}`:"2px solid transparent",transition:"color 0.15s"}}>
            <span style={{fontSize:20,marginBottom:2}}>{t.icon}</span>
            <span style={{fontSize:10,fontWeight:mainTab===t.id?700:400}}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
