import "./css/Loader.css";

interface LoaderProps {
  label?: string;
  hint?: string;
}

export function Loader({ label = "Loading" }: LoaderProps) {
  const blades = Array.from({ length: 12 });

  return (
    <div
      className="loader-wrapper"
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div className="loader-card">
        <div className="spinner" aria-hidden="true">
          {blades.map((_, index) => (
            <div key={index} className="spinner-blade" />
          ))}
        </div>
        <p className="loader-label">{label}</p>
        {/* <p className="loader-hint">{hint}</p> */}
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

export default Loader;
