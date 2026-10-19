import { useState, useMemo } from "react";
import Field from "./components/Field.jsx";
import SeatMap from "./components/SeatMap.jsx";
import { CITIES, ROWS, COUPONS, INIT, TODAY, MAX, fareFor, inr, hash, validate } from "./validation.js";

export default function App() {
  const [v, setV] = useState(INIT);
  const [seats, setSeats] = useState([]);
  const [pdata, setPdata] = useState({});
  const [touched, setTouched] = useState({});
  const [sub, setSub] = useState(false);
  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [cmsg, setCmsg] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [ticket, setTicket] = useState(null);

  const errors = useMemo(() => validate(v, seats, pdata), [v, seats, pdata]);
  const errCount = Object.keys(errors).length;
  const touch = (k) => setTouched((p) => ({ ...p, [k]: true }));
  const err = (k) => (touched[k] || sub ? errors[k] : null);
  const set = (k, val) => setV((p) => ({ ...p, [k]: val }));
  const inp = (k, extra = {}) => ({
    id: k, value: v[k], onBlur: () => touch(k), "aria-invalid": !!err(k),
    "aria-describedby": err(k) ? k + "-e" : undefined,
    onChange: (e) => set(k, e.target.value), ...extra,
  });

  const routeKey = v.from + v.to + v.date;
  const routeOk = v.from && v.to && v.from !== v.to && v.date && v.date >= TODAY && v.date <= MAX;

  // Seats already booked: pseudo-random per route/date + the user's own bookings.
  const taken = useMemo(() => {
    const t = new Set();
    if (!routeOk) return t;
    ROWS.forEach((r) => "ABCD".split("").forEach((c) => { if (hash(routeKey + r + c) % 100 < 28) t.add(r + c); }));
    bookings.forEach((b) => { if (b.key === routeKey) b.seats.forEach((s) => t.add(s)); });
    return t;
  }, [routeKey, routeOk, bookings]);

  const changeRoute = (k, val) => { set(k, val); setSeats([]); setCoupon(null); setCmsg(null); };
  const changePax = (val) => { set("pax", val); setSeats((s) => s.slice(0, Number(val))); };
  const toggle = (s) => {
    touch("seats");
    setSeats((cur) => cur.includes(s) ? cur.filter((x) => x !== s) : cur.length >= Number(v.pax) ? cur : [...cur, s].sort());
  };
  const pset = (s, k, val) => setPdata((p) => ({ ...p, [s]: { ...p[s], [k]: val } }));

  const fare = routeOk ? fareFor(v.from, v.to) : 0;
  const subtotal = fare * seats.length;
  const disc = coupon ? (coupon.pct ? Math.round((subtotal * coupon.pct) / 100) : Math.min(coupon.flat, subtotal)) : 0;
  const gst = Math.round((subtotal - disc) * 0.05 * 100) / 100;
  const total = subtotal - disc + gst;

  function applyCoupon() {
    const c = code.trim().toUpperCase();
    if (!c) return setCmsg({ ok: false, t: "Enter a coupon code first." });
    if (!seats.length) return setCmsg({ ok: false, t: "Select your seats before applying a coupon." });
    if (COUPONS[c]) { setCoupon(COUPONS[c]); setCmsg({ ok: true, t: COUPONS[c].label + " applied." }); }
    else { setCoupon(null); setCmsg({ ok: false, t: `"${c}" is not a valid coupon. Try STUDENT10 or FIRST50.` }); }
  }

  function submit(e) {
    e.preventDefault();
    setSub(true);
    const keys = Object.keys(errors);
    if (keys.length) { document.getElementById(keys[0])?.focus(); return; }
    const b = {
      id: "RG" + Math.floor(100000 + Math.random() * 900000), key: routeKey, from: v.from, to: v.to,
      date: v.date, seats: [...seats], names: seats.map((s) => pdata[s].name.trim()), total, email: v.email.trim(),
    };
    setBookings((p) => [b, ...p]);
    setTicket(b);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() {
    setV(INIT); setSeats([]); setPdata({}); setTouched({}); setSub(false);
    setCode(""); setCoupon(null); setCmsg(null); setTicket(null);
  }

  const cityOptions = CITIES.map((c) => <option key={c}>{c}</option>);

  return (
    <div>
      <header className="nav"><div className="nav-in">
        <div className="brand">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="3" /><path d="M3 11h18M7 20v-4M17 20v-4" /></svg>
          RouteGo
        </div>
        <span className="tag">Intercity bus booking</span>
      </div></header>

      <section className="hero"><div className="hero-in">
        <h1>Book your seat in under a minute</h1>
        <p>Pick a route, choose your seats on the live seat map and get an instant e-ticket. Every field is checked as you go.</p>
      </div></section>

      <div className="wrap">
        {ticket && (
          <div className="ticket" role="status">
            <h2>Booking confirmed ✓</h2>
            <div className="big">{ticket.id}</div>
            <p style={{ margin: "6px 0" }}><b>{ticket.from} → {ticket.to}</b> on {ticket.date}</p>
            <p style={{ margin: "6px 0" }}>Seats {ticket.seats.join(", ")} for {ticket.names.join(", ")}. Total paid {inr(ticket.total)}.</p>
            <p className="mute">E-ticket sent to {ticket.email}.</p>
            <button className="btn sm" style={{ marginTop: 12 }} onClick={reset}>Book another trip</button>
          </div>
        )}

        <form className="grid" onSubmit={submit} noValidate>
          <div>
            {sub && errCount > 0 && <div className="summary" role="alert">Please fix {errCount} issue{errCount > 1 ? "s" : ""} below before confirming.</div>}

            <div className="card">
              <h2><span className="n">1</span>Trip details</h2>
              <div className="row">
                <Field id="from" label="From" error={err("from")}>
                  <select {...inp("from", { onChange: (e) => changeRoute("from", e.target.value) })}><option value="">Select city</option>{cityOptions}</select>
                </Field>
                <Field id="to" label="To" error={err("to")}>
                  <select {...inp("to", { onChange: (e) => changeRoute("to", e.target.value) })}><option value="">Select city</option>{cityOptions}</select>
                </Field>
                <Field id="date" label="Travel date" error={err("date")}>
                  <input type="date" min={TODAY} max={MAX} {...inp("date", { onChange: (e) => changeRoute("date", e.target.value) })} />
                </Field>
                <Field id="pax" label="Passengers" hint="Up to 4 per booking">
                  <select id="pax" value={v.pax} onChange={(e) => changePax(e.target.value)}>{[1, 2, 3, 4].map((n) => <option key={n}>{n}</option>)}</select>
                </Field>
              </div>
            </div>

            <div className="card">
              <h2><span className="n">2</span>Choose seats</h2>
              {routeOk
                ? <SeatMap taken={taken} seats={seats} onToggle={toggle} error={err("seats")} />
                : <p className="mute">Select a valid route and date to see available seats.</p>}
            </div>

            {seats.length > 0 && (
              <div className="card">
                <h2><span className="n">3</span>Passenger details</h2>
                {seats.map((s) => (
                  <div className="row" key={s}>
                    <Field id={"n-" + s} label={`Seat ${s} – full name`} error={err("n-" + s)}>
                      <input type="text" id={"n-" + s} value={pdata[s]?.name || ""} onChange={(e) => pset(s, "name", e.target.value)} onBlur={() => touch("n-" + s)} aria-invalid={!!err("n-" + s)} />
                    </Field>
                    <Field id={"a-" + s} label="Age" error={err("a-" + s)}>
                      <input type="number" id={"a-" + s} value={pdata[s]?.age || ""} onChange={(e) => pset(s, "age", e.target.value)} onBlur={() => touch("a-" + s)} aria-invalid={!!err("a-" + s)} />
                    </Field>
                  </div>
                ))}
              </div>
            )}

            <div className="card">
              <h2><span className="n">{seats.length ? 4 : 3}</span>Contact details</h2>
              <div className="row">
                <Field id="email" label="Email" error={err("email")}>
                  <input type="email" autoComplete="email" {...inp("email")} />
                </Field>
                <Field id="phone" label="Mobile number" error={err("phone")} hint={`${v.phone.length}/10 digits`}>
                  <input type="tel" inputMode="numeric" maxLength={10} {...inp("phone", { onChange: (e) => set("phone", e.target.value.replace(/\D/g, "")) })} />
                </Field>
              </div>
            </div>
          </div>

          <aside className="sticky">
            <div className="card">
              <h2>Fare summary</h2>
              {routeOk ? (
                <div className="sum">
                  <div><span>{v.from} → {v.to}</span><span>{inr(fare)} / seat</span></div>
                  <div><span>Seats ({seats.length})</span><span>{inr(subtotal)}</span></div>
                  {disc > 0 && <div className="ok"><span>Discount</span><span>− {inr(disc)}</span></div>}
                  <div><span>GST (5%)</span><span>{inr(gst)}</span></div>
                  <div className="t"><span>Total</span><span>{inr(total)}</span></div>
                </div>
              ) : <p className="mute">Fare appears once you choose a route and date.</p>}

              <div className="f" style={{ marginTop: 16 }}>
                <label htmlFor="code">Coupon code</label>
                <div className="cp">
                  <input id="code" value={code} placeholder="STUDENT10" onChange={(e) => setCode(e.target.value)} />
                  <button type="button" className="btn sm" onClick={applyCoupon}>Apply</button>
                </div>
                {cmsg && <div className={"cpmsg " + (cmsg.ok ? "ok" : "no")} role="status">{cmsg.t}</div>}
              </div>

              <div className={"f " + (err("terms") ? "bad" : "")}>
                <label className="chk">
                  <input type="checkbox" id="terms" checked={v.terms} onChange={(e) => { set("terms", e.target.checked); touch("terms"); }} />
                  <span>I agree to the cancellation policy and terms of travel.</span>
                </label>
                {err("terms") && <div className="err" role="alert">{err("terms")}</div>}
              </div>
              <button className="btn" type="submit">Confirm booking{seats.length ? " · " + inr(total) : ""}</button>
            </div>

            <div className="card">
              <h2>My bookings ({bookings.length})</h2>
              {bookings.length === 0 ? <p className="mute">No bookings yet.</p> : bookings.map((b) => (
                <div className="bk" key={b.id}>
                  <span><b>{b.id}</b><br />{b.from} → {b.to}, {b.date}<br />Seats {b.seats.join(", ")}</span>
                  <button type="button" className="x" onClick={() => setBookings((p) => p.filter((x) => x.id !== b.id))}>Cancel</button>
                </div>
              ))}
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}
