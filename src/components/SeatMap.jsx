import { ROWS } from "../validation.js";

// 2 + 2 seat layout. `taken` is a Set of unavailable seats.
export default function SeatMap({ taken, seats, onToggle, error }) {
  const seatBtn = (s) => {
    const isTaken = taken.has(s) && !seats.includes(s);
    return (
      <button
        type="button" key={s} className="seat" disabled={isTaken}
        aria-pressed={seats.includes(s)}
        aria-label={`Seat ${s}${isTaken ? ", booked" : ""}`}
        onClick={() => onToggle(s)}
      >{s}</button>
    );
  };
  return (
    <div id="seats" tabIndex={-1} className={error ? "bad" : ""}>
      <div className="bus">
        {ROWS.map((r) => (
          <div className="srow" key={r}>
            {["A", "B"].map((c) => seatBtn(r + c))}
            <span />
            {["C", "D"].map((c) => seatBtn(r + c))}
          </div>
        ))}
      </div>
      <div className="legend">
        <span><i></i>Available</span>
        <span className="s"><i></i>Selected</span>
        <span><i style={{ opacity: 0.35 }}></i>Booked</span>
      </div>
      {error && <div className="err" role="alert" style={{ textAlign: "center" }}>{error}</div>}
    </div>
  );
}
