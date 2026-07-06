import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import "./styles/redesign.css";
import App from "./App.tsx";
import { ToastProvider } from "./hooks/useToast.tsx";
import { ThemeProvider } from "./theme.tsx";
import { Agentation } from "agentation";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </ThemeProvider>
      <Agentation />
    </BrowserRouter>
  </StrictMode>,
);
