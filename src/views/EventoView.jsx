import { useMemo, useState } from "react";
import { textoResumen } from "../calc";
import { feedback } from "../feedback";
import { fmt as fmtReal, fmtNum, labelDate, whatsappUrl } from "../utils";
import { Empty, Kpi, Progress, Row, useApp } from "../ui";
import { VentaModal } from "./VentasView";

export default function EventoView({ evento, r, ventas, locked, go }) {
  const { money: fmt, hide } = useApp();
  const [nueva, setNueva] = useState(false);

  // El mensaje de WhatsApp siempre lleva los montos reales; la vista previa respeta "Ocultar montos".
  const fecha = labelDate(evento.fecha);
  const textoReal = useMemo(() => textoResumen(evento, r, fmtReal, fecha), [evento, r, fecha]);
  const textoVista = useMemo(() => (hide ? textoResumen(evento, r, fmt, fecha) : textoReal), [hide, evento, r, fmt, fecha, textoReal]);

  const tone = r.aforo && r.ocupacion >= 1 ? "bad" : r.aforo && r.ocupacion >= 0.9 ? "warn" : "";
  const maxTier = Math.max(1, ...r.porTier.map((t) => t.cantidad));

  return (
    <>
      {locked && <div className="banner info">🔒 <b>Evento cerrado.</b> Solo lectura. Para modificarlo, reabrilo desde la pestaña Eventos.</div>}
      {r.aforo > 0 && r.entradas > r.aforo && <div className="banner bad">⚠️ Vendiste <b>{r.entradas - r.aforo}</b> entradas más que el aforo ({fmtNum(r.aforo)}).</div>}
      {r.aforo > 0 && r.entradas <= r.aforo && r.ocupacion >= 0.9 && <div className="banner warn">🔥 Quedan solo <b>{r.aforo - r.entradas}</b> lugares.</div>}

      <div className="cols">
        <div className="col">
          <div className="card hero">
            <div className="big">{fmtNum(r.entradas)}{r.aforo > 0 && <span> / {fmtNum(r.aforo)}</span>}</div>
            <div className="cap">Entradas vendidas{r.cortesias > 0 ? ` · ${r.cortesias} cortesías` : ""}</div>
            {r.aforo > 0 && <div style={{ marginTop: 14 }}><Progress pct={r.ocupacion * 100} tone={tone} /></div>}
            <div className="small muted" style={{ marginTop: 12 }}>
              🚪 Ingresaron <b style={{ color: "var(--text)" }}>{fmtNum(r.ingresos)}</b>
              {r.faltanIngresar > 0 && <> · faltan ingresar <b style={{ color: "var(--text)" }}>{fmtNum(r.faltanIngresar)}</b></>}
            </div>
          </div>

          {!locked && <button className="btn primary" style={{ marginBottom: 12 }} onClick={() => { feedback.tap(); setNueva(true); }}>🎟️ Registrar venta</button>}

          {r.pendientes > 0 && (
            <div className="card tap" style={{ borderColor: "color-mix(in srgb, var(--warn) 45%, transparent)" }} onClick={() => go("ventas", "cobrar")}>
              <div className="row" style={{ padding: 0 }}>
                <span><b className="warn">{r.pendientes} {r.pendientes === 1 ? "venta con saldo" : "ventas con saldo"}</b><br /><span className="small muted">Tocá para ver y cobrar</span></span>
                <span className="r warn" style={{ fontSize: 22 }}>{fmt(r.porCobrar)}</span>
              </div>
            </div>
          )}

          <div className="kpis">
            <Kpi k="Cobrado" v={fmt(r.cobrado)} s={`de ${fmt(r.facturado)} vendido`} color="var(--ok)" />
            <Kpi k="Por cobrar" v={fmt(r.porCobrar)} s={r.pendientes ? `${r.pendientes} ventas` : "al día"} color={r.porCobrar > 0 ? "var(--warn)" : undefined} />
            <Kpi k="Gastos" v={fmt(r.gastosTotal)} s={`${Object.keys(r.gastosPorCat).length} categorías`} />
            <Kpi k="Neto" v={fmt(r.neto)} s={r.porCobrar > 0 ? `${fmt(r.netoProyectado)} si cobrás todo` : "ganancia"} color={r.neto < 0 ? "var(--bad)" : "var(--accent2)"} />
          </div>

          <div className="card">
            <Row l="💵 Efectivo cobrado" r={fmt(r.efectivo)} />
            <Row l="🏦 Transferencias" r={fmt(r.transferencia)} />
            {r.ticketPromedio > 0 && <Row l="Ticket promedio" r={fmt(r.ticketPromedio)} />}
            {r.anuladas > 0 && <Row l="🚫 Ventas anuladas" r={r.anuladas} />}
            {r.sobrepago > 0 && <Row l="⚠️ Cobrado de más" r={fmt(r.sobrepago)} rc="warn" />}
          </div>
        </div>

        <div className="col">
          <div className="sec">Por tipo de entrada</div>
          {r.porTier.length === 0 ? <Empty icon="🎟️">Sin ventas todavía.</Empty> : (
            <div className="card">
              {r.porTier.map((t) => (
                <div className="bar-row" key={t.id}>
                  <div className="h"><b>{t.nombre}</b><span>{t.cantidad} · {fmt(t.facturado)}</span></div>
                  <Progress pct={(t.cantidad / maxTier) * 100} />
                </div>
              ))}
            </div>
          )}

          <div className="sec">Resumen para WhatsApp</div>
          <div className="card">
            <pre className="resumen" aria-label="Vista previa del resumen">{textoVista}</pre>
            <a className="btn wa" href={whatsappUrl(textoReal)} target="_blank" rel="noopener noreferrer" onClick={() => feedback.tap()}>
              💬 Enviar resumen por WhatsApp
            </a>
            {hide && <div className="tiny muted" style={{ marginTop: 8, textAlign: "center" }}>Los montos están ocultos en pantalla, pero el mensaje se envía con los valores reales.</div>}
          </div>
        </div>
      </div>

      {nueva && <VentaModal evento={evento} ventas={ventas} onClose={() => setNueva(false)} />}
    </>
  );
}
