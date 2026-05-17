import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import MissingFirebaseConfig from "./components/MissingFirebaseConfig";
import { hasFirebaseEnv } from "./envCheck";
import "./index.css";

const rootEl = document.getElementById("root");

if (!rootEl) {
  throw new Error("Missing #root element");
}

if (!hasFirebaseEnv()) {
  createRoot(rootEl).render(
    <StrictMode>
      <MissingFirebaseConfig />
    </StrictMode>,
  );
} else {
  // Load the app (+ Firebase) only when env is set, so `firebase/config` never throws on import without `.env`.
  void import("./bootstrap").then(({ mountApp }) => {
    mountApp(rootEl);
  });
}
