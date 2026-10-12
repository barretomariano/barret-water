import { render, screen, within, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { __reset, __tree } from "./data";

jest.mock("./data");
jest.mock("./notifications");

const nav = () => within(screen.getByRole("navigation"));
const goTab = (u, name) => u.click(nav().getByRole("button", { name: new RegExp(name) }));
const text = (t) => screen.getAllByText((_, el) => el.textContent === t && !el.querySelector("*:not(br)")).length > 0;

beforeEach(() => { __reset(); localStorage.clear(); window.scrollTo = jest.fn(); });

async function crearEvento(u) {
  await u.click(await screen.findByRole("button", { name: "Crear mi primer evento" }));
  await u.type(screen.getByPlaceholderText(/Noche de Bachata/), "Noche Bachata");
  const precios = screen.getAllByPlaceholderText("$ precio");
  await u.type(precios[0], "8000");   // Anticipada
  await u.type(precios[1], "10000");  // Puerta
  await u.type(screen.getByPlaceholderText("0"), "100"); // aforo
  await u.click(screen.getByRole("button", { name: "+ Agregar socio" }));
  await u.click(screen.getByRole("button", { name: "+ Agregar socio" }));
  const nombres = screen.getAllByPlaceholderText("Socio / destino");
  const pcts = screen.getAllByPlaceholderText("%");
  await u.type(nombres[0], "Socio A"); await u.type(pcts[0], "60");
  await u.type(nombres[1], "Socio B"); await u.type(pcts[1], "40");
  await u.click(screen.getByRole("button", { name: "Crear evento" }));
}

test("flujo completo de una noche: venta con pago parcial, cobro posterior, puerta, gasto, reparto y cierre", async () => {
  const u = userEvent.setup();
  render(<App />);

  // 1) Estado inicial vacío y creación del evento
  expect(await screen.findByText(/Todavía no creaste ningún evento/)).toBeInTheDocument();
  await crearEvento(u);
  expect(await screen.findByRole("heading", { name: "Noche Bachata" })).toBeInTheDocument();
  expect(document.querySelector(".app").dataset.theme).toBe("bachata");

  // 2) Venta: 2 anticipadas, precio de lista 16.000, paga 6.000 en efectivo
  await goTab(u, "Ventas");
  await u.click(screen.getByRole("button", { name: "Nueva venta" }));
  await u.click(screen.getByRole("button", { name: "Más" }));
  expect(screen.getByDisplayValue("$ 16.000")).toBeInTheDocument();
  await u.click(screen.getByRole("button", { name: "Pago parcial" }));
  await u.type(screen.getAllByPlaceholderText("$ 0")[1], "6000"); // [0]=total, [1]=pago parcial
  await u.type(screen.getByPlaceholderText("Quién vendió"), "Juli");
  await u.click(screen.getByRole("button", { name: /Registrar venta/ }));
  expect(await screen.findByText("2× Anticipada")).toBeInTheDocument();
  expect(screen.getByText("Parcial")).toBeInTheDocument();
  expect(screen.getByText(/falta \$10\.000/)).toBeInTheDocument();

  // 3) Cobro del saldo desde el detalle
  await u.click(screen.getByText("2× Anticipada"));
  await u.click(await screen.findByRole("button", { name: "Cobrar $10.000" }));
  await waitFor(() => expect(screen.getAllByText("Pagada").length).toBeGreaterThan(0));
  await u.click(screen.getByRole("button", { name: "Cerrar" }));

  // 4) Segunda venta con monto manual distinto al de lista y sin pago
  await u.click(screen.getByRole("button", { name: "Nueva venta" }));
  await u.click(screen.getByRole("button", { name: /^Puerta/ }));
  const total = screen.getByDisplayValue("$ 10.000");
  await u.clear(total); await u.type(total, "12000");
  expect(screen.getByText(/Precio de lista: \$10\.000/)).toBeInTheDocument();
  await u.click(screen.getByRole("button", { name: "Aún nada" }));
  await u.click(screen.getByRole("button", { name: /Registrar venta/ }));
  expect(await screen.findByText("Sin pagar")).toBeInTheDocument();
  expect(nav().getByText("1")).toBeInTheDocument(); // insignia: 1 venta con saldo

  // 5) Resumen
  await goTab(u, "Resumen");
  expect(text("3")).toBe(true); // entradas vendidas
  expect(screen.getByText("de $28.000 vendido")).toBeInTheDocument();
  expect(screen.getByText("1 ventas")).toBeInTheDocument();

  // 6) Puerta: +1 x3, −1 x1
  await goTab(u, "Puerta");
  for (let i = 0; i < 3; i++) await u.click(screen.getByRole("button", { name: "Sumar una persona" }));
  await u.click(screen.getByRole("button", { name: "Restar una persona" }));
  await waitFor(() => expect(document.querySelector(".door-count").textContent).toBe("2"));
  expect(screen.getByText(/Faltan ingresar 1 entradas/)).toBeInTheDocument();

  // 7) Caja: gasto en efectivo de 5.000 → neto 11.000, reparto 6.600 / 4.400
  await goTab(u, "Caja");
  await u.click(screen.getByRole("button", { name: "+ Agregar" }));
  await u.type(screen.getByPlaceholderText("$ 0"), "5000");
  await u.click(screen.getByRole("button", { name: /Registrar gasto/ }));
  expect(await screen.findByText("$6.600")).toBeInTheDocument();
  expect(screen.getByText("$4.400")).toBeInTheDocument();
  expect(screen.getByText(/🧾 Juli/)).toBeInTheDocument();             // rendición por vendedor
  expect(screen.getByText(/💵 \$16\.000 efectivo/)).toBeInTheDocument(); // lo que Juli cobró en efectivo
  expect(screen.getAllByText("$11.000").length).toBeGreaterThan(0);      // neto = 16.000 cobrado − 5.000 gastos

  // 8) Cerrar el evento → todo queda en solo lectura
  await goTab(u, "Eventos");
  await u.click(screen.getByRole("button", { name: "Más opciones" }));
  await u.click(screen.getByRole("button", { name: /Cerrar evento/ }));
  await u.click(screen.getAllByRole("button", { name: "Cerrar evento" }).pop());
  await waitFor(() => expect(Object.values(__tree().eventos)[0].estado).toBe("cerrado"));
  await goTab(u, "Ventas");
  expect(screen.queryByRole("button", { name: "Nueva venta" })).not.toBeInTheDocument();
  await goTab(u, "Puerta");
  expect(screen.getByText(/contador está bloqueado/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Sumar una persona" })).toBeDisabled();
});

test("no permite registrar una venta sin monto ni un cobro mayor al saldo", async () => {
  const u = userEvent.setup();
  render(<App />);
  await crearEvento(u);
  await goTab(u, "Ventas");

  // Tipo sin precio fijo ("Cortesía" sí es válida; probamos un tipo pago con monto vacío)
  await u.click(screen.getByRole("button", { name: "Nueva venta" }));
  await u.clear(screen.getByDisplayValue("$ 8.000"));
  await u.click(screen.getByRole("button", { name: /Registrar venta/ }));
  expect(await screen.findByText("Ingresá el monto de la venta")).toBeInTheDocument();
  expect(Object.keys(__tree().ventas || {})).toHaveLength(0);

  await u.type(screen.getByPlaceholderText("$ 0"), "8000");
  await u.click(screen.getByRole("button", { name: "Pago parcial" }));
  await u.type(screen.getAllByPlaceholderText("$ 0")[1], "3000");
  await u.click(screen.getByRole("button", { name: /Registrar venta/ }));
  await u.click(await screen.findByText("1× Anticipada"));

  const monto = await screen.findByDisplayValue("$ 5.000");
  await u.clear(monto); await u.type(monto, "9000");
  await u.click(screen.getByRole("button", { name: "Cobrar $9.000" }));
  expect(await screen.findByText(/Supera el saldo/)).toBeInTheDocument();
});

test("anular una venta la excluye del conteo y restaurarla la vuelve a sumar", async () => {
  const u = userEvent.setup();
  render(<App />);
  await crearEvento(u);
  await goTab(u, "Ventas");
  await u.click(screen.getByRole("button", { name: "Nueva venta" }));
  await u.click(screen.getByRole("button", { name: /Registrar venta/ }));
  await u.click(await screen.findByText("1× Anticipada"));
  await u.click(await screen.findByRole("button", { name: /Anular/ }));
  await u.click(screen.getAllByRole("button", { name: "Anular" }).pop());
  await goTab(u, "Resumen");
  expect(text("0")).toBe(true);
  await goTab(u, "Ventas");
  await u.click(screen.getByRole("button", { name: "Anuladas" }));
  await u.click(await screen.findByText("1× Anticipada"));
  await u.click(await screen.findByRole("button", { name: /Restaurar/ }));
  await goTab(u, "Resumen");
  await waitFor(() => expect(text("1")).toBe(true));
});
