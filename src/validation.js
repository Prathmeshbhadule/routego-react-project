// Constants, helpers and the validation rules for RouteGo.
export const CITIES = ["Pune", "Mumbai", "Nashik", "Nagpur", "Hyderabad", "Bengaluru"];
export const ROWS = [1, 2, 3, 4, 5, 6];
export const COUPONS = {
  STUDENT10: { pct: 10, label: "10% student discount" },
  FIRST50: { flat: 50, label: "₹50 off your first trip" },
};
export const INIT = { from: "", to: "", date: "", pax: "1", email: "", phone: "", terms: false };

const iso = (d) => d.toISOString().slice(0, 10);
const now = new Date();
export const TODAY = iso(now);
export const MAX = iso(new Date(now.getTime() + 60 * 864e5));

export const fareFor = (a, b) => 250 + 120 * Math.abs(CITIES.indexOf(a) - CITIES.indexOf(b));
export const inr = (n) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
export const hash = (s) => {
  let h = 7;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 100003;
  return h;
};

export function validate(v, seats, pdata) {
  const e = {};
  if (!v.from) e.from = "Choose where you are travelling from.";
  if (!v.to) e.to = "Choose your destination.";
  else if (v.to === v.from) e.to = "Destination must be different from the starting city.";

  if (!v.date) e.date = "Select a travel date.";
  else if (v.date < TODAY) e.date = "Travel date can't be in the past.";
  else if (v.date > MAX) e.date = "Bookings open only 60 days ahead.";

  const need = Number(v.pax);
  if (seats.length !== need) {
    const diff = need - seats.length;
    e.seats = diff > 0
      ? `Select ${diff} more seat${diff > 1 ? "s" : ""} (${need} passenger${need > 1 ? "s" : ""}).`
      : "Too many seats selected.";
  }

  seats.forEach((s) => {
    const p = pdata[s] || {};
    const nm = (p.name || "").trim();
    if (!nm) e["n-" + s] = `Enter passenger name for seat ${s}.`;
    else if (!/^[A-Za-z][A-Za-z .'-]{1,}$/.test(nm)) e["n-" + s] = "Name must be letters only, at least 2 characters.";
    const age = Number(p.age);
    if (p.age === undefined || p.age === "") e["a-" + s] = "Enter age.";
    else if (!Number.isInteger(age) || age < 1 || age > 100) e["a-" + s] = "Age must be a whole number from 1 to 100.";
  });

  if (!v.email.trim()) e.email = "Enter an email for the e-ticket.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) e.email = "Enter a valid email, like name@example.com.";

  if (!v.phone) e.phone = "Enter a mobile number.";
  else if (!/^[6-9]\d{9}$/.test(v.phone))
    e.phone = v.phone.length !== 10 ? `Mobile number needs 10 digits (${v.phone.length} entered).` : "Mobile number must start with 6, 7, 8 or 9.";

  if (!v.terms) e.terms = "Accept the terms to confirm your booking.";
  return e;
}
