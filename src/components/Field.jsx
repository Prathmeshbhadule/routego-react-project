// Reusable labelled form field that shows an error or a hint.
export default function Field({ id, label, error, hint, children }) {
  return (
    <div className={"f " + (error ? "bad" : "")}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? (
        <div className="err" id={id + "-e"} role="alert">{error}</div>
      ) : (
        hint && <div className="hint">{hint}</div>
      )}
    </div>
  );
}
