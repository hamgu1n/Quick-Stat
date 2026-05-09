import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./index.css";
import App from "./App.tsx";
import { WebRProvider } from "./contexts/WebRProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WebRProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </WebRProvider>
  </StrictMode>,  
);
