import { init } from "@southpay/js";
import { type CSSProperties, type ReactNode, useEffect, useState } from "react";
import { SouthpayCheckout } from "./SouthpayCheckout";

const PUBLISHABLE_KEY = import.meta.env.VITE_SOUTHPAY_PUBLISHABLE_KEY;

export function App() {
  const [ready, setReady] = useState(false);
  const [showInline, setShowInline] = useState(false);
  const [reference, setReference] = useState("");
  const [mountedReference, setMountedReference] = useState<string | null>(null);

  useEffect(() => {
    if (!PUBLISHABLE_KEY) return;
    init({ publishableKey: PUBLISHABLE_KEY });
    setReady(true);
  }, []);

  if (!PUBLISHABLE_KEY) {
    return (
      <Shell>
        <p>
          Set <code>VITE_SOUTHPAY_PUBLISHABLE_KEY</code> in <code>.env</code> to a publishable key
          (<code>sp_pk_test_...</code>).
        </p>
      </Shell>
    );
  }

  if (!ready) return <Shell>{null}</Shell>;

  return (
    <Shell>
      <section style={section}>
        <h2 style={h2}>Inline checkout</h2>
        {showInline ? (
          <SouthpayCheckout
            amount={1000}
            currency="EUR"
            onCompleted={(event) => console.log("completed", event)}
            onExpired={() => setShowInline(false)}
          />
        ) : (
          <button type="button" style={button} onClick={() => setShowInline(true)}>
            Show inline checkout
          </button>
        )}
      </section>

      <section style={section}>
        <h2 style={h2}>Mount a server-created checkout</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            style={input}
            placeholder="Payment reference"
            value={reference}
            onChange={(event) => setReference(event.target.value)}
          />
          <button
            type="button"
            style={button}
            disabled={!reference.trim()}
            onClick={() => setMountedReference(reference.trim())}
          >
            Mount
          </button>
        </div>
        {mountedReference ? (
          <div style={{ marginTop: 16 }}>
            <SouthpayCheckout
              key={mountedReference}
              reference={mountedReference}
              onCompleted={(event) => {
                if (event.successUrl) window.location.assign(event.successUrl);
              }}
            />
          </div>
        ) : null}
      </section>
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        maxWidth: 560,
        margin: "48px auto",
        padding: "0 16px",
        color: "#0f172a",
      }}
    >
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>@southpay/js React example</h1>
      {children}
    </main>
  );
}

const section: CSSProperties = { marginTop: 28, paddingTop: 20, borderTop: "1px solid #e2e8f0" };
const h2: CSSProperties = { fontSize: 16, margin: "0 0 8px" };
const button: CSSProperties = {
  padding: "8px 14px",
  borderRadius: 8,
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#fff",
  cursor: "pointer",
};
const input: CSSProperties = {
  flex: 1,
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
};
